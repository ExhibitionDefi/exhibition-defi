import React from 'react'
import { ExternalLink, X } from 'lucide-react'
import { AMMFormatters } from '@/utils/ammFormatters'
import { useAccount, useSignMessage } from 'wagmi'
import { verifyWallet } from '@/utils/api'

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
  isError = false,
  error = null,
  customTitle,
  message,
  signMessageText = "Welcome to Exhibition, a verifiable token launchpad and DEX with dedicated liquidity lock, built on Nexus verifiable network for the AI era.",
}) => {
  const { address } = useAccount()
  const { signMessage, data: sig, isPending: signPending, isSuccess: signSuccess, error: signError } = useSignMessage()

  // ✅ State for backend verification
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [verificationError, setVerificationError] = React.useState<string | null>(null)
  const [isBackendVerified, setIsBackendVerified] = React.useState(false)

  // ✅ CRITICAL: Reset state when modal opens/closes or transaction type changes
  React.useEffect(() => {
    if (!isOpen || transactionType !== 'verify-wallet') {
      setIsVerifying(false)
      setVerificationError(null)
      setIsBackendVerified(false)
    }
  }, [isOpen, transactionType])

  let displayHash = transactionType === 'approval' ? approvalHash : mainHash
  if (transactionType === 'verify-wallet') displayHash = signature || sig
  
  // ✅ Determine states correctly for verify-wallet
  let isPending = false
  let isConfirming = false
  let isSuccess = false

  if (transactionType === 'approval') {
    isPending = isApprovalPending
    isConfirming = isApprovalConfirming
    isSuccess = isApprovalSuccess
  } else if (transactionType === 'verify-wallet') {
    isPending = signPending || isVerifying
    isConfirming = false // No blockchain confirmation for signing
    isSuccess = isBackendVerified
  } else {
    isPending = isMainPending
    isConfirming = isMainConfirming
    isSuccess = isMainSuccess
  }

  const modalTitle = customTitle || (transactionType ? TRANSACTION_TITLES[transactionType] : '')
  
  // ✅ CRITICAL: For verify-wallet, only allow closing after success OR if there's an error
  const canClose = transactionType === 'verify-wallet' 
    ? (isBackendVerified || !!signError || !!verificationError)
    : (isSuccess || isError || !!error)

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
    setVerificationError(null) // Clear previous errors
    signMessage({ message: signMessageText })
  }

  // ✅ Backend verification effect
  React.useEffect(() => {
    if (signSuccess && sig && address && transactionType === 'verify-wallet' && !isBackendVerified) {
      const verifyWithBackend = async () => {
        setIsVerifying(true)
        setVerificationError(null)
      
        try {
          const response = await verifyWallet(address, sig, signMessageText)
        
          if (response.success) {
            console.log('✅ Wallet verified with backend')
            setIsBackendVerified(true)
          } else {
            const errorMsg = response.message || response.error || 'Verification failed'
            console.error('❌ Backend verification failed:', errorMsg)
            setVerificationError(errorMsg)
          }
        } catch (err) {
          console.error('❌ Backend verification error:', err)
          setVerificationError(err instanceof Error ? err.message : 'Failed to verify with backend')
        } finally {
          setIsVerifying(false)
        }
      }
    
      verifyWithBackend()
    }
  }, [signSuccess, sig, address, signMessageText, transactionType, isBackendVerified])

  return (
    <>
      {isOpen && transactionType && (
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
                {/* ✅ Regular transaction pending state */}
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

                {/* ✅ VERIFY-WALLET: Waiting for signature OR verifying with backend */}
                {transactionType === 'verify-wallet' && !isBackendVerified && !signError && !verificationError && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neon-orange)] mx-auto mb-4"></div>
                    <p className="text-[var(--silver-light)] font-medium mb-2">
                      {isVerifying ? 'Verifying with Backend...' : signPending ? 'Waiting for Signature...' : 'Sign to Verify'}
                    </p>
                    <p className="text-sm text-[var(--silver-dark)] mb-4">
                      {isVerifying
                        ? 'Securely authenticating your wallet...'
                        : signPending
                        ? 'Please check your wallet and sign the message'
                        : message || 'Please sign the message in your wallet to prove ownership.'}
                    </p>
                    {!signPending && !isVerifying && !signSuccess && (
                      <button
                        onClick={handleSign}
                        disabled={signPending || isVerifying}
                        className="px-6 py-2 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] text-[var(--deep-black)] font-medium rounded-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50"
                      >
                        Sign Message
                      </button>
                    )}
                  </div>
                )}

                {/* ✅ Regular transaction confirming state */}
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

                {/* ✅ Success state */}
                {isSuccess && !isError && (
                  <div className="text-center">
                    <div className="mb-4 text-5xl">✅</div>
                    <p className="text-[var(--silver-light)] font-semibold text-lg mb-2">
                      {transactionType === 'verify-wallet' ? 'Verified Successfully!' : 'Transaction Confirmed'}
                    </p>
                    <p className="text-sm text-[var(--silver-dark)] mb-3">
                      {transactionType === 'verify-wallet'
                        ? 'Your wallet has been verified. You can now access the platform.'
                        : message || 'Your action has been successfully completed'}
                    </p>
                    {displayHash && transactionType !== 'verify-wallet' && (
                      <p className="text-xs text-[var(--silver-dark)] break-all font-mono">
                        {AMMFormatters.formatAddress(displayHash)}
                      </p>
                    )}
                  </div>
                )}

                {/* ✅ Error state for regular transactions */}
                {(isError || error) && transactionType !== 'verify-wallet' && (
                  <div className="text-center">
                    <div className="mb-4 text-5xl">❌</div>
                    <p className="text-[var(--silver-light)] font-semibold text-lg mb-2">Transaction Failed</p>
                    <p className="text-sm text-[var(--silver-dark)] mb-3">
                      {error?.message || message || 'Transaction was rejected or failed'}
                    </p>
                    {displayHash && (
                      <p className="text-xs text-[var(--silver-dark)] break-all font-mono">
                        {AMMFormatters.formatAddress(displayHash)}
                      </p>
                    )}
                  </div>
                )}

                {/* ✅ Error state for verify-wallet */}
                {signError && transactionType === 'verify-wallet' && (
                  <div className="text-center">
                    <div className="mb-4 text-5xl">❌</div>
                    <p className="text-[var(--silver-light)] font-semibold text-lg mb-2">Signature Failed</p>
                    <p className="text-sm text-[var(--silver-dark)] mb-3">
                      {signError.message || 'Failed to sign message. Please try again.'}
                    </p>
                  </div>
                )}

                {verificationError && transactionType === 'verify-wallet' && (
                  <div className="text-center">
                    <div className="mb-4 text-5xl">❌</div>
                    <p className="text-[var(--silver-light)] font-semibold text-lg mb-2">Verification Failed</p>
                    <p className="text-sm text-[var(--silver-dark)] mb-3">{verificationError}</p>
                  </div>
                )}

                <div className="flex flex-col space-y-2 pt-2">
                  {/* Explorer link */}
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

                  {/* Close button */}
                  {canClose && (
                    <button
                      onClick={handleClose}
                      className="w-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] text-[var(--deep-black)] py-3 rounded-xl font-semibold hover:from-[var(--neon-orange)] hover:to-[var(--neon-blue)] transition-all duration-300 shadow-[0_0_20px_var(--neon-blue)]"
                    >
                      Close
                    </button>
                  )}

                  {/* Retry button */}
                  {(signError || verificationError) && transactionType === 'verify-wallet' && (
                    <button
                      onClick={handleSign}
                      className="w-full bg-[var(--charcoal)] text-[var(--silver-light)] py-3 rounded-xl font-semibold hover:bg-[var(--silver-dark)] transition-all duration-300 border border-[var(--silver-dark)]"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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