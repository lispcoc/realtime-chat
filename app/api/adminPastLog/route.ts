import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@/utils/supabase/server"
import { Database } from '@/types/supabasetype'
import { supabase } from "@/utils/supabase/supabase"
import { google } from 'googleapis'
import { oauth2Client } from '@/lib/google/oauth'
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { roomId, page } = await request.json();
    const currentSessionToken = (await cookies()).get('session')?.value
    console.log(currentSessionToken)
    if (currentSessionToken) {
      oauth2Client.setCredentials(JSON.parse(currentSessionToken))
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2"
      })
      const res = await oauth2.userinfo.get()
      console.log(res.data)
      if (res && res.data && res.data.email === process.env.ADMIN_EMAIL) {
        let allMessages: Database["public"]["Tables"]["Messages"]["Row"][] = []
        try {
          if (roomId) {
            const { data } = await supabase.from("Messages").select("*").eq('room_id', roomId).order("created_at", { ascending: false }).range(page * 1000, (page + 1) * 1000)
            if (data != null) {
              allMessages = data
            }
          } else {
            const { data } = await supabase.from("Messages").select("*").order("created_at", { ascending: false }).range(page * 1000, (page + 1) * 1000)
            if (data != null) {
              allMessages = data
            }
          }
        } catch (error) {
          console.error(error)
        }
        return NextResponse.json(
          {
            result: 'ok',
            messages: allMessages
          },
          { status: 200 }
        )
      }
    }
  } catch (error) {
  }

  return NextResponse.json(
    { result: 'ng' },
    { status: 200 }
  )
}
