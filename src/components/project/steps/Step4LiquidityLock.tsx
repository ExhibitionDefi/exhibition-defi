// src/components/projects/steps/Step4LiquidityLock.tsx
import React from 'react'
import { Info, AlertCircle, Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import type { CreateProjectFormData } from '@/hooks/launchpad/useCreateProject'
import { sanitizeNumber } from '@/utils/sanitization'

interface Step4LiquidityLockProps {
  formData: CreateProjectFormData
  validationErrors: Record<string, string>
  onChange: (field: keyof CreateProjectFormData, value: any) => void
}

export const Step4LiquidityLock: React.FC<Step4LiquidityLockProps> = ({
  formData,
  validationErrors,
  onChange,
}) => {
  // Handle numeric field changes with sanitization
  const handleNumericChange = (field: keyof CreateProjectFormData, value: string) => {
    const num = sanitizeNumber(value, { min: 0 })
    const sanitizedValue = num !== null ? num.toString() : ''
    onChange(field, sanitizedValue)
  }

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
            onChange={(e) => handleNumericChange('liquidityPercentage', e.target.value)}
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
            onChange={(e) => handleNumericChange('lockDuration', e.target.value)}
            placeholder="14"
            error={validationErrors.lockDuration}
            className="text-base font-mono"
          />
          <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            How long liquidity tokens will be locked after liquidity is added (minimum 14 days)
          </p>
          {formData.lockDuration && parseFloat(formData.lockDuration) >= 14 && (
            <div className="mt-3 p-3 bg-[var(--neon-blue)]/5 rounded-lg border border-[var(--neon-blue)]/30">
              <p className="text-sm text-[var(--neon-blue)] flex items-center gap-2">
                <Check className="w-4 h-4" />
                Liquidity will be locked for {formData.lockDuration} days after being added to the pool
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}