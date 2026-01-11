
"use client"
import { Database } from "@/types/supabasetype"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import ThreadLink from '@/components/threadLink'
import ChatUI from "@/components/chats/chat"

export default async function Index() {
  const [rooms, appendRooms] = useState<Database["public"]["Tables"]["Rooms"]["Row"][]>([])

  useEffect(() => {
    (async () => {
      let allRooms = null
      try {
        const { data } = await supabase.from("Rooms").select("*").order("created_at")

        allRooms = data
      } catch (error) {
        console.error(error)
      }
      if (allRooms != null) {
        appendRooms(allRooms)
      }
    })()
  }, [])

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <h1 className="text-3xl font-bold pt-6 pb-10">リアルタイムチャットアプリ</h1>
      <div className="w-full max-w-3xl mb-10 border-t-2 border-x-2">
        {rooms.map((item, index) => (
          <a href={"?roomId=" + item.id}>{item.title}</a>
        ))}
      </div>
      <ul>
        <ThreadLink channelName='thread1' linkName='スレッド1'></ThreadLink>
        <ThreadLink channelName='thread2' linkName='スレッド2'></ThreadLink>
        <ThreadLink channelName='thread3' linkName='スレッド3'></ThreadLink>
        <ThreadLink channelName='thread4' linkName='スレッド4'></ThreadLink>
        <ThreadLink channelName='thread5' linkName='スレッド5'></ThreadLink>
      </ul>
    </div>
  )
}
