// src/hooks/projects/useRequestRefund.ts
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS, EXPLORER_URL } from '@/config/contracts'
import type { Hash } from 'viem'
import type { ProjectDisplayData, UserProjectSummary } from '@/types/project'

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

interface UseRequestRefundOptions {
  project?: ProjectDisplayData
  userSummary?: UserProjectSummary
  onSuccess?: (hash?: Hash) => void
  onConfirmed?: (hash?: Hash) => void
  onError?: (err: Error) => void
  showToast?: boolean
}

export function useRequestRefund(options: UseRequestRefundOptions = {}) {
  const { 
    project,
    userSummary,
    onSuccess, 
    onConfirmed, 
    onError, 
    showToast = true 
  } = options

  const { isConnected } = useAccount()

  const canRefund = useMemo(() => {
    if (!project || !userSummary) return false
    // Can refund if project is Failed (4) or Refundable (6)
    const isFailedOrRefundable = project.status === 4 || project.status === 6
    // User hasn't refunded yet and has contribution
    const hasContribution = userSummary.contributionAmount > BigInt(0)
    const notRefunded = !userSummary.userHasRefunded
    
    return isFailedOrRefundable && hasContribution && notRefunded
  }, [project, userSummary])

  const {
    writeContract,
    data: hash,
    isPending: wagmiIsPending,
    isError: wagmiIsError,
    error: wagmiError,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: receiptError,
  } = useWaitForTransactionReceipt({ hash })

  const [step, setStep] = useState<Step>('idle')
  const [txHash, setTxHash] = useState<Hash | undefined>(undefined)
  const [txError, setTxError] = useState<Error | null>(null)
  const [showStatus, setShowStatus] = useState(false)
  const [transactionType] = useState<'refund'>('refund')

  // 🔥 Toast tracking refs
  const hasShownSubmitToast = useRef(false)
  const hasShownConfirmedToast = useRef(false)

  const transactionStatus: TxStatus = useMemo(() => ({
    show: showStatus,
    hash: txHash as `0x${string}` | undefined,
    isPending: step === 'submitting' || wagmiIsPending,
    isConfirming: step === 'confirming' || isConfirming,
    isSuccess: step === 'confirmed' || isConfirmed,
    isError: step === 'error' || wagmiIsError || Boolean(receiptError),
    error: txError ?? (wagmiError as Error | undefined) ?? null,
    message:
      step === 'submitting' ? 'Submitting refund request...' :
      step === 'confirming' ? 'Waiting for confirmation...' :
      step === 'confirmed' ? 'Refund requested successfully' :
      step === 'error' ? txError?.message ?? 'Transaction failed' : undefined,
  }), [showStatus, txHash, step, wagmiIsPending, isConfirming, isConfirmed, wagmiIsError, receiptError, txError, wagmiError])

  const isLoading = step === 'submitting' || step === 'confirming' || wagmiIsPending || isConfirming

  const executeRequestRefund = useCallback(async () => {
    if (!project || !canRefund) {
      const err = new Error('Cannot request refund at this time')
      setTxError(err)
      setStep('error')
      if (showToast) toast.error(err.message)
      onError?.(err)
      return
    }

    setTxError(null)
    setTxHash(undefined)
    setShowStatus(true)
    setStep('idle')
    
    // Reset toast flags
    hasShownSubmitToast.current = false
    hasShownConfirmedToast.current = false

    setStep('submitting')
    try {
      await writeContract({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'requestRefund',
        args: [project.id],
      })
      
      // Show toast only once
      if (showToast && !hasShownSubmitToast.current) {
        toast.loading('Refund request submitted — confirm in wallet')
        hasShownSubmitToast.current = true
      }
      
      onSuccess?.(txHash)
      setStep('confirming')
    } catch (err) {
      const e = err as Error
      setTxError(e)
      setStep('error')
      if (showToast) toast.error(e.message || 'Failed to request refund')
      onError?.(e)
    }
  }, [writeContract, onSuccess, onError, showToast, txHash, project, canRefund])

  const onRequestRefund = async () => {
    await executeRequestRefund()
  }

  // Set hash when available
  useEffect(() => { 
    if (hash) { 
      setTxHash(hash)
      setStep('confirming')
    } 
  }, [hash])

  // Handle confirmation - show toast only once
  useEffect(() => { 
    if (isConfirmed && step === 'confirming' && !hasShownConfirmedToast.current) { 
      setStep('confirmed')
      if (showToast) {
        toast.success('Refund requested successfully')
        hasShownConfirmedToast.current = true
      }
      onConfirmed?.(txHash)
    } 
  }, [isConfirmed, step, txHash, onConfirmed, showToast])

  // Handle errors
  useEffect(() => { 
    if (receiptError || wagmiIsError) { 
      setTxError(wagmiError)
      setStep('error')
      if (showToast) toast.error('Transaction failed')
    } 
  }, [receiptError, wagmiIsError, wagmiError, showToast])

  // Auto-hide status after completion
  useEffect(() => {
    if (!showStatus) return
    if (step === 'confirmed' || step === 'error') {
      const t = setTimeout(() => {
        setShowStatus(false)
        setStep('idle')
        setTxHash(undefined)
        setTxError(null)
        // Reset toast flags
        hasShownSubmitToast.current = false
        hasShownConfirmedToast.current = false
      }, 10000)
      return () => clearTimeout(t)
    }
  }, [step, showStatus])

  const reset = useCallback(() => {
    if (showToast) toast.dismiss()
    setStep('idle')
    setTxHash(undefined)
    setTxError(null)
    setShowStatus(false)
    // Reset toast flags
    hasShownSubmitToast.current = false
    hasShownConfirmedToast.current = false
  }, [showToast])

  const closeModal = useCallback(() => {
    toast.dismiss()
    setShowStatus(false)
    setTimeout(() => reset(), 100)
  }, [reset])

  const buttonState: ButtonState = useMemo(() => {
    if (!canRefund) return { text: 'Not Available', disabled: true, loading: false }
    switch (step) {
      case 'submitting':
        return { text: 'Submitting...', disabled: true, loading: true }
      case 'confirming':
        return { text: 'Confirming...', disabled: true, loading: true }
      case 'confirmed':
        return { text: 'Refund Requested', disabled: true, loading: false }
      case 'error':
        return { text: 'Retry', disabled: false, loading: false }
      default:
        return { text: 'Request Refund', disabled: false, loading: false }
    }
  }, [step, canRefund])

  return {
    isConnected,
    canRefund,
    isLoading,
    onRequestRefund,
    transactionStatus,
    transactionType,
    hash: txHash,
    isPending: step === 'submitting' || wagmiIsPending,
    isConfirming: step === 'confirming' || isConfirming,
    isConfirmed: step === 'confirmed' || isConfirmed,
    isError: step === 'error' || wagmiIsError || Boolean(receiptError),
    error: txError ?? wagmiError,
    reset,
    closeModal,
    explorerUrl: EXPLORER_URL,
    buttonState,
    // Expose user contribution info for display
    userContribution: userSummary?.contributionAmount ?? BigInt(0),
    contributionTokenSymbol: project?.contributionTokenSymbol ?? 'TOKEN',
    contributionTokenDecimals: project?.contributionTokenDecimals ?? 18,
  }
}