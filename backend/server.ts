import bcrypt from 'bcryptjs'
import { supabase } from './supabase.ts'
import { Database } from './supabasetype.ts'
import {
  tokenize,
  rollDice,
  tallyRolls,
  calculateFinalResult
} from '@airjp73/dice-notation'
import { loadState, scheduleSave } from './state.ts'

const INACTIVE_MINUTES = 30
const fixedSalt = "$2a$10$IKzllnUoRdQkZscoft21rJ8QkCUJSDO"

const DEFAULT_TRUMP = [
  "ハートのA",
  "ハートの2",
  "ハートの3",
  "ハートの4",
  "ハートの5",
  "ハートの6",
  "ハートの7",
  "ハートの8",
  "ハートの9",
  "ハートの10",
  "ハートのJ",
  "ハートのQ",
  "ハートのK",
  "クラブのA",
  "クラブの2",
  "クラブの3",
  "クラブの4",
  "クラブの5",
  "クラブの6",
  "クラブの7",
  "クラブの8",
  "クラブの9",
  "クラブの10",
  "クラブのJ",
  "クラブのQ",
  "クラブのK",
  "スペードのA",
  "スペードの2",
  "スペードの3",
  "スペードの4",
  "スペードの5",
  "スペードの6",
  "スペードの7",
  "スペードの8",
  "スペードの9",
  "スペードの10",
  "スペードのJ",
  "スペードのQ",
  "スペードのK",
  "ダイヤのA",
  "ダイヤの2",
  "ダイヤの3",
  "ダイヤの4",
  "ダイヤの5",
  "ダイヤの6",
  "ダイヤの7",
  "ダイヤの8",
  "ダイヤの9",
  "ダイヤの10",
  "ダイヤのJ",
  "ダイヤのQ",
  "ダイヤのK",
  "ジョーカー",
]

// ルーム別に WebSocket を管理: roomId → Set<WebSocket>
const roomClients = new Map<number, Set<WebSocket>>();
// 切断時のクリーンアップ用逆引きマップ: socket → roomId
const socketRoom = new Map<WebSocket, number>();

type Variable = {
  [key: string]: number
}

type RoomOption = {
  private: boolean
  auto_all_clear: boolean
  use_trump: boolean
  user_limit: number
  all_clear: string
  variables: string[]
}

type Message = Database["public"]["Tables"]["Messages"]["Row"]
type SendMessage = Database["public"]["Tables"]["Messages"]["Insert"]
type User = Database["public"]["Tables"]["Users"]["Row"]
type EnterRoomResponse = {
  success: boolean;
  reason: string;
  id: string;
}
type changeVariable = {
  op: string;
  key: string;
  value: number;
}
type dice = {
  command: string;
}
type card = {
  name: string;
  command: string;
}

type Packet<T> = {
  type: T extends Message
  ? "message"
  : T extends SendMessage
  ? "message"
  : T extends User
  ? "enterRoom" | "exitRoom"
  : T extends EnterRoomResponse
  ? "EnterRoomResponse"
  : T extends changeVariable
  ? "changeVariable"
  : T extends dice
  ? "dice"
  : T extends card
  ? "card"
  : "error"
  room_id: number,
  data: T
}

const roll = (command: string) => {
  try {
    let isDiceRoll = false
    const tokens = tokenize(command)
    const ops: string[] = []
    const consts: string[] = []
    tokens.forEach(token => {
      if (token.type === 'DiceRoll') {
        if (token.detailType === '_SimpleDieRoll') {
          isDiceRoll = true
          if (token.detail.count > 20 || token.detail.numSides > 10000) {
            throw new Error('too big dice')
          }
        } else if (token.detailType === '_Constant') {
          consts.push(token.detail)
        }
      } else if (token.type === 'Operator') {
        ops.push(token.operator)
      }
    })
    if (!isDiceRoll) return null
    const rolls = rollDice(tokens)
    const rollTotals = tallyRolls(tokens, rolls)
    const result = calculateFinalResult(tokens, rollTotals)

    let i = 0
    let j = 0
    const elements = []
    rolls.forEach(roll => {
      elements.push(
        roll == null
          ? ops[i++]
          : roll.length > 0
            ? `(${roll.join(' + ')})`
            : consts[j++]
      )
    })
    elements.push('=')
    elements.push(result)

    return elements.join(' ')
  } catch (_error) {
    return null
  }
}

const resetDeck = async (roomId: number, username: string) => {
  const current = await supabase.from("Cards").select('*').match({ 'type': 'trump', 'room_id': roomId })
  if (current.data && current.data[0]) {
    await supabase.from("Cards").upsert({
      id: current.data[0].id,
      room_id: roomId,
      type: current.data[0].type,
      remaining: DEFAULT_TRUMP
    })
  } else {
    await supabase.from("Cards").upsert({
      room_id: roomId,
      type: 'trump',
      remaining: DEFAULT_TRUMP
    })
  }
  await broadcastMessage({
    color: 0,
    name: "system",
    room_id: roomId,
    system: true,
    text: `${username}さんが山札をリセットしました。`,
    created_at: new Date().toISOString(),
  })
}

const drawCard = async (roomId: number, username: string) => {
  const current = await supabase.from("Cards").select('*').match({ 'type': 'trump', 'room_id': roomId })
  if (current.data && current.data[0]) {
    const remaining = current.data[0].remaining || []
    if (!remaining.length) {
      await broadcastMessage({
        color: 0,
        name: "system",
        room_id: roomId,
        system: true,
        text: `山札がありません。`,
        created_at: new Date().toISOString(),
      })
      return null
    }
    const idx = Math.floor(Math.random() * remaining.length)
    const drawn = remaining[idx]
    const new_remaining = remaining.filter((_e, i) => i != idx)
    await supabase.from("Cards").upsert({
      id: current.data[0].id,
      room_id: current.data[0].room_id,
      type: current.data[0].type,
      remaining: new_remaining
    })
    await broadcastMessage({
      color: 0,
      name: "system",
      room_id: roomId,
      system: true,
      text: `${username}さんが${drawn}をドローしました。(残り${new_remaining.length}枚)`,
      created_at: new Date().toISOString(),
    })
    return {
      drawn: drawn,
      remaining: new_remaining
    }
  }
  await broadcastMessage({
    color: 0,
    name: "system",
    room_id: roomId,
    system: true,
    text: `山札がありません。`,
    created_at: new Date().toISOString(),
  })
}

async function broadcastMessage(message: SendMessage) {
  const sendPacket: Packet<SendMessage> = {
    type: "message",
    room_id: message.room_id || 0,
    data: message
  }
  const sockets = roomClients.get(message.room_id || 0) || new Set()
  for (const client of sockets) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(sendPacket))
    }
  }
  // ダイスロール判定はinsert前に行い、insertと並行してbroadcastしない
  let diceResult: string | null = null
  if (!message.system && message.text) {
    diceResult = roll(message.text)
  }
  await supabase.from('Messages').insert(message)
  if (diceResult) {
    await broadcastMessage({
      color: 0,
      name: "system",
      room_id: message.room_id,
      system: true,
      text: `ダイスロール : ${message.text} > ${diceResult}`,
      created_at: new Date().toISOString(),
    })
  }
}

type PostParams = {
  action: string
  user: User
  // isEnteredRoom
  roomId: number
  userId: string
}

type RoomInfo = Omit<Database["public"]["Tables"]["Rooms"]["Row"], 'password' | 'owner'>

const getRoomInfo = async (roomId: number): Promise<RoomInfo | null> => {
  const res = await fetch(`https://rtchat.0am.jp/storage/v1/object/public/rooms/${roomId}.json`, {
    method: 'GET',
    cache: 'no-store'
  })
  if (res.ok) {
    const info = await new Response(res.body).json()
    if (info) return info
  }
  return null
}

// 起動時にファイルから状態を復元する（top-level await）
const { users } = await loadState()

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// updateRoomList のデバウンス: 3秒以内の連続入室は1回のみ実行
let updateRoomListTimer: ReturnType<typeof setTimeout> | null = null
const debouncedUpdateRoomList = () => {
  if (updateRoomListTimer) clearTimeout(updateRoomListTimer)
  updateRoomListTimer = setTimeout(() => {
    supabase.functions.invoke('updateRoomList')
    updateRoomListTimer = null
  }, 3000)
}

const allClear = async (roomId: number) => {
  await supabase.from("RoomData").upsert({
    id: roomId,
    all_clear_at: new Date().toISOString()
  })
  await broadcastMessage({
    color: 0,
    name: "system",
    room_id: roomId,
    system: true,
    text: `ルームログが消去されました。`
  })
}

const postHandler = async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown"
  const data = await req.json() as PostParams
  let res: string = "{}"
  if (data.action === 'isEnteredRoom') {
    const user = users.get(data.roomId)?.get(data.userId)
    if (user) {
      res = JSON.stringify({
        username: user.name,
        entered: true,
        id: user.id,
        color: user.color
      })
    }
  } else if (data.action === 'updateUser') {
    if (users.get(data.roomId)?.get(data.user.id)) {
      data.user.last_activity = new Date().toISOString()
      data.user.room_id = data.roomId
      users.get(data.roomId)?.set(data.user.id, data.user)
    }
  } else if (data.action === 'getUsers') {
    const usersInRoom = users.get(data.roomId)?.values()
    res = JSON.stringify({
      users: Array.from(usersInRoom || [])
    })
  } else if (data.action === 'enterRoom') {
    res = JSON.stringify({ success: false, id: null, reason: '入室できませんでした。' })
    if (data.user.room_id) {
      if (!users.get(data.user.room_id)) users.set(data.user.room_id, new Map<string, User>)
      if (!data.user.id) {
        data.user.id = bcrypt.hashSync(ip, fixedSalt)
      }
      if (users.get(data.user.room_id)?.get(data.user.id)) {
        res = JSON.stringify({ success: false, id: null, reason: 'すでに入室しています。' })
      } else {
        const roomInfo = await getRoomInfo(data.user.room_id)
        const limit = roomInfo ? (roomInfo.options as RoomOption).user_limit : 10
        const currentUsersInRoom = users.get(data.user.room_id)?.size || 0
        if (currentUsersInRoom >= limit) {
          res = JSON.stringify({ success: false, id: null, reason: 'これ以上入室できません。' })
        } else {
          data.user.last_activity = new Date().toISOString()
          users.get(data.user.room_id)?.set(data.user.id, data.user)
          scheduleSave(users)
          res = JSON.stringify({ success: true, id: data.user.id, reason: 'OK' })
          await broadcastMessage({
            name: 'system',
            room_id: data.user.room_id,
            system: true,
            text: `${data.user.name}さんが入室しました。`
          })
          await supabase.from("Rooms").update({ last_enter: new Date().toISOString() }).eq('id', data.user.room_id)
          debouncedUpdateRoomList()
        }
      }
    }
  } else if (data.action === 'exitRoom') {
    if (users.get(data.roomId)) {
      const user = users.get(data.roomId)?.get(data.userId)
      users.get(data.roomId)?.delete(data.userId)
      scheduleSave(users)
      if (user) {
        await broadcastMessage({
          name: 'system',
          room_id: data.roomId,
          system: true,
          text: `${user.name}さんが退室しました。`
        })
      }
    }
    const currentUsersInRoom = users.get(data.roomId)?.size
    if (currentUsersInRoom === 0) {
      // auto_all_clear オプションが有効な場合のみ全消去
      const roomInfo = await getRoomInfo(data.roomId)
      const opt = roomInfo ? (roomInfo.options as RoomOption) : null
      if (opt && opt.auto_all_clear) {
        await allClear(data.roomId)
      }
    }
  }
  return new Response(res, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    },
    status: 200
  })
}

const removeInactiveUser = async () => {
  const tenMinutesAgo = new Date()
  tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - INACTIVE_MINUTES)
  tenMinutesAgo.toISOString()
  const deleted: User[] = []
  for (const [roomId, roomUsers] of users) {
    for (const [userId, user] of roomUsers) {
      if (new Date(user.last_activity || 0) < tenMinutesAgo) {
        deleted.push(user)
        users.get(roomId)?.delete(userId)
        await broadcastMessage({
          color: 0,
          name: "system",
          room_id: roomId,
          system: true,
          text: `${user.name}さんが非アクティブのため退室しました。`,
          created_at: new Date().toISOString(),
        })
      }
    }
  }
  if (deleted.length > 0) scheduleSave(users)
  return deleted
}


Deno.serve(
  { port: 8001 },
  async (req: Request) => {
    const url = new URL(req.url, `http://${req.headers.get("host")}`);
    const roomId = parseInt(url.searchParams.get("roomId") || "0");

    // WebSocket ハンドシェイクを試みる
    if (req.headers.get("upgrade") !== "websocket") {
      if (req.method === "POST") {
        return await postHandler(req)
      }
      if (req.method === "GET") {
        let userList: User[] = []
        users.keys().forEach((roomId) => {
          const roomUsers = users.get(roomId)
          if (roomUsers) {
            roomUsers.forEach((user) => {
              userList.push(user)
            })
          }
        })
        const body = JSON.stringify({ users: userList })
        return new Response(body, {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 200
        })
      }
      return new Response("Request is not a WebSocket", { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      if (!roomClients.has(roomId)) roomClients.set(roomId, new Set())
      roomClients.get(roomId)!.add(socket)
      socketRoom.set(socket, roomId)
    };

    socket.onmessage = async (event) => {
      // JSON.parse は1回だけ実行する
      let parsed: Packet<any>
      try {
        parsed = JSON.parse(event.data)
      } catch (_e) {
        console.error('[ws] invalid JSON:', event.data)
        return
      }
      const type = parsed.type

      if (type === "message") {
        const packet = parsed as Packet<Message>
        packet.data.created_at = new Date().toISOString()
        await broadcastMessage(packet.data)
      } else if (type === "enterRoom") {
        const packet = parsed as Packet<User>
        const result = await supabase.functions.invoke('database-access', {
          body: {
            action: 'enterRoom',
            roomId: packet.data.room_id,
            color: packet.data.color,
            username: packet.data.name,
            userId: packet.data.id ? packet.data.id : null,
          },
        })
        const responseData = result.data
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: "EnterRoomResponse",
            room_id: packet.room_id,
            data: result.data
          } as Packet<EnterRoomResponse>))
        }
        if (responseData.success) {
          const enterPacket: Packet<User> = {
            type: "enterRoom",
            room_id: packet.room_id,
            data: {
              id: result.data.id,
              name: packet.data.name,
              color: packet.data.color,
              room_id: packet.data.room_id,
              last_activity: new Date().toISOString(),
            }
          }
          const enterSockets = roomClients.get(packet.room_id) || new Set()
          for (const client of enterSockets) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(enterPacket))
            }
          }
          // 入室メッセージは broadcastMessage で1回だけ送信 (DBへの保存も含む)
          await broadcastMessage({
            room_id: packet.room_id,
            color: 0,
            name: packet.data.name,
            text: `${packet.data.name}さんが入室しました。`,
            system: true,
            created_at: new Date().toISOString(),
          })
        }
      } else if (type === "exitRoom") {
        const packet = parsed as Packet<User>
        await supabase.functions.invoke('database-access', {
          body: {
            action: 'exitRoom',
            roomId: packet.data.room_id,
            userId: packet.data.id
          },
        })
        const exitPacket: Packet<User> = {
          type: "exitRoom",
          room_id: packet.room_id,
          data: {
            id: packet.data.id,
            name: packet.data.name,
            color: packet.data.color,
            room_id: packet.data.room_id,
            last_activity: new Date().toISOString(),
          }
        }
        const exitSockets = roomClients.get(packet.room_id) || new Set()
        for (const client of exitSockets) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(exitPacket))
          }
        }
        // 退室メッセージは broadcastMessage で1回だけ送信
        await broadcastMessage({
          room_id: packet.room_id,
          color: 0,
          name: packet.data.name,
          text: `${packet.data.name}さんが退室しました。`,
          system: true,
          created_at: new Date().toISOString(),
        })
      } else if (type === "changeVariable") {
        const packet = parsed as Packet<changeVariable>
        const { data } = await supabase.from("Rooms").select('options, variables').eq('id', packet.room_id)
        if (data && data[0]) {
          const varData = data[0]
          const variables: Variable = varData.variables as Variable
          const opt: RoomOption = varData.options as RoomOption
          if (opt && opt.variables && opt.variables.includes(packet.data.key)) {
            if (!variables[packet.data.key]) variables[packet.data.key] = 0
            const value_before = variables[packet.data.key]
            if (packet.data.op === "mod") {
              variables[packet.data.key] += packet.data.value
            } else if (packet.data.op === "set") {
              variables[packet.data.key] = packet.data.value
            }
            if (value_before !== variables[packet.data.key]) {
              await supabase.from("Rooms").update({ variables }).eq('id', packet.room_id)
              await broadcastMessage({
                color: 0,
                name: "system",
                room_id: packet.room_id,
                system: true,
                text: `${packet.data.key} : ${value_before} → ${variables[packet.data.key]}`,
                created_at: new Date().toISOString(),
              })
            }
          }
        }
      } else if (type === "dice") {
        const packet = parsed as Packet<dice>
        const result = roll(packet.data.command)
        if (result) {
          await broadcastMessage({
            color: 0,
            name: "system",
            room_id: packet.room_id,
            system: true,
            text: `ダイスロール : ${packet.data.command} > ${result}`,
            created_at: new Date().toISOString(),
          })
        }
      } else if (type === "card") {
        const packet = parsed as Packet<card>
        if (packet.data.command === 'resetDeck') {
          await resetDeck(packet.room_id, packet.data.name)
        } else if (packet.data.command === 'drawCard') {
          await drawCard(packet.room_id, packet.data.name)
        }
      }
    }

    socket.onclose = () => {
      const rid = socketRoom.get(socket)
      if (rid !== undefined) {
        roomClients.get(rid)?.delete(socket)
        socketRoom.delete(socket)
      }
    }

    socket.onerror = (_err) => {
      //console.error("WebSocket error:", err);
    }

    return response;
  }
)

setInterval(async () => {
  console.log("on minute passed.")
  const deleted = await removeInactiveUser()
  console.log(deleted)
}, 60 * 1000)

console.log("WebSocket server running on ws://localhost:8001")
