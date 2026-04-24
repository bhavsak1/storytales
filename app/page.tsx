import Link from 'next/link'
import { STORY_PLANS } from '@/lib/pricing'

export default function LandingPage() {
  const books = [
    { emoji: '🐉', title: "Aria's Dragon Quest", bg: '#FFF0D0' },
    { emoji: '🚀', title: "Rohan's Space Trip", bg: '#E8F5FF' },
    { emoji: '🦄', title: "Mia's Magic Forest", bg: '#F0FFE8' },
    { emoji: '🌊', title: "Arjun Under the Sea", bg: '#FFE8F5' },
  ]

  const steps = [
    { emoji: '🧒', title: 'Tell us about them', desc: 'Name, age, photo and their favourite things' },
    { emoji: '💛', title: 'Pick their passions', desc: 'Dinosaurs, space, unicorns — we weave them in' },
    { emoji: '🎨', title: 'Choose a theme', desc: 'Adventure, fantasy, ocean — pick their world' },
    { emoji: '📬', title: 'Receive the book', desc: 'PDF in minutes or hardcover at your door' },
  ]

  const stories = [
    { emoji: '🐉', title: "Aria and the Dragon's Secret", theme: 'Royal Kingdom', age: '6 years', bg: '#FFF0D0', text: "In the golden city of Jaipur, young Aria discovered a tiny dragon hiding behind the marigold garlands..." },
    { emoji: '🚀', title: "Rohan's Trip to the Stars", theme: 'Space Explorer', age: '8 years', bg: '#E8F5FF', text: "On the rooftop of their Mumbai apartment, Rohan pointed his telescope at the night sky and gasped..." },
    { emoji: '🦄', title: "Mia's Enchanted Forest", theme: 'Enchanted Forest', age: '4 years', bg: '#F0FFE8', text: "Deep in the forest behind her dadi's village, little Mia heard a melody that only she could follow..." },
  ]

  const plans = STORY_PLANS

  const trust = [
    { icon: '🎨', text: 'AI illustrated' },
    { icon: '⚡', text: 'Ready in minutes' },
    { icon: '📦', text: 'Print & ship' },
    { icon: '💝', text: '100% guarantee' },
    { icon: '🇮🇳', text: 'Indian stories' },
    { icon: '🔒', text: 'Photos stay private' },
  ]

  return (
    <main className="min-h-screen bg-amber-50" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        .fredoka { font-family: 'Fredoka One', cursive; }
        .btn-pink { background: linear-gradient(135deg, #F4867A, #D9604F); color: white; transition: all 0.2s; }
        .btn-pink:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(244,134,122,0.4); }
        .book-card { transition: transform 0.25s; }
        .book-card:hover { transform: translateY(-6px); }
        .step-card { transition: all 0.25s; }
        .step-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(45,27,0,0.1); }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .float { animation: float 4s ease-in-out infinite; }
        .trust-scroll { overflow-x: auto; scrollbar-width: none; }
        .trust-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      {/* NAV */}
      <nav className="bg-white bg-opacity-95 border-b border-amber-100 sticky top-0 z-50 px-5 md:px-10 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="StoryGennie" className="h-15 w-auto" />
          <span className="fredoka text-xl md:text-2xl text-amber-900">StoryGennie</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-sm font-bold text-amber-800 hover:text-amber-600 no-underline">How it works</a>
          <a href="#pricing" className="text-sm font-bold text-amber-800 hover:text-amber-600 no-underline">Pricing</a>
          <Link href="/blog" className="text-sm font-bold text-amber-800 hover:text-amber-600 no-underline">Blog</Link>
          <Link href="/login" className="text-sm font-bold text-amber-800 hover:text-amber-600 no-underline">Sign in</Link>
        </div>

      </nav>

      {/* HERO */}
      <section className="px-5 md:px-10 lg:px-16 py-10 md:py-16 lg:py-20 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Left */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-400 rounded-full px-4 py-1.5 text-xs font-bold text-amber-700 mb-5 uppercase tracking-wide">
              🎁 Perfect gift for kids
            </div>
            <h1 className="fredoka text-3xl md:text-4xl lg:text-5xl text-amber-900 leading-tight mb-5">
              The most personal gift you can give a child
            </h1>
            <p className="text-base md:text-lg text-amber-800 font-semibold leading-relaxed mb-7 max-w-lg mx-auto lg:mx-0">
              A beautifully illustrated storybook where <strong>your child is the hero</strong> — crafted by AI in minutes, delivered to your door or inbox.
            </p>
            <div className="flex flex-col items-center lg:items-start gap-3 justify-center lg:justify-start mb-7">
              <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3 w-full">
                <Link href="/create" className="btn-pink fredoka w-full sm:w-auto text-center px-8 py-4 rounded-full text-lg no-underline whitespace-nowrap" style={{ boxShadow: '0 6px 20px rgba(244,134,122,0.4)' }}>
                  Create Their Story ✨
                </Link>
                <Link href="/create-colorbook" className="btn-pink fredoka w-full sm:w-auto text-center px-8 py-4 rounded-full text-lg no-underline whitespace-nowrap" style={{ boxShadow: '0 6px 20px rgba(244,134,122,0.4)' }}>
                  Create Their Colorbook 🖍️
                </Link>
              </div>
              <a href="#how-it-works" className="text-amber-700 hover:text-amber-900 font-bold text-sm no-underline transition-all underline-offset-2" style={{ textDecoration: 'underline' }}>
                See How it Works →
              </a>
            </div>
            {/* Social proof */}
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <div className="flex">
                {['👩', '👴', '👨', '👵'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-50 flex items-center justify-center text-sm" style={{ marginLeft: i === 0 ? 0 : '-8px' }}>{e}</div>
                ))}
              </div>
              <span className="text-sm font-bold text-amber-700">2,400+ families gifted a story this month</span>
            </div>
          </div>

          {/* Right — Book Grid */}
          <div className="flex-1 grid grid-cols-2 gap-3 w-full max-w-sm lg:max-w-none">
            {books.map((book, i) => (
              <div key={i} className="book-card bg-white rounded-2xl p-3 text-center border-2 border-amber-100" style={{ boxShadow: '0 4px 16px rgba(45,27,0,0.08)' }}>
                <div className="w-full h-20 md:h-24 rounded-xl flex items-center justify-center text-4xl mb-2" style={{ background: book.bg }}>{book.emoji}</div>
                <div className="fredoka text-xs md:text-sm text-amber-900 leading-tight">{book.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div className="bg-white border-t border-b border-amber-100 py-4 trust-scroll">
        <div className="flex gap-8 px-5 md:justify-center min-w-max md:min-w-0">
          {trust.map(({ icon, text }, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-bold text-amber-800 whitespace-nowrap">
              <span className="text-lg">{icon}</span>{text}
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-5 md:px-10 lg:px-16 py-14 md:py-20 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="fredoka text-3xl md:text-4xl text-amber-900 mb-2">How the magic happens ✨</h2>
          <p className="text-amber-700 font-semibold">Three simple steps — takes under 3 minutes</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={i} className="step-card bg-white rounded-2xl p-5 text-center border-2 border-amber-100">
              <div className="w-12 h-12 rounded-full bg-amber-50 border-2 border-amber-100 flex items-center justify-center text-2xl mx-auto mb-3">{step.emoji}</div>
              <div className="fredoka text-sm md:text-base text-amber-900 mb-2">{step.title}</div>
              <div className="text-xs md:text-sm text-amber-700 leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10 flex flex-col items-center gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/create" className="btn-pink fredoka inline-block px-10 py-4 rounded-full text-lg no-underline" style={{ boxShadow: '0 6px 20px rgba(244,134,122,0.4)' }}>
              Create Their Story ✨
            </Link>
            <Link href="/create-colorbook" className="btn-pink fredoka inline-block px-10 py-4 rounded-full text-lg no-underline" style={{ boxShadow: '0 6px 20px rgba(244,134,122,0.4)' }}>
              Create Their Colorbook 🖍️
            </Link>
          </div>
          <a href="#how-it-works" className="text-amber-700 hover:text-amber-900 font-bold text-sm no-underline transition-all underline-offset-2" style={{ textDecoration: 'underline' }}>
            See How it Works →
          </a>
        </div>
      </section>

      {/* SAMPLE STORIES */}
      <section className="bg-white border-t border-b border-amber-100 px-5 md:px-10 lg:px-16 py-14 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="fredoka text-3xl md:text-4xl text-amber-900 mb-2">Stories families love 📖</h2>
            <p className="text-amber-700 font-semibold">Every story is unique — just like your child</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {stories.map((story, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border-2 border-amber-100 bg-amber-50">
                <div className="h-28 flex items-center justify-center text-5xl" style={{ background: story.bg }}>{story.emoji}</div>
                <div className="p-5">
                  <div className="fredoka text-base text-amber-900 mb-2">{story.title}</div>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">{story.theme}</span>
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-bold">{story.age}</span>
                  </div>
                  <p className="text-xs md:text-sm text-amber-800 leading-relaxed italic">&ldquo;{story.text}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-5 md:px-10 lg:px-16 py-14 md:py-20 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="fredoka text-3xl md:text-4xl text-amber-900 mb-2">Simple, honest pricing 💰</h2>
          <p className="text-amber-700 font-semibold">No subscription. Pay once, keep forever.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <div key={i} className={`rounded-2xl overflow-hidden relative ${plan.popular ? 'border-4 border-amber-400 bg-amber-50' : 'border-2 border-amber-100 bg-white'}`}>
              {plan.popular && (
                <div className="bg-amber-400 text-white text-center py-2 text-xs font-bold uppercase tracking-wide">
                  ⭐ Most Popular
                </div>
              )}
              {plan.comingSoon && (
                <div className="bg-gradient-to-r from-amber-200 to-amber-300 text-amber-800 text-center py-2 text-xs font-bold uppercase tracking-wide">
                  🚀 Coming Soon
                </div>
              )}
              <div className={`p-6 ${plan.comingSoon ? 'opacity-75' : ''}`}>
                <div className="fredoka text-xl text-amber-900 mb-1">{plan.name}</div>
                {plan.comingSoon ? (
                  <div className="fredoka text-2xl mb-2 text-amber-400">Coming Soon</div>
                ) : (
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="fredoka text-3xl" style={{ color: '#F4867A' }}>{plan.price}</span>
                    {plan.originalPrice && (
                      <span className="text-lg text-amber-400 line-through font-bold">{plan.originalPrice}</span>
                    )}
                  </div>
                )}
                {plan.originalPrice && !plan.comingSoon && (
                  <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3">
                    🎉 Introductory Offer
                  </div>
                )}
                <p className="text-sm text-amber-700 mb-4 leading-relaxed">{plan.desc}</p>
                <div className="flex flex-col gap-2 mb-5">
                  {plan.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-2 text-sm text-amber-800">
                      <span className="text-green-600 font-black">✓</span>{f}
                    </div>
                  ))}
                </div>
                {plan.comingSoon ? (
                  <div className="block text-center py-3 rounded-full fredoka text-base bg-amber-100 text-amber-400 cursor-not-allowed">
                    Notify Me 🔔
                  </div>
                ) : (
                  <Link href="/create" className={`block text-center py-3 rounded-full fredoka text-base no-underline transition-all ${plan.popular ? 'btn-pink' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`} style={{ boxShadow: plan.popular ? '0 4px 14px rgba(244,134,122,0.35)' : 'none' }}>
                    Get Started ✨
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-amber-900 px-5 md:px-10 py-16 md:py-20 text-center">
        <div className="float text-5xl mb-4">📖</div>
        <h2 className="fredoka text-3xl md:text-4xl text-white mb-3">Give them a story they&apos;ll never forget</h2>
        <p className="text-amber-200 font-semibold mb-8 max-w-md mx-auto leading-relaxed">
          Join thousands of parents and grandparents who have gifted a personalized storybook.
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/create" className="inline-block bg-amber-400 hover:bg-amber-300 text-amber-900 fredoka px-12 py-4 rounded-full text-xl no-underline transition-all" style={{ boxShadow: '0 6px 24px rgba(244,168,50,0.4)' }}>
              Create Their Story ✨
            </Link>
            <Link href="/create-colorbook" className="inline-block bg-amber-400 hover:bg-amber-300 text-amber-900 fredoka px-12 py-4 rounded-full text-xl no-underline transition-all" style={{ boxShadow: '0 6px 24px rgba(244,168,50,0.4)' }}>
              Create Their Colorbook 🖍️
            </Link>
          </div>
          <a href="#how-it-works" className="text-amber-200 hover:text-white font-bold text-sm no-underline transition-all underline-offset-2" style={{ textDecoration: 'underline' }}>
            See How it Works →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-amber-950 py-6 text-center text-xs text-amber-700 font-semibold">
        Made with ❤️ for little dreamers everywhere · © 2025 StoryTales
      </footer>
    </main>
  )
}