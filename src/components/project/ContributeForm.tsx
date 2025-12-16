// src/components/project/ContributeForm
import React, { useMemo } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'
import { TokenApproval } from '../common/TokenApproval'
import { type ProjectDisplayData, ProjectStatus, ProjectStatusLabels } from '../../types/project'
import { ExhibitionFormatters } from '../../utils/exFormatters'
import { EXHIBITION_ADDRESS } from '../../config/contracts'
import { Card } from '../ui/Card'
import { CheckCircle2, TrendingUp } from 'lucide-react'
import { SafeHtml, SafeAddressDisplay } from '../SafeHtml'
import { sanitizeNumber, sanitizeText } from '../../utils/sanitization'
import { logger } from '@/utils/logger'
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing'
import type { Address } from 'viem'

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
  contributionSuccess?: boolean
  txHash?: `0x${string}` 
  contributedAmount?: string 
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
  contributionSuccess = false,
  txHash,
  contributedAmount,
  onSetMaxBalance,
  onContributionChange,
  onContribute,
  onApprovalComplete,
  inputAmountBigInt
}) => {
  const { getTokenPriceUSD, isReady: isPricingReady } = useLocalPricing()

  // ✅ Sanitize token symbol for display
  const safeTokenSymbol = useMemo(() => 
    sanitizeText(contributionTokenSymbol), 
    [contributionTokenSymbol]
  )
  
  const safeProjectSymbol = useMemo(() => 
    sanitizeText(project.tokenSymbol), 
    [project.tokenSymbol]
  )

  // Calculate USD values
  const getUSDValue = (tokenAmount: bigint, decimals: number, tokenAddress?: string): string => {
    if (!isPricingReady || !tokenAddress) return ''
    
    try {
      const tokenPrice = getTokenPriceUSD(tokenAddress as Address)
      if (tokenPrice === 'N/A') return ''
      
      // Parse the price (remove $ and commas)
      const priceValue = parseFloat(tokenPrice.replace(/[$,]/g, ''))
      
      // Convert token amount to decimal
      const divisor = 10n ** BigInt(decimals)
      const tokenAmountDecimal = Number(tokenAmount) / Number(divisor)
      
      // Calculate USD value
      const usdValue = tokenAmountDecimal * priceValue
      
      return `$${usdValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    } catch (error) {
      return ''
    }
  }

  // Calculate USD for input amount
  const inputAmountUSD = getUSDValue(
    inputAmountBigInt,
    contributionTokenDecimals,
    project.contributionTokenAddress
  )

  // Calculate USD for balance
  const balanceUSD = getUSDValue(
    balanceBigInt,
    contributionTokenDecimals,
    project.contributionTokenAddress
  )

  // ✅ Handle input change with sanitization
  const handleContributionChange = (value: string) => {
    // Allow only valid number characters
    const cleaned = value.replace(/[^\d.]/g, '')
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.')
    const sanitized = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('') 
      : cleaned
    
    // Validate number before passing to parent
    const validated = sanitizeNumber(sanitized, {
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      decimals: contributionTokenDecimals
    })
    
    // Pass sanitized value to parent (or empty string if invalid)
    onContributionChange(validated !== null ? sanitized : '')
  }

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

      {/* ✅ Contribution Success Banner with Safe Address Display */}
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
              <SafeHtml 
                content={`You contributed ${contributedAmount} ${safeTokenSymbol} to this project`}
                as="p"
                className="text-xs text-[var(--silver-dark)] mb-2"
              />
              {txHash && (
                <div className="mt-2 p-2 bg-[var(--deep-black)] rounded">
                  <p className="text-xs text-[var(--silver-dark)] mb-1">Transaction Hash:</p>
                  {/* ✅ Safe address display with copy functionality */}
                  <SafeAddressDisplay 
                    address={txHash}
                    truncate={true}
                    className="text-xs text-[var(--silver-light)]"
                    onCopySuccess={() => logger.info('Transaction hash copied!')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center p-3 bg-[var(--charcoal)] rounded-lg border border-[var(--silver-dark)] border-opacity-20 hover:border-opacity-40 transition-all duration-300">
        <span className="text-sm text-[var(--metallic-silver)]">Your Balance:</span>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="font-medium text-[var(--silver-light)]">
              {ExhibitionFormatters.formatTokenWithSymbol(
                balanceBigInt,
                safeTokenSymbol,
                contributionTokenDecimals
              )}
            </div>
            {balanceUSD && (
              <div className="text-xs text-[var(--silver-dark)]">
                ≈ {balanceUSD}
              </div>
            )}
          </div>
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
                safeTokenSymbol,
                contributionTokenDecimals
              )}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--metallic-silver)]">Max:</span>
            <Badge variant="info" className="text-xs border-[var(--neon-orange)] text-[var(--neon-orange)] bg-transparent">
              {ExhibitionFormatters.formatTokenWithSymbol(
                project.maxContribution,
                safeTokenSymbol,
                contributionTokenDecimals
              )}
            </Badge>
          </div>
        </div>

        {/* ✅ Sanitized Input with USD display */}
        <div>
          <Input
            label={`Contribution Amount (${safeTokenSymbol})`}
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={contributionAmount}
            onChange={(e) => handleContributionChange(e.target.value)}
            maxLength={50} // Prevent DoS
          />
          {inputAmountUSD && inputAmountBigInt > 0n && (
            <div className="mt-1 text-xs text-[var(--silver-dark)] text-right">
              ≈ {inputAmountUSD}
            </div>
          )}
        </div>

        {tokenAmountDue > 0n && (
          <div className="p-3 bg-gradient-to-r from-[var(--charcoal)] to-[var(--deep-black)] rounded-lg border border-[var(--neon-blue)] border-opacity-40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-blue)] to-transparent opacity-5 animate-pulse"></div>
            <div className="relative flex justify-between items-center">
              <span className="text-sm text-[var(--metallic-silver)]">You will receive:</span>
              <SafeHtml 
                content={`${ExhibitionFormatters.formatLargeNumber(tokenAmountDue)} ${safeProjectSymbol}`}
                as="span"
                className="font-semibold text-[var(--neon-blue)] drop-shadow-[0_0_4px_var(--neon-blue)]"
              />
            </div>
          </div>
        )}

        {contributionAmount && Number(contributionAmount) > 0 && isConnected && (
          <TokenApproval
            tokenAddress={project.contributionTokenAddress as `0x${string}`}
            spenderAddress={EXHIBITION_ADDRESS as `0x${string}`}
            requiredAmount={inputAmountBigInt}
            tokenSymbol={safeTokenSymbol}
            onApprovalComplete={onApprovalComplete}
          >
            <Button
              type="button"
              className="w-full mt-4"
              isLoading={isLoading}
              loadingText="Contributing..."
              onClick={onContribute}
              disabled={isLoading || contributionSuccess}
            >
              {contributionSuccess 
                ? '✓ Contribution Complete' 
                : `Contribute ${contributionAmount} ${safeTokenSymbol}${inputAmountUSD ? ` (≈${inputAmountUSD})` : ''}`
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