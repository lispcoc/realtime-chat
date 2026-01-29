
"use client"
import { useSearchParams } from "next/navigation"
import { Database } from "@/types/supabasetype"
import { RealtimeChannel } from "@supabase/realtime-js"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import ChatLine from "@/components/chat/chatLine"

type UserData = {
  email: string;
}

export default function PastLog() {
  const searchParams = useSearchParams()
  let roomId = parseInt(searchParams.get("roomId")!!)
  let page = parseInt(searchParams.get("p")!!) || 0
  const [messageText, setMessageText] = useState<Database["public"]["Tables"]["Messages"]["Row"][]>([])
  let messageChannel: RealtimeChannel | null = null

  const fetchRealtimeData = () => {
    try {
      if (roomId) {
        messageChannel = supabase
          .channel(String(roomId))
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "Messages",
              filter: `room_id=eq.${roomId}`
            },
            (payload) => {
              if (payload.eventType === "INSERT") {
                const { id, room_id, name, text, color, created_at, system } = payload.new
                setMessageText((messageText) => [{ id, room_id, name, text, color, created_at, system }, ...messageText.filter(msg => msg.id >= 0 && msg.id != id)])
              }
            }
          )
          .subscribe()
      } else {
        messageChannel = supabase
          .channel('all_logs')
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "Messages"
            },
            (payload) => {
              if (payload.eventType === "INSERT") {
                const { id, room_id, name, text, color, created_at, system } = payload.new
                setMessageText((messageText) => [{ id, room_id, name, text, color, created_at, system }, ...messageText.filter(msg => msg.id >= 0 && msg.id != id)])
              }
            }
          )
          .subscribe()
      }

      console.log("自動更新の開始")
      return () => {
        supabase.channel(String(roomId)).unsubscribe()
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/adminPastLog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cache: 'no-store',
        },
        body: JSON.stringify({
          roomId: roomId,
          page: page,
        }),
        mode: 'cors',
        credentials: 'include'
      })
      const result = await res.json();
      if (result.messages != null) {
        setMessageText(result.messages)
        fetchRealtimeData()
      } else {
        alert('管理者アカウントではありません。ログインしてください。')
      }
    })()
  }, [])

  return (
    <div>
      <div className="w-full max-w-3xl">
        {messageText.map((item, index) => (
          <ChatLine message={item} index={index} key={index} showRoomId={true}></ChatLine>
        ))}
      </div>
    </div>
  )
}