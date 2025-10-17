import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | string // Allow custom Tailwind padding class
  hover?: boolean
  fullWidth?: boolean
  widthClass?: string // Custom width class
  baseClass?: string // Allow overriding base classes
  style?: React.CSSProperties
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false,
  fullWidth = false,
  widthClass,
  baseClass = 'bg-[var(--charcoal)] rounded-lg shadow-sm border border-[var(--silver-dark)]/30',
}) => {
  const hoverClasses = hover
    ? 'hover:shadow-lg hover:shadow-[var(--neon-blue)]/5 hover:border-[var(--neon-blue)]/50 transition-all duration-300'
    : ''

  const paddingClasses: Record<string, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12',
  }

  const effectivePadding = paddingClasses[padding] || padding // Use predefined or custom class

  // ✅ Neutral default: let parent layout control width
  const effectiveWidth = widthClass || (fullWidth ? 'w-full' : '')

  return (
    <div
      className={clsx(
        baseClass,
        effectiveWidth,
        hoverClasses,
        effectivePadding,
        className
      )}
    >
      {children}
    </div>
  )
}