import 'server-only'
import { google } from 'googleapis'
import { oauth2Client } from '@/lib/google/oauth'
import { cookies } from 'next/headers';

export async function chackAdminInServer() {
  console.log('chackAdminInServer called')
  try {
    const currentSessionToken = (await cookies()).get('session')?.value
    if (currentSessionToken) {
      oauth2Client.setCredentials(JSON.parse(currentSessionToken))
      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2"
      })
      const res = await oauth2.userinfo.get()
      if (res && res.data && res.data.email === process.env.ADMIN_EMAIL) {
        return true
      }
    }
  } catch (error) {
  }
  return false
}
