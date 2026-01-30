import { oauth2Client, refreshTokenIfNeeded } from '@/lib/google/oauth'
import { google } from 'googleapis'
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
    await refreshTokenIfNeeded()
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2"
    })
    const res = await oauth2.userinfo.get()
    const owner = res.data.email
    if (!owner) {
      return NextResponse.json({
        message: '認証エラー'
      }, {
        status: 400,
        statusText: 'ng'
      })
    }
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
