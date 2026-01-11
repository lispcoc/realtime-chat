
"use client"
import { useSearchParams } from "next/navigation"

export default function Chat() {
  const searchParams = useSearchParams()
  let roomId = searchParams.get("roomId")!!
  return (
    <div className="flex-1 w-full flex flex-col items-center p-2">
      <h1 className="text-3xl font-bold pt-5 pb-10">{roomId}</h1>
    </div>
  )
}
