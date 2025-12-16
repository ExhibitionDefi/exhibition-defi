// src/components/projects/TokenomicsValidationDisplay.tsx
import React from 'react'
import { AlertCircle, Lightbulb, TrendingUp, Droplets } from 'lucide-react'
import type { TokenomicsValidation } from '@/hooks/launchpad/useTokenomicsValidation'

interface TokenomicsValidationDisplayProps {
  validation: TokenomicsValidation
  tokenSymbol?: string
}

export const TokenomicsValidationDisplay: React.FC<TokenomicsValidationDisplayProps> = ({
  validation,
  tokenSymbol,
}) => {
  const formatTokens = (amount: bigint): string => {
    if (amount === 0n) return '0'
    const value = Number(amount) / 10 ** 18
    return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${tokenSymbol}`
  }

  return (
    <div className="space-y-4 mt-6">
      {/* Live Calculations */}
      {(validation.expectedTokensForSale > 0n || validation.liquidityTokens > 0n) && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Expected Tokens for Sale */}
          {validation.expectedTokensForSale > 0n && (
            <div className="p-4 bg-[var(--neon-blue)]/5 border border-[var(--neon-blue)]/30 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--neon-blue)] uppercase tracking-wider mb-1">
                    Calculated Tokens for Sale
                  </p>
                  <p className="text-xl font-bold text-[var(--silver-light)] font-mono break-all">
                    {formatTokens(validation.expectedTokensForSale)}
                  </p>
                  <p className="text-xs text-[var(--metallic-silver)] mt-1">
                    Based on funding goal ÷ token price
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Liquidity Tokens */}
          {validation.liquidityTokens > 0n && (
            <div className="p-4 bg-[var(--neon-blue)]/5 border border-[var(--neon-blue)]/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Droplets className="w-5 h-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--neon-blue)] uppercase tracking-wider mb-1">
                    Liquidity Pool Tokens
                  </p>
                  <p className="text-xl font-bold text-[var(--silver-light)] font-mono break-all">
                    {formatTokens(validation.liquidityTokens)}
                  </p>
                  <p className="text-xs text-[var(--metallic-silver)] mt-1">
                    Tokens needed for liquidity pool
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="space-y-2">
          {validation.warnings.map((warning, idx) => (
            <div
              key={idx}
              className="p-3 bg-[var(--neon-orange)]/10 border border-[var(--neon-orange)]/30 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-[var(--neon-orange)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--neon-orange)] flex-1">{warning}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hints */}
      {validation.hints.length > 0 && (
        <div className="space-y-2">
          {validation.hints.map((hint, idx) => (
            <div
              key={idx}
              className="p-3 bg-[var(--neon-blue)]/5 border border-[var(--neon-blue)]/20 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <Lightbulb className="w-4 h-4 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--silver-light)] flex-1">{hint}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success State */}
      {validation.valid && validation.warnings.length === 0 && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-sm text-green-400 font-semibold">
              Tokenomics look good! Ready to proceed.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- Inline Field Warning ---------------- */
interface FieldWarningProps {
  message: string
}

export const FieldWarning: React.FC<FieldWarningProps> = ({ message }) => (
  <div className="mt-2 p-2 bg-[var(--neon-orange)]/10 border border-[var(--neon-orange)]/30 rounded">
    <p className="text-xs text-[var(--neon-orange)] flex items-start gap-2">
      <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </p>
  </div>
)
