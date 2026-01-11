import { Database } from "@/types/supabasetype"

type Props = {
    message: Database["public"]["Tables"]["Messages"]["Row"],
    index: number
}

export default function ChatLine({ message, index }: Props) {
    return (
        <div>
            <hr></hr>
            <span className="bold font-medium text-gray-900 truncate">{message.name} &gt; </span>
            <span className="font-medium text-gray-900 truncate">{message.text}</span>
        </div>
    )
}