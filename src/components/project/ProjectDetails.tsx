// src/components/project/ProjectDetails.tsx
import React from 'react'
import { Calendar, Clock, TrendingUp, Info } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import { type ProjectDisplayData, ProjectStatus, ProjectStatusLabels } from '../../types/project'
import { ExhibitionFormatters } from '../../utils/exFormatters'
import { formatTimeRemaining } from '../../utils/timeHelpers'

interface ProjectDetailsProps {
  project: ProjectDisplayData
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ project }) => {
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
  const hasEnded = project.timeRemaining <= 0 && project.status !== ProjectStatus.Upcoming

  return (
    <div className="space-y-6">
      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Header Section */}
        <Card hover>
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 flex items-start space-x-4">
              {/* Project Logo */}
              {project.projectTokenLogoURI && (
                <div className="flex-shrink-0">
                  <img
                    src={project.projectTokenLogoURI}
                    alt={`${project.tokenName} logo`}
                    className="w-16 h-16 rounded-lg object-cover border border-[var(--metallic-silver)]/20"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-[var(--silver-light)]">
                    {project.tokenName || 'Unknown Token'}
                  </h1>
                  <Badge variant={getStatusVariant(project.status as ProjectStatus)} size="md">
                    {ProjectStatusLabels[project.status as keyof typeof ProjectStatusLabels]}
                  </Badge>
                </div>
              
                <div className="flex items-center space-x-4 text-sm text-[var(--metallic-silver)] flex-wrap">
                  <span className="font-mono">{project.tokenSymbol}</span>
                  <span>•</span>
                  <span>
                    Owner: {ExhibitionFormatters.formatAddress(project.projectOwner)}
                  </span>
                </div>
              </div>
            </div>

            {isLive && (
              <div className="flex items-center space-x-2 text-[var(--neon-blue)] flex-shrink-0">
                <div className="w-2 h-2 bg-[var(--neon-blue)] rounded-full animate-pulse shadow-[0_0_4px_var(--neon-blue)]" />
                <span className="font-medium">Live Now</span>
              </div>
            )}
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

      {/* Additional Information */}
      <Card hover>
        <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-4">Project Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[var(--metallic-silver)]">Project Token Address</p>
            <p className="font-mono text-xs break-all text-[var(--silver-dark)]">
              {project.projectToken}
            </p>
          </div>
          
          <div>
            <p className="text-[var(--metallic-silver)]">Contribution Token</p>
            <p className="font-mono text-xs break-all text-[var(--silver-dark)]">
              {project.contributionTokenAddress}
            </p>
          </div>
          
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
      </Card>
    </div>
  )
}