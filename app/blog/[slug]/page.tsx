import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BLOG_POSTS, getPostBySlug } from '@/lib/blog-data'
import CtaSection from '../components/CtaSection'
import PromoBanner from '../promo-banner'
import BirthdayReturnGiftsContent from '@/lib/blog-posts/birthday-return-gifts'

/* ── Static generation — pre-render every slug at build time ── */
export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }))
}

/* ── Dynamic SEO metadata per post ── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return { title: 'Post Not Found' }
  }

  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.tags,
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      images: [post.thumbnail],
      type: 'article',
    },
  }
}

/* ── Map slugs to their full-article content component ── */
const CONTENT_MAP: Record<string, React.ComponentType> = {
  'best-birthday-return-gift-idea-personalized-ai-storybooks': BirthdayReturnGiftsContent,
}

/* ── Page Component ── */
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const Content = CONTENT_MAP[slug] ?? null

  // Related posts: pick up to 3 posts that aren't the current one
  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3)

  /* ── JSON-LD Structured Data ── */
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    image: `https://storygennie.com${post.thumbnail}`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: 'StoryGennie',
      url: 'https://storygennie.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'StoryGennie',
      logo: {
        '@type': 'ImageObject',
        url: 'https://storygennie.com/logo.jpg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://storygennie.com/blog/${slug}`,
    },
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Blog Nav */}
      <nav className="bg-white bg-opacity-95 border-b border-amber-100 sticky top-0 z-50 px-5 md:px-10 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <img src="/logo.jpg" alt="StoryGennie" className="h-12 w-auto" />
            <span className="fredoka text-xl md:text-2xl text-amber-900">StoryGennie</span>
          </Link>
          <span className="text-amber-400 font-bold text-sm ml-2">/ Blog</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-bold text-amber-800 hover:text-amber-600 no-underline">Home</Link>
          <Link href="/blog" className="text-sm font-bold text-amber-800 hover:text-amber-600 no-underline">Blog</Link>
          <Link
            href="/create"
            className="text-sm font-bold text-white no-underline px-5 py-2 rounded-full"
            style={{ background: 'linear-gradient(135deg, #F4867A, #D9604F)', boxShadow: '0 4px 14px rgba(244,134,122,0.35)' }}
          >
            Create a Book ✨
          </Link>
        </div>
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
        .fredoka { font-family: 'Fredoka One', cursive; }
        .blog-body h2 {
          font-family: 'Fredoka One', cursive;
          color: #78350f;
          font-size: 1.6rem;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }
        .blog-body h3 {
          font-family: 'Fredoka One', cursive;
          color: #92400e;
          font-size: 1.25rem;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .blog-body p {
          color: #78350f;
          line-height: 1.85;
          margin-bottom: 1.25rem;
          font-size: 1.05rem;
        }
        .blog-body ul, .blog-body ol {
          color: #78350f;
          padding-left: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .blog-body li {
          margin-bottom: 0.5rem;
          line-height: 1.7;
        }
        .blog-body strong { color: #92400e; }
        .blog-body blockquote {
          border-left: 4px solid #F4867A;
          background: #FFF5E8;
          padding: 1rem 1.25rem;
          border-radius: 0 12px 12px 0;
          margin: 1.5rem 0;
          font-style: italic;
          color: #92400e;
        }
        .blog-body a { color: #D9604F; text-decoration: underline; font-weight: 700; }
        .blog-body a:hover { color: #F4867A; }
        .stat-card {
          background: linear-gradient(135deg, #FFF8EE, #FFF0D0);
          border: 2px solid #F4C87A;
          border-radius: 16px;
          padding: 1.25rem;
          text-align: center;
        }
        .toc-link {
          color: #92400e;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          display: block;
          padding: 0.4rem 0;
          transition: all 0.2s;
        }
        .toc-link:hover { color: #D9604F; transform: translateX(4px); }
        .blog-card-related {
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .blog-card-related:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 48px rgba(45, 27, 0, 0.12);
        }
      `}</style>

      <article className="bg-amber-50" style={{ fontFamily: "'Nunito', sans-serif" }}>
        {/* Hero */}
        <div className="relative">
          <div className="w-full h-64 md:h-96 overflow-hidden">
            <img
              src={post.thumbnail}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,251,240,0) 50%, rgba(255,251,240,1) 100%)',
              }}
            />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-5 md:px-8 -mt-16 relative z-10">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: '#F4867A' }}
            >
              {post.category}
            </span>
            <span className="text-xs text-amber-600 font-bold">{post.dateFormatted}</span>
            <span className="text-xs text-amber-500">·</span>
            <span className="text-xs text-amber-600 font-bold">{post.readTime}</span>
          </div>

          {/* Title */}
          <h1 className="fredoka text-2xl md:text-4xl text-amber-900 leading-tight mb-6">
            {post.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-3 mb-8 pb-8 border-b-2 border-amber-100">
            <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-lg">✍️</div>
            <div>
              <div className="text-sm font-bold text-amber-900">StoryGennie Team</div>
              <div className="text-xs text-amber-600">Gifting & Parenting Experts</div>
            </div>
          </div>

          {/* Body — rendered from the content registry */}
          <div className="blog-body">
            {Content ? (
              <Content />
            ) : (
              /* Fallback for posts that don't have full article content yet */
              <FallbackContent post={post} />
            )}

            {/* Bottom CTA */}
            <CtaSection />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-10 mb-8 pt-8 border-t-2 border-amber-100">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full"
              >
                #{tag.replace(/\s+/g, '')}
              </span>
            ))}
          </div>

          {/* Back to blog */}
          <div className="text-center pb-8">
            <Link
              href="/blog"
              className="text-amber-600 hover:text-amber-800 font-bold text-sm no-underline"
            >
              ← Back to all articles
            </Link>
          </div>
        </div>

        {/* ─── Related Posts ─── */}
        {relatedPosts.length > 0 && (
          <div className="bg-white border-t-2 border-amber-100 px-5 md:px-10 lg:px-16 py-12 md:py-16">
            <div className="max-w-5xl mx-auto">
              <h2 className="fredoka text-2xl md:text-3xl text-amber-900 text-center mb-8">
                More Articles You&apos;ll Love 📚
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {relatedPosts.map((rp) => (
                  <Link
                    key={rp.slug}
                    href={`/blog/${rp.slug}`}
                    className="blog-card-related group block no-underline rounded-2xl overflow-hidden bg-amber-50 border-2 border-amber-100"
                    style={{ boxShadow: '0 4px 16px rgba(45,27,0,0.06)' }}
                  >
                    <div className="relative overflow-hidden aspect-[16/10]">
                      <img
                        src={rp.thumbnail}
                        alt={rp.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{
                            background: 'rgba(255,255,255,0.85)',
                            color: '#7c3aed',
                            border: '1px solid rgba(168,85,247,0.2)',
                          }}
                        >
                          {rp.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="text-xs font-bold text-amber-600 mb-2">{rp.dateFormatted}</div>
                      <h3 className="fredoka text-base text-amber-900 leading-snug mb-2 group-hover:text-purple-700 transition-colors duration-300 line-clamp-2">
                        {rp.title}
                      </h3>
                      <p className="text-xs text-amber-700 leading-relaxed line-clamp-2 mb-3">
                        {rp.excerpt}
                      </p>
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
            </div>
          </div>
        )}
      </article>

      {/* Blog Footer */}
      <footer className="bg-amber-950 py-8 px-5 md:px-10 pb-20">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-amber-600 text-xs font-semibold">
            Made with ❤️ for little dreamers everywhere · © 2026 StoryGennie
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-amber-600 hover:text-amber-400 text-xs font-bold no-underline">Home</Link>
            <Link href="/create" className="text-amber-600 hover:text-amber-400 text-xs font-bold no-underline">Create a Story</Link>
            <Link href="/blog" className="text-amber-600 hover:text-amber-400 text-xs font-bold no-underline">Blog</Link>
          </div>
        </div>
      </footer>

      {/* Sticky Promo Banner */}
      <PromoBanner />
    </>
  )
}

/* ── Fallback content for posts without full article JSX ── */
function FallbackContent({ post }: { post: { title: string; excerpt: string; ctaLink: string; ctaLabel: string } }) {
  return (
    <>
      <p>{post.excerpt}</p>

      <h2>✨ Why This Matters</h2>
      <p>
        Every child deserves a story that&apos;s uniquely theirs. At StoryGennie, we believe that personalized storytelling
        isn&apos;t just entertainment — it&apos;s a way to build confidence, spark creativity, and create lasting memories.
      </p>

      <blockquote>
        &ldquo;When children see themselves as the hero of a story, something magical happens — they begin to believe
        they can be the hero of their own life.&rdquo;
      </blockquote>

      <h2>📖 The StoryGennie Difference</h2>
      <p>
        Our AI-powered platform creates beautifully illustrated, fully personalized storybooks in minutes. Each book features:
      </p>
      <ul>
        <li><strong>Your child&apos;s name</strong> as the main character throughout the story</li>
        <li><strong>AI-generated illustrations</strong> that bring the adventure to life</li>
        <li><strong>Indian cultural themes</strong> — festivals, settings, and values woven naturally</li>
        <li><strong>Age-appropriate content</strong> tailored to your child&apos;s reading level</li>
      </ul>

      <h2>🎁 The Perfect Gift</h2>
      <p>
        Whether it&apos;s a birthday, festival, or just because — a personalized storybook is a gift that keeps on giving.
        Children read personalized books 3x more than regular ones, building a lifelong love of reading.
      </p>

      <p>
        Ready to create something magical? <Link href={post.ctaLink} style={{ color: '#D9604F', fontWeight: 700 }}>{post.ctaLabel}</Link>
      </p>
    </>
  )
}
