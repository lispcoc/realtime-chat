import { NextRequest, NextResponse } from 'next/server'
import { createClient, createSupabaseServerForAPI } from "@/utils/supabase/server"

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
  const { roomId, command, username } = await request.json();

  return NextResponse.json(
    { error: "Basic Auth Required" },
    {
      headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      status: 401,
    }
  )
}
