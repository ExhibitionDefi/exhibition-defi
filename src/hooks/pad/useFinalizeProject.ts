// src/hooks/projects/useFinalizeProject.ts
/**
 * Hook for finalizing a project after its funding period has ended.
 * 
 * IMPORTANT: This is a PUBLIC function - anyone can call it, not just the project owner.
 * 
 * When to use:
 * - Project status is still "Active" (blockchain doesn't auto-update state)
 * - Current time has passed the project's endTime
 * - Project has reached its softCap goal
 * 
 * What it does:
 * - Transitions project from "Active" to "Successful" status
 * - Enables token claims for contributors
 * - Allows owner to deposit liquidity tokens
 * - Single transaction, no approval needed
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS, EXPLORER_URL } from '@/config/contracts'
import type { Hash } from 'viem'

type Step = 'idle' | 'submitting' | 'confirming' | 'confirmed' | 'error'

interface ButtonState {
  text: string
  disabled: boolean
  loading: boolean
}

interface TxStatus {
  show: boolean
  hash?: `0x${string}`
  isPending?: boolean
  isConfirming?: boolean
  isSuccess?: boolean
  isError?: boolean
  error?: Error | null
  message?: string
}

interface UseFinalizeProjectOptions {
  onSuccess?: (hash?: Hash) => void
  onConfirmed?: (hash?: Hash) => void
  onError?: (err: Error) => void
  showToast?: boolean
}

export function useFinalizeProject(options: UseFinalizeProjectOptions = {}) {
  const { onSuccess, onConfirmed, onError, showToast = true } = options

  // Low-level wagmi write hook for contract interaction
  const {
    writeContract,
    data: hash, // tx hash (if available)
    isPending: wagmiIsPending,
    isError: wagmiIsError,
    error: wagmiError,
  } = useWriteContract()

  // Wait for transaction confirmation on blockchain
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Local lifecycle & UI state management
  const [step, setStep] = useState<Step>('idle')
  const [txHash, setTxHash] = useState<Hash | undefined>(undefined)
  const [txError, setTxError] = useState<Error | null>(null)
  const [showStatus, setShowStatus] = useState(false)

  // Compose transactionStatus object for MultiTransactionModal component
  const transactionStatus: TxStatus = useMemo(() => {
    return {
      show: showStatus,
      hash: txHash as `0x${string}` | undefined,
      isPending: step === 'submitting' || wagmiIsPending,
      isConfirming: step === 'confirming' || isConfirming,
      isSuccess: step === 'confirmed' || isConfirmed,
      isError: step === 'error' || wagmiIsError || Boolean(receiptError),
      error: txError ?? (wagmiError as Error | undefined) ?? null,
      message:
        step === 'submitting'
          ? 'Submitting finalize transaction...'
          : step === 'confirming'
          ? 'Waiting for blockchain confirmation...'
          : step === 'confirmed'
          ? 'Project finalized successfully'
          : step === 'error'
          ? txError?.message ?? 'Transaction failed'
          : undefined,
    }
  }, [showStatus, txHash, step, wagmiIsPending, isConfirming, isConfirmed, wagmiIsError, receiptError, txError, wagmiError])

  // Button state derived from current transaction lifecycle step
  const buttonState: ButtonState = useMemo(() => {
    switch (step) {
      case 'submitting':
        return { text: 'Submitting...', disabled: true, loading: true }
      case 'confirming':
        return { text: 'Confirming...', disabled: true, loading: true }
      case 'confirmed':
        return { text: 'Finalized', disabled: true, loading: false }
      case 'error':
        return { text: 'Retry Finalize', disabled: false, loading: false }
      default:
        return { text: 'Finalize Project', disabled: false, loading: false }
    }
  }, [step])

  /**
   * Execute finalize - PUBLIC METHOD (anyone can call)
   * 
   * This function transitions a project from Active to Successful/Failed status base on Softcap protection
   * after Project time duration is over.
   * 
   * @param projectId - The project ID to finalize (as bigint)
   * @returns Promise that resolves when transaction is submitted
   */
  const executeFinalize = useCallback(
    async (projectId: bigint) => {
      // Reset state for new transaction
      setTxError(null)
      setTxHash(undefined)
      setShowStatus(true)
      setStep('submitting')

      try {
        // Call smart contract finalizeProject function
        // NO APPROVAL NEEDED - single transaction only
        await writeContract({
          address: EXHIBITION_ADDRESS,
          abi: exhibitionAbi,
          functionName: 'finalizeProject',
          args: [projectId],
        })

        // Show user feedback
        if (showToast) {
          toast.dismiss()
          toast.loading('Finalize transaction submitted — confirm in wallet')
        }

        // Call success callback (hash available via useEffect below)
        onSuccess?.(txHash)
        
        // Move to confirming state
        setStep('confirming')
      } catch (err) {
        const e = err as Error
        setTxError(e)
        setStep('error')
        
        if (showToast) {
          toast.dismiss()
          toast.error(e.message || 'Failed to send transaction')
        }
        
        onError?.(e)
        return Promise.reject(e)
      }
    },
    [writeContract, onSuccess, onError, showToast, txHash]
  )

  // React to wagmi-provided hash (transaction submitted to network)
  useEffect(() => {
    if (!hash) return
    setTxHash(hash as Hash)
    setStep('confirming')
    setShowStatus(true)

    if (showToast) {
      toast.dismiss()
      toast.loading('Transaction submitted — awaiting confirmation')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash])

  // React to transaction confirmation (mined in block)
  useEffect(() => {
    if (isConfirmed) {
      setStep('confirmed')
      setShowStatus(true)
      
      if (showToast) {
        toast.dismiss()
        toast.success('Project finalized successfully')
      }
      
      onConfirmed?.(txHash)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, txHash])

  // Handle transaction errors (receipt or wagmi errors)
  useEffect(() => {
    if (receiptError || wagmiIsError) {
      const errorObj = (wagmiError as Error) ?? new Error('Transaction failed')
      setTxError(errorObj)
      setStep('error')
      setShowStatus(true)
      
      if (showToast) {
        toast.dismiss()
        toast.error(errorObj.message || 'Transaction failed')
      }
      
      onError?.(errorObj)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptError, wagmiIsError, wagmiError])

  // Auto-hide modal after 8 seconds on success/error
  useEffect(() => {
    if (step === 'confirmed' || step === 'error') {
      const t = setTimeout(() => {
        setShowStatus(false)
        // Keep step state for button display
      }, 8_000)
      return () => clearTimeout(t)
    }
    return
  }, [step])

  /**
   * Manual reset utility - clears all transaction state
   * Useful for closing modal or resetting after error
   */
  const reset = useCallback(() => {
    setStep('idle')
    setTxHash(undefined)
    setTxError(null)
    setShowStatus(false)
  }, [])

  return {
    // Main action method - PUBLIC (anyone can call)
    executeFinalize,

    // Button state for UI rendering
    buttonState,

    // Transaction status for MultiTransactionModal
    transactionStatus: transactionStatus as TxStatus,

    // Transaction type identifier
    transactionType: 'finalize' as const,

    // Raw state fields for custom UI implementations
    hash: txHash,
    isPending: step === 'submitting' || wagmiIsPending,
    isConfirming: step === 'confirming' || isConfirming,
    isConfirmed: step === 'confirmed' || isConfirmed,
    isError: step === 'error' || wagmiIsError || Boolean(receiptError),
    error: txError ?? (wagmiError as Error | undefined) ?? null,
    isLoading: step === 'submitting' || step === 'confirming' || wagmiIsPending,

    // Utility functions
    reset,
    explorerUrl: EXPLORER_URL,
  }
}