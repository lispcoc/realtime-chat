import { NextResponse } from 'next/server'
import { headers } from "next/headers";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseServiceRole } from '@/utils/supabase/supabaseServiceRole';

export async function GET() {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for");
    const { data: rooms } = await supabaseServiceRole.from('Rooms').select('id, title').order(
        'last_enter',
        { ascending: false }
    ).limit(100)
    const { data: users } = await supabaseServiceRole.from('Users').select('name, room_id, color')
    if (rooms) {
        const res = supabaseServiceRole.storage.from('chat').upload(
            'test.txt',
            JSON.stringify({ rooms, users }),
            { upsert: true }
        )
        return NextResponse.json({
            response: 'ok',
            res: res
        })
    }

    return NextResponse.json({
        response: 'ok'
    })
}
