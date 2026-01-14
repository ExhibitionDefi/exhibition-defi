import React from 'react'
import { Info, Coins, Droplets, Wallet } from 'lucide-react'
import { ExhibitionFormatters } from '@/utils/exFormatters'
import { Button } from '@/components/ui/Button'

interface FinalizeLiquidityPreviewCardProps {
  project: {
    totalRaised: bigint
    liquidityPercentage: bigint
    tokenPrice: bigint
    tokenSymbol: string
    tokenDecimals: number
    contributionTokenSymbol: string
    contributionTokenDecimals: number
    contributionTokenAddress: `0x${string}`
  }
  platformFeePercentage: bigint
  isLoading?: boolean
  onFinalize?: () => void
  buttonState?: {
    text: string
    disabled: boolean
  }
}

export const FinalizeLiquidityPreviewCard: React.FC<FinalizeLiquidityPreviewCardProps> = ({
  project,
  platformFeePercentage,
  isLoading = false,
  onFinalize,
  buttonState = { text: 'Finalize Liquidity & Release Funds', disabled: false },
}) => {
  const allocations = ExhibitionFormatters.calculateLiquidityAmounts(
    project.totalRaised,
    platformFeePercentage,
    project.liquidityPercentage,
    project.tokenPrice,
    project.contributionTokenDecimals,
    project.tokenDecimals
  )

  const fmt = (amount: bigint, decimals: number, symbol: string) =>
    `${ExhibitionFormatters.formatTokenAmount(amount, decimals)} ${symbol}`

  const pct = ExhibitionFormatters.formatPercentage

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto bg-[var(--charcoal)] border border-[var(--silver-dark)]/30 rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-[var(--silver-dark)]/20 rounded w-3/4" />
          <div className="h-16 bg-[var(--silver-dark)]/20 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-br from-[var(--charcoal)] to-[var(--obsidian)] border border-[var(--neon-cyan)]/20 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[var(--platinum)]">Transaction Preview</h3>
          <p className="text-xs text-[var(--silver-light)]">Review fund allocation</p>
        </div>
        <Info className="h-4 w-4 text-[var(--neon-cyan)]" />
      </div>

      {/* Total Raised */}
      <div className="bg-[var(--obsidian)] border border-[var(--silver-dark)]/20 rounded-lg p-3">
        <div className="text-xs text-[var(--silver-light)]">Total Raised</div>
        <div className="text-xl font-bold text-[var(--neon-cyan)]">
          {fmt(project.totalRaised, project.contributionTokenDecimals, project.contributionTokenSymbol)}
        </div>
      </div>

      {/* Compact Allocation Grid */}
      <div className="grid grid-cols-1 gap-2">
        {/* Platform Fee */}
        <div className="bg-[var(--obsidian)]/50 border border-[var(--neon-orange)]/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-[var(--neon-orange)]" />
            <div>
              <div className="text-xs font-medium text-[var(--platinum)]">Platform Fee</div>
              <div className="text-xs text-[var(--silver-light)]">{pct(platformFeePercentage)}</div>
            </div>
          </div>
          <div className="text-sm font-bold text-[var(--neon-orange)]">
            {fmt(allocations.platformFeeAmount, project.contributionTokenDecimals, project.contributionTokenSymbol)}
          </div>
        </div>

        {/* Liquidity Pool */}
        <div className="bg-[var(--obsidian)]/50 border border-[var(--neon-cyan)]/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-[var(--neon-cyan)]" />
              <div>
                <div className="text-xs font-medium text-[var(--platinum)]">Liquidity Pool</div>
                <div className="text-xs text-[var(--silver-light)]">{pct(project.liquidityPercentage)}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pl-6">
            <div className="text-[var(--silver-light)]">{project.contributionTokenSymbol}</div>
            <div className="font-mono text-[var(--neon-cyan)] text-right">
              {fmt(allocations.contributionTokensForLiquidity, project.contributionTokenDecimals, project.contributionTokenSymbol)}
            </div>
            <div className="text-[var(--silver-light)]">{project.tokenSymbol}</div>
            <div className="font-mono text-[var(--neon-cyan)] text-right">
              {fmt(allocations.projectTokensForLiquidity, project.tokenDecimals, project.tokenSymbol)}
            </div>
          </div>
        </div>

        {/* Owner Receives */}
        <div className="bg-[var(--obsidian)]/50 border border-[var(--neon-green)]/20 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[var(--neon-green)]" />
            <div>
              <div className="text-xs font-medium text-[var(--platinum)]">You Receive</div>
              <div className="text-xs text-[var(--silver-light)]">Net after deductions</div>
            </div>
          </div>
          <div className="text-sm font-bold text-[var(--neon-green)]">
            {fmt(allocations.remainingForOwner, project.contributionTokenDecimals, project.contributionTokenSymbol)}
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20 rounded-lg p-2 flex gap-2">
        <Info className="h-3 w-3 text-[var(--neon-cyan)] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[var(--silver-light)]">
          Adds liquidity to AMM pool and releases funds to your wallet. Liquidity locked per project settings.
        </p>
      </div>

      {/* Finalize Button */}
      {onFinalize && (
        <Button onClick={onFinalize} disabled={buttonState.disabled} className="w-full">
          {buttonState.text}
        </Button>
      )}
    </div>
  )
}