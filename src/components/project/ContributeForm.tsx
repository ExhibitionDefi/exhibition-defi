// src/components/project/ContributeForm
import React from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { TokenApproval } from '../common/TokenApproval'
import { type ProjectDisplayData, ProjectStatus, ProjectStatusLabels } from '../../types/project'
import { ExhibitionFormatters } from '../../utils/exFormatters'
import { EXHIBITION_ADDRESS } from '../../config/contracts'
import { Card } from '../ui/Card'
import { CheckCircle2, TrendingUp } from 'lucide-react'

interface ContributeFormProps {
  project: ProjectDisplayData
  contributionAmount: string
  tokenAmountDue: bigint
  balance: string
  inputAmountBigInt: bigint
  balanceBigInt: bigint
  contributionTokenSymbol?: string
  contributionTokenDecimals?: number
  isConnected: boolean
  canContribute: boolean
  isLoading?: boolean
  contributionSuccess?: boolean // ✅ NEW: Flag for successful contribution
  txHash?: `0x${string}` // ✅ NEW: Transaction hash
  contributedAmount?: string // ✅ NEW: Amount that was contributed
  onSetMaxBalance: () => void
  onContributionChange: (amount: string) => void
  onContribute: () => void
  onApprovalComplete: () => void
}

export const ContributeForm: React.FC<ContributeFormProps> = ({
  project,
  contributionAmount,
  tokenAmountDue,
  balance,
  balanceBigInt,
  contributionTokenSymbol = 'TOKEN',
  contributionTokenDecimals = 18,
  isConnected,
  canContribute,
  isLoading,
  contributionSuccess = false, // ✅ Default to false
  txHash,
  contributedAmount,
  onSetMaxBalance,
  onContributionChange,
  onContribute,
  onApprovalComplete,
  inputAmountBigInt
}) => {
  if (!canContribute) {
    return (
      <div className="border-[var(--charcoal)] bg-[var(--deep-black)] rounded-xl p-6 text-center">
        <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-2">
          Contributions Not Available
        </h3>
        <p className="text-[var(--metallic-silver)]">
          This project is upcoming or funding has not yet open/ended.
        </p>
        <Badge variant="info" className="mt-3">
          {ProjectStatusLabels[project.status as ProjectStatus]}
        </Badge>
      </div>
    )
  }

  const setMax = () => {
    onSetMaxBalance()
  }

  return (
    <Card hover className="border-[var(--charcoal)] bg-[var(--deep-black)]">
      <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-4">
        Contribute to Project
      </h3>

      {/* ✅ Contribution Success Banner */}
      {contributionSuccess && contributedAmount && (
        <div className="mb-4 p-4 bg-gradient-to-r from-[var(--charcoal)] to-transparent rounded-lg border-2 border-[var(--neon-blue)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-blue)] to-transparent opacity-10"></div>
          <div className="relative flex items-start space-x-3">
            <CheckCircle2 className="h-6 w-6 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--neon-blue)] mb-1 flex items-center">
                Contribution Successful! 
                <TrendingUp className="h-4 w-4 ml-2" />
              </p>
              <p className="text-xs text-[var(--silver-dark)] mb-2">
                You contributed {contributedAmount} {contributionTokenSymbol} to this project
              </p>
              {txHash && (
                <div className="mt-2 p-2 bg-[var(--deep-black)] rounded">
                  <p className="text-xs text-[var(--silver-dark)] mb-1">Transaction Hash:</p>
                  <p className="text-xs font-mono text-[var(--silver-light)] break-all">
                    {txHash}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center p-3 bg-[var(--charcoal)] rounded-lg border border-[var(--silver-dark)] border-opacity-20 hover:border-opacity-40 transition-all duration-300">
        <span className="text-sm text-[var(--metallic-silver)]">Your Balance:</span>
        <div className="flex items-center space-x-2">
          <span className="font-medium text-[var(--silver-light)]">
            {ExhibitionFormatters.formatTokenWithSymbol(
              balanceBigInt,
              contributionTokenSymbol,
              contributionTokenDecimals
            )}
          </span>
          {Number(balance) > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={setMax}
              className="text-[var(--neon-blue)] hover:text-[var(--silver-light)] hover:bg-[var(--charcoal)] border-[var(--neon-blue)] border-opacity-30 hover:border-opacity-60"
            >
              Max
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Min/Max Contribution Info */}
        <div className="flex items-center justify-between gap-2 p-3 bg-[var(--charcoal)] rounded-lg border border-[var(--silver-dark)] border-opacity-20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--metallic-silver)]">Min:</span>
            <Badge variant="info" className="text-xs border-[var(--neon-blue)] text-[var(--neon-blue)] bg-transparent">
              {ExhibitionFormatters.formatTokenWithSymbol(
                project.minContribution,
                contributionTokenSymbol,
                contributionTokenDecimals
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--metallic-silver)]">Max:</span>
            <Badge variant="info" className="text-xs border-[var(--neon-orange)] text-[var(--neon-orange)] bg-transparent">
              {ExhibitionFormatters.formatTokenWithSymbol(
                project.maxContribution,
                contributionTokenSymbol,
                contributionTokenDecimals
              )}
            </Badge>
          </div>
        </div>

        <Input
          label={`Contribution Amount (${contributionTokenSymbol})`}
          type="number"
          step="any"
          placeholder="0.0"
          value={contributionAmount}
          onChange={(e) => onContributionChange(e.target.value)}
        />

        {tokenAmountDue > 0n && (
          <div className="p-3 bg-gradient-to-r from-[var(--charcoal)] to-[var(--deep-black)] rounded-lg border border-[var(--neon-blue)] border-opacity-40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-blue)] to-transparent opacity-5 animate-pulse"></div>
            <div className="relative flex justify-between items-center">
              <span className="text-sm text-[var(--metallic-silver)]">You will receive:</span>
              <span className="font-semibold text-[var(--neon-blue)] drop-shadow-[0_0_4px_var(--neon-blue)]">
                {ExhibitionFormatters.formatLargeNumber(tokenAmountDue)} {project.tokenSymbol}
              </span>
            </div>
          </div>
        )}

        {contributionAmount && Number(contributionAmount) > 0 && isConnected && (
          <TokenApproval
            tokenAddress={project.contributionTokenAddress as `0x${string}`}
            spenderAddress={EXHIBITION_ADDRESS as `0x${string}`}
            requiredAmount={inputAmountBigInt}
            tokenSymbol={contributionTokenSymbol}
            onApprovalComplete={onApprovalComplete}
          >
            <Button
              type="button"
              className="w-full mt-4"
              isLoading={isLoading}
              loadingText="Contributing..."
              onClick={onContribute}
              disabled={isLoading || contributionSuccess} // ✅ Disable after success
            >
              {contributionSuccess 
                ? '✓ Contribution Complete' 
                : `Contribute ${contributionAmount} ${contributionTokenSymbol}`
              }
            </Button>
          </TokenApproval>
        )}

        {!isConnected && (
          <Button type="button" className="w-full" disabled>
            Connect Wallet to Continue
          </Button>
        )}

        {isConnected && (!contributionAmount) && !contributionSuccess && (
          <div className="text-center py-4">
            <p className="text-[var(--metallic-silver)] text-sm">
              Enter an amount to continue with the contribution process
            </p>
          </div>
        )}

        {/* ✅ Additional success info */}
        {contributionSuccess && (
          <div className="text-center py-3 px-4 bg-[var(--charcoal)] rounded-lg">
            <p className="text-xs text-[var(--silver-dark)]">
              Your contribution has been recorded. Check "Your Participation" section above for details.
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}