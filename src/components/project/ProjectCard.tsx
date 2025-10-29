import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, Calendar, TrendingUp } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import { type ProjectDisplayData, ProjectStatus, ProjectStatusLabels } from '../../types/project'
import { ExhibitionFormatters } from '../../utils/exFormatters'

interface ProjectCardProps {
  project: ProjectDisplayData
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const getStatusVariant = (status: number) => {
    switch (status) {
      case ProjectStatus.Failed:
      case ProjectStatus.Refundable:
        return 'error'
      default:
        return 'default'
    }
  }

  const progressPercentage = project.progressPercentage / 100
  const isLive = project.status === ProjectStatus.Active
  const hasEnded = project.timeRemaining <= 0 && project.status !== ProjectStatus.Upcoming

  const formatTimeRemaining = (seconds: number): string => {
    return ExhibitionFormatters.formatDuration(seconds)
  }

  return (
    <div className="space-y-6">
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
                <Badge variant={getStatusVariant(project.status)} size="md">
                  {ProjectStatusLabels[project.status as ProjectStatus]}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-[var(--metallic-silver)] flex-wrap">
                <span className="font-mono">{project.tokenSymbol}</span>
                <span>•</span>
                <span>
                  Owner: {ExhibitionFormatters.formatAddress(project.projectOwner.toString())}
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
                  project.totalRaised,
                  project.contributionTokenSymbol || 'Tokens',
                  project.contributionTokenDecimals,
                )}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-[var(--metallic-silver)]">Soft Cap</p>
              <p className="text-lg font-semibold text-[var(--silver-light)]">
                {ExhibitionFormatters.formatTokenWithSymbol(
                  project.softCap,
                  project.contributionTokenSymbol || 'Tokens',
                  project.contributionTokenDecimals,
                )}
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-[var(--metallic-silver)]">Hard Cap</p>
              <p className="text-lg font-semibold text-[var(--silver-light)]">
                {ExhibitionFormatters.formatTokenWithSymbol(
                  project.fundingGoal,
                  project.contributionTokenSymbol || 'Tokens',
                  project.contributionTokenDecimals,
                )}
              </p>
            </div>
          </div>
        </div>
      </Card>

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
                  {ExhibitionFormatters.formatTimestamp(project.startTime)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-[var(--neon-orange)]" />
              <div>
                <p className="text-sm text-[var(--metallic-silver)]">End Time</p>
                <p className="font-medium text-[var(--silver-light)]">
                  {ExhibitionFormatters.formatTimestamp(project.endTime)}
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
                  project.tokenPrice,
                  project.tokenSymbol || 'TOKEN',
                  project.contributionTokenSymbol || 'EXH'
                )}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[var(--metallic-silver)]">Tokens for Sale</span>
              <span className="font-medium text-[var(--silver-light)]">
                {ExhibitionFormatters.formatLargeNumber(project.amountTokensForSale, 18, 2)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[var(--metallic-silver)]">Liquidity %</span>
              <span className="font-medium text-[var(--silver-light)]">
                {Number(project.liquidityPercentage) / 100}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Button */}
      <Card>
        <div className="text-center">
          <Link to={`/projects/${project.id}`}>
            <button className="w-full bg-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/80 text-[var(--deep-black)] font-medium py-3 px-6 rounded-lg transition-colors shadow-[0_0_8px_var(--neon-blue)]/40">
              View Project Details
            </button>
          </Link>
        </div>
      </Card>
    </div>
  )
}