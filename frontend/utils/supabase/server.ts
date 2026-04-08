import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_MY_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_MY_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export function createSupabaseServerForAPI(request: Request) {
  const cookieStore = request.headers.get('cookie') || ''

  return createServerClient(
    process.env.NEXT_PUBLIC_MY_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_MY_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.split('; ').map(cookie => {
            const [name, ...rest] = cookie.split('=')
            return { name, value: rest.join('=') }
          }).filter(c => c.name)
        },
        setAll(ookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        },
      },
    }
  )
}
