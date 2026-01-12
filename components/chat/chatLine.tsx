import { Database } from "@/types/supabasetype"

type Props = {
    message: Database["public"]["Tables"]["Messages"]["Row"],
    index: number
}

export default function ChatLine({ message, index }: Props) {
    const color = message.system ? "gray" : "black"
    const dispName = message.system ? "" : `${message.name} > `
    return (
        <div>
            <hr style={{ height: 10 }}></hr>
            <span style={{ color: color }} className="font-medium text-sm text-gray-900 truncate">{dispName}</span>
            <span className="text-sm text-gray-900 truncate">{message.text}</span>
        </div>
    )
}
