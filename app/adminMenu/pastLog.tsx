
"use client"
import { useSearchParams } from "next/navigation"
import { Database } from "@/types/supabasetype"
import { RealtimeChannel } from "@supabase/realtime-js"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import Link from "next/link"
import useSound from 'use-sound'
import ChatLine from "@/components/chat/chatLine"
import se from "../sound.mp3"

type UserData = {
  email: string;
}

export default function PastLog() {
  const searchParams = useSearchParams()
  let roomId = parseInt(searchParams.get("roomId")!!)
  let page = parseInt(searchParams.get("p")!!) || 0
  const [messages, setMessages] = useState<Database["public"]["Tables"]["Messages"]["Row"][]>([])
  const [messageText, setMessageText] = useState<Database["public"]["Tables"]["Messages"]["Row"][]>([])
  const [messageChannel, setMessageChannel] = useState<RealtimeChannel | null>(null)
  const [play, { stop, pause }] = useSound(se)
  const [roomFilter, setRoomFilter] = useState(-1)

  const fetchRealtimeData = () => {
    try {
      const channel = supabase
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
              setMessages((messages) => [{ id, room_id, name, text, color, created_at, system }, ...messages])
            }
          }
        )
        .subscribe()
      setMessageChannel(channel)

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
      setRoomFilter(roomId)
    })()
  }, [])

  useEffect(() => {
    if (roomFilter < 0) return
    (async () => {
      const res = await fetch('/api/adminPastLog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cache: 'no-store',
        },
        body: JSON.stringify({
          roomId: roomFilter,
          page: page,
        }),
        mode: 'cors',
        credentials: 'include'
      })
      const data = await res.json()
      if (data.messages != null) {
        setMessages(data.messages)
        if (messageChannel) {
          console.log('unsubscribe')
          messageChannel.unsubscribe()
        }
        fetchRealtimeData()
      } else {
        alert('管理者アカウントではありません。ログインしてください。')
      }
    })()
  }, [roomFilter])

  useEffect(() => {
    console.log(roomFilter)
    if (roomFilter) {
      setMessageText(messages.filter(message => message.room_id == roomFilter))
    } else {
      setMessageText(messages)
    }
  }, [messages, roomFilter])

  useEffect(() => {
    play()
  }, [messageText])

  return (
    <div>
      <div className="w-full max-w-3xl">
        <span onClick={() => setRoomFilter(0)}>
          フィルターをクリア {roomFilter > 0 && (<>({roomFilter})</>)}
        </span>
        {messageText.map((item, index) => (
          <ChatLine message={item} index={index} key={index} showRoomId={true} onClick={setRoomFilter}></ChatLine>
        ))}
      </div>
    </div>
  )
}