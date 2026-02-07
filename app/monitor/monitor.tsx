'use client'
import { useEffect, useState } from "react"
import { chackAdmin } from "./middleware"

type Props = {
}

export default function MonitorPage() {
  const [svgData, setSvgData] = useState<string>("")

  const fetchMonitorSvg = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MY_SUPABASE_URL!}/storage/v1/object/public/chat/test.svg`, {
        method: 'GET',
        cache: 'no-store'
      })
      const svgText = await new Response(res.body).text()
      return svgText
    } catch (error) {
      console.error(error)
    }
    return null
  }

  const drawSvg = (svgText: string) => {
    const cleanedSvgText = svgText.replace(/<\?xml.*?\?>/, '').trim()
    setSvgData(cleanedSvgText)
  }

  useEffect(() => {
    chackAdmin().then(async (res) => {
      if (!res) {
        setSvgData("<div>管理者権限がありません。</div>")
        return
      }
      fetchMonitorSvg().then(svgText => {
        if (svgText) {
          drawSvg(svgText)
          console.log(svgText)
        }
      })
    })
  }, [])

  return (
    <div className="p-4">
      {svgData && <div dangerouslySetInnerHTML={{ __html: svgData }} />}
    </div>
  )
}
