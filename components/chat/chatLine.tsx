import { Database } from "@/types/supabasetype"

type Props = {
    message: Database["public"]["Tables"]["Messages"]["Row"],
    index: number
}

export default function ChatLine({ message, index }: Props) {
    return (
        <div>
            <hr style={{ height: 10 }}></hr>
            <span className="font-medium text-sm text-gray-900 truncate">{message.name} &gt; </span>
            <span className="text-sm text-gray-900 truncate">{message.text}</span>
        </div>
    )
}