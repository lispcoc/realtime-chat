import { createClient } from '@supabase/supabase-js'
import { Database } from './supabasetype.ts'

export const supabase = createClient<Database>(
  "https://rtchat.0am.jp/",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Njk0OTQ0MjQsImV4cCI6MTkyNzE3NDQyNH0.1yvtLhDAdTlUSpk07BbrkviAF1rjWtfhD9EDyTDgHZo",
)
