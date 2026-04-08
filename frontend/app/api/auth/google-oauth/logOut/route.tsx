import { oauth2Client } from '@/lib/google/oauth'
import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const currentCookies = await cookies()
    const currentSessionToken = currentCookies.get('session')?.value || "{}"
    oauth2Client.setCredentials(JSON.parse(currentSessionToken))
    oauth2Client.revokeCredentials()
    currentCookies.delete('session')
  } catch (error) {
  }

  return NextResponse.json(
    { result: 'ok' },
    { status: 200 }
  )
}
