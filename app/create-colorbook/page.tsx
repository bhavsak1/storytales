'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

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
    pageCount: 10,
    dedication: '',
    email: '',
  })

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoValidating, setPhotoValidating] = useState(false)
  const [photoValid, setPhotoValid] = useState<boolean | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

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
                  <button onClick={() => setFormData({ ...formData, mode: 'abc' })} className={`p-4 rounded-xl border-2 text-center transition-all ${formData.mode === 'abc' ? 'border-sky-400 bg-sky-50' : 'border-amber-200 bg-amber-50 hover:border-amber-300'}`}>
                    <div className="text-3xl font-bold text-sky-500 mb-1">ABC</div>
                    <div className="font-bold text-amber-900 text-sm">Alphabet Journey</div>
                  </button>
                  <button onClick={() => setFormData({ ...formData, mode: '123' })} className={`p-4 rounded-xl border-2 text-center transition-all ${formData.mode === '123' ? 'border-sky-400 bg-sky-50' : 'border-amber-200 bg-amber-50 hover:border-amber-300'}`}>
                    <div className="text-3xl font-bold text-sky-500 mb-1">123</div>
                    <div className="font-bold text-amber-900 text-sm">Number Adventure</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-3">Book Length</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setFormData({ ...formData, pageCount: 10 })} className={`p-4 rounded-xl border-2 text-center transition-all ${formData.pageCount === 10 ? 'border-sky-400 bg-sky-50' : 'border-amber-200 bg-amber-50 hover:border-amber-300'}`}>
                    <div className="font-bold text-amber-900 text-sm">10 Pages</div>
                    <div className="text-xs text-amber-600">{formData.mode === 'abc' ? 'Letters A to J' : 'Numbers 1 to 10'}</div>
                  </button>
                  <button onClick={() => setFormData({ ...formData, pageCount: 26 })} className={`p-4 rounded-xl border-2 text-center transition-all ${formData.pageCount === 26 ? 'border-sky-400 bg-sky-50' : 'border-amber-200 bg-amber-50 hover:border-amber-300'}`}>
                    <div className="font-bold text-amber-900 text-sm">26 Pages</div>
                    <div className="text-xs text-amber-600">{formData.mode === 'abc' ? 'Letters A to Z' : 'Numbers 1 to 26'}</div>
                  </button>
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
                  <span className="text-3xl">🖨️</span>
                  <div className="flex-1">
                    <div className="font-bold text-amber-900">Digital PDF</div>
                    <div className="text-xs text-amber-600">Download instantly & print at home</div>
                  </div>
                  <div className="fredoka text-xl text-green-600">₹199</div>
                </div>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-3">Order Summary</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-amber-600">Child</span><span className="font-bold text-amber-900">{formData.childName}, {formData.age}</span></div>
                  <div className="flex justify-between"><span className="text-amber-600">Book Type</span><span className="font-bold text-amber-900">Coloring Book ({formData.mode.toUpperCase()})</span></div>
                  <div className="flex justify-between"><span className="text-amber-600">Length</span><span className="font-bold text-amber-900">{formData.pageCount} pages</span></div>
                  <div className="flex justify-between"><span className="text-amber-600">Total</span><span className="font-bold text-amber-900">₹199</span></div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border-2 border-amber-200 text-amber-700 font-bold hover:bg-amber-50 transition-all">← Back</button>
                <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl fredoka text-lg btn-primary cursor-pointer">✨ Create Coloring Book!</button>
              </div>
            </div>
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
                onRestart={() => { setStep(1); setStatus(''); setStory(null); setIllustrations([]); }}
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
