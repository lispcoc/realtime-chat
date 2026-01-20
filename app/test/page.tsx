
import Test from "./test"
import { Suspense } from "react"

export default function Chats() {
  return (
    <Suspense fallback={<>...</>}>
      <Test />
    </Suspense >
  )
}