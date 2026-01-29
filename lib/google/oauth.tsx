
import { google } from 'googleapis'

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
  console.log(tokens)
}

export const oauth2Client = createOAuth2Client()
