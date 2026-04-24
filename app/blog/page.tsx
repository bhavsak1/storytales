import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BLOG_POSTS, getFeaturedPost, getNonFeaturedPosts } from '@/lib/blog-data'
import PromoBanner from './promo-banner'

export const metadata: Metadata = {
  title: 'Blog — StoryGennie | Personalized AI Storybook Ideas & Parenting Tips',
  description:
    'Discover gifting ideas, parenting tips, and the latest in AI-powered personalized storytelling for kids in India. Start your child\'s storybook journey today.',
  openGraph: {
    title: 'StoryGennie Blog — AI Storybooks, Gifting Ideas & Parenting Tips',
    description:
      'Explore articles on personalized storybooks, birthday return gifts, and how AI is transforming children\'s storytelling in India.',
    type: 'website',
  },
}

export default function BlogListingPage() {
  const featured = getFeaturedPost()
  const posts = getNonFeaturedPosts()

  return (
    <main
      className="min-h-screen bg-amber-50"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        .fredoka { font-family: 'Fredoka One', cursive; }
        .btn-pink { background: linear-gradient(135deg, #F4867A, #D9604F); color: white; transition: all 0.2s; }
        .btn-pink:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(244,134,122,0.4); }

        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .float { animation: float 4s ease-in-out infinite; }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out both; }

        @keyframes hero-glow {
          0%, 100% { box-shadow: 0 8px 40px rgba(107, 33, 168, 0.15), 0 0 0 0 rgba(168, 85, 247, 0.1); }
          50% { box-shadow: 0 12px 60px rgba(107, 33, 168, 0.25), 0 0 80px 8px rgba(168, 85, 247, 0.08); }
        }
        .hero-glow { animation: hero-glow 4s ease-in-out infinite; }

        .blog-card {
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .blog-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 60px rgba(45, 27, 0, 0.12), 0 0 0 1px rgba(168, 85, 247, 0.1);
        }
        .blog-card:hover .card-image {
          transform: scale(1.06);
        }
        .blog-card:hover .card-title {
          color: #7c3aed;
        }

        .category-pill {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav className="bg-white/95 border-b border-amber-100 sticky top-0 z-40 px-5 md:px-10 lg:px-16 py-4 flex items-center justify-between" style={{ backdropFilter: 'blur(12px)' }}>
        <Link href="/" className="flex items-center gap-2 no-underline">
          <img src="/logo.jpg" alt="StoryGennie" className="h-12 w-auto" />
          <span className="fredoka text-xl md:text-2xl text-amber-900">StoryGennie</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-sm font-bold text-amber-800 hover:text-amber-600 no-underline hidden sm:inline">Home</Link>
          <span className="text-sm font-extrabold text-purple-600 no-underline">Blog</span>
          <Link href="/create" className="btn-pink fredoka px-5 py-2 rounded-full text-sm no-underline hidden sm:inline-block">Create Story ✨</Link>
        </div>
      </nav>

      {/* ─── PAGE HEADER ─── */}
      <section className="px-5 md:px-10 lg:px-16 pt-10 md:pt-14 pb-2 max-w-6xl mx-auto text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-300 rounded-full px-4 py-1.5 text-xs font-bold text-purple-700 mb-4 uppercase tracking-wider">
          📝 StoryGennie Blog
        </div>
        <h1 className="fredoka text-3xl md:text-4xl lg:text-5xl text-amber-900 leading-tight mb-3">
          Stories, Tips &amp; Inspiration
        </h1>
        <p className="text-base md:text-lg text-amber-700 font-semibold max-w-2xl mx-auto leading-relaxed">
          Ideas for gifting, parenting, and making every story magical — powered by AI.
        </p>
      </section>

      {/* ─── FEATURED POST ─── */}
      {featured && (
        <section className="px-5 md:px-10 lg:px-16 py-8 md:py-12 max-w-6xl mx-auto">
          <Link
            href={`/blog/${featured.slug}`}
            id="featured-post"
            className="group block no-underline"
          >
            <div
              className="rounded-3xl overflow-hidden hero-glow"
              style={{
                background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 30%, #ede9fe 60%, #fef3c7 100%)',
                border: '2px solid rgba(168, 85, 247, 0.15)',
              }}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Image */}
                <div className="lg:w-1/2 relative overflow-hidden">
                  <div className="aspect-[16/10] lg:aspect-auto lg:h-full relative">
                    <Image
                      src={featured.thumbnail}
                      alt={featured.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                    {/* Gradient overlay */}
                    <div
                      className="absolute inset-0 lg:hidden"
                      style={{
                        background: 'linear-gradient(to bottom, transparent 40%, rgba(250,245,255,0.9) 100%)',
                      }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="lg:w-1/2 p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="category-pill text-xs font-bold px-3 py-1 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.1))',
                        color: '#7c3aed',
                        border: '1px solid rgba(168,85,247,0.2)',
                      }}
                    >
                      ⭐ Featured
                    </span>
                    <span className="text-xs font-bold text-purple-400">&bull;</span>
                    <span
                      className="category-pill text-xs font-bold px-3 py-1 rounded-full"
                      style={{
                        background: 'rgba(251,191,36,0.15)',
                        color: '#b45309',
                        border: '1px solid rgba(251,191,36,0.25)',
                      }}
                    >
                      {featured.category}
                    </span>
                  </div>

                  <h2 className="fredoka text-xl md:text-2xl lg:text-3xl text-amber-900 leading-snug mb-4 group-hover:text-purple-700 transition-colors duration-300">
                    {featured.title}
                  </h2>

                  <p className="text-amber-700 font-semibold text-sm md:text-base leading-relaxed mb-6">
                    {featured.excerpt}
                  </p>

                  <div className="flex items-center gap-4 mb-6">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {featured.dateFormatted}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-purple-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 6v6l4 2" />
                      </svg>
                      {featured.readTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-purple-600 font-extrabold text-sm group-hover:gap-3 transition-all duration-300">
                    Read Full Article
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ─── BLOG GRID ─── */}
      <section className="px-5 md:px-10 lg:px-16 py-8 md:py-12 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="fredoka text-2xl md:text-3xl text-amber-900">Latest Articles</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-amber-200 via-purple-200 to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              id={`blog-card-${post.slug}`}
              className="blog-card group block no-underline rounded-2xl overflow-hidden bg-white"
              style={{
                border: '2px solid rgba(245,158,11,0.12)',
                boxShadow: '0 4px 20px rgba(45, 27, 0, 0.06)',
              }}
            >
              {/* Card Thumbnail */}
              <div className="relative overflow-hidden aspect-[16/10]">
                <Image
                  src={post.thumbnail}
                  alt={post.title}
                  fill
                  className="card-image object-cover transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {/* Category Overlay */}
                <div className="absolute top-3 left-3">
                  <span
                    className="category-pill text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      color: '#7c3aed',
                      border: '1px solid rgba(168,85,247,0.2)',
                    }}
                  >
                    {post.category}
                  </span>
                </div>
                {/* Read time badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(15,15,15,0.6)',
                      color: '#fff',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    ⏱ {post.readTime}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5">
                {/* Date */}
                <div className="flex items-center gap-1.5 mb-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span className="text-xs font-bold text-amber-600">{post.dateFormatted}</span>
                </div>

                {/* Title */}
                <h3 className="card-title fredoka text-base md:text-lg text-amber-900 leading-snug mb-3 transition-colors duration-300 line-clamp-2">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-xs md:text-sm text-amber-700 leading-relaxed mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                {/* Read more */}
                <div className="flex items-center gap-1.5 text-purple-600 font-extrabold text-xs group-hover:gap-2.5 transition-all duration-300">
                  Read more
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── NEWSLETTER / CTA ─── */}
      <section className="px-5 md:px-10 lg:px-16 py-12 md:py-16 max-w-6xl mx-auto">
        <div
          className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #581c87 100%)',
            boxShadow: '0 12px 48px rgba(88, 28, 135, 0.25)',
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-4 left-6 text-3xl float" style={{ animationDelay: '0s' }}>📚</div>
          <div className="absolute top-6 right-8 text-2xl float" style={{ animationDelay: '1.2s' }}>✨</div>
          <div className="absolute bottom-4 left-12 text-2xl float" style={{ animationDelay: '2.4s' }}>🌟</div>
          <div className="absolute bottom-6 right-10 text-3xl float" style={{ animationDelay: '0.6s' }}>📖</div>

          <div className="relative z-10">
            <h2 className="fredoka text-2xl md:text-3xl lg:text-4xl text-white mb-3">
              Ready to create magic? ✨
            </h2>
            <p className="text-purple-200 font-semibold text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
              Turn your child into the hero of their own story — personalized, illustrated, and delivered as a PDF in minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/create"
                id="blog-cta-story"
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-extrabold text-base no-underline transition-all duration-300 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                  color: '#1e1b4b',
                  boxShadow: '0 6px 24px rgba(250,204,21,0.35)',
                }}
              >
                Create Their Story ✨
              </Link>
              <Link
                href="/create-colorbook"
                id="blog-cta-colorbook"
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-extrabold text-base no-underline transition-all duration-300 hover:scale-105"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Create Colorbook 🖍️
              </Link>
            </div>
            <p className="text-purple-300 text-xs font-bold mt-4">
              Starting at just ₹50 — introductory offer
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-amber-950 py-6 text-center text-xs text-amber-700 font-semibold pb-20">
        Made with ❤️ for little dreamers everywhere &middot; © 2025 StoryTales
      </footer>

      {/* ─── STICKY PROMO BANNER ─── */}
      <PromoBanner />
    </main>
  )
}
