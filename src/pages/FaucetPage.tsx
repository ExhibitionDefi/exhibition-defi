// src/pages/FaucetPage.tsx
import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import { Droplets, Clock, Wallet, Coins, DollarSign, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { MultiTransactionModal, useMultiTransactionModal } from '@/components/common/MultiTransactionModal'
import { ExNEXInterface } from '@/components/faucet/ExNEXInterface'
import { useFaucet } from '../hooks/utilities/useFaucet'
import { useExNEX } from '../hooks/utilities/useNEX'

type PageView = 'faucet' | 'exnex'

export const FaucetPage: React.FC = () => {
  const { isConnected, address } = useAccount()
  const [currentView, setCurrentView] = useState<PageView>('faucet')

  // Faucet hook
  const {
    exhAmountFormatted,
    exusdAmountFormatted,
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
  const exnexHook = useExNEX()

  // Modal management for faucet only
  const modal = useMultiTransactionModal()
  const [faucetTxHash] = useState<`0x${string}`>()
  const [faucetError, setFaucetError] = useState<Error | null>(null)

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
                Connect your wallet to claim free testnet tokens and manage exNEX
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

  const isLoading = isFaucetLoading && currentView === 'faucet'

  if (isLoading) {
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
      {/* Faucet Modal */}
      <MultiTransactionModal
        isOpen={modal.isOpen}
        onClose={modal.hide}
        transactionType={modal.transactionType}
        mainHash={faucetTxHash}
        isMainPending={isFaucetPending}
        isMainConfirming={isFaucetConfirming}
        isMainSuccess={isFaucetSuccess}
        isError={!!faucetError}
        error={faucetError}
        message="Requesting testnet tokens from faucet..."
      />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* View Tabs */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => setCurrentView('faucet')}
            className={`flex items-center gap-2 ${
              currentView === 'faucet'
                ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)]'
                : 'bg-[var(--charcoal)] hover:bg-[var(--charcoal)]/80 border border-[var(--metallic-silver)]/30'
            }`}
          >
            <Droplets className="h-4 w-4" />
            Faucet
          </Button>
          <Button
            onClick={() => setCurrentView('exnex')}
            className={`flex items-center gap-2 ${
              currentView === 'exnex'
                ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)]'
                : 'bg-[var(--charcoal)] hover:bg-[var(--charcoal)]/80 border border-[var(--metallic-silver)]/30'
            }`}
          >
            <Coins className="h-4 w-4" />
            exNEX
          </Button>
        </div>

        {/* Faucet View */}
        {currentView === 'faucet' && (
          <>
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="relative inline-block">
                <Droplets 
                  className="h-12 w-12 mx-auto drop-shadow-[0_0_16px_var(--neon-blue)]" 
                  style={{ color: 'var(--neon-blue)' }}
                />
                <div className="absolute -inset-4 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
              </div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--silver-light)' }}>
                Testnet Faucet
              </h1>
              <p className="text-base max-w-2xl mx-auto" style={{ color: 'var(--metallic-silver)' }}>
                Get free testnet tokens to start exploring and testing the Exhibition platform
              </p>
            </div>

            {/* Token Amounts Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)]/70 flex items-center justify-center">
                      <Coins className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--metallic-silver)' }}>
                        EXH Token
                      </p>
                      <p className="text-xl font-bold" style={{ color: 'var(--silver-light)' }}>
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

              <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-orange)]/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--metallic-silver)' }}>
                        exUSD Token
                      </p>
                      <p className="text-xl font-bold" style={{ color: 'var(--silver-light)' }}>
                        {exusdAmountFormatted}
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
            <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--metallic-silver)]/30 p-6 w-full max-w-3xl mx-auto">
              <div className="space-y-4">
                {/* Connected Wallet Info */}
                <div className="bg-[var(--charcoal)]/50 rounded-lg p-3 border border-[var(--metallic-silver)]/20">
                  <p className="text-xs mb-1" style={{ color: 'var(--metallic-silver)' }}>
                    Connected Wallet
                  </p>
                  <p className="font-mono text-xs sm:text-sm truncate" style={{ color: 'var(--silver-light)' }}>
                    {address}
                  </p>
                </div>

                {/* Cooldown Status */}
                {!canRequestFaucet && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" style={{ color: 'var(--neon-orange)' }} />
                        <span className="text-sm" style={{ color: 'var(--silver-light)' }}>Cooldown Active</span>
                      </div>
                      <span className="font-mono text-base font-bold" style={{ color: 'var(--neon-orange)' }}>
                        {formatCooldown(cooldownRemaining)}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--charcoal)] rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 h-2.5 rounded-full transition-all duration-1000"
                        style={{ width: `${cooldownPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-center" style={{ color: 'var(--metallic-silver)' }}>
                      Please wait for the cooldown to finish before requesting again
                    </p>
                  </div>
                )}

                {/* Success Message */}
                {isFaucetSuccess && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start space-x-2.5">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-400">Tokens Claimed Successfully!</p>
                      <p className="text-xs text-green-300/80 mt-1">
                        {exhAmountFormatted} EXH and {exusdAmountFormatted} exUSD have been sent to your wallet
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
                  className="w-full h-12 text-base bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] hover:from-[var(--neon-blue)]/90 hover:to-[var(--neon-orange)]/90 border-0 shadow-lg shadow-[var(--neon-blue)]/30"
                >
                  <Droplets className="h-4 w-4 mr-2" />
                  {canRequestFaucet ? 'Request Tokens' : `Wait ${formatCooldown(cooldownRemaining)}`}
                </Button>

                {/* Info Box */}
                <div className="bg-[var(--neon-blue)]/5 border border-[var(--neon-blue)]/20 rounded-lg p-3 flex items-start space-x-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--neon-blue)' }} />
                  <div className="space-y-1.5 text-xs" style={{ color: 'var(--metallic-silver)' }}>
                    <p className="font-semibold" style={{ color: 'var(--silver-light)' }}>Important Information:</p>
                    <ul className="space-y-0.5 list-disc list-inside">
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
            <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--neon-orange)]/10 border border-[var(--neon-blue)]/30 rounded-xl p-4 text-center">
              <p className="mb-3 text-sm" style={{ color: 'var(--silver-light)' }}>Ready to manage your exNEX tokens?</p>
              <Button
                onClick={() => setCurrentView('exnex')}
                className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] flex items-center gap-2 mx-auto"
              >
                Go to exNEX <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* exNEX View - Using the new component */}
        {currentView === 'exnex' && (
          <ExNEXInterface
            balance={exnexHook.balance}
            totalSupply={exnexHook.totalSupply}
            nexBalance={exnexHook.nexBalance}
            isLoading={exnexHook.isLoading}
            isSuccess={exnexHook.isSuccess}
            error={exnexHook.error}
            txHash={exnexHook.txHash}
            isPending={exnexHook.isPending}
            isConfirming={exnexHook.isConfirming}
            deposit={exnexHook.deposit}
            withdraw={exnexHook.withdraw}
            resetState={exnexHook.resetState}
          />
        )}
      </div>
    </>
  )
}