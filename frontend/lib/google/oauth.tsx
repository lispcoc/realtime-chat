
import { google } from 'googleapis'
import { cookies } from 'next/headers'

export const OPTIONS = {
  clientId: process.env.GOOGLE_AUTH_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_AUTH_CALLBACK_URL!
}

export function createOAuth2Client(options?: {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}) {
  const { clientId, clientSecret, redirectUri } = {
    ...OPTIONS,
    ...options,
  };

  // OAuthクライアントの初期化
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function setOAuthTokenCookie(tokens: string) {
}

export const oauth2Client = createOAuth2Client()

export const refreshTokenIfNeeded = async () => {
  try {
    const currentCookies = await cookies()
    const currentSessionToken = JSON.parse(currentCookies.get('session')?.value || "{}")
    oauth2Client.setCredentials(currentSessionToken)
    const expire = oauth2Client.credentials.expiry_date || 0
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 400, // 400日（ブラウザの上限）
      path: '/'
    }
    if (expire < new Date().getTime()) {
      const res = await oauth2Client.refreshAccessToken()
      // Google はリフレッシュレスポンスに refresh_token を含めないため、
      // 既存の refresh_token を引き継いで上書きされないようにする
      const newCredentials = {
        ...res.credentials,
        refresh_token: res.credentials.refresh_token || currentSessionToken.refresh_token
      }
      oauth2Client.setCredentials(newCredentials)
      currentCookies.set('session', JSON.stringify(newCredentials), cookieOptions)
    } else {
      // トークンがまだ有効な場合もクッキーの期限をリセットして失効を防ぐ
      currentCookies.set('session', JSON.stringify(currentSessionToken), cookieOptions)
    }
  } catch (error) {
    console.log(error)
  }

  return oauth2Client
}