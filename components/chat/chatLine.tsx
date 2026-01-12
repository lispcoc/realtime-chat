import { Database } from "@/types/supabasetype"

type Props = {
    message: Database["public"]["Tables"]["Messages"]["Row"],
    index: number
}

const intToColorCode = (num: number) => {
    return '#' + num.toString(16).padStart(6, '0')
}

export default function ChatLine({ message, index }: Props) {
    const color = message.system ? "gray" : intToColorCode(message.color || 0)
    const dispName = message.system ? "" : `${message.name} > `
    return (
        <div className="w-full">
            <hr style={{ height: 10 }} />
            <div className="p-1 mb-1 w-full flex flex-wrap">
                <span style={{ color: color }} className="font-medium text-sm text-gray-900">{dispName}</span>
                <span style={{ color: color }} className="text-sm text-gray-900">{message.text}</span>
            </div>
        </div>
    )
}
