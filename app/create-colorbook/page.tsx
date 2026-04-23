'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import Script from 'next/script'
import { COLORBOOK_PLAN } from '@/lib/pricing'

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Razorpay: any
  }
}

interface ColoringPage {
  page: number
  letter?: string
  number?: string
  word: string
  text: string
  scene: string
}

interface FormData {
  childName: string
  age: string
  gender: string
  interests: string[]
  mode: 'abc' | '123'
  pageCount: 10 | 26
  dedication: string
  email: string
}

const INTERESTS = [
  { label: 'Dinosaurs', emoji: '🦕' },
  { label: 'Space', emoji: '🚀' },
  { label: 'Unicorns', emoji: '🦄' },
  { label: 'Dragons', emoji: '🐉' },
  { label: 'Ocean', emoji: '🌊' },
  { label: 'Animals', emoji: '🐾' },
  { label: 'Magic', emoji: '🔮' },
  { label: 'Cars', emoji: '🚗' },
]

export default function CreateColorbook() {
  const [step, setStep] = useState(1)
  const [status, setStatus] = useState('')
  const [story, setStory] = useState<{ title: string; pages: ColoringPage[] } | null>(null)
  const [illustrations, setIllustrations] = useState<string[]>([])
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    childName: '',
    age: '',
    gender: '',
    interests: [],
    mode: 'abc',
    pageCount: 26,
    dedication: '',
    email: '',
  })

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoValidating, setPhotoValidating] = useState(false)
  const [photoValid, setPhotoValid] = useState<boolean | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

// ── Preview + Payment state ──
const [previewData, setPreviewData] = useState<{ title: string; pages: ColoringPage[]; illustrations: string[] } | null>(null)
const [previewLoading, setPreviewLoading] = useState(false)
const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?next=/create-colorbook')
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
      const fd = new FormData()
      fd.append('photo', file)

      const response = await fetch('/api/validate-photo?mode=coloringbook', {
        method: 'POST',
        body: fd,
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

  // ── Generate coloring book preview (2 pages with illustrations) ──
  const handleGeneratePreview = async () => {
    setPreviewLoading(true)
    try {
      const response = await fetch('/api/generate-colorbook-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: formData.childName,
          age: formData.age,
          interests: formData.interests.join(', '),
          mode: formData.mode,
          photoUrl: photoUrl,
        }),
      })
      const data = await response.json()
      if (data.success) {
        setPreviewData({ title: data.title, pages: data.pages, illustrations: data.illustrations })
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
          theme: formData.mode === 'abc' ? 'ABC Adventure' : '123 World',
          storyLength: String(formData.pageCount),
          deliveryType: 'digital',
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

      console.log('Order created:', { orderId: orderData.orderId, razorpayOrderId: orderData.razorpayOrderId })

      // 2. Open Razorpay checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'StoryGennie',
        description: `${previewData?.title || 'Coloring Book'} for ${formData.childName}`,
        order_id: orderData.razorpayOrderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // 3. Verify payment and trigger generation
          setStatus('generating')
          setStep(4)
          try {
            const verifyRes = await fetch('/api/verify-colorbook-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderData.orderId,
                childName: formData.childName,
                age: formData.age,
                interests: formData.interests.join(', '),
                mode: formData.mode,
                pageCount: formData.pageCount,
                dedication: formData.dedication,
                userId: user?.id,
                photoUrl: photoUrl,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
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

  const handleSubmit = async () => {
    setStatus('generating')
    setStep(4)
    try {
      const response = await fetch('/api/generate-learning-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          interests: formData.interests.join(', '),
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
        .btn-primary { background: linear-gradient(135deg, #F4867A, #D9604F); color: white; transition: all 0.2s; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(244,134,122,0.4); }
        .btn-secondary { background: linear-gradient(135deg, #F4A832, #D4881A); color: white; transition: all 0.2s; }
        .btn-secondary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(244,168,50,0.4); }
      `}</style>

      {/* NAV */}
      <nav className="bg-white border-b border-amber-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="no-underline flex items-center gap-2">
            <img src="/logo.jpg" alt="StoryGennie" className="h-15 w-auto" />
            <span className="fredoka text-xl md:text-2xl text-amber-900">StoryGennie</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          {user && (
            <>
              <Link href="/" className="text-sm font-bold text-amber-700 hover:text-amber-900 no-underline hidden sm:block">
                Home
              </Link>
              <Link href="/orders" className="text-sm font-bold text-amber-700 hover:text-amber-900 no-underline hidden sm:block">
                My Orders
              </Link>
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border-2 border-amber-200" />
              )}
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

      <div className={`mx-auto px-4 py-8 ${step === 4 && status === 'complete' ? 'max-w-6xl' : 'max-w-2xl'}`}>

        {/* STEP 1 — ABOUT */}
        {step === 1 && (
          <div className="step-enter">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🖍️</div>
              <h1 className="fredoka text-3xl text-amber-900 mb-2">Create Their Coloring Book</h1>
              <p className="text-amber-700">Tell us about the child to make the illustrations personal.</p>
            </div>

            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm space-y-5">
              <div>
                <label className="text-sm font-800 text-amber-800 block mb-1.5 font-bold uppercase tracking-wide text-xs">Child&apos;s Name *</label>
                <input type="text" placeholder="e.g. Aria" value={formData.childName} onChange={e => setFormData({ ...formData, childName: e.target.value })} className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">Age *</label>
                  <select value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50">
                    <option value="">Select age...</option>
                    <option>2-3 years</option>
                    <option>4-5 years</option>
                    <option>6-7 years</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">They are a... *</label>
                  <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50">
                    <option value="">Select...</option>
                    <option>Girl</option>
                    <option>Boy</option>
                    <option>Keep it neutral</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">
                  Photo of {formData.childName || 'the child'}
                  <span className="text-amber-400 font-normal ml-1 normal-case">
                    (Used to describe their look for the coloring pages!)
                  </span>
                </label>

                <div onClick={() => document.getElementById('photo-input')?.click()} className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${photoPreview ? photoValid === true ? 'border-green-400 bg-green-50' : photoValid === false ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50' : 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:bg-amber-100'}`}>
                  <input type="file" id="photo-input" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

                  {photoPreview ? (
                    <div className="flex items-center gap-4">
                      <img src={photoPreview} alt="Child preview" className="w-16 h-16 rounded-full object-cover border-2 border-amber-300 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        {photoValidating ? (
                          <div>
                            <p className="text-amber-600 font-semibold text-sm">🔍 Analyzing photo...</p>
                            <p className="text-amber-500 text-xs mt-1">Extracting description for coloring art...</p>
                          </div>
                        ) : photoValid === true ? (
                          <div>
                            <p className="text-green-600 font-semibold text-sm">✅ Perfect photo!</p>
                            <p className="text-green-500 text-xs mt-1">We&apos;ll use this to style their character.</p>
                          </div>
                        ) : photoValid === false ? (
                          <div>
                            <p className="text-red-500 font-semibold text-sm">❌ {photoError}</p>
                            <p className="text-red-400 text-xs mt-1">Please try another photo.</p>
                          </div>
                        ) : null}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removePhoto() }} className="text-xs text-red-400 hover:text-red-600 font-bold flex-shrink-0">Remove</button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">📸</div>
                      <p className="text-amber-700 font-semibold text-sm">Click to upload a photo</p>
                      <p className="text-amber-500 text-xs mt-1">JPG or PNG · Max 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">Your Email *</label>
                <input type="email" placeholder="we'll send the storybook here" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50" />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-800 block mb-1.5 uppercase tracking-wide">Personal dedication (optional)</label>
                <textarea rows={2} placeholder='"To my little star..."' value={formData.dedication} onChange={e => setFormData({ ...formData, dedication: e.target.value })} className="w-full border border-amber-200 rounded-xl px-4 py-3 text-amber-900 focus:outline-none focus:border-amber-400 bg-amber-50 resize-none" />
              </div>

              <button onClick={() => setStep(2)} disabled={!canProceedStep1} className={`w-full py-4 rounded-xl fredoka text-lg ${canProceedStep1 ? 'btn-secondary cursor-pointer' : 'bg-amber-100 text-amber-300 cursor-not-allowed'}`}>
                Pick Book Options →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — OPTIONS */}
        {step === 2 && (
          <div className="step-enter">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🎨</div>
              <h1 className="fredoka text-3xl text-amber-900 mb-2">Customize the Book</h1>
              <p className="text-amber-700">Choose what they&apos;ll learn and what they love.</p>
            </div>

            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm space-y-6">
              
              <div>
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-3">Learning Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setFormData({ ...formData, mode: 'abc', pageCount: 26 })} className={`p-4 rounded-xl border-2 text-center transition-all ${formData.mode === 'abc' ? 'border-sky-400 bg-sky-50' : 'border-amber-200 bg-amber-50 hover:border-amber-300'}`}>
                    <div className="text-3xl font-bold text-sky-500 mb-1">ABC</div>
                    <div className="font-bold text-amber-900 text-sm">Alphabet Journey</div>
                    <div className="text-xs text-amber-500 mt-1">26 pages · A to Z</div>
                  </button>
                  <button onClick={() => setFormData({ ...formData, mode: '123', pageCount: 10 })} className={`p-4 rounded-xl border-2 text-center transition-all ${formData.mode === '123' ? 'border-sky-400 bg-sky-50' : 'border-amber-200 bg-amber-50 hover:border-amber-300'}`}>
                    <div className="text-3xl font-bold text-sky-500 mb-1">123</div>
                    <div className="font-bold text-amber-900 text-sm">Number Adventure</div>
                    <div className="text-xs text-amber-500 mt-1">10 pages · 1 to 10</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-3">Book Length</label>
                <div className="w-full p-4 rounded-xl border-2 border-sky-400 bg-sky-50 text-center">
                  <div className="font-bold text-amber-900 text-sm">{formData.pageCount} Pages</div>
                  <div className="text-xs text-amber-600">{formData.mode === 'abc' ? 'Letters A to Z' : 'Numbers 1 to 10'}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-amber-800 uppercase tracking-wide">Interests ({formData.interests.length}/4)</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(({ label, emoji }) => (
                    <button key={label} onClick={() => toggleInterest(label)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm font-semibold transition-all ${formData.interests.includes(label) ? 'chip-sel border-amber-400' : 'border-amber-200 text-amber-700 hover:border-amber-300 bg-amber-50'}`}>
                      <span>{emoji}</span> {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border-2 border-amber-200 text-amber-700 font-bold hover:bg-amber-50 transition-all">← Back</button>
                <button onClick={() => setStep(3)} disabled={!canProceedStep2} className={`flex-1 py-3 rounded-xl fredoka text-lg ${canProceedStep2 ? 'btn-secondary cursor-pointer' : 'bg-amber-100 text-amber-300 cursor-not-allowed'}`}>Delivery & Review →</button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — DELIVERY */}
        {step === 3 && (
          <div className="step-enter">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">📲</div>
              <h1 className="fredoka text-3xl text-amber-900 mb-2">Review & Create</h1>
              <p className="text-amber-700">Digital coloring book ready to print at home.</p>
            </div>

            <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm space-y-6">
              
              <div>
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-3">Delivery Option</label>
                <div className="w-full p-4 rounded-xl border-2 border-amber-400 bg-[#FFFBF0] text-left flex items-center gap-3">
                  <span className="text-3xl">{COLORBOOK_PLAN.emoji}</span>
                  <div className="flex-1">
                    <div className="font-bold text-amber-900 flex items-center gap-2">
                      {COLORBOOK_PLAN.name}
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">🎉 Intro Offer</span>
                    </div>
                    <div className="text-xs text-amber-600">{COLORBOOK_PLAN.desc}</div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="fredoka text-xl text-green-600">{COLORBOOK_PLAN.price}</span>
                    {COLORBOOK_PLAN.originalPrice && <span className="text-sm text-amber-400 line-through">{COLORBOOK_PLAN.originalPrice}</span>}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3">Order Summary</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-amber-600">Child</span><span className="font-bold text-amber-900">{formData.childName}, {formData.age}</span></div>
                  <div className="flex justify-between"><span className="text-amber-600">Book Type</span><span className="font-bold text-amber-900">Coloring Book ({formData.mode.toUpperCase()})</span></div>
                  <div className="flex justify-between"><span className="text-amber-600">Length</span><span className="font-bold text-amber-900">{formData.pageCount} pages</span></div>
                  <div className="flex justify-between"><span className="text-amber-600">Total</span><span className="font-bold text-amber-900">{COLORBOOK_PLAN.price}</span></div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border-2 border-amber-200 text-amber-700 font-bold hover:bg-amber-50 transition-all">← Back</button>
                <button onClick={handleGeneratePreview} disabled={previewLoading} className={`flex-1 py-3 rounded-xl fredoka text-lg ${!previewLoading ? 'btn-primary cursor-pointer' : 'bg-amber-100 text-amber-300 cursor-not-allowed'}`}>
                  {previewLoading ? '✨ Creating Preview...' : '✨ Preview Coloring Book!'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3.5 — PREVIEW + PAYWALL */}
        {step === 3.5 && previewData && (
          <div className="step-enter">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🖍️</div>
              <h1 className="fredoka text-3xl text-amber-900 mb-2">{previewData.title}</h1>
              <p className="text-amber-700">Here&apos;s a sneak peek of {formData.childName}&apos;s coloring book!</p>
            </div>

            {/* Preview Pages with actual illustrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Page 1 — fully visible */}
              <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-sm">
                <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">1</div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                    {formData.mode === 'abc' ? `Letter ${previewData.pages[0]?.letter}` : `Number ${previewData.pages[0]?.number}`}
                  </span>
                  <span className="ml-auto text-sm font-bold text-amber-800">{previewData.pages[0]?.word}</span>
                </div>
                {previewData.illustrations[0] && (
                  <img src={previewData.illustrations[0]} alt="Preview page 1" className="w-full" />
                )}
                <div className="p-4">
                  <p className="text-gray-800 text-sm leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                    {previewData.pages[0]?.text}
                  </p>
                </div>
              </div>

              {/* Page 2 — blurred + locked */}
              <div className="relative rounded-2xl border border-amber-100 overflow-hidden shadow-sm">
                <div className="bg-white" style={{ filter: 'blur(5px)', userSelect: 'none' }}>
                  <div className="p-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                      {formData.mode === 'abc' ? `Letter ${previewData.pages[1]?.letter}` : `Number ${previewData.pages[1]?.number}`}
                    </span>
                  </div>
                  {previewData.illustrations[1] && (
                    <img src={previewData.illustrations[1]} alt="Preview page 2" className="w-full" />
                  )}
                  <div className="p-4">
                    <p className="text-gray-800 text-sm leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                      {previewData.pages[1]?.text}
                    </p>
                  </div>
                </div>
                {/* Lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-50/60 backdrop-blur-sm">
                  <div className="text-4xl mb-2">🔒</div>
                  <p className="text-amber-800 font-bold text-sm">Unlock to see all pages</p>
                </div>
              </div>
            </div>

            {/* Remaining pages indicator */}
            <div className="flex items-center justify-center gap-2 py-2 mb-6">
              {Array.from({ length: Math.max(0, formData.pageCount - 2) }, (_, i) => (
                <div key={i} className="w-8 h-1 bg-amber-200 rounded-full" />
              ))}
              <span className="text-xs text-amber-400 font-semibold ml-2">
                +{Math.max(0, formData.pageCount - 2)} more coloring pages
              </span>
            </div>

            {/* Paywall Card */}
            <div className="bg-white rounded-2xl border-2 border-amber-300 p-6 shadow-lg">
              <div className="text-center mb-5">
                <div className="text-3xl mb-2">✨</div>
                <h3 className="fredoka text-xl text-amber-900 mb-1">Unlock {formData.childName}&apos;s Full Coloring Book</h3>
                <p className="text-amber-600 text-sm">
                  {formData.pageCount} printable coloring pages · Line art illustrations · Downloadable PDF
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className={`w-full py-4 rounded-xl fredoka text-lg transition-all ${paymentLoading ? 'bg-amber-200 text-amber-400 cursor-not-allowed' : 'btn-primary cursor-pointer'}`}
                >
                  {paymentLoading ? 'Processing...' : `Pay ${COLORBOOK_PLAN.price} — Digital PDF 🖨️`}
                </button>

                <button
                  disabled
                  className="w-full py-4 rounded-xl border-2 border-amber-200 text-amber-400 fredoka text-lg cursor-not-allowed"
                >
                  📦 Printed Book — Coming Soon
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
              ← Back to Review
            </button>
          </div>
        )}

        {/* STEP 4 — GENERATING / RESULT */}
        {step === 4 && (
          <div className="step-enter">
            {status === 'generating' && (
              <div className="text-center py-16">
                <div className="text-6xl mb-6 animate-bounce">🖍️</div>
                <h2 className="fredoka text-2xl text-amber-900 mb-2">Drawing {formData.childName}&apos;s Coloring Book...</h2>
                <p className="text-amber-600 font-semibold mb-8">Creating line art and writing the story. Takes about 45 seconds.</p>
                
                <div className="max-w-sm mx-auto">
                  <div className="h-3 bg-amber-100 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 left-0 h-full w-1/2 bg-amber-400 rounded-full animate-pulse" style={{ animationDuration: '2s', width: '100%' }}></div>
                  </div>
                </div>
              </div>
            )}

            {status === 'complete' && story && (
              <ColoringBookViewer
                title={story.title}
                pages={story.pages}
                illustrations={illustrations}
                childName={formData.childName}
                mode={formData.mode}
                onRestart={() => { setStep(1); setStatus(''); setStory(null); setIllustrations([]); setPreviewData(null); }}
              />
            )}

            {status === 'error' && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">😔</div>
                <h2 className="fredoka text-2xl text-amber-900 mb-3">Something went wrong</h2>
                <p className="text-amber-700 mb-6">Please try again</p>
                <button onClick={() => { setStep(1); setStatus(''); }} className="px-8 py-3 rounded-xl fredoka text-lg btn-secondary">Try Again</button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

function ColoringBookViewer({
  title,
  pages,
  illustrations,
  childName,
  mode,
  onRestart,
}: {
  title: string
  pages: ColoringPage[]
  illustrations: string[]
  childName: string
  mode: 'abc' | '123'
  onRestart: () => void
}) {
  const [current, setCurrent] = useState(0)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    // We already generated the PDF in the background during handleSubmit.
    // However, to keep it simple, we can just point to the orders page 
    // or we'd need to return the pdfUrl from the generate API.
    // Let's implement a direct PDF generation trigger here as a fallback:
    setDownloading(true)
    fetch('/api/generate-coloring-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        pages,
        illustrations,
        childName,
        dedication: '',
        orderId: Date.now().toString(),
        mode,
      }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.success && data.pdfUrl) {
        window.open(data.pdfUrl, '_blank')
      }
      setDownloading(false)
    })
    .catch(() => setDownloading(false))
  }

  const next = () => {
    if (current < pages.length - 1) setCurrent(current + 1)
  }

  const prev = () => {
    if (current > 0) setCurrent(current - 1)
  }

  const itemChar = mode === 'abc' ? pages[current].letter : pages[current].number

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🖍️</div>
        <h2 className="fredoka text-3xl text-amber-900">{title}</h2>
        <p className="text-amber-600 font-semibold mt-1">Ready to download and print!</p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-xl flex flex-col md:flex-row" style={{ minHeight: '600px' }}>
        
        {/* LEFT PANEL - Illustration */}
        <div className="md:w-1/2 bg-white flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 p-6">
          {illustrations[current] ? (
            <img src={illustrations[current]} alt={`Page ${current + 1}`} className="w-full h-auto object-contain border border-gray-100 rounded-lg shadow-sm" style={{ maxHeight: '500px' }} />
          ) : (
            <div className="w-full h-64 bg-gray-50 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400">Loading drawing...</div>
          )}
        </div>

        {/* RIGHT PANEL - Content */}
        <div className="md:w-1/2 bg-gray-50 flex flex-col p-8 md:p-12 relative">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest absolute top-6 right-6">
            Page {current + 1} of {pages.length}
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Massive outlined letter/number */}
            <div className="text-[120px] leading-none font-black text-white" style={{ WebkitTextStroke: '3px #333', textShadow: '2px 2px 0 #fff' }}>
              {itemChar}
            </div>
            
            {/* Highlight word badge */}
            <div className="mt-4 mb-8 bg-amber-100 text-amber-900 px-6 py-2 rounded-full font-bold text-xl border-2 border-amber-300 inline-block shadow-sm">
              {pages[current].word}
            </div>
            
            {/* Story text */}
            <p className="text-gray-800 text-xl font-medium leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
              {pages[current].text}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={prev} disabled={current === 0} className={`px-6 py-3 rounded-xl border-2 font-bold transition-all ${current === 0 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}`}>← Prev</button>
          <span className="text-sm font-bold text-amber-600">{current + 1} / {pages.length}</span>
          <button onClick={next} disabled={current === pages.length - 1} className={`px-6 py-3 rounded-xl font-bold transition-all ${current === pages.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'btn-secondary cursor-pointer'}`}>Next →</button>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={onRestart} className="px-6 py-3 rounded-xl border-2 border-amber-300 text-amber-700 font-bold hover:bg-amber-50 transition-all flex-1 sm:flex-none">Create Another</button>
          <button onClick={handleDownload} disabled={downloading} className={`px-8 py-3 rounded-xl fredoka text-lg transition-all flex-1 sm:flex-none ${downloading ? 'bg-amber-200 text-amber-400 cursor-not-allowed' : 'btn-primary shadow-lg hover:shadow-xl'}`}>
            {downloading ? 'Preparing PDF...' : 'Download PDF 🖨️'}
          </button>
        </div>
      </div>
    </div>
  )
}
