// src/hooks/useBlockchainTime.ts
import { useState, useEffect } from 'react'
import { usePublicClient } from 'wagmi'
import { logger } from '@/utils/logger'

interface UseBlockchainTimeOptions {
  /**
   * How often to refetch blockchain time (in milliseconds)
   * @default 5000 (5 seconds)
   */
  refetchInterval?: number
  /**
   * Whether to enable automatic refetching
   * @default true
   */
  enabled?: boolean
}

interface UseBlockchainTimeReturn {
  /**
   * Current blockchain timestamp as bigint (logical timestamp)
   */
  timestamp: bigint
  /**
   * Current blockchain timestamp as number (for easier comparisons)
   */
  timestampNumber: number
  /**
   * Whether the initial fetch is still loading
   */
  isLoading: boolean
  /**
   * Any error that occurred during fetching
   */
  error: Error | null
  /**
   * Manually trigger a refetch of blockchain time
   */
  refetch: () => Promise<void>
}

/**
 * useBlockchainTime
 * 
 * Fetches and maintains the current blockchain timestamp using logical time.
 * Nexus L1 uses monotonically increasing counters instead of Unix epoch time.
 * 
 * @param options - Configuration options for the hook
 * @returns Current blockchain timestamp and utilities
 * 
 * @example
 * ```tsx
 * const { timestamp, timestampNumber, isLoading } = useBlockchainTime()
 * 
 * // Use in comparisons
 * const hasStarted = timestampNumber >= Number(project.startTime)
 * const hasEnded = timestampNumber >= Number(project.endTime)
 * ```
 */
export function useBlockchainTime(
  options: UseBlockchainTimeOptions = {}
): UseBlockchainTimeReturn {
  const { refetchInterval = 5000, enabled = true } = options
  
  const publicClient = usePublicClient()
  const [timestamp, setTimestamp] = useState<bigint>(0n)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBlockchainTime = async () => {
    if (!publicClient) {
      setIsLoading(false)
      return
    }

    try {
      const latestBlock = await publicClient.getBlock({ blockTag: 'latest' })
      setTimestamp(latestBlock.timestamp)
      setError(null)
      setIsLoading(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch blockchain time')
      logger.error('Failed to fetch blockchain time:', error)
      setError(error)
      setIsLoading(false)
    }
  }

  // Initial fetch and interval setup
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false)
      return
    }

    // Fetch immediately
    fetchBlockchainTime()

    // Set up interval for continuous updates
    const interval = setInterval(fetchBlockchainTime, refetchInterval)

    return () => clearInterval(interval)
  }, [publicClient, refetchInterval, enabled])

  return {
    timestamp,
    timestampNumber: Number(timestamp),
    isLoading,
    error,
    refetch: fetchBlockchainTime,
  }
}

/**
 * Utility function to check if a project has started
 */
export function hasProjectStarted(
  blockchainTime: number | bigint,
  startTime: number | bigint
): boolean {
  return Number(blockchainTime) >= Number(startTime)
}

/**
 * Utility function to check if a project has ended
 */
export function hasProjectEnded(
  blockchainTime: number | bigint,
  endTime: number | bigint
): boolean {
  return Number(blockchainTime) >= Number(endTime)
}

/**
 * Utility function to check if a project is currently active (between start and end)
 */
export function isProjectActive(
  blockchainTime: number | bigint,
  startTime: number | bigint,
  endTime: number | bigint
): boolean {
  const now = Number(blockchainTime)
  return now >= Number(startTime) && now < Number(endTime)
}