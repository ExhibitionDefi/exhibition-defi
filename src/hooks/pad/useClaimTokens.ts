import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import type { ProjectDisplayData } from '@/types/project'
import { ProjectStatus } from '@/types/project'
import { toast } from 'sonner'
import type { Hash } from 'viem'
import type { TransactionType } from '@/components/common/MultiTransactionModal'
import { logger } from '@/utils/logger'

/**
 * Button state for UI feedback
 */
interface ButtonState {
  text: string
  disabled: boolean
}

/**
 * Transaction status for modal display
 */
interface TransactionStatus {
  show: boolean
  hash?: Hash
  isPending: boolean
  isConfirming: boolean
  isSuccess: boolean
  isError: boolean
  error: Error | null
}

interface UserVestingInfo {
  totalAmount: bigint
  releasedAmount: bigint
  startTime: bigint
  lastClaimTime: bigint
  nextClaimTime: bigint
  availableAmount: bigint
}

interface UseClaimTokensOptions {
  project?: ProjectDisplayData
  onSuccess?: (hash?: Hash) => void
  onConfirmed?: (hash?: Hash) => void
  onError?: (err: Error) => void
  showToast?: boolean
}

export function useClaimTokens(options: UseClaimTokensOptions = {}) {
  const { 
    project,
    onSuccess, 
    onConfirmed, 
    onError, 
    showToast = true 
  } = options

  const { isConnected, address } = useAccount()
  
  // State for modal visibility
  const [showModal, setShowModal] = useState(false)
  
  const {
    writeContract,
    data: hash,
    isPending,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()
  
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash })

  // Combine error states
  const isError = isWriteError || isReceiptError
  const error = writeError || receiptError
  
  const [vestingInfo, setVestingInfo] = useState<UserVestingInfo | null>(null)
  const [availableAmount, setAvailableAmount] = useState<bigint>(0n)
  const [nextClaimDate, setNextClaimDate] = useState<Date | null>(null)

  // Get project token info
  const { 
    symbol: projectTokenSymbol, 
    decimals: projectTokenDecimals 
  } = useTokenInfo(project?.projectToken)

  // Get user's contribution amount
  const { data: userContribution } = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'contributions',
    args: address && project ? [BigInt(project.id), address] : undefined,
    query: {
      enabled: !!address && !!project?.id,
    }
  })

  // Get user's vesting info
  const { data: userVestingData, refetch: refetchVestingInfo } = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'getUserVestingInfo',
    args: address && project ? [BigInt(project.id), address] : undefined,
    query: {
      enabled: !!address && !!project?.id,
      refetchInterval: 30_000,
    }
  })

  // Calculate available tokens to claim
  useEffect(() => {
    if (!userVestingData || !userContribution || !address || !project) return

    const vesting = userVestingData as readonly [bigint, bigint, bigint, bigint, bigint, bigint]
    const info: UserVestingInfo = {
      totalAmount: vesting[0],
      releasedAmount: vesting[1],
      startTime: vesting[2],
      lastClaimTime: vesting[3],
      nextClaimTime: vesting[4],
      availableAmount: vesting[5]
    }

    setVestingInfo(info)

    // Use the availableAmount calculated by the contract
    setAvailableAmount(info.availableAmount > 0n ? info.availableAmount : 0n)

    // Calculate next claim date
    if (info.nextClaimTime > 0n) {
      setNextClaimDate(new Date(Number(info.nextClaimTime) * 1000))
    }
  }, [userVestingData, userContribution, project, address])

  // Check if user can claim tokens
  const validStatuses: number[] = [
    ProjectStatus.Successful,
    ProjectStatus.Claimable,
    ProjectStatus.Completed
  ]
  
  const canClaim = useMemo(() => Boolean(
    isConnected &&
    project &&
    validStatuses.includes(Number(project.status)) &&
    userContribution &&
    (userContribution as bigint) > 0n &&
    availableAmount > 0n
  ), [isConnected, project, userContribution, availableAmount])

  const hasContributed = Boolean(userContribution && (userContribution as bigint) > 0n)

  // Execute claim
  const executeClaim = useCallback(async () => {
    if (!project) {
      const err = new Error('Project not loaded')
      if (showToast) toast.error('Project not loaded')
      onError?.(err)
      return
    }

    if (!isConnected) {
      const err = new Error('Please connect your wallet')
      if (showToast) toast.error('Please connect your wallet')
      onError?.(err)
      return
    }

    if (availableAmount <= 0n) {
      const err = new Error('No tokens available to claim')
      if (showToast) toast.error('No tokens available to claim')
      onError?.(err)
      return
    }

    try {
      setShowModal(true)

      await writeContract({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'claimTokens',
        args: [BigInt(project.id)],
      })
      
      // Call onSuccess callback
      if (onSuccess) {
        onSuccess(hash)
      }
    } catch (err) {
      logger.error('Failed to execute claim tokens:', err)
      const error = err as Error
      
      if (showToast) {
        toast.error('Failed to initiate transaction')
      }
      
      if (onError) {
        onError(error)
      }
    }
  }, [writeContract, isConnected, availableAmount, project, onSuccess, onError, showToast, hash])

  // Reset function
  const reset = useCallback(() => {
    setShowModal(false)
    resetWrite()
  }, [resetWrite])

  // Handle success
  useEffect(() => {
    if (isConfirmed && showModal) {
      if (showToast) {
        toast.success('Tokens claimed successfully!', {
          description: 'Your tokens have been transferred to your wallet.',
        })
      }
      
      // Refetch vesting info after successful claim
      setTimeout(() => {
        refetchVestingInfo()
      }, 2000)
      
      // Call success callback
      if (onConfirmed) {
        onConfirmed(hash)
      }

      // Auto-close modal after delay
      setTimeout(() => {
        reset()
      }, 3000)
    }
  }, [isConfirmed, showModal, showToast, onConfirmed, hash, reset, refetchVestingInfo])

  // Handle error
  useEffect(() => {
    if (isError && error && showToast) {
      const errorMessage = error.message || 'Transaction failed'
      toast.error('Failed to claim tokens', {
        description: errorMessage,
      })
      
      if (onError) {
        onError(error as Error)
      }
    }
  }, [isError, error, showToast, onError])

  // Button state
  const buttonState: ButtonState = (() => {
    if (!project || !hasContributed) {
      return { text: 'No Contribution', disabled: true }
    }
    
    const validStatuses: number[] = [ProjectStatus.Successful, ProjectStatus.Claimable, ProjectStatus.Completed]
    if (!validStatuses.includes(Number(project.status))) {
      return { text: 'Not Available', disabled: true }
    }

    if (isPending) {
      return { text: 'Confirming...', disabled: true }
    }
    if (isConfirming) {
      return { text: 'Processing...', disabled: true }
    }
    if (isConfirmed) {
      return { text: 'Claimed!', disabled: true }
    }
    if (isError) {
      return { text: 'Try Again', disabled: false }
    }
    
    if (availableAmount > 0n) {
      return { text: 'Claim Tokens', disabled: false }
    }
    return { text: 'No Tokens Available', disabled: true }
  })()

  // Transaction status for modal
  const transactionStatus: TransactionStatus = {
    show: showModal,
    hash,
    isPending,
    isConfirming,
    isSuccess: isConfirmed,
    isError,
    error,
  }

  return {
    // Claim action
    claimTokens: executeClaim,
    
    // Transaction data
    hash,
    
    // Transaction states
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    isLoading: isPending || isConfirming,
    
    // UI helpers
    buttonState,
    transactionStatus,
    transactionType: 'claim' as TransactionType,
    
    // Vesting data
    vestingInfo,
    availableAmount,
    nextClaimDate,
    canClaim,
    hasContributed,
    
    // Token info
    projectTokenSymbol,
    projectTokenDecimals,
    
    // User data
    userContribution: (userContribution as bigint) || 0n,
    
    // Control functions
    reset,
  }
}