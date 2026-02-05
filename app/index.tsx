
"use client"
import { Suspense, useEffect, useState, useReducer } from "react"
import { useRouter } from 'next/navigation'
import { supabase } from "@/utils/supabase/supabase"
import RoomLink from '@/components/roomLink'
import { intToColorCode } from "@/utils/color/color"
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
    if (afterLoginPath) {
      localStorage.removeItem('afterLoginPath')
      router.push(afterLoginPath)
    }
  }, [])

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="w-full max-w-3xl mb-10">
        <h2 className="text-xl font-bold pt-6 pb-4">ルーム一覧</h2>
        <Suspense fallback={<>...</>}>
          <RoomList />
        </Suspense >
      </div>
    </div>
  )
}
