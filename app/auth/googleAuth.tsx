"use client"

import { supabase } from '@/utils/supabase/supabase'

export default function Google() {
  const handleLogin = async () => {
    const { data: user, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) {
      console.error('Error logging in:', error);
    } else {
      console.log('User logged in:', user);
    }
  }
  return (
    <>
      <div className="">
        <main className="">
          <div className="">
            <button onClick={handleLogin}>Sign in with Google</button>
          </div>
        </main>
        <footer className="">
        </footer>
      </div>
    </>
  )
}

