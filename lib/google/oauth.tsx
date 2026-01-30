
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
  const currentCookies = await cookies()
  const currentSessionToken = JSON.parse(currentCookies.get('session')?.value || "{}")
  oauth2Client.setCredentials(currentSessionToken)
  const expire = oauth2Client.credentials.expiry_date || 0
  if (expire < new Date().getTime()) {
    const res = await oauth2Client.refreshAccessToken()
    oauth2Client.setCredentials(res.credentials)
    currentCookies.set('session', JSON.stringify(res.credentials), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
  }

  return oauth2Client
}