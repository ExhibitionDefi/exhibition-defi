import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS, EXPLORER_URL } from '@/config/contracts'
import type { ProjectDisplayData } from '@/types/project'
import { ProjectStatus } from '@/types/project'
import toast from 'react-hot-toast'
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

interface TokenInfo {
  tokensForSale: bigint
  tokensAllocated: bigint
  unsoldTokensAmount: bigint
}

interface UseWithdrawUnsoldTokensOptions {
  project?: ProjectDisplayData
  onSuccess?: (hash?: Hash) => void
  onConfirmed?: (hash?: Hash) => void
  onError?: (err: Error) => void
  showToast?: boolean
}

export function useWithdrawUnsoldTokens(options: UseWithdrawUnsoldTokensOptions = {}) {
  const { 
    project,
    onSuccess, 
    onConfirmed, 
    onError, 
    showToast = true 
  } = options

  const { isConnected, address } = useAccount()
  
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

  // Toast tracking refs to prevent duplicates
  const hasShownSubmitToast = useRef(false)
  const hasShownConfirmedToast = useRef(false)

  // Transaction status
  const transactionStatus: TxStatus = useMemo(() => ({
    show: showStatus,
    hash: txHash as `0x${string}` | undefined,
    isPending: step === 'submitting' || wagmiIsPending,
    isConfirming: step === 'confirming' || isConfirming,
    isSuccess: step === 'confirmed' || isConfirmed,
    isError: step === 'error' || wagmiIsError || Boolean(receiptError),
    error: txError ?? (wagmiError as Error | undefined) ?? null,
    message:
      step === 'submitting' ? 'Submitting withdrawal...' :
      step === 'confirming' ? 'Waiting for confirmation...' :
      step === 'confirmed' ? 'Tokens withdrawn successfully' :
      step === 'error' ? txError?.message ?? 'Transaction failed' : undefined,
  }), [showStatus, txHash, step, wagmiIsPending, isConfirming, isConfirmed, wagmiIsError, receiptError, txError, wagmiError])

  const isLoading = step === 'submitting' || step === 'confirming' || wagmiIsPending || isConfirming

  // Check if user is project owner
  const isProjectOwner = Boolean(
    address && 
    project?.projectOwner && 
    address.toLowerCase() === project.projectOwner.toLowerCase()
  )

  // Calculate token amounts
  const tokenInfo: TokenInfo = useMemo(() => {
    if (!project) {
      return {
        tokensForSale: 0n,
        tokensAllocated: 0n,
        unsoldTokensAmount: 0n,
      }
    }

    const tokensAllocated = project.tokenPrice > 0n 
      ? project.totalRaised / project.tokenPrice 
      : 0n
    
    const tokensForSale = project.amountTokensForSale
    const unsoldTokensAmount = tokensForSale > tokensAllocated 
      ? tokensForSale - tokensAllocated 
      : 0n

    return {
      tokensForSale,
      tokensAllocated,
      unsoldTokensAmount,
    }
  }, [project])

  // Check if withdrawal delay has passed
  const currentTime = Math.floor(Date.now() / 1000)
  const WITHDRAWAL_DELAY = 1 * 24 * 60 * 60 // 1 day in seconds
  const withdrawalUnlocksAt = project ? Number(project.endTime) + WITHDRAWAL_DELAY : 0
  const isWithdrawalUnlocked = currentTime >= withdrawalUnlocksAt

  // Check if withdrawal is allowed based on contract logic
  const invalidStatuses: number[] = [ProjectStatus.Upcoming, ProjectStatus.Active]
  
  const canWithdrawByStatus = project ? (
    // Can withdraw if Failed/Refundable
    Number(project.status) === ProjectStatus.Failed ||
    Number(project.status) === ProjectStatus.Refundable ||
    // OR if soft cap reached but hard cap not reached
    project.totalRaised < project.fundingGoal
  ) : false

  const canWithdraw = useMemo(() => Boolean(
    isConnected &&
    project &&
    isProjectOwner &&
    !invalidStatuses.includes(Number(project.status)) &&
    canWithdrawByStatus &&
    isWithdrawalUnlocked
  ), [isConnected, project, isProjectOwner, canWithdrawByStatus, isWithdrawalUnlocked])

  // Execute withdrawal
  const executeWithdraw = useCallback(async () => {
    if (!project) {
      const err = new Error('Project not loaded')
      setTxError(err)
      setStep('error')
      if (showToast) toast.error('Project not loaded')
      onError?.(err)
      return
    }

    setTxError(null)
    setTxHash(undefined)
    setShowStatus(true)
    setStep('idle')
    hasShownSubmitToast.current = false
    hasShownConfirmedToast.current = false

    if (!isConnected) {
      const err = new Error('Please connect your wallet')
      setTxError(err)
      setStep('error')
      if (showToast) toast.error('Please connect your wallet')
      onError?.(err)
      return
    }

    if (!isProjectOwner) {
      const err = new Error('Only project owner can withdraw')
      setTxError(err)
      setStep('error')
      if (showToast) toast.error('Only project owner can withdraw')
      onError?.(err)
      return
    }

    if (!isWithdrawalUnlocked) {
      const unlockDate = new Date(withdrawalUnlocksAt * 1000).toLocaleString()
      const err = new Error(`Withdrawal locked until ${unlockDate}`)
      setTxError(err)
      setStep('error')
      if (showToast) toast.error(`Withdrawal locked until ${unlockDate}`)
      onError?.(err)
      return
    }

    if (!canWithdrawByStatus) {
      const err = new Error('Cannot withdraw in current project status')
      setTxError(err)
      setStep('error')
      if (showToast) toast.error('Cannot withdraw in current project status')
      onError?.(err)
      return
    }

    setStep('submitting')
    try {
      await writeContract({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'withdrawUnsoldTokens',
        args: [BigInt(project.id)],
      })
      
      if (showToast && !hasShownSubmitToast.current) {
        toast.loading('Withdrawal submitted — confirm in wallet')
        hasShownSubmitToast.current = true
      }
      
      onSuccess?.(txHash)
      setStep('confirming')
    } catch (err) {
      const e = err as Error
      setTxError(e)
      setStep('error')
      if (showToast) toast.error(e.message || 'Failed to withdraw')
      onError?.(e)
    }
  }, [writeContract, isConnected, isProjectOwner, project, onSuccess, onError, showToast, txHash, isWithdrawalUnlocked, withdrawalUnlocksAt, canWithdrawByStatus])

  // Handle hash
  useEffect(() => { 
    if (hash) { 
      setTxHash(hash)
      setStep('confirming')
    } 
  }, [hash])

  // Handle confirmation
  useEffect(() => { 
    if (isConfirmed && step === 'confirming' && !hasShownConfirmedToast.current) { 
      setStep('confirmed')
      if (showToast) {
        toast.success('Tokens withdrawn successfully')
        hasShownConfirmedToast.current = true
      }
      onConfirmed?.(txHash)
    } 
  }, [isConfirmed, step, txHash, onConfirmed, showToast])

  // Handle errors
  useEffect(() => { 
    if (receiptError || wagmiIsError) { 
      setTxError(wagmiError as Error)
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
        hasShownSubmitToast.current = false
        hasShownConfirmedToast.current = false
      }, 10000)
      return () => clearTimeout(t)
    }
  }, [step, showStatus])

  // Reset function
  const reset = useCallback(() => {
    if (showToast) toast.dismiss()
    setStep('idle')
    setTxHash(undefined)
    setTxError(null)
    setShowStatus(false)
    hasShownSubmitToast.current = false
    hasShownConfirmedToast.current = false
  }, [showToast])

  const closeModal = useCallback(() => {
    toast.dismiss()
    setShowStatus(false)
    setTimeout(() => reset(), 100)
  }, [reset])

  // Button state
  const buttonState: ButtonState = useMemo(() => {
    if (!project || !isProjectOwner) {
      return { text: 'Not Owner', disabled: true, loading: false }
    }

    const invalidStatuses: number[] = [ProjectStatus.Upcoming, ProjectStatus.Active]
    if (invalidStatuses.includes(Number(project.status))) {
      return { text: 'Not Available Yet', disabled: true, loading: false }
    }

    if (!isWithdrawalUnlocked) {
      const unlockDate = new Date(withdrawalUnlocksAt * 1000).toLocaleDateString()
      return { text: `Locked until ${unlockDate}`, disabled: true, loading: false }
    }

    if (!canWithdrawByStatus) {
      return { text: 'Not Available', disabled: true, loading: false }
    }

    switch (step) {
      case 'submitting':
        return { text: 'Submitting...', disabled: true, loading: true }
      case 'confirming':
        return { text: 'Confirming...', disabled: true, loading: true }
      case 'confirmed':
        return { text: 'Withdrawn', disabled: true, loading: false }
      case 'error':
        return { text: 'Retry', disabled: false, loading: false }
      default:
        return { text: 'Withdraw Unsold Tokens', disabled: false, loading: false }
    }
  }, [step, project, isProjectOwner, isWithdrawalUnlocked, withdrawalUnlocksAt, canWithdrawByStatus])

  return {
    // Withdraw action
    withdrawUnsoldTokens: executeWithdraw,
    
    // Transaction state
    hash: txHash,
    isPending: step === 'submitting' || wagmiIsPending,
    isConfirming: step === 'confirming' || isConfirming,
    isConfirmed: step === 'confirmed' || isConfirmed,
    isError: step === 'error' || wagmiIsError || Boolean(receiptError),
    error: txError ?? wagmiError,
    isLoading,
    
    // Transaction status
    transactionStatus,
    
    // Permissions & timing
    canWithdraw,
    isProjectOwner,
    isWithdrawalUnlocked,
    withdrawalUnlocksAt: new Date(withdrawalUnlocksAt * 1000),
    
    // Token info (calculated in hook)
    tokenInfo,
    
    // Actions
    reset,
    closeModal,
    explorerUrl: EXPLORER_URL,
    buttonState,
    transactionType: 'withdraw' as const,
  }
}