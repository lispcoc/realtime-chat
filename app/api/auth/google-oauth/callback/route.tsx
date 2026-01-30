import { oauth2Client } from '@/lib/google/oauth'
import { google } from 'googleapis'
import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code")

  if (!code) {
    return new Response(`Missing query parameter`, {
      status: 400,
    })
  }

  const { tokens } = await oauth2Client.getToken(code)

  if (tokens) {
    (await cookies()).set('session', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
  }

  redirect("/")
}
