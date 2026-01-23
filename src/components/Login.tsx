// src/components/Login.tsx
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/Button' // 沿用你現有的 Button
import { Loading } from './ui/Loading'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // 開發時這很重要，登入後跳轉回你的 localhost
        emailRedirectTo: window.location.origin, 
      },
    })

    if (error) {
      alert(error.message)
    } else {
      setMessage('🚀 登入連結已寄出！請檢查你的 Email。')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-3xl font-bold text-primary">SplitTrek ✈️</h1>
        <p className="mb-8 text-gray-500">旅費分帳，從此輕鬆。</p>

        {message ? (
          <div className="rounded-xl bg-green-50 p-4 text-center font-bold text-green-700">
            {message}
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-none bg-gray-50 p-4 font-bold outline-none ring-2 ring-transparent transition-all focus:bg-white focus:ring-primary/20"
                placeholder="你的 Email"
              />
            </div>
            <Button disabled={loading} className="w-full py-4 rounded-xl">
              {loading ? <Loading /> : '發送登入連結'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}