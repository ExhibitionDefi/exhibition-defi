// src/pages/FaucetPage.tsx
import React from 'react'
import { useAccount } from 'wagmi'
import { Droplets, Clock, Wallet, Coins, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useFaucet } from '../hooks/useFaucet'

export const FaucetPage: React.FC = () => {
  const { isConnected, address } = useAccount()
  const {
    exhAmountFormatted,
    usdtAmountFormatted,
    canRequestFaucet,
    cooldownRemaining,
    cooldownPercentage,
    requestFaucetTokens,
    isTransactionPending,
    isTransactionConfirming,
    isTransactionSuccess,
    isLoading,
  } = useFaucet()

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
                Connect your wallet to claim free testnet tokens
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
    <div className="max-w-4xl mx-auto space-y-8">
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
          {isTransactionSuccess && (
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
            onClick={requestFaucetTokens}
            disabled={!canRequestFaucet || isTransactionPending || isTransactionConfirming}
            isLoading={isTransactionPending || isTransactionConfirming}
            loadingText={isTransactionPending ? "Requesting..." : "Confirming..."}
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

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center p-6 bg-gradient-to-br from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 border border-[var(--neon-blue)]/20">
          <Droplets className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--neon-blue)' }} />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
            Free Tokens
          </h3>
          <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
            Get testnet tokens at no cost to explore the platform
          </p>
        </Card>

        <Card className="text-center p-6 bg-gradient-to-br from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 border border-[var(--neon-orange)]/20">
          <Clock className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--neon-orange)' }} />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
            Cooldown Period
          </h3>
          <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
            Wait for the cooldown to request tokens again
          </p>
        </Card>

        <Card className="text-center p-6 bg-gradient-to-br from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 border border-[var(--metallic-silver)]/20">
          <Coins className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--silver-light)' }} />
          <h3 className="font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
            Test & Explore
          </h3>
          <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
            Use tokens to contribute to projects and test features
          </p>
        </Card>
      </div>
    </div>
  )
}