// src/hooks/admin/usePlatformSettings.ts
import { useReadContract } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'

/**
 * Hook to fetch platform settings from the Exhibition contract
 * 
 * @example
 * ```tsx
 * const { platformFeePercentage, platformFeeRecipient, isLoading } = usePlatformSettings()
 * ```
 */
export function usePlatformSettings() {
  // Fetch platform fee percentage
  const { 
    data: platformFeePercentage, 
    isLoading: isFeeLoading,
    error: feeError,
  } = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'platformFeePercentage',
  })

  // Fetch platform fee recipient
  const { 
    data: platformFeeRecipient,
    isLoading: isRecipientLoading,
    error: recipientError,
  } = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'platformFeeRecipient',
  })

  return {
    platformFeePercentage: platformFeePercentage ?? 0n,
    platformFeeRecipient,
    isLoading: isFeeLoading || isRecipientLoading,
    error: feeError || recipientError,
  }
}