import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import { type Address, type Hash } from 'viem'

interface UseUpdateFeeRecipientReturn {
  updateRecipient: (recipient: Address) => void
  hash: Hash | undefined
  isLoading: boolean
  isConfirming: boolean
  isConfirmed: boolean
  isError: boolean
  error: Error | null
}

export function useUpdateFeeRecipient(): UseUpdateFeeRecipientReturn {
  const { writeContract, data: hash, isPending, isError, error } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const updateRecipient = (recipient: Address): void => {
    writeContract({
      address: EXHIBITION_ADDRESS,
      abi: exhibitionAbi,
      functionName: 'setPlatformFeeRecipient',
      args: [recipient],
    })
  }

  return {
    updateRecipient,
    hash,
    isLoading: isPending || isConfirming,
    isConfirming,
    isConfirmed,
    isError,
    error,
  }
}