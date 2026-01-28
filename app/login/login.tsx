"use client"
import { supabase } from "@/utils/supabase/client"
import { useState } from "react";
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const onLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const res = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })
      console.log(res)
      if (res.error) {
        throw res.error;
      }

      await fetch('/api/admin', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cache: 'no-store',
        }
      })

      alert('OK');
    } catch {
      alert('エラーが発生しました');
    }
  }

  return (
    <div>
      <main>
        <div>
          <form onSubmit={onLogin}>
            <div>
              <label>メールアドレス</label>
              <input type="email"
                required value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label>パスワード</label>
              <input type="password"
                required value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div>
              <button type="submit">ログイン</button><br />
              <Link href='/signup'>
                ユーザー登録がお済みでない方はこちらから
              </Link><br />
              <Link href='/sendemail'>
                パスワードをお忘れの方はこちらから
              </Link>
            </div>
          </form>
        </div>
      </main>
      <footer >
      </footer>
    </div>
  )
}

