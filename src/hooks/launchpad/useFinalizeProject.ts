// src/hooks/projects/useFinalizeProject.ts
import { useState, useCallback, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import type { Hash } from 'viem'
import type { TransactionType } from '@/components/common/MultiTransactionModal'
import { toast } from 'sonner'
import { logger } from '@/utils/logger'

/**
 * Button state for UI feedback
 */
interface ButtonState {
  text: string
  disabled: boolean
  loading: boolean
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

/**
 * Hook configuration options
 */
interface UseFinalizeProjectOptions {
  onSuccess?: (hash?: Hash) => void
  onConfirmed?: (hash?: Hash) => void
  onError?: (err: Error) => void
  showToast?: boolean
}

/**
 * Return type for useFinalizeProject hook
 */
interface UseFinalizeProjectReturn {
  // Core execution function
  executeFinalize: (projectId: bigint) => void

  // Transaction data
  hash?: Hash
  
  // Transaction states
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  isError: boolean
  error: Error | null
  isLoading: boolean

  // UI helpers
  buttonState: ButtonState
  transactionStatus: TransactionStatus
  transactionType: TransactionType

  // Control functions
  reset: () => void
}

export function useFinalizeProject(
  options: UseFinalizeProjectOptions = {}
): UseFinalizeProjectReturn {
  const { onSuccess, onConfirmed, onError, showToast = true } = options

  // State for modal visibility
  const [showModal, setShowModal] = useState(false)

  // Write contract hook
  const {
    writeContract,
    data: hash,
    isPending,
    isError: isWriteError,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  // Wait for transaction receipt
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isReceiptError,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Combine error states
  const isError = isWriteError || isReceiptError
  const error = writeError || receiptError

  // Core execution function
  const executeFinalize = useCallback(
    (projectId: bigint) => {
      try {
        setShowModal(true)

        writeContract({
          address: EXHIBITION_ADDRESS,
          abi: exhibitionAbi,
          functionName: 'finalizeProject',
          args: [projectId],
        })

        // Call onSuccess callback
        if (onSuccess) {
          onSuccess(hash)
        }
      } catch (err) {
        logger.error('Failed to execute finalize project:', err)
        const error = err as Error
        
        if (showToast) {
          toast.error('Failed to initiate transaction')
        }
        
        if (onError) {
          onError(error)
        }
      }
    },
    [writeContract, onSuccess, onError, showToast, hash]
  )

  // Reset function
  const reset = useCallback(() => {
    setShowModal(false)
    resetWrite()
  }, [resetWrite])

  // Handle success
  useEffect(() => {
    if (isConfirmed && showModal) {
      if (showToast) {
        toast.success('Project finalized successfully!', {
          description: 'The project status has been updated.',
        })
      }
      
      // Call success callback
      if (onConfirmed) {
        onConfirmed(hash)
      }

      // Auto-close modal after delay
      setTimeout(() => {
        reset()
      }, 3000)
    }
  }, [isConfirmed, showModal, showToast, onConfirmed, hash, reset])

  // Handle error
  useEffect(() => {
    if (isError && error && showToast) {
      const errorMessage = error.message || 'Transaction failed'
      toast.error('Failed to finalize project', {
        description: errorMessage,
      })
      
      if (onError) {
        onError(error as Error)
      }
    }
  }, [isError, error, showToast, onError])

  // Calculate button state
  const buttonState: ButtonState = (() => {
    if (isPending) {
      return { text: 'Submitting...', disabled: true, loading: true }
    }
    if (isConfirming) {
      return { text: 'Confirming...', disabled: true, loading: true }
    }
    if (isConfirmed) {
      return { text: 'Finalized', disabled: true, loading: false }
    }
    if (isError) {
      return { text: 'Retry Finalize', disabled: false, loading: false }
    }

    return { text: 'Finalize Launch', disabled: false, loading: false }
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
    executeFinalize,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    isLoading: isPending || isConfirming,
    buttonState,
    transactionStatus,
    transactionType: 'finalize',
    reset,
  }
}