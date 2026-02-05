
"use client"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, useReducer, } from "react"
import { supabase } from "@/utils/supabase/supabase"
import RoomLink, { RoomData, UserData } from '@/components/roomLink'

type Props = {
}

const PER_PAGE = 10

export default function RoomList({ }: Props) {
  const searchParams = useSearchParams()

  type AllData = {
    rooms: RoomData[]
    users: UserData[]
  }

  const [roomList, setRoomList] = useState<AllData>()
  const [loaded, setLoaded] = useState(false)
  const [serverError, setServerError] = useState(false)
  const [page, setPage] = useState(0)
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  const fetchRealtimeData = () => {
    try {
      supabase
        .channel('roomList')
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Users"
          },
          (payload) => {
            if (payload.schema !== 'UPDATE') {
              console.log('update after 10 seconds...')
              setTimeout(fetchRoomList, 10000)
            }
          }
        )
        .subscribe()
      console.log("自動更新の開始")
      return () => {
        supabase.channel('roomList').unsubscribe()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const fetchRoomList = async () => {
    console.log('fetchRoomList')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MY_SUPABASE_URL!}/storage/v1/object/public/chat/roomList.json`, {
        method: 'GET',
        cache: 'no-store'
      })
      const data: AllData = await new Response(res.body).json()
      setRoomList(data)
      return true
    } catch (error) {
      console.error(error)
    }
    return false
  }

  useEffect(() => {
    (async () => {
      if (!await fetchRoomList()) {
        setServerError(true)
      }
      setLoaded(true)
    })()
  }, [])

  useEffect(() => {
    (async () => {
      if (loaded) fetchRealtimeData()
    })()
  }, [loaded])

  return (
    <>
      {!loaded && !serverError && (
        <div className="p-2 space-x-2">
          <span>読み込み中...</span>
        </div>
      )}
      {serverError && (
        <div className="p-2 space-x-2">
          <span className="text-red-500">サーバーエラーが発生しました。時間をおいて再度お試しください。</span>
        </div>
      )}
      {loaded && roomList && (
        <>
          <ul>
            {(
              roomList.rooms
                .slice(page * PER_PAGE, (page + 1) * PER_PAGE)
                .map((room, index) => (
                  <RoomLink
                    key={index}
                    roomId={String(room.id)}
                    index={page * PER_PAGE + index + 1}
                    linkName={room.title || "unknown"}
                    users={roomList.users.filter(user => user.room_id == room.id)}>
                  </RoomLink>
                ))
            )}
          </ul>
          <div className="w-full flex flex-col items-center p-2 space-x-2">
            <div className="flex space-x-4">
              {page > 0 && (
                <span onClick={() => { setPage(page - 1) }}>前の{PER_PAGE}件</span>
              )}
              {page <= 0 && (
                <span className="opacity-20 text-gray-700">前の{PER_PAGE}件</span>
              )}
              <span> &lt; </span>
              {Array.from({ length: Math.ceil(roomList.rooms.length / PER_PAGE) }, (_, i) => i).map(i => (
                <span key={i} onClick={() => { setPage(i) }} className={i === page ? "font-bold" : ""}>{i + 1}</span>
              ))}
              <span> &gt; </span>
              {roomList.rooms.length > (page + 1) * PER_PAGE && (
                <span onClick={() => { setPage(page + 1) }}>次の{PER_PAGE}件</span>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
