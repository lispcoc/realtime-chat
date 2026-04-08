import { createClient } from '@supabase/supabase-js'
import { Database } from './supabasetype.ts'

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "https://rtchat.0am.jp/"
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
