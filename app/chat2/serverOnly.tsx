import 'server-only'
import { Database } from '@/types/supabasetype'
import { supabase } from '@/utils/supabase/supabase'

export type RoomVariable = {
  [key: string]: number
}

type RoomOption = {
  private: boolean
  user_limit: number,
  all_clear: string,
  use_trump: boolean,
  variables: string[]
}

type Message = Database["public"]["Tables"]["Messages"]["Insert"]

export async function addMessageServer(msg: Message) {
  await supabase.from("Messages").insert(msg)
}

async function initRoomVariables(roomId: number): Promise<RoomVariable> {
  const { data: roomInfo } = await supabase.from("Rooms").select("*").eq("id", roomId).single()
  if (roomInfo) {
    const options = roomInfo.options as RoomOption || {}
    if (options.variables) {
      const vars: RoomVariable = {}
      options.variables.forEach((key) => {
        vars[key] = 0
      })
      await supabase.from("RoomData").upsert({ id: roomId, variables: vars })
      return vars
    }
  }
  return {}
}

export async function getRoomVariableServer(roomId: number): Promise<RoomVariable> {
  const { data } = await supabase.from("RoomData").select("*").eq("id", roomId).single()
  if (!data) {
    return initRoomVariables(roomId)
  }
  return data?.variables as RoomVariable || {}
}

export async function setRoomVariableServer(roomId: number, key: string, value: number): Promise<RoomVariable> {
  const { data } = await supabase.from("RoomData").select("*").eq("id", roomId).single()
  if (!data) {
    return initRoomVariables(roomId)
  }
  const variables = data?.variables as RoomVariable || {}
  const oldValue = variables[key] || 0
  variables[key] = value
  await supabase.from("RoomData").update({ variables }).eq("id", roomId)
  await addMessageServer({
    color: 0,
    name: "system",
    room_id: roomId,
    system: true,
    text: `${key} : ${oldValue} → ${value}`
  })
  return variables
}
