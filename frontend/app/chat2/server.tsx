'use server'
import { getRoomVariableServer, setRoomVariableServer, modifyRoomVariableServer } from './serverOnly'

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
  return modifyRoomVariableServer(roomId, key, incrementBy)
}

export async function decrementRoomVariable(roomId: number, key: string, decrementBy: number): Promise<RoomVariable> {
  return modifyRoomVariableServer(roomId, key, -decrementBy)
}
