// src/components/projects/CreateProjectForm.tsx
import React, { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'
import { ChevronLeft, ChevronRight, Check, Info, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Checkbox } from '../ui/Checkbox'
import { Alert } from '../ui/Alert'
import type { CreateProjectFormData } from '@/hooks/pad/useCreateProject'
import { SUPPORTED_EXH, SUPPORTED_EXUSDT, SUPPORTED_EXNEX } from '@/config/contracts'

interface CreateProjectFormProps {
  onSubmit: (data: CreateProjectFormData) => void
  isSubmitting: boolean
  error?: Error | null
}

const CONTRIBUTION_TOKENS = [
  { address: SUPPORTED_EXH, symbol: 'EXH', name: 'Exhibition Token' },
  { address: SUPPORTED_EXUSDT, symbol: 'exUSDT', name: 'Exhibition USDT' },
  { address: SUPPORTED_EXNEX, symbol: 'exNEX', name: 'Exhibition NEX' },
] as const

const getDefaultStartTime = (): Date => {
  const date = new Date()
  date.setHours(date.getHours() + 1)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
}

const getDefaultEndTime = (): Date => {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
}

const dateToLocalISO = (date: Date): string => {
  try {
    if (!date || isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  } catch {
    return ''
  }
}

const localISOToDate = (isoString: string): Date => {
  if (!isoString) return new Date()
  const [datePart, timePart] = isoString.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({
  onSubmit,
  isSubmitting,
  error,
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CreateProjectFormData>({
    projectTokenName: '',
    projectTokenSymbol: '',
    initialTotalSupply: '',
    projectTokenLogoURI: '',
    contributionTokenAddress: SUPPORTED_EXH,
    fundingGoal: '',
    softCap: '',
    minContribution: '',
    maxContribution: '',
    tokenPrice: '',
    startTime: getDefaultStartTime(),
    endTime: getDefaultEndTime(),
    amountTokensForSale: '',
    liquidityPercentage: '',
    lockDuration: '',
    vestingEnabled: false,
    vestingCliff: '0',
    vestingDuration: '0',
    vestingInterval: '0',
    vestingInitialRelease: '0',
    contributionTokenDecimals: 18,
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const { data: tokenDecimals } = useReadContract({
    address: formData.contributionTokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  useEffect(() => {
    if (tokenDecimals !== undefined) {
      setFormData((prev) => ({ ...prev, contributionTokenDecimals: tokenDecimals }))
    }
  }, [tokenDecimals])

  const handleChange = (field: keyof CreateProjectFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const handleDateChange = (field: 'startTime' | 'endTime', value: string) => {
    const date = localISOToDate(value)
    handleChange(field, date)
  }

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.projectTokenName) errors.projectTokenName = 'Token name is required'
        if (!formData.projectTokenSymbol) errors.projectTokenSymbol = 'Token symbol is required'
        if (!formData.initialTotalSupply) errors.initialTotalSupply = 'Total supply is required'
        break

      case 2:
        if (!formData.fundingGoal) errors.fundingGoal = 'Funding goal is required'
        if (!formData.softCap) errors.softCap = 'Soft cap is required'
        if (!formData.minContribution) errors.minContribution = 'Min contribution is required'
        if (!formData.maxContribution) errors.maxContribution = 'Max contribution is required'
        if (!formData.tokenPrice) errors.tokenPrice = 'Token price is required'
        if (!formData.amountTokensForSale) errors.amountTokensForSale = 'Amount for sale is required'

        const softCap = parseFloat(formData.softCap)
        const fundingGoal = parseFloat(formData.fundingGoal)
        if (softCap > fundingGoal) errors.softCap = 'Soft cap cannot exceed funding goal'

        const minContrib = parseFloat(formData.minContribution)
        const maxContrib = parseFloat(formData.maxContribution)
        if (minContrib > maxContrib) errors.minContribution = 'Min cannot exceed max contribution'

        const amountForSale = parseFloat(formData.amountTokensForSale)
        const totalSupply = parseFloat(formData.initialTotalSupply)
        if (amountForSale > totalSupply) errors.amountTokensForSale = 'Cannot exceed total supply'
        break

      case 3:
        if (formData.startTime <= new Date()) {
          errors.startTime = 'Start time must be in the future'
        }
        if (formData.startTime >= formData.endTime) {
          errors.endTime = 'End time must be after start time'
        }
        const duration =
          (formData.endTime.getTime() - formData.startTime.getTime()) / (24 * 60 * 60 * 1000)
        if (duration > 7) {
          errors.endTime = 'Project duration cannot exceed 7 days'
        }
        break

      case 4:
        if (!formData.liquidityPercentage) errors.liquidityPercentage = 'Liquidity % is required'
        if (!formData.lockDuration) errors.lockDuration = 'Lock duration is required'

        const liquidityPct = parseFloat(formData.liquidityPercentage)
        if (liquidityPct < 70 || liquidityPct > 100) {
          errors.liquidityPercentage = 'Must be between 70-100%'
        }

        const lockDuration = parseFloat(formData.lockDuration)
        if (lockDuration < 14) {
          errors.lockDuration = 'Minimum 14 days required'
        }
        break

      case 5:
        if (formData.vestingEnabled) {
          if (!formData.vestingDuration || formData.vestingDuration === '0') {
            errors.vestingDuration = 'Duration required when vesting enabled'
          }
          if (!formData.vestingInterval || formData.vestingInterval === '0') {
            errors.vestingInterval = 'Interval required when vesting enabled'
          }
        }
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 6))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep(currentStep)) {
      onSubmit(formData)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="border-l-4 border-[var(--neon-blue)] pl-4">
              <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
                Project Token Details
              </h3>
              <p className="text-[var(--metallic-silver)] leading-relaxed">
                Define the basic properties of your project token. All project tokens use 18 decimals for compatibility with DeFi standards.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="projectTokenName" className="text-base">
                  Token Name <span className="text-[var(--neon-orange)]">*</span>
                </Label>
                <Input
                  id="projectTokenName"
                  value={formData.projectTokenName}
                  onChange={(e) => handleChange('projectTokenName', e.target.value)}
                  placeholder="e.g., Nexus Supporter Token"
                  error={validationErrors.projectTokenName}
                  className="text-base"
                />
                <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  The full name of your token that will be displayed across the platform
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectTokenSymbol" className="text-base">
                  Token Symbol <span className="text-[var(--neon-orange)]">*</span>
                </Label>
                <Input
                  id="projectTokenSymbol"
                  value={formData.projectTokenSymbol}
                  onChange={(e) => handleChange('projectTokenSymbol', e.target.value.toUpperCase())}
                  placeholder="e.g., NST"
                  maxLength={10}
                  error={validationErrors.projectTokenSymbol}
                  className="text-base font-mono"
                />
                <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  A short identifier for your token (3-10 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialTotalSupply" className="text-base">
                  Total Supply <span className="text-[var(--neon-orange)]">*</span>
                </Label>
                <Input
                  id="initialTotalSupply"
                  type="number"
                  value={formData.initialTotalSupply}
                  onChange={(e) => handleChange('initialTotalSupply', e.target.value)}
                  placeholder="1000000"
                  error={validationErrors.initialTotalSupply}
                  className="text-base font-mono"
                />
                <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Total number of tokens that will exist (18 decimals standard)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectTokenLogoURI" className="text-base">
                  Logo URI <span className="text-[var(--metallic-silver)] text-sm">(optional)</span>
                </Label>
                <Input
                  id="projectTokenLogoURI"
                  value={formData.projectTokenLogoURI}
                  onChange={(e) => handleChange('projectTokenLogoURI', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="text-base font-mono text-sm"
                />
                <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  URL to your token logo image (recommended: 256x256 PNG)
                </p>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-8">
            <div className="border-l-4 border-[var(--neon-blue)] pl-4">
              <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
                Funding Configuration
              </h3>
              <p className="text-[var(--metallic-silver)] leading-relaxed">
                Set your funding goals, contribution limits, and token pricing to define how supporters can participate in your project.
              </p>
            </div>

            <div className="bg-[var(--charcoal)] border border-[var(--neon-blue)]/30 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm text-[var(--silver-light)]">
                  <p className="font-semibold">Important Guidelines:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>Soft cap must not exceed hard cap (funding goal)</li>
                    <li>Tokens for sale cannot exceed total supply</li>
                    <li>Set realistic contribution limits for fair distribution</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="contributionTokenAddress" className="text-base">
                  Contribution Token <span className="text-[var(--neon-orange)]">*</span>
                </Label>
                <select
                  id="contributionTokenAddress"
                  value={formData.contributionTokenAddress}
                  onChange={(e) => handleChange('contributionTokenAddress', e.target.value as `0x${string}`)}
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

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fundingGoal" className="text-base">
                    Funding Goal (Hard Cap) <span className="text-[var(--neon-orange)]">*</span>
                  </Label>
                  <Input
                    id="fundingGoal"
                    type="number"
                    step="0.01"
                    value={formData.fundingGoal}
                    onChange={(e) => handleChange('fundingGoal', e.target.value)}
                    placeholder="100000"
                    error={validationErrors.fundingGoal}
                    className="text-base font-mono"
                  />
                  <p className="text-sm text-[var(--metallic-silver)]">Maximum amount to raise</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="softCap" className="text-base">
                    Soft Cap <span className="text-[var(--neon-orange)]">*</span>
                  </Label>
                  <Input
                    id="softCap"
                    type="number"
                    step="0.01"
                    value={formData.softCap}
                    onChange={(e) => handleChange('softCap', e.target.value)}
                    placeholder="50000"
                    error={validationErrors.softCap}
                    className="text-base font-mono"
                  />
                  <p className="text-sm text-[var(--metallic-silver)]">Minimum for success</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="minContribution" className="text-base">
                    Min Contribution <span className="text-[var(--neon-orange)]">*</span>
                  </Label>
                  <Input
                    id="minContribution"
                    type="number"
                    step="0.01"
                    value={formData.minContribution}
                    onChange={(e) => handleChange('minContribution', e.target.value)}
                    placeholder="10"
                    error={validationErrors.minContribution}
                    className="text-base font-mono"
                  />
                  <p className="text-sm text-[var(--metallic-silver)]">Per wallet minimum</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxContribution" className="text-base">
                    Max Contribution <span className="text-[var(--neon-orange)]">*</span>
                  </Label>
                  <Input
                    id="maxContribution"
                    type="number"
                    step="0.01"
                    value={formData.maxContribution}
                    onChange={(e) => handleChange('maxContribution', e.target.value)}
                    placeholder="1000"
                    error={validationErrors.maxContribution}
                    className="text-base font-mono"
                  />
                  <p className="text-sm text-[var(--metallic-silver)]">Per wallet maximum</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokenPrice" className="text-base">
                  Token Price <span className="text-[var(--neon-orange)]">*</span>
                </Label>
                <Input
                  id="tokenPrice"
                  type="number"
                  step="0.000000000000000001"
                  value={formData.tokenPrice}
                  onChange={(e) => handleChange('tokenPrice', e.target.value)}
                  placeholder="0.001"
                  error={validationErrors.tokenPrice}
                  className="text-base font-mono"
                />
                <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Price per token in contribution token (18 decimal format)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountTokensForSale" className="text-base">
                  Tokens For Sale <span className="text-[var(--neon-orange)]">*</span>
                </Label>
                <Input
                  id="amountTokensForSale"
                  type="number"
                  value={formData.amountTokensForSale}
                  onChange={(e) => handleChange('amountTokensForSale', e.target.value)}
                  placeholder="500000"
                  error={validationErrors.amountTokensForSale}
                  className="text-base font-mono"
                />
                <p className="text-sm text-[var(--metallic-silver)]">
                  Number of tokens available in this sale
                </p>
              </div>
            </div>
          </div>
        )

      case 3:
        const duration = formData.endTime && formData.startTime 
          ? ((formData.endTime.getTime() - formData.startTime.getTime()) / (24 * 60 * 60 * 1000)).toFixed(1)
          : '0'
        const durationExceeded = parseFloat(duration) > 7

        return (
          <div className="space-y-8">
            <div className="border-l-4 border-[var(--neon-blue)] pl-4">
              <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
                Project Timeline
              </h3>
              <p className="text-[var(--metallic-silver)] leading-relaxed">
                Define when your project will begin accepting contributions and when the funding period will conclude.
              </p>
            </div>

            <div className="bg-[var(--charcoal)] border border-[var(--neon-blue)]/30 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm text-[var(--silver-light)]">
                  <p className="font-semibold">Timeline Requirements:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>Start time must be at least 20 minutes in the future</li>
                    <li className="font-bold text-[var(--neon-orange)]">Maximum project duration is 7 days</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-base">
                  Start Time <span className="text-[var(--neon-orange)]">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={dateToLocalISO(formData.startTime)}
                  onChange={(e) => handleDateChange('startTime', e.target.value)}
                  error={validationErrors.startTime}
                  className="text-base font-mono"
                />
                <p className="text-sm text-[var(--metallic-silver)] bg-[var(--charcoal)] px-3 py-2 rounded border border-[var(--silver-dark)]/10">
                  📅 {formData.startTime.toLocaleString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-base">
                  End Time <span className="text-[var(--neon-orange)]">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={dateToLocalISO(formData.endTime)}
                  onChange={(e) => handleDateChange('endTime', e.target.value)}
                  error={validationErrors.endTime}
                  className="text-base font-mono"
                />
                <p className="text-sm text-[var(--metallic-silver)] bg-[var(--charcoal)] px-3 py-2 rounded border border-[var(--silver-dark)]/10">
                  📅 {formData.endTime.toLocaleString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>

              <div className={`p-6 rounded-xl border-2 ${
                durationExceeded 
                  ? 'bg-[var(--neon-orange)]/5 border-[var(--neon-orange)]' 
                  : 'bg-[var(--neon-blue)]/5 border-[var(--neon-blue)]'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--metallic-silver)] mb-1">
                      Campaign Duration
                    </p>
                    <p className={`text-3xl font-bold ${
                      durationExceeded ? 'text-[var(--neon-orange)]' : 'text-[var(--neon-blue)]'
                    }`}>
                      {duration} days
                    </p>
                  </div>
                  {durationExceeded && (
                    <AlertCircle className="w-8 h-8 text-[var(--neon-orange)]" />
                  )}
                </div>
                {durationExceeded && (
                  <p className="text-sm text-[var(--neon-orange)] mt-3">
                    Duration exceeds 7-day maximum
                  </p>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-8">
            <div className="border-l-4 border-[var(--neon-blue)] pl-4">
              <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
                Liquidity & Lock Settings
              </h3>
              <p className="text-[var(--metallic-silver)] leading-relaxed">
                Configure how much of the raised funds will be added to liquidity pools and how long it will remain locked for investor protection.
              </p>
            </div>

            <div className="bg-[var(--charcoal)] border border-[var(--neon-blue)]/30 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm text-[var(--silver-light)]">
                  <p className="font-semibold">Liquidity Requirements:</p>
                  <ul className="space-y-1 ml-4 list-disc">
                    <li>Liquidity percentage must be between 70-100%</li>
                    <li className="font-bold text-[var(--neon-orange)]">Minimum lock duration is 14 days</li>
                    <li>Higher percentages and longer locks build investor confidence</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="liquidityPercentage" className="text-base">
                  Liquidity Percentage <span className="text-[var(--neon-orange)]">*</span>
                </Label>
                <Input
                  id="liquidityPercentage"
                  type="number"
                  min={70}
                  max={100}
                  value={formData.liquidityPercentage}
                  onChange={(e) => handleChange('liquidityPercentage', e.target.value)}
                  placeholder="80"
                  error={validationErrors.liquidityPercentage}
                  className="text-base font-mono"
                />
                <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Percentage of raised funds to add to liquidity pool (70-100%)
                </p>
                {formData.liquidityPercentage && (
                  <div className="mt-3 p-3 bg-[var(--charcoal)] rounded-lg border border-[var(--silver-dark)]/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--metallic-silver)]">To Liquidity:</span>
                      <span className="text-[var(--neon-blue)] font-semibold">{formData.liquidityPercentage}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-[var(--metallic-silver)]">To Project:</span>
                      <span className="text-[var(--silver-light)] font-semibold">{100 - parseFloat(formData.liquidityPercentage || '0')}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lockDuration" className="text-base">
                  Lock Duration (days) <span className="text-[var(--neon-orange)]">*</span>
                </Label>
                <Input
                  id="lockDuration"
                  type="number"
                  value={formData.lockDuration}
                  onChange={(e) => handleChange('lockDuration', e.target.value)}
                  placeholder="14"
                  error={validationErrors.lockDuration}
                  className="text-base font-mono"
                />
                <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  How long liquidity tokens will be locked (minimum 14 days)
                </p>
                {formData.lockDuration && parseFloat(formData.lockDuration) >= 14 && (
                  <div className="mt-3 p-3 bg-[var(--neon-blue)]/5 rounded-lg border border-[var(--neon-blue)]/30">
                    <p className="text-sm text-[var(--neon-blue)] flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Liquidity will be locked until {new Date(Date.now() + parseFloat(formData.lockDuration) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-8">
            <div className="border-l-4 border-[var(--neon-blue)] pl-4">
              <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
                Token Vesting Configuration
              </h3>
              <p className="text-[var(--metallic-silver)] leading-relaxed">
                Optional feature to release tokens gradually over time, which can help with price stability and long-term holder alignment.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-[var(--charcoal)] rounded-lg border border-[var(--silver-dark)]/20">
                <Checkbox
                  id="vestingEnabled"
                  checked={formData.vestingEnabled}
                  onChange={(e) => handleChange('vestingEnabled', e.target.checked)}
                  label=""
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="vestingEnabled" className="text-base font-semibold text-[var(--silver-light)] cursor-pointer block mb-1">
                    Enable Token Vesting
                  </label>
                  <p className="text-sm text-[var(--metallic-silver)]">
                    Release tokens gradually to contributors over a defined schedule
                  </p>
                </div>
              </div>

              {!formData.vestingEnabled && (
                <div className="bg-[var(--neon-blue)]/5 border border-[var(--neon-blue)]/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Check className="w-5 h-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-[var(--silver-light)]">
                      <p className="font-semibold mb-1">Immediate Token Distribution</p>
                      <p className="text-[var(--metallic-silver)]">
                        All tokens will be available for immediate claiming after the project successfully ends.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {formData.vestingEnabled && (
                <>
                  <div className="bg-[var(--charcoal)] border border-[var(--neon-blue)]/30 rounded-lg p-4">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
                      <div className="space-y-2 text-sm text-[var(--silver-light)]">
                        <p className="font-semibold">Vesting Schedule Benefits:</p>
                        <ul className="space-y-1 ml-4 list-disc text-[var(--metallic-silver)]">
                          <li>Encourages long-term holding and reduces sell pressure</li>
                          <li>Aligns contributor interests with project success</li>
                          <li>Demonstrates commitment to sustainable tokenomics</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="vestingCliff" className="text-base">
                        Cliff Period (days)
                      </Label>
                      <Input
                        id="vestingCliff"
                        type="number"
                        min={0}
                        value={formData.vestingCliff}
                        onChange={(e) => handleChange('vestingCliff', e.target.value)}
                        placeholder="0"
                        className="text-base font-mono"
                      />
                      <p className="text-sm text-[var(--metallic-silver)]">
                        Initial waiting period before any vesting begins
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vestingDuration" className="text-base">
                        Total Duration (days) <span className="text-[var(--neon-orange)]">*</span>
                      </Label>
                      <Input
                        id="vestingDuration"
                        type="number"
                        min={1}
                        value={formData.vestingDuration}
                        onChange={(e) => handleChange('vestingDuration', e.target.value)}
                        placeholder="180"
                        error={validationErrors.vestingDuration}
                        className="text-base font-mono"
                      />
                      <p className="text-sm text-[var(--metallic-silver)]">
                        Total time over which tokens vest
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vestingInterval" className="text-base">
                        Release Interval (days) <span className="text-[var(--neon-orange)]">*</span>
                      </Label>
                      <Input
                        id="vestingInterval"
                        type="number"
                        min={1}
                        value={formData.vestingInterval}
                        onChange={(e) => handleChange('vestingInterval', e.target.value)}
                        placeholder="30"
                        error={validationErrors.vestingInterval}
                        className="text-base font-mono"
                      />
                      <p className="text-sm text-[var(--metallic-silver)]">
                        Frequency of token releases
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vestingInitialRelease" className="text-base">
                        Initial Release (%)
                      </Label>
                      <Input
                        id="vestingInitialRelease"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.vestingInitialRelease}
                        onChange={(e) => handleChange('vestingInitialRelease', e.target.value)}
                        placeholder="10"
                        className="text-base font-mono"
                      />
                      <p className="text-sm text-[var(--metallic-silver)]">
                        Percentage unlocked immediately
                      </p>
                    </div>
                  </div>

                  {formData.vestingDuration && formData.vestingInterval && (
                    <div className="p-4 bg-[var(--charcoal)] rounded-lg border border-[var(--silver-dark)]/20">
                      <p className="text-sm font-semibold text-[var(--silver-light)] mb-3">Vesting Summary:</p>
                      <div className="space-y-2 text-sm text-[var(--metallic-silver)]">
                        <div className="flex justify-between">
                          <span>Initial Release:</span>
                          <span className="text-[var(--silver-light)] font-mono">{formData.vestingInitialRelease}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cliff Period:</span>
                          <span className="text-[var(--silver-light)] font-mono">{formData.vestingCliff} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Releases:</span>
                          <span className="text-[var(--silver-light)] font-mono">
                            ~{Math.ceil(parseFloat(formData.vestingDuration) / parseFloat(formData.vestingInterval))} releases
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Release Frequency:</span>
                          <span className="text-[var(--silver-light)] font-mono">Every {formData.vestingInterval} days</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )

      case 6:
        const selectedToken = CONTRIBUTION_TOKENS.find(t => t.address === formData.contributionTokenAddress)
        
        return (
          <div className="space-y-8">
            <div className="border-l-4 border-[var(--neon-blue)] pl-4">
              <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
                Review & Submit
              </h3>
              <p className="text-[var(--metallic-silver)] leading-relaxed">
                Please carefully review all project details before submission. Once created, these parameters cannot be changed.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-[var(--charcoal)] border border-[var(--silver-dark)]/20 rounded-xl overflow-hidden">
                <div className="bg-[var(--neon-blue)]/10 border-b border-[var(--silver-dark)]/20 px-6 py-4">
                  <h4 className="font-bold text-lg text-[var(--silver-light)]">Token Details</h4>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                    <span className="text-[var(--metallic-silver)]">Name:</span>
                    <span className="text-[var(--silver-light)] font-semibold text-right">{formData.projectTokenName}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                    <span className="text-[var(--metallic-silver)]">Symbol:</span>
                    <span className="text-[var(--silver-light)] font-mono font-semibold">{formData.projectTokenSymbol}</span>
                  </div>
                  <div className="flex justify-between items-start py-2">
                    <span className="text-[var(--metallic-silver)]">Total Supply:</span>
                    <span className="text-[var(--silver-light)] font-mono font-semibold">{parseFloat(formData.initialTotalSupply).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--charcoal)] border border-[var(--silver-dark)]/20 rounded-xl overflow-hidden">
                <div className="bg-[var(--neon-blue)]/10 border-b border-[var(--silver-dark)]/20 px-6 py-4">
                  <h4 className="font-bold text-lg text-[var(--silver-light)]">Funding Configuration</h4>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                    <span className="text-[var(--metallic-silver)]">Contribution Token:</span>
                    <span className="text-[var(--silver-light)] font-semibold">{selectedToken?.symbol}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                    <span className="text-[var(--metallic-silver)]">Hard Cap:</span>
                    <span className="text-[var(--silver-light)] font-mono font-semibold">{parseFloat(formData.fundingGoal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                    <span className="text-[var(--metallic-silver)]">Soft Cap:</span>
                    <span className="text-[var(--silver-light)] font-mono font-semibold">{parseFloat(formData.softCap).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                    <span className="text-[var(--metallic-silver)]">Token Price:</span>
                    <span className="text-[var(--silver-light)] font-mono font-semibold">{formData.tokenPrice}</span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                    <span className="text-[var(--metallic-silver)]">Contribution Range:</span>
                    <span className="text-[var(--silver-light)] font-mono font-semibold">
                      {formData.minContribution} - {formData.maxContribution}
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-2">
                    <span className="text-[var(--metallic-silver)]">Tokens for Sale:</span>
                    <span className="text-[var(--silver-light)] font-mono font-semibold">{parseFloat(formData.amountTokensForSale).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--charcoal)] border border-[var(--silver-dark)]/20 rounded-xl overflow-hidden">
                <div className="bg-[var(--neon-blue)]/10 border-b border-[var(--silver-dark)]/20 px-6 py-4">
                  <h4 className="font-bold text-lg text-[var(--silver-light)]">Timeline</h4>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                    <span className="text-[var(--metallic-silver)]">Start Time:</span>
                    <span className="text-[var(--silver-light)] font-semibold text-right">
                      {formData.startTime.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                    <span className="text-[var(--metallic-silver)]">End Time:</span>
                    <span className="text-[var(--silver-light)] font-semibold text-right">
                      {formData.endTime.toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-start py-2">
                    <span className="text-[var(--metallic-silver)]">Duration:</span>
                    <span className="text-[var(--neon-blue)] font-bold">
                      {((formData.endTime.getTime() - formData.startTime.getTime()) / (24 * 60 * 60 * 1000)).toFixed(1)} days
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--charcoal)] border border-[var(--silver-dark)]/20 rounded-xl overflow-hidden">
                <div className="bg-[var(--neon-blue)]/10 border-b border-[var(--silver-dark)]/20 px-6 py-4">
                  <h4 className="font-bold text-lg text-[var(--silver-light)]">Liquidity & Lock</h4>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                    <span className="text-[var(--metallic-silver)]">Liquidity Percentage:</span>
                    <span className="text-[var(--silver-light)] font-mono font-semibold">{formData.liquidityPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-start py-2">
                    <span className="text-[var(--metallic-silver)]">Lock Duration:</span>
                    <span className="text-[var(--silver-light)] font-mono font-semibold">{formData.lockDuration} days</span>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--charcoal)] border border-[var(--silver-dark)]/20 rounded-xl overflow-hidden">
                <div className="bg-[var(--neon-blue)]/10 border-b border-[var(--silver-dark)]/20 px-6 py-4">
                  <h4 className="font-bold text-lg text-[var(--silver-light)]">Vesting Schedule</h4>
                </div>
                <div className="p-6">
                  {formData.vestingEnabled ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                        <span className="text-[var(--metallic-silver)]">Status:</span>
                        <span className="text-[var(--neon-blue)] font-semibold">Enabled</span>
                      </div>
                      <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                        <span className="text-[var(--metallic-silver)]">Initial Release:</span>
                        <span className="text-[var(--silver-light)] font-mono font-semibold">{formData.vestingInitialRelease}%</span>
                      </div>
                      <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                        <span className="text-[var(--metallic-silver)]">Cliff Period:</span>
                        <span className="text-[var(--silver-light)] font-mono font-semibold">{formData.vestingCliff} days</span>
                      </div>
                      <div className="flex justify-between items-start py-2 border-b border-[var(--silver-dark)]/10">
                        <span className="text-[var(--metallic-silver)]">Total Duration:</span>
                        <span className="text-[var(--silver-light)] font-mono font-semibold">{formData.vestingDuration} days</span>
                      </div>
                      <div className="flex justify-between items-start py-2">
                        <span className="text-[var(--metallic-silver)]">Release Interval:</span>
                        <span className="text-[var(--silver-light)] font-mono font-semibold">{formData.vestingInterval} days</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-[var(--neon-blue)]">
                      <Check className="w-5 h-5" />
                      <span className="font-semibold">No vesting - Immediate token distribution</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[var(--neon-orange)]/5 border-2 border-[var(--neon-orange)]/30 rounded-xl p-6">
                <div className="flex gap-4">
                  <AlertCircle className="w-6 h-6 text-[var(--neon-orange)] flex-shrink-0 mt-1" />
                  <div>
                    <h5 className="font-bold text-[var(--neon-orange)] mb-3 text-lg">Before You Submit</h5>
                    <ul className="space-y-2 text-sm text-[var(--silver-light)]">
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--neon-orange)] mt-1">•</span>
                        <span>Ensure all information is correct - parameters cannot be changed after creation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--neon-orange)] mt-1">•</span>
                        <span>You will need to approve and deposit tokens after project creation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--neon-orange)] mt-1">•</span>
                        <span>Transaction will require gas fees on the Exhibition network</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--neon-orange)] mt-1">•</span>
                        <span>Make sure you have sufficient funds in your wallet</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="
        space-y-8 
        w-full 
        max-w-full 
        sm:max-w-lg 
        md:max-w-xl 
        lg:max-w-2xl 
        xl:max-w-3xl 
        mx-auto 
        px-4
      "
    >
      {error && (
        <Alert variant="error" title="Transaction Failed">
          {error.message || 'Failed to create project. Please try again.'}
        </Alert>
      )}

      <div className="bg-[var(--charcoal)] border border-[var(--silver-dark)]/20 rounded-2xl p-6 sm:p-8 md:p-10">
        {renderStepContent()}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
          className="w-full sm:w-auto px-6 py-3"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        <div className="text-sm text-[var(--metallic-silver)] hidden md:block">
          Step {currentStep} of 6
        </div>

        {currentStep < 6 ? (
          <Button
            type="button"
            variant="primary"
            onClick={handleNext}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3 font-bold"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </Button>
        )}
      </div>
    </form>
  )
}