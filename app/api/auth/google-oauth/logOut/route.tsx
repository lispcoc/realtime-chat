import { NextResponse, NextRequest } from "next/server";
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {

  (await cookies()).delete('session')

  return NextResponse.json(
    { result: 'ok' },
    { status: 200 }
  )
}
