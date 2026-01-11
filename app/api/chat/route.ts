import { NextResponse } from 'next/server'
import { headers } from "next/headers";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/supabase"

export function POST(request: NextApiRequest) {
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for");
    return NextResponse.json({
        ip: ip
    }, { status: 200 });
}
