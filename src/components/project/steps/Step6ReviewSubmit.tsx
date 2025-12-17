// src/components/projects/steps/Step6ReviewSubmit.tsx
import React from 'react'
import { Check, AlertCircle } from 'lucide-react'
import type { CreateProjectFormData } from '@/hooks/launchpad/useCreateProject'
import { SUPPORTED_EXH, SUPPORTED_EXUSD, SUPPORTED_EXNEX } from '@/config/contracts'

interface Step6ReviewSubmitProps {
  formData: CreateProjectFormData
}

const CONTRIBUTION_TOKENS = [
  { address: SUPPORTED_EXH, symbol: 'EXH', name: 'Exhibition Token' },
  { address: SUPPORTED_EXUSD, symbol: 'exUSD', name: 'Exhibition USD' },
  { address: SUPPORTED_EXNEX, symbol: 'exNEX', name: 'Exhibition NEX' },
] as const

export const Step6ReviewSubmit: React.FC<Step6ReviewSubmitProps> = ({
  formData,
}) => {
  const selectedToken = CONTRIBUTION_TOKENS.find(t => t.address === formData.contributionTokenAddress)

  return (
    <div className="space-y-8">
      <div className="border-l-4 border-[var(--neon-blue)] pl-4">
        <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
          Review & Submit
        </h3>
        <p className="text-[var(--metallic-silver)] leading-relaxed">
          Please carefully review all Launch details before submission. Once created, these parameters cannot be changed.
        </p>
      </div>

      <div className="space-y-4">
        {/* Token Details */}
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

        {/* Funding Configuration */}
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

        {/* Timeline */}
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

        {/* Liquidity & Lock */}
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

        {/* Vesting Schedule */}
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

        {/* Final Warning */}
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
}