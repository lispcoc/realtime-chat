"use client"

//import { supabase } from '@/utils/supabase/supabase'
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'

const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
]

export default function Google() {
  const [userName, setUserName] = useState("")
  const [checkLogedIn, setCheckLogedIn] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    const { data: user, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: scopes.join(" "),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    if (error) {
      console.error('Error logging in:', error);
    } else {
      console.log('User logged in:', user);
    }
  }

  const getUserName = async () => {
    const res = await fetch('/api/auth/google-oauth/getUserData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cache: 'no-store',
      }
    })
    const data = await res.json()
    if (data.result === 'ok') {
      return data.res.data.email
    }
    return null
  }

  const handleLogout = async () => {
    const res = await fetch('/api/auth/google-oauth/logOut', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cache: 'no-store',
      }
    })
    const data = await res.json()
    if (data.result === 'ok') {
    }
    setCheckLogedIn(false)
  }

  useEffect(() => {
    (async () => {
      setUserName("")
      const username = await getUserName()
      if (username) {
        setUserName(username)
      }
      setCheckLogedIn(true)
    })()
  }, [checkLogedIn])

  return (
    <>
      <div className="">
        <div className="">
          {!checkLogedIn && (
            `確認中...`
          )}
          {checkLogedIn && userName && (
            <>
              <div className="">
                ログイン済み: {userName}
              </div>
              <a onClick={handleLogout} className="text-blue-700">
                ログアウト
              </a>
            </>
          )}
          {checkLogedIn && !userName && (
            <Link href="/api/auth/google-oauth" className="text-blue-700">
              ログイン
            </Link>
          )}
        </div>
        <div>
        </div>
      </div>
    </>
  )
}

