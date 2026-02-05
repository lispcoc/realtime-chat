'use server'
import { supabaseServiceRole } from "@/utils/supabase/supabaseServiceRole"

export async function handleSubmit(formData: FormData) {
  const name = formData.get('name')?.toString()
  const text = formData.get('text')?.toString()
  const res = await supabaseServiceRole.from('Reports').insert({ name, text })
  return res.statusText === 'Created'
}
