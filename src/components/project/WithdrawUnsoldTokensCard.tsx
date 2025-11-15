// src/components/project/WithdrawUnsoldTokensCard.tsx
import React, { useMemo, useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react'
import { formatUnits } from 'viem'
import { SafeHtml, SafeAddressDisplay } from '../SafeHtml'
import { sanitizeText } from '../../utils/sanitization'

interface WithdrawUnsoldTokensCardProps {
  projectId: bigint
  tokenSymbol?: string
  tokenDecimals?: number
  projectTokenLogoURI?: string
  tokenName?: string
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
  hasWithdrawn?: boolean
  txHash?: `0x${string}`
  onWithdraw: () => void
  projectStatus?: number
  withdrawnAmount?: bigint // Amount that was actually withdrawn
}

export const WithdrawUnsoldTokensCard: React.FC<WithdrawUnsoldTokensCardProps> = ({
  projectId,
  tokenSymbol = 'TOKEN',
  tokenDecimals = 18,
  projectTokenLogoURI,
  tokenName,
  buttonState,
  isWithdrawalUnlocked,
  withdrawalUnlocksAt,
  unsoldTokensAmount,
  tokensForSale,
  tokensAllocated,
  hasWithdrawn = false,
  txHash,
  onWithdraw,
  projectStatus,
  withdrawnAmount,
}) => {

  const [savedWithdrawnAmount, setSavedWithdrawnAmount] = useState<bigint | null>(null)
  useEffect(() => {
    if (hasWithdrawn && savedWithdrawnAmount === null && withdrawnAmount && withdrawnAmount > 0n) {
      setSavedWithdrawnAmount(withdrawnAmount)
      console.log('💾 Saved withdrawn amount:', withdrawnAmount.toString())
    }
  }, [hasWithdrawn, withdrawnAmount, savedWithdrawnAmount])

  // ✅ Sanitize token symbol for display
  const safeTokenSymbol = useMemo(() => 
    sanitizeText(tokenSymbol), 
    [tokenSymbol]
  )

  // ✅ Format amounts safely
  const formattedUnsoldTokens = formatUnits(unsoldTokensAmount, tokenDecimals)
  const formattedTokensForSale = formatUnits(tokensForSale, tokenDecimals)
  const formattedTokensAllocated = formatUnits(tokensAllocated, tokenDecimals)
  
  // ✅ Format withdrawn amount (use this for success message)
  const amountForDisplay = savedWithdrawnAmount !== null ? savedWithdrawnAmount : (withdrawnAmount || unsoldTokensAmount)
  const formattedWithdrawnAmount = formatUnits(amountForDisplay, tokenDecimals)

  // ✅ Check if project is failed/refundable (status 5 or 6)
  const isFailedProject = projectStatus === 5 || projectStatus === 6

  // ✅ Safe number formatting helper
  const formatDisplayNumber = (value: string, maxDecimals: number = 2) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '0'
    return num.toLocaleString(undefined, {
      maximumFractionDigits: maxDecimals,
    })
  }

  // ✅ Safe date formatting
  const formattedUnlockDate = useMemo(() => {
    try {
      return withdrawalUnlocksAt.toLocaleString()
    } catch {
      return 'Invalid date'
    }
  }, [withdrawalUnlocksAt])

  // ✅ Safe project ID display
  const safeProjectId = useMemo(() => {
    try {
      return projectId.toString()
    } catch {
      return 'Unknown'
    }
  }, [projectId])
  
  return (
    <Card className="border-[var(--charcoal)] bg-[var(--deep-black)]">
      <div className="space-y-4">
        {/* Header with Logo */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {projectTokenLogoURI && (
              <img
                src={projectTokenLogoURI}
                alt={`${tokenName || tokenSymbol} logo`}
                className="w-10 h-10 rounded-lg object-cover border border-[var(--metallic-silver)]/20 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-1">
                Withdraw Unsold Tokens
              </h3>
              <SafeHtml 
                content={`Reclaim any unsold ${safeTokenSymbol} tokens from the project`}
                as="p"
                className="text-sm text-[var(--silver-dark)]"
              />
            </div>
          </div>
        </div>

        {/* Token Statistics - Updated to show correct data based on project status */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-[var(--charcoal)] rounded-lg">
          <div>
            <p className="text-xs text-[var(--silver-dark)] mb-1">For Sale</p>
            <p className="text-sm font-medium text-[var(--silver-light)]">
              {formatDisplayNumber(formattedTokensForSale)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--silver-dark)] mb-1">
              {isFailedProject ? 'Sold' : 'Allocated'}
            </p>
            <p className="text-sm font-medium text-[var(--silver-light)]">
              {formatDisplayNumber(formattedTokensAllocated)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--silver-dark)] mb-1">
              {isFailedProject ? 'To Return' : 'Unsold'}
            </p>
            <p className="text-sm font-medium text-[var(--neon-blue)]">
              {formatDisplayNumber(formattedUnsoldTokens)}
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
                <SafeHtml 
                  content={`${formatDisplayNumber(formattedWithdrawnAmount)} ${safeTokenSymbol} tokens have been returned to your wallet`}
                  as="p"
                  className="text-xs text-[var(--silver-dark)]"
                />
                {txHash && (
                  <div className="mt-2 p-2 bg-[var(--deep-black)] rounded">
                    <p className="text-xs text-[var(--silver-dark)] mb-1">Transaction Hash:</p>
                    <SafeAddressDisplay 
                      address={txHash}
                      truncate={true}
                      className="text-xs text-[var(--silver-light)]"
                      onCopySuccess={() => console.log('Transaction hash copied!')}
                    />
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
                <SafeHtml 
                  content={`Unlocks: ${formattedUnlockDate}`}
                  as="p"
                  className="text-sm text-[var(--neon-orange)] mt-2 font-medium"
                />
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
                <SafeHtml 
                  content={`You can now withdraw ${formatDisplayNumber(formattedUnsoldTokens)} ${safeTokenSymbol} tokens`}
                  as="p"
                  className="text-xs text-[var(--silver-dark)]"
                />
              </div>
            </div>
          )}

          {/* Info Box - Updated messaging based on project status */}
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
                    {isFailedProject ? (
                      <>
                        <li>Project failed to reach soft cap</li>
                        <li>All tokens for sale will be returned to your wallet</li>
                      </>
                    ) : (
                      <>
                        <li>Available when hard cap not reached</li>
                        <li>Only unsold tokens will be returned to your wallet</li>
                      </>
                    )}
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
              {isFailedProject 
                ? 'All tokens have been returned' 
                : 'All unsold tokens have been withdrawn'
              }
            </p>
          </div>
        )}

        {/* Additional Info */}
        <div className="text-xs text-[var(--silver-dark)] text-center">
          <SafeHtml 
            content={`Project ID: #${safeProjectId}`}
            as="span"
          />
        </div>
      </div>
    </Card>
  )
}