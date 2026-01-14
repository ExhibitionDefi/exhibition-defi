// src/components/project/DepositLiquidityCard.tsx
import React, { useState, useMemo } from 'react'
import { Droplets, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { parseUnits } from 'viem'
import { SafeHtml } from '../SafeHtml'
import { sanitizeText, sanitizeNumber } from '../../utils/sanitization'

interface LiquidityDepositInfo {
  required: bigint
  deposited: bigint
  remaining: bigint
  progressPercentage: number
  isComplete: boolean
  formattedRequired: string
  formattedDeposited: string
  formattedRemaining: string
}

interface ButtonState {
  text: string
  disabled: boolean
  loading: boolean
}

interface DepositLiquidityCardProps {
  projectId: bigint
  tokenSymbol?: string
  tokenDecimals?: number
  liquidityInfo: LiquidityDepositInfo | null
  buttonState: ButtonState
  isOwner: boolean
  onDeposit: (projectId: bigint, amount: bigint) => void
}

export const DepositLiquidityCard: React.FC<DepositLiquidityCardProps> = ({
  projectId,
  tokenSymbol = 'TOKEN',
  tokenDecimals = 18,
  liquidityInfo,
  buttonState,
  isOwner,
  onDeposit,
}) => {
  const [inputAmount, setInputAmount] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  const safeTokenSymbol = useMemo(() => sanitizeText(tokenSymbol), [tokenSymbol])

  if (!isOwner || !liquidityInfo) return null

  const handleInputChange = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, '')
    const parts = cleaned.split('.')
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned

    if (parts[1] && parts[1].length > tokenDecimals) return

    setInputAmount(sanitized)
    setInputError(null)

    if (!sanitized || sanitized === '0' || sanitized === '.') {
      setInputError(null)
      return
    }

    const validated = sanitizeNumber(sanitized, {
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      decimals: tokenDecimals
    })

    if (validated === null) {
      setInputError('Invalid amount')
      return
    }

    try {
      const amount = parseUnits(sanitized, tokenDecimals)
      
      if (amount <= BigInt(0)) {
        setInputError('Amount must be greater than 0')
      } else if (amount > liquidityInfo.remaining) {
        setInputError(`Exceeds remaining (${liquidityInfo.formattedRemaining} ${safeTokenSymbol})`)
      }
    } catch {
      setInputError('Invalid amount format')
    }
  }

  const handleDeposit = () => {
    if (!inputAmount || inputError) return

    try {
      const amount = parseUnits(inputAmount, tokenDecimals)
      onDeposit(projectId, amount)
      setInputAmount('')
      setInputError(null)
    } catch {
      setInputError('Invalid amount format')
    }
  }

  const handleQuickFill = (percentage: number) => {
    const amount = (liquidityInfo.remaining * BigInt(percentage)) / BigInt(100)
    const formatted = Number(amount) / Math.pow(10, tokenDecimals)
    
    const sanitized = sanitizeNumber(formatted, {
      min: 0,
      decimals: tokenDecimals
    })
    
    if (sanitized !== null) {
      setInputAmount(sanitized.toString())
      setInputError(null)
    }
  }

  const formatDisplayNumber = (value: string, maxDecimals: number = 2) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '0'
    return num.toLocaleString(undefined, { maximumFractionDigits: maxDecimals })
  }

  return (
    <div className="max-w-2xl mx-auto bg-[var(--charcoal)] rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-[var(--neon-blue)]" />
          <div>
            <h3 className="text-base font-semibold text-[var(--off-white)]">Deposit Liquidity Tokens</h3>
            <SafeHtml 
              content={`Deposit ${safeTokenSymbol} for AMM pool`}
              as="p"
              className="text-xs text-[var(--silver-light)]"
            />
          </div>
        </div>
        {liquidityInfo.isComplete && <CheckCircle2 className="h-5 w-5 text-[var(--success-green)]" />}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[var(--silver-light)]">Progress</span>
          <span className="text-[var(--off-white)] font-medium">{liquidityInfo.progressPercentage.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 bg-[var(--jet-black)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--electric-cyan)] transition-all duration-500"
            style={{ width: `${Math.min(liquidityInfo.progressPercentage, 100)}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div>
            <p className="text-xs text-[var(--silver-light)]">Required</p>
            <p className="text-sm font-medium text-[var(--off-white)]">{formatDisplayNumber(liquidityInfo.formattedRequired)}</p>
            <p className="text-xs text-[var(--silver-dark)]">{safeTokenSymbol}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--silver-light)]">Deposited</p>
            <p className="text-sm font-medium text-[var(--neon-blue)]">{formatDisplayNumber(liquidityInfo.formattedDeposited)}</p>
            <p className="text-xs text-[var(--silver-dark)]">{safeTokenSymbol}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--silver-light)]">Remaining</p>
            <p className="text-sm font-medium text-[var(--neon-orange)]">{formatDisplayNumber(liquidityInfo.formattedRemaining)}</p>
            <p className="text-xs text-[var(--silver-dark)]">{safeTokenSymbol}</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      {!liquidityInfo.isComplete && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--silver-light)]">Amount ({safeTokenSymbol})</label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={inputAmount}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="0.0"
                maxLength={30}
                className={`w-full px-3 py-2 bg-[var(--jet-black)] border rounded-lg text-[var(--off-white)] text-sm
                  placeholder:text-[var(--silver-dark)] focus:outline-none focus:ring-2 transition-all
                  ${inputError ? 'border-[var(--neon-orange)] focus:ring-[var(--neon-orange)]/50' : 'border-[var(--silver-dark)]/30 focus:ring-[var(--neon-blue)]/50'}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--silver-dark)]">
                {safeTokenSymbol}
              </div>
            </div>
            {inputError && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--neon-orange)]">
                <AlertCircle className="h-3 w-3" />
                <SafeHtml content={inputError} as="span" />
              </div>
            )}
          </div>

          {/* Quick Fill */}
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => handleQuickFill(percent)}
                className="flex-1 px-2 py-1.5 text-xs bg-[var(--jet-black)] hover:bg-[var(--silver-dark)]/20 
                  text-[var(--silver-light)] hover:text-[var(--off-white)] border border-[var(--silver-dark)]/30 
                  rounded-md transition-all"
              >
                {percent === 100 ? 'MAX' : `${percent}%`}
              </button>
            ))}
          </div>

          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={handleDeposit}
            disabled={buttonState.disabled || !inputAmount || !!inputError}
          >
            {buttonState.loading && (
              <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {buttonState.text}
          </Button>
        </div>
      )}

      {/* Completion Message */}
      {liquidityInfo.isComplete && (
        <div className="bg-[var(--success-green)]/10 border border-[var(--success-green)]/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[var(--success-green)]" />
            <div>
              <p className="text-xs font-medium text-[var(--success-green)]">Liquidity Tokens Deposited</p>
              <p className="text-xs text-[var(--silver-light)] mt-0.5">Ready to finalize liquidity and release funds.</p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-[var(--neon-blue)]/5 border border-[var(--neon-blue)]/20 rounded-lg p-2.5">
        <p className="text-xs text-[var(--silver-light)] leading-relaxed">
          💡 Project tokens paired with raised funds to create AMM pool. Deposit in multiple transactions if needed.
        </p>
      </div>
    </div>
  )
}