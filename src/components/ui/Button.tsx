import React from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'primary' | 'secondary' | 'danger' | 'link' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  isLoading = false,
  loadingText = 'Loading...',
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
    // --- Existing Variants ---
    default: 'bg-[var(--neon-blue)] text-[var(--deep-black)] hover:bg-[var(--neon-blue)]/80 focus:ring-[var(--neon-blue)] focus:ring-offset-[var(--deep-black)]',
    outline: 'bg-transparent border-2 border-[var(--silver-dark)] text-[var(--metallic-silver)] hover:border-[var(--neon-blue)] hover:text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/10 focus:ring-[var(--neon-blue)] focus:ring-offset-[var(--deep-black)]',
    ghost: 'bg-transparent text-[var(--metallic-silver)] hover:bg-[var(--silver-dark)]/10 hover:text-[var(--silver-light)] focus:ring-[var(--metallic-silver)] focus:ring-offset-[var(--deep-black)]',

    // --- New Variants using your custom colors ---
    
    // Primary (Most distinct/important action - using Neon Orange)
    primary: 'bg-[var(--neon-orange)] text-[var(--deep-black)] hover:bg-[var(--neon-orange)]/90 focus:ring-[var(--neon-orange)] focus:ring-offset-[var(--deep-black)]',
    
    // Secondary (Alternative action - subtle contrast with Metallic Silver)
    secondary: 'bg-[var(--metallic-silver)] text-[var(--charcoal)] hover:bg-[var(--silver-dark)] focus:ring-[var(--metallic-silver)] focus:ring-offset-[var(--deep-black)]',
    
    // Danger (Destructive action - standard red for high visibility)
    danger: 'bg-red-600 text-[var(--silver-light)] hover:bg-red-700 focus:ring-red-600 focus:ring-offset-[var(--deep-black)]',
    
    // Link (Text-based button)
    link: 'bg-transparent text-[var(--neon-blue)] hover:text-[var(--neon-blue)]/80 hover:underline px-0 py-0 h-auto focus:ring-0 focus:ring-offset-0',
    
    // Subtle (Low-emphasis background, similar to ghost but with a solid background)
    subtle: 'bg-[var(--silver-dark)]/10 text-[var(--metallic-silver)] hover:bg-[var(--silver-dark)]/20 focus:ring-[var(--metallic-silver)] focus:ring-offset-[var(--deep-black)]',
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }
  
  // Conditionally remove padding for 'link' variant
  const paddingClass = variant === 'link' ? '' : sizeClasses[size];

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        paddingClass, // Use paddingClass instead of sizeClasses[size] directly
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  )
}