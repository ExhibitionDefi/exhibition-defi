//src/hooks/launchpad/useWithdrawUnsoldTokens.ts
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS, EXPLORER_URL } from '@/config/contracts'
import type { ProjectDisplayData } from '@/types/project'
import { ProjectStatus } from '@/types/project'
import toast from 'react-hot-toast'
import type { Hash } from 'viem'
import { useBlockchainTime } from '@/hooks/utilities/useBlockchainTime'

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

/**
 * Helper to calculate tokens allocated using the same logic as TokenCalculationLib
 * This mimics the contract's calculateTokensDue function
 */
function calculateTokensAllocated(
  totalRaised: bigint,
  tokenPrice: bigint,
  contributionDecimals: number,
  projectDecimals: number
): bigint {
  if (totalRaised === 0n || tokenPrice === 0n) return 0n

  try {
    // Scale contribution to 18 decimals
    const contributionIn18Decimals = scaleToDecimals(totalRaised, contributionDecimals, 18)
    
    // Calculate tokens in 18 decimals: (contribution * 1e18) / price
    const tokensIn18Decimals = (contributionIn18Decimals * BigInt(1e18)) / tokenPrice
    
    if (tokensIn18Decimals === 0n) return 0n

    // Scale back to project token decimals
    return scaleToDecimals(tokensIn18Decimals, 18, projectDecimals)
  } catch {
    return 0n
  }
}

/**
 * Helper to scale amounts between different decimal places
 */
function scaleToDecimals(
  amount: bigint,
  fromDecimals: number,
  toDecimals: number
): bigint {
  if (fromDecimals === toDecimals) return amount

  if (fromDecimals < toDecimals) {
    const decimalDiff = toDecimals - fromDecimals
    const scaleFactor = BigInt(10 ** decimalDiff)
    return amount * scaleFactor
  } else {
    const decimalDiff = fromDecimals - toDecimals
    const scaleFactor = BigInt(10 ** decimalDiff)
    return amount / scaleFactor
  }
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
  
  // Use blockchain time instead of client time
  const { timestampNumber: currentTime } = useBlockchainTime()
  
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
  
  // Store withdrawn amount in ref to persist across re-renders
  const withdrawnAmountRef = useRef<bigint>(0n)

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

  // Calculate token amounts - FIXED to match contract logic
  const tokenInfo: TokenInfo = useMemo(() => {
    if (!project) {
      return {
        tokensForSale: 0n,
        tokensAllocated: 0n,
        unsoldTokensAmount: 0n,
      }
    }

    const tokensForSale = project.amountTokensForSale
    const projectStatus = Number(project.status)

    // For Failed or Refundable projects, ALL tokens for sale are considered "unsold"
    // because the contract returns the full balance
    if (projectStatus === ProjectStatus.Failed || projectStatus === ProjectStatus.Refundable) {
      return {
        tokensForSale,
        tokensAllocated: 0n, // No tokens were allocated since project failed
        unsoldTokensAmount: tokensForSale, // All tokens are unsold
      }
    }

    // For successful projects (reached soft cap), calculate actual allocation
    // Get decimals from project data (assuming you have these fields)
    // If not available, default to 18 for both
    const contributionDecimals = project.contributionTokenDecimals ?? 18
    const projectDecimals = 18

    // Calculate tokens allocated using the same logic as the contract
    const tokensAllocated = calculateTokensAllocated(
      project.totalRaised,
      project.tokenPrice,
      contributionDecimals,
      projectDecimals
    )
    
    // Unsold = tokens for sale - tokens allocated
    const unsoldTokensAmount = tokensForSale > tokensAllocated 
      ? tokensForSale - tokensAllocated 
      : 0n

    return {
      tokensForSale,
      tokensAllocated,
      unsoldTokensAmount,
    }
  }, [project])

  // Check if withdrawal delay has passed using blockchain time
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
      // Capture the amount RIGHT BEFORE withdrawal in a ref
      withdrawnAmountRef.current = tokenInfo.unsoldTokensAmount
      
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
  }, [writeContract, isConnected, isProjectOwner, project, onSuccess, onError, showToast, txHash, isWithdrawalUnlocked, withdrawalUnlocksAt, canWithdrawByStatus, tokenInfo.unsoldTokensAmount])

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
        withdrawnAmountRef.current = 0n
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
    withdrawnAmountRef.current = 0n
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
    
    // Withdrawn amount (captured before withdrawal and persisted in ref)
    withdrawnAmount: withdrawnAmountRef.current,
    
    // Actions
    reset,
    closeModal,
    explorerUrl: EXPLORER_URL,
    buttonState,
    transactionType: 'withdraw' as const,
  }
}