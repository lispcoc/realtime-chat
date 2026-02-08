'use client'
import { Database } from "@/types/supabasetype"
import { supabase } from '@/utils/supabase/supabase'
import { intToColorCode, colorCodeToInt } from "@/utils/color/color"
import { createTrip } from "2ch-trip"

export type RoomInfo = Omit<Database["public"]["Tables"]["Rooms"]["Row"], 'password' | 'owner'>
export type SendMessage = Database["public"]["Tables"]["Messages"]["Insert"]

export type EnterRoomResponse = {
  success: boolean
  id: string
  reason: string
}

export type IsEnteredRoomResponse = {
  username: string
  entered: boolean
  id: string
  color: number
}

type User = {
  color: number;
  name: string;
  id: string;
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

export async function sendMessage(data: SendMessage) {
  return supabase.from("Messages").insert(data)
}

export async function enterRoom(roomId: number, name: string, color: string): Promise<EnterRoomResponse | null> {
  const response = await supabase.functions.invoke('database-access', {
    body: {
      action: 'enterRoom',
      roomId: roomId,
      color: colorCodeToInt(color),
      username: createTrip(name),
      userId: localStorage.getItem("userId") || null
    }
  })
  return response.data
}

export async function exitRoom(roomId: number): Promise<void> {
  await supabase.functions.invoke('database-access', {
    body: {
      action: 'exitRoom',
      roomId: roomId,
      userId: localStorage.getItem("userId") || null
    }
  })
}

export async function isEnteredRoom(roomId: number): Promise<IsEnteredRoomResponse> {
  const response = await supabase.functions.invoke('database-access', {
    body: {
      action: 'checkEntered',
      roomId: roomId,
      userId: localStorage.getItem("userId") || null
    },
  })
  return response.data
}

export async function getUsers(roomId: number): Promise<User[]> {
  const response = await supabase.functions.invoke('database-access', {
    body: { action: 'getUsers', roomId: roomId },
  })
  return response.data.users
}
