import { Database } from "@/types/supabasetype"
import { NextRequest, NextResponse } from 'next/server'
import { headers } from "next/headers";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/supabase"

async function addMessage(msg: any) {
    await supabase.from("Messages").insert(msg)
}

async function removeInactiveUser() {
    let tenMinutesAgo = new Date()
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10)
    tenMinutesAgo.toISOString()

    const { data } = await supabase.from('Users')
        .select('*')
        .lte('last_activity', tenMinutesAgo.toISOString()) // last_activity <= tenMinutesAgo
    if (data) {
        const reminder: any[] = []
        data.forEach(user => {
            reminder.push({ "id": user.id, "name": user.name, "room_id": user.room_id })
        })
        for (const a of reminder) {
            const res = await supabase.from("Users")
                .delete()
                .match(a)
            addMessage({
                color: 0,
                name: "system",
                room_id: a.room_id,
                system: true,
                text: `${a.name}さんが非アクティブのため自動退室しました。`
            })
        }
    }
}

export async function POST(request: NextRequest) {
    const { action, roomId, username } = await request.json();
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || "";

    if (action === 'checkEntered') {
        await removeInactiveUser()

        const { data } = await supabase.from("Users").select("*").match({ "id": ip, room_id: roomId })
        if (data && data[0]) {
            return NextResponse.json({
                username: data[0].name,
                entered: true,
                id: ip
            }, {
                status: 200
            });
        }
        return NextResponse.json({
            username: "",
            entered: false
        }, {
            status: 200
        });
    }

    if (action === 'enterRoom') {
        try {
            const { data } = await supabase.from("Users").select("*").match({ "id": ip })
            if (data && data[0]) {
                if (data[0].room_id === roomId) {
                    return NextResponse.json({
                        ip: ip
                    }, {
                        status: 200
                    });
                } else {
                    await supabase.from("Users").delete().match({ "id": ip })
                    addMessage({
                        color: 0,
                        name: "system",
                        room_id: data[0].room_id,
                        system: true,
                        text: `${data[0].name}さんが退室しました。`
                    })
                }
            }
            await supabase.from("Users").insert({
                id: ip,
                room_id: roomId,
                name: username,
                color: 0
            })
            addMessage({
                color: 0,
                name: "system",
                room_id: parseInt(roomId),
                system: true,
                text: `${username}さんが入室しました。`
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
                addMessage({
                    color: 0,
                    name: "system",
                    room_id: parseInt(roomId),
                    system: true,
                    text: `${data[0].name}さんが退室しました。`
                })
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

export async function GET() {
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for");

    let users: String[] = []
    let users2: String[] = []
    let tenMinutesAgo = new Date()
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10)
    tenMinutesAgo.toISOString()
    const { data } = await supabase.from('Users')
        .select('*')
        .lte('last_activity', tenMinutesAgo.toISOString())
    if (data) {
        const reminder: any[] = []
        data.forEach(user => {
            users.push(user.id)
            reminder.push({ "id": user.id, "room_id": user.room_id })
        })
        for (const a of reminder) {
            const res = await supabase.from("Users")
                .delete()
                .match(a)
            addMessage({
                color: 0,
                name: "system",
                room_id: a.room_id,
                system: true,
                text: `${a.name}さんが非アクティブのため自動退室しました。`
            })
            users2.push(res.statusText)
        }
    }
    return NextResponse.json({
        response: 'ok',
        users: users,
        users2: users2,
        tenMinutesAgo: tenMinutesAgo.toISOString()
    })
}
