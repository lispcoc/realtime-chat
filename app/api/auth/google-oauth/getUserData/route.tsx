import { oauth2Client, refreshTokenIfNeeded } from '@/lib/google/oauth'
import { google } from 'googleapis'
import { NextResponse, NextRequest } from "next/server"
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    await refreshTokenIfNeeded()
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
    console.log(error)
  }

  return NextResponse.json(
    { result: 'No valid access token' },
    { status: 401 }
  )
}
