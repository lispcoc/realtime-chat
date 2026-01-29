import { oauth2Client } from '@/lib/google/oauth'
import { google } from 'googleapis'
import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const currentSessionToken = (await cookies()).get('session')?.value || "{}"
    oauth2Client.setCredentials(JSON.parse(currentSessionToken))
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2"
    })

    const res = await oauth2.userinfo.get()

    return NextResponse.json(
      { result: 'ok', res: res },
      { status: 200 }
    )
  } catch (error) {
  }

  return NextResponse.json(
    { result: 'ng' },
    { status: 200 }
  )
}
