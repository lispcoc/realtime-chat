import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabasetype'

export const supabase = createClient<Database>(
  process.env.MY_PUBLIC_SUPABASE_URL!,
  process.env.MY_PUBLIC_SUPABASE_ANON_KEY!,
);