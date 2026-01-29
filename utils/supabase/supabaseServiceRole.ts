import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabasetype'

export const supabaseServiceRole = createClient<Database>(
  process.env.NEXT_PUBLIC_MY_SUPABASE_URL!,
  process.env.MY_SUPABASE_SERVICE_ROLE_KEY!,
)
