import React from 'react'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
  variant?: 'neon-blue' | 'neon-orange' | 'silver' | 'gradient'
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text,
  variant = 'neon-blue',
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  }

  const variants = {
    'neon-blue': 'text-[var(--neon-blue)] drop-shadow-[0_0_8px_var(--neon-blue)]',
    'neon-orange': 'text-[var(--neon-orange)] drop-shadow-[0_0_8px_var(--neon-orange)]',
    'silver': 'text-[var(--metallic-silver)] drop-shadow-[0_0_4px_var(--metallic-silver)]',
    'gradient': 'text-[var(--neon-blue)] drop-shadow-[0_0_8px_var(--neon-blue)] animate-pulse',
  }

  return (
    <div className={clsx('flex flex-col items-center justify-center', className)}>
      <div className="relative">
        <Loader2 className={clsx(
          'animate-spin',
          sizes[size],
          variants[variant]
        )} />
        {variant === 'gradient' && (
          <div className="absolute inset-0">
            <Loader2 className={clsx(
              'animate-spin text-[var(--neon-orange)] drop-shadow-[0_0_8px_var(--neon-orange)] opacity-60',
              sizes[size]
            )} 
            style={{
              animationDelay: '0.5s',
              animationDirection: 'reverse'
            }} />
          </div>
        )}
      </div>
      {text && (
        <p className="mt-3 text-sm text-[var(--metallic-silver)] text-center animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}