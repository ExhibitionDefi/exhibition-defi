// src/components/project/ProjectDetails.tsx
import React, { useState } from 'react'
import { Calendar, Clock, TrendingUp, Info, Copy, Check } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import { type ProjectDisplayData, ProjectStatus, ProjectStatusLabels } from '../../types/project'
import { ExhibitionFormatters } from '../../utils/exFormatters'
import { formatTimeRemaining } from '../../utils/timeHelpers'
import { SafeHtml, SafeImage } from '../SafeHtml'

interface ProjectDetailsProps {
  project: ProjectDisplayData
  isProjectOwner?: boolean
  hasDepositedProjectTokens?: boolean
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project, isProjectOwner = false, hasDepositedProjectTokens = false }) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(address)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
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

  // Check current time and project timing
  const now = Math.floor(Date.now() / 1000)
  const hasStarted = now >= Number(project.startTime)
  const hasEnded = now >= Number(project.endTime)
  const isActive = project.status === ProjectStatus.Active
  const isUpcoming = project.status === ProjectStatus.Upcoming
  const isSuccessful = project.status === ProjectStatus.Successful
  const isClaimable = project.status === ProjectStatus.Claimable
  const isFailed = project.status === ProjectStatus.Failed
  const isRefundable = project.status === ProjectStatus.Refundable
  const isFundingEnded = project.status === ProjectStatus.FundingEnded

  // Determine what message to show
  const showOwnerMessage = isProjectOwner && (isActive || isUpcoming)
  const showUserMessage = !isProjectOwner && (isActive || isUpcoming || isSuccessful || isClaimable || isFundingEnded || isFailed || isRefundable)

  // Generate owner messages
  type MessageVariant = 'info' | 'success' | 'warning' | 'error';

  const getOwnerMessage = () => {
    if (isUpcoming && !hasStarted) {
      // Check if tokens are deposited
      if (hasDepositedProjectTokens === false) {
        return {
          main: '⚠️ Action Required: Deposit Project Tokens',
          sub: 'You must deposit the required project tokens before the sale can begin. See the deposit card below.',
          variant: 'warning' as MessageVariant
        }
      }
      return {
        main: 'Your project is scheduled and ready to launch!',
        sub: `Contributions will begin on ${new Date(Number(project.startTime) * 1000).toLocaleString()}`,
        variant: 'info' as MessageVariant
      }
    }
    if (isActive && !hasStarted) {
      return {
        main: 'Your project is active but has not started yet.',
        sub: `Contributions will open on ${new Date(Number(project.startTime) * 1000).toLocaleString()}`,
        variant: 'info' as const
      }
    }
    if (isActive && hasStarted && !hasEnded) {
      return {
        main: 'Your project is live and accepting contributions!',
        sub: 'As the project owner, you cannot contribute to your own project.',
        variant: 'success' as const
      }
    }
    if (isActive && hasEnded) {
      return {
        main: 'Funding period has ended.',
        sub: 'Your project needs to be finalized to determine its status.',
        variant: 'warning' as const
      }
    }
    if (isFundingEnded) {
      return {
        main: 'Funding period has ended.',
        sub: 'Please finalize your project to proceed with the next steps.',
        variant: 'warning' as const
      }
    }
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
    return null
  }

  // Generate user messages
  const getUserMessage = () => {
    if (isUpcoming || (isActive && !hasStarted)) {
      return {
        main: 'This project has not started yet.',
        sub: `Contributions will open on ${new Date(Number(project.startTime) * 1000).toLocaleString()}`,
        variant: 'info' as const
      }
    }
    if (isActive && hasStarted && !hasEnded) {
      return {
        main: 'This project is live and accepting contributions!',
        sub: 'Connect your wallet and contribute to participate in this project.',
        variant: 'success' as const
      }
    }
    if (isActive && hasEnded) {
      return {
        main: 'Funding period has ended.',
        sub: 'This project is awaiting finalization. The final status will be determined soon.',
        variant: 'warning' as const
      }
    }
    if (isFundingEnded) {
      return {
        main: 'Funding period has ended.',
        sub: 'This project is being finalized. Please check back soon for the final status.',
        variant: 'warning' as const
      }
    }
   if (isSuccessful || isClaimable) {
      return {
        main: 'Project Successful! 🎉',
        sub: 'This project has reached its funding goal. If you contributed, you can claim your tokens!',
        variant: 'success' as const
      }
    }
    if (isFailed || isRefundable) {
      return {
        main: 'Project did not reach its funding goal.',
        sub: 'If you contributed, you can request a refund of your contribution.',
        variant: 'error' as const
      }
    }
    return null
  }

  const ownerMessage = getOwnerMessage()
  const userMessage = getUserMessage()

  return (
    <div className="space-y-6">
      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Header Section */}
        <Card hover>
          <div className="space-y-4">
            {/* Logo Row */}
            <div className="flex items-center justify-between">
              {project.projectTokenLogoURI && (
                <SafeImage
                  src={project.projectTokenLogoURI}
                  alt={`${project.tokenName} logo`}
                  className="w-16 h-16 rounded-lg object-cover border border-[var(--metallic-silver)]/20"
                  fallback={
                    <div className="w-16 h-16 rounded-lg bg-[var(--charcoal)] flex items-center justify-center text-[var(--silver-dark)] text-xs">
                      N/A
                    </div>
                  }
                  onError={() => console.warn('Failed to load token logo')}
                />
              )}
              
              {isLive && (
                <div className="flex items-center space-x-2 text-[var(--neon-blue)]">
                  <div className="w-2 h-2 bg-[var(--neon-blue)] rounded-full animate-pulse shadow-[0_0_4px_var(--neon-blue)]" />
                  <span className="font-medium">Live Now</span>
                </div>
              )}
            </div>

            {/* Title and Badge Row */}
            <div className="flex items-center space-x-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--silver-light)]">
                <SafeHtml content={project.tokenName || 'Unknown Token'} />
              </h1>
              <Badge variant={getStatusVariant(project.status as ProjectStatus)} size="md">
                {ProjectStatusLabels[project.status as keyof typeof ProjectStatusLabels]}
              </Badge>
            </div>

            {/* Token Symbol and Owner Row */}
            <div className="flex items-center space-x-4 text-sm text-[var(--metallic-silver)] flex-wrap">
              <span className="font-mono">
                <SafeHtml content={project.tokenSymbol || ''} />
              </span>
              <span>•</span>
              <div className="flex items-center space-x-2">
                <span>Owner:</span>
                <CopyableAddress address={project.projectOwner} />
              </div>
            </div>
          </div>
        </Card>

        {/* Progress Section */}
        <Card hover>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[var(--silver-light)]">Funding Progress</h3>
              <span className="text-2xl font-bold text-[var(--neon-blue)]">
                {Number(progressPercentage.toFixed(1))}%
              </span>
            </div>
          
            <Progress
              value={progressPercentage}
              variant={progressPercentage >= 1 ? 'success' : 'default'}
              size="lg"
            />
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-[var(--metallic-silver)]">Raised</p>
                <p className="text-lg font-semibold text-[var(--silver-light)]">
                  {ExhibitionFormatters.formatTokenWithSymbol(
                    typeof project.totalRaised === 'string' 
                      ? BigInt(project.totalRaised)
                      : typeof project.totalRaised === 'number'
                      ? BigInt(project.totalRaised)
                      : project.totalRaised,
                    project.contributionTokenSymbol || 'Tokens',
                    project.contributionTokenDecimals,
                  )}
                </p>
              </div>
            
              <div className="text-center">
                <p className="text-[var(--metallic-silver)]">Soft Cap</p>
                <p className="text-lg font-semibold text-[var(--silver-light)]">
                  {ExhibitionFormatters.formatTokenWithSymbol(
                    typeof project.softCap === 'string' 
                      ? BigInt(project.softCap)
                      : typeof project.softCap === 'number'
                      ? BigInt(project.softCap)
                      : project.softCap,
                    project.contributionTokenSymbol || 'Tokens',
                    project.contributionTokenDecimals,
                 )}
                </p>
              </div>
            
              <div className="text-center">
                <p className="text-[var(--metallic-silver)]">Hard Cap</p>
                <p className="text-lg font-semibold text-[var(--silver-light)]">
                  {ExhibitionFormatters.formatTokenWithSymbol(
                    typeof project.fundingGoal === 'string' 
                      ? BigInt(project.fundingGoal)
                      : typeof project.fundingGoal === 'number'
                      ? BigInt(project.fundingGoal)
                      : project.fundingGoal,
                    project.contributionTokenSymbol || 'Tokens',
                    project.contributionTokenDecimals,
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card hover>
          <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-4">Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-[var(--neon-blue)]" />
              <div>
                <p className="text-sm text-[var(--metallic-silver)]">Start Time</p>
                <p className="font-medium text-[var(--silver-light)]">
                  {ExhibitionFormatters.formatTimestamp(Number(project.startTime))}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-[var(--neon-orange)]" />
              <div>
                <p className="text-sm text-[var(--metallic-silver)]">End Time</p>
                <p className="font-medium text-[var(--silver-light)]">
                  {ExhibitionFormatters.formatTimestamp(Number(project.endTime))}
                </p>
              </div>
            </div>
            
            {!hasEnded && project.timeRemaining > 0 && (
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-[var(--neon-blue)]" />
                <div>
                  <p className="text-sm text-[var(--metallic-silver)]">Time Remaining</p>
                  <p className="font-medium text-[var(--neon-blue)]">
                    {formatTimeRemaining(project.timeRemaining)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Token Economics */}
        <Card hover>
          <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-4">Token Economics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--metallic-silver)]">Token Price</span>
              <span className="font-medium text-[var(--silver-light)]">
                {ExhibitionFormatters.formatTokenPrice(
                  BigInt(project.tokenPrice),
                  project.tokenSymbol || 'Unknown',
                  project.contributionTokenSymbol || 'Tokens'
                )}
              </span>
            </div>
            
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
            
            {/* Conditionally render if property exists */}
            {('totalProjectTokenSupply' in project) && (
              <div className="flex justify-between">
                <span className="text-[var(--metallic-silver)]">Total Supply</span>
                <span className="font-medium text-[var(--silver-light)]">
                  {ExhibitionFormatters.formatLargeNumber((project as any).totalProjectTokenSupply || 0)}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Contribution Limits */}
        <Card hover>
          <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-4">Contribution Limits</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--metallic-silver)]">Minimum</span>
              <span className="font-medium text-[var(--silver-light)]">
                {ExhibitionFormatters.formatTokenWithSymbol(
                  project.minContribution || 0n,
                  project.contributionTokenSymbol || 'Tokens',
                  project.contributionTokenDecimals,
                )}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[var(--metallic-silver)]">Maximum</span>
              <span className="font-medium text-[var(--silver-light)]">
                {ExhibitionFormatters.formatTokenWithSymbol(
                  project.maxContribution || 0n,
                  project.contributionTokenSymbol || 'Tokens',
                  project.contributionTokenDecimals,
                )}
              </span>
            </div>
          </div>
        </Card>

        {/* Vesting Information - Conditionally render if properties exist */}
        <Card hover>
          <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-4">Vesting Schedule</h3>
          <div className="space-y-3">
            {('vestingEnabled' in project) && (project as any).vestingEnabled ? (
              <>
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
                
                {('vestingInitialRelease' in project) && (
                  <div className="flex justify-between">
                    <span className="text-[var(--metallic-silver)]">Initial Release</span>
                    <span className="font-medium text-[var(--silver-light)]">
                      {Number((project as any).vestingInitialRelease || 0) / 100}%
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-2 text-[var(--neon-blue)]">
                <Info className="h-4 w-4" />
                <span className="text-sm">No vesting - tokens unlocked immediately</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Grid - Project Information (Left) and Status Messages (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Information Card - Always shows on left */}
        <Card hover>
          <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-4">Project Information</h3>
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div>
              <p className="text-[var(--metallic-silver)] mb-1">Project Token Address</p>
              <CopyableAddress address={project.projectToken} />
            </div>
            
            <div>
              <p className="text-[var(--metallic-silver)] mb-1">Contribution Token</p>
              <CopyableAddress address={project.contributionTokenAddress} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {('lockDuration' in project) && (
                <div>
                  <p className="text-[var(--metallic-silver)]">Lock Duration</p>
                  <p className="font-medium text-[var(--silver-light)]">
                    {ExhibitionFormatters.formatDuration(Number((project as any).lockDuration || 0))}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-[var(--metallic-silver)]">Project ID</p>
                <p className="font-medium text-[var(--silver-light)]">
                  #{project.id.toString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Status Message Card - Shows for both owner and users on right */}
        {(showOwnerMessage && ownerMessage) && (
          <Card hover>
            <div className="text-center space-y-3">
              <p className={`text-lg font-semibold ${
                ownerMessage.variant === 'success' ? 'text-[var(--neon-blue)]' :
                ownerMessage.variant === 'warning' ? 'text-[var(--neon-orange)]' :
                ownerMessage.variant === 'error' ? 'text-[var(--neon-orange)]' :
                'text-[var(--silver-light)]'
              }`}>
                {ownerMessage.main}
              </p>
              <p className="text-sm text-[var(--metallic-silver)]">
                {ownerMessage.sub}
              </p>
            </div>
          </Card>
        )}

        {(showUserMessage && userMessage) && (
          <Card hover>
            <div className="text-center space-y-3">
              <p className={`text-lg font-semibold ${
                userMessage.variant === 'success' ? 'text-[var(--neon-blue)]' :
                userMessage.variant === 'warning' ? 'text-[var(--neon-orange)]' :
                userMessage.variant === 'error' ? 'text-[var(--neon-orange)]' :
                'text-[var(--silver-light)]'
              }`}>
                {userMessage.main}
              </p>
              <p className="text-sm text-[var(--metallic-silver)]">
                {userMessage.sub}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}