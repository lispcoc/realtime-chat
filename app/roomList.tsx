
"use client"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, useReducer, } from "react"
import RoomLink from '@/components/roomLink'

type Props = {
}

const PER_PAGE = 10

export default function RoomList({ }: Props) {
  const searchParams = useSearchParams()

  type RoomData = {
    id: number
    title: string | null
    created_at: string
  }

  type UserData = {
    color: number
    name: string
    room_id: number
  }

  type AllData = {
    rooms: RoomData[]
    users: UserData[]
  }

  const [roomList, setRoomList] = useState<AllData>()
  const [loaded, setLoaded] = useState(false)
  const [serverError, setServerError] = useState(false)
  const [page, setPage] = useState(0)
  const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_MY_SUPABASE_URL!}/storage/v1/object/public/chat/roomList.json`, {
          method: 'GET'
        })
        const data: AllData = await new Response(res.body).json()
        setRoomList(data)
        setLoaded(true)
      } catch (error) {
        console.error(error)
        setServerError(true)
        setLoaded(true)
      }
    })()
  }, [])

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
          <div className="p-2 space-x-2">
            {page > 0 && (
              <span onClick={() => { setPage(page - 1) }}>前の10件</span>
            )}
            {page <= 0 && (
              <span className="opacity-20 text-gray-700">前の10件</span>
            )}
            <> / </>
            {roomList.rooms.length > (page + 1) * PER_PAGE && (
              <span onClick={() => { setPage(page + 1) }}>次の10件</span>
            )}
          </div>
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
        </>
      )}
    </>
  )
}
