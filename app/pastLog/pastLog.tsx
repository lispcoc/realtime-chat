
"use client"
import { Database } from "@/types/supabasetype"
import { Suspense, useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import { v4 } from "uuid"
import { useSearchParams } from "next/navigation"
import ChatLine from "@/components/chat/chatLine"

type UserData = {
  email: string;
}

export default function PastLog() {
  const searchParams = useSearchParams()
  let roomId = parseInt(searchParams.get("roomId")!!)
  let page = parseInt(searchParams.get("p")!!) || 0
  const [messageText, setMessageText] = useState<Database["public"]["Tables"]["Messages"]["Row"][]>([])

  useEffect(() => {
    (async () => {
      const tokenstr = localStorage.getItem('sb-rtchat-auth-token')
      if (tokenstr) {
        const token = JSON.parse(tokenstr)
        const res = await fetch('/api/adminPastLog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cache: 'no-store',
          },
          body: JSON.stringify({
            roomId: roomId,
            page: page,
            access_token: token.access_token,
            refresh_token: token.refresh_token
          }),
          mode: 'cors',
          credentials: 'include'
        })
        const result = await res.json();
        if (result.messages != null) {
          setMessageText(result.messages)
        }
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