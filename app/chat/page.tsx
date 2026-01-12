
"use client"
import { Database } from "@/types/supabasetype"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import { useSearchParams } from "next/navigation"
import * as ColorWheel from "react-hsv-ring"
import ChatLine from "@/components/chat/chatLine"
import { createTrip } from "2ch-trip"

type RoomOption = {
  private: boolean | undefined,
  limit: number | undefined
}

export default function Chat() {
  const searchParams = useSearchParams()
  let roomId = parseInt(searchParams.get("roomId")!!)
  const [inputText, setInputText] = useState("")
  const [inputName, setInputName] = useState("")
  const [messageText, setMessageText] = useState<Database["public"]["Tables"]["Messages"]["Row"][]>([])
  const [roomData, setRoomData] = useState<Database["public"]["Tables"]["Rooms"]["Row"]>()
  const [users, setUsers] = useState<Database["public"]["Tables"]["Users"]["Row"][]>([])
  const [isEntered, setIsEntered] = useState(false)
  const [username, setUsername] = useState("")
  const [buttonDisable, setButtonDisable] = useState(false)
  const [showRoomDescription, setShowRoomDescription] = useState(true)
  const [color, setColor] = useState("#000000")
  const [showColorPicker, setShowColorPicker] = useState(false)
  let fetchMessagesEnable = false

  const colorCodeToInt = (code: string) => {
    const shorthandRegex = /^#?([a-fA-F\d]+)$/i;
    const result = shorthandRegex.exec(code) || []
    if (result.length > 1) {
      return parseInt(result[1], 16)
    }
    return 0
  }

  const intToColorCode = (num: number) => {
    return '#' + num.toString(16).padStart(6, '0')
  }

  const colorPicker = (username: string) => {
    return (
      <div className="p-2">
        <ColorWheel.Root value={color} onValueChange={setColor}>
          <ColorWheel.Wheel size={200} ringWidth={20}>
            <ColorWheel.HueRing />
            <ColorWheel.HueThumb />
            <ColorWheel.Area />
            <ColorWheel.AreaThumb />
          </ColorWheel.Wheel>
        </ColorWheel.Root>
        <span style={{ color: color }} className="mb-2 text-sm font-medium text-gray-900" >{createTrip(username)}</span>
      </div>
    )
  }

  const fetchRealtimeData = () => {
    try {
      supabase
        .channel(String(roomId))
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Messages",
          },
          (payload) => {
            console.log(payload)
            if (payload.eventType === "INSERT") {
              const { id, room_id, name, text, color, created_at, system } = payload.new
              console.log(payload.new)
              if (room_id === roomId) {
                setMessageText((messageText) => [{ id, room_id, name, text, color, created_at, system }, ...messageText])
                console.log({ id, room_id, name, text, color, created_at, system })
              }
            }
          }
        )
        .subscribe()

      supabase
        .channel(`users_${roomId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Users",
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const { id, room_id, last_activity, name, color } = payload.new
              if (room_id === roomId) {
                setUsers((users) => [...users, { id, room_id, last_activity, name, color }])
              }
            }
            if (payload.eventType === "DELETE") {
              const { id, room_id } = payload.old
              if (room_id === roomId) {
                setUsers(users.filter(user => user.id !== id))
              }
            }
            console.log(users)
            checkEntered()
          }
        )
        .subscribe()
      console.log("自動更新の開始")
      return () => {
        supabase.channel(String(roomId)).unsubscribe()
        supabase.channel(`users_${roomId}`).unsubscribe()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchMessages = async () => {
    let allMessages = null
    try {
      const { data } = await supabase.from("Messages").select("*").eq('room_id', roomId).order("created_at", { ascending: false }).limit(10)

      allMessages = data
    } catch (error) {
      console.error(error)
    }
    if (allMessages != null) {
      setMessageText(allMessages)
    }
  }

  // 初回のみ実行するために引数に空の配列を渡している
  useEffect(() => {
    (async () => {

      let tempRoomData = null
      try {
        const { data } = await supabase.from("Rooms").select("*").eq('id', roomId).order("created_at")
        if (data && data[0]) {
          setRoomData(data[0])
          tempRoomData = data[0]
        }
      } catch (error) {
        console.error(error)
        alert("部屋データの取得に失敗しました。")
        return
      }

      let allUsers = null
      try {
        const { data } = await supabase.from("Users").select("*").eq('room_id', roomId).order("last_activity")

        allUsers = data
      } catch (error) {
        console.error(error)
      }
      if (allUsers != null) {
        setUsers(allUsers)
      }

      if (tempRoomData) {
        const opt: any = tempRoomData.options || {}
        if (opt.private) {
          const chk = await checkEntered()
          if (chk.entered) {
            fetchMessages()
            fetchRealtimeData()
          }
        } else {
          await checkEntered()
          fetchMessages()
          fetchRealtimeData()
        }
      } else {
        await checkEntered()
        fetchMessages()
        fetchRealtimeData()
      }
    })()
  }, [])

  const onSubmitNewMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputText === "") return
    const chk = await checkEntered()
    if (!chk.entered) {
      alert("入室していません。")
      return
    }
    setButtonDisable(true)

    try {
      await supabase.from("Messages").insert({
        room_id: roomId,
        name: chk.username,
        text: inputText,
        color: colorCodeToInt(color),
        system: false
      })
      await supabase.from("Users").upsert({
        id: chk.id,
        room_id: roomId,
        name: chk.username,
        color: colorCodeToInt(color),
        last_activity: new Date().toISOString()
      })

      const rd: any = roomData
      if (rd && rd.special_keys && rd.special_keys[inputText]) {
        const special_text: String = rd.special_keys[inputText] || ""
        const array = special_text.split("\n")
        const specialText = array[Math.floor(Math.random() * array.length)]
        if (specialText) {
          await supabase.from("Messages").insert({
            room_id: roomId,
            name: chk.username,
            text: inputText + " : " + specialText,
            color: 0,
            system: true
          })
        }
      }

      await fetch('/api/dice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cache: 'no-store',
        },
        body: JSON.stringify({
          roomId: roomId,
          command: inputText
        }),
      });
    } catch (error) {
      console.error(error)
    }
    setInputText("")
    setButtonDisable(false)
  }

  const onSubmitEnter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputName === "") return
    const data = {
      action: 'enterRoom',
      roomId: roomId,
      color: colorCodeToInt(color),
      username: createTrip(inputName)
    };

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cache: 'no-store',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const chk = await checkEntered()
      if (chk.entered) {
        fetchMessages()
        fetchRealtimeData()
      }
    }
  }

  const checkEntered = async () => {
    const data = {
      action: 'checkEntered',
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
    const responseData = await response.json()
    setIsEntered(responseData.entered)
    setUsername(responseData.username || "")
    setColor(intToColorCode(responseData.color) || "#000000")

    return {
      username: responseData.username,
      entered: responseData.entered,
      id: responseData.id
    }
  }

  const onSubmitLeave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = {
      action: 'exitRoom',
      roomId: roomId
    };

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log(responseData);
  }

  const onClickRoomDescription = async () => {
    setShowRoomDescription(!showRoomDescription)
  }

  const linedDescription = (text: String) => {
    const lines = text.split('\n').map((item, index) => {
      return (
        <div>{item}</div>
      );
    })
    return lines
  }

  const inputTextKeyPress = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter') {
      onSubmitNewMessage(event)
    }
  }

  return (
    <div className="w-full max-w-4xl">
      <h2 className="text-xl font-bold pt-5 pb-5">{roomData ? roomData.title : ""}</h2>

      {!isEntered && (
        <form className="w-full" onSubmit={onSubmitEnter}>
          <div className="mb-5">

            <label htmlFor="name" className="inline-block mb-2 text-sm font-medium text-gray-900"></label>
            <span className="mb-2 text-sm font-medium text-gray-900">お名前</span>
            <span className="mb-2 text-sm font-medium text-gray-900" onClick={(event) => { setShowColorPicker(!showColorPicker) }}> [文字色]</span>
            {showColorPicker && colorPicker(inputName)}
            <input type="text" id="name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-blue-500 focus:border-blue-500 inline-block w-full p-2.5"
              name="name" value={inputName} onChange={(event) => setInputName(() => event.target.value)}></input>
          </div>
          <button type="submit" disabled={buttonDisable || inputName === ""} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
            入室
          </button>
        </form>
      )}

      {isEntered && (
        <form className="w-full" onSubmit={onSubmitLeave}>
          <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
            退室
          </button>
        </form>
      )}

      {isEntered && (
        <form className="w-full pb-10" onSubmit={onSubmitNewMessage} onKeyDown={inputTextKeyPress}>
          <div className="mb-1">
            <label htmlFor="message" className="block inline-block mb-2 font-medium text-gray-900"></label>
            <span style={{ color: color }} className="mb-2 font-medium text-gray-900">{username}</span>
            <button type="submit" disabled={buttonDisable || inputText === ""}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4
              focus:outline-none focus:ring-blue-300 font-medium rounded-lg
              text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
              発言
            </button>
            <textarea id="message" name="message" rows={1}
              className="block resize-y p-2.5 mb-2 w-full text-sm text-gray-900
                bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              value={inputText} onChange={(event) => setInputText(() => event.target.value)}
            />
          </div>
        </form>
      )}

      <div className="p-2 border border-gray-300 rounded-lg flex space-x-4">
        <span className="font-medium">
          現在の入室者:
        </span>
        {users.map((user, index) => (
          <span style={{ color: intToColorCode(user.color || 0) }} className="font-medium">
            {user.name}
          </span>
        ))}
      </div>

      <div className="p-2 text-sm border border-gray-300 rounded-lg">
        <div className="text-sm">
          <a onClick={onClickRoomDescription} href="javascript:void(0);">
            ルーム紹介 {showRoomDescription ? "[非表示]" : "[表示]"}
          </a>
        </div>
        {showRoomDescription && (
          <div className="text-xs">{
            roomData
              ? linedDescription(roomData.description || "")
              : ""}
          </div>
        )}
      </div>

      {roomData?.options && (roomData?.options as any).private && !isEntered && (
        <div className="p-2 w-full pb-10">
          未入室閲覧禁止設定です。
        </div>
      )}

      <div className="p-2 w-full mb-10">
        {messageText.map((item, index) => (
          <ChatLine message={item} index={index}></ChatLine>
        ))}
      </div>

      <div className="w-full mb-10">
        <a href={"/editRoom?roomId=" + roomId} >部屋を編集</a>
      </div>

    </div>
  )
}
