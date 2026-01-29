import { createOAuth2Client } from '@/lib/google/oauth'
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  return NextResponse.json(
    { result: 'ok', tokens: tokens },
    { status: 200 }
  )
}
