// src/hooks/projects/useRequestRefund.ts
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi'
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

  // Get emergency refund availability from contract
  const { data: emergencyRefundData } = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'isEmergencyRefundAvailable',
    args: project?.id ? [project.id] : undefined,
    query: {
      enabled: !!project?.id && (project.status === 2 || project.status === 4),
    },
  })

  // Parse emergency refund data: [available, deadline, timeRemaining]
  const emergencyRefundInfo = useMemo(() => {
    if (!emergencyRefundData || !Array.isArray(emergencyRefundData)) {
      return { 
        available: false, 
        deadline: undefined, 
        deadlinePassed: false
      }
    }

    const [available, deadline] = emergencyRefundData as [boolean, bigint, bigint]
    
    return {
      available,
      deadline,
      deadlinePassed: available, // If available is true, deadline has passed
    }
  }, [emergencyRefundData])

  // Get current timestamp for display purposes
  const { data: currentTime } = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: [{
      inputs: [],
      name: 'getCurrentTimestamp',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    }] as const,
    functionName: 'getCurrentTimestamp',
  })

  // Regular refund availability
  const canRefund = useMemo(() => {
    if (!project || !userSummary) return false
    // Can refund if project is Failed (3) or Refundable (5)
    const isFailedOrRefundable = project.status === 3 || project.status === 5
    // User hasn't refunded yet and has contribution
    const hasContribution = userSummary.contributionAmount > BigInt(0)
    const notRefunded = !userSummary.userHasRefunded
    
    return isFailedOrRefundable && hasContribution && notRefunded
  }, [project, userSummary])

  // Emergency refund availability
  const canEmergencyRefund = useMemo(() => {
    if (!project || !userSummary) return false
    const hasContribution = userSummary.contributionAmount > BigInt(0)
    const notRefunded = !userSummary.userHasRefunded
    
    return emergencyRefundInfo.available && hasContribution && notRefunded
  }, [emergencyRefundInfo, project, userSummary])

  // Determine which refund type to use
  const isEmergencyRefund = canEmergencyRefund && !canRefund

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
  const [transactionType, setTransactionType] = useState<'refund' | 'emergency_refund'>('refund')

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
      step === 'submitting' ? `Submitting ${transactionType === 'emergency_refund' ? 'emergency ' : ''}refund request...` :
      step === 'confirming' ? 'Waiting for confirmation...' :
      step === 'confirmed' ? `${transactionType === 'emergency_refund' ? 'Emergency r' : 'R'}efund requested successfully` :
      step === 'error' ? txError?.message ?? 'Transaction failed' : undefined,
  }), [showStatus, txHash, step, wagmiIsPending, isConfirming, isConfirmed, wagmiIsError, receiptError, txError, wagmiError, transactionType])

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
    setTransactionType('refund')
    
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

  const executeRequestEmergencyRefund = useCallback(async () => {
    if (!project || !canEmergencyRefund) {
      const err = new Error('Cannot request emergency refund at this time')
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
    setTransactionType('emergency_refund')
    
    // Reset toast flags
    hasShownSubmitToast.current = false
    hasShownConfirmedToast.current = false

    setStep('submitting')
    try {
      await writeContract({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'requestEmergencyRefund',
        args: [project.id],
      })
      
      // Show toast only once
      if (showToast && !hasShownSubmitToast.current) {
        toast.loading('Emergency refund request submitted — confirm in wallet')
        hasShownSubmitToast.current = true
      }
      
      onSuccess?.(txHash)
      setStep('confirming')
    } catch (err) {
      const e = err as Error
      setTxError(e)
      setStep('error')
      if (showToast) toast.error(e.message || 'Failed to request emergency refund')
      onError?.(e)
    }
  }, [writeContract, onSuccess, onError, showToast, txHash, project, canEmergencyRefund])

  const onRequestRefund = async () => {
    await executeRequestRefund()
  }

  const onRequestEmergencyRefund = async () => {
    await executeRequestEmergencyRefund()
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
        const message = transactionType === 'emergency_refund' 
          ? 'Emergency refund requested successfully' 
          : 'Refund requested successfully'
        toast.success(message)
        hasShownConfirmedToast.current = true
      }
      onConfirmed?.(txHash)
    } 
  }, [isConfirmed, step, txHash, onConfirmed, showToast, transactionType])

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
    const anyRefundAvailable = canRefund || canEmergencyRefund
    if (!anyRefundAvailable) return { text: 'Not Available', disabled: true, loading: false }
    
    const buttonText = isEmergencyRefund ? 'Request Emergency Refund' : 'Request Refund'
    
    switch (step) {
      case 'submitting':
        return { text: 'Submitting...', disabled: true, loading: true }
      case 'confirming':
        return { text: 'Confirming...', disabled: true, loading: true }
      case 'confirmed':
        return { text: isEmergencyRefund ? 'Emergency Refund Requested' : 'Refund Requested', disabled: true, loading: false }
      case 'error':
        return { text: 'Retry', disabled: false, loading: false }
      default:
        return { text: buttonText, disabled: false, loading: false }
    }
  }, [step, canRefund, canEmergencyRefund, isEmergencyRefund])

  return {
    isConnected,
    canRefund,
    canEmergencyRefund,
    isEmergencyRefund,
    isLoading,
    onRequestRefund,
    onRequestEmergencyRefund,
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
    // Emergency refund info
    liquidityDeadline: emergencyRefundInfo.deadline,
    currentTime: currentTime as bigint | undefined,
    liquidityNotAdded: emergencyRefundInfo.available,
    deadlinePassed: emergencyRefundInfo.deadlinePassed,
  }
}