
"use client"
import { Suspense } from "react"
import IndexPage from "./index"

export default function Index() {
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
      <IndexPage />
    </Suspense>
  )
}
