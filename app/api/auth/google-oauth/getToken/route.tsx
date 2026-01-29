import { createOAuth2Client } from '@/lib/google/oauth'
import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const { code } = await request.json()
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)

  if (tokens) {
    (await cookies()).set('session', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
  }

  return NextResponse.json(
    { result: 'ok', tokens: tokens },
    { status: 200 }
  )
}
