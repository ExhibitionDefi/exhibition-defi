// src/components/faucet/FaucetButton.tsx
import React from 'react'
import { Droplets, Clock } from 'lucide-react'
import { useAccount } from 'wagmi'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { useFaucet } from '../../hooks/utilities/useFaucet'

export const FaucetButton: React.FC = () => {
  const { isConnected } = useAccount()
  const {
    canRequestFaucet,
    cooldownRemaining,
    requestFaucetTokens,
    isTransactionPending,
    isTransactionConfirming,
  } = useFaucet()

  const formatCooldown = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  if (!isConnected) {
    return null
  }

  const isLoading = isTransactionPending || isTransactionConfirming

  return (
    <Link to="/faucet">
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          // Allow navigation to faucet page
          // If user wants to claim directly from button, prevent navigation
          if (canRequestFaucet && !isLoading) {
            e.preventDefault()
            requestFaucetTokens()
          }
        }}
        disabled={isLoading}
        isLoading={isLoading}
        loadingText="Claiming..."
        className="border-[var(--neon-blue)]/50 hover:bg-[var(--neon-blue)]/10 hover:border-[var(--neon-blue)] transition-all duration-300"
      >
        <Droplets className="h-4 w-4 mr-2" />
        {!canRequestFaucet ? (
          <span className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatCooldown(cooldownRemaining)}
          </span>
        ) : (
          'Faucet'
        )}
      </Button>
    </Link>
  )
}