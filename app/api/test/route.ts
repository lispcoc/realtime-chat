import { NextResponse } from 'next/server'
import { headers } from "next/headers";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/supabase"

export async function GET() {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for");
    return NextResponse.json({
        response: 'ok',
        ip: ip
    })
}
