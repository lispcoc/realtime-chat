
import Google from "./googleAuth"
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
      <Google />
    </Suspense >
  )
}
