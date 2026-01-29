
import PastLog from "./pastLog"
import { Suspense } from "react"
import Google from "../auth/googleAuth"

export default function Chats() {
  return (
    <Suspense fallback={<>...</>}>
      <Google />
      <PastLog />
    </Suspense >
  )
}