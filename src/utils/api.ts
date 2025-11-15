/**
 * Secure API Client for Exhibition Backend
 * Handles authentication, CSRF tokens, and sanitization
 * 
 * Location: src/utils/api.ts
 */

import { logger } from "./logger"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/csrf_token=([^;]+)/)
  return match ? match[1] : null
}

/**
 * Secure fetch wrapper with automatic CSRF handling
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`
  
  // Add CSRF token for state-changing requests
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    options.method || 'GET'
  )
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  
  // Add CSRF token from cookie
  if (needsCsrf) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // CRITICAL: Send httpOnly cookies
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed')
    }
    
    return data
  } catch (error) {
    logger.error('API Error:', error)
    throw error
  }
}

/**
 * Verify wallet signature and get JWT token
 */
export async function verifyWallet(
  address: string,
  signature: string,
  message: string
): Promise<ApiResponse<{ address: string; csrfToken: string }>> {
  return apiClient('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ address, signature, message }),
  })
}

/**
 * Logout and clear auth cookies
 */
export async function logout(): Promise<ApiResponse> {
  return apiClient('/api/auth/logout', {
    method: 'POST',
  })
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<{ address: string; expiresAt: number }>> {
  return apiClient('/api/auth/me')
}

/**
 * Get the message that should be signed
 */
export async function getSigningMessage(): Promise<ApiResponse<{ message: string }>> {
  return apiClient('/api/auth/message')
}