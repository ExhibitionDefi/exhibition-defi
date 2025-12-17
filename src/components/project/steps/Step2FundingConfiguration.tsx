// src/components/projects/steps/Step2FundingConfiguration.tsx
import React, { useEffect } from 'react'
import { Info, AlertCircle } from 'lucide-react'
import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import type { CreateProjectFormData } from '@/hooks/launchpad/useCreateProject'
import type { ProjectFormPricingReturn } from '@/hooks/launchpad/useProjectFormPricing'
import { SUPPORTED_EXH, SUPPORTED_EXUSD, SUPPORTED_EXNEX } from '@/config/contracts'
import { useTokenomicsValidation } from '@/hooks/launchpad/useTokenomicsValidation'
import { TokenomicsValidationDisplay } from '../TokenomicsValidationDisplay'
import { USDValueInline } from '../ui/USDValueDisplay'

interface Step2FundingConfigurationProps {
  formData: CreateProjectFormData
  validationErrors: Record<string, string>
  onChange: (field: keyof CreateProjectFormData, value: any) => void
  pricing: ProjectFormPricingReturn
}

const CONTRIBUTION_TOKENS = [
  { address: SUPPORTED_EXH, symbol: 'EXH', name: 'Exhibition Token' },
  { address: SUPPORTED_EXUSD, symbol: 'exUSD', name: 'Exhibition USD' },
  { address: SUPPORTED_EXNEX, symbol: 'exNEX', name: 'Exhibition NEX' },
] as const

export const Step2FundingConfiguration: React.FC<Step2FundingConfigurationProps> = ({
  formData,
  validationErrors,
  onChange,
  pricing,
}) => {
  const tokenomicsValidation = useTokenomicsValidation(formData)

  // Fetch contribution token decimals
  const { data: tokenDecimals } = useReadContract({
    address: formData.contributionTokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  useEffect(() => {
    if (tokenDecimals !== undefined) {
      onChange('contributionTokenDecimals', tokenDecimals)
    }
  }, [tokenDecimals, onChange])

  // ✅ NEW: Handle decimal input for price fields (allows partial input like "0.", "0.0", etc)
  const handleDecimalChange = (field: keyof CreateProjectFormData, value: string) => {
    // Allow empty string
    if (value === '') {
      onChange(field, '')
      return
    }

    // Allow single decimal point
    if (value === '.') {
      onChange(field, '0.')
      return
    }

    // Allow leading decimal (e.g., ".5" becomes "0.5")
    if (value.startsWith('.')) {
      value = '0' + value
    }

    // Remove any non-numeric characters except decimal point and leading minus
    let cleaned = value.replace(/[^\d.-]/g, '')
    
    // Ensure only one decimal point
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('')
    }

    // Ensure only one minus sign at the start
    const minusCount = (cleaned.match(/-/g) || []).length
    if (minusCount > 1) {
      cleaned = '-' + cleaned.replace(/-/g, '')
    } else if (cleaned.indexOf('-') > 0) {
      cleaned = cleaned.replace(/-/g, '')
    }

    // Allow trailing decimal point or zeros (e.g., "0.", "0.0", "0.00")
    // This enables smooth typing experience
    if (cleaned === '' || cleaned === '-') {
      onChange(field, cleaned)
      return
    }

    // Validate it's a valid number format
    const num = parseFloat(cleaned)
    if (isNaN(num)) {
      return // Don't update if invalid
    }

    // Check minimum constraint (no negative for these fields)
    if (num < 0) {
      return
    }

    // Allow the value (including trailing decimals for better UX)
    onChange(field, cleaned)
  }

  // Auto-calculate soft cap when funding goal changes
  const handleFundingGoalChange = (value: string) => {
    handleDecimalChange('fundingGoal', value)
    
    const fundingGoalValue = parseFloat(value)
    if (!isNaN(fundingGoalValue) && fundingGoalValue > 0) {
      const autoSoftCap = (fundingGoalValue * 0.51).toFixed(2)
      onChange('softCap', autoSoftCap)
    }
  }

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-[var(--neon-blue)] pl-4">
        <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
          Funding Configuration
        </h3>
        <p className="text-[var(--metallic-silver)] leading-relaxed">
          Configure funding targets, contribution bounds, and initial pricing parameters enforced by the protocol.
        </p>
      </div>

      <div className="bg-[var(--charcoal)] border border-[var(--neon-blue)]/30 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-[var(--silver-light)]">
            <p className="font-semibold">Protocol Constraints:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Soft cap must be less than or equal to the hard cap</li>
              <li>Tokens allocated for sale must not exceed total token supply</li>
              <li>Per-contributor limits should be configured to bound capital intake</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Contribution Token Selector */}
        <div className="space-y-2">
          <Label htmlFor="contributionTokenAddress" className="text-base">
            Contribution Token <span className="text-[var(--neon-orange)]">*</span>
          </Label>
          <select
            id="contributionTokenAddress"
            value={formData.contributionTokenAddress}
            onChange={(e) => onChange('contributionTokenAddress', e.target.value as `0x${string}`)}
            className="w-full px-4 py-3 bg-[var(--charcoal)] border border-[var(--silver-dark)]/20 rounded-lg text-[var(--silver-light)] focus:outline-none focus:border-[var(--neon-blue)] focus:ring-2 focus:ring-[var(--neon-blue)]/20 transition-all text-base"
          >
            {CONTRIBUTION_TOKENS.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-[var(--metallic-silver)]">
            Decimals: {formData.contributionTokenDecimals} • Token used for contributions
          </p>
        </div>

        {/* Hard Cap & Soft Cap */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fundingGoal" className="text-base">
              Funding Goal (Hard Cap) <span className="text-[var(--neon-orange)]">*</span>
            </Label>
            <Input
              id="fundingGoal"
              type="text"
              inputMode="decimal"
              value={formData.fundingGoal}
              onChange={(e) => handleFundingGoalChange(e.target.value)}
              placeholder="100000"
              error={validationErrors.fundingGoal}
              className="text-base font-mono"
            />
            {/* 💰 USD DISPLAY */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--metallic-silver)]">Maximum amount to raise</p>
              <USDValueInline 
                value={pricing.hardCapUSD} 
                isLoading={pricing.isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="softCap" className="text-base">
              Soft Cap <span className="text-[var(--neon-orange)]">*</span>
            </Label>
            <Input
              id="softCap"
              type="text"
              inputMode="decimal"
              value={formData.softCap}
              onChange={(e) => handleDecimalChange('softCap', e.target.value)}
              placeholder="Auto-calculated"
              error={validationErrors.softCap}
              className="text-base font-mono"
              readOnly
              disabled
            />
            {/* 💰 USD DISPLAY */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--metallic-silver)]">Auto-calculated as 51% of goal</p>
              <USDValueInline 
                value={pricing.softCapUSD} 
                isLoading={pricing.isLoading}
              />
            </div>
          </div>
        </div>

        {/* Min & Max Contribution */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="minContribution" className="text-base">
              Min Contribution <span className="text-[var(--neon-orange)]">*</span>
            </Label>
            <Input
              id="minContribution"
              type="text"
              inputMode="decimal"
              value={formData.minContribution}
              onChange={(e) => handleDecimalChange('minContribution', e.target.value)}
              placeholder="10"
              error={validationErrors.minContribution}
              className="text-base font-mono"
            />
            {/* 💰 USD DISPLAY */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--metallic-silver)]">Per wallet minimum</p>
              <USDValueInline 
                value={pricing.minContributionUSD} 
                isLoading={pricing.isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxContribution" className="text-base">
              Max Contribution <span className="text-[var(--neon-orange)]">*</span>
            </Label>
            <Input
              id="maxContribution"
              type="text"
              inputMode="decimal"
              value={formData.maxContribution}
              onChange={(e) => handleDecimalChange('maxContribution', e.target.value)}
              placeholder="1000"
              error={validationErrors.maxContribution}
              className="text-base font-mono"
            />
            {/* 💰 USD DISPLAY */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--metallic-silver)]">Per wallet maximum</p>
              <USDValueInline 
                value={pricing.maxContributionUSD} 
                isLoading={pricing.isLoading}
              />
            </div>
          </div>
        </div>

        {/* Token Price - ✅ UPDATED */}
        <div className="space-y-2">
          <Label htmlFor="tokenPrice" className="text-base">
            Token Price <span className="text-[var(--neon-orange)]">*</span>
          </Label>
          <Input
            id="tokenPrice"
            type="text"
            inputMode="decimal"
            value={formData.tokenPrice}
            onChange={(e) => handleDecimalChange('tokenPrice', e.target.value)}
            placeholder="0.001"
            error={validationErrors.tokenPrice}
            className="text-base font-mono"
          />
          {/* 💰 USD DISPLAY */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Price per token in contribution token
            </p>
            <USDValueInline 
              value={pricing.tokenPriceUSD} 
              isLoading={pricing.isLoading}
              label="≈ USD"
            />
          </div>
        </div>

        {/* Tokens for Sale */}
        <div className="space-y-2">
          <Label htmlFor="amountTokensForSale" className="text-base">
            Tokens For Sale <span className="text-[var(--neon-orange)]">*</span>
          </Label>
          <Input
            id="amountTokensForSale"
            type="text"
            inputMode="decimal"
            value={formData.amountTokensForSale}
            onChange={(e) => handleDecimalChange('amountTokensForSale', e.target.value)}
            placeholder="500000"
            error={validationErrors.amountTokensForSale}
            className="text-base font-mono"
          />
          {/* 💰 USD DISPLAY */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--metallic-silver)]">
              Number of tokens available in this sale
            </p>
            <USDValueInline 
              value={pricing.tokensForSaleValueUSD} 
              isLoading={pricing.isLoading}
              label="Total Value:"
            />
          </div>
        </div>

        {/* 🎯 TOKENOMICS VALIDATION */}
        {tokenomicsValidation && (
          <TokenomicsValidationDisplay
            validation={tokenomicsValidation}
            tokenSymbol={formData.projectTokenSymbol}
          />
        )}
      </div>
    </div>
  )
}