// src/components/projects/CreateProjectForm.tsx
import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Alert'
import type { CreateProjectFormData } from '@/hooks/launchpad/useCreateProject'
import { SUPPORTED_EXH } from '@/config/contracts'
import { useProjectFormPricing } from '@/hooks/launchpad/useProjectFormPricing'

// Step components
import { Step1TokenParameters } from './steps/Step1TokenParameters'
import { Step2FundingConfiguration } from './steps/Step2FundingConfiguration'
import { Step3LaunchTimeline } from './steps/Step3LaunchTimeline'
import { Step4LiquidityLock } from './steps/Step4LiquidityLock'
import { Step5VestingConfig } from './steps/Step5VestingConfig'
import { Step6ReviewSubmit } from './steps/Step6ReviewSubmit'

// 🔒 SECURITY: Import sanitization utilities
import {
  sanitizeText,
  sanitizeUrl,
  hasSuspiciousContent,
} from '@/utils/sanitization'

interface CreateProjectFormProps {
  onSubmit: (data: CreateProjectFormData) => void
  isSubmitting: boolean
  error?: Error | null
}

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
  date.setDate(date.getDate() + 21)
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  return date
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

  // Get pricing data for USD displays
  const pricing = useProjectFormPricing(formData)

  // Generic change handler
  const handleChange = (field: keyof CreateProjectFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  // Validation logic for each step
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.projectTokenName) errors.projectTokenName = 'Token name is required'
        if (!formData.projectTokenSymbol) errors.projectTokenSymbol = 'Token symbol is required'
        if (!formData.initialTotalSupply) errors.initialTotalSupply = 'Total supply is required'
        
        // 🔒 SECURITY: Additional validation
        if (formData.projectTokenName && formData.projectTokenName.length < 3) {
          errors.projectTokenName = 'Token name must be at least 3 characters'
        }
        if (formData.projectTokenSymbol && formData.projectTokenSymbol.length < 2) {
          errors.projectTokenSymbol = 'Token symbol must be at least 2 characters'
        }
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
        if (duration > 21) {
          errors.endTime = 'Project duration cannot exceed 21 days'
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

  // 🔒 SECURITY: Final sanitization before submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ ONLY allow submission on step 6
    if (currentStep !== 6) {
      return
    }

    // Create a sanitized copy of formData for submission
    const sanitizedData: CreateProjectFormData = {
      ...formData,
      projectTokenName: sanitizeText(formData.projectTokenName).slice(0, 100),
      projectTokenSymbol: sanitizeText(formData.projectTokenSymbol).toUpperCase().slice(0, 10),
      projectTokenLogoURI: sanitizeUrl(formData.projectTokenLogoURI) || '',
    }

    // Final security check
    if (hasSuspiciousContent(sanitizedData.projectTokenName)) {
      setValidationErrors(prev => ({
        ...prev,
        projectTokenName: 'Token name contains invalid characters'
      }))
      setCurrentStep(1)
      return
    }
    
    onSubmit(sanitizedData)
  }

  // Render current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1TokenParameters
            formData={formData}
            validationErrors={validationErrors}
            onChange={handleChange}
          />
        )

      case 2:
        return (
          <Step2FundingConfiguration
            formData={formData}
            validationErrors={validationErrors}
            onChange={handleChange}
            pricing={pricing}
          />
        )

      case 3:
        return (
          <Step3LaunchTimeline
            formData={formData}
            validationErrors={validationErrors}
            onChange={handleChange}
          />
        )

      case 4:
        return (
          <Step4LiquidityLock
            formData={formData}
            validationErrors={validationErrors}
            onChange={handleChange}
          />
        )

      case 5:
        return (
          <Step5VestingConfig
            formData={formData}
            validationErrors={validationErrors}
            onChange={handleChange}
          />
        )

      case 6:
        return (
          <Step6ReviewSubmit
            formData={formData}
          />
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
        sm:max-w-lg 
        md:max-w-xl 
        lg:max-w-2xl 
        xl:max-w-3xl 
        mx-auto 
        px-0 sm:px-4
      "
    >
      {error && (
        <Alert variant="error" title="Transaction Failed">
          {error.message || 'Failed to create project. Please try again.'}
        </Alert>
      )}

      <div className="bg-[var(--charcoal)] rounded-2xl p-6 sm:p-8 md:p-10">
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
            type="button" 
            variant="primary"
            onClick={handleSubmit} 
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