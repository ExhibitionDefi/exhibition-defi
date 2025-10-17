// src/components/ui/Alert.tsx
import React from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
  onClose?: () => void
}

const VARIANT_STYLES = {
  info: {
    container: 'bg-[var(--neon-blue)]/10 border-[var(--neon-blue)]/30',
    icon: 'text-[var(--neon-blue)]',
    title: 'text-[var(--neon-blue)]',
    text: 'text-[var(--silver-light)]',
    IconComponent: Info,
  },
  success: {
    container: 'bg-green-500/10 border-green-500/30',
    icon: 'text-green-500',
    title: 'text-green-400',
    text: 'text-[var(--silver-light)]',
    IconComponent: CheckCircle,
  },
  warning: {
    container: 'bg-[var(--neon-orange)]/10 border-[var(--neon-orange)]/30',
    icon: 'text-[var(--neon-orange)]',
    title: 'text-[var(--neon-orange)]',
    text: 'text-[var(--silver-light)]',
    IconComponent: AlertCircle,
  },
  error: {
    container: 'bg-red-500/10 border-red-500/30',
    icon: 'text-red-500',
    title: 'text-red-400',
    text: 'text-[var(--silver-light)]',
    IconComponent: XCircle,
  },
}

/**
 * Alert Component
 * Displays informational, success, warning, or error messages
 * 
 * @example
 * <Alert variant="success" title="Success!">
 *   Your project was created successfully.
 * </Alert>
 * 
 * @example
 * <Alert variant="error" title="Error">
 *   Failed to create project. Please try again.
 * </Alert>
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
  onClose,
}) => {
  const styles = VARIANT_STYLES[variant]
  const IconComponent = styles.IconComponent

  return (
    <div
      className={`
        relative rounded-lg border p-4
        ${styles.container}
        ${className}
      `}
      role="alert"
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${styles.icon}`}>
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-semibold mb-1 ${styles.title}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${styles.text}`}>
            {children}
          </div>
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${styles.icon} hover:opacity-70 transition-opacity`}
            aria-label="Close alert"
          >
            <XCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}