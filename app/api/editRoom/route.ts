
import { NextRequest, NextResponse } from 'next/server'
import { headers } from "next/headers"
import { RoomData } from "@/types/chat"
import { supabaseServiceRole } from "@/utils/supabase/supabaseServiceRole"

type ReqPayload = {
  roomData: RoomData;
  mode: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: ReqPayload = await request.json();
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || ""
    if (payload.mode === 'edit') {
      await supabaseServiceRole.from("Rooms").upsert(payload.roomData)
      return NextResponse.json({}, {
        status: 200,
        statusText: 'ok'
      })
    } else if (payload.mode === 'create') {
      delete payload.roomData.id
      const res = await supabaseServiceRole.from("Rooms").insert(payload.roomData).select('*')
      const newRoom = res?.data?.at(0)
      if (newRoom) {
        return NextResponse.json({
          newRoomId: newRoom.id
        }, {
          status: 200,
          statusText: 'ok'
        })
      }
    }
  } catch (error) {
  }
  return NextResponse.json({}, {
    status: 400,
    statusText: 'ng'
  })
}
