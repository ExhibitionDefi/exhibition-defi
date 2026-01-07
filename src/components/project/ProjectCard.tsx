// src/components/project/ProjectCard.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Progress } from '../ui/Progress'
import { type ProjectDisplayData, ProjectStatus, ProjectStatusLabels } from '../../types/project'
import { ExhibitionFormatters } from '../../utils/exFormatters'
import { SafeHtml, SafeImage } from '../SafeHtml'
import { logger } from '@/utils/logger'
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing'
import type { Address } from 'viem'

interface ProjectCardProps {
  project: ProjectDisplayData
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { getTokenPriceUSD, isReady } = useLocalPricing()

  const getStatusVariant = (status: number) => {
    switch (status) {
      case ProjectStatus.Active:
        return 'info'
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

  // Calculate USD values
  const getUSDValue = (tokenAmount: bigint, decimals: number, tokenAddress?: string): string => {
    if (!isReady || !tokenAddress) return 'N/A'
    
    try {
      const tokenPrice = getTokenPriceUSD(tokenAddress as Address)
      if (tokenPrice === 'N/A') return 'N/A'
      
      const priceValue = parseFloat(tokenPrice.replace(/[$,]/g, ''))
      const divisor = 10n ** BigInt(decimals)
      const tokenAmountDecimal = Number(tokenAmount) / Number(divisor)
      const usdValue = tokenAmountDecimal * priceValue
      
      return `$${usdValue.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    } catch (error) {
      logger.warn('Error calculating USD value:', error)
      return 'N/A'
    }
  }

  const raisedUSD = getUSDValue(
    project.totalRaised,
    project.contributionTokenDecimals || 0,
    project.contributionTokenAddress,
  )
  
  const goalUSD = getUSDValue(
    project.fundingGoal,
    project.contributionTokenDecimals || 0,
    project.contributionTokenAddress
  )

  return (
    <Link to={`/projects/${project.id}`} className="block">
      <Card hover className="h-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,195,255,0.15)] relative">
        {/* Floating Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge variant={getStatusVariant(project.status)} size="sm">
            {ProjectStatusLabels[project.status as ProjectStatus]}
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Header - Logo + Name + Live indicator */}
          <div className="flex items-center space-x-2.5 pr-20">
            {project.projectTokenLogoURI && (
              <SafeImage
                src={project.projectTokenLogoURI}
                alt={`${project.tokenName || 'Token'} logo`}
                className="w-10 h-10 rounded-lg object-cover border border-[var(--metallic-silver)]/20 flex-shrink-0"
                fallback={
                  <div className="w-10 h-10 rounded-lg bg-[var(--charcoal)] flex items-center justify-center text-[var(--silver-dark)] text-xs">
                    N/A
                  </div>
                }
                onError={() => logger.warn('Failed to load token logo')}
              />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-base font-bold text-[var(--silver-light)] truncate">
                  <SafeHtml content={project.tokenName || 'Unknown Token'} />
                </h3>
                {isLive && (
                  <div className="w-1.5 h-1.5 bg-[var(--neon-blue)] rounded-full animate-pulse shadow-[0_0_4px_var(--neon-blue)] flex-shrink-0" />
                )}
              </div>
              <span className="text-xs font-mono text-[var(--metallic-silver)]">
                <SafeHtml content={project.tokenSymbol || ''} />
              </span>
            </div>
          </div>

          {/* Progress Bar with Percentage */}
          <div className="space-y-0.5">
            <div className="flex justify-end">
              <span className="text-xs font-bold text-[var(--neon-blue)]">
                {Number(progressPercentage.toFixed(1))}%
              </span>
            </div>
            <Progress
              value={progressPercentage}
              variant={progressPercentage >= 1 ? 'success' : 'default'}
              size="sm"
            />
          </div>

          {/* Compact Metrics - Single Line */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center space-x-1 text-[var(--silver-light)]">
              <span className="font-semibold">{raisedUSD}</span>
              <span className="text-[var(--metallic-silver)]">/</span>
              <span className="text-[var(--metallic-silver)]">{goalUSD}</span>
            </div>
            
            <div className="flex items-center space-x-1 text-[var(--neon-blue)]">
              <Clock className="h-3 w-3" />
              <span className="font-medium">
                {hasEnded ? 'Ended' : formatTimeRemaining(project.timeRemaining)}
              </span>
            </div>
          </div>

          {/* CTA Button */}
          <button className="w-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] hover:from-[var(--neon-blue)]/90 hover:to-[var(--neon-orange)]/90 text-[var(--deep-black)] font-medium py-0.9 px-4 rounded-lg transition-all shadow-[0_0_10px_rgba(0,195,255,0.3),0_0_10px_rgba(255,107,0,0.2)] text-xs">
            View Details
          </button>
        </div>
      </Card>
    </Link>
  )
}