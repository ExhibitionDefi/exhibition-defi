// src/components/ui/Checkbox.tsx
import React from 'react'
import { Check } from 'lucide-react'

interface CheckboxProps {
  id: string
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  label?: string
  disabled?: boolean
  className?: string
  error?: string
}

/**
 * Checkbox Component
 * Styled checkbox input with optional label
 * 
 * @example
 * <Checkbox
 *   id="terms"
 *   checked={accepted}
 *   onChange={(e) => setAccepted(e.target.checked)}
 *   label="I accept the terms and conditions"
 * />
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  error,
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center">
        <div className="relative flex items-center">
          {/* Hidden native checkbox */}
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only peer"
          />

          {/* Custom checkbox */}
          <label
            htmlFor={id}
            className={`
              relative flex items-center justify-center
              w-5 h-5 rounded border-2
              cursor-pointer transition-all
              ${
                checked
                  ? 'bg-[var(--neon-blue)] border-[var(--neon-blue)]'
                  : 'bg-[var(--charcoal)] border-[var(--silver-dark)]/30 hover:border-[var(--silver-dark)]/50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${error ? 'border-red-500' : ''}
            `}
          >
            {checked && (
              <Check className="w-4 h-4 text-[var(--deep-black)]" strokeWidth={3} />
            )}
          </label>
        </div>

        {/* Label */}
        {label && (
          <label
            htmlFor={id}
            className={`
              ml-3 text-sm text-[var(--silver-light)]
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {label}
          </label>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}