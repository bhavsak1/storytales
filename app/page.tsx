'use client'

import { useState } from 'react'

interface StoryPage {
  page: number
  text: string
  scene: string
}

export default function Home() {
  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    interests: '',
    theme: ''
  })
  const [status, setStatus] = useState('')
  const [story, setStory] = useState<{title: string, pages: StoryPage[]} | null>(null)
  const [illustrations, setIllustrations] = useState<string[]>([])
  
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setStatus('generating')

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  })

  const data = await response.json()
  
  if (data.success) {
    setStatus('complete')
    setStory(data.story)
    setIllustrations(data.illustrations || [])
  } else {
    setStatus('error')
    console.log('Error:', data.error)
  }
}

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8 w-full max-w-md">
        
        <h1 className="text-3xl font-bold text-amber-900 mb-2">StoryTales</h1>
        <p className="text-amber-700 mb-6">Create a personalized story for your child</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div>
            <label className="text-sm font-semibold text-amber-800 block mb-1">
              Child&apos;s Name
            </label>
            <input
              type="text"
              placeholder="e.g. Aria"
              value={formData.childName}
              onChange={e => setFormData({...formData, childName: e.target.value})}
              className="w-full border border-amber-200 rounded-lg px-4 py-2 text-amber-900 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-amber-800 block mb-1">
              Age
            </label>
            <select
              value={formData.age}
              onChange={e => setFormData({...formData, age: e.target.value})}
              className="w-full border border-amber-200 rounded-lg px-4 py-2 text-amber-900 focus:outline-none focus:border-amber-400"
              required
            >
              <option value="">Select age...</option>
              <option>2-3 years</option>
              <option>4-5 years</option>
              <option>6-7 years</option>
              <option>8-10 years</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-amber-800 block mb-1">
              Interests
            </label>
            <input
              type="text"
              placeholder="e.g. dinosaurs, space, unicorns"
              value={formData.interests}
              onChange={e => setFormData({...formData, interests: e.target.value})}
              className="w-full border border-amber-200 rounded-lg px-4 py-2 text-amber-900 focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-amber-800 block mb-1">
              Story Theme
            </label>
            <select
              value={formData.theme}
              onChange={e => setFormData({...formData, theme: e.target.value})}
              className="w-full border border-amber-200 rounded-lg px-4 py-2 text-amber-900 focus:outline-none focus:border-amber-400"
              required
            >
              <option value="">Select theme...</option>
              <option>Royal Kingdom</option>
              <option>Space Explorer</option>
              <option>Ocean Adventure</option>
              <option>Enchanted Forest</option>
              <option>Superhero City</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg mt-2 transition-colors"
          >
            ✨ Create My Story
          </button>

        </form>

        {status === 'generating' && (
  <div className="mt-6 p-4 bg-amber-50 rounded-lg text-center">
    <p className="text-amber-700 font-semibold">
      🪄 Creating your story... please wait!
    </p>
  </div>
)}

{status === 'complete' && story && (
  <div className="mt-6">
    <h2 className="text-2xl font-bold text-amber-900 mb-4">
      {story.title}
    </h2>
    {story.pages.map((page: StoryPage, index: number) => (
  <div key={page.page} className="mb-6 bg-amber-50 rounded-lg overflow-hidden">
    {illustrations[index] && (
      <img 
        src={illustrations[index]} 
        alt={`Page ${page.page} illustration`}
        className="w-full h-48 object-cover"
      />
    )}
    <div className="p-4">
      <p className="text-xs font-bold text-amber-400 mb-2">
        PAGE {page.page}
      </p>
      <p className="text-amber-800 leading-relaxed">
        {page.text}
      </p>
    </div>
  </div>
))}
  </div>
)}

      </div>
    </main>
  )
}