import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabasetype'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_MY_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_MY_SUPABASE_ANON_KEY!,
)
