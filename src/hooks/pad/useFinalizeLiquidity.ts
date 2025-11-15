// src/hooks/projects/useFinalizeLiquidity.ts
import { useState, useCallback, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
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
interface UseFinalizeLiquidityOptions {
  onConfirmed?: () => void
  showToast?: boolean
}

/**
 * Return type for useFinalizeLiquidity hook
 */
interface UseFinalizeLiquidityReturn {
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

/**
 * Enhanced hook for finalizing liquidity and releasing funds
 * 
 * This hook handles the finalizeLiquidityAndReleaseFunds transaction with:
 * - Transaction state management
 * - UI feedback (button states, modals, toasts)
 * - Liquidity deposit validation
 * - Error handling
 * - Success callbacks
 * 
 * @example
 * ```tsx
 * const finalizeLiquidity = useFinalizeLiquidity({
 *   onConfirmed: () => refetch(),
 *   showToast: true,
 * })
 * 
 * // In your component
 * <Button
 *   onClick={() => finalizeLiquidity.executeFinalize(projectId)}
 *   disabled={finalizeLiquidity.buttonState.disabled}
 * >
 *   {finalizeLiquidity.buttonState.text}
 * </Button>
 * 
 * <MultiTransactionModal
 *   isOpen={finalizeLiquidity.transactionStatus.show}
 *   onClose={finalizeLiquidity.reset}
 *   transactionType={finalizeLiquidity.transactionType}
 *   mainHash={finalizeLiquidity.hash}
 *   isMainPending={finalizeLiquidity.isPending}
 *   isMainConfirming={finalizeLiquidity.isConfirming}
 *   isMainSuccess={finalizeLiquidity.isConfirmed}
 *   isError={finalizeLiquidity.isError}
 *   error={finalizeLiquidity.error}
 * />
 * ```
 */
export function useFinalizeLiquidity(
  options: UseFinalizeLiquidityOptions = {}
): UseFinalizeLiquidityReturn {
  const { onConfirmed, showToast = true } = options

  // State for current project being finalized
  const [currentProjectId, setCurrentProjectId] = useState<bigint | null>(null)
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

  // Read deposited liquidity tokens for validation (optional - for UI feedback)
  const { data: depositedTokens } = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'getProjectLiquidityDeposit',
    args: currentProjectId ? [currentProjectId] : undefined,
    query: {
      enabled: currentProjectId !== null,
    },
  })

  // Combine error states
  const isError = isWriteError || isReceiptError
  const error = writeError || receiptError

  // Core execution function
  const executeFinalize = useCallback(
    (projectId: bigint) => {
      try {
        setCurrentProjectId(projectId)
        setShowModal(true)

        writeContract({
          address: EXHIBITION_ADDRESS,
          abi: exhibitionAbi,
          functionName: 'finalizeLiquidityAndReleaseFunds',
          args: [projectId],
        })
      } catch (err) {
        logger.error('Failed to execute finalize liquidity:', err)
        if (showToast) {
          toast.error('Failed to initiate transaction')
        }
      }
    },
    [writeContract, showToast]
  )

  // Reset function
  const reset = useCallback(() => {
    setShowModal(false)
    setCurrentProjectId(null)
    resetWrite()
  }, [resetWrite])

  // Handle success
  useEffect(() => {
    if (isConfirmed && showModal) {
      if (showToast) {
        toast.success('Liquidity finalized and funds released!', {
          description: 'Your project is now completed.',
        })
      }
      
      // Call success callback
      if (onConfirmed) {
        onConfirmed()
      }

      // Auto-close modal after delay
      setTimeout(() => {
        reset()
      }, 3000)
    }
  }, [isConfirmed, showModal, showToast, onConfirmed, reset])

  // Handle error
  useEffect(() => {
    if (isError && error && showToast) {
      const errorMessage = error.message || 'Transaction failed'
      toast.error('Failed to finalize liquidity', {
        description: errorMessage,
      })
    }
  }, [isError, error, showToast])

  // Calculate button state
  const buttonState: ButtonState = (() => {
    if (isPending) {
      return { text: 'Confirming...', disabled: true }
    }
    if (isConfirming) {
      return { text: 'Processing...', disabled: true }
    }
    if (isConfirmed) {
      return { text: 'Finalized!', disabled: true }
    }
    if (isError) {
      return { text: 'Try Again', disabled: false }
    }
    
    // Check if liquidity tokens are deposited
    if (currentProjectId && depositedTokens !== undefined && depositedTokens === 0n) {
      return { text: 'Deposit Liquidity First', disabled: true }
    }

    return { text: 'Finalize Liquidity & Release Funds', disabled: false }
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