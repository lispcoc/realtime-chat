import { Database } from "@/types/supabasetype"
import { intToColorCode } from "@/utils/color/color"

type Props = {
    message: Database["public"]["Tables"]["Messages"]["Row"],
    index: number,
    showRoomId?: boolean
}

export default function ChatLine({ message, index, showRoomId = false }: Props) {
    const namecolor = message.system ? "gray" : intToColorCode(message.color || 0)
    const messagecolor = message.system ? "gray" : "#000000"
    const dispName = message.system ? `` : ` > ${message.name}`
    const dispMessage = message.system ? message.text : `${message.text}`
    const date = new Date((Date.parse(message.created_at))).toLocaleString()
    return (
        <div className="w-full">
            <hr style={{ height: 1 }} className="" />
            <div className="p-1 w-full">
                {showRoomId && (
                    <span className="font-bold text-xs text-gray-900"> ({message.room_id})</span>
                )}
                <span style={{ color: namecolor }} className="font-bold text-xs text-gray-900">{dispName}</span>
                <span style={{ color: "gray" }} className="ml-2 text-xs text-gray-900">({date})</span>
                <span style={{ color: messagecolor }} className="block text-sm text-gray-900">{dispMessage}</span>
            </div>
        </div>
    )
}
