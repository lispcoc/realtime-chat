import Header from '@/components/header'
import './globals.css'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'プライベートチャット',
  description: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-background text-foreground">
        <Header></Header>
        <main className="pt-14 min-h-screen flex flex-col items-center">
          {children}
        </main>
      </body>
    </html>
  )
}
