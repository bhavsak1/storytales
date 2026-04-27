'use client'

import Link from 'next/link'
import { trackEvent } from '@/lib/analytics'

export function TrackedCTA({
  href,
  className,
  style,
  children,
  location,
}: {
  href: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
  location: string
}) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() => trackEvent('cta_clicked', { location })}
    >
      {children}
    </Link>
  )
}
