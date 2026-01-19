
import EditRoom from "./editRoom"
import { Suspense } from "react"

export default function Chats() {
  return (
    <Suspense fallback={<>...</>}>
      <EditRoom />
    </Suspense >
  )
}