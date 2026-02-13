'use client'
import { Database } from "@/types/supabasetype"
import { supabase } from '@/utils/supabase/supabase'
import { intToColorCode, colorCodeToInt } from "@/utils/color/color"
import { createTrip } from "2ch-trip"

export type RoomInfo = Omit<Database["public"]["Tables"]["Rooms"]["Row"], 'password' | 'owner'>
export type RoomData = Database["public"]["Tables"]["RoomData"]["Row"]
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

const url = process.env.NEXT_PUBLIC_MY_SUPABASE_URL!

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

export async function getRoomData(roomId: number): Promise<RoomData | null> {
  const { data, error } = await supabase
    .from("RoomData")
    .select("*")
    .eq("id", roomId)
    .single()
  return data || null
}

export async function sendMessage(data: SendMessage) {
  return supabase.from("Messages").insert(data)
}

export async function enterRoom(roomId: number, name: string, color: string): Promise<EnterRoomResponse | null> {
  const res = await fetch(`${url}/ws/`, {
    method: 'POST',
    body: JSON.stringify({
      'action': 'enterRoom',
      user: {
        id: localStorage.getItem("userId") || null,
        name: name,
        room_id: roomId,
        color: colorCodeToInt(color)
      }
    })
  })
  return await res.json()
}

export async function exitRoom(roomId: number): Promise<void> {
  const res = await fetch(`${url}/ws/`, {
    method: 'POST',
    body: JSON.stringify({
      'action': 'exitRoom',
      roomId: roomId,
      userId: localStorage.getItem("userId") || null
    })
  })
}

export async function isEnteredRoom(roomId: number): Promise<IsEnteredRoomResponse> {
  const res = await fetch(`${url}/ws/`, {
    method: 'POST',
    body: JSON.stringify({
      'action': 'isEnteredRoom',
      roomId: roomId,
      userId: localStorage.getItem("userId") || null
    })
  })
  return await res.json()
}

export async function getUsers(roomId: number): Promise<User[]> {
  const res = await fetch(`${url}/ws/`, {
    method: 'POST',
    body: JSON.stringify({
      'action': 'getUsers',
      roomId: roomId,
    })
  })
  return (await res.json()).users
}

export async function updateUser(roomId: number, user: User): Promise<void> {
  const res = await fetch(`${url}/ws/`, {
    method: 'POST',
    body: JSON.stringify({
      'action': 'updateUser',
      roomId: roomId,
      user: user
    })
  })
}

export async function allClear(roomId: number): Promise<void> {
  await supabase.from("RoomData").upsert({
    id: roomId,
    all_clear_at: new Date().toISOString()
  })
  sendMessage({
    color: 0,
    name: "system",
    room_id: roomId,
    system: true,
    text: `ルームログが消去されました。`
  })
}
