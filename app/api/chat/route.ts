import { NextRequest, NextResponse } from 'next/server'
import { headers } from "next/headers";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/supabase"

export async function POST(request: NextRequest) {
    const { action, roomId, username } = await request.json();
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || "";

    if (action === 'enterRoom') {
        try {
            const { data } = await supabase.from("Users").select("*").match({ "id": ip, room_id: roomId })
            if (data && data[0]) {
                return NextResponse.json({
                    ip: ip
                }, {
                    status: 200
                });
            }
            await supabase.from("Users").insert({
                id: ip,
                room_id: roomId,
                name: username,
                color: 0
            })
        } catch (error) {
            console.error(error)
        }
    }

    if (action === 'exitRoom') {
        try {
            const { data } = await supabase.from("Users").select("*").match({ "id": ip, room_id: roomId })
            if (data && data[0]) {
                await supabase.from("Users")
                    .delete()
                    .match({ "id": ip, room_id: roomId })
            }
        } catch (error) {
            console.error(error)
        }
    }

    return NextResponse.json({
        ip: ip
    }, {
        status: 200
    });
}
