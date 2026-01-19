
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
    const [messageText, setMessageText] = useState<Database["public"]["Tables"]["Messages"]["Row"][]>([])

    useEffect(() => {
        (async () => {
            let allMessages: Database["public"]["Tables"]["Messages"]["Row"][] = []
            try {
                const { data } = await supabase.from("Messages").select("*").eq('room_id', roomId).order("created_at", { ascending: false })
                if (data != null) {
                    allMessages = data
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
                    <ChatLine message={item} index={index} key={index}></ChatLine>
                ))}
            </div>
        </div>
    )
}