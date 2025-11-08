import React from 'react'
import { Wallet, Gift, CheckCircle, Clock } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useClaimTokens } from '@/hooks/pad/useClaimTokens'
import type { ProjectDisplayData, UserProjectSummary as UserSummaryType } from '@/types/project'
import { ProjectStatus } from '@/types/project'
import { ExhibitionFormatters } from '@/utils/exFormatters'
import { useAccount } from 'wagmi'

interface UserProjectSummaryProps {
  project: ProjectDisplayData
  userSummary: UserSummaryType
  onRefetch?: () => void
  // Finalize props
  canFinalize?: boolean
  finalizeButtonState?: {
    text: string
    disabled: boolean
    loading: boolean
  }
  onFinalize?: (projectId: bigint) => Promise<void>
}

export const UserProjectSummary: React.FC<UserProjectSummaryProps> = ({ 
  project, 
  userSummary, 
  onRefetch,
  canFinalize = false,
  finalizeButtonState,
  onFinalize,
}) => {
  const { address } = useAccount()
  
  // Only use claim tokens hook - refund is handled in separate component
  const {
    claimTokens,
    hash: claimHash,
    isLoading: isClaimLoading,
    isConfirming: isClaimConfirming,
    isConfirmed: isClaimConfirmed,
    error: claimError,
  } = useClaimTokens({
    project,
    onConfirmed: onRefetch,
    showToast: true,
  })

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

  return (
    <Card>
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
          {userSummary.contributionAmount > 0n ? 'Your Participation' : 'Project Actions'}
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
                  {ExhibitionFormatters.formatTokenWithSymbol(
                    userSummary.contributionAmount,
                    project.contributionTokenSymbol || 'Tokens',
                    project.contributionTokenDecimals,
                  )}
                </p>
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
              </div>
            </div>

            {/* Vesting Information */}
            {userSummary.tokensOwed > 0n && (
              <div className="border-t pt-4" style={{ borderColor: 'var(--charcoal)' }}>
                <h4 className="font-medium mb-3" style={{ color: 'var(--silver-light)' }}>Token Vesting</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                  </div>
                </div>
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
          {isClaimConfirmed && (
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
          {canClaim && (
            <Button
              onClick={claimTokens}
              className="w-full"
              isLoading={isClaimLoading}
              disabled={isClaimLoading || isClaimConfirming}
            >
              <Gift className="h-4 w-4 mr-2" />
              {isClaimConfirming 
                ? 'Confirming...' 
                : `Claim ${ExhibitionFormatters.formatLargeNumber(userSummary.tokensAvailable)} Tokens`
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
                      ? 'Anyone can help finalize this project'
                      : 'Help finalize this project'}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={() => onFinalize(project.id)}
                disabled={finalizeButtonState.disabled || !address}
                className="w-full"
                isLoading={finalizeButtonState.loading}
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