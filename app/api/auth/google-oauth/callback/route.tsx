import { createOAuth2Client, setOAuthTokenCookie } from '@/lib/google/oauth'
import { google } from 'googleapis'
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {

  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    return new Response(`Missing query parameter`, {
      status: 400,
    });
  }

  const supabase = await createClient()
  const { data, error: tokenError } = await supabase.auth.exchangeCodeForSession(code)

  /*
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  oauth2Client.setCredentials(tokens)

  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: "v2"
  })
  const res = await oauth2.userinfo.get()
  console.log(res.data)
  */

  redirect("/")
}
