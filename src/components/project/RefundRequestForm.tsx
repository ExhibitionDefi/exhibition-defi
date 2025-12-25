// src/components/project/RefundRequestForm.tsx
import React, { useMemo } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { type ProjectDisplayData, ProjectStatus, ProjectStatusLabels } from '../../types/project'
import { ExhibitionFormatters } from '../../utils/exFormatters'
import { AlertTriangle, Clock } from 'lucide-react'
import { SafeHtml } from '../SafeHtml'
import { sanitizeText } from '../../utils/sanitization'

interface RefundRequestFormProps {
  project: ProjectDisplayData
  userContribution: bigint
  contributionTokenSymbol?: string
  contributionTokenDecimals?: number
  isConnected: boolean
  canRefund: boolean
  canEmergencyRefund: boolean
  isEmergencyRefund: boolean
  liquidityDeadline?: bigint
  currentTime?: bigint
  isLoading?: boolean
  onRequestRefund: () => void
  onRequestEmergencyRefund: () => void
}

export const RefundRequestForm: React.FC<RefundRequestFormProps> = ({
  project,
  userContribution,
  contributionTokenSymbol = 'TOKEN',
  contributionTokenDecimals = 18,
  isConnected,
  canRefund,
  canEmergencyRefund,
  isEmergencyRefund,
  liquidityDeadline,
  currentTime,
  isLoading,
  onRequestRefund,
  onRequestEmergencyRefund
}) => {
  // ✅ Sanitize token symbol for display
  const safeTokenSymbol = useMemo(() => 
    sanitizeText(contributionTokenSymbol), 
    [contributionTokenSymbol]
  )

  // ✅ Safely get project status label
  const safeStatusLabel = useMemo(() => {
    const status = project.status as ProjectStatus
    return sanitizeText(ProjectStatusLabels[status] || 'Unknown')
  }, [project.status])

  // Calculate time remaining until liquidity deadline
  const timeRemaining = useMemo(() => {
    if (!liquidityDeadline || !currentTime) return null
    const remaining = Number(liquidityDeadline - currentTime)
    if (remaining <= 0) return 'Deadline passed'
    
    const days = Math.floor(remaining / 86400)
    const hours = Math.floor((remaining % 86400) / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h ${minutes}m remaining`
    return `${minutes}m remaining`
  }, [liquidityDeadline, currentTime])

  if (!canRefund && !canEmergencyRefund) {
    return (
      <div className="border-[var(--charcoal)] bg-[var(--deep-black)] rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-2">
          Refund Not Available
        </h3>
        <p className="text-[var(--metallic-silver)]">
          {project.status === 3 || project.status === 5 
            ? 'Project owner must add liquidity before refunds are available.'
            : 'This project has not failed or you have already requested a refund.'}
        </p>
        <Badge variant="info" className="mt-3">
          <SafeHtml 
            content={safeStatusLabel}
            as="span"
          />
        </Badge>
        {timeRemaining && (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-[var(--metallic-silver)]">
            <Clock className="h-4 w-4" />
            <span>{timeRemaining}</span>
          </div>
        )}
      </div>
    )
  }

  // ✅ Determine status message safely
  const statusMessage = isEmergencyRefund 
    ? 'missed the liquidity deadline'
    : project.status === 4 
      ? 'failed' 
      : 'become refundable'

  const refundType = isEmergencyRefund ? 'Emergency Refund' : 'Request Refund'
  const refundDescription = isEmergencyRefund
    ? 'The project owner failed to add liquidity within the deadline. You can request an emergency refund.'
    : `This project has ${statusMessage}. You can request a refund for your contribution.`

  return (
    <Card hover className="border border-[var(--charcoal)] bg-[var(--deep-black)]">
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 ${isEmergencyRefund ? 'bg-red-500' : 'bg-[var(--neon-orange)]'} bg-opacity-10 rounded-lg`}>
          <AlertTriangle className={`h-5 w-5 ${isEmergencyRefund ? 'text-red-500' : 'text-[var(--neon-orange)]'}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-1">
            {refundType}
          </h3>
          <SafeHtml 
            content={refundDescription}
            as="p"
            className="text-sm text-[var(--metallic-silver)]"
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Project Status Badge */}
        <div className="flex justify-center gap-2">
          <Badge 
            variant={isEmergencyRefund ? 'error' : project.status === 4 ? 'error' : 'warning'}
            className="text-sm"
          >
            <SafeHtml 
              content={safeStatusLabel}
              as="span"
            />
          </Badge>
          {isEmergencyRefund && (
            <Badge variant="error" className="text-sm">
              Liquidity Deadline Missed
            </Badge>
          )}
        </div>

        {/* Deadline Info for Emergency Refund */}
        {isEmergencyRefund && typeof liquidityDeadline === 'bigint' && typeof currentTime === 'bigint' && (
          <div className="p-3 bg-red-500 bg-opacity-10 rounded-lg border border-red-500 border-opacity-40">
            <div className="flex items-center gap-2 text-sm text-red-400">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Liquidity deadline passed</span>
            </div>
            <p className="text-xs text-[var(--metallic-silver)] mt-1">
              First refund will trigger emergency refund mode for all contributors
            </p>
          </div>
        )}

        {/* Your Contribution Info */}
        <div className={`p-4 bg-gradient-to-r from-[var(--charcoal)] to-[var(--deep-black)] rounded-lg border ${isEmergencyRefund ? 'border-red-500' : 'border-[var(--neon-orange)]'} border-opacity-40 relative overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-r ${isEmergencyRefund ? 'from-red-500' : 'from-[var(--neon-orange)]'} to-transparent opacity-5 animate-pulse`}></div>
          <div className="relative space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--metallic-silver)]">Your Contribution:</span>
              <SafeHtml 
                content={ExhibitionFormatters.formatTokenWithSymbol(
                  userContribution,
                  safeTokenSymbol,
                  contributionTokenDecimals
                )}
                as="span"
                className="font-semibold text-[var(--silver-light)]"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--metallic-silver)]">Refund Amount:</span>
              <SafeHtml 
                content={ExhibitionFormatters.formatTokenWithSymbol(
                  userContribution,
                  safeTokenSymbol,
                  contributionTokenDecimals
                )}
                as="span"
                className={`font-semibold ${isEmergencyRefund ? 'text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]' : 'text-[var(--neon-orange)] drop-shadow-[0_0_4px_var(--neon-orange)]'}`}
              />
            </div>
          </div>
        </div>

        {/* Refund Info Message */}
        <div className="p-3 bg-[var(--charcoal)] rounded-lg border border-[var(--silver-dark)] border-opacity-20">
          <p className="text-xs text-[var(--metallic-silver)] leading-relaxed">
            <span className={`${isEmergencyRefund ? 'text-red-500' : 'text-[var(--neon-orange)]'} font-medium`}>Note:</span> 
            {isEmergencyRefund 
              ? ' You are requesting an emergency refund because liquidity was not added in time. Your full contribution will be returned.'
              : ' After requesting a refund, you will receive your full contribution amount back to your wallet.'
            } This action cannot be undone.
          </p>
        </div>

        {isConnected ? (
          <Button
            type="button"
            className={`w-full ${isEmergencyRefund 
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
              : 'bg-gradient-to-r from-[var(--neon-orange)] to-red-600 hover:from-red-600 hover:to-[var(--neon-orange)]'
            }`}
            isLoading={isLoading}
            loadingText={isEmergencyRefund ? "Requesting Emergency Refund..." : "Requesting Refund..."}
            onClick={isEmergencyRefund ? onRequestEmergencyRefund : onRequestRefund}
            disabled={isLoading}
          >
            {isEmergencyRefund ? 'Request Emergency Refund' : 'Request Refund'}
          </Button>
        ) : (
          <Button type="button" className="w-full" disabled>
            Connect Wallet to Continue
          </Button>
        )}
      </div>
    </Card>
  )
}