import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import { type Address, type Hash } from 'viem'

interface UseManageContributionTokensReturn {
  add: (tokenAddress: Address) => void
  remove: (tokenAddress: Address) => void
  addHash: Hash | undefined
  removeHash: Hash | undefined
  isAddLoading: boolean
  isAddConfirmed: boolean
  isRemoveLoading: boolean
  isRemoveConfirmed: boolean
  isError: boolean
  error: Error | null
}

export function useManageContributionTokens(): UseManageContributionTokensReturn {
  // Add token
  const { 
    writeContract: addToken, 
    data: addHash,
    isPending: isAddPending,
    isError: isAddError,
    error: addError
  } = useWriteContract()
  
  const { 
    isLoading: isAddConfirming, 
    isSuccess: isAddConfirmed 
  } = useWaitForTransactionReceipt({ hash: addHash })

  // Remove token
  const { 
    writeContract: removeToken, 
    data: removeHash,
    isPending: isRemovePending,
    isError: isRemoveError,
    error: removeError
  } = useWriteContract()
  
  const { 
    isLoading: isRemoveConfirming, 
    isSuccess: isRemoveConfirmed 
  } = useWaitForTransactionReceipt({ hash: removeHash })

  const add = (tokenAddress: Address): void => {
    addToken({
      address: EXHIBITION_ADDRESS,
      abi: exhibitionAbi,
      functionName: 'addExhibitionContributionToken',
      args: [tokenAddress],
    })
  }

  const remove = (tokenAddress: Address): void => {
    removeToken({
      address: EXHIBITION_ADDRESS,
      abi: exhibitionAbi,
      functionName: 'removeExhibitionContributionToken',
      args: [tokenAddress],
    })
  }

  return {
    add,
    remove,
    addHash,
    removeHash,
    isAddLoading: isAddPending || isAddConfirming,
    isAddConfirmed,
    isRemoveLoading: isRemovePending || isRemoveConfirming,
    isRemoveConfirmed,
    isError: isAddError || isRemoveError,
    error: addError || removeError,
  }
}