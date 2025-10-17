// src/components/ui/Label.tsx
import React from 'react'

interface LabelProps {
  htmlFor: string
  children: React.ReactNode
  required?: boolean
  className?: string
  optional?: boolean
}

/**
 * Label Component
 * Styled label for form inputs
 * 
 * @example
 * <Label htmlFor="email" required>
 *   Email Address
 * </Label>
 * 
 * @example
 * <Label htmlFor="bio" optional>
 *   Biography
 * </Label>
 */
export const Label: React.FC<LabelProps> = ({
  htmlFor,
  children,
  required = false,
  optional = false,
  className = '',
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`
        block text-sm font-medium text-[var(--silver-light)] mb-1.5
        ${className}
      `}
    >
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
      {optional && (
        <span className="text-[var(--metallic-silver)] text-xs ml-1 font-normal">
          (optional)
        </span>
      )}
    </label>
  )
}