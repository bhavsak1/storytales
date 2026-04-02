'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface Order {
  id: string
  created_at: string
  child_name: string
  child_age: string
  theme: string
  status: string
  delivery_type: string
}

interface Story {
  id: string
  order_id: string
  title: string
  pdf_url: string
  status: string
}

export default function OrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const fetchOrders = async (userId: string) => {
    setLoading(true)

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (ordersData) {
      setOrders(ordersData)

      // Fetch stories for all orders
      const orderIds = ordersData.map((o: Order) => o.id)
      if (orderIds.length > 0) {
        const { data: storiesData } = await supabase
          .from('stories')
          .select('*')
          .in('order_id', orderIds)

        if (storiesData) setStories(storiesData)
      }
    }
    setLoading(false)
  }
  

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      await fetchOrders(user.id)
    }
    getUser()
  }, [router])

  

  const getStoryForOrder = (orderId: string) => {
    return stories.find(s => s.order_id === orderId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const themeEmoji: { [key: string]: string } = {
    'Royal Kingdom': '🏰',
    'Space Explorer': '🚀',
    'Ocean Adventure': '🌊',
    'Enchanted Forest': '🌲',
    'Superhero City': '🦸',
    'Tiny World': '🍄',
  }

  return (
    <main className="min-h-screen bg-amber-50" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');.fredoka{font-family:'Fredoka One',cursive;}`}</style>

      {/* NAV */}
      <nav className="bg-white border-b border-amber-100 px-5 md:px-10 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="fredoka text-xl md:text-2xl text-amber-900 no-underline">
          📖 StoryTales
        </Link>
        <div className="flex items-center gap-3">
          {user && (
            <>
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border-2 border-amber-200" />
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
          <Link href="/create" className="fredoka text-sm bg-amber-400 hover:bg-amber-500 text-white px-4 py-2 rounded-full no-underline transition-all">
            + New Story
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 md:px-10 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="fredoka text-3xl text-amber-900 mb-1">My Orders 📚</h1>
          <p className="text-amber-700 font-semibold text-sm">
            {orders.length > 0 ? `${orders.length} storybook${orders.length > 1 ? 's' : ''} created` : 'No orders yet'}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-amber-700 font-semibold">Loading your orders...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && orders.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-amber-100">
            <div className="text-5xl mb-4">📖</div>
            <h2 className="fredoka text-2xl text-amber-900 mb-2">No stories yet!</h2>
            <p className="text-amber-700 font-semibold mb-6">Create your first personalized storybook</p>
            <Link href="/create" className="inline-block bg-amber-400 hover:bg-amber-500 text-white fredoka px-8 py-3 rounded-full text-lg no-underline transition-all">
              Create Their Story ✨
            </Link>
          </div>
        )}

        {/* Orders list */}
        {!loading && orders.length > 0 && (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const story = getStoryForOrder(order.id)
              return (
                <div key={order.id} className="bg-white rounded-2xl border-2 border-amber-100 overflow-hidden">

                  {/* Order header */}
                  <div className="flex items-center gap-4 p-5 border-b border-amber-50">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {themeEmoji[order.theme] || '📖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="fredoka text-lg text-amber-900 truncate">
  {story ? story.title : `${order.child_name}'s Story`}
</div>
                      <div className="text-xs text-amber-600 font-semibold mt-0.5">
                        {order.child_name} · {order.child_age} · {order.theme}
                      </div>
                    </div>
                    <div className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${
                      order.status === 'complete'
                        ? 'bg-green-100 text-green-700'
                        : order.status === 'generating'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {order.status === 'complete' ? '✅ Complete' :
                       order.status === 'generating' ? '⏳ Generating' : '🕐 Pending'}
                    </div>
                  </div>

                  {/* Order footer */}
                  <div className="flex items-center justify-between px-5 py-3 bg-amber-50">
                    <span className="text-xs text-amber-600 font-semibold">
                      {formatDate(order.created_at)}
                    </span>
                    <div className="flex gap-2">
                      {story && story.pdf_url ? (
  <a
    href={story.pdf_url}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs font-bold bg-amber-400 hover:bg-amber-500 text-white px-4 py-2 rounded-full no-underline transition-all"
  >
    Download PDF 📄
  </a>
) : null}
                      <Link
                        href="/create"
                        className="text-xs font-bold border border-amber-300 text-amber-700 hover:bg-amber-100 px-4 py-2 rounded-full no-underline transition-all"
                      >
                        Create Similar
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}