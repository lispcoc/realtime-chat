import { NextRequest, NextResponse } from 'next/server'
import { headers } from "next/headers";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/supabase"

export async function POST(request: NextRequest) {
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || "";
    const { action } = await request.json();

    if (action === 'enterRoom') {
        const { roomId, username } = await request.json();
        const { data } = await supabase.from("Users").select("*").eq("id", ip)
        if (data) {
            if (data.find(user => user.room_id == roomId)) {
                return NextResponse.json({
                    ip: ip
                }, {
                    status: 200
                });
            }
            await supabase.from("Users")
                .delete()
                .match({ "id": ip });
        }
        await supabase.from("Users").insert({
            id: ip,
            room_id: roomId,
            name: username,
            color: 0
        })
    }

    return NextResponse.json({
        ip: ip
    }, {
        status: 200
    });
}
