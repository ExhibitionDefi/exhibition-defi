/**
 * src/utils/api.ts
 * Secure API Client for Exhibition Backend
 * Handles authentication, CSRF tokens, and sanitization
 */

import { logger } from './logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Helper: Get CSRF token from cookie or refresh it if missing
 * Works for both GET and state-changing requests
 */
async function ensureCsrfToken(): Promise<string | null> {
  let token = document.cookie.match(/csrf_token=([^;]+)/)?.[1] ?? null

  if (!token) {
    try {
      // Ping backend to set CSRF cookie if missing
      await fetch(`${API_URL}/`, { method: 'GET', credentials: 'include' })
      token = document.cookie.match(/csrf_token=([^;]+)/)?.[1] ?? null
      if (token) logger.info('CSRF token refreshed')
    } catch (err) {
      console.warn('Failed to refresh CSRF token:', err)
    }
  }

  return token
}

/**
 * Secure fetch wrapper with automatic CSRF handling
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`
  const method = options.method?.toUpperCase() || 'GET'
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // Always ensure CSRF token exists
  const csrfToken = await ensureCsrfToken()
  if (csrfToken && needsCsrf) {
    headers['X-CSRF-Token'] = csrfToken
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Critical: send httpOnly cookies
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
 * Wallet verification
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
 * Logout
 */
export async function logout(): Promise<ApiResponse> {
  return apiClient('/api/auth/logout', { method: 'POST' })
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<ApiResponse<{ address: string; expiresAt: number }>> {
  return apiClient('/api/auth/me')
}

/**
 * Get signing message
 */
export async function getSigningMessage(): Promise<ApiResponse<{ message: string }>> {
  return apiClient('/api/auth/message')
}

/**
 * Update project metadata
 */
export async function updateProjectMetadata(
  projectId: string,
  data: {
    twitter?: string
    website?: string
    overview?: string
  }
): Promise<ApiResponse> {
  return apiClient(`/api/projects/${projectId}/metadata`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}