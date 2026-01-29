import { oauth2Client } from '@/lib/google/oauth'
import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const currentCookies = await cookies()
    const currentSessionToken = currentCookies.get('session')?.value || "{}"
    oauth2Client.setCredentials(JSON.parse(currentSessionToken))
    oauth2Client.refreshAccessToken().then((res) => {
      oauth2Client.setCredentials(res.credentials)
      currentCookies.set('session', JSON.stringify(res.credentials), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/'
      })
    })
  } catch (error) {
  }

  return NextResponse.json(
    { result: 'ok' },
    { status: 200 }
  )
}
