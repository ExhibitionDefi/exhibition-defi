import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS, EXPLORER_URL } from '@/config/contracts'
import { useTokenInfo } from '@/hooks/useTokenInfo'
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
  
  const [vestingInfo, setVestingInfo] = useState<UserVestingInfo | null>(null)
  const [availableAmount, setAvailableAmount] = useState<bigint>(0n)
  const [nextClaimDate, setNextClaimDate] = useState<Date | null>(null)

  // 🔥 Toast tracking refs to prevent duplicates
  const hasShownSubmitToast = useRef(false)
  const hasShownConfirmedToast = useRef(false)

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
      step === 'submitting' ? 'Submitting claim...' :
      step === 'confirming' ? 'Waiting for confirmation...' :
      step === 'confirmed' ? 'Claimed successfully' :
      step === 'error' ? txError?.message ?? 'Transaction failed' : undefined,
  }), [showStatus, txHash, step, wagmiIsPending, isConfirming, isConfirmed, wagmiIsError, receiptError, txError, wagmiError])

  const isLoading = step === 'submitting' || step === 'confirming' || wagmiIsPending || isConfirming

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

    if (availableAmount <= 0n) {
      const err = new Error('No tokens available to claim')
      setTxError(err)
      setStep('error')
      if (showToast) toast.error('No tokens available to claim')
      onError?.(err)
      return
    }

    setStep('submitting')
    try {
      await writeContract({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'claimTokens',
        args: [BigInt(project.id)],
      })
      
      if (showToast && !hasShownSubmitToast.current) {
        toast.loading('Claim submitted — confirm in wallet')
        hasShownSubmitToast.current = true
      }
      
      onSuccess?.(txHash)
      setStep('confirming')
    } catch (err) {
      const e = err as Error
      setTxError(e)
      setStep('error')
      if (showToast) toast.error(e.message || 'Failed to claim')
      onError?.(e)
    }
  }, [writeContract, isConnected, availableAmount, project, onSuccess, onError, showToast, txHash])

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
        toast.success('Tokens claimed successfully')
        hasShownConfirmedToast.current = true
      }
      
      // Refetch vesting info after successful claim
      setTimeout(() => {
        refetchVestingInfo()
      }, 2000)
      
      onConfirmed?.(txHash)
    } 
  }, [isConfirmed, step, txHash, onConfirmed, showToast, refetchVestingInfo])

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
    if (!project || !hasContributed) {
      return { text: 'No Contribution', disabled: true, loading: false }
    }
    
    const validStatuses: number[] = [ProjectStatus.Successful, ProjectStatus.Claimable, ProjectStatus.Completed]
    if (!validStatuses.includes(Number(project.status))) {
      return { text: 'Not Available', disabled: true, loading: false }
    }

    switch (step) {
      case 'submitting':
        return { text: 'Submitting...', disabled: true, loading: true }
      case 'confirming':
        return { text: 'Confirming...', disabled: true, loading: true }
      case 'confirmed':
        return { text: 'Claimed', disabled: true, loading: false }
      case 'error':
        return { text: 'Retry', disabled: false, loading: false }
      default:
        if (availableAmount > 0n) {
          return { text: 'Claim Tokens', disabled: false, loading: false }
        }
        return { text: 'No Tokens Available', disabled: true, loading: false }
    }
  }, [step, project, hasContributed, availableAmount])

  return {
    // Claim action
    claimTokens: executeClaim,
    
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
    
    // Actions
    reset,
    closeModal,
    explorerUrl: EXPLORER_URL,
    buttonState,
  }
}