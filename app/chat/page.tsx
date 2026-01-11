
"use client"
import { Database } from "@/types/supabasetype"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import { useSearchParams } from "next/navigation"
import ChatLine from "@/components/chat/chatLine"

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
              if (room_id === roomId) {
                setMessageText((messageText) => [...messageText, { id, room_id, name, text, color, created_at, system }])
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
            console.log(payload)
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

      return () => {
        supabase.channel(String(roomId)).unsubscribe()
        supabase.channel(`users_${roomId}`).unsubscribe()
      }
    } catch (error) {
      console.error(error)
    }
  }

  // 初回のみ実行するために引数に空の配列を渡している
  useEffect(() => {
    (async () => {

      try {
        const { data } = await supabase.from("Rooms").select("*").eq('id', roomId).order("created_at")
        if (data && data[0]) {
          setRoomData(data[0])
        }
      } catch (error) {
        console.error(error)
        alert("部屋データの取得に失敗しました。")
        return
      }

      let allMessages = null
      try {
        const { data } = await supabase.from("Messages").select("*").eq('room_id', roomId).order("created_at", { ascending: true }).limit(10)

        allMessages = data
      } catch (error) {
        console.error(error)
      }
      if (allMessages != null) {
        setMessageText(allMessages.reverse())
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

    })()
    fetchRealtimeData()
    checkEntered()
  }, [])

  const onSubmitNewMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputText === "") return
    const chk = await checkEntered()
    if (!chk.entered) {
      alert("入室していません。")
      return
    }

    try {
      await supabase.from("Messages").insert({
        room_id: roomId,
        name: chk.username,
        text: inputText,
        color: 0,
        system: false
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
            text: specialText,
            color: 0,
            system: true
          })
        }
      }
    } catch (error) {
      console.error(error)
    }
    setInputText("")
  }

  const onSubmitEnter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputName === "") return
    const data = {
      action: 'enterRoom',
      roomId: roomId,
      username: inputName
    };

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cache: 'no-store',
      },
      body: JSON.stringify(data),
    });

    //const responseData = await response.json();
    //console.log(responseData);
  }

  const checkEntered = async () => {
    const data = {
      action: 'checkEntered',
      roomId: roomId
    };
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cache: 'no-store',
      },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    setIsEntered(responseData.entered)
    setUsername(responseData.username)

    return {
      username: responseData.username,
      entered: responseData.entered
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

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold pt-5 pb-10">{roomData ? roomData.title : ""}</h2>

      {!isEntered && (
        <form className="w-full max-w-md pb-10" onSubmit={onSubmitEnter}>
          <div className="mb-5">
            <label htmlFor="name" className="inline-block mb-2 text-sm font-medium text-gray-900"></label>
            <span className="mb-2 text-sm font-medium text-gray-900">名前</span>
            <input type="text" id="name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-blue-500 focus:border-blue-500 inline-block w-full p-2.5"
              name="name" value={inputName} onChange={(event) => setInputName(() => event.target.value)}></input>
          </div>
          <button type="submit" disabled={inputName === ""} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
            入室
          </button>
        </form>
      )}

      {isEntered && (
        <form className="w-full max-w-md pb-10" onSubmit={onSubmitLeave}>
          <button type="submit" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
            退室
          </button>
        </form>
      )}

      <form className="w-full max-w-md pb-10" onSubmit={onSubmitNewMessage}>

        {isEntered && (
          <div className="mb-1">
            <label htmlFor="message" className="block inline-block mb-2 font-medium text-gray-900"></label>
            <span className="mb-2 text-sm font-medium text-gray-900">{username}</span>
            <input type="text" id="message" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-blue-500 focus:border-blue-500 inline-block w-full p-2.5"
              name="message" value={inputText} onChange={(event) => setInputText(() => event.target.value)}></input>
            <button type="submit" disabled={inputText === ""} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
              発言
            </button>
          </div>
        )}

      </form>

      <div className="mb-5 flex space-x-4">
        <span className="font-medium">
          現在の入室者:
        </span>
        {users.map((user, index) => (
          <span className="font-medium">
            {user.name}
          </span>
        ))}
      </div>

      <div className="w-full max-w-3xl mb-10">
        {messageText.reverse().map((item, index) => (
          <ChatLine message={item} index={index}></ChatLine>
        ))}
      </div>

      <div className="w-full max-w-3xl mb-10">
        <a href={"/editRoom?roomId=" + roomId} >部屋を編集</a>
      </div>

    </div>
  )
}
