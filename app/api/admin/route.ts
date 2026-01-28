import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerForAPI } from "@/utils/supabase/server"

export async function GET(request: Request) {
  const client = createSupabaseServerForAPI(request)
  const res = await client.auth.getUser()

  if (res.data && res.data.user && res.data.user.email === process.env.ADMIN_EMAIL) {
    return NextResponse.json(
      { result: 'ok' },
      { status: 200 }
    )
  }

  return NextResponse.json(
    { result: 'ng', res: res },
    { status: 200 }
  )
}

export async function POST(request: Request) {
  const client = createSupabaseServerForAPI(request)
  const res = await client.auth.getUser()
  //const { roomId, command, username } = await request.json();

  if (res.data && res.data.user && res.data.user.email === process.env.ADMIN_EMAIL) {
    return NextResponse.json(
      { result: 'ok' },
      { status: 200 }
    )
  }

  return NextResponse.json(
    { result: 'ng' },
    { status: 200 }
  )
}
