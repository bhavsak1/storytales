'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PromoBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      id="promo-banner"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(135deg, #1a0533 0%, #2d1054 40%, #4a1a6b 70%, #6b21a8 100%)',
        boxShadow: '0 -8px 40px rgba(107, 33, 168, 0.35)',
      }}
    >
      {/* Animated shimmer overlay */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: 0.12 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(115deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)',
            animation: 'shimmer 3s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(250,204,21,0.4), 0 0 60px rgba(250,204,21,0.1); }
          50% { box-shadow: 0 0 30px rgba(250,204,21,0.6), 0 0 80px rgba(250,204,21,0.2); }
        }
        @keyframes float-sparkle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 1; }
          50% { transform: translateY(-3px) scale(1.15); opacity: 0.8; }
        }
      `}</style>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: sparkle + text */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <span
              className="text-xl sm:text-2xl flex-shrink-0"
              style={{ animation: 'float-sparkle 2s ease-in-out infinite' }}
            >
              ✨
            </span>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm sm:text-base leading-tight truncate">
                <span className="hidden sm:inline">Launch Special — </span>
                Your first storybook for just{' '}
                <span
                  className="inline-block font-extrabold text-yellow-300"
                  style={{
                    textShadow: '0 0 12px rgba(250,204,21,0.5)',
                  }}
                >
                  ₹50
                </span>
                <span className="text-purple-200 line-through text-xs sm:text-sm ml-1.5 font-normal">
                  ₹299
                </span>
              </p>
              <p className="text-purple-200 text-xs sm:text-sm mt-0.5 hidden sm:block">
                Personalized AI storybook • PDF in minutes • Limited time offer
              </p>
            </div>
          </div>

          {/* Right: CTA + dismiss */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/create"
              id="promo-banner-cta"
              className="inline-flex items-center gap-1.5 rounded-full px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold no-underline transition-all duration-300 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                color: '#1a0533',
                animation: 'pulse-glow 2.5s ease-in-out infinite',
              }}
            >
              Grab the Offer
              <span className="text-sm sm:text-base">→</span>
            </Link>
            <button
              id="promo-banner-dismiss"
              onClick={() => setDismissed(true)}
              className="text-purple-300 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label="Dismiss promo"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
