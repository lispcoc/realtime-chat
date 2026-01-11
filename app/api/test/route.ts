import { NextResponse } from 'next/server'
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/supabase"

export async function GET() {
    return NextResponse.json({ response: 'ok' })
}
