import { refreshTokenIfNeeded } from '@/lib/google/oauth'
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await refreshTokenIfNeeded()
  } catch (error) {
  }

  return NextResponse.json(
    { result: 'ok' },
    { status: 200 }
  )
}
