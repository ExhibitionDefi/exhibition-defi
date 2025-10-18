import React from 'react'
import { ExternalLink, X } from 'lucide-react'
import { AMMFormatters } from '@/utils/ammFormatters'
import { useAccount, useSignMessage } from 'wagmi'

export type TransactionType = 
  | 'approval' 
  | 'swap' 
  | 'contribute' 
  | 'claim' 
  | 'refund' 
  | 'withdraw' 
  | 'finalize'
  | 'cancel'
  | 'deposit'
  | 'create'
  | 'request'
  | 'verify-wallet'
  | 'adding'
  | null

const TRANSACTION_TITLES: Record<Exclude<TransactionType, null>, string> = {
  approval: 'Approving Token',
  swap: 'Swapping Tokens',
  contribute: 'Contributing to Project',
  claim: 'Claiming Tokens',
  refund: 'Requesting Refund',
  withdraw: 'Withdrawing Funds',
  finalize: 'Finalizing Project',
  cancel: 'Canceling Project',
  deposit: 'Depositing Tokens',
  create:  'Creating Project',
  request: 'Requesting Faucet Tokens',
  adding: 'Adding Liquidity',
  'verify-wallet': 'Verifying Wallet Ownership',
}

interface MultiTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transactionType: TransactionType
  approvalHash?: `0x${string}`
  mainHash?: `0x${string}`
  signature?: `0x${string}`
  isApprovalPending?: boolean
  isApprovalConfirming?: boolean
  isApprovalSuccess?: boolean
  isMainPending?: boolean
  isMainConfirming?: boolean
  isMainSuccess?: boolean
  isSignaturePending?: boolean
  isSignatureSuccess?: boolean
  isError?: boolean
  error?: Error | null
  customTitle?: string
  message?: string
  signMessageText?: string
}

export const MultiTransactionModal: React.FC<MultiTransactionModalProps> = ({
  isOpen,
  onClose,
  transactionType,
  approvalHash,
  mainHash,
  signature,
  isApprovalPending = false,
  isApprovalConfirming = false,
  isApprovalSuccess = false,
  isMainPending = false,
  isMainConfirming = false,
  isMainSuccess = false,
  isSignaturePending = false,
  isSignatureSuccess = false,
  isError = false,
  error = null,
  customTitle,
  message,
  signMessageText = "Welcome to Exhibition, a comprehensive launchpad integrated with DEX and dedicated lock, built on Nexus verifiable network for the AI era.",
}) => {
  // Early return BEFORE any hooks to fix hook order violation
  if (!isOpen || !transactionType) return null

  const { address } = useAccount()
  const { signMessage, data: sig, isPending: signPending, isSuccess: signSuccess, error: signError } = useSignMessage()

  let displayHash = transactionType === 'approval' ? approvalHash : mainHash
  if (transactionType === 'verify-wallet') displayHash = signature || sig

  let isPending = false
  let isConfirming = false
  let isSuccess = false

  if (transactionType === 'approval') {
    isPending = isApprovalPending
    isConfirming = isApprovalConfirming
    isSuccess = isApprovalSuccess
  } else if (transactionType === 'verify-wallet') {
    isPending = isSignaturePending || signPending
    isSuccess = isSignatureSuccess || signSuccess
  } else {
    isPending = isMainPending
    isConfirming = isMainConfirming
    isSuccess = isMainSuccess
  }

  const modalTitle = customTitle || TRANSACTION_TITLES[transactionType]
  const canClose = isSuccess || isError || !!signError

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && canClose) {
      onClose()
    }
  }

  const handleClose = () => {
    if (canClose) {
      onClose()
    }
  }

  const handleSign = () => {
    signMessage({ message: signMessageText })
  }

  // Auto-store on success
  React.useEffect(() => {
    if (signSuccess && sig && address) {
      localStorage.setItem(`walletVerified_${address}`, JSON.stringify({ timestamp: Date.now(), signature: sig }))
    }
  }, [signSuccess, sig, address])

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div 
        className="relative w-full max-w-md bg-[var(--deep-black)] border border-[var(--charcoal)] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-[var(--charcoal)]">
          <h2 className="text-xl font-bold text-[var(--silver-light)]">{modalTitle}</h2>
          {canClose && (
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-[var(--charcoal)] transition-colors"
            >
              <X className="h-5 w-5 text-[var(--silver-dark)]" />
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {isPending && !isConfirming && !isSuccess && !isError && transactionType !== 'verify-wallet' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neon-orange)] mx-auto mb-4"></div>
                <p className="text-[var(--silver-light)] font-medium mb-2">Transaction Pending</p>
                <p className="text-sm text-[var(--silver-dark)]">
                  {message || 'Please confirm the transaction in your wallet'}
                </p>
                {displayHash && (
                  <p className="text-xs text-[var(--silver-dark)] mt-3 break-all font-mono">
                    {AMMFormatters.formatAddress(displayHash)}
                  </p>
                )}
              </div>
            )}

            {transactionType === 'verify-wallet' && !isSuccess && !signError && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neon-orange)] mx-auto mb-4"></div>
                <p className="text-[var(--silver-light)] font-medium mb-2">Sign to Verify</p>
                <p className="text-sm text-[var(--silver-dark)] mb-4">
                  {message || 'Please sign the message in your wallet to prove ownership.'}
                </p>
                <button
                  onClick={handleSign}
                  disabled={signPending}
                  className="px-6 py-2 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] text-[var(--deep-black)] font-medium rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {signPending ? 'Waiting for signature...' : 'Sign Message'}
                </button>
              </div>
            )}

            {isConfirming && !isSuccess && !isError && transactionType !== 'verify-wallet' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neon-blue)] mx-auto mb-4"></div>
                <p className="text-[var(--silver-light)] font-medium mb-2">Confirming Transaction</p>
                <p className="text-sm text-[var(--silver-dark)]">
                  {message || 'Waiting for blockchain confirmation...'}
                </p>
                {displayHash && (
                  <p className="text-xs text-[var(--silver-dark)] mt-3 break-all font-mono">
                    {AMMFormatters.formatAddress(displayHash)}
                  </p>
                )}
              </div>
            )}

            {isSuccess && !isError && (
              <div className="text-center">
                <div className="mb-4 text-5xl">✅</div>
                <p className="text-[var(--silver-light)] font-semibold text-lg mb-2">
                  {transactionType === 'verify-wallet' ? 'Verified Successfully' : 'Transaction Confirmed'}
                </p>
                <p className="text-sm text-[var(--silver-dark)] mb-3">
                  {message || 'Your action has been successfully completed'}
                </p>
                {displayHash && (
                  <p className="text-xs text-[var(--silver-dark)] break-all font-mono">
                    {AMMFormatters.formatAddress(displayHash)}
                  </p>
                )}
              </div>
            )}

            {(isError || signError) && (
              <div className="text-center">
                <div className="mb-4 text-5xl">❌</div>
                <p className="text-[var(--silver-light)] font-semibold text-lg mb-2">
                  Action Failed
                </p>
                <p className="text-sm text-[var(--silver-dark)] mb-3">
                  {error?.message || signError?.message || message || 'Action was rejected or failed'}
                </p>
                {displayHash && (
                  <p className="text-xs text-[var(--silver-dark)] break-all font-mono">
                    {AMMFormatters.formatAddress(displayHash)}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col space-y-2 pt-2">
              {displayHash && transactionType !== 'verify-wallet' && (
                <button
                  onClick={() =>
                    window.open(
                      `${import.meta.env.VITE_NEXUS_TESTNET_EXPLORER_URL}/tx/${displayHash}`,
                      '_blank'
                    )
                  }
                  className="w-full bg-[var(--charcoal)] text-[var(--silver-light)] py-2.5 rounded-xl font-medium hover:bg-[var(--silver-dark)] hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center space-x-2 border border-[var(--silver-dark)]"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View Verifiable Proof</span>
                </button>
              )}

              {canClose && (
                <button
                  onClick={handleClose}
                  className="w-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] text-[var(--deep-black)] py-3 rounded-xl font-semibold hover:from-[var(--neon-orange)] hover:to-[var(--neon-blue)] transition-all duration-300 shadow-[0_0_20px_var(--neon-blue)]"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const needsApprovalStep = (type: TransactionType): boolean => {
  return ['swap', 'contribute', 'deposit'].includes(type || '')
}

export const useMultiTransactionModal = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [transactionType, setTransactionType] = React.useState<TransactionType>(null)

  const show = React.useCallback((type: TransactionType) => {
    setTransactionType(type)
    setIsOpen(true)
  }, [])

  const hide = React.useCallback(() => {
    setIsOpen(false)
    setTimeout(() => setTransactionType(null), 300)
  }, [])

  const switchType = React.useCallback((type: TransactionType) => {
    setTransactionType(type)
  }, [])

  return {
    isOpen,
    transactionType,
    show,
    hide,
    switchType,
  }
}