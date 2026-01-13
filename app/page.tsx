
"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/utils/supabase/supabase"
import RoomLink from '@/components/roomLink'

export default function Index() {
  type RoomData = {
    id: number,
    title: string | null,
    created_at: string
  }
  const [rooms, appendRooms] = useState<RoomData[]>([])

  useEffect(() => {
    (async () => {
      let allRooms = null
      try {
        const { data } = await supabase.from("Rooms").select("id,title,created_at").order("created_at")
        allRooms = data
        console.log(allRooms)
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
      <div className="w-full max-w-3xl mb-10">
        <h2 className="text-xl font-bold pt-6 pb-10">ルーム一覧</h2>
        <ul>
          {rooms.map((item, index) => (
            <RoomLink roomId={String(item.id)} index={index} linkName={item.title || "unknown"}></RoomLink>
          ))}
        </ul>
      </div>
    </div>
  )
}
