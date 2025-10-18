import React from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { formatUnits } from 'viem'

interface WithdrawUnsoldTokensCardProps {
  projectId: bigint
  tokenSymbol?: string
  tokenDecimals?: number
  buttonState: {
    text: string
    disabled: boolean
    loading: boolean
  }
  isWithdrawalUnlocked: boolean
  withdrawalUnlocksAt: Date
  unsoldTokensAmount: bigint
  tokensForSale: bigint
  tokensAllocated: bigint
  hasWithdrawn?: boolean // ✅ NEW: Flag to track if withdrawal was successful
  txHash?: `0x${string}` // ✅ NEW: Optional transaction hash
  onWithdraw: () => void
}

export const WithdrawUnsoldTokensCard: React.FC<WithdrawUnsoldTokensCardProps> = ({
  projectId,
  tokenSymbol = 'TOKEN',
  tokenDecimals = 18,
  buttonState,
  isWithdrawalUnlocked,
  withdrawalUnlocksAt,
  unsoldTokensAmount,
  tokensForSale,
  tokensAllocated,
  hasWithdrawn = false, // ✅ Default to false
  txHash,
  onWithdraw,
}) => {
  const formattedUnsoldTokens = formatUnits(unsoldTokensAmount, tokenDecimals)
  const formattedTokensForSale = formatUnits(tokensForSale, tokenDecimals)
  const formattedTokensAllocated = formatUnits(tokensAllocated, tokenDecimals)
  
  return (
    <Card className="border-[var(--charcoal)] bg-[var(--deep-black)]">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-1">
              Withdraw Unsold Tokens
            </h3>
            <p className="text-sm text-[var(--silver-dark)]">
              Reclaim any unsold {tokenSymbol} tokens from the project
            </p>
          </div>
        </div>

        {/* Token Statistics */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-[var(--charcoal)] rounded-lg">
          <div>
            <p className="text-xs text-[var(--silver-dark)] mb-1">For Sale</p>
            <p className="text-sm font-medium text-[var(--silver-light)]">
              {parseFloat(formattedTokensForSale).toLocaleString(undefined, { 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--silver-dark)] mb-1">Allocated</p>
            <p className="text-sm font-medium text-[var(--silver-light)]">
              {parseFloat(formattedTokensAllocated).toLocaleString(undefined, { 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--silver-dark)] mb-1">Unsold</p>
            <p className="text-sm font-medium text-[var(--neon-blue)]">
              {parseFloat(formattedUnsoldTokens).toLocaleString(undefined, { 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
        </div>

        {/* Status Section */}
        <div className="space-y-3">
          {/* ✅ Withdrawal Success Banner */}
          {hasWithdrawn && (
            <div className="flex items-start space-x-3 p-4 bg-[var(--charcoal)] rounded-lg border-2 border-[var(--neon-blue)]">
              <CheckCircle2 className="h-5 w-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--neon-blue)] mb-1">
                  Withdrawal Successful!
                </p>
                <p className="text-xs text-[var(--silver-dark)]">
                  {parseFloat(formattedUnsoldTokens).toLocaleString(undefined, { 
                    maximumFractionDigits: 2 
                  })} {tokenSymbol} tokens have been returned to your wallet
                </p>
                {txHash && (
                  <div className="mt-2 p-2 bg-[var(--deep-black)] rounded">
                    <p className="text-xs text-[var(--silver-dark)] mb-1">Transaction Hash:</p>
                    <p className="text-xs font-mono text-[var(--silver-light)] break-all">
                      {txHash}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Withdrawal Lock Status */}
          {!hasWithdrawn && !isWithdrawalUnlocked && (
            <div className="flex items-start space-x-3 p-4 bg-[var(--charcoal)] rounded-lg border border-[var(--neon-orange)] border-opacity-30">
              <Clock className="h-5 w-5 text-[var(--neon-orange)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--silver-light)] mb-1">
                  Withdrawal Locked
                </p>
                <p className="text-xs text-[var(--silver-dark)]">
                  Available after 1-day timelock period
                </p>
                <p className="text-sm text-[var(--neon-orange)] mt-2 font-medium">
                  Unlocks: {withdrawalUnlocksAt.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Withdrawal Unlocked */}
          {!hasWithdrawn && isWithdrawalUnlocked && (
            <div className="flex items-start space-x-3 p-4 bg-[var(--charcoal)] rounded-lg border border-[var(--neon-blue)] border-opacity-30">
              <CheckCircle2 className="h-5 w-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--silver-light)] mb-1">
                  Withdrawal Available
                </p>
                <p className="text-xs text-[var(--silver-dark)]">
                  You can now withdraw {parseFloat(formattedUnsoldTokens).toLocaleString(undefined, { 
                    maximumFractionDigits: 2 
                  })} {tokenSymbol} tokens
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!hasWithdrawn && (
            <div className="bg-gradient-to-r from-[var(--charcoal)] to-transparent p-4 rounded-lg border border-[var(--silver-dark)] border-opacity-20">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-[var(--silver-light)]">
                    <span className="font-semibold">Withdrawal conditions:</span>
                  </p>
                  <ul className="text-xs text-[var(--silver-dark)] space-y-1 pl-4 list-disc">
                    <li>Project must have ended</li>
                    <li>1-day timelock period must have passed</li>
                    <li>Available for failed projects or when hard cap not reached</li>
                    <li>Unsold tokens will be returned to your wallet</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {!hasWithdrawn && (
          <div className="pt-2">
            <Button
              onClick={onWithdraw}
              className="w-full"
              disabled={buttonState.disabled}
              isLoading={buttonState.loading}
            >
              {buttonState.text}
            </Button>
          </div>
        )}

        {/* Already Withdrawn Message */}
        {hasWithdrawn && (
          <div className="pt-2 text-center">
            <p className="text-sm text-[var(--silver-dark)]">
              All unsold tokens have been withdrawn
            </p>
          </div>
        )}

        {/* Additional Info */}
        <div className="text-xs text-[var(--silver-dark)] text-center">
          Project ID: #{projectId.toString()}
        </div>
      </div>
    </Card>
  )
}