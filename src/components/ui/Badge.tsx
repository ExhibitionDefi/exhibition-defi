import React from 'react'
import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const baseClasses = 'inline-flex items-center rounded-full font-medium'
  
  const variants = {
    default: 'text-[var(--deep-black)]',
    success: 'text-[var(--neon-blue)] border border-[var(--neon-blue)]',
    warning: 'text-[var(--neon-orange)] border border-[var(--neon-orange)]',
    error: 'bg-[var(--neon-orange)] text-[var(--deep-black)]',
    info: 'text-[var(--neon-blue)] border border-[var(--neon-blue)]',
  }
  
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  }
  
  // Add background based on variant
  const getBackgroundClass = () => {
    switch (variant) {
      case 'default':
        return 'bg-[var(--metallic-silver)]'
      case 'success':
        return 'bg-[var(--charcoal)]'
      case 'warning':
        return 'bg-[var(--charcoal)]'
      case 'error':
        return '' // Already has background in variants
      case 'info':
        return 'bg-[var(--charcoal)]'
      default:
        return 'bg-[var(--metallic-silver)]'
    }
  }
  
  return (
    <span className={clsx(
      baseClasses, 
      variants[variant], 
      getBackgroundClass(),
      sizes[size], 
      className
    )}>
      {children}
    </span>
  )
}