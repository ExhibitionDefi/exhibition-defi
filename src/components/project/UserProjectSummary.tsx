// src/components/project/UserProjectSummary.tsx
import React from 'react'
import { Wallet, Gift, CheckCircle, Clock, Calendar } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { ProjectDisplayData, UserProjectSummary as UserSummaryType } from '@/types/project'
import { ProjectStatus } from '@/types/project'
import { ExhibitionFormatters } from '@/utils/exFormatters'
import { useAccount } from 'wagmi'
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing'
import type { Address } from 'viem'

interface UserProjectSummaryProps {
  project: ProjectDisplayData
  userSummary: UserSummaryType
  onRefetch?: () => void
  // Finalize props
  canFinalize?: boolean
  finalizeButtonState?: {
    text: string
    disabled: boolean
  }
  finalizeIsLoading?: boolean
  onFinalize?: (projectId: bigint) => void
  // Claim tokens props - all passed from parent
  onClaimTokens?: () => void
  claimIsLoading?: boolean
  claimIsConfirming?: boolean
  claimIsConfirmed?: boolean
  claimError?: Error | null
  claimHash?: `0x${string}`
  // Vesting timing props - now using blockchain time
  timeUntilNextClaim?: number // seconds until next claim (from blockchain time)
  availableAmount?: bigint
}

export const UserProjectSummary: React.FC<UserProjectSummaryProps> = ({ 
  project, 
  userSummary, 
  canFinalize = false,
  finalizeButtonState,
  finalizeIsLoading = false,
  onFinalize,
  onClaimTokens,
  claimIsLoading = false,
  claimIsConfirming = false,
  claimIsConfirmed = false,
  claimError,
  claimHash,
  timeUntilNextClaim,
  availableAmount,
}) => {
  const { address } = useAccount()
  const { getTokenPriceUSD, isReady: isPricingReady } = useLocalPricing()

  // Calculate USD values
  const getUSDValue = (tokenAmount: bigint, decimals: number, tokenAddress?: string): string => {
    if (!isPricingReady || !tokenAddress) return ''
    
    try {
      const tokenPrice = getTokenPriceUSD(tokenAddress as Address)
      if (tokenPrice === 'N/A') return ''
      
      // Parse the price (remove $ and commas)
      const priceValue = parseFloat(tokenPrice.replace(/[$,]/g, ''))
      
      // Convert token amount to decimal
      const divisor = 10n ** BigInt(decimals)
      const tokenAmountDecimal = Number(tokenAmount) / Number(divisor)
      
      // Calculate USD value
      const usdValue = tokenAmountDecimal * priceValue
      
      return `$${usdValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    } catch (error) {
      return ''
    }
  }

  const contributionUSD = getUSDValue(
    userSummary.contributionAmount,
    project.contributionTokenDecimals || 18,
    project.contributionTokenAddress
  )

  const tokensOwedUSD = getUSDValue(
    userSummary.tokensOwed,
    18, // Assuming project tokens are 18 decimals
  )

  const tokensAvailableUSD = getUSDValue(
    userSummary.tokensAvailable,
    18,
  )

  // Calculate shouldShowFinalize BEFORE the early return
  const shouldShowFinalize = canFinalize && onFinalize && finalizeButtonState

  // Determine refund eligibility (for display only)
  const isRefundEligible = (
    Number(project.status) === ProjectStatus.Failed || 
    Number(project.status) === ProjectStatus.Refundable
  ) && !userSummary.userHasRefunded && userSummary.contributionAmount > 0n

  const canClaim = userSummary.canClaim && userSummary.tokensAvailable > 0n

  // Modified early return: Allow rendering if finalize button should show
  if (userSummary.contributionAmount === 0n && !userSummary.userHasRefunded && !shouldShowFinalize) {
    return null // Don't show summary if user hasn't participated AND finalize isn't available
  }

  // Format time remaining until next claim (using blockchain time)
  const formatTimeUntilNextClaim = (seconds: number | undefined): string => {
    if (seconds === undefined || seconds < 0) return 'N/A'
    if (seconds === 0) return 'Available now'
    
    const days = Math.floor(seconds / (60 * 60 * 24))
    const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60))
    const minutes = Math.floor((seconds % (60 * 60)) / 60)
    
    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return 'Less than 1m'
    }
  }

  return (
    <Card hover className="border border-[var(--charcoal)] bg-[var(--deep-black)]">
      {/* Header with Logo */}
      <div className="flex items-center space-x-3 mb-4">
        {project.projectTokenLogoURI && (
          <img
            src={project.projectTokenLogoURI}
            alt={`${project.tokenName} logo`}
            className="w-10 h-10 rounded-lg object-cover border border-[var(--metallic-silver)]/20 flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <h3 className="text-lg font-semibold flex items-center" style={{ color: 'var(--silver-light)' }}>
          <Wallet className="h-5 w-5 mr-2" />
          {userSummary.contributionAmount > 0n ? 'Your Participation' : 'Launch Actions'}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Only show contribution section if user participated */}
        {userSummary.contributionAmount > 0n && (
          <>
            {/* Contribution Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm" style={{ color: 'var(--silver-dark)' }}>Your Contribution</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--silver-light)' }}>
                  {contributionUSD || ExhibitionFormatters.formatTokenWithSymbol(
                    userSummary.contributionAmount,
                    project.contributionTokenSymbol || 'Tokens',
                    project.contributionTokenDecimals,
                  )}
                </p>
                {contributionUSD && (
                  <p className="text-xs" style={{ color: 'var(--silver-dark)' }}>
                    {ExhibitionFormatters.formatTokenWithSymbol(
                      userSummary.contributionAmount,
                      project.contributionTokenSymbol || 'Tokens',
                      project.contributionTokenDecimals,
                    )}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm" style={{ color: 'var(--silver-dark)' }}>Tokens Owed</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--silver-light)' }}>
                  {ExhibitionFormatters.formatTokenWithSymbol(
                    userSummary.tokensOwed,
                    project.tokenSymbol || 'Tokens',
                    18
                  )}
                </p>
                {tokensOwedUSD && (
                  <p className="text-xs" style={{ color: 'var(--silver-dark)' }}>
                    ≈ {tokensOwedUSD}
                  </p>
                )}
              </div>
            </div>

            {/* Vesting Information */}
            {userSummary.tokensOwed > 0n && (
              <div className="border-t pt-4" style={{ borderColor: 'var(--charcoal)' }}>
                <h4 className="font-medium mb-3" style={{ color: 'var(--silver-light)' }}>Token Vesting</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p style={{ color: 'var(--silver-dark)' }}>Vested</p>
                    <p className="font-medium" style={{ color: 'var(--silver-light)' }}>
                      {ExhibitionFormatters.formatLargeNumber(userSummary.tokensVested)}
                    </p>
                  </div>
                  
                  <div>
                    <p style={{ color: 'var(--silver-dark)' }}>Claimed</p>
                    <p className="font-medium" style={{ color: 'var(--silver-light)' }}>
                      {ExhibitionFormatters.formatLargeNumber(userSummary.tokensClaimed)}
                    </p>
                  </div>
                  
                  <div>
                    <p style={{ color: 'var(--silver-dark)' }}>Available</p>
                    <p className="font-medium" style={{ color: 'var(--neon-blue)' }}>
                      {ExhibitionFormatters.formatLargeNumber(userSummary.tokensAvailable)}
                    </p>
                    {tokensAvailableUSD && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--silver-dark)' }}>
                        ≈ {tokensAvailableUSD}
                      </p>
                    )}
                  </div>
                </div>

                {/* Next Claim Information - Updated to use blockchain time */}
                {timeUntilNextClaim !== undefined && timeUntilNextClaim > 0 && userSummary.tokensAvailable === 0n && (
                  <div className="p-3 rounded-lg border" style={{ 
                    backgroundColor: 'rgba(21, 198, 230, 0.05)',
                    borderColor: 'rgba(21, 198, 230, 0.2)'
                  }}>
                    <div className="flex items-start space-x-2">
                      <Calendar className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--neon-blue)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--neon-blue)' }}>
                          Next Claim Available In
                        </p>
                        <div className="mt-1 space-y-1">
                          <p className="text-xs" style={{ color: 'var(--silver-dark)' }}>
                            Time: <span className="font-medium" style={{ color: 'var(--silver-light)' }}>
                              {formatTimeUntilNextClaim(timeUntilNextClaim)}
                            </span>
                          </p>
                          {availableAmount !== undefined && availableAmount > 0n && (
                            <p className="text-xs" style={{ color: 'var(--silver-dark)' }}>
                              Estimated Amount: <span className="font-medium" style={{ color: 'var(--silver-light)' }}>
                                {ExhibitionFormatters.formatLargeNumber(availableAmount)} {project.tokenSymbol}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Status Information & Actions */}
        <div className={`${userSummary.contributionAmount > 0n ? 'border-t pt-4' : ''} space-y-2`} style={{ borderColor: 'var(--charcoal)' }}>
          {/* Refund Status (Display Only) */}
          {userSummary.userHasRefunded && (
            <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ 
              color: 'var(--neon-blue)', 
              backgroundColor: 'rgba(21, 198, 230, 0.1)' 
            }}>
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Refund Processed</span>
            </div>
          )}

          {/* Refund Eligible Notice (Display Only) */}
          {isRefundEligible && (
            <div className="p-3 rounded-lg border" style={{ 
              backgroundColor: 'rgba(250, 126, 9, 0.1)', 
              borderColor: 'var(--neon-orange)',
              color: 'var(--neon-orange)'
            }}>
              <p className="text-sm font-medium">
                ⚠️ Refund Available - Use the dedicated refund section to request your refund
              </p>
            </div>
          )}

          {/* Claim Success Message */}
          {claimIsConfirmed && (
            <div className="flex items-center space-x-2 p-3 rounded-lg" style={{ 
              color: 'var(--neon-blue)', 
              backgroundColor: 'rgba(21, 198, 230, 0.1)' 
            }}>
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Tokens Claimed Successfully!</span>
            </div>
          )}

          {/* Claim Error */}
          {claimError && (
            <div className="p-3 border rounded-lg" style={{ 
              backgroundColor: 'rgba(250, 126, 9, 0.1)', 
              borderColor: 'var(--neon-orange)' 
            }}>
              <p className="text-sm" style={{ color: 'var(--neon-orange)' }}>
                {claimError.message || 'Transaction failed'}
              </p>
            </div>
          )}

          {/* Claim Button */}
          {canClaim && onClaimTokens && (
            <Button
              onClick={onClaimTokens}
              className="w-full"
              isLoading={claimIsLoading}
              disabled={claimIsLoading || claimIsConfirming}
            >
              <Gift className="h-4 w-4 mr-2" />
              {claimIsConfirming 
                ? 'Confirming...' 
                : `Claim ${ExhibitionFormatters.formatLargeNumber(userSummary.tokensAvailable)} Tokens${tokensAvailableUSD ? ` (≈${tokensAvailableUSD})` : ''}`
              }
            </Button>
          )}

          {/* Transaction Hash Display */}
          {claimHash && (
            <div className="mt-2 p-2 rounded text-xs" style={{ backgroundColor: 'var(--charcoal)' }}>
              <p style={{ color: 'var(--silver-dark)' }}>Transaction Hash:</p>
              <p className="font-mono break-all" style={{ color: 'var(--silver-light)' }}>{claimHash}</p>
            </div>
          )}

          {/* FINALIZE PROJECT BUTTON */}
          {shouldShowFinalize && (
            <div className={`${userSummary.contributionAmount > 0n ? 'border-t' : ''} pt-4`} style={{ borderColor: 'var(--charcoal)' }}>
              <div className="flex items-center space-x-2 mb-3 p-3 rounded-lg" style={{ 
                backgroundColor: 'rgba(250, 126, 9, 0.1)', 
                borderLeft: '3px solid var(--neon-orange)'
              }}>
                <Clock className="h-5 w-5" style={{ color: 'var(--neon-orange)' }} />
                <div>
                  <p className="font-medium" style={{ color: 'var(--neon-orange)' }}>Funding Period Ended</p>
                  <p className="text-xs" style={{ color: 'var(--silver-dark)' }}>
                    {userSummary.contributionAmount === 0n 
                      ? 'Anyone can help finalize this Launch'
                      : 'Help finalize this Launch'}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => onFinalize?.(project.id)}
                disabled={finalizeButtonState.disabled || !address}
                className="w-full"
                isLoading={finalizeIsLoading}
              >
                <Clock className="h-4 w-4 mr-2" />
                {!address 
                  ? 'Connect Wallet to Finalize'
                  : finalizeButtonState.text
                }
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}