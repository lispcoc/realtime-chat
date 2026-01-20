
"use client"
import { useEffect, useState, useReducer } from "react"
import { supabase } from "@/utils/supabase/supabase"
import RoomLink from '@/components/roomLink'
import { intToColorCode } from "@/utils/color/color"

export default function Index() {
  type RoomData = {
    id: number,
    title: string | null,
    created_at: string
  }

  type UserData = {
    color: number,
    name: string
  }

  const [rooms, appendRooms] = useState<RoomData[]>([])
  const [usersList, setUsersList] = useState<UserData[][]>([])
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  const getUsers = async (roomId: number) => {
    const response = await supabase.functions.invoke('database-access', {
      body: { action: 'getUsers', roomId: roomId },
    })
    if (response.data) {
      const responseData = response.data
      console.log(responseData.users)
      setUsersList((usersList) => { usersList[roomId] = responseData.users; return usersList })
    }
  }

  useEffect(() => {
    (async () => {
      let allRooms: RoomData[] = []
      try {
        const { data } = await supabase.from("Rooms").select("id,title,created_at").order("created_at")
        if (data) {
          allRooms = data
          console.log(allRooms)
        }
      } catch (error) {
        console.error(error)
      }
      if (allRooms) {
        appendRooms(allRooms)
        allRooms.forEach(room => {
          getUsers(room.id).then(() => { forceUpdate() })
        })
      }
    })()
  }, [])

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="w-full max-w-3xl mb-10">
        <h2 className="text-xl font-bold pt-6 pb-10">ルーム一覧</h2>
        <ul>
          {rooms.map((item, index) => (
            <RoomLink key={index} roomId={String(item.id)} index={index} linkName={item.title || "unknown"} users={usersList[item.id] || []}></RoomLink>
          ))}
        </ul>
      </div>
    </div>
  )
}
