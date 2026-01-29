import { oauth2Client } from '@/lib/google/oauth'
import { google } from 'googleapis'
import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { tokens } = await request.json()

  if (tokens) {
    (await cookies()).set('session', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
  }

  const currentSessionToken = (await cookies()).get('session')?.value || "{}"

  oauth2Client.setCredentials(tokens || JSON.parse(currentSessionToken))
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: "v2"
  })

  const res = await oauth2.userinfo.get()

  return NextResponse.json(
    { result: 'ok', res: res },
    { status: 200 }
  )
}
