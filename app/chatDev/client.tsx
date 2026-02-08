'use client'
import { Database } from "@/types/supabasetype"
import { supabase } from '@/utils/supabase/supabase'
import { intToColorCode, colorCodeToInt } from "@/utils/color/color"
import { createTrip } from "2ch-trip"

export type RoomInfo = Omit<Database["public"]["Tables"]["Rooms"]["Row"], 'password' | 'owner'>
export type RoomData = Database["public"]["Tables"]["RoomData"]["Row"]
export type Message = Database["public"]["Tables"]["Messages"]["Row"]
export type SendMessage = Database["public"]["Tables"]["Messages"]["Insert"]

type SendUser = Database["public"]["Tables"]["Users"]["Insert"]

type Packet<T> = {
  type: T extends Message ? "message"
  : T extends SendMessage ? "message"
  : T extends SendUser ? "enterRoom" | "exitRoom"
  : "error"
  room_id: number,
  data: T
}

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

export async function getRoomData(roomId: number): Promise<RoomData | null> {
  const { data, error } = await supabase
    .from("RoomData")
    .select("*")
    .eq("id", roomId)
    .single()
  return data || null
}

export async function sendMessage(socket: WebSocket | null, data: SendMessage) {
  if (socket && data.room_id) {
    const packet: Packet<SendMessage> = {
      type: "message",
      room_id: data.room_id,
      data: data,
    }
    socket.send(JSON.stringify(packet))
    return true
  }
  return false
}

export async function enterRoom(socket: WebSocket | null, data: SendUser) {
  if (socket && data.room_id) {
    const packet: Packet<SendUser> = {
      type: "enterRoom",
      room_id: data.room_id,
      data: data,
    }
    socket.send(JSON.stringify(packet))
  }
}

export async function exitRoom(socket: WebSocket | null, data: SendUser) {
  if (socket && data.room_id) {
    const packet: Packet<SendUser> = {
      type: "exitRoom",
      room_id: data.room_id,
      data: data,
    }
    socket.send(JSON.stringify(packet))
  }
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
