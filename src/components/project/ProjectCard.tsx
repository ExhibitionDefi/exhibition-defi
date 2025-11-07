import React from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import { type ProjectDisplayData, ProjectStatus, ProjectStatusLabels } from '../../types/project'
import { ExhibitionFormatters } from '../../utils/exFormatters'
import { SafeHtml, SafeImage } from '../SafeHtml'

interface ProjectCardProps {
  project: ProjectDisplayData
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const getStatusVariant = (status: number) => {
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

  const progressPercentage = project.progressPercentage / 100
  const isLive = project.status === ProjectStatus.Active
  const hasEnded = project.timeRemaining <= 0 && project.status !== ProjectStatus.Upcoming

  const formatTimeRemaining = (seconds: number): string => {
    return ExhibitionFormatters.formatDuration(seconds)
  }

  return (
    <Link to={`/projects/${project.id}`} className="block">
      <Card hover className="h-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,195,255,0.15)]">
        <div className="space-y-4">
          {/* Header with Logo, Name, Status */}
          <div className="flex items-start space-x-3">
            {/* Project Logo */}
            {project.projectTokenLogoURI && (
              <div className="flex-shrink-0">
                <SafeImage
                  src={project.projectTokenLogoURI}
                  alt={`${project.tokenName || 'Token'} logo`}
                  className="w-12 h-12 rounded-lg object-cover border border-[var(--metallic-silver)]/20"
                  fallback={
                    <div className="w-12 h-12 rounded-lg bg-[var(--charcoal)] flex items-center justify-center text-[var(--silver-dark)] text-xs">
                      N/A
                    </div>
                  }
                  onError={() => console.warn('Failed to load token logo')}
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-bold text-[var(--silver-light)] truncate">
                  <SafeHtml content={project.tokenName || 'Unknown Token'} />
                </h3>
                {isLive && (
                  <div className="w-2 h-2 bg-[var(--neon-blue)] rounded-full animate-pulse shadow-[0_0_4px_var(--neon-blue)] flex-shrink-0" />
                )}
              </div>
              
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="text-sm font-mono text-[var(--metallic-silver)]">
                  <SafeHtml content={project.tokenSymbol || ''} />
                </span>
                <Badge variant={getStatusVariant(project.status)} size="sm">
                  {ProjectStatusLabels[project.status as ProjectStatus]}
                </Badge>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--metallic-silver)]">Progress</span>
              <span className="text-lg font-bold text-[var(--neon-blue)]">
                {Number(progressPercentage.toFixed(1))}%
              </span>
            </div>
            
            <Progress
              value={progressPercentage}
              variant={progressPercentage >= 1 ? 'success' : 'default'}
              size="md"
            />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[var(--metallic-silver)]/10">
            <div>
              <p className="text-xs text-[var(--metallic-silver)] mb-1">Raised</p>
              <p className="text-sm font-semibold text-[var(--silver-light)] truncate">
                {ExhibitionFormatters.formatTokenWithSymbol(
                  project.totalRaised,
                  project.contributionTokenSymbol || 'Tokens',
                  project.contributionTokenDecimals,
                )}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-[var(--metallic-silver)] mb-1">Goal</p>
              <p className="text-sm font-semibold text-[var(--silver-light)] truncate">
                {ExhibitionFormatters.formatTokenWithSymbol(
                  project.fundingGoal,
                  project.contributionTokenSymbol || 'Tokens',
                  project.contributionTokenDecimals,
                )}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-[var(--metallic-silver)] mb-1 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {hasEnded ? 'Ended' : 'Remaining'}
              </p>
              <p className="text-sm font-semibold text-[var(--neon-blue)] truncate">
                {hasEnded ? 'Completed' : formatTimeRemaining(project.timeRemaining)}
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <button className="w-full bg-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/80 text-[var(--deep-black)] font-medium py-2.5 px-4 rounded-lg transition-colors shadow-[0_0_8px_var(--neon-blue)]/30 text-sm">
            View Details
          </button>
        </div>
      </Card>
    </Link>
  )
}