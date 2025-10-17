// src/hooks/projects/useFinalizeProject.ts
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

  // low-level wagmi write hook
  const {
    writeContract,
    data: hash, // tx hash (if available)
    isPending: wagmiIsPending,
    isError: wagmiIsError,
    error: wagmiError,
  } = useWriteContract()

  // Wait for confirmation / receipt
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Local lifecycle & UI state
  const [step, setStep] = useState<Step>('idle')
  const [txHash, setTxHash] = useState<Hash | undefined>(undefined)
  const [txError, setTxError] = useState<Error | null>(null)
  const [showStatus, setShowStatus] = useState(false)

  // Compose transactionStatus object for TransactionStatus component
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

  // Button state derived from lifecycle
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

  // Execute finalize (single public method)
  const executeFinalize = useCallback(
    async (projectId: bigint) => {
      // reset state
      setTxError(null)
      setTxHash(undefined)
      setShowStatus(true)
      setStep('submitting')

      try {
        // call contract
        await writeContract({
          address: EXHIBITION_ADDRESS,
          abi: exhibitionAbi,
          functionName: 'finalizeProject',
          args: [projectId],
        })

        // writeContract sets `data` (hash) asynchronously; we'll react to `hash` via useEffect below
        if (showToast) {
          toast.dismiss()
          toast.loading('Finalize transaction submitted — confirm in wallet')
        }

        // call onSuccess immediately if needed (note: hash may be undefined here; onSuccess receives hash when available via effect)
        onSuccess?.(txHash)
        // move to confirming — actual confirming will be inferred when hash is seen and useWaitForTransactionReceipt signals
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
        // surface error to consumer
        return Promise.reject(e)
      }
    },
    [writeContract, onSuccess, onError, showToast, txHash]
  )

  // react to wagmi-provided hash (transaction submitted)
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

  // react to receipt confirmation
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

  // handle receipt / wagmi errors
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

  // auto-reset UX after success/error (optional)
  useEffect(() => {
    if (step === 'confirmed' || step === 'error') {
      const t = setTimeout(() => {
        // keep modal visible a short time to let user click explorer, then auto-close
        setShowStatus(false)
        // keep step to confirmed/error so buttonState can reflect it; consumer can call reset if needed
      }, 8_000)
      return () => clearTimeout(t)
    }
    return
  }, [step])

  // manual reset util
  const reset = useCallback(() => {
    setStep('idle')
    setTxHash(undefined)
    setTxError(null)
    setShowStatus(false)
  }, [])

  return {
    // action
    executeFinalize,

    // button state for UI
    buttonState,

    // transaction status for TransactionStatus component
    transactionStatus: transactionStatus as TxStatus,

    // Transaction type for MultiTransactionModal
    transactionType: 'finalize' as const,

    // raw fields if you prefer
    hash: txHash,
    isPending: step === 'submitting' || wagmiIsPending,
    isConfirming: step === 'confirming' || isConfirming,
    isConfirmed: step === 'confirmed' || isConfirmed,
    isError: step === 'error' || wagmiIsError || Boolean(receiptError),
    error: txError ?? (wagmiError as Error | undefined) ?? null,
    isLoading: step === 'submitting' || step === 'confirming' || wagmiIsPending,

    // utilities
    reset,
    explorerUrl: EXPLORER_URL,
  }
}