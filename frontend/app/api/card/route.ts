import { NextRequest, NextResponse } from 'next/server'
import { headers } from "next/headers";
import { Database, Json } from "@/types/supabasetype"
import { supabase } from "@/utils/supabase/supabase"

const DEFAULT_TRUMP = [
    "ハートのA",
    "ハートの2",
    "ハートの3",
    "ハートの4",
    "ハートの5",
    "ハートの6",
    "ハートの7",
    "ハートの8",
    "ハートの9",
    "ハートの10",
    "ハートのJ",
    "ハートのQ",
    "ハートのK",
    "クラブのA",
    "クラブの2",
    "クラブの3",
    "クラブの4",
    "クラブの5",
    "クラブの6",
    "クラブの7",
    "クラブの8",
    "クラブの9",
    "クラブの10",
    "クラブのJ",
    "クラブのQ",
    "クラブのK",
    "スペードのA",
    "スペードの2",
    "スペードの3",
    "スペードの4",
    "スペードの5",
    "スペードの6",
    "スペードの7",
    "スペードの8",
    "スペードの9",
    "スペードの10",
    "スペードのJ",
    "スペードのQ",
    "スペードのK",
    "ダイヤのA",
    "ダイヤの2",
    "ダイヤの3",
    "ダイヤの4",
    "ダイヤの5",
    "ダイヤの6",
    "ダイヤの7",
    "ダイヤの8",
    "ダイヤの9",
    "ダイヤの10",
    "ダイヤのJ",
    "ダイヤのQ",
    "ダイヤのK",
    "ジョーカー",
]

async function addMessage(msg: any) {
    await supabase.from("Messages").insert(msg)
}

const resetDeck = async (roomId: number, username: string) => {
    const current = await supabase.from("Cards").select('*').match({ 'type': 'trump', 'room_id': roomId })
    if (current.data && current.data[0]) {
        await supabase.from("Cards").upsert({
            id: current.data[0].id,
            room_id: roomId,
            type: current.data[0].type,
            remaining: DEFAULT_TRUMP
        })
    } else {
        await supabase.from("Cards").upsert({
            room_id: roomId,
            type: 'trump',
            remaining: DEFAULT_TRUMP
        })
    }
    addMessage({
        color: 0,
        name: "system",
        room_id: roomId,
        system: true,
        text: `${username}さんが山札をリセットしました。`
    })
    return null
}

const drawCard = async (roomId: number, username: string) => {
    console.log("drawCard")
    const current = await supabase.from("Cards").select('*').match({ 'type': 'trump', 'room_id': roomId })
    if (current.data && current.data[0]) {
        const remaining = current.data[0].remaining || []
        if (!remaining.length) {
            addMessage({
                color: 0,
                name: "system",
                room_id: roomId,
                system: true,
                text: `山札がありません。`
            })
            return null
        }
        const idx = Math.floor(Math.random() * remaining.length)
        const drawn = remaining[idx]
        const new_remaining = remaining.filter((e, i) => i != idx)
        await supabase.from("Cards").upsert({
            id: current.data[0].id,
            room_id: current.data[0].room_id,
            type: current.data[0].type,
            remaining: new_remaining
        })
        addMessage({
            color: 0,
            name: "system",
            room_id: roomId,
            system: true,
            text: `${username}さんが${drawn}をドローしました。(残り${new_remaining.length}枚)`
        })
        return {
            drawn: drawn,
            remaining: new_remaining
        }
    }
    addMessage({
        color: 0,
        name: "system",
        room_id: roomId,
        system: true,
        text: `山札がありません。`
    })
    return null
}

const main = async (roomId: number, command: string, username: string) => {
    if (command === 'resetDeck') {
        const result = await resetDeck(roomId, username);
        return NextResponse.json({
            response: 'ok',
            result: result
        })
    } else if (command === 'drawCard') {
        const result = await drawCard(roomId, username);
        return NextResponse.json({
            response: 'ok',
            result: result
        })
    }

    return NextResponse.json({
        response: 'ok'
    })
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const command = searchParams.get("command") || ""
    const roomId = parseInt(searchParams.get("roomId") || "")
    const username = searchParams.get("username") || "Unknown"


    return await main(roomId, command, username)
}

export async function POST(request: NextRequest) {
    const { roomId, command, username } = await request.json();

    return await main(roomId, command, username)
}
