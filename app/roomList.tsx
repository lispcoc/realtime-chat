
"use client"
import { useEffect, useState, useReducer, } from "react"
import { supabase } from "@/utils/supabase/supabase"
import RoomLink from '@/components/roomLink'
import { useSearchParams } from "next/navigation"
import { useRouter } from 'next/navigation'

type Props = {
}

const PER_PAGE = 10

export default function RoomList({ }: Props) {
  const searchParams = useSearchParams()
  let page = parseInt(searchParams.get("p") || "0")
  const authCode = searchParams.get("code") || null
  const router = useRouter()

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
  const [loaded, setLoaded] = useState(false)
  const [serverError, setServerError] = useState(false)
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
        const response = await supabase.functions.invoke('roomList', {
          body: { page: page },
        })
        if (response.data) {
          allRooms = response.data.rooms
          setLoaded(true)
        } else {
          setServerError(true)
        }
      } catch (error) {
        console.error(error)
        setServerError(true)
      }
      if (allRooms) {
        appendRooms(allRooms)
        allRooms.forEach(room => {
          getUsers(room.id).then(() => { forceUpdate() })
        })
      }

      if (authCode) {
        const res = await fetch('/api/auth/google-oauth/getToken', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            cache: 'no-store',
          },
          body: JSON.stringify({
            code: authCode
          })
        })
        const data = await res.json()
        if (data.result === 'ok') {
          localStorage.setItem('google-auth-tokens', JSON.stringify(data.tokens))
        }
        router.push('/')
      }
    })()
  }, [page])

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
      {loaded && (
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
      )}
    </>
  )
}
