import { NextRequest, NextResponse } from 'next/server'
import { createClient, createSupabaseServerForAPI } from "@/utils/supabase/server"
import { Database } from '@/types/supabasetype'
import { supabase } from "@/utils/supabase/supabase"

export async function GET() {
  const client = await createClient()
  const res = await client.auth.getUser()
  if (res.data) {

    return NextResponse.json(
      {
        status: 200,
      }
    )
  }

  return NextResponse.json(
    { error: "Basic Auth Required" },
    {
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      status: 401,
    }
  )
}

export async function POST(request: NextRequest) {
  const client = await createClient()
  const res = await client.auth.getUser()
  const { roomId, page } = await request.json();
  if (res.data) {
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
        messages: allMessages
      },
      {
        status: 200
      }
    )
  }

  return NextResponse.json(
    { error: "Basic Auth Required" },
    {
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      status: 401,
    }
  )
}
