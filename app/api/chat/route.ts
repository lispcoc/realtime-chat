import { NextRequest, NextResponse } from 'next/server'
import { headers } from "next/headers";
import { supabase } from "@/utils/supabase/supabase"
import bcrypt from 'bcryptjs'
import { supabaseServiceRole } from "@/utils/supabase/supabaseServiceRole"

const INACTIVE_MINUTES = 30
const fixedSalt = "$2a$10$IKzllnUoRdQkZscoft21rJ8QkCUJSDO"

async function addMessage(msg: any) {
    await supabase.from("Messages").insert(msg)
}

async function removeInactiveUser(roomId: number) {
    let tenMinutesAgo = new Date()
    tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - INACTIVE_MINUTES)
    tenMinutesAgo.toISOString()

    const { data } = await supabase.from('Users')
        .select('*')
        .eq("room_id", roomId)
        .lte('last_activity', tenMinutesAgo.toISOString())
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

async function checkEntered(roomId: number, userId: string) {
    const { data } = await supabase.from("Users").select("*").match({ "id": userId, room_id: roomId })
    if (data && data[0]) {
        return NextResponse.json({
            username: data[0].name,
            entered: true,
            color: data[0].color,
            id: userId
        }, {
            status: 200
        });
    }
    return NextResponse.json({
        username: "",
        entered: false
    }, { status: 200 });
}

async function enterRoom(roomId: number, userId: string, username: string, color: number) {
    try {
        const { data } = await supabase.from("Users").select("*").match({ "id": userId })
        if (data && data[0]) {
            if (data[0].room_id === roomId) {
                return NextResponse.json({
                    id: userId
                }, {
                    status: 200
                });
            } else {
                await supabase.from("Users").delete().match({ "id": userId })
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
            id: userId,
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
        await supabase.from("Rooms").update({
            last_enter: new Date().toISOString()
        }).eq('id', roomId)
    } catch (error) {
        console.error(error)
    }
    return NextResponse.json({ id: userId }, { status: 200 });
}

async function exitRoom(roomId: number, userId: string) {
    try {
        const { data } = await supabase.from("Users").select("*").match({ "id": userId, room_id: roomId })
        if (data && data[0]) {
            await supabase.from("Users")
                .delete()
                .match({ "id": userId, room_id: roomId })
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
    return NextResponse.json({ ip: userId }, { status: 200 });
}

async function getUsers(roomId: number) {
    await removeInactiveUser(roomId)
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

async function allClear(roomId: number, send_msg = true) {
    await supabaseServiceRole.from("Rooms").update({
        all_clear_at: new Date().toISOString()
    }).eq('id', roomId)
    await supabase.from("RoomData").upsert({
        id: roomId,
        all_clear_at: new Date().toISOString()
    }).eq('id', roomId)
    if (send_msg) {
        await addMessage({
            color: 0,
            name: "system",
            room_id: roomId,
            system: true,
            text: `ルームログが消去されました。`
        })
    }
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
                return allClear(roomId, false)
            }
        }
    }
    return NextResponse.json({
        users: []
    }, { status: 200 });
}

async function changeVariable(roomId: number, arg: any) {
    const res = await supabaseServiceRole.from("Rooms").select('options, variables').eq('id', roomId)
    console.log(roomId, arg)
    if (res.data && res.data[0]) {
        const varData = res.data[0]
        const variables: any = varData.variables
        const opt: any = varData.options
        console.log(opt)
        if (opt && opt.variables && opt.variables.includes(arg.key)) {
            if (!variables[arg.key]) variables[arg.key] = 0
            const value_before = variables[arg.key]
            if (arg.op === "mod") {
                variables[arg.key] += arg.value
            } else if (arg.op === "set") {
                variables[arg.key] = arg.value
            }
            if (value_before != variables[arg.key]) {
                await supabaseServiceRole.from("Rooms").update({ variables: variables }).eq('id', roomId)
                await addMessage({
                    color: 0,
                    name: "system",
                    room_id: roomId,
                    system: true,
                    text: `${arg.key} : ${value_before} → ${variables[arg.key]}`
                })
            }
            return NextResponse.json({
                variables: variables
            }, { status: 200 });
        }
    }
    return NextResponse.json({
        variables: null
    }, { status: 200 });
}

export async function POST(request: NextRequest) {
    const { action, roomId, username, userId, color, arg } = await request.json();
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "";
    let chk_auto_clear = false
    let res: NextResponse = NextResponse.json({ ip: ip }, { status: 200 })

    if (action === 'checkEntered') {
        res = await checkEntered(roomId, userId ? userId : bcrypt.hashSync(ip, fixedSalt))
        autoClear(roomId)
    } else if (action === 'enterRoom') {
        res = await enterRoom(roomId, userId ? userId : bcrypt.hashSync(ip, fixedSalt), username, color)
        autoClear(roomId)
    } else if (action === 'exitRoom') {
        res = await exitRoom(roomId, userId ? userId : bcrypt.hashSync(ip, fixedSalt))
        autoClear(roomId)
    } else if (action === 'getUsers') {
        res = await getUsers(roomId)
    } else if (action === 'allClear') {
        res = await allClear(roomId)
    } else if (action === 'removeInactiveUser') {
        removeInactiveUser(roomId)
    } else if (action === 'changeVariable') {
        res = await changeVariable(roomId, arg)
    }

    return res
}

export async function GET(request: NextRequest) {
    const headersList = await headers();
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
