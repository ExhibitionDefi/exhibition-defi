import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import { type Hash } from 'viem'

interface UseUpdatePlatformFeeReturn {
  updateFee: (percentage: number) => void
  hash: Hash | undefined
  isLoading: boolean
  isConfirming: boolean
  isConfirmed: boolean
  isError: boolean
  error: Error | null
}

export function useUpdatePlatformFee(): UseUpdatePlatformFeeReturn {
  const { writeContract, data: hash, isPending, isError, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const updateFee = (percentage: number): void => {
    writeContract({
      address: EXHIBITION_ADDRESS,
      abi: exhibitionAbi,
      functionName: 'setPlatformFeePercentage',
      args: [BigInt(percentage)],
    })
  }

  return {
    updateFee,
    hash,
    isLoading: isPending || isConfirming,
    isConfirming,
    isConfirmed,
    isError,
    error,
  }
}