"use client"

//import { supabase } from '@/utils/supabase/supabase'
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react"

const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
]

export default function Google() {
  const [userName, setUserName] = useState("")
  const [checkLogedIn, setCheckLogedIn] = useState(false)

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
    const tokens = JSON.parse(localStorage.getItem('google-auth-tokens') || 'null')
    if (tokens) {
      const res = await fetch('/api/auth/google-oauth/getUserData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cache: 'no-store',
        },
        body: JSON.stringify({
          tokens: tokens
        })
      })
      const data = await res.json()
      if (data.result === 'ok') {
        return data.res.data.email
      }
    }
    return null
  }

  const testLogout = async () => {
    const res = await supabase.auth.signOut()
  }

  useEffect(() => {
    (async () => {
      const username = await getUserName()
      if (username) {
        setUserName(username)
      }
      setCheckLogedIn(true)
    })()
  }, [])

  return (
    <>
      <div className="">
        <div className="">
          {!checkLogedIn && (
            `確認中...`
          )}
          {checkLogedIn && userName && (
            `ログイン済み: ${userName}`
          )}
          {checkLogedIn && !userName && (
            <Link href="/api/auth/google-oauth">
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

