// src/components/project/RefundRequestForm.tsx
import React, { useMemo } from 'react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { type ProjectDisplayData, ProjectStatus, ProjectStatusLabels } from '../../types/project'
import { ExhibitionFormatters } from '../../utils/exFormatters'
import { AlertTriangle } from 'lucide-react'
import { SafeHtml } from '../SafeHtml'
import { sanitizeText } from '../../utils/sanitization'

interface RefundRequestFormProps {
  project: ProjectDisplayData
  userContribution: bigint
  contributionTokenSymbol?: string
  contributionTokenDecimals?: number
  isConnected: boolean
  canRefund: boolean
  isLoading?: boolean
  onRequestRefund: () => void
}

export const RefundRequestForm: React.FC<RefundRequestFormProps> = ({
  project,
  userContribution,
  contributionTokenSymbol = 'TOKEN',
  contributionTokenDecimals = 18,
  isConnected,
  canRefund,
  isLoading,
  onRequestRefund
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

  if (!canRefund) {
    return (
      <div className="border-[var(--charcoal)] bg-[var(--deep-black)] rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-2">
          Refund Not Available
        </h3>
        <p className="text-[var(--metallic-silver)]">
          This project has not failed or you have already requested a refund.
        </p>
        <Badge variant="info" className="mt-3">
          <SafeHtml 
            content={safeStatusLabel}
            as="span"
          />
        </Badge>
      </div>
    )
  }

  // ✅ Determine status message safely
  const statusMessage = project.status === 4 ? 'failed' : 'become refundable'

  return (
    <Card hover className="border-[var(--charcoal)] bg-[var(--deep-black)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-[var(--neon-orange)] bg-opacity-10 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-[var(--neon-orange)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-1">
            Request Refund
          </h3>
          <SafeHtml 
            content={`This project has ${statusMessage}. You can request a refund for your contribution.`}
            as="p"
            className="text-sm text-[var(--metallic-silver)]"
          />
        </div>
      </div>

      <div className="space-y-4">
        {/* Project Status Badge */}
        <div className="flex justify-center">
          <Badge 
            variant={project.status === 4 ? 'error' : 'warning'}
            className="text-sm"
          >
            <SafeHtml 
              content={safeStatusLabel}
              as="span"
            />
          </Badge>
        </div>

        {/* Your Contribution Info */}
        <div className="p-4 bg-gradient-to-r from-[var(--charcoal)] to-[var(--deep-black)] rounded-lg border border-[var(--neon-orange)] border-opacity-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-orange)] to-transparent opacity-5 animate-pulse"></div>
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
                className="font-semibold text-[var(--neon-orange)] drop-shadow-[0_0_4px_var(--neon-orange)]"
              />
            </div>
          </div>
        </div>

        {/* Refund Info Message */}
        <div className="p-3 bg-[var(--charcoal)] rounded-lg border border-[var(--silver-dark)] border-opacity-20">
          <p className="text-xs text-[var(--metallic-silver)] leading-relaxed">
            <span className="text-[var(--neon-orange)] font-medium">Note:</span> After requesting a refund, 
            you will receive your full contribution amount back to your wallet. This action cannot be undone.
          </p>
        </div>

        {isConnected ? (
          <Button
            type="button"
            className="w-full bg-gradient-to-r from-[var(--neon-orange)] to-red-600 hover:from-red-600 hover:to-[var(--neon-orange)]"
            isLoading={isLoading}
            loadingText="Requesting Refund..."
            onClick={onRequestRefund}
            disabled={isLoading}
          >
            Request Refund
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