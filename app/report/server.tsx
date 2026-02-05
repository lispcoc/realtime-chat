import 'server-only'
import { supabaseServiceRole } from "@/utils/supabase/supabaseServiceRole"

export async function addReport(name: string, text: string) {
  const res = await supabaseServiceRole.from('Reports').insert({ name, text })
  return res.statusText === 'Created'
}
