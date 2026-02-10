
"use client"
import { useEffect } from "react"
import { useRouter } from 'next/navigation'
import style from "@/components/style"
import RoomList from "./roomList"

export default function Index() {
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

  useEffect(() => {
    const afterLoginPath = localStorage.getItem('afterLoginPath')
    const afterLoginRoomId = localStorage.getItem('afterLoginRoomId')
    localStorage.removeItem('afterLoginPath')
    localStorage.removeItem('afterLoginRoomId')
    if (afterLoginPath) {
      if (afterLoginRoomId) {
        router.push(`${afterLoginPath}?roomId=${afterLoginRoomId}`)
      } else {
        router.push(afterLoginPath)
      }
    }
  }, [])

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="w-full max-w-3xl mb-10">
        <h2 className="text-xl font-bold pt-6 pb-4">ルーム一覧</h2>
        <RoomList />
        <div className="w-full mb-12">
          <a href="/adminMenu" className={style.linkThin}>管理者用メニュー</a>
        </div>
      </div>
    </div>
  )
}
