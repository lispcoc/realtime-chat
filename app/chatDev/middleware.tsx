'use server'
import { Database } from "@/types/supabasetype"
import { supabase } from '@/utils/supabase/supabase'
import { getRoomVariableServer, setRoomVariableServer } from './server'

export type RoomInfo = Omit<Database["public"]["Tables"]["Rooms"]["Row"], 'password' | 'owner'>

export type RoomVariable = {
  [key: string]: number
}

export async function getRoomVariable(roomId: number): Promise<RoomVariable> {
  const vars = await getRoomVariableServer(roomId)
  return vars
}

export async function setRoomVariable(roomId: number, key: string, value: number): Promise<RoomVariable> {
  const vars = await setRoomVariableServer(roomId, key, value)
  return vars
}

export async function incrementRoomVariable(roomId: number, key: string, incrementBy: number): Promise<RoomVariable> {
  const vars = await getRoomVariableServer(roomId)
  const currentValue = vars[key] || 0
  const newValue = currentValue + incrementBy
  const updatedVars = await setRoomVariableServer(roomId, key, newValue)
  return updatedVars
}

export async function decrementRoomVariable(roomId: number, key: string, decrementBy: number): Promise<RoomVariable> {
  const vars = await getRoomVariableServer(roomId)
  const currentValue = vars[key] || 0
  const newValue = currentValue - decrementBy
  const updatedVars = await setRoomVariableServer(roomId, key, newValue)
  return updatedVars
}

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
