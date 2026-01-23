
"use client"
import { Database } from "@/types/supabasetype"
import { Suspense, useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import { v4 } from "uuid"
import { useSearchParams } from "next/navigation"
import ChatLine from "@/components/chat/chatLine"

export default function PastLog() {
    const searchParams = useSearchParams()
    let roomId = parseInt(searchParams.get("roomId")!!)
    let page = parseInt(searchParams.get("p")!!) || 0
    const [messageText, setMessageText] = useState<Database["public"]["Tables"]["Messages"]["Row"][]>([])

    useEffect(() => {
        (async () => {
            let allMessages: Database["public"]["Tables"]["Messages"]["Row"][] = []
            try {
                if (roomId) {
                    const { data } = await supabase.from("Messages").select("*").eq('room_id', roomId).order("created_at", { ascending: false }).range(page * 1000, (page + 1) * 1000)
                    if (data != null) {
                        allMessages = data
                    }
                } else {
                    const { data } = await supabase.from("Messages").select("*").order("created_at", { ascending: false }).range(page * 1000, (page + 1) * 1000)
                    if (data != null) {
                        allMessages = data
                    }
                }
            } catch (error) {
                console.error(error)
            }
            if (allMessages != null) {
                setMessageText(allMessages)
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