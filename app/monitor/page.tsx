
import { Suspense } from "react"
import MonitorPage from "./monitor"
import Google from "../auth/googleAuth"

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
      <Google />
      <MonitorPage />
    </Suspense >
  )
}