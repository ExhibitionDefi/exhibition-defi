import React from 'react'
import { Info, Coins, Droplets, Wallet } from 'lucide-react'
import { ExhibitionFormatters } from '@/utils/exFormatters'

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
}

export const FinalizeLiquidityPreviewCard: React.FC<FinalizeLiquidityPreviewCardProps> = ({
  project,
  platformFeePercentage,
  isLoading = false,
}) => {
  // Get contribution token decimals (assuming 18 for ERC20)
  const contributionDecimals = 18

  // Calculate all amounts using the utility function
  const allocations = ExhibitionFormatters.calculateLiquidityAmounts(
    project.totalRaised,
    platformFeePercentage,
    project.liquidityPercentage,
    project.tokenPrice,
    contributionDecimals,
    project.tokenDecimals
  )

  // Format amounts for display
  const formatAmount = (amount: bigint, decimals: number, symbol: string) => {
    return `${ExhibitionFormatters.formatTokenAmount(amount, decimals)} ${symbol}`
  }

  if (isLoading) {
    return (
      <div className="bg-[var(--charcoal)] border border-[var(--silver-dark)]/30 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[var(--silver-dark)]/20 rounded w-3/4"></div>
          <div className="h-20 bg-[var(--silver-dark)]/20 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--obsidian)] border border-[var(--neon-cyan)]/20 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-[var(--platinum)] mb-1">
            Transaction Preview
          </h3>
          <p className="text-sm text-[var(--silver-light)]">
            Review fund allocation before finalizing
          </p>
        </div>
        <div className="bg-[var(--neon-cyan)]/10 p-2 rounded-lg">
          <Info className="h-5 w-5 text-[var(--neon-cyan)]" />
        </div>
      </div>

      {/* Total Raised Banner */}
      <div className="bg-[var(--obsidian)] border border-[var(--silver-dark)]/20 rounded-xl p-4">
        <div className="text-sm text-[var(--silver-light)] mb-1">Total Raised</div>
        <div className="text-2xl font-bold text-[var(--neon-cyan)]">
          {formatAmount(project.totalRaised, contributionDecimals, project.contributionTokenSymbol)}
        </div>
      </div>

      {/* Allocation Breakdown */}
      <div className="space-y-3">
        {/* Platform Fee */}
        <div className="bg-[var(--obsidian)]/50 border border-[var(--neon-orange)]/20 rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-[var(--neon-orange)]/10 p-2 rounded-lg">
                <Coins className="h-4 w-4 text-[var(--neon-orange)]" />
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--platinum)]">Platform Fee</div>
                <div className="text-xs text-[var(--silver-light)]">
                  {ExhibitionFormatters.formatPercentage(platformFeePercentage)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-[var(--neon-orange)]">
                {formatAmount(allocations.platformFeeAmount, contributionDecimals, project.contributionTokenSymbol)}
              </div>
            </div>
          </div>
        </div>

        {/* Liquidity Pool */}
        <div className="bg-[var(--obsidian)]/50 border border-[var(--neon-cyan)]/20 rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-[var(--neon-cyan)]/10 p-2 rounded-lg">
                <Droplets className="h-4 w-4 text-[var(--neon-cyan)]" />
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--platinum)]">Liquidity Pool</div>
                <div className="text-xs text-[var(--silver-light)]">
                  {ExhibitionFormatters.formatPercentage(project.liquidityPercentage)} of net raised
                </div>
              </div>
            </div>
          </div>
          
          {/* Pool composition */}
          <div className="space-y-2 pl-10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--silver-light)]">{project.contributionTokenSymbol}</span>
              <span className="font-mono text-[var(--neon-cyan)]">
                {formatAmount(allocations.contributionTokensForLiquidity, contributionDecimals, project.contributionTokenSymbol)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--silver-light)]">{project.tokenSymbol}</span>
              <span className="font-mono text-[var(--neon-cyan)]">
                {formatAmount(allocations.projectTokensForLiquidity, project.tokenDecimals, project.tokenSymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Owner Receives */}
        <div className="bg-[var(--obsidian)]/50 border border-[var(--neon-green)]/20 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-[var(--neon-green)]/10 p-2 rounded-lg">
                <Wallet className="h-4 w-4 text-[var(--neon-green)]" />
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--platinum)]">You Receive</div>
                <div className="text-xs text-[var(--silver-light)]">
                  Net after fees & liquidity
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-[var(--neon-green)]">
                {formatAmount(allocations.remainingForOwner, contributionDecimals, project.contributionTokenSymbol)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Flow */}
      <div className="bg-[var(--obsidian)]/30 border border-[var(--silver-dark)]/10 rounded-xl p-4">
        <div className="text-xs text-[var(--silver-light)] space-y-2">
          <div className="flex items-center justify-between">
            <span>Total Raised</span>
            <span className="font-mono">
              {formatAmount(project.totalRaised, contributionDecimals, project.contributionTokenSymbol)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[var(--neon-orange)]">
            <span>- Platform Fee ({ExhibitionFormatters.formatPercentage(platformFeePercentage)})</span>
            <span className="font-mono">
              -{formatAmount(allocations.platformFeeAmount, contributionDecimals, project.contributionTokenSymbol)}
            </span>
          </div>
          <div className="border-t border-[var(--silver-dark)]/20 pt-2 flex items-center justify-between">
            <span>Net Raised</span>
            <span className="font-mono">
              {formatAmount(allocations.netRaisedAfterFee, contributionDecimals, project.contributionTokenSymbol)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[var(--neon-cyan)]">
            <span>- Liquidity ({ExhibitionFormatters.formatPercentage(project.liquidityPercentage)})</span>
            <span className="font-mono">
              -{formatAmount(allocations.contributionTokensForLiquidity, contributionDecimals, project.contributionTokenSymbol)}
            </span>
          </div>
          <div className="border-t border-[var(--silver-dark)]/20 pt-2 flex items-center justify-between font-medium text-[var(--neon-green)]">
            <span>Final Amount</span>
            <span className="font-mono">
              {formatAmount(allocations.remainingForOwner, contributionDecimals, project.contributionTokenSymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20 rounded-lg p-3">
        <div className="flex gap-2">
          <Info className="h-4 w-4 text-[var(--neon-cyan)] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[var(--silver-light)] leading-relaxed">
            This transaction will add liquidity to the AMM pool and release funds to your wallet. 
            The liquidity will be locked for the duration specified in your project settings.
          </p>
        </div>
      </div>
    </div>
  )
}