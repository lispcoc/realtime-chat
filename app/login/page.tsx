
import Login from "./login"
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
      <Login />
    </Suspense >
  )
}