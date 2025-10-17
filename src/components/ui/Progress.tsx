import React from 'react'
import { clsx } from 'clsx'

interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  showValue?: boolean
  className?: string
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  className,
}) => {
  const percentage = Math.min((value / max) * 100, 100)
  
  const baseClasses = 'w-full bg-[var(--charcoal)] border border-[var(--silver-dark)]/20 rounded-full overflow-hidden'
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }
  
  const variants = {
    default: 'bg-[var(--neon-blue)] shadow-[0_0_8px_var(--neon-blue)]/40',
    success: 'bg-[var(--neon-blue)] shadow-[0_0_8px_var(--neon-blue)]/40',
    warning: 'bg-[var(--neon-orange)] shadow-[0_0_8px_var(--neon-orange)]/40',
    error: 'bg-[var(--neon-orange)] shadow-[0_0_8px_var(--neon-orange)]/40',
  }

  return (
    <div className={clsx('space-y-1', className)}>
      <div className={clsx(baseClasses, sizes[size])}>
        <div
          className={clsx(
            'h-full transition-all duration-300 ease-in-out',
            variants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between text-sm text-[var(--metallic-silver)]">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}