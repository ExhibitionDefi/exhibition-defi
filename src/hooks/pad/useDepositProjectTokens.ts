// src/hooks/projects/useDepositProjectTokens.ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS, EXPLORER_URL } from '@/config/contracts'
import type { Hash, Address } from 'viem'
import type { ProjectDisplayData } from '@/types/project'
import { useTokenApproval } from '../useTokenApproval'
import { logger } from '@/utils/logger'

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

interface ProjectTokenDepositInfo {
  required: bigint
  deposited: bigint
  remaining: bigint
  progressPercentage: number
  isComplete: boolean
  formattedRequired: string
  formattedDeposited: string
  formattedRemaining: string
}

interface UseDepositProjectTokensOptions {
  project?: ProjectDisplayData
  projectTokenAddress?: Address
  amount?: bigint
  onSuccess?: (hash?: Hash) => void
  onConfirmed?: (hash?: Hash) => void
  onError?: (err: Error) => void
  showToast?: boolean
}

export function useDepositProjectTokens(options: UseDepositProjectTokensOptions = {}) {
  const { 
    project,
    projectTokenAddress: externalTokenAddress, 
    amount: externalAmount, 
    onSuccess, 
    onConfirmed, 
    onError, 
    showToast = true 
  } = options

  // Determine token address: project token takes priority over external
  const projectTokenAddress = useMemo(() => {
    return project?.projectToken ?? externalTokenAddress
  }, [project?.projectToken, externalTokenAddress])

  // Token decimals from project or default
  const tokenDecimals = useMemo(() => {
    return project?.tokenDecimals ?? 18
  }, [project?.tokenDecimals])

  // Calculate project token deposit information using canContribute flag
  const projectTokenInfo: ProjectTokenDepositInfo = useMemo(() => {
    if (!project) {
      return {
        required: BigInt(0),
        deposited: BigInt(0),
        remaining: BigInt(0),
        progressPercentage: 0,
        isComplete: false,
        formattedRequired: '0',
        formattedDeposited: '0',
        formattedRemaining: '0',
      }
    }

    const required = project.amountTokensForSale
    
    // canContribute = false means tokens NOT deposited
    // canContribute = true means tokens ARE deposited
    const deposited = project.canContribute ? required : BigInt(0)
    const remaining = project.canContribute ? BigInt(0) : required
    const progressPercentage = project.canContribute ? 100 : 0
    const isComplete = project.canContribute

    return {
      required,
      deposited,
      remaining,
      progressPercentage,
      isComplete,
      formattedRequired: formatUnits(required, tokenDecimals),
      formattedDeposited: formatUnits(deposited, tokenDecimals),
      formattedRemaining: formatUnits(remaining, tokenDecimals),
    }
  }, [project, tokenDecimals])

  // Wagmi write hook for deposit
  const {
    writeContract,
    data: hash,
    isPending: wagmiIsPending,
    isError: wagmiIsError,
    error: wagmiError,
  } = useWriteContract()

  // Wait for confirmation
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
  const [transactionType, setTransactionType] = useState<'approval' | 'deposit' | null>(null)
  const [pendingDeposit, setPendingDeposit] = useState<{ projectId: bigint; amount: bigint } | null>(null)
  const [hasProcessedApproval, setHasProcessedApproval] = useState(false)

  // Calculate amount for approval - only when we have an active transaction
  const amountForApproval = useMemo(() => {
    // Don't update amount if modal is closed or we're in idle state
    if (!showStatus || step === 'idle') return BigInt(0)
    
    if (externalAmount) return externalAmount
    if (pendingDeposit) return pendingDeposit.amount
    return BigInt(0)
  }, [externalAmount, pendingDeposit, showStatus, step])

  logger.info('💰 Amount for approval updated:', {
    amountForApproval: amountForApproval.toString(),
    pendingDeposit: pendingDeposit ? `${pendingDeposit.projectId}:${pendingDeposit.amount}` : 'none',
    externalAmount: externalAmount?.toString() ?? 'none',
    showStatus,
    step
  })

  // Token approval hook
  const {
    allowance: currentAllowance,
    needsApproval,
    isConfirming: isApprovalConfirming,
    isApproved: isApprovalSuccess,
    submitApproval,
    writeState: approvalWriteState,
  } = useTokenApproval({
    tokenAddress: projectTokenAddress,
    spenderAddress: EXHIBITION_ADDRESS,
    requiredAmount: amountForApproval,
  })

  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>()

  // Sync approval hash from writeState
  useEffect(() => {
    if (approvalWriteState?.data && !approvalHash) {
      setApprovalHash(approvalWriteState.data)
    }
  }, [approvalWriteState?.data, approvalHash])

  // Watch for approval success and execute pending deposit
  useEffect(() => {
    // Don't process if modal is closed or already processed
    if (!showStatus || hasProcessedApproval) return
    
    if (isApprovalSuccess && pendingDeposit && step === 'approving') {
      const { projectId, amount } = pendingDeposit
      
      setHasProcessedApproval(true) // Mark as processed
      setTransactionType('deposit')
      
      if (showToast) {
        toast.dismiss()
        toast.success('Approval confirmed! Now depositing...')
      }

      executeDepositOnly(projectId, amount)
        .then(() => {
          setPendingDeposit(null)
        })
        .catch(() => {
          setPendingDeposit(null)
        })
    }
  }, [isApprovalSuccess, pendingDeposit, step, showToast, showStatus, hasProcessedApproval])

  // Compose transactionStatus object for MultiTransactionModal
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
        step === 'approving'
          ? 'Approving project tokens...'
          : step === 'submitting'
          ? 'Submitting deposit transaction...'
          : step === 'confirming'
          ? 'Waiting for blockchain confirmation...'
          : step === 'confirmed'
          ? 'Project tokens deposited successfully'
          : step === 'error'
          ? txError?.message ?? 'Transaction failed'
          : undefined,
    }
  }, [showStatus, txHash, step, wagmiIsPending, isConfirming, isConfirmed, wagmiIsError, receiptError, txError, wagmiError])

  // Enhanced button state with deposit completion check
  const buttonState: ButtonState = useMemo(() => {
    // Check if deposit is complete
    if (projectTokenInfo.isComplete) {
      return { text: 'Tokens Deposited', disabled: true, loading: false }
    }

    switch (step) {
      case 'approving':
        return { 
          text: approvalWriteState?.isPending ? 'Submitting Approval...' : (isApprovalConfirming ? 'Confirming Approval...' : 'Approving...'),
          disabled: true, 
          loading: true 
        }
      case 'submitting':
        return { text: 'Submitting...', disabled: true, loading: true }
      case 'confirming':
        return { text: 'Confirming...', disabled: true, loading: true }
      case 'confirmed':
        return { text: 'Deposited', disabled: true, loading: false }
      case 'error':
        return { text: 'Retry Deposit', disabled: false, loading: false }
      default:
        if (needsApproval && projectTokenAddress) {
          return { text: 'Approve & Deposit', disabled: false, loading: false }
        }
        return { text: 'Deposit Tokens', disabled: false, loading: false }
    }
  }, [step, needsApproval, projectTokenAddress, approvalWriteState?.isPending, isApprovalConfirming, projectTokenInfo.isComplete])

  // Execute deposit only (after approval if needed)
  const executeDepositOnly = useCallback(
    async (projectId: bigint, amount: bigint) => {
      setStep('submitting')

      try {
        await writeContract({
          address: EXHIBITION_ADDRESS,
          abi: exhibitionAbi,
          functionName: 'depositProjectTokens',
          args: [projectId, amount],
        })

        if (showToast) {
          toast.dismiss()
          toast.loading('Deposit transaction submitted — confirm in wallet')
        }

        onSuccess?.(txHash)
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

  // Main execute function with approval flow
  const executeDeposit = useCallback(
    async (projectId: bigint, amount: bigint) => {
      // Reset state
      setTxError(null)
      setTxHash(undefined)
      setShowStatus(true)
      setStep('idle')
      setHasProcessedApproval(false) // Reset approval processing flag

      logger.info('🚀 executeDeposit called', { 
        projectId: projectId.toString(), 
        amount: amount.toString(),
        needsApproval,
        currentAllowance: currentAllowance?.toString(),
        projectTokenInfo: {
          required: projectTokenInfo.required.toString(),
          deposited: projectTokenInfo.deposited.toString(),
          remaining: projectTokenInfo.remaining.toString(),
          isComplete: projectTokenInfo.isComplete,
        }
      })

      // Validate deposit not already complete
      if (projectTokenInfo.isComplete) {
        const error = new Error('Project token deposit already complete')
        setTxError(error)
        setStep('error')
        if (showToast) {
          toast.error('Project tokens have already been fully deposited')
        }
        onError?.(error)
        return Promise.reject(error)
      }

      // For new deposits, the amount should equal the required amount
      // since canContribute=false means 0 deposited, canContribute=true means fully deposited
      if (amount !== projectTokenInfo.required) {
        const error = new Error(`Please deposit the full amount required: ${projectTokenInfo.formattedRequired} ${project?.tokenSymbol ?? 'tokens'}`)
        setTxError(error)
        setStep('error')
        if (showToast) {
          toast.error(error.message)
        }
        onError?.(error)
        return Promise.reject(error)
      }

      const depositAmount = amount

      try {
        if (!projectTokenAddress) {
          setTransactionType('deposit')
          await executeDepositOnly(projectId, depositAmount)
          return
        }

        // Set pendingDeposit BEFORE checking approval
        setPendingDeposit({ projectId, amount: depositAmount })

        const currentAllowanceValue = currentAllowance ?? BigInt(0)
        const needsApprovalNow = depositAmount > currentAllowanceValue

        logger.info('🔍 Direct approval check:', {
          amount: depositAmount.toString(),
          currentAllowance: currentAllowanceValue.toString(),
          needsApprovalNow,
        })

        if (needsApprovalNow) {
          setTransactionType('approval')
          setStep('approving')

          if (showToast) {
            toast.dismiss()
            toast.loading('Requesting approval...')
          }

          logger.info('📝 Initiating approval flow - waiting for state to propagate...')

          // Wait for React to process state updates
          await new Promise(resolve => setTimeout(resolve, 100))

          logger.info('📝 Submitting approval with explicit amount')

          try {
            const approvalTxHash = await submitApproval(depositAmount)
            
            if (approvalTxHash) {
              setApprovalHash(approvalTxHash)
              logger.info('✅ Approval hash received:', approvalTxHash)
            }
          } catch (approvalErr) {
            const e = approvalErr as Error
            logger.error('❌ Approval error:', e)
            setTxError(e)
            setStep('error')
            setShowStatus(true)
            
            const errorMessage = e.message || 'Approval failed'
            const isUserRejection = errorMessage.toLowerCase().includes('user rejected') || 
                                   errorMessage.toLowerCase().includes('user denied')

            if (showToast) {
              toast.dismiss()
              toast.error(isUserRejection ? 'Approval was rejected' : errorMessage)
            }
            
            setPendingDeposit(null)
            onError?.(e)
            return Promise.reject(e)
          }
        } else {
          logger.info('✅ Sufficient allowance, proceeding to deposit')
          setTransactionType('deposit')
          setPendingDeposit(null)
          await executeDepositOnly(projectId, depositAmount)
        }
      } catch (err) {
        const e = err as Error
        setTxError(e)
        setStep('error')
        setShowStatus(true)
        setPendingDeposit(null)
        
        const errorMessage = e.message || 'Transaction failed'
        const isUserRejection = errorMessage.toLowerCase().includes('user rejected') || 
                               errorMessage.toLowerCase().includes('user denied')

        if (showToast) {
          toast.dismiss()
          toast.error(isUserRejection ? 'Transaction was rejected' : errorMessage)
        }
        
        onError?.(e)
        return Promise.reject(e)
      }
    },
    [projectTokenAddress, needsApproval, currentAllowance, submitApproval, executeDepositOnly, showToast, onError, projectTokenInfo, project, amountForApproval, pendingDeposit]
  )

  // React to wagmi-provided hash (transaction submitted)
  useEffect(() => {
    if (!hash) return
    setTxHash(hash as Hash)
    setStep('confirming')
    setShowStatus(true)

    if (showToast) {
      toast.dismiss()
      toast.loading('Transaction submitted — awaiting confirmation')
    }
  }, [hash, showToast])

  // React to receipt confirmation
  useEffect(() => {
    if (isConfirmed && step === 'confirming') {
      logger.info('✅ Deposit confirmed, setting step to confirmed')
      setStep('confirmed')
      setShowStatus(true)
      toast.dismiss()
      toast.success('Project tokens deposited successfully')
      onConfirmed?.(txHash)
    }
  }, [isConfirmed, step, txHash, onConfirmed])

  // Handle receipt / wagmi errors
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
  }, [receiptError, wagmiIsError, wagmiError, showToast, onError])

  // Auto-reset UX after success/error
  useEffect(() => {
    // Only run auto-close when modal is showing and in terminal state
    if (!showStatus) return

    if (step === 'confirmed') {
      logger.info('⏱️ Starting auto-close timer (10s)')
      const t = setTimeout(() => {
        logger.info('⏱️ Auto-closing modal and resetting all state')
        setShowStatus(false)
        setApprovalHash(undefined)
        setTransactionType(null)
        setStep('idle')
        setTxHash(undefined)
        setTxError(null)
        setPendingDeposit(null)
        setHasProcessedApproval(false)
      }, 10_000)
      return () => {
        logger.info('⏱️ Cleanup: clearing auto-close timer')
        clearTimeout(t)
      }
    }
    
    if (step === 'error') {
      logger.info('⏱️ Starting error auto-close timer (10s)')
      const t = setTimeout(() => {
        logger.info('⏱️ Auto-closing error modal and resetting all state')
        setShowStatus(false)
        setApprovalHash(undefined)
        setTransactionType(null)
        setStep('idle')
        setTxHash(undefined)
        setTxError(null)
        setPendingDeposit(null)
        setHasProcessedApproval(false)
      }, 10_000)
      return () => {
        logger.info('⏱️ Cleanup: clearing error auto-close timer')
        clearTimeout(t)
      }
    }
  }, [step, showStatus])

  // Manual reset util
  const reset = useCallback(() => {
    if (showToast) {
      toast.dismiss()
    }
    setStep('idle')
    setTxHash(undefined)
    setTxError(null)
    setShowStatus(false)
    setTransactionType(null)
    setApprovalHash(undefined)
    setPendingDeposit(null)
    setHasProcessedApproval(false)
  }, [showToast])

  // Close handler for modal - ensures proper cleanup without showing new toasts
  const closeModal = useCallback(() => {
    // Dismiss toasts first
    toast.dismiss()
    
    // Immediately close the modal
    setShowStatus(false)
    
    // Reset state after modal closes to prevent re-triggering effects
    const cleanup = setTimeout(() => {
      setStep('idle')
      setTxHash(undefined)
      setTxError(null)
      setTransactionType(null)
      setApprovalHash(undefined)
      setPendingDeposit(null)
      setHasProcessedApproval(false)
    }, 100)

    return () => clearTimeout(cleanup)
  }, [])

  return {
    // Project token deposit information
    projectTokenInfo,

    // Main action
    executeDeposit,
    depositProjectTokens: executeDeposit,

    // Button state for UI
    buttonState,

    // Transaction status for MultiTransactionModal
    transactionStatus,

    // Transaction type tracking
    transactionType,

    // Approval states
    approvalHash,
    isApprovalConfirming,
    isApprovalSuccess,
    approvalWriteState,
    needsApproval,
    currentAllowance,

    // Raw deposit transaction fields
    hash: txHash,
    isPending: step === 'submitting' || wagmiIsPending,
    isConfirming: step === 'confirming' || isConfirming,
    isConfirmed: step === 'confirmed' || isConfirmed,
    isError: step === 'error' || wagmiIsError || Boolean(receiptError),
    error: txError ?? (wagmiError as Error | undefined) ?? null,
    isLoading: step === 'submitting' || step === 'confirming' || step === 'approving' || wagmiIsPending,

    // Utilities
    reset,
    closeModal,
    explorerUrl: EXPLORER_URL,
  }
}