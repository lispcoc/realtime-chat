
"use client"
import { Database } from "@/types/supabasetype"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import { useSearchParams } from "next/navigation"

export default function Chat() {
  const searchParams = useSearchParams()
  let roomId = parseInt(searchParams.get("roomId")!!)
  const [inputText, setInputText] = useState("")
  const [inputName, setInputName] = useState("")
  const [messageText, setMessageText] = useState<Database["public"]["Tables"]["Messages"]["Row"][]>([])
  const [roomData, setRoomData] = useState<Database["public"]["Tables"]["Rooms"]["Row"]>()

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
              const { room_id, name, text, color, created_at, system } = payload.new
              setMessageText((messageText) => [...messageText, { room_id, name, text, color, created_at, system }])
            }
          }
        )
        .subscribe()

      return () => supabase.channel(String(roomId)).unsubscribe()
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
        return
      }

      let allMessages = null
      try {
        const { data } = await supabase.from("Messages").select("*").eq('room_id', roomId).order("created_at")

        allMessages = data
      } catch (error) {
        console.error(error)
      }
      if (allMessages != null) {
        setMessageText(allMessages)
      }
    })()
    fetchRealtimeData()
  }, [])

  const onSubmitNewMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inputName === "") return
    if (inputText === "") return
    try {
      let userID = localStorage.getItem("username")
      if (userID == undefined) {
        localStorage.setItem("username", inputName)
      }
      await supabase.from("Messages").insert({
        room_id: roomId,
        name: inputName,
        text: inputText,
        color: 0,
        system: false
      })
    } catch (error) {
      console.error(error)
    }
    setInputText("")
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center p-2">
      <h1 className="text-3xl font-bold pt-5 pb-10">{roomData ? roomData.title : ""}</h1>
      <div className="w-full max-w-3xl mb-10 border-t-2 border-x-2">
        {messageText.map((item, index) => (
          item.text
        ))}
      </div>

      <form className="w-full max-w-md pb-10" onSubmit={onSubmitNewMessage}>
        <div className="mb-5">
          <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900">名前</label>
          <input type="text" id="name" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            name="name" value={inputName} onChange={(event) => setInputName(() => event.target.value)}></input>
        </div>
        <div className="mb-5">
          <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900"></label>
          <input type="text" id="message" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            name="message" value={inputText} onChange={(event) => setInputText(() => event.target.value)}></input>
        </div>

        <button type="submit" disabled={inputName === "" || inputText === ""} className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center disabled:opacity-25">
          発言
        </button>
      </form>
    </div>
  )
}
