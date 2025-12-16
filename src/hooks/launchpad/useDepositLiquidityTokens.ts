// src/hooks/projects/useDepositLiquidityTokens.ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { formatUnits } from 'viem'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS, EXPLORER_URL } from '@/config/contracts'
import type { Hash, Address } from 'viem'
import type { ProjectDisplayData } from '@/types/project'
import { useTokenApproval } from '../utilities/useTokenApproval'
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

interface LiquidityDepositInfo {
  required: bigint
  deposited: bigint
  remaining: bigint
  progressPercentage: number
  isComplete: boolean
  formattedRequired: string
  formattedDeposited: string
  formattedRemaining: string
}

interface UseDepositLiquidityTokensOptions {
  project?: ProjectDisplayData
  liquidityTokenAddress?: Address
  amount?: bigint
  onSuccess?: (hash?: Hash) => void
  onConfirmed?: (hash?: Hash) => void
  onError?: (err: Error) => void
  showToast?: boolean
}

export function useDepositLiquidityTokens(options: UseDepositLiquidityTokensOptions = {}) {
  const { 
    project,
    liquidityTokenAddress: externalTokenAddress, 
    amount: externalAmount, 
    onSuccess, 
    onConfirmed, 
    onError, 
    showToast = true 
  } = options

  // Determine token address: project token takes priority over external
  const liquidityTokenAddress = useMemo(() => {
    return project?.projectToken ?? externalTokenAddress
  }, [project?.projectToken, externalTokenAddress])

  // Token decimals from project or default
  const tokenDecimals = useMemo(() => {
    return project?.tokenDecimals ?? 18
  }, [project?.tokenDecimals])

  // 🆕 Calculate liquidity deposit information
  const liquidityInfo: LiquidityDepositInfo = useMemo(() => {
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

    const required = project.requiredLiquidityTokens
    const deposited = project.depositedLiquidityTokens
    const remaining = required > deposited ? required - deposited : BigInt(0)
    const progressPercentage = required > 0 
      ? Math.min(100, Number((deposited * BigInt(100)) / required))
      : 0
    const isComplete = deposited >= required

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

  // Calculate amount for approval - use external amount if provided, otherwise use pending deposit amount
  const amountForApproval = useMemo(() => {
    if (externalAmount) return externalAmount
    if (pendingDeposit) return pendingDeposit.amount
    return BigInt(0)
  }, [externalAmount, pendingDeposit])

  logger.info('💰 Amount for approval updated:', {
    amountForApproval: amountForApproval.toString(),
    pendingDeposit: pendingDeposit ? `${pendingDeposit.projectId}:${pendingDeposit.amount}` : 'none',
    externalAmount: externalAmount?.toString() ?? 'none'
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
    tokenAddress: liquidityTokenAddress,
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
    if (isApprovalSuccess && pendingDeposit && step === 'approving') {
      const { projectId, amount } = pendingDeposit
      
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
  }, [isApprovalSuccess, pendingDeposit, step, showToast])

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
          ? 'Approving liquidity tokens...'
          : step === 'submitting'
          ? 'Submitting deposit transaction...'
          : step === 'confirming'
          ? 'Waiting for blockchain confirmation...'
          : step === 'confirmed'
          ? 'Liquidity deposited successfully'
          : step === 'error'
          ? txError?.message ?? 'Transaction failed'
          : undefined,
    }
  }, [showStatus, txHash, step, wagmiIsPending, isConfirming, isConfirmed, wagmiIsError, receiptError, txError, wagmiError])

  // 🆕 Enhanced button state with deposit completion check
  const buttonState: ButtonState = useMemo(() => {
    // Check if deposit is complete
    if (liquidityInfo.isComplete) {
      return { text: 'Liquidity Deposited', disabled: true, loading: false }
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
        if (needsApproval && liquidityTokenAddress) {
          return { text: 'Approve & Deposit', disabled: false, loading: false }
        }
        return { text: 'Deposit Liquidity', disabled: false, loading: false }
    }
  }, [step, needsApproval, liquidityTokenAddress, approvalWriteState?.isPending, isApprovalConfirming, liquidityInfo.isComplete])

  // Execute deposit only (after approval if needed)
  const executeDepositOnly = useCallback(
    async (projectId: bigint, amount: bigint) => {
      setStep('submitting')

      try {
        await writeContract({
          address: EXHIBITION_ADDRESS,
          abi: exhibitionAbi,
          functionName: 'depositLiquidityTokens',
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

      logger.info('🚀 executeDeposit called', { 
        projectId: projectId.toString(), 
        amount: amount.toString(),
        needsApproval,
        currentAllowance: currentAllowance?.toString(),
        liquidityInfo: {
          required: liquidityInfo.required.toString(),
          deposited: liquidityInfo.deposited.toString(),
          remaining: liquidityInfo.remaining.toString(),
          isComplete: liquidityInfo.isComplete,
        }
      })

      // 🆕 Validate deposit not already complete
      if (liquidityInfo.isComplete) {
        const error = new Error('Liquidity deposit already complete')
        setTxError(error)
        setStep('error')
        if (showToast) {
          toast.error('Liquidity has already been fully deposited')
        }
        onError?.(error)
        return Promise.reject(error)
      }

      // 🆕 Validate amount doesn't exceed remaining
      // Allow a small tolerance for rounding errors (0.01%)
      const maxAllowedAmount = liquidityInfo.remaining + (liquidityInfo.remaining / BigInt(10000))
      
      if (amount > maxAllowedAmount) {
        const error = new Error(`Amount exceeds remaining liquidity needed (${liquidityInfo.formattedRemaining} ${project?.tokenSymbol ?? 'tokens'})`)
        setTxError(error)
        setStep('error')
        if (showToast) {
          toast.error(error.message)
        }
        onError?.(error)
        return Promise.reject(error)
      }

      // If amount is slightly over the exact remaining, cap it to remaining
      const depositAmount = amount > liquidityInfo.remaining ? liquidityInfo.remaining : amount

      try {
        if (!liquidityTokenAddress) {
          setTransactionType('deposit')
          await executeDepositOnly(projectId, depositAmount)
          return
        }

        // 🔥 KEY FIX: Set pendingDeposit BEFORE checking approval
        // This ensures amountForApproval updates before submitApproval is called
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
            // 🔥 KEY FIX: Pass amount directly to submitApproval
            const approvalTxHash = await submitApproval(depositAmount)
            
            if (approvalTxHash) {
              setApprovalHash(approvalTxHash)
              logger.info('✅ Approval hash received:', approvalTxHash)
            }
            // Note: Don't clear pendingDeposit here - the useEffect watching 
            // isApprovalSuccess will handle the deposit execution and cleanup
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
            
            // Only clear pendingDeposit after error handling is complete
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
    [liquidityTokenAddress, needsApproval, currentAllowance, submitApproval, executeDepositOnly, showToast, onError, liquidityInfo, project, amountForApproval, pendingDeposit]
  )

  // React to wagmi-provided hash (transaction submitted)
  useEffect(() => {
    if (!hash) return

    logger.info('🟡 Transaction submitted, setting step to confirming')
    setTxHash(hash as Hash)
    setStep('confirming')
    setShowStatus(true)

    if (showToast) {
      toast.dismiss()
      toast.loading('Transaction submitted — awaiting confirmation')
    }
  }, [hash, showToast])

  // React to receipt confirmation (transition: confirming → confirmed)
  useEffect(() => {
    if (isConfirmed && step === 'confirming') {
      logger.info('✅ Deposit confirmed, setting step to confirmed')
      setStep('confirmed')
      setShowStatus(true)

      if (showToast) {
        toast.dismiss()
        toast.success('Liquidity deposited successfully')
      }

      onConfirmed?.(txHash)
    }
  }, [isConfirmed, step, txHash, showToast, onConfirmed])

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
    if (step === 'confirmed' || (isApprovalSuccess && !pendingDeposit)) {
      logger.info('⏱️ Starting auto-close timer (10s)')
      const t = setTimeout(() => {
        logger.info('⏱️ Auto-closing modal and resetting state')
        setShowStatus(false)
        setApprovalHash(undefined)
        setTransactionType(null)
        setStep('idle')
      }, 10_000)
      return () => {
        logger.info('⏱️ Cleanup: clearing auto-close timer')
        clearTimeout(t)
      }
    }
    
    // ✅ Also auto-close on error after 10 seconds
    if (step === 'error') {
      logger.info('⏱️ Starting error auto-close timer (10s)')
      const t = setTimeout(() => {
        logger.info('⏱️ Auto-closing error modal and resetting state')
        setShowStatus(false)
        setApprovalHash(undefined)
        setTransactionType(null)
        setStep('idle')
      }, 10_000)
      return () => {
        logger.info('⏱️ Cleanup: clearing error auto-close timer')
        clearTimeout(t)
      }
    }
    
    return
  }, [step, isApprovalSuccess, pendingDeposit])

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
  }, [showToast])

  // ✅ Close handler for modal - ensures proper cleanup without showing new toasts
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
    }, 100)

    return () => clearTimeout(cleanup)
  }, [])

  return {
    // 🆕 Liquidity deposit information
    liquidityInfo,

    // Main action
    executeDeposit,
    depositLiquidity: executeDeposit,

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
    closeModal, // ✅ New: Use this to close the modal properly
    explorerUrl: EXPLORER_URL,
  }
}