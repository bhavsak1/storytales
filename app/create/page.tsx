'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Script from 'next/script'
import { STORY_PLANS, getActivePlan } from '@/lib/pricing'
import { trackEvent } from '@/lib/analytics'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Razorpay: any
  }
}


interface StoryPage {
  page: number
  text: string
  scene: string
}

interface FormData {
  childName: string
  age: string
  gender: string
  interests: string[]
  storyLength: string
  theme: string
  deliveryType: string
  dedication: string
  nickname: string
  email: string
}

const INTERESTS = [
  { label: 'Dinosaurs', emoji: '🦕' },
  { label: 'Space', emoji: '🚀' },
  { label: 'Unicorns', emoji: '🦄' },
  { label: 'Dragons', emoji: '🐉' },
  { label: 'Ocean', emoji: '🌊' },
  { label: 'Sports', emoji: '⚽' },
  { label: 'Art', emoji: '🎨' },
  { label: 'Animals', emoji: '🐾' },
  { label: 'Music', emoji: '🎵' },
  { label: 'Superheroes', emoji: '🦸' },
  { label: 'Nature', emoji: '🌿' },
  { label: 'Magic', emoji: '🔮' },
  { label: 'Robots', emoji: '🤖' },
  { label: 'Castles', emoji: '🏰' },
  { label: 'Food', emoji: '🍕' },
  { label: 'Foxes', emoji: '🦊' },
]

const THEMES = [
  { label: 'Royal Kingdom', emoji: '🏰', desc: 'Princes, princesses & quests' },
  { label: 'Space Explorer', emoji: '🚀', desc: 'Blast off to new planets' },
  { label: 'Ocean Adventure', emoji: '🌊', desc: 'Dive deep, find treasure' },
  { label: 'Enchanted Forest', emoji: '🌲', desc: 'Magic, fairies & animals' },
  { label: 'Superhero City', emoji: '🦸', desc: 'Save the day with powers' },
  { label: 'Tiny World', emoji: '🍄', desc: 'Big adventure, small world' },
]

const LENGTHS = [
  { label: 'Short & Sweet', emoji: '📖', pages: '3 pages', value: '3' },
  { label: 'Just Right', emoji: '📚', pages: '5 pages', value: '5' },
  { label: 'Epic Tale', emoji: '🏆', pages: '8 pages', value: '8' },
]

const DELIVERY = STORY_PLANS

export default function Home() {
  const [step, setStep] = useState(1)
  const [status, setStatus] = useState('')
  const [story, setStory] = useState<{ title: string; pages: StoryPage[] } | null>(null)
  const [illustrations, setIllustrations] = useState<string[]>([])
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<FormData>({
    childName: '',
    age: '',
    gender: '',
    interests: [],
    storyLength: '3',
    theme: '',
    deliveryType: 'digital',
    dedication: '',
    nickname: '',
    email: '',
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
const [photoValidating, setPhotoValidating] = useState(false)
const [photoValid, setPhotoValid] = useState<boolean | null>(null)
const [photoError, setPhotoError] = useState('')
const [photoUrl, setPhotoUrl] = useState<string | null>(null)

// ── Preview + Payment state ──
const [previewData, setPreviewData] = useState<{ title: string; pages: { page: number; text: string }[]; illustrations: (string | null)[] } | null>(null)
const [previewLoading, setPreviewLoading] = useState(false)
const [paymentLoading, setPaymentLoading] = useState(false)
const [savedOrderId, setSavedOrderId] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    getUser()
  }, [router])

  const toggleInterest = (interest: string) => {
    const current = formData.interests
    if (current.includes(interest)) {
      setFormData({ ...formData, interests: current.filter(i => i !== interest) })
    } else if (current.length < 4) {
      setFormData({ ...formData, interests: [...current, interest] })
    }
  }
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    setPhotoError('Photo too large. Please use under 5MB.')
    setPhotoValid(false)
    return
  }

  const reader = new FileReader()
  reader.onload = () => setPhotoPreview(reader.result as string)
  reader.readAsDataURL(file)
  setPhotoValidating(true)
  setPhotoValid(null)
  setPhotoError('')

  try {
    const formData = new FormData()
    formData.append('photo', file)

    const response = await fetch('/api/validate-photo', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (data.valid) {
      setPhotoValid(true)
      setPhotoUrl(data.photoUrl)
    } else {
      setPhotoValid(false)
      setPhotoError(data.error || 'Please upload a clear photo of a child.')
    }
  } catch {
    setPhotoValid(false)
    setPhotoError('Could not process photo. Please try again.')
  }
  setPhotoValidating(false)
}

const removePhoto = () => {
  setPhotoPreview(null)
  setPhotoValid(null)
  setPhotoError('')
  setPhotoUrl(null)
  const input = document.getElementById('photo-input') as HTMLInputElement
  if (input) input.value = ''
}

  // ── Generate preview (2 pages with illustrations) ──
  const handleGeneratePreview = async () => {
    setPreviewLoading(true)
    try {
      const response = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: formData.childName,
          age: formData.age,
          gender: formData.gender,
          interests: formData.interests.join(', '),
          theme: formData.theme,
          photoUrl: photoUrl,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setPreviewData({ title: data.title, pages: data.pages, illustrations: data.illustrations || [] })
        setStep(3.5)
      } else {
        alert('Could not generate preview. Please try again.')
      }
    } catch {
      alert('Something went wrong. Please try again.')
    }
    setPreviewLoading(false)
  }

  // ── Razorpay payment flow ──
  const handlePayment = async () => {
    setPaymentLoading(true)
    try {
      // 1. Create order on server
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: formData.childName,
          age: formData.age,
          gender: formData.gender,
          interests: formData.interests.join(', '),
          theme: formData.theme,
          storyLength: formData.storyLength,
          deliveryType: formData.deliveryType,
          dedication: formData.dedication,
          userId: user?.id,
          photoUrl: photoUrl,
          email: formData.email,
        }),
      })
      const orderData = await orderRes.json()
      if (!orderData.success) {
        alert('Could not create order. Please try again.')
        setPaymentLoading(false)
        return
      }

      setSavedOrderId(orderData.orderId)
      console.log('Order created:', { orderId: orderData.orderId, razorpayOrderId: orderData.razorpayOrderId, amount: orderData.amount, keyId: orderData.keyId })

      // 2. Open Razorpay checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'StoryGennie',
        description: `${previewData?.title || 'Personalized Storybook'} for ${formData.childName}`,
        order_id: orderData.razorpayOrderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // 3. Verify payment and trigger generation
          setStatus('generating')
          setStep(4)
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderData.orderId,
                childName: formData.childName,
                age: formData.age,
                gender: formData.gender,
                interests: formData.interests.join(', '),
                theme: formData.theme,
                storyLength: formData.storyLength,
                dedication: formData.dedication,
                userId: user?.id,
                photoUrl: photoUrl,
                email: formData.email,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              trackEvent('story_generation_complete', {
                theme: formData.theme,
                age_group: formData.age,
              })
              setStatus('complete')
              setStory(verifyData.story)
              setIllustrations(verifyData.illustrations || [])
            } else {
              setStatus('error')
            }
          } catch {
            setStatus('error')
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false)
          },
        },
        prefill: {
          email: formData.email,
          contact: '',
        },
        theme: {
          color: '#F4A832',
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        console.log('Razorpay payment failed:', response.error)
        alert(`Oops! Something went wrong.\n${response.error?.description || 'Payment Failed'}`)
        setPaymentLoading(false)
      })
      rzp.open()
      setPaymentLoading(false)
    } catch (err) {
      console.log('Payment error:', err)
      alert('Payment failed. Please try again.')
      setPaymentLoading(false)
    }
  }

  // ── Legacy direct submit (kept for backward compat) ──
  const handleSubmit = async () => {
    setStatus('generating')
    setStep(4)
    console.log('Sending user ID:', user?.id)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: formData.childName,
          age: formData.age,
          interests: formData.interests.join(', '),
          theme: formData.theme,
          storyLength: formData.storyLength,
          dedication: formData.dedication,
          userId: user?.id,
          photoUrl: photoUrl,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setStatus('complete')
        setStory(data.story)
        setIllustrations(data.illustrations || [])
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const canProceedStep1 = formData.childName && formData.age && formData.gender && formData.email
  const canProceedStep2 = formData.interests.length > 0
  const canProceedStep3 = formData.theme

  return (
    <main className="min-h-screen bg-amber-50" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Razorpay checkout script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        .fredoka { font-family: 'Fredoka One', cursive; }
        .step-enter { animation: stepIn 0.35s ease; }
        @keyframes stepIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .chip-sel { background: #F4A832; border-color: #F4A832; color: white; }
        .theme-sel { border-color: #F4867A; background: white; box-shadow: 0 4px 16px rgba(244,134,122,0.2); }
        .delivery-sel { border-color: #F4A832; background: #FFFBF0; }
        .btn-primary { background: linear-gradient(135deg, #F4867A, #D9604F); color: white; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(244,134,122,0.4); }
        .btn-secondary { background: linear-gradient(135deg, #F4A832, #D4881A); color: white; transition: all 0.2s; }
        .btn-secondary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(244,168,50,0.4); }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>

      {/* NAV */}
      <nav className="bg-white border-b border-amber-100 px-6 py-4 flex items-center justify-between">
  <Link href="/" className="no-underline flex items-center gap-2">
  <img src="/logo.jpg" alt="StoryGennie" className="h-15 w-auto" />
  <span className="fredoka text-xl md:text-2xl text-amber-900">StoryGennie</span>
</Link>
  
  <div className="flex items-center gap-3">
  {user && (
    <>
      <Link href="/" className="text-sm font-bold text-amber-700 hover:text-amber-900 no-underline hidden sm:block">
        Home
      </Link>
      <Link href="/orders" className="text-sm font-bold text-amber-700 hover:text-amber-900 no-underline hidden sm:block">
        My Orders
      </Link>
      <span className="text-sm text-amber-700 font-semibold hidden sm:block">
        {user.user_metadata?.full_name || user.email}
      </span>
        {user.user_metadata?.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt="Profile"
            className="w-8 h-8 rounded-full border-2 border-amber-200"
          />
        )}
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.push('/')
}}
          className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all"
        >
          Sign Out
        </button>
      </>
    )}
  </div>

  {step < 4 && (

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s < Math.ceil(step) ? 'bg-green-500 text-white' :
                  s === Math.ceil(step) ? 'bg-amber-500 text-white' :
                  'bg-amber-100 text-amber-400'
                }`}>
                  {s < Math.ceil(step) ? '✓' : s}
                </div>
                {s < 4 && <div className={`w-8 h-0.5 ${s < Math.ceil(step) ? 'bg-green-400' : 'bg-amber-200'}`} />}
              </div>
            ))}
          </div>
        )}
      </nav>

<div className={`mx-auto px-4 py-8 ${step === 4 && status === 'complete' ? 'max-w-5xl' : 'max-w-2xl'}`}>

        {/* STEP 1 — ABOUT */}
        {step === 1 && (
          <div className="step-enter">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🧒</div>
              <h1 className="fredoka text-3xl text-amber-900 mb-2">About the Star of the Story</h1>
              <p className="text-amber-700">Tell us about the child — this is how we make it personal.</p>
            </div>

            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm space-y-5">

              <div>
                <label className="text-sm font-800 text-amber-800 block mb-1.5 font-bold uppercase tracking-wide text-xs">Child&apos;s Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Aria"
                  value={formData.childName}
                  onChange={e => setFormData({ ...formData, childName: e.target.value })}
                  className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">Age *</label>
                  <select
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50"
                  >
                    <option value="">Select age...</option>
                    <option>2-3 years</option>
                    <option>4-5 years</option>
                    <option>6-7 years</option>
                    <option>8-10 years</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">They are a... *</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50"
                  >
                    <option value="">Select...</option>
                    <option>Girl</option>
                    <option>Boy</option>
                    <option>Keep it neutral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">Nickname or fun detail (optional)</label>
                <input
                  type="text"
                  placeholder='e.g. "Loves her red shoes" or "Calls himself Captain Rohan"'
                  value={formData.nickname}
                  onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50"
                />
              </div>
              {/* Photo Upload */}
<div>
  <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">
    Photo of {formData.childName || 'the child'}
    <span className="text-amber-400 font-normal ml-1 normal-case">
      (Recommended — makes illustrations look like them!)
    </span>
  </label>

  <div
    onClick={() => document.getElementById('photo-input')?.click()}
    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
      photoPreview
        ? photoValid === true
          ? 'border-green-400 bg-green-50'
          : photoValid === false
          ? 'border-red-300 bg-red-50'
          : 'border-amber-300 bg-amber-50'
        : 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:bg-amber-100'
    }`}
  >
    <input
      type="file"
      id="photo-input"
      accept="image/*"
      className="hidden"
      onChange={handlePhotoUpload}
    />

    {photoPreview ? (
      <div className="flex items-center gap-4">
        <img
          src={photoPreview}
          alt="Child preview"
          className="w-16 h-16 rounded-full object-cover border-2 border-amber-300 flex-shrink-0"
        />
        <div className="flex-1 text-left">
          {photoValidating ? (
            <div>
              <p className="text-amber-600 font-semibold text-sm">🔍 Validating photo...</p>
              <p className="text-amber-500 text-xs mt-1">Generating your child&apos;s avatar...</p>
            </div>
          ) : photoValid === true ? (
  <div className="flex items-center gap-3 w-full">
    <div>
      <p className="text-green-600 font-semibold text-sm">✅ Perfect photo!</p>
      <p className="text-green-500 text-xs mt-1">Avatar ready — illustrations will look like them!</p>
    </div>
    {photoUrl && (
      <div className="ml-auto flex-shrink-0">
        <p className="text-xs text-green-600 font-bold mb-1 text-center">Avatar</p>
        <img
          src={photoUrl}
          alt="Generated avatar"
          className="w-16 h-16 rounded-xl object-cover border-2 border-green-400"
        />
      </div>
    )}
  </div>
          ) : photoValid === false ? (
            <div>
              <p className="text-red-500 font-semibold text-sm">❌ {photoError}</p>
              <p className="text-red-400 text-xs mt-1">Please try another photo.</p>
            </div>
          ) : null}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); removePhoto() }}
          className="text-xs text-red-400 hover:text-red-600 font-bold flex-shrink-0"
        >
          Remove
        </button>
      </div>
    ) : (
      <div>
        <div className="text-3xl mb-2">📸</div>
        <p className="text-amber-700 font-semibold text-sm">Click to upload a photo</p>
        <p className="text-amber-500 text-xs mt-1">JPG or PNG · Max 5MB · Used only for illustrations</p>
      </div>
    )}
  </div>
</div>

              <div>
  <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">
    Your Email *
  </label>
  <input
    type="email"
    placeholder="we'll send the storybook here"
    value={formData.email}
    onChange={e => setFormData({ ...formData, email: e.target.value })}
    className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50"
  />
</div>

              <div>
                <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">Personal dedication (optional)</label>
                <textarea
                  rows={2}
                  placeholder='"To my little star — may every dream come true. Love, Grandma"'
                  value={formData.dedication}
                  onChange={e => setFormData({ ...formData, dedication: e.target.value })}
                  className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50 resize-none"
                />
              </div>

              <button
                onClick={() => {
                  trackEvent('wizard_step1_complete', {
                    has_photo: photoUrl ? 'yes' : 'no',
                    age_group: formData.age,
                  })
                  setStep(2)
                }}
                disabled={!canProceedStep1}
                className={`w-full py-4 rounded-xl fredoka text-lg ${canProceedStep1 ? 'btn-secondary cursor-pointer' : 'bg-amber-100 text-amber-300 cursor-not-allowed'}`}
              >
                Pick Their Interests →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — INTERESTS */}
        {step === 2 && (
          <div className="step-enter">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">💛</div>
              <h1 className="fredoka text-3xl text-amber-900 mb-2">What Does {formData.childName} Love?</h1>
              <p className="text-amber-700">Pick up to 4 interests — we&apos;ll weave them into every page.</p>
            </div>

            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm space-y-6">

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-amber-800 uppercase tracking-wide">Interests ({formData.interests.length}/4)</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(({ label, emoji }) => (
                    <button
                      key={label}
                      onClick={() => toggleInterest(label)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-semibold transition-all ${
                        formData.interests.includes(label)
                          ? 'chip-sel border-amber-400'
                          : 'border-amber-200 text-amber-700 hover:border-amber-300 bg-amber-50'
                      }`}
                    >
                      <span>{emoji}</span> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-3">Story Length</label>
                <div className="grid grid-cols-3 gap-3">
                  {LENGTHS.map(({ label, emoji, pages, value }) => (
                    <button
                      key={value}
                      onClick={() => setFormData({ ...formData, storyLength: value })}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        formData.storyLength === value
                          ? 'border-sky-400 bg-sky-50'
                          : 'border-amber-200 bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{emoji}</div>
                      <div className="font-bold text-amber-900 text-sm">{label}</div>
                      <div className="text-xs text-amber-600">{pages}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border-2 border-amber-200 text-amber-700 font-bold hover:bg-amber-50 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    trackEvent('wizard_step2_complete', {
                      interests_count: formData.interests.length,
                      story_length: formData.storyLength,
                    })
                    setStep(3)
                  }}
                  disabled={!canProceedStep2}
                  className={`flex-1 py-3 rounded-xl fredoka text-lg ${canProceedStep2 ? 'btn-secondary cursor-pointer' : 'bg-amber-100 text-amber-300 cursor-not-allowed'}`}
                >
                  Choose Theme →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — THEME + DELIVERY */}
        {step === 3 && (
          <div className="step-enter">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🎨</div>
              <h1 className="fredoka text-3xl text-amber-900 mb-2">Pick the Story World</h1>
              <p className="text-amber-700">Choose a theme and how you&apos;d like to receive the book.</p>
            </div>

            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm space-y-6">

              <div>
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-3">Story Theme *</label>
                <div className="grid grid-cols-2 gap-3">
                  {THEMES.map(({ label, emoji, desc }) => (
                    <button
                      key={label}
                      onClick={() => setFormData({ ...formData, theme: label })}
                      className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                        formData.theme === label ? 'theme-sel' : 'border-amber-200 bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      {formData.theme === label && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                      )}
                      <div className="text-2xl mb-1">{emoji}</div>
                      <div className="font-bold text-amber-900 text-sm">{label}</div>
                      <div className="text-xs text-amber-600">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-3">Delivery</label>
                <div className="space-y-2">
                  {DELIVERY.map((plan) => (
                    <button
                      key={plan.value}
                      onClick={() => !plan.comingSoon && setFormData({ ...formData, deliveryType: plan.value })}
                      disabled={plan.comingSoon}
                      className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                        plan.comingSoon
                          ? 'border-amber-100 bg-amber-50/50 opacity-60 cursor-not-allowed'
                          : formData.deliveryType === plan.value ? 'delivery-sel' : 'border-amber-200 bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      <span className="text-2xl">{plan.emoji}</span>
                      <div className="flex-1">
                        <div className="font-bold text-amber-900 flex items-center gap-2">
                          {plan.name}
                          {plan.comingSoon && <span className="text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-bold">Coming Soon</span>}
                          {plan.popular && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">🎉 Intro Offer</span>}
                        </div>
                        <div className="text-xs text-amber-600">{plan.shortDesc}</div>
                      </div>
                      {plan.comingSoon ? (
                        <div className="fredoka text-sm text-amber-400">Coming Soon</div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="fredoka text-lg text-green-600">{plan.price}</span>
                          {plan.originalPrice && <span className="text-sm text-amber-400 line-through">{plan.originalPrice}</span>}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ORDER SUMMARY */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3">Order Summary</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-amber-600">Hero</span><span className="font-bold text-amber-900">{formData.childName}, {formData.age}</span></div>
                  <div className="flex justify-between"><span className="text-amber-600">Interests</span><span className="font-bold text-amber-900">{formData.interests.join(', ') || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-amber-600">Theme</span><span className="font-bold text-amber-900">{formData.theme || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-amber-600">Length</span><span className="font-bold text-amber-900">{formData.storyLength} pages</span></div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl border-2 border-amber-200 text-amber-700 font-bold hover:bg-amber-50 transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    trackEvent('wizard_step3_complete', {
                      theme: formData.theme,
                      age_group: formData.age,
                      has_photo: photoUrl ? 'yes' : 'no',
                      delivery_type: formData.deliveryType,
                    })
                    handleGeneratePreview()
                  }}
                  disabled={!canProceedStep3 || previewLoading}
                  className={`flex-1 py-3 rounded-xl fredoka text-lg ${canProceedStep3 && !previewLoading ? 'btn-primary cursor-pointer' : 'bg-amber-100 text-amber-300 cursor-not-allowed'}`}
                >
                  {previewLoading ? '✨ Creating Preview...' : '✨ Preview My Story!'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3.5 — PREVIEW + PAYWALL */}
        {step === 3.5 && previewData && (
          <div className="step-enter">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">📖</div>
              <h1 className="fredoka text-3xl text-amber-900 mb-2">{previewData.title}</h1>
              <p className="text-amber-700">Here&apos;s a sneak peek of {formData.childName}&apos;s story!</p>
            </div>

            {/* Preview Pages with illustrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Page 1 — fully visible */}
              <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-sm">
                <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Page 1</span>
                </div>
                {previewData.illustrations[0] && (
                  <img src={previewData.illustrations[0]} alt="Preview page 1" className="w-full" />
                )}
                <div className="p-4">
                  <p className="text-gray-800 leading-relaxed text-base" style={{ fontFamily: 'Georgia, serif' }}>
                    {previewData.pages[0]?.text}
                  </p>
                </div>
              </div>

              {/* Page 2 — blurred + locked */}
              <div className="relative rounded-2xl border border-amber-100 overflow-hidden shadow-sm">
                <div className="bg-white" style={{ filter: 'blur(5px)', userSelect: 'none' }}>
                  <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Page 2</span>
                  </div>
                  {previewData.illustrations[1] && (
                    <img src={previewData.illustrations[1]} alt="Preview page 2" className="w-full" />
                  )}
                  <div className="p-4">
                    <p className="text-gray-800 leading-relaxed text-base" style={{ fontFamily: 'Georgia, serif' }}>
                      {previewData.pages[1]?.text}
                    </p>
                  </div>
                </div>
                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50/60 backdrop-blur-sm">
                  <div className="text-4xl mb-2">🔒</div>
                  <p className="text-amber-800 font-bold text-sm">Unlock to read more</p>
                </div>
              </div>
            </div>

            {/* Remaining pages indicator */}
            <div className="flex items-center justify-center gap-2 py-2">
              {Array.from({ length: Math.max(0, parseInt(formData.storyLength) - 2) }, (_, i) => (
                <div key={i} className="w-8 h-1 bg-amber-200 rounded-full" />
              ))}
              <span className="text-xs text-amber-400 font-semibold ml-2">
                +{Math.max(0, parseInt(formData.storyLength) - 2)} more pages
              </span>
            </div>

            {/* Paywall Card */}
            <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-lg">
              <div className="text-center mb-5">
                <div className="text-3xl mb-2">✨</div>
                <h3 className="fredoka text-xl text-amber-900 mb-1">Unlock {formData.childName}&apos;s Full Book</h3>
                <p className="text-amber-600 text-sm">
                  {formData.storyLength} illustrated pages · Beautiful watercolor art · Downloadable PDF
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    trackEvent('payment_initiated', {
                      theme: formData.theme,
                      age_group: formData.age,
                      delivery_type: formData.deliveryType,
                    })
                    handlePayment()
                  }}
                  disabled={paymentLoading}
                  className={`w-full py-4 rounded-xl fredoka text-lg transition-all ${paymentLoading ? 'bg-amber-200 text-amber-400 cursor-not-allowed' : 'btn-primary cursor-pointer'}`}
                >
                  {paymentLoading ? 'Processing...' : `Pay ${getActivePlan().price} — Digital PDF 📲`}
                </button>

                <button
                  disabled
                  className="w-full py-4 rounded-xl border-2 border-amber-200 text-amber-400 fredoka text-lg cursor-not-allowed"
                >
                  📦 Printed Hardcover — Coming Soon
                </button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-amber-500">
                <span>🔒 Secure payment via Razorpay</span>
                <span>•</span>
                <span>💳 UPI, Cards, Netbanking</span>
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={() => setStep(3)}
              className="mt-4 w-full py-3 rounded-xl border-2 border-amber-200 text-amber-700 font-bold hover:bg-amber-50 transition-all"
            >
              ← Back to Theme Selection
            </button>
          </div>
        )}

        {/* STEP 4 — GENERATING / RESULT */}
        {step === 4 && (
          <div className="step-enter">
            {status === 'generating' && (
  <MagicalLoader
    childName={formData.childName}
    interests={formData.interests}
    theme={formData.theme}
    gender={formData.gender}
  />
)}

            {status === 'complete' && story && (
  <PageFlipBook
  title={story.title}
  pages={story.pages}
  illustrations={illustrations}
  childName={formData.childName}
  dedication={formData.dedication}
  customerEmail={formData.email}
  onRestart={() => { setStep(1); setStatus(''); setStory(null); setIllustrations([]); setPreviewData(null); setSavedOrderId(null); }}
/>
)}

            {status === 'error' && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">😔</div>
                <h2 className="fredoka text-2xl text-amber-900 mb-3">Something went wrong</h2>
                <p className="text-amber-700 mb-6">Please try again</p>
                <button
                  onClick={() => { setStep(1); setStatus(''); }}
                  className="px-8 py-3 rounded-xl fredoka text-lg btn-secondary"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
 function MagicalLoader({
  childName,
  interests,
  theme,
  gender,
}: {
  childName: string
  interests: string[]
  theme: string
  gender: string
}) {
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentFact, setCurrentFact] = useState(0)
  const [dots, setDots] = useState('.')

  const pronoun = gender === 'Girl' ? 'her' : gender === 'Boy' ? 'his' : 'their'
  const pronounCap = gender === 'Girl' ? 'Her' : gender === 'Boy' ? 'His' : 'Their'

  const stages = [
    {
      icon: '✍️',
      title: `Making ${childName} the hero`,
      subtitle: `Claude is writing ${pronoun} adventure in India`,
      duration: 20,
    },
    {
      icon: '🎨',
      title: `Building ${childName}'s world`,
      subtitle: `Adding ${interests[0] || 'magic'} to the ${theme}`,
      duration: 40,
    },
    {
      icon: '🖼️',
      title: `Painting ${pronoun} illustrations`,
      subtitle: `${pronounCap} story is coming to life`,
      duration: 30,
    },
    {
      icon: '📖',
      title: `Binding ${childName}'s storybook`,
      subtitle: 'Almost ready — just a few seconds!',
      duration: 10,
    },
  ]

  const facts = [
    `Adding ${interests[0] || 'magic'} to ${childName}'s adventure`,
    `Setting the scene in a magical Indian world`,
    `Making ${childName} the bravest hero`,
    interests[1] ? `Weaving ${interests[1]} into the story` : `Crafting a beautiful moral`,
    `Painting ${childName}'s unique character`,
    interests[2] ? `Bringing ${interests[2]} to life` : `Adding sparkle to every page`,
    `Creating memories that last forever`,
    `Almost done — the magic is nearly complete!`,
  ]

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 95) return 95
        return p + 0.8
      })
    }, 400)

    // Stage advancement
    const stageTimers = [
      setTimeout(() => setCurrentStage(1), 8000),
      setTimeout(() => setCurrentStage(2), 25000),
      setTimeout(() => setCurrentStage(3), 55000),
    ]

    // Rotating facts
    const factInterval = setInterval(() => {
      setCurrentFact(f => (f + 1) % facts.length)
    }, 3000)

    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots(d => d.length >= 3 ? '.' : d + '.')
    }, 500)

    return () => {
      clearInterval(progressInterval)
      clearInterval(factInterval)
      clearInterval(dotsInterval)
      stageTimers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="text-center py-8 px-4">
      <style>{`
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(15deg); opacity: 0.7; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .sparkle-anim { animation: sparkle 2s ease-in-out infinite; }
        .float-anim { animation: float 3s ease-in-out infinite; }
        .fade-in { animation: fadeIn 0.5s ease; }
        .shimmer {
          background: linear-gradient(90deg, #F4A832 0%, #F4867A 50%, #F4A832 100%);
          background-size: 200% auto;
          animation: shimmer 2s linear infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      {/* Avatar with sparkles */}
      <div className="relative inline-block mb-6 float-anim">
        <div className="w-24 h-24 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-5xl mx-auto">
          {gender === 'Girl' ? '👧' : gender === 'Boy' ? '👦' : '🧒'}
        </div>
        <div className="absolute -top-2 -right-2 text-xl sparkle-anim">✨</div>
        <div className="absolute -bottom-1 -left-2 text-lg sparkle-anim" style={{ animationDelay: '0.5s' }}>⭐</div>
        <div className="absolute top-1/2 -right-4 text-sm sparkle-anim" style={{ animationDelay: '1s' }}>✦</div>
      </div>

      {/* Main headline */}
      <h2 className="fredoka text-2xl md:text-3xl text-amber-900 mb-2">
        {childName} is becoming a hero{dots}
      </h2>
      <p className="text-amber-600 font-semibold text-sm mb-8">
        Your magical storybook is being crafted with love
      </p>

      {/* Stages */}
      <div className="max-w-sm mx-auto mb-8 space-y-3">
        {stages.map((stage, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-500 ${
              i < currentStage
                ? 'bg-green-50 border border-green-200'
                : i === currentStage
                ? 'bg-amber-50 border-2 border-amber-400 shadow-sm'
                : 'bg-gray-50 border border-gray-100 opacity-40'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
              i < currentStage
                ? 'bg-green-100'
                : i === currentStage
                ? 'bg-amber-100'
                : 'bg-gray-100'
            }`}>
              {i < currentStage ? '✅' : stage.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-sm ${
                i < currentStage ? 'text-green-700' :
                i === currentStage ? 'text-amber-900' :
                'text-gray-400'
              }`}>
                {stage.title}
              </div>
              <div className={`text-xs mt-0.5 ${
                i < currentStage ? 'text-green-600' :
                i === currentStage ? 'text-amber-600' :
                'text-gray-300'
              }`}>
                {stage.subtitle}
              </div>
            </div>
            {i === currentStage && (
              <div className="flex gap-1 flex-shrink-0">
                {[0, 1, 2].map(d => (
                  <div
                    key={d}
                    className="w-1.5 h-1.5 bg-amber-400 rounded-full"
                    style={{ animation: `sparkle 1s ease-in-out ${d * 0.2}s infinite` }}
                  />
                ))}
              </div>
            )}
            {i < currentStage && (
              <div className="text-green-500 font-black text-sm flex-shrink-0">✓</div>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="max-w-sm mx-auto mb-6">
        <div className="flex justify-between text-xs text-amber-600 font-bold mb-2">
          <span>Creating magic...</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-amber-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #F4A832, #F4867A)',
            }}
          />
        </div>
      </div>

      {/* Rotating fun facts */}
      <div className="max-w-xs mx-auto bg-white border border-amber-200 rounded-2xl px-4 py-3">
        <div key={currentFact} className="fade-in">
          <div className="text-lg mb-1">
            {['🦕', '🌟', '🎨', '🏰', '✨', '🇮🇳', '📖', '🎉'][currentFact % 8]}
          </div>
          <p className="text-xs font-semibold text-amber-800 leading-relaxed">
            {facts[currentFact]}
          </p>
        </div>
      </div>

      <p className="text-amber-400 text-xs mt-6 font-semibold">
        Takes about 30-60 seconds · Please don&apos;t close this tab
      </p>
    </div>
  )
}
function PageFlipBook({
  title,
  pages,
  illustrations,
  childName,
  dedication,
  customerEmail,
  onRestart,
}: {
  title: string
  pages: StoryPage[]
  illustrations: string[]
  childName: string
  dedication: string
  customerEmail: string
  onRestart: () => void
}) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadPDF = async () => {
  setDownloading(true)
  try {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        pages,
        illustrations,
        childName,
        dedication,
        orderId: Date.now().toString(),
      }),
    })

    const data = await response.json()

    if (data.success && data.pdfUrl) {
      trackEvent('pdf_downloaded', {
        child_name_length: childName.length,
      })

      // Open PDF in new tab
      window.open(data.pdfUrl, '_blank')

      // Send email with real Supabase URL
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: customerEmail,
          childName,
          title,
          downloadUrl: data.pdfUrl,
        }),
      })
    }
  } catch (error) {
    console.log('Download error:', error)
  }
  setDownloading(false)
}
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)

  const goTo = (index: number, dir: 'next' | 'prev') => {
    if (animating) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrent(index)
      setAnimating(false)
    }, 350)
  }

  const next = () => {
    if (current < pages.length - 1) goTo(current + 1, 'next')
  }

  const prev = () => {
    if (current > 0) goTo(current - 1, 'prev')
  }

  return (
    <div>
      <style>{`
        .page-exit-next { animation: exitLeft 0.35s ease forwards; }
        .page-exit-prev { animation: exitRight 0.35s ease forwards; }
        .page-enter-next { animation: enterRight 0.35s ease forwards; }
        .page-enter-prev { animation: enterLeft 0.35s ease forwards; }

        @keyframes exitLeft {
          from { opacity: 1; transform: translateX(0) rotateY(0deg); }
          to { opacity: 0; transform: translateX(-60px) rotateY(15deg); }
        }
        @keyframes exitRight {
          from { opacity: 1; transform: translateX(0) rotateY(0deg); }
          to { opacity: 0; transform: translateX(60px) rotateY(-15deg); }
        }
        @keyframes enterRight {
          from { opacity: 0; transform: translateX(60px) rotateY(-15deg); }
          to { opacity: 1; transform: translateX(0) rotateY(0deg); }
        }
        @keyframes enterLeft {
          from { opacity: 0; transform: translateX(-60px) rotateY(15deg); }
          to { opacity: 1; transform: translateX(0) rotateY(0deg); }
        }
      `}</style>

      {/* Book title */}
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">📖</div>
        <h2 className="fredoka text-2xl text-amber-900">{title}</h2>
        <p className="text-amber-600 text-sm mt-1">
          A personalized story for {childName}
        </p>
      </div>
{/* Page card */}
      

{/* Page card — split layout: illustration left, text right */}
      <div
        className={`bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-lg ${
          animating
            ? direction === 'next'
              ? 'page-exit-next'
              : 'page-exit-prev'
            : direction === 'next'
            ? 'page-enter-next'
            : 'page-enter-prev'
        }`}
        style={{ perspective: '1000px', minHeight: '420px' }}
      >
        <div className="flex flex-col md:flex-row" style={{ minHeight: '520px' }}>
          {/* LEFT — Illustration */}
          {/* LEFT — Illustration, stretches to match text height */}
          <div className="md:w-1/2 flex-shrink-0 bg-amber-50 self-stretch">
  {illustrations[current] ? (
    <img
      src={illustrations[current] as string}
      alt={`Page ${pages[current].page}`}
      className="w-full object-cover"
      style={{ height: '100%', minHeight: '520px', display: 'block' }}
    />
  ) : (
    <div
      className="w-full flex flex-col items-center justify-center bg-amber-50"
      style={{ minHeight: '520px' }}
    >
      <div className="text-6xl mb-4 opacity-30">📖</div>
      <p className="text-amber-300 text-sm font-semibold tracking-wide uppercase">
        Page {pages[current].page}
      </p>
    </div>
  )}
</div>

          {/* RIGHT — Story text, scrollable if very long */}
          <div className="md:w-1/2 flex flex-col justify-start px-8 py-10 overflow-y-auto" style={{ background: '#fdf8f0', maxHeight: '700px' }}>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">
              Page {pages[current].page} of {pages.length}
            </div>
            <p className="text-gray-800 leading-relaxed text-lg" style={{ fontFamily: 'Georgia, serif' }}>
              {pages[current].text}
            </p>
          </div>
        
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={prev}
          disabled={current === 0}
          className={`px-6 py-3 rounded-xl border-2 font-bold transition-all ${
            current === 0
              ? 'border-amber-100 text-amber-300 cursor-not-allowed'
              : 'border-amber-300 text-amber-700 hover:bg-amber-50'
          }`}
        >
          ← Prev
        </button>

        {/* Dot indicators */}
        <div className="flex gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > current ? 'next' : 'prev')}
              className={`rounded-full transition-all ${
                i === current
                  ? 'w-6 h-3 bg-amber-500'
                  : 'w-3 h-3 bg-amber-200 hover:bg-amber-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={current === pages.length - 1}
          className={`px-6 py-3 rounded-xl font-bold transition-all ${
            current === pages.length - 1
              ? 'bg-amber-100 text-amber-300 cursor-not-allowed'
              : 'btn-secondary cursor-pointer'
          }`}
        >
          Next →
        </button>
      </div>

      {/* Bottom actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onRestart}
          className="flex-1 py-3 rounded-xl border-2 border-amber-300 text-amber-700 font-bold hover:bg-amber-50 transition-all"
        >
          Create Another
        </button>
        <button
  onClick={handleDownloadPDF}
  disabled={downloading}
  className={`flex-1 py-3 rounded-xl fredoka text-lg ${downloading ? 'bg-amber-200 text-amber-400 cursor-not-allowed' : 'btn-secondary cursor-pointer'}`}
>
  {downloading ? 'Generating PDF...' : 'Download PDF 📄'}
</button>
      </div>
    </div>
  )
 
}