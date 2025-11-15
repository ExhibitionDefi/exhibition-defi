/**
 * Frontend Sanitization Utilities
 * Protects against XSS attacks in user inputs and displays
 * 
 * Location: src/utils/sanitization.ts
 */

import { z } from 'zod'
import { logger } from './logger'

/**
 * ========================================
 * BASIC TEXT SANITIZATION
 * ========================================
 */

/**
 * Sanitize plain text input - removes HTML tags and dangerous characters
 * Use for: Names, titles, descriptions, any user text input
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return ''
  
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove HTML special chars
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .slice(0, 10000) // Prevent DoS with massive strings
}

/**
 * Sanitize text but preserve basic formatting (newlines, spaces)
 * Use for: Multi-line descriptions, project details
 */
export function sanitizeMultilineText(input: string | null | undefined): string {
  if (!input) return ''
  
  return input
    .replace(/[<>'"]/g, '') // Remove HTML special chars
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/\r\n/g, '\n') // Normalize line endings
    .slice(0, 50000) // Larger limit for descriptions
}

/**
 * ========================================
 * URL SANITIZATION
 * ========================================
 * Sanitize and validate URLs
 * Use for: Project links, social media links, documentation URLs
 * Securely sanitize and validate a URL.
 * Prevents javascript:, data:, vbscript:, file:, and about: protocols,
 * even if hidden behind whitespace, encoding, or control characters.
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null

  // Step 1: Normalize & decode
  let trimmed = url.trim()
  try {
    trimmed = decodeURIComponent(trimmed)
  } catch {
    // decoding failed, keep as-is
  }

  // Step 2: Remove invisible/control characters
  let cleaned = trimmed.replace(/[\u0000-\u001F\u007F-\u009F\s]+/g, '')
  if (cleaned.length > 2048) return null

  // Step 3: Protocol check (case-insensitive)
  const lower = cleaned.toLowerCase()
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:']
  if (dangerousProtocols.some(proto => lower.startsWith(proto))) {
    logger.warn('Blocked unsafe URL:', url)
    return null
  }

  // Step 4: Ensure http/https protocol
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`
  }

  // Step 5: Validate final URL object
  try {
    const finalUrl = new URL(cleaned)
    return finalUrl.toString()
  } catch {
    return null
  }
}

/**
 * ========================================
 * NUMBER SANITIZATION
 * ========================================
 */

/**
 * Sanitize numeric input for token amounts
 * Use for: Token supply, prices, amounts
 */
export function sanitizeNumber(
  input: string | number | null | undefined,
  options: {
    min?: number
    max?: number
    decimals?: number
  } = {}
): number | null {
  if (input === null || input === undefined || input === '') return null
  
  const num = typeof input === 'string' ? parseFloat(input) : input
  
  if (isNaN(num) || !isFinite(num)) return null
  
  // Apply min/max constraints
  if (options.min !== undefined && num < options.min) return null
  if (options.max !== undefined && num > options.max) return null
  
  // Handle decimals
  if (options.decimals !== undefined) {
    return parseFloat(num.toFixed(options.decimals))
  }
  
  return num
}

/**
 * Sanitize BigInt strings (for Wei amounts, etc.)
 */
export function sanitizeBigInt(input: string | null | undefined): string {
  if (!input) return '0'
  
  // Remove everything except digits
  const cleaned = input.replace(/[^\d]/g, '')
  
  if (!cleaned || cleaned === '0') return '0'
  
  // Remove leading zeros
  return cleaned.replace(/^0+/, '') || '0'
}

/**
 * ========================================
 * ETHEREUM ADDRESS SANITIZATION
 * ========================================
 */

/**
 * Validate and sanitize Ethereum address
 * Use for: Wallet addresses, contract addresses
 */
export function sanitizeAddress(address: string | null | undefined): string | null {
  if (!address) return null
  
  const cleaned = address.trim().toLowerCase()
  
  // Must be 42 characters (0x + 40 hex chars)
  if (!/^0x[a-f0-9]{40}$/.test(cleaned)) {
    return null
  }
  
  return cleaned
}

/**
 * ========================================
 * TOKEN METADATA SANITIZATION
 * ========================================
 */

export interface SanitizedTokenMetadata {
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  description?: string
  website?: string
  logoUrl?: string
}

/**
 * Sanitize token metadata object
 * Use for: Token creation forms, token display
 */
export function sanitizeTokenMetadata(
  metadata: Partial<SanitizedTokenMetadata>
): SanitizedTokenMetadata | null {
  try {
    // Validate required fields
    if (!metadata.name || !metadata.symbol) {
      throw new Error('Name and symbol are required')
    }
    
    const sanitized: SanitizedTokenMetadata = {
      name: sanitizeText(metadata.name).slice(0, 100),
      symbol: sanitizeText(metadata.symbol).toUpperCase().slice(0, 10),
      decimals: sanitizeNumber(metadata.decimals, { min: 0, max: 18 }) ?? 18,
      totalSupply: sanitizeBigInt(metadata.totalSupply?.toString()) ?? '0',
    }
    
    // Optional fields
    if (metadata.description) {
      sanitized.description = sanitizeMultilineText(metadata.description).slice(0, 5000)
    }
    
    if (metadata.website) {
      const url = sanitizeUrl(metadata.website)
      if (url) sanitized.website = url
    }
    
    if (metadata.logoUrl) {
      const url = sanitizeUrl(metadata.logoUrl)
      if (url) sanitized.logoUrl = url
    }
    
    return sanitized
  } catch {
    return null
  }
}

/**
 * ========================================
 * PROJECT DATA SANITIZATION
 * ========================================
 */

export interface SanitizedProjectData {
  name: string
  description: string
  tokenAddress?: string
  website?: string
  github?: string
  twitter?: string
  discord?: string
}

/**
 * Sanitize project creation/update data
 * Use for: CreateProjectPage form submissions
 */
export function sanitizeProjectData(
  data: Partial<SanitizedProjectData>
): SanitizedProjectData | null {
  try {
    if (!data.name || !data.description) {
      throw new Error('Name and description are required')
    }
    
    const sanitized: SanitizedProjectData = {
      name: sanitizeText(data.name).slice(0, 200),
      description: sanitizeMultilineText(data.description).slice(0, 10000),
    }
    
    // Optional fields
    if (data.tokenAddress) {
      const addr = sanitizeAddress(data.tokenAddress)
      if (addr) sanitized.tokenAddress = addr
    }
    
    if (data.website) {
      const url = sanitizeUrl(data.website)
      if (url) sanitized.website = url
    }
    
    if (data.github) {
      const url = sanitizeUrl(data.github)
      if (url && url.includes('github.com')) sanitized.github = url
    }
    
    if (data.twitter) {
      const url = sanitizeUrl(data.twitter)
      if (url && (url.includes('twitter.com') || url.includes('x.com'))) {
        sanitized.twitter = url
      }
    }
    
    if (data.discord) {
      const url = sanitizeUrl(data.discord)
      if (url && url.includes('discord')) sanitized.discord = url
    }
    
    return sanitized
  } catch {
    return null
  }
}

/**
 * ========================================
 * ZOD SCHEMA HELPERS
 * ========================================
 */

/**
 * Zod schemas with built-in sanitization
 * Use these in your react-hook-form schemas
 */

export const sanitizedTextSchema = z
  .string()
  .transform(sanitizeText)
  .refine(val => val.length > 0, 'Required')

export const sanitizedUrlSchema = z
  .string()
  .transform(sanitizeUrl)
  .nullable()

export const sanitizedAddressSchema = z
  .string()
  .transform(sanitizeAddress)
  .refine(val => val !== null, 'Invalid Ethereum address')

export const sanitizedNumberSchema = (options?: Parameters<typeof sanitizeNumber>[1]) =>
  z
    .union([z.string(), z.number()])
    .transform(val => sanitizeNumber(val, options))
    .refine(val => val !== null, 'Invalid number')

/**
 * ========================================
 * HTML SAFE DISPLAY
 * ========================================
 * Escape HTML safely for both browser and Node environments.
 * Prevents XSS when displaying untrusted text in the DOM.
 *
 * Handles:
 * - Undefined/null inputs
 * - Browser and SSR (Node) environments
 * - Common dangerous characters (& < > " ')
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return ''

  const text = String(input)

  // If no browser environment (SSR, Node.js)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  // Browser environment: use DOM API for full correctness
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Convert newlines to <br> tags safely
 * Use for: Displaying multi-line descriptions
 */
export function textToSafeHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>')
}

/**
 * ========================================
 * UTILITY FUNCTIONS
 * ========================================
 */

/**
 * Truncate text safely
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

/**
 * Check if string contains suspicious patterns
 */
export function hasSuspiciousContent(text: string): boolean {
  const suspicious = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
  ]
  
  return suspicious.some(pattern => pattern.test(text))
}

/**
 * Log sanitization attempt (for debugging)
 */
export function logSanitization(
  field: string,
  original: any,
  sanitized: any
): void {
  if (process.env.NODE_ENV === 'development') {
    if (original !== sanitized) {
      console.warn(`[SANITIZED] ${field}:`, { original, sanitized })
    }
  }
}