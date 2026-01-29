import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"
import { oauth2Client } from '@/lib/google/oauth'

const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
]

export async function GET(req: NextRequest) {

  // Google 認証へのリンク生成
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes
  })

  // Google認証リンクへリダイレクト
  redirect(url)
}