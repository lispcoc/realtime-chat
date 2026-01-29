"use client"

//import { supabase } from '@/utils/supabase/supabase'
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import styles from '@/components/style'

const scopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
]
type Prop = {
  onSetUserName?: (userName: string) => void
}

export default function Google({ onSetUserName = () => { } }: Prop) {
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
      onSetUserName("")
      const username = await getUserName()
      if (username) {
        setUserName(username)
        onSetUserName(username)
      }
      setCheckLogedIn(true)
    })()
  }, [checkLogedIn])

  const refreshToken = async () => {
    const res = await fetch('/api/auth/google-oauth/refreshToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cache: 'no-store',
      },
      mode: 'cors',
      credentials: 'include'
    })
  }

  useEffect(() => {
    (async () => {
      const timer = setInterval(refreshToken, 30 * 60 * 1000)
    })()
  }, [])

  return (
    <>
      <div className="">
        <div className="">
          {!checkLogedIn && (
            <button className={styles.button} disabled>
              確認中...
            </button>
          )}
          {checkLogedIn && userName && (
            <>
              <div className="">
                ログイン済み: {userName}
              </div>
              <button className={styles.button} onClick={handleLogout}>
                ログアウト
              </button>
            </>
          )}
          {checkLogedIn && !userName && (
            <button className={styles.button} onClick={() => router.push('/api/auth/google-oauth')}>
              ログイン
            </button>
          )}
        </div>
        <div>
        </div>
      </div>
    </>
  )
}

