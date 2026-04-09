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

export async function modifyRoomVariable(roomId: number, key: string, delta: number): Promise<RoomVariable> {
  return modifyRoomVariableServer(roomId, key, delta)
}
