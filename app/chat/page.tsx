
import Chat from "./chat"
import { Suspense } from "react"

export default function Chats() {
  return (
    <Suspense fallback={<>...</>}>
      <Chat />
    </Suspense >
  )
}