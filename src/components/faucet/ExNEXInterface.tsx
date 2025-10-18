// src/components/exnex/ExNEXInterface.tsx
import React, { useState } from 'react'
import { Coins, ArrowDownUp, CheckCircle, AlertCircle, ArrowDown, ArrowUp } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { MultiTransactionModal } from '@/components/common/MultiTransactionModal'

interface ExNEXInterfaceProps {
  // From useExNEX hook
  balance: string
  totalSupply: string
  nexBalance?: string // NEX balance for withdraw
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

  const handleSubmit = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setLocalError('Please enter a valid amount')
      return
    }

    // Validate balance
    const amountValue = parseFloat(amount)
    const availableBalance = parseFloat(mode === 'deposit' ? nexBalance : balance)
    
    if (amountValue > availableBalance) {
      setLocalError(`Insufficient ${mode === 'deposit' ? 'NEX' : 'exNEX'} balance`)
      return
    }

    try {
      setLocalError(null)
      setShowModal(true)
      
      if (mode === 'deposit') {
        await deposit(amount)
      } else {
        await withdraw(amount)
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
    const maxAmount = mode === 'deposit' ? nexBalance : balance
    setAmount(maxAmount)
    setLocalError(null)
  }

  const handleModalClose = () => {
    setShowModal(false)
    if (isSuccess || error) {
      resetState()
    }
  }

  const displayError = localError || error?.message

  return (
    <>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="relative inline-block">
            <Coins 
              className="h-16 w-16 mx-auto drop-shadow-[0_0_16px_var(--neon-orange)]" 
              style={{ color: 'var(--neon-orange)' }}
            />
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h1 className="text-4xl font-bold" style={{ color: 'var(--silver-light)' }}>
            exNEX Management
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--metallic-silver)' }}>
            Deposit NEX to get exNEX or withdraw exNEX to get NEX back
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--metallic-silver)' }}>
                  NEX Balance
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--silver-light)' }}>
                  {parseFloat(nexBalance).toFixed(4)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)]/70 flex items-center justify-center">
                <Coins className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-orange)]/40 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--metallic-silver)' }}>
                  exNEX Balance
                </p>
                <p className="text-2xl font-bold" style={{ color: 'var(--silver-light)' }}>
                  {parseFloat(balance).toFixed(4)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 flex items-center justify-center">
                <ArrowDownUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Card */}
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--metallic-silver)]/30 p-8">
          <div className="space-y-6">
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
                <ArrowDown className="h-4 w-4 mr-2" />
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
                <ArrowUp className="h-4 w-4 mr-2" />
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
                <span>Available: {parseFloat(mode === 'deposit' ? nexBalance : balance).toFixed(4)}</span>
                {amount && !isNaN(parseFloat(amount)) && (
                  <span style={{ color: 'var(--neon-blue)' }}>
                    You will {mode === 'deposit' ? 'receive' : 'get back'}: {parseFloat(amount).toFixed(4)} {mode === 'deposit' ? 'exNEX' : 'NEX'}
                  </span>
                )}
              </div>
            </div>

            {/* Error Display */}
            {displayError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm">{displayError}</p>
                </div>
              </div>
            )}

            {/* Success Display */}
            {isSuccess && !isPending && !isConfirming && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-400">
                    {mode === 'deposit' ? 'Deposit' : 'Withdrawal'} Successful!
                  </p>
                  <p className="text-sm text-green-300/80 mt-1">
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
              className={`w-full h-14 text-lg border-0 shadow-lg ${
                mode === 'deposit'
                  ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)]/80 hover:from-[var(--neon-blue)]/90 hover:to-[var(--neon-blue)]/70 shadow-[var(--neon-blue)]/30'
                  : 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/80 hover:from-[var(--neon-orange)]/90 hover:to-[var(--neon-orange)]/70 shadow-[var(--neon-orange)]/30'
              }`}
            >
              {mode === 'deposit' ? (
                <>
                  <ArrowDown className="h-5 w-5 mr-2" />
                  Deposit NEX
                </>
              ) : (
                <>
                  <ArrowUp className="h-5 w-5 mr-2" />
                  Withdraw exNEX
                </>
              )}
            </Button>

            {/* Info Box */}
            <div 
              className={`border rounded-lg p-4 flex items-start space-x-3 ${
                mode === 'deposit'
                  ? 'bg-[var(--neon-blue)]/5 border-[var(--neon-blue)]/20'
                  : 'bg-[var(--neon-orange)]/5 border-[var(--neon-orange)]/20'
              }`}
            >
              <AlertCircle 
                className="h-5 w-5 flex-shrink-0 mt-0.5" 
                style={{ color: mode === 'deposit' ? 'var(--neon-blue)' : 'var(--neon-orange)' }}
              />
              <div className="space-y-2 text-sm" style={{ color: 'var(--metallic-silver)' }}>
                <p className="font-semibold" style={{ color: 'var(--silver-light)' }}>
                  {mode === 'deposit' ? 'Deposit Information:' : 'Withdrawal Information:'}
                </p>
                <ul className="space-y-1 list-disc list-inside">
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
            <div className="pt-4 border-t border-[var(--silver-dark)]/30">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--metallic-silver)' }}>Total exNEX Supply:</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--silver-light)' }}>
                  {parseFloat(totalSupply).toFixed(4)} exNEX
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