import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  const client = await createClient()
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

export async function POST(request: NextRequest) {
  const client = await createClient()
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
