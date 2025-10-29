/**
 * SafeHtml Components Collection
 * Provides secure rendering for user-generated or dynamic content
 *
 * Location: src/components/SafeHtml.tsx
 */

import { useMemo, useState } from 'react'
import { escapeHtml, textToSafeHtml, truncate } from '@/utils/sanitization'

/* ------------------------------------------------------------
 * 🧱 SafeHtml Component
 * Safely renders sanitized HTML/text content
 * ---------------------------------------------------------- */
interface SafeHtmlProps {
  content: string
  preserveNewlines?: boolean
  maxLength?: number
  className?: string
  as?: 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function SafeHtml({
  content,
  preserveNewlines = false,
  maxLength,
  className = '',
  as: Element = 'div',
}: SafeHtmlProps) {
  const safeHtml = useMemo(() => {
    let text = content || ''

    if (maxLength) text = truncate(text, maxLength)
    return preserveNewlines ? textToSafeHtml(text) : escapeHtml(text)
  }, [content, preserveNewlines, maxLength])

  return (
    <Element
      className={className}
      dangerouslySetInnerHTML={{ __html: safeHtml || '' }} // Prevent React hydration mismatch
    />
  )
}

/* ------------------------------------------------------------
 * 🔗 SafeLink Component
 * Validates and safely displays external links
 * ---------------------------------------------------------- */
interface SafeLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function SafeLink({ href, children, className = '' }: SafeLinkProps) {
  if (!href || typeof href !== 'string') {
    return <span className={className}>{children}</span>
  }

  const isHttp = href.startsWith('http://') || href.startsWith('https://')
  const isSafeProtocol = isHttp && !href.toLowerCase().startsWith('javascript:')

  if (!isSafeProtocol) {
    console.warn('Blocked unsafe link:', href)
    return <span className={className}>{children}</span>
  }

  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        try {
          new URL(href)
        } catch {
          e.preventDefault()
          console.warn('Invalid URL blocked:', href)
        }
      }}
    >
      {children}
    </a>
  )
}

/* ------------------------------------------------------------
 * 🖼️ SafeImage Component
 * Displays images securely with error & loading handling
 * ---------------------------------------------------------- */
interface SafeImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallback?: React.ReactNode
  onError?: () => void
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallback,
  onError,
}: SafeImageProps) {
  if (!src || typeof src !== 'string') {
    return <>{fallback || null}</>
  }

  const lower = src.toLowerCase()
  if (
    lower.startsWith('data:') ||
    lower.startsWith('javascript:') ||
    (!lower.startsWith('http://') && !lower.startsWith('https://'))
  ) {
    console.warn('Blocked unsafe image source:', src)
    return <>{fallback || null}</>
  }

  return (
    <img
      key={src} // Avoid hydration issues when image src changes
      src={src}
      alt={escapeHtml(alt)}
      className={`${className} transition-opacity duration-300 opacity-0`}
      loading="lazy"
      onLoad={(e) => (e.currentTarget.style.opacity = '1')}
      onError={(e) => {
        e.currentTarget.style.display = 'none'
        onError?.()
      }}
      referrerPolicy="no-referrer"
    />
  )
}

/* ------------------------------------------------------------
 * 🧬 SafeAddressDisplay Component
 * Displays Ethereum addresses with copy functionality
 * ---------------------------------------------------------- */
interface SafeAddressDisplayProps {
  address: string
  truncate?: boolean
  className?: string
  /** Optional toast notification function */
  onCopySuccess?: (address: string) => void
  onCopyError?: (error: Error) => void
}

export function SafeAddressDisplay({
  address,
  truncate: shouldTruncate = true,
  className = '',
  onCopySuccess,
  onCopyError,
}: SafeAddressDisplayProps) {
  const [copied, setCopied] = useState(false)

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return <span className={className}>Invalid Address</span>
  }

  const displayAddress = shouldTruncate
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      
      // Call custom success handler if provided (e.g., for toast notifications)
      if (onCopySuccess) {
        onCopySuccess(address)
      } else {
        console.log('Address copied:', displayAddress)
      }

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to copy')
      
      if (onCopyError) {
        onCopyError(error)
      } else {
        console.error('Failed to copy address:', error)
      }
    }
  }

  return (
    <span
      className={`font-mono cursor-pointer hover:opacity-70 transition-opacity ${className}`}
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCopy()
        }
      }}
      title={copied ? 'Copied!' : 'Click to copy'}
    >
      {displayAddress}
      {copied && <span className="ml-2 text-green-600">✓</span>}
    </span>
  )
}

/* ------------------------------------------------------------
 * 🧾 SafeJson Component
 * Displays JSON data safely with depth & size limits
 * ---------------------------------------------------------- */
interface SafeJsonProps {
  data: any
  className?: string
  maxDepth?: number
}

function limitDepth(obj: any, depth = 0, maxDepth = 3): any {
  if (depth > maxDepth) return '[Max depth reached]'
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) {
    return obj.map((v) => limitDepth(v, depth + 1, maxDepth))
  }
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, limitDepth(v, depth + 1, maxDepth)])
  )
}

export function SafeJson({
  data,
  className = '',
  maxDepth = 3,
}: SafeJsonProps) {
  const safeJson = useMemo(() => {
    try {
      const limited = limitDepth(data, 0, maxDepth)
      const json = JSON.stringify(limited, null, 2)
      return json.slice(0, 10000)
    } catch {
      return 'Invalid JSON data'
    }
  }, [data, maxDepth])

  return (
    <pre
      className={`overflow-auto whitespace-pre-wrap break-words ${className}`}
    >
      <code>{safeJson}</code>
    </pre>
  )
}