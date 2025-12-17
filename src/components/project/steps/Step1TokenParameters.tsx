// src/components/projects/steps/Step1TokenParameters.tsx
import React from 'react'
import { Info } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import type { CreateProjectFormData } from '@/hooks/launchpad/useCreateProject'
import {
  sanitizeText,
  sanitizeUrl,
  hasSuspiciousContent,
  logSanitization,
} from '@/utils/sanitization'
import { logger } from '@/utils/logger'

interface Step1TokenParametersProps {
  formData: CreateProjectFormData
  validationErrors: Record<string, string>
  onChange: (field: keyof CreateProjectFormData, value: any) => void
}

export const Step1TokenParameters: React.FC<Step1TokenParametersProps> = ({
  formData,
  validationErrors,
  onChange,
}) => {
  // 🔒 SECURITY: Sanitized handleChange with input validation
  const handleFieldChange = (field: keyof CreateProjectFormData, value: string) => {
    let sanitizedValue = value

    switch (field) {
      case 'projectTokenName':
        // Text&Number only: allow only letters, numbers and spaces
        sanitizedValue = value
          .replace(/[^a-zA-Z0-9\s]/g, '') // Only allow letters, numbers and space
          .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
          .slice(0, 100) // Limit length
        logSanitization(field, value, sanitizedValue)
        
        // Check for suspicious content
        if (hasSuspiciousContent(sanitizedValue)) {
          logger.warn('⚠️ Suspicious content detected in token name')
          return // Block the update
        }
        break

      case 'projectTokenSymbol':
        // Remove special characters and limit length
        sanitizedValue = sanitizeText(value)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 10)
        logSanitization(field, value, sanitizedValue)
        break

      case 'projectTokenLogoURI':
        sanitizedValue = sanitizeUrl(value) || ''
        if (value && !sanitizedValue) {
          // Don't update if URL is invalid
          return
        }
        logSanitization(field, value, sanitizedValue)
        break

      case 'initialTotalSupply':
        // Remove non-numeric characters
        sanitizedValue = value.replace(/[^\d.]/g, '')
        break

      default:
        // For other fields, basic sanitization
        sanitizedValue = sanitizeText(value)
    }

    onChange(field, sanitizedValue)
  }

  return (
    <div className="space-y-8">
      <div className="border border-l-4 border-[var(--neon-blue)] pl-4">
        <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
          Token Parameters
        </h3>
        <p className="text-[var(--metallic-silver)] leading-relaxed">
          Specify the core properties of the launch token. All tokens use 18 decimals for compatibility with on-chain exchange and DeFi standards.
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
            onChange={(e) => handleFieldChange('projectTokenName', e.target.value)}
            placeholder="e.g., Nexus Supporter Token"
            error={validationErrors.projectTokenName}
            className="text-base"
            maxLength={100}
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
            onChange={(e) => handleFieldChange('projectTokenSymbol', e.target.value)}
            placeholder="e.g., NST"
            maxLength={10}
            error={validationErrors.projectTokenSymbol}
            className="text-base font-mono"
          />
          <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            A short identifier for your token (3-10 characters, letters and numbers only)
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
            onChange={(e) => handleFieldChange('initialTotalSupply', e.target.value)}
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
            Logo URI <span className="text-[var(--metallic-silver)] text-sm">(Optional)</span>
          </Label>
          <Input
            id="projectTokenLogoURI"
            value={formData.projectTokenLogoURI}
            onChange={(e) => handleFieldChange('projectTokenLogoURI', e.target.value)}
            placeholder="https://example.com/logo.png"
            error={validationErrors.projectTokenLogoURI}
            className="text-base font-mono text-sm"
          />
          <p className="text-sm text-[var(--metallic-silver)] flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Public accessible URL to your token logo image (PNG, JPG, or SVG formats)
          </p>
        </div>
      </div>
    </div>
  )
}