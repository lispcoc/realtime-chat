
import CreateRoom from "./createRoom"
import { Suspense } from "react"

export default function Chats() {
  const isInMaintenanceMode = process.env.IS_IN_MAINTENANCE_MODE === "true";

  if (isInMaintenanceMode) {
    return (
      <div>
        メンテナンス中です。
      </div >
    )
  }

  return (
    <Suspense fallback={<>...</>}>
      <CreateRoom />
    </Suspense >
  )
}