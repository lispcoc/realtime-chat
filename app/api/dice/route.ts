import { NextResponse } from 'next/server'
import { headers } from "next/headers";
import { Base as Dice } from 'bcdice';

export async function GET() {
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for");

    const result = Dice.eval("2d6")
    if (result && result.text) {
        return NextResponse.json({
            response: 'ok',
            result: result.text
        })
    }
    return NextResponse.json({
        response: 'ok',
        ip: ip
    })
}
