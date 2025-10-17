import React from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--metallic-silver)]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'block w-full rounded-lg border border-[var(--silver-dark)] bg-[var(--charcoal)] px-3 py-2 text-sm text-[var(--silver-light)] placeholder-[var(--silver-dark)] focus:border-[var(--neon-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-blue)] transition-colors duration-200',
          error && 'border-[var(--neon-orange)] focus:border-[var(--neon-orange)] focus:ring-[var(--neon-orange)]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-[var(--neon-orange)]">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-[var(--silver-dark)]">{helperText}</p>
      )}
    </div>
  )
}