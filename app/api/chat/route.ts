import { Database } from "@/types/supabasetype"
import { NextRequest, NextResponse } from 'next/server'
import { headers } from "next/headers";
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/utils/supabase/supabase"
import { use } from "react";

const INACTIVE_MINUTES = 10

async function addMessage(msg: any) {
    await supabase.from("Messages").insert(msg)
}

async function removeInactiveUser() {
    let tenMinutesAgo = new Date()
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - INACTIVE_MINUTES)
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

async function checkEntered(roomId: number, ip: string) {
    await removeInactiveUser()
    const { data } = await supabase.from("Users").select("*").match({ "id": ip, room_id: roomId })
    if (data && data[0]) {
        return NextResponse.json({
            username: data[0].name,
            entered: true,
            color: data[0].color,
            id: ip
        }, {
            status: 200
        });
    }
    return NextResponse.json({
        username: "",
        entered: false
    }, { status: 200 });
}

async function enterRoom(roomId: number, ip: string, username: string, color: number) {
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
            color: color,
        })
        addMessage({
            color: 0,
            name: "system",
            room_id: roomId,
            system: true,
            text: `${username}さんが入室しました。`
        })
    } catch (error) {
        console.error(error)
    }
    return NextResponse.json({ ip: ip }, { status: 200 });
}

async function exitRoom(roomId: number, ip: string) {
    try {
        const { data } = await supabase.from("Users").select("*").match({ "id": ip, room_id: roomId })
        if (data && data[0]) {
            await supabase.from("Users")
                .delete()
                .match({ "id": ip, room_id: roomId })
            addMessage({
                color: 0,
                name: "system",
                room_id: roomId,
                system: true,
                text: `${data[0].name}さんが退室しました。`
            })
        }
    } catch (error) {
        console.error(error)
    }
    return NextResponse.json({ ip: ip }, { status: 200 });
}

async function getUsers(roomId: number) {
    await removeInactiveUser()
    const { data } = await supabase.from("Users").select("*").match({ room_id: roomId })
    if (data) {
        const users = data.map(user => ({
            name: user.name,
            color: user.color
        }))
        return NextResponse.json({
            users: users
        }, { status: 200 });
    }
    return NextResponse.json({
        users: []
    }, { status: 200 });
}

async function allClear(roomId: number) {
    await supabase.from("Rooms").update({
        all_clear_at: new Date().toISOString()
    }).eq('id', roomId)
    await addMessage({
        color: 0,
        name: "system",
        room_id: roomId,
        system: true,
        text: `ルームログが消去されました。`
    })
    return NextResponse.json({
        users: []
    }, { status: 200 });
}

async function autoClear(roomId: number) {
    const { data } = await supabase.from("Rooms").select('*').eq('id', roomId)
    if (data && data[0]) {
        const opt: any = data[0]?.options || {}
        if (opt.auto_all_clear) {
            const { data } = await supabase.from("Users").select("*").match({ room_id: roomId })
            if (!data || !data.length) {
                return allClear(roomId)
            }
        }
    }
    return NextResponse.json({
        users: []
    }, { status: 200 });
}

export async function POST(request: NextRequest) {
    const { action, roomId, username, color } = await request.json();
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || "";
    let chk_auto_clear = false
    let res: NextResponse = NextResponse.json({ ip: ip }, { status: 200 })

    if (action === 'checkEntered') {
        res = await checkEntered(roomId, ip)
        autoClear(roomId)
    } else if (action === 'enterRoom') {
        res = await enterRoom(roomId, ip, username, color)
        autoClear(roomId)
    } else if (action === 'exitRoom') {
        res = await exitRoom(roomId, ip)
        autoClear(roomId)
    } else if (action === 'getUsers') {
        res = await getUsers(roomId)
    } else if (action === 'allClear') {
        res = await allClear(roomId)
    }

    return res
}

export async function GET(request: NextRequest) {
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for");
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get("action") || ""
    const roomId = searchParams.get("roomId") || ""

    if (action === 'getUsers') {
        return getUsers(parseInt(roomId))
    }

    return NextResponse.json({
        response: 'ok'
    })
}
