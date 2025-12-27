// src/components/project/ProjectDetails.tsx
import React, { useState } from 'react'
import { Calendar, Clock, TrendingUp, Info, Copy, Check } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import { ProjectMetadata } from './ProjectMetadata'
import { type ProjectDisplayData, ProjectStatus, ProjectStatusLabels } from '../../types/project'
import { ExhibitionFormatters } from '../../utils/exFormatters'
import { formatTimeRemaining } from '../../utils/timeHelpers'
import { SafeHtml, SafeImage } from '../SafeHtml'
import { logger } from '@/utils/logger'
import { useBlockchainTime } from '../../hooks/utilities/useBlockchainTime'
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing'
import type { Address } from 'viem'

interface ProjectDetailsProps {
  project: ProjectDisplayData
  isProjectOwner?: boolean
  hasDepositedProjectTokens?: boolean
}

const calculateTimeRemaining = (endTime: number, currentTime: number): number => {
  const remaining = endTime - currentTime
  return remaining > 0 ? remaining : 0
}

const calculateTimeUntilStart = (startTime: number, currentTime: number): number => {
  const until = startTime - currentTime
  return until > 0 ? until : 0
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ 
  project, 
  isProjectOwner = false, 
  hasDepositedProjectTokens = false 
}) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const { getTokenPrice, isReady: isPricingReady } = useLocalPricing({
    maxHops: 4,
    refetchInterval: 30_000,
  })

  const formatTokenWithUSD = (
    amount: bigint,
    tokenSymbol: string,
    tokenAddress: Address,
    decimals: number
  ) => {
    const tokenFormatted = ExhibitionFormatters.formatTokenWithSymbol(
      amount,
      tokenSymbol,
      decimals
    )

    if (!isPricingReady) {
      return <span className="font-medium text-[var(--silver-light)]">{tokenFormatted}</span>
    }

    const price = getTokenPrice(tokenAddress)
    if (price === null) {
      return <span className="font-medium text-[var(--silver-light)]">{tokenFormatted}</span>
    }

    const amountNumber = Number(amount) / Math.pow(10, decimals)
    const usdValue = amountNumber * price

    const formattedUSD = usdValue >= 1_000_000 
      ? `$${(usdValue / 1_000_000).toFixed(2)}M`
      : usdValue >= 1_000
      ? `$${(usdValue / 1_000).toFixed(2)}K`
      : `$${usdValue.toFixed(2)}`

    return (
      <div className="flex flex-col items-end">
        <span className="font-medium text-[var(--silver-light)]">{tokenFormatted}</span>
        <span className="text-xs text-[var(--metallic-silver)]">{formattedUSD}</span>
      </div>
    )
  }

  const formatTokenPriceWithUSD = (
    priceInContributionToken: bigint,
    projectTokenSymbol: string,
    contributionTokenSymbol: string,
    contributionTokenAddress: Address
  ) => {
    const priceFormatted = ExhibitionFormatters.formatTokenPrice(
      priceInContributionToken,
      projectTokenSymbol,
      contributionTokenSymbol
    )

    if (!isPricingReady) {
      return <span className="font-medium text-[var(--silver-light)]">{priceFormatted}</span>
    }

    const contributionTokenPrice = getTokenPrice(contributionTokenAddress)
    if (contributionTokenPrice === null) {
      return <span className="font-medium text-[var(--silver-light)]">{priceFormatted}</span>
    }

    const priceNumber = Number(priceInContributionToken) / 1e18
    const usdPrice = priceNumber * contributionTokenPrice

    return (
      <div className="flex flex-col items-end">
        <span className="font-medium text-[var(--silver-light)]">{priceFormatted}</span>
        <span className="text-xs text-[var(--metallic-silver)]">
          ~${usdPrice.toFixed(4)}
        </span>
      </div>
    )
  }

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      logger.error('Failed to copy:', err)
    }
  }

  const CopyableAddress: React.FC<{ address: string }> = ({ address }) => {
    const isCopied = copiedAddress === address
    const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
    return (
      <button
        onClick={() => copyToClipboard(address)}
        className="group inline-flex items-center space-x-1.5 font-mono text-xs text-[var(--neon-blue)] hover:text-[var(--neon-blue)]/80 transition-colors cursor-pointer underline decoration-[var(--neon-blue)]/30 hover:decoration-[var(--neon-blue)]/60"
        title="Click to copy full address"
      >
        <span>{displayAddress}</span>
        {isCopied ? (
          <Check className="h-3 w-3 flex-shrink-0" />
        ) : (
          <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        )}
      </button>
    )
  }

  const getStatusVariant = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Active:
        return 'success'
      case ProjectStatus.Upcoming:
        return 'info'
      case ProjectStatus.Successful:
      case ProjectStatus.Completed:
        return 'success'
      case ProjectStatus.Failed:
      case ProjectStatus.Refundable:
        return 'error'
      default:
        return 'default'
    }
  }

  const progressPercentage = Number(project.progressPercentage) / 100
  const isLive = project.status === ProjectStatus.Active

  const { timestampNumber: now } = useBlockchainTime()
  const hasStarted = now >= Number(project.startTime)
  const hasEnded = now >= Number(project.endTime)
  const isActive = project.status === ProjectStatus.Active
  const isUpcoming = project.status === ProjectStatus.Upcoming
  const isSuccessful = project.status === ProjectStatus.Successful
  const isClaimable = project.status === ProjectStatus.Claimable
  const isFailed = project.status === ProjectStatus.Failed
  const isRefundable = project.status === ProjectStatus.Refundable
  
  const isFundingEnded = isActive && hasEnded

  const showOwnerMessage = isProjectOwner && (isActive || isUpcoming)
  const showUserMessage = !isProjectOwner && (isActive || isUpcoming || isSuccessful || isClaimable || isFundingEnded || isFailed || isRefundable)

  type MessageVariant = 'info' | 'success' | 'warning' | 'error';

  const getOwnerMessage = () => {
    if (isSuccessful || isClaimable) {
      return {
        main: 'Project Successful! 🎉',
        sub: 'See below for next steps: deposit liquidity tokens and finalize liquidity.',
        variant: 'success' as const
      }
    }
    
    if (isFailed || isRefundable) {
      return {
        main: 'Project did not reach its funding goal.',
        sub: 'Contributors can request refunds. You can withdraw unsold tokens after the lock period.',
        variant: 'error' as const
      }
    }
    
    if (isFundingEnded) {
      return {
        main: 'Funding period has ended.',
        sub: 'Please finalize your launch to proceed with the next steps.',
        variant: 'warning' as const
      }
    }
    
    if (isUpcoming && !hasStarted) {
      if (hasDepositedProjectTokens === false) {
        return {
          main: '⚠️ Action Required: Deposit Project Tokens',
          sub: 'You must deposit the required launch tokens before the sale can begin. See the deposit card below.',
          variant: 'warning' as MessageVariant
        }
      }
      return {
        main: 'Your project is scheduled and ready to launch!',
        sub: 'Contributions will begin soon based on blockchain time.',
        variant: 'info' as MessageVariant
      }
    }
    if (isActive && !hasStarted) {
      return {
        main: 'Your launch is active but has not started yet.',
        sub: 'Contributions will open soon.',
        variant: 'info' as const
      }
    }
    if (isActive && hasStarted && !hasEnded) {
      return {
        main: 'Your launch is live and accepting contributions!',
        sub: 'As the token owner, you cannot contribute to your own token launch.',
        variant: 'success' as const
      }
    }
    return null
  }

  const getUserMessage = () => {
    if (isSuccessful || isClaimable) {
      return {
        main: 'Launch Successful! 🎉',
        sub: 'This launch has reached its funding goal. If you contributed, you can claim your tokens!',
        variant: 'success' as const
      }
    }
    
    if (isFailed || isRefundable) {
      return {
        main: 'Launch did not reach its funding goal.',
        sub: 'If you contributed, you can request a refund of your contribution.',
        variant: 'error' as const
      }
    }
    
    if (isFundingEnded) {
      return {
        main: 'Funding period has ended.',
        sub: 'Finalization is pending. Connect a wallet to finalize and view the outcome.',
        variant: 'info' as const
      }
    }
    
    if (isUpcoming || (isActive && !hasStarted)) {
      return {
        main: 'This launch has not started yet.',
        sub: 'Contributions will open soon. Check the countdown below.',
        variant: 'info' as const
      }
    }
    if (isActive && hasStarted && !hasEnded) {
      return {
        main: 'This launch is live and accepting contributions!',
        sub: 'Connect your wallet to participate in this launch.',
        variant: 'success' as const
      }
    }
    return null
  }

  const ownerMessage = getOwnerMessage()
  const userMessage = getUserMessage()

  return (
    <div className="space-y-4">
      {/* Status Banner - Moved to top for visibility */}
      {(showOwnerMessage && ownerMessage) && (
        <Card hover className="border-l-4" style={{
          borderLeftColor: ownerMessage.variant === 'success' ? 'var(--neon-blue)' :
                          ownerMessage.variant === 'warning' ? 'var(--neon-orange)' :
                          ownerMessage.variant === 'error' ? 'var(--neon-orange)' :
                          'var(--metallic-silver)'
        }}>
          <div className="space-y-1">
            <p className={`text-base font-semibold ${
              ownerMessage.variant === 'success' ? 'text-[var(--neon-blue)]' :
              ownerMessage.variant === 'warning' ? 'text-[var(--neon-orange)]' :
              ownerMessage.variant === 'error' ? 'text-[var(--neon-orange)]' :
              'text-[var(--silver-light)]'
            }`}>
              {ownerMessage.main}
            </p>
            <p className="text-xs text-[var(--metallic-silver)]">
              {ownerMessage.sub}
            </p>
          </div>
        </Card>
      )}

      {(showUserMessage && userMessage) && (
        <Card hover className="border-l-4" style={{
          borderLeftColor: userMessage.variant === 'success' ? 'var(--neon-blue)' :
                          userMessage.variant === 'info' ? 'var(--neon-orange)' :
                          userMessage.variant === 'error' ? 'var(--neon-orange)' :
                          'var(--metallic-silver)'
        }}>
          <div className="space-y-1">
            <p className={`text-base font-semibold ${
              userMessage.variant === 'success' ? 'text-[var(--neon-blue)]' :
              userMessage.variant === 'info' ? 'text-[var(--neon-orange)]' :
              userMessage.variant === 'error' ? 'text-[var(--neon-orange)]' :
              'text-[var(--silver-light)]'
            }`}>
              {userMessage.main}
            </p>
            <p className="text-xs text-[var(--metallic-silver)]">
              {userMessage.sub}
            </p>
          </div>
        </Card>
      )}

      {/* Project Metadata */}
      <div className="space-y-4">
        <ProjectMetadata 
          projectId={project.id.toString()}
          isProjectOwner={isProjectOwner}
          projectOwner={project.projectOwner}
        />
      </div>

      {/* Header + Progress Section - Combined */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Header Section - More Compact */}
        <Card hover>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {project.projectTokenLogoURI && (
                <SafeImage
                  src={project.projectTokenLogoURI}
                  alt={`${project.tokenName} logo`}
                  className="w-12 h-12 rounded-lg object-cover border border-[var(--metallic-silver)]/20"
                  fallback={
                    <div className="w-12 h-12 rounded-lg bg-[var(--charcoal)] flex items-center justify-center text-[var(--silver-dark)] text-xs">
                      N/A
                    </div>
                  }
                  onError={() => logger.warn('Failed to load token logo')}
                />
              )}
              
              {isLive && hasStarted && !hasEnded && (
                <div className="flex items-center space-x-1.5 text-[var(--neon-blue)] text-sm">
                  <div className="w-1.5 h-1.5 bg-[var(--neon-blue)] rounded-full animate-pulse shadow-[0_0_4px_var(--neon-blue)]" />
                  <span className="font-medium">Live Now</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 flex-wrap">
              <h1 className="text-xl font-bold text-[var(--silver-light)]">
                <SafeHtml content={project.tokenName || 'Unknown Token'} />
              </h1>
              <Badge variant={getStatusVariant(project.status as ProjectStatus)} size="sm">
                {isFundingEnded ? 'Funding Ended' : ProjectStatusLabels[project.status as keyof typeof ProjectStatusLabels]}
              </Badge>
            </div>

            <div className="flex items-center space-x-3 text-xs text-[var(--metallic-silver)] flex-wrap">
              <span className="font-mono">
                <SafeHtml content={project.tokenSymbol || ''} />
              </span>
              <div className="flex items-center gap-1"> 
                <span>Launch Address:</span>
                <CopyableAddress address={project.projectToken} />
              </div>
            </div>
          </div>
        </Card>

        {/* Progress Section - Compact Style */}
        <Card hover>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--metallic-silver)]">Funding Progress</span>
              <span className="text-xl font-bold text-[var(--neon-blue)]">
                {Number(progressPercentage.toFixed(1))}%
              </span>
            </div>
          
            <Progress
              value={progressPercentage}
              variant={progressPercentage >= 1 ? 'success' : 'default'}
              size="md"
            />
          
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div className="text-center">
                <p className="text-[var(--metallic-silver)] mb-0.5">Raised</p>
                <div className="flex flex-col items-center">
                  {formatTokenWithUSD(
                    typeof project.totalRaised === 'string' 
                      ? BigInt(project.totalRaised)
                      : typeof project.totalRaised === 'number'
                      ? BigInt(project.totalRaised)
                      : project.totalRaised,
                    project.contributionTokenSymbol || 'Tokens',
                    project.contributionTokenAddress as Address,
                    project.contributionTokenDecimals || 0,
                  )}
                </div>
              </div>
            
              <div className="text-center">
                <p className="text-[var(--metallic-silver)] mb-0.5">Soft Cap</p>
                <div className="flex flex-col items-center">
                  {formatTokenWithUSD(
                    typeof project.softCap === 'string' 
                      ? BigInt(project.softCap)
                      : typeof project.softCap === 'number'
                      ? BigInt(project.softCap)
                      : project.softCap,
                    project.contributionTokenSymbol || 'Tokens',
                    project.contributionTokenAddress as Address,
                    project.contributionTokenDecimals || 0,
                  )}
                </div>
              </div>
            
              <div className="text-center">
                <p className="text-[var(--metallic-silver)] mb-0.5">Hard Cap</p>
                <div className="flex flex-col items-center">
                  {formatTokenWithUSD(
                    typeof project.fundingGoal === 'string' 
                      ? BigInt(project.fundingGoal)
                      : typeof project.fundingGoal === 'number'
                      ? BigInt(project.fundingGoal)
                      : project.fundingGoal,
                    project.contributionTokenSymbol || 'Tokens',
                    project.contributionTokenAddress as Address,
                    project.contributionTokenDecimals || 0,
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timeline - More Compact */}
        <Card hover>
          <h3 className="text-base font-semibold text-[var(--silver-light)] mb-3">Timeline</h3>
          <div className="space-y-2.5">
            {!hasStarted ? (
              <div className="flex items-center space-x-2.5">
                <Clock className="h-4 w-4 text-[var(--neon-blue)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[var(--metallic-silver)]">⏳ Contribution Opens In</p>
                  <p className="text-sm font-medium text-[var(--neon-blue)] truncate">
                    {formatTimeRemaining(calculateTimeUntilStart(Number(project.startTime), now))}
                  </p>
                </div>
              </div>
            ) : !hasEnded ? (
              <div className="flex items-center space-x-2.5">
                <TrendingUp className="h-4 w-4 text-[var(--neon-orange)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[var(--metallic-silver)]">⏰ Contribution Ends In</p>
                  <p className="text-sm font-medium text-[var(--neon-blue)] truncate">
                    {formatTimeRemaining(calculateTimeRemaining(Number(project.endTime), now))}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Clock className="h-4 w-4 text-[var(--metallic-silver)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[var(--metallic-silver)]">Status</p>
                  <p className="text-sm font-medium text-[var(--metallic-silver)] truncate">
                    Contribution Period Ended
                  </p>
                </div>
              </div>
            )}

            {('totalContributors' in project) && (
              <div className="flex items-center space-x-2.5">
                <Calendar className="h-4 w-4 text-[var(--neon-blue)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-[var(--metallic-silver)]">👥 Total Contributors</p>
                  <p className="text-sm font-medium text-[var(--silver-light)] truncate">
                    {(project as any).totalContributors || 0}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[var(--metallic-silver)]/10">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <span className="text-[var(--metallic-silver)]">Minimum</span>
                  {formatTokenWithUSD(
                    project.minContribution || 0n,
                    project.contributionTokenSymbol || 'Tokens',
                    project.contributionTokenAddress as Address,
                    project.contributionTokenDecimals || 0,
                  )}
                </div>
            
                <div className="flex justify-between items-start">
                  <span className="text-[var(--metallic-silver)]">Maximum</span>
                  {formatTokenWithUSD(
                    project.maxContribution || 0n,
                    project.contributionTokenSymbol || 'Tokens',
                    project.contributionTokenAddress as Address,
                    project.contributionTokenDecimals || 0,
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Token Economics - More Compact */}
        <Card hover>
          <h3 className="text-base font-semibold text-[var(--silver-light)] mb-3">Token Economics</h3>
          <div className="space-y-12">
            <div className="flex justify-between items-start text-sm">
              <span className="text-[var(--metallic-silver)]">Token Price</span>
              {formatTokenPriceWithUSD(
                BigInt(project.tokenPrice),
                project.tokenSymbol || 'Unknown',
                project.contributionTokenSymbol || 'Tokens',
                project.contributionTokenAddress as Address
              )}
            </div>
            
            <div className="pt-2 border-t border-[var(--metallic-silver)]/10">
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--metallic-silver)]">Tokens for Sale</span>
                  <span className="font-medium text-[var(--silver-light)]">
                    {ExhibitionFormatters.formatLargeNumber(project.amountTokensForSale)}
                  </span>
                </div>
            
                <div className="flex justify-between">
                  <span className="text-[var(--metallic-silver)]">Liquidity %</span>
                  <span className="font-medium text-[var(--silver-light)]">
                    {Number(project.liquidityPercentage) / 100}%
                  </span>
                </div>
            
                {('totalProjectTokenSupply' in project) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--metallic-silver)]">Total Supply</span>
                    <span className="font-medium text-[var(--silver-light)]">
                      {ExhibitionFormatters.formatLargeNumber((project as any).totalProjectTokenSupply || 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Project Information Card - More Compact */}
        <Card hover>
          <h3 className="text-base font-semibold text-[var(--silver-light)] mb-3">Launch Information</h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--metallic-silver)]">Owner:</span>
              <CopyableAddress address={project.projectOwner} />
            </div>
            
            <div>
              <p className="text-[var(--metallic-silver)] mb-1">Contribution Token</p>
              <CopyableAddress address={project.contributionTokenAddress} />
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--metallic-silver)]/10">
              {('lockDuration' in project) && (
                <div>
                  <p className="text-[var(--metallic-silver)] mb-0.5">Lock Duration</p>
                  <p className="font-medium text-[var(--silver-light)]">
                    {ExhibitionFormatters.formatDuration(Number((project as any).lockDuration || 0))}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-[var(--metallic-silver)] mb-0.5">Launch ID</p>
                <p className="font-medium text-[var(--silver-light)]">
                  #{project.id.toString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Vesting Information - More Compact */}
        <Card hover>
          <h3 className="text-base font-semibold text-[var(--silver-light)] mb-3">Vesting Schedule</h3>
          <div className="space-y-2.5">
            {('vestingEnabled' in project) && (project as any).vestingEnabled ? (
              <div className="space-y-2 text-xs">
                {('vestingCliff' in project) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--metallic-silver)]">Cliff Period</span>
                    <span className="font-medium text-[var(--silver-light)]">
                      {ExhibitionFormatters.formatDuration(Number((project as any).vestingCliff || 0))}
                    </span>
                  </div>
                )}
                
                {('vestingDuration' in project) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--metallic-silver)]">Vesting Duration</span>
                    <span className="font-medium text-[var(--silver-light)]">
                      {ExhibitionFormatters.formatDuration(Number((project as any).vestingDuration || 0))}
                    </span>
                  </div>
                )}

                {('vestingInterval' in project) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--metallic-silver)]">Vesting Interval</span>
                    <span className="font-medium text-[var(--silver-light)]">
                      {ExhibitionFormatters.formatDuration(Number((project as any).vestingInterval || 0))}
                    </span>
                 </div>
                )}
                
                {('vestingInitialRelease' in project) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--metallic-silver)]">Initial Release</span>
                    <span className="font-medium text-[var(--silver-light)]">
                      {Number((project as any).vestingInitialRelease || 0) / 100}%
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-[var(--neon-blue)]">
                <Info className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs">No vesting - tokens unlocked immediately</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}