// src/pages/FaucetPage.tsx
import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { Droplets, Clock, Wallet, Coins, DollarSign, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { MultiTransactionModal, useMultiTransactionModal } from '@/components/common/MultiTransactionModal'
import { useFaucet } from '../hooks/useFaucet'
import { useExNEX } from '../hooks/useNEX.ts'

type PageView = 'faucet' | 'deposit'

export const FaucetPage: React.FC = () => {
  const { isConnected, address } = useAccount()
  const [currentView, setCurrentView] = useState<PageView>('faucet')
  const [depositAmount, setDepositAmount] = useState('')

  // Faucet hook
  const {
    exhAmountFormatted,
    usdtAmountFormatted,
    canRequestFaucet,
    cooldownRemaining,
    cooldownPercentage,
    requestFaucetTokens,
    isTransactionPending: isFaucetPending,
    isTransactionConfirming: isFaucetConfirming,
    isTransactionSuccess: isFaucetSuccess,
    isLoading: isFaucetLoading,
  } = useFaucet()

  // exNEX hook
  const {
    deposit,
    balance: exnexBalance,
    isLoading: isExNEXLoading,
  } = useExNEX()

  // Modal management
  const modal = useMultiTransactionModal()
  const [faucetTxHash] = useState<`0x${string}`>()
  const [depositTxHash] = useState<`0x${string}`>()
  const [faucetError, setFaucetError] = useState<Error | null>(null)
  const [depositError, setDepositError] = useState<Error | null>(null)

  const formatCooldown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const handleRequestFaucet = async () => {
    try {
      setFaucetError(null)
      modal.show('request')
      await requestFaucetTokens()
      // Success will be handled by modal state
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Faucet request failed')
      setFaucetError(error)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount))) {
      setDepositError(new Error('Please enter a valid amount'))
      return
    }

    try {
      setDepositError(null)
      modal.show('deposit')
      await deposit(depositAmount)
      setDepositAmount('')
      // Success will be handled by modal state
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Deposit failed')
      setDepositError(error)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8 bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/30">
          <div className="space-y-6">
            <div className="relative">
              <Wallet className="h-16 w-16 mx-auto drop-shadow-[0_0_12px_var(--neon-blue)]" style={{ color: 'var(--neon-blue)' }} />
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--silver-light)' }}>
                Connect Your Wallet
              </h2>
              <p style={{ color: 'var(--metallic-silver)' }}>
                Connect your wallet to claim free testnet tokens and deposit to exNEX
              </p>
            </div>
            <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--neon-orange)]/10 p-4 rounded-lg">
              <w3m-button />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const isLoading = isFaucetLoading || isExNEXLoading

  if (isLoading && currentView === 'faucet') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p style={{ color: 'var(--metallic-silver)' }}>Loading faucet information...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Modal */}
      <MultiTransactionModal
        isOpen={modal.isOpen}
        onClose={modal.hide}
        transactionType={modal.transactionType}
        mainHash={modal.transactionType === 'request' ? faucetTxHash : depositTxHash}
        isMainPending={modal.transactionType === 'request' ? isFaucetPending : false}
        isMainConfirming={modal.transactionType === 'request' ? isFaucetConfirming : false}
        isMainSuccess={modal.transactionType === 'request' ? isFaucetSuccess : false}
        isError={!!(modal.transactionType === 'request' ? faucetError : depositError)}
        error={modal.transactionType === 'request' ? faucetError : depositError}
        message={
          modal.transactionType === 'request'
            ? 'Requesting testnet tokens from faucet...'
            : 'Depositing NEX to get exNEX...'
        }
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* View Tabs */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => setCurrentView('faucet')}
            className={`flex items-center gap-2 ${
              currentView === 'faucet'
                ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)]'
                : 'bg-[var(--charcoal)] hover:bg-[var(--charcoal)]/80 border border-[var(--metallic-silver)]/30'
            }`}
          >
            <Droplets className="h-5 w-5" />
            Faucet
          </Button>
          <Button
            onClick={() => setCurrentView('deposit')}
            className={`flex items-center gap-2 ${
              currentView === 'deposit'
                ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)]'
                : 'bg-[var(--charcoal)] hover:bg-[var(--charcoal)]/80 border border-[var(--metallic-silver)]/30'
            }`}
          >
            <Coins className="h-5 w-5" />
            Deposit to exNEX
          </Button>
        </div>

        {/* Faucet View */}
        {currentView === 'faucet' && (
          <>
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <Droplets 
                  className="h-16 w-16 mx-auto drop-shadow-[0_0_16px_var(--neon-blue)]" 
                  style={{ color: 'var(--neon-blue)' }}
                />
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
              </div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--silver-light)' }}>
                Testnet Faucet
              </h1>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--metallic-silver)' }}>
                Get free testnet tokens to start exploring and testing the Exhibition platform
              </p>
            </div>

            {/* Token Amounts Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/40 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)]/70 flex items-center justify-center">
                      <Coins className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
                        EXH Token
                      </p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--silver-light)' }}>
                        {exhAmountFormatted}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-[var(--charcoal)] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)]/70 h-2 rounded-full transition-all duration-500"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-orange)]/40 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
                        USDT Token
                      </p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--silver-light)' }}>
                        {usdtAmountFormatted}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-[var(--charcoal)] rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 h-2 rounded-full transition-all duration-500"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </Card>
            </div>

            {/* Main Faucet Card */}
            <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--metallic-silver)]/30 p-8">
              <div className="space-y-6">
                {/* Connected Wallet Info */}
                <div className="bg-[var(--charcoal)]/50 rounded-lg p-4 border border-[var(--metallic-silver)]/20">
                  <p className="text-sm mb-1" style={{ color: 'var(--metallic-silver)' }}>
                    Connected Wallet
                  </p>
                  <p className="font-mono text-sm" style={{ color: 'var(--silver-light)' }}>
                    {address}
                  </p>
                </div>

                {/* Cooldown Status */}
                {!canRequestFaucet && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5" style={{ color: 'var(--neon-orange)' }} />
                        <span style={{ color: 'var(--silver-light)' }}>Cooldown Active</span>
                      </div>
                      <span className="font-mono text-lg font-bold" style={{ color: 'var(--neon-orange)' }}>
                        {formatCooldown(cooldownRemaining)}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--charcoal)] rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 h-3 rounded-full transition-all duration-1000"
                        style={{ width: `${cooldownPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-center" style={{ color: 'var(--metallic-silver)' }}>
                      Please wait for the cooldown to finish before requesting again
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {isFaucetSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-400">Tokens Claimed Successfully!</p>
                      <p className="text-sm text-green-300/80 mt-1">
                        {exhAmountFormatted} EXH and {usdtAmountFormatted} USDT have been sent to your wallet
                      </p>
                    </div>
                  </div>
                )}

                {/* Request Button */}
                <Button
                  onClick={handleRequestFaucet}
                  disabled={!canRequestFaucet || isFaucetPending || isFaucetConfirming}
                  isLoading={isFaucetPending || isFaucetConfirming}
                  loadingText={isFaucetPending ? "Requesting..." : "Confirming..."}
                  className="w-full h-14 text-lg bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] hover:from-[var(--neon-blue)]/90 hover:to-[var(--neon-orange)]/90 border-0 shadow-lg shadow-[var(--neon-blue)]/30"
                >
                  <Droplets className="h-5 w-5 mr-2" />
                  {canRequestFaucet ? 'Request Tokens' : `Wait ${formatCooldown(cooldownRemaining)}`}
                </Button>

                {/* Info Box */}
                <div className="bg-[var(--neon-blue)]/5 border border-[var(--neon-blue)]/20 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--neon-blue)' }} />
                  <div className="space-y-2 text-sm" style={{ color: 'var(--metallic-silver)' }}>
                    <p className="font-semibold" style={{ color: 'var(--silver-light)' }}>Important Information:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>These are testnet tokens with no real value</li>
                      <li>Use them to test the Exhibition platform features</li>
                      <li>You can request tokens once per cooldown period</li>
                      <li>Tokens will be sent directly to your connected wallet</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Next Step CTA */}
            <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--neon-orange)]/10 border border-[var(--neon-blue)]/30 rounded-xl p-6 text-center">
              <p className="mb-4" style={{ color: 'var(--silver-light)' }}>Ready to deposit and get exNEX?</p>
              <Button
                onClick={() => setCurrentView('deposit')}
                className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] flex items-center gap-2 mx-auto"
              >
                Go to Deposit <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Deposit View */}
        {currentView === 'deposit' && (
          <>
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <Coins 
                  className="h-16 w-16 mx-auto drop-shadow-[0_0_16px_var(--neon-orange)]" 
                  style={{ color: 'var(--neon-orange)' }}
                />
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
              </div>
              <h1 className="text-4xl font-bold" style={{ color: 'var(--silver-light)' }}>
                Deposit to exNEX
              </h1>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--metallic-silver)' }}>
                Convert your NEX tokens to exNEX with automatic liquidity and vesting
              </p>
            </div>

            {/* Deposit Card */}
            <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--metallic-silver)]/30 p-8">
              <div className="space-y-6">
                {/* Current Balance */}
                <div className="bg-[var(--charcoal)]/50 rounded-lg p-4 border border-[var(--metallic-silver)]/20">
                  <p className="text-sm mb-2" style={{ color: 'var(--metallic-silver)' }}>
                    Current exNEX Balance
                  </p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--silver-light)' }}>
                    {exnexBalance}
                  </p>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <label style={{ color: 'var(--silver-light)' }} className="block text-sm font-medium">
                    NEX Amount to Deposit
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => {
                        setDepositAmount(e.target.value)
                        setDepositError(null)
                      }}
                      placeholder="Enter amount in NEX"
                      className="w-full px-4 py-3 bg-[var(--charcoal)] border border-[var(--metallic-silver)]/30 rounded-lg text-[var(--silver-light)] placeholder-[var(--silver-dark)] focus:outline-none focus:border-[var(--neon-blue)]/50 focus:ring-1 focus:ring-[var(--neon-blue)]/30"
                    />
                    <span style={{ color: 'var(--metallic-silver)' }} className="absolute right-4 top-3 text-sm font-medium">
                      NEX
                    </span>
                  </div>
                </div>

                {/* Error Message */}
                {depositError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 text-sm">{depositError.message}</p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {modal.transactionType === 'deposit' && modal.isOpen === false && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-400">Deposit Successful!</p>
                      <p className="text-sm text-green-300/80 mt-1">
                        You have received exNEX tokens in your wallet
                      </p>
                    </div>
                  </div>
                )}

                {/* Deposit Button */}
                <Button
                  onClick={handleDeposit}
                  disabled={!depositAmount || isExNEXLoading}
                  isLoading={false}
                  className="w-full h-14 text-lg bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] hover:from-[var(--neon-blue)]/90 hover:to-[var(--neon-orange)]/90 border-0 shadow-lg shadow-[var(--neon-orange)]/30"
                >
                  <Coins className="h-5 w-5 mr-2" />
                  Deposit NEX
                </Button>

                {/* Info Box */}
                <div className="bg-[var(--neon-orange)]/5 border border-[var(--neon-orange)]/20 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--neon-orange)' }} />
                  <div className="space-y-2 text-sm" style={{ color: 'var(--metallic-silver)' }}>
                    <p className="font-semibold" style={{ color: 'var(--silver-light)' }}>Deposit Benefits:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Automatic liquidity provision on AMM</li>
                      <li>Smart contract-enforced vesting schedules</li>
                      <li>Fair distribution with cliff periods</li>
                      <li>Complete blockchain transparency</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </>
  )
}