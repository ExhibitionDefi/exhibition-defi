// src/components/exnex/ExNEXInterface.tsx
import React, { useState, useMemo, useEffect } from 'react'
import { Coins, ArrowDownUp, CheckCircle, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MultiTransactionModal } from '@/components/common/MultiTransactionModal'
import { SafeHtml } from '@/components/SafeHtml'
import { sanitizeNumber } from '@/utils/sanitization'

interface ExNEXInterfaceProps {
  // From useExNEX hook
  balance: string
  totalSupply: string
  nexBalance?: string
  isLoading: boolean
  isSuccess: boolean
  error: Error | null
  txHash?: `0x${string}`
  isPending: boolean
  isConfirming: boolean
  deposit: (amountNEX: string) => Promise<`0x${string}` | null>
  withdraw: (amountExNEX: string) => Promise<`0x${string}` | null>
  resetState: () => void
}

type ActionMode = 'deposit' | 'withdraw'

export const ExNEXInterface: React.FC<ExNEXInterfaceProps> = ({
  balance,
  totalSupply,
  nexBalance = '0',
  isLoading,
  isSuccess,
  error,
  txHash,
  isPending,
  isConfirming,
  deposit,
  withdraw,
  resetState,
}) => {
  const [mode, setMode] = useState<ActionMode>('deposit')
  const [amount, setAmount] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Sanitize and memoize balance values
  const sanitizedBalances = useMemo(() => {
    return {
      exNEXBalance: sanitizeNumber(balance, { min: 0, decimals: 4 }) ?? 0,
      nexBalance: sanitizeNumber(nexBalance, { min: 0, decimals: 4 }) ?? 0,
      totalSupply: sanitizeNumber(totalSupply, { min: 0, decimals: 4 }) ?? 0,
    }
  }, [balance, nexBalance, totalSupply])

  useEffect(() => {
    if (isSuccess) {
      setAmount('')
      setLocalError(null)
    }
  }, [isSuccess])

  const handleSubmit = async () => {
    // Sanitize input amount
    const sanitizedAmount = sanitizeNumber(amount, { min: 0.0001, decimals: 18 })
    
    if (!sanitizedAmount) {
      setLocalError('Please enter a valid amount (minimum 0.0001)')
      return
    }

    // Validate balance
    const availableBalance = mode === 'deposit' 
      ? sanitizedBalances.nexBalance 
      : sanitizedBalances.exNEXBalance
    
    if (sanitizedAmount > availableBalance) {
      setLocalError(`Insufficient ${mode === 'deposit' ? 'NEX' : 'exNEX'} balance`)
      return
    }

    try {
      setLocalError(null)
      setShowModal(true)
      
      if (mode === 'deposit') {
        await deposit(sanitizedAmount.toString())
      } else {
        await withdraw(sanitizedAmount.toString())
      }
      
      // Clear amount on success
      if (isSuccess) {
        setAmount('')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      setLocalError(errorMessage)
    }
  }

  const handleMaxBalance = () => {
    const maxAmount = mode === 'deposit' 
      ? sanitizedBalances.nexBalance 
      : sanitizedBalances.exNEXBalance
    setAmount(maxAmount.toString())
    setLocalError(null)
  }

  const handleModalClose = () => {
    setShowModal(false)
    if (isSuccess || error) {
      resetState()
    }
  }

  // Sanitize user input amount for display
  const displayAmount = useMemo(() => {
    const sanitized = sanitizeNumber(amount, { min: 0, decimals: 4 })
    return sanitized !== null ? sanitized.toFixed(4) : '0.0000'
  }, [amount])

  const displayError = localError || error?.message

  return (
    <>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="relative inline-block">
            <Coins 
              className="h-12 w-12 mx-auto drop-shadow-[0_0_16px_var(--neon-orange)]" 
              style={{ color: 'var(--neon-orange)' }}
            />
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--silver-light)' }}>
            exNEX Management
          </h1>
          <p className="text-base max-w-2xl mx-auto" style={{ color: 'var(--metallic-silver)' }}>
            Deposit NEX to get exNEX or withdraw exNEX to get NEX back
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--metallic-silver)' }}>
                  NEX Balance
                </p>
                <p className="text-xl font-bold" style={{ color: 'var(--silver-light)' }}>
                  {sanitizedBalances.nexBalance.toFixed(4)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)]/70 flex items-center justify-center">
                <Coins className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-orange)]/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--metallic-silver)' }}>
                  exNEX Balance
                </p>
                <p className="text-xl font-bold" style={{ color: 'var(--silver-light)' }}>
                  {sanitizedBalances.exNEXBalance.toFixed(4)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 flex items-center justify-center">
                <ArrowDownUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Card */}
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--metallic-silver)]/30 p-6">
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex space-x-2 bg-[var(--charcoal)] p-2 rounded-lg border border-[var(--silver-dark)] border-opacity-30">
              <Button
                onClick={() => {
                  setMode('deposit')
                  setAmount('')
                  setLocalError(null)
                }}
                className={`flex-1 transition-all duration-300 ${
                  mode === 'deposit'
                    ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)] text-white'
                    : 'bg-transparent text-[var(--metallic-silver)] hover:text-[var(--neon-blue)]'
                }`}
              >
                <ArrowDown className="h-4 w-4 mr-1.5" />
                Deposit NEX
              </Button>
              <Button
                onClick={() => {
                  setMode('withdraw')
                  setAmount('')
                  setLocalError(null)
                }}
                className={`flex-1 transition-all duration-300 ${
                  mode === 'withdraw'
                    ? 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)] text-white'
                    : 'bg-transparent text-[var(--metallic-silver)] hover:text-[var(--neon-orange)]'
                }`}
              >
                <ArrowUp className="h-4 w-4 mr-1.5" />
                Withdraw exNEX
              </Button>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label style={{ color: 'var(--silver-light)' }} className="block text-sm font-medium">
                  {mode === 'deposit' ? 'NEX Amount to Deposit' : 'exNEX Amount to Withdraw'}
                </label>
                <button
                  onClick={handleMaxBalance}
                  className="text-xs px-3 py-1 rounded-lg bg-[var(--charcoal)] hover:bg-[var(--silver-dark)]/20 transition-colors"
                  style={{ color: mode === 'deposit' ? 'var(--neon-blue)' : 'var(--neon-orange)' }}
                >
                  MAX
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setLocalError(null)
                  }}
                  placeholder="0.0"
                  step="0.0001"
                  min="0"
                  className="w-full px-4 py-3 bg-[var(--charcoal)] border border-[var(--metallic-silver)]/30 rounded-lg text-[var(--silver-light)] placeholder-[var(--silver-dark)] focus:outline-none focus:border-[var(--neon-blue)]/50 focus:ring-1 focus:ring-[var(--neon-blue)]/30"
                />
                <span 
                  style={{ color: 'var(--metallic-silver)' }} 
                  className="absolute right-4 top-3 text-sm font-medium"
                >
                  {mode === 'deposit' ? 'NEX' : 'exNEX'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--silver-dark)' }}>
                <span>
                  Available: {(mode === 'deposit' 
                    ? sanitizedBalances.nexBalance 
                    : sanitizedBalances.exNEXBalance
                  ).toFixed(4)}
                </span>
                {amount && sanitizeNumber(amount, { min: 0 }) && (
                  <span style={{ color: 'var(--neon-blue)' }}>
                    You will {mode === 'deposit' ? 'receive' : 'get back'}: {displayAmount} {mode === 'deposit' ? 'exNEX' : 'NEX'}
                  </span>
                )}
              </div>
            </div>

            {/* Error Display - SANITIZED */}
            {displayError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start space-x-2.5">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <SafeHtml 
                    content={displayError}
                    className="text-red-400 text-xs"
                    as="p"
                  />
                </div>
              </div>
            )}

            {/* Success Display */}
            {isSuccess && !isPending && !isConfirming && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start space-x-2.5">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-400">
                    {mode === 'deposit' ? 'Deposit' : 'Withdrawal'} Successful!
                  </p>
                  <p className="text-xs text-green-300/80 mt-1">
                    Transaction completed successfully
                  </p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={handleSubmit}
              disabled={!amount || isLoading || isPending || isConfirming}
              isLoading={isPending || isConfirming}
              loadingText={isPending ? 'Submitting...' : 'Confirming...'}
              className={`w-full h-12 text-base border-0 shadow-lg ${
                mode === 'deposit'
                  ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)]/80 hover:from-[var(--neon-blue)]/90 hover:to-[var(--neon-blue)]/70 shadow-[var(--neon-blue)]/30'
                  : 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/80 hover:from-[var(--neon-orange)]/90 hover:to-[var(--neon-orange)]/70 shadow-[var(--neon-orange)]/30'
              }`}
            >
              {mode === 'deposit' ? (
                <>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Deposit NEX
                </>
              ) : (
                <>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Withdraw exNEX
                </>
              )}
            </Button>

            {/* Info Box */}
            <div 
              className={`border rounded-lg p-3 flex items-start space-x-2.5 ${
                mode === 'deposit'
                  ? 'bg-[var(--neon-blue)]/5 border-[var(--neon-blue)]/20'
                  : 'bg-[var(--neon-orange)]/5 border-[var(--neon-orange)]/20'
              }`}
            >
              <AlertCircle 
                className="h-4 w-4 flex-shrink-0 mt-0.5" 
                style={{ color: mode === 'deposit' ? 'var(--neon-blue)' : 'var(--neon-orange)' }}
              />
              <div className="space-y-1.5 text-xs" style={{ color: 'var(--metallic-silver)' }}>
                <p className="font-semibold" style={{ color: 'var(--silver-light)' }}>
                  {mode === 'deposit' ? 'Deposit Information:' : 'Withdrawal Information:'}
                </p>
                <ul className="space-y-0.5 list-disc list-inside">
                  {mode === 'deposit' ? (
                    <>
                      <li>1 NEX = 1 exNEX (1:1 ratio)</li>
                      <li>Automatic liquidity provision on AMM</li>
                      <li>Smart contract-enforced vesting</li>
                      <li>Complete blockchain transparency</li>
                    </>
                  ) : (
                    <>
                      <li>1 exNEX = 1 NEX (1:1 ratio)</li>
                      <li>Instant withdrawal available</li>
                      <li>NEX will be returned to your wallet</li>
                      <li>Gas fees apply for transaction</li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            {/* Total Supply Info */}
            <div className="pt-3 border-t border-[var(--silver-dark)]/30">
              <div className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--metallic-silver)' }}>Total exNEX Supply:</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--silver-light)' }}>
                  {sanitizedBalances.totalSupply.toFixed(4)} exNEX
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction Modal */}
      <MultiTransactionModal
        isOpen={showModal}
        onClose={handleModalClose}
        transactionType={mode === 'deposit' ? 'deposit' : 'withdraw'}
        mainHash={txHash}
        isMainPending={isPending}
        isMainConfirming={isConfirming}
        isMainSuccess={isSuccess}
        isError={!!error}
        error={error}
        message={
          mode === 'deposit'
            ? 'Depositing NEX to receive exNEX...'
            : 'Withdrawing exNEX to receive NEX...'
        }
      />
    </>
  )
}