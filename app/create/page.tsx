'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

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

const DELIVERY = [
  { label: 'Digital PDF', emoji: '📲', desc: 'Download instantly', price: '₹299', value: 'digital' },
  { label: 'Printed Book', emoji: '📦', desc: 'Ships in 5-7 days', price: '₹1,199', value: 'print' },
  { label: 'Both', emoji: '🎁', desc: 'PDF + hardcover', price: '₹1,399', value: 'both' },
]

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

  const handleSubmit = async () => {
    setStatus('generating')
    setStep(4)
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
  <div className="fredoka text-2xl text-amber-900">📖 StoryTales</div>
  
  <div className="flex items-center gap-3">
    {user && (
      <>
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
            router.push('/login')
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
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s < step ? 'bg-green-500 text-white' :
                  s === step ? 'bg-amber-500 text-white' :
                  'bg-amber-100 text-amber-400'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-green-400' : 'bg-amber-200'}`} />}
              </div>
            ))}
          </div>
        )}
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

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
                onClick={() => setStep(2)}
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
                  onClick={() => setStep(3)}
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
                  {DELIVERY.map(({ label, emoji, desc, price, value }) => (
                    <button
                      key={value}
                      onClick={() => setFormData({ ...formData, deliveryType: value })}
                      className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                        formData.deliveryType === value ? 'delivery-sel' : 'border-amber-200 bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      <span className="text-2xl">{emoji}</span>
                      <div className="flex-1">
                        <div className="font-bold text-amber-900">{label}</div>
                        <div className="text-xs text-amber-600">{desc}</div>
                      </div>
                      <div className="fredoka text-lg text-green-600">{price}</div>
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
                  onClick={handleSubmit}
                  disabled={!canProceedStep3}
                  className={`flex-1 py-3 rounded-xl fredoka text-lg ${canProceedStep3 ? 'btn-primary cursor-pointer' : 'bg-amber-100 text-amber-300 cursor-not-allowed'}`}
                >
                  ✨ Create My Story!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — GENERATING / RESULT */}
        {step === 4 && (
          <div className="step-enter">
            {status === 'generating' && (
              <div className="text-center py-16">
                <div className="text-6xl mb-6 pulse">🪄</div>
                <h2 className="fredoka text-3xl text-amber-900 mb-3">Creating {formData.childName}&apos;s Story...</h2>
                <p className="text-amber-700 mb-2">Our illustrators are working their magic!</p>
                <p className="text-amber-500 text-sm">This takes about 30-40 seconds</p>
                <div className="mt-8 flex justify-center gap-2">
                  {['Writing story...', 'Drawing illustrations...', 'Adding magic...'].map((msg, i) => (
                    <div key={i} className="px-3 py-1 bg-amber-100 rounded-full text-xs text-amber-700" style={{ animationDelay: `${i * 0.5}s` }}>{msg}</div>
                  ))}
                </div>
              </div>
            )}

            {status === 'complete' && story && (
  <PageFlipBook
  title={story.title}
  pages={story.pages}
  illustrations={illustrations}
  childName={formData.childName}
  dedication={formData.dedication}
  customerEmail={formData.email}
  onRestart={() => { setStep(1); setStatus(''); setStory(null); setIllustrations([]); }}
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
      <div
        className={`bg-white rounded-2xl border border-amber-100 overflow-hidden shadow-md ${
          animating
            ? direction === 'next'
              ? 'page-exit-next'
              : 'page-exit-prev'
            : direction === 'next'
            ? 'page-enter-next'
            : 'page-enter-prev'
        }`}
        style={{ perspective: '1000px' }}
      >
        {/* Illustration */}
        {illustrations[current] ? (
          <img
            src={illustrations[current]}
            alt={`Page ${pages[current].page}`}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-amber-100 flex items-center justify-center text-4xl">
            📖
          </div>
        )}

        {/* Story text */}
        <div className="p-6">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-3">
            Page {pages[current].page} of {pages.length}
          </div>
          <p className="text-amber-900 leading-relaxed text-lg">
            {pages[current].text}
          </p>
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