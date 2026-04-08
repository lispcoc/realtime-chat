import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerForAPI } from "@/utils/supabase/server"
import { supabase } from "@/utils/supabase/supabase"

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
  //const client = createSupabaseServerForAPI(request)
  //const res = await client.auth.getUser()
  const { access_token, refresh_token } = await request.json();

  const res = await supabase.auth.setSession({ access_token: access_token, refresh_token: refresh_token })
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
