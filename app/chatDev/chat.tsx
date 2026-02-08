
"use client"
import { Database, Json } from "@/types/supabasetype"
import { RealtimeChannel } from "@supabase/realtime-js"
import { useEffect, useState } from "react"
import useSound from 'use-sound'
import se from "../sound.mp3"
import { supabase } from "@/utils/supabase/supabase"
import { useSearchParams } from "next/navigation"
import * as ColorWheel from "react-hsv-ring"
import ChatLine from "@/components/chat/chatLine"
import MessageDialog from '@/components/modal'
import { createTrip } from "2ch-trip"
import { intToColorCode, colorCodeToInt } from "@/utils/color/color"
import Linkify from "linkify-react"
import toast, { Toaster } from "react-hot-toast"
import styles from '@/components/style'
import { getRoomVariable, setRoomVariable, incrementRoomVariable, decrementRoomVariable, type RoomVariable } from "./middleware"

type Prop = {
  onSetTitle?: (title: string) => void
}

type RoomOption = {
  private: boolean
  user_limit: number,
  all_clear: string,
  use_trump: boolean,
  variables: string[]
}

type User = {
  color: number;
  name: string;
  id: string;
}

const NUM_MESSAGES = 50

const linkifyOptions = {
  className: "text-blue-700",
}

export default function Chat({ onSetTitle = () => { } }: Prop) {
  const [play, { stop, pause }] = useSound(se)

  const searchParams = useSearchParams()
  let roomId = parseInt(searchParams.get("roomId")!!)
  const [inputText, setInputText] = useState("")
  const [inputName, setInputName] = useState("")
  const [pendingMessageText, setPendingMessageText] = useState<Database["public"]["Tables"]["Messages"]["Row"][]>([])
  const [messageText, setMessageText] = useState<Database["public"]["Tables"]["Messages"]["Row"][]>([])
  const [roomData, setRoomData] = useState<Database["public"]["Tables"]["Rooms"]["Row"]>()
  const [roomAuthenticated, setRoomAuthenticated] = useState(false)
  const [roomDataLoaded, setRoomDataLoaded] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [variableKeys, setVariableKeys] = useState<string[]>([])
  const [variables, setVariables] = useState<RoomVariable>({})
  const [useTrump, setUseTrump] = useState(false)
  const [isEntered, setIsEntered] = useState(false)
  const [username, setUsername] = useState("")
  const [buttonDisable, setButtonDisable] = useState(false)
  const [showRoomDescription, setShowRoomDescription] = useState(true)
  const [showRoomDescriptionModal, setShowRoomDescriptionModal] = useState(false);
  const [showVariableCommand, setShowVariableCommand] = useState(false)
  const [showSettings, setShowSettings] = useState(false);
  const [inputVariableOpen, setInputVariableOpen] = useState(false)
  const [inputVariableKey, setInputVariableKey] = useState("")
  const [inputVariableValue, setInputVariableValue] = useState(0)
  const [realtimeDataStarted, setRealtimeDataStarted] = useState(false)
  const [playSound, setPlaySound] = useState(false)
  const [color, setColor] = useState("#000000")
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [recievedMessage, setRecievedMessage] = useState<Database["public"]["Tables"]["Messages"]["Row"] | null>(null)
  const [allClearAt, setAllClearAt] = useState('')
  const [channels, setchannels] = useState<RealtimeChannel[]>([])

  let handlingDb = false
  let initialized = false
  let recievedMessages: any[] = []

  type Message = Database["public"]["Tables"]["Messages"]["Row"]
  type SendUser = Database["public"]["Tables"]["Users"]["Row"]
  type SendMessage = Omit<Message, 'id' | 'created_at'>
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
  type _User = Database["public"]["Tables"]["Users"]["Row"]

  type Packet<T> = {
    type: T extends Message ? "message"
    : T extends SendMessage ? "message"
    : T extends _User ? "enterRoom" | "exitRoom"
    : T extends SendUser ? "enterRoom" | "exitRoom"
    : T extends EnterRoomResponse ? "EnterRoomResponse"
    : T extends changeVariable ? "changeVariable"
    : T extends card ? "card"
    : T extends dice ? "dice"
    : "error"
    room_id: number,
    data: T
  }

  const pack: Packet<card> = {
    type: "card",
    room_id: roomId,
    data: {
      name: username,
      command: "drawCard"
    }
  }

  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [messageSocket, setMmessageSocket] = useState<WebSocket | null>(null)
  const url = 'wss://rtchat.0am.jp/ws/'

  const onMessagePacketRecieved = (packet: Packet<Message>) => {
    if (packet.data.room_id == roomId) {
      setPendingMessageText([])
      recievedMessages.push(packet.data.id)
      setRecievedMessage(packet.data)
    }
  }

  const createSocket = (message: boolean) => {
    const newsocket = new WebSocket(url + "?roomId=" + roomId)
    newsocket.onopen = () => {
      if (message) {
        toast.removeAll()
        toast.success("チャットの接続を開始しました。")
        console.log("Connected to WebSocket server: message")
        setMmessageSocket(newsocket)
      } else {
        console.log("Connected to WebSocket server: other")
        setSocket(newsocket)
      }
    }

    newsocket.onmessage = (event) => {
      if (message) {
        const packet: Packet<Message> = JSON.parse(event.data)
        if (packet.type === "message") {
          onMessagePacketRecieved(packet)
        }
      } else {
        const packet2: Packet<EnterRoomResponse> = JSON.parse(event.data)
        if (packet2.type === "EnterRoomResponse") {
          if (packet2.data.success) {
            localStorage.setItem("userId", packet2.data.id)
            checkEntered()
            fetchMessages()
            fetchRealtimeData()
          } else {
            alert("入室に失敗しました: " + packet2.data.reason)
          }
          setButtonDisable(false)
        }
        const packet3: Packet<_User> = JSON.parse(event.data)
        if (packet3.type === "enterRoom") {
          getUsers().then(() => { })
          /*
          if (!users.find(user => (user.id === packet3.data.id))) {
            setUsers((users) => [
              {
                id: packet3.data.id,
                name: packet3.data.name || "Unknown",
                color: packet3.data.color || 0
              },
              ...users
            ])
          }
          */
        } else if (packet3.type === "exitRoom") {
          getUsers().then(() => { })
          /*
          setUsers((users) => users.filter(user => user.id != packet3.data.id))
          */
        }
      }
    }

    newsocket.onclose = () => {
      if (message) {
        toast.error("チャットの接続が切断されました。")
        console.log("Disconnected from WebSocket server: message")
        setMmessageSocket(null)
      } else {
        console.log("Disconnected from WebSocket server: other")
        setSocket(null)
        createSocket(message)
      }
    }

    newsocket.onerror = (err) => {
      console.error("WebSocket error:", err);
      if (message) {
        toast.error("サーバーとの接続中にエラーが発生しました。")
        setMmessageSocket(null)
      } else {
        setSocket(null)
        createSocket(message)
      }
    }

    return () => {
      if (socket) socket.close();
    }
  }

  const sendMessage = (data: SendMessage) => {
    if (socket) {
      const packet: Packet<SendMessage> = {
        type: "message",
        room_id: roomId,
        data: data,
      }
      socket.send(JSON.stringify(packet))
      return true
    }
    return false
  }

  const diceRoll = (data: dice) => {
    if (socket) {
      const packet: Packet<dice> = {
        type: "dice",
        room_id: roomId,
        data: data,
      }
      socket.send(JSON.stringify(packet))
    }
  }

  const enterRoom = (data: SendUser) => {
    if (socket) {
      const packet: Packet<SendUser> = {
        type: "enterRoom",
        room_id: roomId,
        data: data,
      }
      socket.send(JSON.stringify(packet))
    }
  }

  const exitRoom = (data: SendUser) => {
    if (socket) {
      const packet: Packet<SendUser> = {
        type: "exitRoom",
        room_id: roomId,
        data: data,
      }
      socket.send(JSON.stringify(packet))
    }
    if (messageSocket) messageSocket.close()
    setMmessageSocket(null)
  }

  const colorPicker = (username: string) => {
    return (
      <div className="p-2">
        <ColorWheel.Root value={color} onValueChange={(hex) => { setColor(hex); localStorage.setItem('username_color', hex) }}>
          <ColorWheel.Wheel size={200} ringWidth={20}>
            <ColorWheel.HueRing />
            <ColorWheel.HueThumb />
            <ColorWheel.Area />
            <ColorWheel.AreaThumb />
          </ColorWheel.Wheel>
        </ColorWheel.Root>
        <span style={{ color: color }} className="mb-2 text-sm font-medium text-gray-900" >{createTrip(username)}</span>
      </div >
    )
  }

  const fetchRealtimeData = () => {
    if (realtimeDataStarted) return
    setRealtimeDataStarted(true)
    try {
      const userChannel = supabase
        .channel(`users_${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Users"
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const { id, name, color, room_id } = payload.new
              if (room_id == roomId) {
                setUsers((users) => [{ id, name, color }, ...users])
              }
            } else if (payload.eventType === "DELETE") {
              checkEntered()
              const { id } = payload.old
              setUsers((users) => users.filter(user => user.id != id))
              if (isEntered && !users.find(user => user.id === localStorage.getItem("userId"))) {
                toast.error("入室していません。")
              }
            }
          }
        )
        .subscribe()

      const roomChannel = supabase
        .channel(`roominfo_${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Rooms",
            filter: `id=eq.${roomId}`
          },
          (payload) => {
            if (payload.eventType === "UPDATE") {
              setAllClearAt(payload.new.all_clear_at)
            }
          }
        )
        .subscribe()

      const roomDataChannel = supabase
        .channel(`roomdata_${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "RoomData",
            filter: `id=eq.${roomId}`
          },
          (payload) => {
            if (payload.eventType === "UPDATE") {
              setVariables(payload.new.variables)
            }
          }
        )
        .subscribe()

      console.log("自動更新の開始")
      setchannels([userChannel, roomChannel, roomDataChannel])
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMessages = async (all_clear_at: string | null = "") => {
    let allMessages = null
    let allClearAt: string | null = all_clear_at
    if (roomData && roomData.all_clear_at) {
      allClearAt = roomData.all_clear_at
    }
    try {
      if (allClearAt) {
        const { data } = await supabase.from("Messages").select("*").eq('room_id', roomId).gt("created_at", allClearAt).order("created_at", { ascending: false }).limit(NUM_MESSAGES)
        allMessages = data
      } else {
        const { data } = await supabase.from("Messages").select("*").eq('room_id', roomId).order("created_at", { ascending: false }).limit(NUM_MESSAGES)
        allMessages = data
      }
    } catch (error) {
      console.error(error)
    }
    if (allMessages != null) {
      recievedMessages.splice(0)
      setMessageText(allMessages)
      allMessages.forEach(e => recievedMessages.push(e.id))
    }
  }

  useEffect(() => {
    (async () => {
      if (initialized) return
      initialized = true

      if (localStorage.getItem('username')) {
        setInputName(localStorage.getItem('username') || "")
      }
      if (localStorage.getItem('username_color')) {
        setColor(localStorage.getItem('username_color') || "#000000")
      }

      try {
        let roomData: Database["public"]["Tables"]["Rooms"]["Row"] | null = null
        const res = await fetch(`${process.env.NEXT_PUBLIC_MY_SUPABASE_URL!}/storage/v1/object/public/rooms/${roomId}.json`, {
          method: 'GET',
          cache: 'no-store'
        })
        if (res.ok) {
          roomData = await new Response(res.body).json()
          if (roomData) setRoomData(roomData)
          setRoomAuthenticated(true)
        } else {
          const { response, data } = await supabase.functions.invoke('roomInfo', {
            body: { roomId: roomId },
          })
          if (data) {
            setRoomData(data.info)
            setRoomAuthenticated(data.authenticated)
          }
        }
      } catch (error) {
        console.error(error)
        alert("部屋データの取得に失敗しました。")
        return
      }
      setRoomDataLoaded(true)
    })()

    return () => {
      if (socket) {
        socket.close()
      }
      if (messageSocket) {
        console.log('Closing WebSocket...')
        messageSocket.close()
      }
    }
  }, [])

  useEffect(() => {
    if (!roomDataLoaded) return
    (async () => {
      console.log('roomDataLoaded')
      getUsers()
      const variables: any = roomData?.variables || {}
      const opt: any = roomData?.options || {}
      createSocket(false)
      if (roomData) {
        if (opt.private) {
          const chk = await checkEntered()
          if (chk.entered) {
            fetchMessages(roomData.all_clear_at)
            fetchRealtimeData()
          }
        } else {
          checkEntered()
          fetchMessages(roomData.all_clear_at)
          fetchRealtimeData()
          createSocket(true)
        }
        if (opt.variables) {
          setVariableKeys(opt.variables)
        }
        const vars = await getRoomVariable(roomId)
        if (vars) {
          setVariables(vars)
        }
        if (opt.use_trump) {
          setUseTrump(opt.use_trump)
        }
      } else {
        toast.error('ルームデータを取得できませんでした。')
      }

      if (localStorage.getItem('playSound') === 'true') {
        setPlaySound(true)
      }
    })()

    const timer = setInterval(getUsers, 5 * 60 * 1000)

    return () => clearInterval(timer)
  }, [roomDataLoaded])

  useEffect(() => {
    if (recievedMessage) {
      if (playSound) play()
      if (allClearAt) {
        setMessageText((messageText) => [recievedMessage, ...messageText.filter(message => message.created_at > allClearAt)])
      } else {
        setMessageText((messageText) => [recievedMessage, ...messageText])
      }
      setRecievedMessage(null)
    }
  }, [recievedMessage])

  useEffect(() => {
    if (allClearAt) {
      setMessageText((messageText) => messageText.filter(message => message.created_at > allClearAt))
    }
  }, [allClearAt])

  useEffect(() => {
    if (!roomDataLoaded) return
    if (isEntered) {
      console.log("入室時の処理")
      if (getRoomOption().private && !messageSocket) createSocket(true)
      if (roomData) fetchMessages(roomData.all_clear_at)
    } else {
      console.log("退室時の処理")
      if (messageSocket) messageSocket.close()
      setMmessageSocket(null)
      channels.forEach(channel => {
        console.log('unsubscribe...')
        channel.unsubscribe()
      })
      console.log("自動更新の終了")
    }
  }, [isEntered])

  useEffect(() => {
    if (!messageSocket && isEntered) {
      toast.loading("再接続中…")
      createSocket(true)
    }
  }, [messageSocket])

  const onSoundChanged = (option: boolean) => {
    setPlaySound(option)
    localStorage.setItem('playSound', option ? 'true' : 'false')
    play()
  }

  const handleBeforeUnload = () => {
    channels.forEach(channel => {
      console.log('unsubscribe...')
      channel.unsubscribe()
    })
    console.log("自動更新の終了")
  }

  useEffect(() => {
    return () => {
      handleBeforeUnload()
    }
  }, [])

  const onSubmitNewMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputText === "") return
    setButtonDisable(true)

    try {
      const msg = {
        room_id: roomId,
        name: username,
        text: inputText,
        color: colorCodeToInt(color),
        system: false
      }
      let specialMsg: any = null
      const rd: any = roomData
      if (rd && rd.special_keys && rd.special_keys[inputText]) {
        const special_text: String = rd.special_keys[inputText] || ""
        const array = special_text.split("\n")
        const specialText = array[Math.floor(Math.random() * array.length)]
        let res: string = specialText
        Object.entries(variables).map((value) => {
          const regexp = new RegExp(`{${value[0]}}`, 'g')
          res = res.replace(regexp, `${value[1]}`)
        })
        specialMsg = {
          room_id: roomId,
          name: username,
          text: inputText + " : " + res,
          color: 0,
          system: true
        }
        if (Object.keys(variables).includes(inputText)) {
          setVar("mod", inputText, 1)
        }
      }

      setPendingMessageText([])

      const chk = await checkEntered()
      if (!chk.entered) {
        alert("入室していません。")
        setButtonDisable(false)
        return
      }
      const sendMessageResult = sendMessage({
        room_id: msg.room_id,
        name: msg.name,
        text: msg.text,
        color: msg.color,
        system: msg.system
      })
      if (!sendMessageResult) {
        toast.error('メッセージの送信に失敗しました。')
        throw new Error("メッセージの送信に失敗しました。")
      }
      if (specialMsg) {
        setTimeout(() => {
          sendMessage({
            room_id: specialMsg.room_id,
            name: specialMsg.name,
            text: specialMsg.text,
            color: specialMsg.color,
            system: specialMsg.system
          })
        }, 200)
      } else {
      }
      supabase.from("Users").upsert({
        id: chk.id,
        room_id: roomId,
        name: chk.username,
        color: colorCodeToInt(color),
        last_activity: new Date().toISOString()
      }).then(() => { })

      if (getRoomOption().all_clear && getRoomOption().all_clear == inputText) {
        const data = {
          action: 'allClear',
          roomId: roomId
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cache: 'no-store',
          },
          body: JSON.stringify(data),
        })

        setMessageText([])
      }
    } catch (error) {
      console.error(error)
    }
    setInputText("")
    setButtonDisable(false)
  }

  const getRoomOption = () => {
    const rd: RoomOption = { private: false, use_trump: false, user_limit: 10, all_clear: "", variables: [] }
    if (roomData && roomData.options) {
      rd.private = (roomData.options as any).private
      rd.use_trump = (roomData.options as any).use_trump
      rd.user_limit = parseInt((roomData.options as any).user_limit)
      if (isNaN(rd.user_limit)) rd.user_limit = 10
      if (rd.user_limit < 3) rd.user_limit = 3
      rd.all_clear = (roomData.options as any).all_clear || ""
      rd.variables = (roomData.options as any).variables || []
    }
    return rd
  }

  const onSubmitEnter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputName === "") return
    if (handlingDb) return
    const opt = getRoomOption()
    if (users.find(user => (user.name === createTrip(inputName)))) {
      toast.error('同じ名前の人が入室しています。')
      return
    }
    if (!socket) {
      toast.error('サーバーに接続されていません。しばらく待ってからもう一度お試しください。')
      return
    }
    handlingDb = true
    setButtonDisable(true)
    localStorage.setItem('username', inputName)
    localStorage.setItem('username_color', color)
    enterRoom({
      room_id: roomId,
      color: colorCodeToInt(color),
      name: createTrip(inputName),
      id: localStorage.getItem("userId") || "",
      last_activity: new Date().toISOString()
    })
    handlingDb = false
  }

  const getUsers = async () => {
    const response = await supabase.functions.invoke('database-access', {
      body: { action: 'getUsers', roomId: roomId },
    })
    if (response.data) {
      const responseData = response.data
      setUsers(responseData.users)

      if (isEntered && !(responseData.users as User[]).find(user => (user.name === username))) {
        await checkEntered()
      }
    }
  }

  const checkEntered = async () => {
    const response = await supabase.functions.invoke('database-access', {
      body: {
        action: 'checkEntered',
        roomId: roomId,
        userId: localStorage.getItem("userId") || null
      },
    })
    if (response.data) {
      const responseData = response.data
      if (responseData.entered) {
        if (!isEntered) setIsEntered(true)
        setUsername(responseData.username || "Unknown")
        setColor(intToColorCode(responseData.color || 0))
      }
      if (isEntered && !responseData.entered) {
        setIsEntered(false)
        toast.error("入室していません。")
      }
      return {
        username: responseData.username,
        entered: responseData.entered,
        id: responseData.id
      }
    }

    return {
      username: "",
      entered: false,
      id: ""
    }
  }

  const onSubmitLeave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    exitRoom({
      room_id: roomId,
      color: colorCodeToInt(color),
      name: createTrip(inputName),
      id: localStorage.getItem("userId") || "",
      last_activity: new Date().toISOString()
    })
    setUsers((users) => users.filter(user => user.id != localStorage.getItem("userId")))
    setIsEntered(false)
  }

  const onClickRoomDescription = async () => {
    setShowRoomDescription(!showRoomDescription)
  }

  const linedDescription = (text: String) => {
    const lines = text.split('\n').map((item, index) => {
      if (item) return (<div key={index}>{item}</div>)
      return (<div key={index}>&nbsp;</div>)
    })
    return lines
  }

  const inputTextKeyPress = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && !buttonDisable) {
      onSubmitNewMessage(event)
    }
  }

  const setVar = async (op: string, key: string, value: number) => {
    setButtonDisable(true)
    setTimeout(() => setButtonDisable(false), 2 * 1000)

    if (socket) {
      const packet: Packet<changeVariable> = {
        type: "changeVariable",
        room_id: roomId,
        data: {
          op: op,
          key: key,
          value: value
        }
      }
      socket.send(JSON.stringify(packet))
    }
  }

  const drawCard = async () => {
    setButtonDisable(true)
    setTimeout(() => setButtonDisable(false), 2 * 1000)
    if (socket) {
      const packet: Packet<card> = {
        type: "card",
        room_id: roomId,
        data: {
          name: username,
          command: "drawCard"
        }
      }
      socket.send(JSON.stringify(packet))
    }
  }

  const resetDeck = async () => {
    setButtonDisable(true)
    setTimeout(() => setButtonDisable(false), 2 * 1000)
    if (socket) {
      const packet: Packet<card> = {
        type: "card",
        room_id: roomId,
        data: {
          name: username,
          command: "resetDeck"
        }
      }
      socket.send(JSON.stringify(packet))
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <Toaster position="top-center" />
      <title>{roomData?.title}</title>
      <h2 className="text-xl font-bold pt-5 pb-5">{roomData ? roomData.title : ""}</h2>

      <div className="text-right text-xs grid grid-cols-1">
        {(socket && socket.readyState == socket.OPEN) ? (
          <span className="text-xs">ルーム情報の接続✅</span>
        ) : (
          <span className="text-xs">ルーム情報の接続❌</span>
        )}
        {(messageSocket && messageSocket.readyState == messageSocket.OPEN) ? (
          <span className="text-xs">メッセージの取得✅</span>
        ) : (
          <span className="text-xs">メッセージの取得❌</span>
        )}
      </div>

      {!roomDataLoaded && (
        <div className="m-2 p-2">
          部屋データを読み込み中...
        </div>
      )}

      {roomDataLoaded && (<>
        {!isEntered && (
          <form className="m-2 p-2" onSubmit={onSubmitEnter}>
            {!roomAuthenticated && (
              <div className="text-right text-xs">
                ※認証されていない部屋です
              </div>
            )}
            <label htmlFor="name" className="inline-block mb-2 text-sm font-medium text-gray-900"></label>
            <span style={{ color: color }} className="mb-2 text-sm font-medium text-gray-900" onClick={(event) => { setShowColorPicker(!showColorPicker) }}>お名前 [文字色]</span>
            {showColorPicker && colorPicker(inputName)}
            <div className="sm:flex">
              <input type="text" id="name"
                className="flex-grow text-base bg-gray-50 border border-gray-300 text-gray-900 rounded-lg 
              focus:ring-blue-500 focus:border-blue-500 inline-block w-full p-2.5"
                name="name" value={inputName} onChange={(event) => setInputName(() => event.target.value)}></input>
              <button type="submit" className={`${styles.button} whitespace-nowrap`} disabled={!roomAuthenticated || buttonDisable || inputName === ""}>
                入室
              </button>
            </div>
          </form>
        )}

        {isEntered && (
          <form className="m-2" onSubmit={onSubmitLeave}>
            <button type="submit" className={styles.button}>
              退室
            </button>
          </form>
        )}

        <div className="m-2 p-2 border border-gray-300 rounded-lg flex flex-wrap space-x-2">
          <span className="font-medium text-xs">
            現在の入室者:
          </span>
          {users.map((user, index) => (
            <span key={index} style={{ color: intToColorCode(user.color) }} className="font-medium text-xs">
              {user.name}
            </span>
          ))}
          <span className="flex items-end text-xs font-xs">
            {roomData && `(${users.length} / ${getRoomOption().user_limit} 人)`}
          </span>
        </div>

        {isEntered && showColorPicker && colorPicker('')}
        {isEntered && (
          <>
            <form className="m-2" onSubmit={onSubmitNewMessage} onKeyDown={inputTextKeyPress}>
              <div className="mb-1 flex items-center grid grid-cols-3">
                <span style={{ color: color }} className="col-span-2 mb-2 font-bold text-gray-900" onClick={(event) => { setShowColorPicker(!showColorPicker) }}>{username}</span>
                <button type="submit" className={styles.button} disabled={buttonDisable || inputText === ""}>
                  発言
                </button>
                <textarea id="message" name="message" rows={1}
                  className="col-span-3 block resize-y p-2.5 mb-2 w-full text-base text-gray-900
                  bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  value={inputText} onChange={(event) => { event.target.style.height = "auto"; event.target.style.height = `${event.target.scrollHeight}px`; setInputText(() => event.target.value.replace(/\r?\n/g, '')) }}
                />
              </div>
            </form>

          </>
        )}
        <MessageDialog
          open={inputVariableOpen}
          showCancel={true}
          onCancel={() => setInputVariableOpen(false)}
          onOk={() => { setInputVariableOpen(false); setVar("set", inputVariableKey, inputVariableValue) }}
          message={(
            <form onSubmit={() => { setInputVariableOpen(false); setVar("set", inputVariableKey, inputVariableValue) }}>
              {inputVariableKey}
              <input type="number" value={inputVariableValue} onChange={(event) => setInputVariableValue(() => parseInt(event.target.value))}
                className="text-base bg-gray-50 border border-gray-300 text-gray-900 rounded-lg 
                              focus:ring-blue-500 focus:border-blue-500 inline-block w-full p-2.5"
              />
            </form>
          )}
        />

        {!isEntered && (
          <div className="m-2 p-2 text-sm border border-gray-300 rounded-lg">
            <div className="w-full text-sm" onClick={onClickRoomDescription}>
              ルーム紹介 {showRoomDescription ? "[非表示]" : "[表示]"}
            </div>
            {showRoomDescription && (
              <Linkify as="div" className="text-xs" options={linkifyOptions}>
                {
                  roomData
                    ? linedDescription(roomData.description || "")
                    : ""}
              </Linkify>
            )}
          </div>
        )}

        {roomData?.options && (roomData?.options as any).private && !isEntered && (
          <div className="p-2 w-full pb-10">
            未入室閲覧禁止設定です。
          </div>
        )}

        <div className="p-2 w-full mb-10">
          {pendingMessageText.map((item, index) => (
            <ChatLine key={index} message={item} index={index}></ChatLine>
          ))}
          {messageText.map((item, index) => (
            <ChatLine key={index} message={item} index={index}></ChatLine>
          ))}
        </div>

        <div className="w-full mb-4">
          <a href={"/editRoom?roomId=" + roomId} >部屋を編集</a>
        </div>
        <div className="w-full mb-8">
          <a href={"/adminMenu?roomId=" + roomId} >管理者用メニュー</a>
        </div>
      </>)}

      {isEntered && (
        <footer className="bg-white p-4 border-b-2 border-gray-300 fixed left-0 bottom-0 w-full">
          <ul className="w-full max-w-xl m-auto flex font-medium flex-row grid grid-cols-3">
            <li className="text-center">
              <span className="text-gray-700 hover:text-blue-700" onClick={(e) => setShowRoomDescriptionModal(true)}>ルーム紹介</span>
            </li>
            <li className="text-center">
              <span className="text-gray-700 hover:text-blue-700" onClick={(e) => setShowVariableCommand(true)}>特殊コマンド</span>
            </li>
            <li className="text-center">
              <span className="text-gray-700 hover:text-blue-700" onClick={(e) => setShowSettings(true)}>設定</span>
            </li>
          </ul>
        </footer>
      )}

      <MessageDialog
        open={showRoomDescriptionModal}
        onCancel={() => setShowRoomDescriptionModal(false)}
        onOk={() => setShowRoomDescriptionModal(false)}
        message={(
          <Linkify as="div" className="" options={linkifyOptions}>
            {
              roomData
                ? linedDescription(roomData.description || "")
                : ""}
          </Linkify>
        )}
      />

      <MessageDialog
        open={showVariableCommand}
        onCancel={() => setShowVariableCommand(false)}
        onOk={() => setShowVariableCommand(false)}
        message={(
          <>
            {useTrump && (
              <>
                <div className="w-full font-medium">
                  トランプ機能
                </div>
                <div className="m-2 mb-1 flex items-center grid grid-cols-2 space-x-2">
                  <button type="submit" className={styles.button} onClick={() => { if (!buttonDisable) drawCard(); setShowVariableCommand(false) }} disabled={buttonDisable}>
                    1枚引く
                  </button>
                  <button type="submit" className={styles.button} onClick={() => { if (!buttonDisable) resetDeck(); setShowVariableCommand(false) }} disabled={buttonDisable}>
                    山札をリセット
                  </button>
                </div>
              </>
            )}
            {variableKeys.length && (
              <>
                <div className="w-full font-medium">
                  数値の操作
                </div>
                {variableKeys.map((key, index) => (
                  <div key={index} className="m-2 mb-1 flex items-center grid grid-cols-6 space-x-2">
                    <span className="col-span-2 row-span-2 text-center">
                      <span className="font-medium">
                        {key}
                      </span>
                      <span>
                        ({variables[key] || 0})
                      </span>
                    </span>
                    <button type="submit" className={`col-span-2 ${styles.button}`} onClick={() => { if (!buttonDisable) setVar("mod", key, 1); setShowVariableCommand(false) }} disabled={buttonDisable}>
                      +1
                    </button>
                    <button type="submit" className={`col-span-2 ${styles.button}`} onClick={() => { if (!buttonDisable) setVar("mod", key, -1); setShowVariableCommand(false) }} disabled={buttonDisable}>
                      -1
                    </button>
                    <button type="submit" className={`col-span-2 ${styles.button}`} onClick={() => { setInputVariableKey(key); setInputVariableValue(variables[key]); if (!buttonDisable) setInputVariableOpen(true); setShowVariableCommand(false) }} disabled={buttonDisable}>
                      値を入力
                    </button>
                    <button type="submit" className={`col-span-2 ${styles.button}`} onClick={() => { if (!buttonDisable) setVar("set", key, 0); setShowVariableCommand(false) }} disabled={buttonDisable}>
                      リセット
                    </button>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      />

      <MessageDialog
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        onOk={() => setShowSettings(false)}
        message={(
          <span className="w-full font-medium text-right">
            <input checked={playSound} type="checkbox" id="playsound" name="playsound" onChange={(event) => { onSoundChanged(event.target.checked) }} />
            <label htmlFor="playsound">新着時に音を鳴らす</label>
          </span>
        )}
      />

    </div>
  )
}
