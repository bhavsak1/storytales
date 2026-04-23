// ── Single source of truth for all pricing across the app ──

export interface StoryPlan {
  name: string
  price: string
  originalPrice?: string
  amountPaise: number        // Razorpay amount in paise
  desc: string
  features: string[]
  popular: boolean
  comingSoon: boolean
  value: string              // delivery type key: 'digital', 'print', 'both'
  emoji: string
  shortDesc: string          // short description for delivery picker
}

export interface ColorbookPlan {
  name: string
  price: string
  originalPrice?: string
  amountPaise: number
  desc: string
  comingSoon: boolean
  emoji: string
}

// ── Story delivery plans ──
export const STORY_PLANS: StoryPlan[] = [
  {
    name: 'Digital PDF',
    price: '₹50',
    originalPrice: '₹299',
    amountPaise: 5000,       // ₹50 = 5000 paise
    desc: 'Download instantly. Read on any device.',
    features: ['Personalized story', 'AI illustrations', 'PDF download', 'Email delivery'],
    popular: true,
    comingSoon: false,
    value: 'digital',
    emoji: '📲',
    shortDesc: 'Download instantly',
  },
  {
    name: 'Printed Hardcover',
    price: '₹1,199',
    amountPaise: 119900,
    desc: 'Premium full-color book delivered to your door.',
    features: ['Everything in Digital', 'Hardcover print', 'Ships in 5-7 days', 'Gift ready'],
    popular: false,
    comingSoon: true,
    value: 'print',
    emoji: '📦',
    shortDesc: 'Ships in 5-7 days',
  },
  {
    name: 'Both',
    price: '₹1,399',
    amountPaise: 139900,
    desc: 'Best value — PDF now, hardcover later.',
    features: ['Everything included', 'PDF instantly', 'Hardcover shipped', 'Best value'],
    popular: false,
    comingSoon: true,
    value: 'both',
    emoji: '🎁',
    shortDesc: 'PDF + hardcover',
  },
]

// ── Coloring book plan ──
export const COLORBOOK_PLAN: ColorbookPlan = {
  name: 'Digital PDF',
  price: '₹50',
  originalPrice: '₹299',
  amountPaise: 5000,
  desc: 'Download instantly & print at home',
  comingSoon: false,
  emoji: '🖨️',
}

// ── Helpers ──
export function getStoryPlanByValue(value: string): StoryPlan | undefined {
  return STORY_PLANS.find(p => p.value === value)
}

export function getActivePlan(): StoryPlan {
  return STORY_PLANS.find(p => !p.comingSoon) || STORY_PLANS[0]
}
