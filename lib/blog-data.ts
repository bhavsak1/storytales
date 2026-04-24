// ── Blog post data — single source of truth for blog listing + individual pages ──

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  date: string            // ISO date string for sorting
  dateFormatted: string   // Human-readable date
  readTime: string
  thumbnail: string
  category: string
  featured: boolean
  tags: string[]

  // ── SEO fields — rendered in <head> by each blog page ──
  metaTitle: string
  metaDescription: string

  // ── CTA config ──
  ctaLink: string         // Where the in-article CTA button points
  ctaLabel: string        // CTA button text
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'best-birthday-return-gift-idea-personalized-ai-storybooks',
    title: 'The Best Birthday Return Gift Idea for Kids in India: Why Personalized AI Storybooks are Winning in 2026',
    excerpt: 'Forget plastic toys and candy bags. Parents across India are switching to personalized AI storybooks as the most meaningful birthday return gift — and kids absolutely love them. Starting at just ₹50.',
    date: '2026-04-22',
    dateFormatted: 'April 22, 2026',
    readTime: '8-min read',
    thumbnail: '/blog/hero-gifting.png',
    category: 'Gifting Ideas',
    featured: true,
    tags: ['birthday', 'return gifts', 'personalized', 'kids', 'India', '₹50'],

    // SEO
    metaTitle: 'Best Birthday Return Gift for Kids in India — Personalized AI Storybooks | StoryGennie',
    metaDescription: 'Discover why personalized AI storybooks are the #1 unique birthday return gift for kids in India. Move beyond plastic toys — create a keepsake starting at ₹50.',

    // CTA
    ctaLink: '/create',
    ctaLabel: 'Create Their Story for ₹50 ✨',
  },
  {
    slug: 'how-ai-is-revolutionizing-childrens-storytelling',
    title: 'How AI is Revolutionizing Children\'s Storytelling in India',
    excerpt: 'From bedtime stories to classroom reading — discover how AI-generated personalized tales are transforming the way Indian kids experience stories.',
    date: '2026-04-18',
    dateFormatted: 'April 18, 2026',
    readTime: '5-min read',
    thumbnail: '/blog/thumb-ai-stories.png',
    category: 'Technology',
    featured: false,
    tags: ['AI', 'storytelling', 'technology', 'innovation'],

    metaTitle: 'How AI is Revolutionizing Children\'s Storytelling in India | StoryGennie',
    metaDescription: 'From bedtime stories to classroom reading — discover how AI-generated personalized tales are transforming children\'s storytelling in India.',

    ctaLink: '/create',
    ctaLabel: 'Create a Story ✨',
  },
  {
    slug: 'why-personalized-books-boost-kids-reading-habits',
    title: 'Why Personalized Books Boost Your Child\'s Reading Habits by 3x',
    excerpt: 'Studies show children read 3x more when they see themselves as the hero. Here\'s the science behind personalized storytelling and why it works.',
    date: '2026-04-14',
    dateFormatted: 'April 14, 2026',
    readTime: '5-min read',
    thumbnail: '/blog/thumb-personalized.png',
    category: 'Parenting',
    featured: false,
    tags: ['reading', 'parenting', 'education', 'personalized'],

    metaTitle: 'Why Personalized Books Boost Kids\' Reading Habits by 3x | StoryGennie',
    metaDescription: 'Studies show children read 3x more when they see themselves as the hero. Discover the science behind personalized storytelling.',

    ctaLink: '/create',
    ctaLabel: 'Create Their Story ✨',
  },
  {
    slug: 'bedtime-stories-that-make-kids-the-hero',
    title: 'Bedtime Stories That Make Your Kids the Hero — Every Night',
    excerpt: 'Imagine a bedtime story where your child fights dragons, explores space, or befriends a unicorn. Here\'s how StoryGennie makes every bedtime magical.',
    date: '2026-04-10',
    dateFormatted: 'April 10, 2026',
    readTime: '5-min read',
    thumbnail: '/blog/thumb-bedtime.png',
    category: 'Parenting',
    featured: false,
    tags: ['bedtime', 'stories', 'kids', 'imagination'],

    metaTitle: 'Bedtime Stories That Make Your Kids the Hero — Every Night | StoryGennie',
    metaDescription: 'Create bedtime stories where your child is the hero. StoryGennie makes every night magical with personalized AI storybooks.',

    ctaLink: '/create',
    ctaLabel: 'Create a Bedtime Story ✨',
  },
  {
    slug: 'spark-your-childs-imagination-with-ai-storybooks',
    title: 'Spark Your Child\'s Imagination with AI-Powered Storybooks',
    excerpt: 'Creativity thrives when stories feel personal. Learn how AI storybooks unlock limitless imagination in young minds through immersive, personalized narratives.',
    date: '2026-04-06',
    dateFormatted: 'April 6, 2026',
    readTime: '5-min read',
    thumbnail: '/blog/thumb-imagination.png',
    category: 'Education',
    featured: false,
    tags: ['imagination', 'creativity', 'AI', 'learning'],

    metaTitle: 'Spark Your Child\'s Imagination with AI Storybooks | StoryGennie',
    metaDescription: 'Creativity thrives when stories feel personal. Learn how AI storybooks unlock limitless imagination in young minds.',

    ctaLink: '/create',
    ctaLabel: 'Spark Their Imagination ✨',
  },
  {
    slug: 'best-personalized-gifts-for-indian-festivals-diwali-rakhi',
    title: 'The Best Personalized Gift for Indian Festivals: Diwali, Rakhi & More',
    excerpt: 'Diwali, Rakhi, Children\'s Day — make every Indian festival special with a personalized storybook your child will treasure forever.',
    date: '2026-04-02',
    dateFormatted: 'April 2, 2026',
    readTime: '5-min read',
    thumbnail: '/blog/thumb-festivals.png',
    category: 'Gifting Ideas',
    featured: false,
    tags: ['festivals', 'Diwali', 'Rakhi', 'gifts', 'India'],

    metaTitle: 'Best Personalized Gift for Indian Festivals — Diwali, Rakhi & More | StoryGennie',
    metaDescription: 'Make Diwali, Rakhi & Children\'s Day special with personalized AI storybooks. A gift your child will treasure forever.',

    ctaLink: '/create',
    ctaLabel: 'Create a Festival Gift ✨',
  },
]

export function getFeaturedPost(): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.featured)
}

export function getNonFeaturedPosts(): BlogPost[] {
  return BLOG_POSTS.filter(p => !p.featured)
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug)
}
