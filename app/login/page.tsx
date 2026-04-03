'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

 const handleGoogleLogin = async () => {
  setLoading(true)
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) {
    setStatus('error')
    setLoading(false)
  }
}

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setStatus('error')
    } else {
      setStatus('sent')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center p-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');.fredoka{font-family:'Fredoka One',cursive;}`}</style>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-amber-500 text-sm font-bold hover:text-amber-700 flex items-center justify-center gap-1 mb-4">
            ← Back to home
          </Link>
  <div className="flex items-center justify-center gap-2 mb-2">
  <img src="/logo.jpg" alt="StoryGennie" className="h-14 w-auto" />
</div>
<h1 className="fredoka text-4xl text-amber-900">StoryGennie</h1>
<p className="text-amber-700 mt-2">Sign in to create personalized storybooks</p>
</div>

        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-8">

          {status === 'sent' ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h2 className="fredoka text-2xl text-amber-900 mb-2">Check your email!</h2>
              <p className="text-amber-700">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-amber-500 text-sm mt-2">
                Click the link in the email to sign in.
              </p>
              <button
                onClick={() => setStatus('')}
                className="mt-6 text-amber-600 text-sm underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-amber-200 bg-white hover:bg-amber-50 transition-all font-bold text-amber-900 mb-6"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Signing in...' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-amber-100"></div>
                <span className="text-amber-400 text-sm">or</span>
                <div className="flex-1 h-px bg-amber-100"></div>
              </div>

              {/* Magic Link */}
              <form onSubmit={handleMagicLink}>
                <div className="mb-4">
                  <label className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #F4A832, #D4881A)' }}
                >
                  {loading ? 'Sending...' : 'Send Magic Link ✨'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-amber-500 text-xs mt-6">
          By signing in you agree to our Terms of Service
        </p>
      </div>
    </main>
  )
}