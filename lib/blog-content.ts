// ── Blog content registry ──
// Maps slugs → React components for full article bodies.
// The featured post has hand-crafted content; others use the fallback in [slug]/page.tsx.

import type { ComponentType } from 'react'
import BirthdayReturnGiftsContent from './blog-posts/birthday-return-gifts'

const contentMap: Record<string, ComponentType> = {
  'best-birthday-return-gift-idea-personalized-ai-storybooks': BirthdayReturnGiftsContent,
}

/**
 * Returns the content component for a given blog slug, or null if none exists.
 * When null, the [slug]/page.tsx renders a generic fallback.
 */
export function getBlogContent(slug: string): ComponentType | null {
  return contentMap[slug] ?? null
}
