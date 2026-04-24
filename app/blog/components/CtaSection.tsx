'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function CtaSection() {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 600)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <section id="cta-section" className="my-12 md:my-16">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(244,134,122,0.3), 0 0 60px rgba(244,134,122,0.1); }
          50% { box-shadow: 0 0 30px rgba(244,134,122,0.5), 0 0 80px rgba(244,134,122,0.2); }
        }
        @keyframes float-badge {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(-2deg); }
        }
        @keyframes confetti-1 { 0%{opacity:0;transform:translateY(0) rotate(0)} 50%{opacity:1} 100%{opacity:0;transform:translateY(-40px) rotate(180deg)} }
        @keyframes confetti-2 { 0%{opacity:0;transform:translateY(0) rotate(0)} 50%{opacity:1} 100%{opacity:0;transform:translateY(-50px) rotate(-120deg)} }
        @keyframes confetti-3 { 0%{opacity:0;transform:translateY(0) rotate(0)} 50%{opacity:1} 100%{opacity:0;transform:translateY(-35px) rotate(90deg)} }
        .cta-card {
          background: linear-gradient(135deg, #FFFBF0 0%, #FFF5E0 50%, #FFEED0 100%);
          border: 2px solid #F4C87A;
          position: relative;
          overflow: hidden;
        }
        .cta-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255,255,255,0.4) 45%,
            rgba(255,255,255,0.6) 50%,
            rgba(255,255,255,0.4) 55%,
            transparent 60%
          );
          background-size: 200% 100%;
          animation: shimmer 4s ease-in-out infinite;
          pointer-events: none;
        }
        .cta-btn {
          background: linear-gradient(135deg, #F4867A 0%, #D9604F 100%);
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .cta-btn:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 12px 40px rgba(244,134,122,0.5) !important;
        }
        .cta-btn:active { transform: translateY(0) scale(0.98); }
        .price-badge {
          animation: float-badge 3s ease-in-out infinite;
        }
        .cta-btn .btn-shimmer {
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s;
        }
        .cta-btn:hover .btn-shimmer { left: 100%; }
      `}</style>

      <div className="cta-card rounded-3xl p-8 md:p-12 text-center relative">
        {/* Decorative elements */}
        <div className="absolute top-4 left-6 text-2xl opacity-40" style={{ animation: 'confetti-1 2.5s ease-in-out infinite' }}>✨</div>
        <div className="absolute top-8 right-10 text-xl opacity-30" style={{ animation: 'confetti-2 3s ease-in-out infinite 0.5s' }}>🎉</div>
        <div className="absolute bottom-6 left-12 text-lg opacity-30" style={{ animation: 'confetti-3 2.8s ease-in-out infinite 1s' }}>⭐</div>
        <div className="absolute bottom-4 right-8 text-2xl opacity-40" style={{ animation: 'confetti-1 3.2s ease-in-out infinite 0.3s' }}>🎁</div>

        {/* Badge */}
        <div className="price-badge inline-flex items-center gap-2 bg-white border-2 border-amber-300 rounded-full px-5 py-2 text-sm font-bold text-amber-700 mb-6" style={{ boxShadow: '0 4px 20px rgba(244,168,50,0.2)' }}>
          🎁 Launch Offer — Limited Time
        </div>

        {/* Heading */}
        <h3 className="fredoka text-2xl md:text-3xl text-amber-900 mb-3 leading-tight">
          Create your child&apos;s first personalized storybook
        </h3>
        <p className="text-amber-700 font-semibold text-base md:text-lg mb-6 max-w-lg mx-auto leading-relaxed">
          AI-illustrated, beautifully crafted, delivered as a PDF in minutes.
          <br />
          The perfect birthday return gift — starting at just:
        </p>

        {/* Price */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-amber-400 line-through text-xl font-bold">₹299</span>
          <span className="fredoka text-5xl md:text-6xl" style={{ color: '#D9604F', textShadow: '0 2px 12px rgba(217,96,79,0.2)' }}>
            ₹50
          </span>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">
            83% OFF
          </span>
        </div>

        {/* Trust bullets */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-amber-700 font-bold mb-8">
          <span>📲 Instant PDF</span>
          <span>🎨 AI Illustrated</span>
          <span>🇮🇳 Indian Stories</span>
          <span>🔒 Photos Private</span>
        </div>

        {/* CTA Button */}
        <Link
          href="/create"
          className={`cta-btn fredoka inline-block px-12 py-5 rounded-full text-xl md:text-2xl no-underline ${pulse ? 'scale-105' : ''}`}
          style={{ transition: 'transform 0.3s' }}
        >
          <span className="btn-shimmer" />
          <span className="relative z-10">
            Create Their Story for ₹50 ✨
          </span>
        </Link>

        <p className="text-amber-600 text-xs font-semibold mt-4">
          No subscription · No hidden fees · Satisfaction guaranteed
        </p>
      </div>
    </section>
  )
}
