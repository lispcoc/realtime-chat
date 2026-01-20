
"use client"
import { useEffect, useState, useReducer, } from "react"
import { supabase } from "@/utils/supabase/supabase"
import RoomLink from '@/components/roomLink'
import { intToColorCode } from "@/utils/color/color"
import { useSearchParams } from "next/navigation"

type Props = {
}

const PER_PAGE = 10

export default function RoomList({ }: Props) {
  const searchParams = useSearchParams()
  let page = parseInt(searchParams.get("p") || "0")

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
      setUsersList((usersList) => { usersList[roomId] = responseData.users; return usersList })
    }
  }

  useEffect(() => {
    (async () => {
      let allRooms: RoomData[] = []
      try {
        console.log(page)
        const { data } = await supabase.from("Rooms").select("id,title,created_at").order("created_at").range(page * PER_PAGE, page * PER_PAGE + PER_PAGE - 1)
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
  }, [page])

  return (
    <>
      <div className="p-2 space-x-2">
        {(page > 0) && (
          <>
            <a href={`?p=${page - 1}`}>前の10件</a>
          </>
        )}
        {(rooms.length == PER_PAGE) && (
          <a href={`?p=${page + 1}`}>次の10件</a>
        )}
      </div>
      <ul>
        {rooms.map((item, index) => (
          <RoomLink key={index} roomId={String(item.id)} index={page * PER_PAGE + index + 1} linkName={item.title || "unknown"} users={usersList[item.id] || []}></RoomLink>
        ))}
      </ul>
    </>
  )
}
