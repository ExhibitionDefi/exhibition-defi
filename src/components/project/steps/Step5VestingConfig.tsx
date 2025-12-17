// src/components/projects/steps/Step5VestingConfig.tsx
import React from 'react'
import { Info, Check } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import type { CreateProjectFormData } from '@/hooks/launchpad/useCreateProject'
import { sanitizeNumber } from '@/utils/sanitization'

interface Step5VestingConfigProps {
  formData: CreateProjectFormData
  validationErrors: Record<string, string>
  onChange: (field: keyof CreateProjectFormData, value: any) => void
}

export const Step5VestingConfig: React.FC<Step5VestingConfigProps> = ({
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
            onChange={(e) => onChange('vestingEnabled', e.target.checked)}
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
                  onChange={(e) => handleNumericChange('vestingCliff', e.target.value)}
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
                  onChange={(e) => handleNumericChange('vestingDuration', e.target.value)}
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
                  onChange={(e) => handleNumericChange('vestingInterval', e.target.value)}
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
                  onChange={(e) => handleNumericChange('vestingInitialRelease', e.target.value)}
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
}