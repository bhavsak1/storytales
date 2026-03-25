import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { error } = await supabase.from('profiles').select()
  
  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-amber-900 mb-4">
          StoryTales
        </h1>
        <p className="text-xl text-amber-700">
          Personalized storybooks for every child ✨
        </p>
        <p className="text-sm text-amber-600 mt-4">
          Supabase: {error ? '❌ Not connected' : '✅ Connected'}
        </p>
      </div>
    </main>
  )
}