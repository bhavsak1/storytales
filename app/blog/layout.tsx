import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | StoryGennie Blog',
    default: 'StoryGennie Blog — Personalized Gift Ideas for Kids',
  },
  description:
    'Tips, ideas, and inspiration for gifting personalized AI storybooks to children in India.',
}

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}
