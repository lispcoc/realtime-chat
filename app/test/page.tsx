"use client"

import { useState } from "react"
import * as ColorWheel from "react-hsv-ring"

function colorCodeToInt(code: string) {
    const shorthandRegex = /^#?([a-fA-F\d]+)$/i;
    const result = shorthandRegex.exec(code) || []
    if (result.length > 1) {
        return parseInt(result[1], 16)
    }
    return 0
}

export default function Test() {
    const [color, setColor] = useState("#000000")

    return (
        <div className="flex-1 w-full flex flex-col items-center p-2">
            <h1 className="text-3xl font-bold pt-5 pb-10">ルームの作成</h1>
            <ColorWheel.Root value={color} onValueChange={setColor}>
                <ColorWheel.Wheel size={200} ringWidth={20}>
                    <ColorWheel.HueRing />
                    <ColorWheel.HueThumb />
                    <ColorWheel.Area />
                    <ColorWheel.AreaThumb />
                </ColorWheel.Wheel>
            </ColorWheel.Root>
            {colorCodeToInt(color)}
        </div >
    )
}