// src/hooks/projects/useContributrToProject
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useBalance } from 'wagmi'
import { formatUnits, parseUnits } from 'viem'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS, EXPLORER_URL } from '@/config/contracts'
import type { Hash, Address } from 'viem'
import type { ProjectDisplayData, UserProjectSummary } from '@/types/project'
import { useTokenApproval } from '../useTokenApproval'

type Step = 'idle' | 'approving' | 'submitting' | 'confirming' | 'confirmed' | 'error'

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

interface UseContributeOptions {
  project?: ProjectDisplayData
  userSummary?: UserProjectSummary
  amount?: bigint
  onSuccess?: (hash?: Hash) => void
  onConfirmed?: (hash?: Hash) => void
  onError?: (err: Error) => void
  showToast?: boolean
}

export function useContributeToProject(options: UseContributeOptions = {}) {
  const { 
    project,
    userSummary,
    amount: externalAmount, 
    onSuccess, 
    onConfirmed, 
    onError, 
    showToast = true 
  } = options

  const { address, isConnected } = useAccount()

  const contribTokenAddr = useMemo(() => project?.contributionTokenAddress, [project?.contributionTokenAddress]) as Address | undefined
  const contribDecimals = useMemo(() => project?.contributionTokenDecimals ?? 18, [project?.contributionTokenDecimals])
  const tokenDecimals = useMemo(() => project?.tokenDecimals ?? 18, [project?.tokenDecimals])
  const tokenPrice = useMemo(() => project?.tokenPrice ?? BigInt(1), [project?.tokenPrice])

  const { data: balanceData } = useBalance({ address, token: contribTokenAddr })
  const balanceBigInt = balanceData?.value ?? BigInt(0)
  const balance = formatUnits(balanceBigInt, contribDecimals)

  const [contributionAmount, setContributionAmount] = useState('')

  const inputAmountBigInt = contributionAmount ? parseUnits(contributionAmount, contribDecimals) : BigInt(0)
  const tokenAmountDue = useMemo(() => {
    if (inputAmountBigInt <= BigInt(0) || !tokenPrice) return BigInt(0)
  
    // Scale up contribution amount to match token decimals, then divide by price
    const scaleFactor = BigInt(10 ** (tokenDecimals - contribDecimals))
    const tokensDue = (inputAmountBigInt * scaleFactor * BigInt(10 ** tokenDecimals)) / tokenPrice
  
    return tokensDue
  }, [inputAmountBigInt, tokenPrice, tokenDecimals, contribDecimals])

  const goalRemaining = (project?.fundingGoal ?? BigInt(0)) - (project?.totalRaised ?? BigInt(0))
  const userRemaining = (project?.maxContribution ?? BigInt(0)) - (userSummary?.contributionAmount ?? BigInt(0))
  const globalCap = goalRemaining < userRemaining ? goalRemaining : userRemaining

  const canContribute = project?.canContribute ?? false

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
  const [transactionType, setTransactionType] = useState<'approval' | 'contribute' | null>(null)
  const [pendingContrib, setPendingContrib] = useState<{ amount: bigint } | null>(null)
  const [hasProcessedApproval, setHasProcessedApproval] = useState(false)
  const [inputError, setInputError] = useState<string | null>(null)

  // 🔥 FIX: Use refs to track if toasts have been shown
  const hasShownApprovalToast = useRef(false)
  const hasShownContributeToast = useRef(false)
  const hasShownConfirmedToast = useRef(false)

  const amountForApproval = useMemo(() => {
    if (!showStatus || step === 'idle') return BigInt(0)
    return externalAmount ?? pendingContrib?.amount ?? BigInt(0)
  }, [externalAmount, pendingContrib, showStatus, step])

  const {
    needsApproval,
    isConfirming: isApprovalConfirming,
    isApproved: isApprovalSuccess,
    submitApproval,
    writeState: approvalWriteState,
  } = useTokenApproval({
    tokenAddress: contribTokenAddr,
    spenderAddress: EXHIBITION_ADDRESS,
    requiredAmount: amountForApproval,
  })

  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()

  useEffect(() => {
    if (approvalWriteState?.data && !approvalHash) {
      setApprovalHash(approvalWriteState.data)
    }
  }, [approvalWriteState?.data, approvalHash])

  // 🔥 FIX: Only show approval success toast ONCE
  useEffect(() => {
    if (!showStatus || hasProcessedApproval || hasShownApprovalToast.current) return
    if (isApprovalSuccess && pendingContrib && step === 'approving') {
      setHasProcessedApproval(true)
      setTransactionType('contribute')
      
      // ✅ TOAST 
      if (showToast) {
        toast.dismiss()
        toast.success('Approval confirmed! Now contributing...')
        hasShownApprovalToast.current = true
      }
      
      executeContributeOnly(pendingContrib.amount)
        .then(() => setPendingContrib(null))
        .catch(() => setPendingContrib(null))
    }
  }, [isApprovalSuccess, pendingContrib, step, showToast, showStatus, hasProcessedApproval])

  const transactionStatus: TxStatus = useMemo(() => ({
    show: showStatus,
    hash: txHash as `0x${string}` | undefined,
    isPending: step === 'submitting' || wagmiIsPending,
    isConfirming: step === 'confirming' || isConfirming,
    isSuccess: step === 'confirmed' || isConfirmed,
    isError: step === 'error' || wagmiIsError || Boolean(receiptError),
    error: txError ?? (wagmiError as Error | undefined) ?? null,
    message:
      step === 'approving' ? 'Approving tokens...' :
      step === 'submitting' ? 'Submitting contribution...' :
      step === 'confirming' ? 'Waiting for confirmation...' :
      step === 'confirmed' ? 'Contributed successfully' :
      step === 'error' ? txError?.message ?? 'Transaction failed' : undefined,
  }), [showStatus, txHash, step, wagmiIsPending, isConfirming, isConfirmed, wagmiIsError, receiptError, txError, wagmiError])

  const isLoading = step === 'approving' || step === 'submitting' || step === 'confirming' || wagmiIsPending || isConfirming

  const validateAmount = (amount: bigint) => {
    if (amount < (project?.minContribution ?? BigInt(0))) return 'Below min contribution'
    if (amount > balanceBigInt) return 'Exceeds balance'
    if (amount > globalCap) return 'Exceeds cap or goal'
    return null
  }

  const onContributionChange = (val: string) => {
    setContributionAmount(val)
    setInputError(null)
    if (!val || val === '0') return
    try {
      const amt = parseUnits(val, contribDecimals)
      const err = validateAmount(amt)
      if (err) setInputError(err)
    } catch {
      setInputError('Invalid amount')
    }
  }

  const onSetMaxBalance = () => {
    const max = globalCap < balanceBigInt ? globalCap : balanceBigInt
    setContributionAmount(formatUnits(max, contribDecimals))
    setInputError(null)
  }

  const onApprovalComplete = () => {}

  const executeContributeOnly = useCallback(async (amount: bigint) => {
    setStep('submitting')
    try {
      await writeContract({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'contribute',
        args: [project!.id, amount],
      })
      
      // 🔥 FIX: Only show toast once
      if (showToast && !hasShownContributeToast.current) {
        toast.loading('Contribution submitted — confirm in wallet')
        hasShownContributeToast.current = true
      }
      
      onSuccess?.(txHash)
      setStep('confirming')
    } catch (err) {
      const e = err as Error
      setTxError(e)
      setStep('error')
      if (showToast) toast.error(e.message || 'Failed')
      onError?.(e)
    }
  }, [writeContract, onSuccess, onError, showToast, txHash, project])

  const executeContribute = useCallback(async (amount: bigint) => {
    setTxError(null)
    setTxHash(undefined)
    setShowStatus(true)
    setStep('idle')
    setHasProcessedApproval(false)
    
    // 🔥 FIX: Reset toast flags
    hasShownApprovalToast.current = false
    hasShownContributeToast.current = false
    hasShownConfirmedToast.current = false

    const validationError = validateAmount(amount)
    if (validationError) {
      setTxError(new Error(validationError))
      setStep('error')
      if (showToast) toast.error(validationError)
      onError?.(new Error(validationError))
      return
    }

    setPendingContrib({ amount })

    try {
      if (needsApproval && contribTokenAddr) {
        setTransactionType('approval')
        setStep('approving')
        if (showToast) toast.loading('Requesting approval...')
        await new Promise(r => setTimeout(r, 100))
        const approvalTx = await submitApproval(amount)
        if (approvalTx) setApprovalHash(approvalTx)
      } else {
        setTransactionType('contribute')
        setPendingContrib(null)
        await executeContributeOnly(amount)
      }
    } catch (err) {
      const e = err as Error
      setTxError(e)
      setStep('error')
      if (showToast) toast.error(e.message)
      onError?.(e)
      setPendingContrib(null)
    }
  }, [needsApproval, contribTokenAddr, submitApproval, executeContributeOnly, showToast, onError, project?.minContribution, balanceBigInt, globalCap])

  const onContribute = async () => {
    if (inputError || !contributionAmount) return
    const amount = parseUnits(contributionAmount, contribDecimals)
    await executeContribute(amount)
    setContributionAmount('')
  }

  // 🔥 FIX: Removed duplicate toast from hash useEffect
  useEffect(() => { 
    if (hash) { 
      setTxHash(hash)
      setStep('confirming')
      // Toast already shown in executeContributeOnly
    } 
  }, [hash])

  // 🔥 FIX: Only show confirmed toast once
  useEffect(() => { 
    if (isConfirmed && step === 'confirming' && !hasShownConfirmedToast.current) { 
      setStep('confirmed')
      if (showToast) {
        toast.success('Contributed')
        hasShownConfirmedToast.current = true
      }
      onConfirmed?.(txHash)
    } 
  }, [isConfirmed, step, txHash, onConfirmed, showToast])

  useEffect(() => { 
    if (receiptError || wagmiIsError) { 
      setTxError(wagmiError)
      setStep('error')
      if (showToast) toast.error('Failed')
    } 
  }, [receiptError, wagmiIsError, wagmiError, showToast])

  useEffect(() => {
    if (!showStatus) return
    if (step === 'confirmed' || step === 'error') {
      const t = setTimeout(() => {
        setShowStatus(false)
        setApprovalHash(undefined)
        setTransactionType(null)
        setStep('idle')
        setTxHash(undefined)
        setTxError(null)
        setPendingContrib(null)
        setHasProcessedApproval(false)
        // Reset toast flags
        hasShownApprovalToast.current = false
        hasShownContributeToast.current = false
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
    setTransactionType(null)
    setApprovalHash(undefined)
    setPendingContrib(null)
    setHasProcessedApproval(false)
    // Reset toast flags
    hasShownApprovalToast.current = false
    hasShownContributeToast.current = false
    hasShownConfirmedToast.current = false
  }, [showToast])

  const closeModal = useCallback(() => {
    toast.dismiss()
    setShowStatus(false)
    setTimeout(() => reset(), 100)
  }, [reset])

  const buttonState: ButtonState = useMemo(() => {
    if (!canContribute) return { text: 'Not Available', disabled: true, loading: false }
    switch (step) {
      case 'approving':
        return { text: approvalWriteState?.isPending ? 'Submitting Approval...' : (isApprovalConfirming ? 'Confirming Approval...' : 'Approving...'), disabled: true, loading: true }
      case 'submitting':
        return { text: 'Submitting...', disabled: true, loading: true }
      case 'confirming':
        return { text: 'Confirming...', disabled: true, loading: true }
      case 'confirmed':
        return { text: 'Contributed', disabled: true, loading: false }
      case 'error':
        return { text: 'Retry', disabled: false, loading: false }
      default:
        return { text: needsApproval ? 'Approve & Contribute' : 'Contribute', disabled: !!inputError || !contributionAmount, loading: false }
    }
  }, [step, canContribute, needsApproval, approvalWriteState?.isPending, isApprovalConfirming, inputError, contributionAmount])

  return {
    contributionAmount,
    tokenAmountDue,
    balance,
    balanceBigInt,
    contributionTokenSymbol: project?.contributionTokenSymbol ?? 'TOKEN',
    contributionTokenDecimals: contribDecimals,
    isConnected,
    canContribute,
    isLoading,
    onSetMaxBalance,
    onContributionChange,
    onContribute,
    onApprovalComplete,
    transactionStatus,
    transactionType,
    approvalHash,
    isApprovalConfirming,
    isApprovalSuccess,
    approvalWriteState,
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
    inputAmountBigInt,
  }
}