
import { Metadata } from 'next';
import { Suspense } from "react"
import PastLog from "./pastLog"
import Google from "../auth/googleAuth"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '管理者用メニュー',
  };
}

export default function Chats() {
  return (
    <Suspense fallback={<>...</>}>
      <Google />
      <PastLog />
    </Suspense >
  )
}