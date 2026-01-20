
"use client"
import { supabase } from "@/utils/supabase/supabase"
import { use, useEffect, useState, Suspense } from "react"
import { Database, Json } from "@/types/supabasetype"
import ChatLine from "@/components/chat/chatLine"

export default function Test() {
    const [messageText, setMessageText] = useState("aaa")

    const access = supabase.functions.invoke('database-access', {
        body: { name: 'Functions' },
    }).then(res => {
        console.log(res)
        setMessageText(JSON.stringify(res.data))
    })

    useEffect(() => {
        (() => {

        })
    }, [])

    return (
        <div className="w-full max-w-3xl">
            {messageText}
            <div className="w-full max-w-3xl">
                {messageText && (
                    <>
                        {messageText}
                    </>
                )}
            </div>
            <div className="w-full max-w-3xl">
                aaa
            </div>
        </div>
    )
}
