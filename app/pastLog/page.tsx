
import PastLog from "./pastLog"
import { Suspense } from "react"

export default function Chats() {
  return (
    <Suspense fallback={<>...</>}>
      <PastLog />
    </Suspense >
  )
}