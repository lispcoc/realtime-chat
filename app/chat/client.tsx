'use client'
import { Database } from "@/types/supabasetype"
import { supabase } from '@/utils/supabase/supabase'

export type RoomInfo = Omit<Database["public"]["Tables"]["Rooms"]["Row"], 'password' | 'owner'>

export async function getRoomInfo(roomId: number): Promise<{ info: RoomInfo, authenticated: boolean } | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_MY_SUPABASE_URL!}/storage/v1/object/public/rooms/${roomId}.json`, {
      method: 'GET',
      cache: 'no-store'
    })
    if (res.ok) {
      const info = await new Response(res.body).json()
      if (info) return { info, authenticated: true }
    } else {
      const { response, data } = await supabase.functions.invoke('roomInfo', {
        body: { roomId: roomId },
      })
      if (data) {
        return data.info
      }
    }
    return null
  } catch (error) {
    console.error(error)
    alert("部屋データの取得に失敗しました。")
    return null
  }
}
