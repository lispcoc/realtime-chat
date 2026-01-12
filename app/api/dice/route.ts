import { NextRequest, NextResponse } from 'next/server'
import { headers } from "next/headers";
import { supabase } from "@/utils/supabase/supabase"
import {
    tokenize,
    rollDice,
    tallyRolls,
    calculateFinalResult
} from '@airjp73/dice-notation'

async function addMessage(msg: any) {
    await supabase.from("Messages").insert(msg)
}

const roll = async (command: string) => {
    try {
        const tokens = tokenize(command)
        const ops: string[] = []
        const consts: string[] = []
        tokens.forEach(token => {
            if (token.type === 'DiceRoll') {
                if (token.detailType === '_SimpleDieRoll') {
                    if (token.detail.count > 20 || token.detail.numSides > 10000) {
                        throw new Error('too big dice')
                    }
                } else if (token.detailType === '_Constant') {
                    consts.push(token.detail)
                }
            } else if (token.type === 'Operator') {
                ops.push(token.operator)
            }
        })
        const rolls = rollDice(tokens)
        const rollTotals = tallyRolls(tokens, rolls)
        const result = calculateFinalResult(tokens, rollTotals)

        console.log(rolls)
        console.log(ops)
        let line = ''
        let i = 0
        let j = 0
        let elements = []
        rolls.forEach(roll => {
            elements.push(
                roll == null
                    ? ops[i++]
                    : roll.length > 0
                        ? `(${roll.join(' + ')})`
                        : consts[j++]
            )
        })
        elements.push('=')
        elements.push(result)

        return elements.join(' ')
    } catch (error) {
        console.log(error)
        return null
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const command = searchParams.get("command") || ""

    const result = await roll(command);
    if (result) {
        return NextResponse.json({
            response: 'ok',
            result: result
        })
    }

    return NextResponse.json({
        response: 'ok',
        result: result
    })
}

export async function POST(request: NextRequest) {
    const { roomId, command } = await request.json();

    const result = await roll(command);
    if (result) {
        await addMessage({
            color: 0,
            name: "system",
            room_id: roomId,
            system: true,
            text: `ダイスロール : ${command} > ${result}`
        })
        return NextResponse.json({
            response: 'ok'
        })
    }

    return NextResponse.json({
        response: 'ok'
    })
}
