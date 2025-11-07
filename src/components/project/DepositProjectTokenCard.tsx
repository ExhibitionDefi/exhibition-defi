// src/components/project/DepositProjectTokenCard.tsx
import React, { useState, useMemo } from 'react'
import { Coins, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { parseUnits } from 'viem'
import { SafeHtml } from '../SafeHtml'
import { sanitizeText, sanitizeNumber } from '../../utils/sanitization'

interface ProjectTokenDepositInfo {
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

interface DepositProjectTokenCardProps {
  projectId: bigint
  tokenSymbol?: string
  tokenDecimals?: number
  projectTokenInfo: ProjectTokenDepositInfo | null
  buttonState: ButtonState
  isOwner: boolean
  onDeposit: (projectId: bigint, amount: bigint) => void
}

export const DepositProjectTokenCard: React.FC<DepositProjectTokenCardProps> = ({
  projectId,
  tokenSymbol = 'TOKEN',
  tokenDecimals = 18,
  projectTokenInfo,
  buttonState,
  isOwner,
  onDeposit,
}) => {
  const [inputAmount, setInputAmount] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)

  // ✅ Sanitize token symbol for display
  const safeTokenSymbol = useMemo(() => 
    sanitizeText(tokenSymbol), 
    [tokenSymbol]
  )

  // Don't render if not owner or no project token info
  if (!isOwner || !projectTokenInfo) return null

  // ✅ Handle input change with sanitization and validation
  const handleInputChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '')
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.')
    const sanitized = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('') 
      : cleaned

    // Prevent too many decimal places
    if (parts[1] && parts[1].length > tokenDecimals) {
      return // Don't update if exceeds token decimals
    }

    setInputAmount(sanitized)
    setInputError(null)

    if (!sanitized || sanitized === '0' || sanitized === '.') {
      setInputError(null)
      return
    }

    // ✅ Validate with sanitizeNumber
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
      } else if (amount > projectTokenInfo.remaining) {
        setInputError(
          `Amount exceeds remaining required (${projectTokenInfo.formattedRemaining} ${safeTokenSymbol})`
        )
      }
    } catch {
      setInputError('Invalid amount format')
    }
  }

  // Handle deposit action
  const handleDeposit = () => {
    if (!inputAmount || inputError) return

    try {
      const amount = parseUnits(inputAmount, tokenDecimals)
      onDeposit(projectId, amount)
      setInputAmount('') // Clear input after successful submission
      setInputError(null)
    } catch (err) {
      setInputError('Invalid amount format')
    }
  }

  // Quick fill buttons
  const handleQuickFill = (percentage: number) => {
    const amount = (projectTokenInfo.remaining * BigInt(percentage)) / BigInt(100)
    const formatted = Number(amount) / Math.pow(10, tokenDecimals)
    
    // ✅ Ensure the formatted number is valid
    const sanitized = sanitizeNumber(formatted, {
      min: 0,
      decimals: tokenDecimals
    })
    
    if (sanitized !== null) {
      setInputAmount(sanitized.toString())
      setInputError(null)
    }
  }

  // ✅ Safe formatting for display numbers
  const formatDisplayNumber = (value: string, maxDecimals: number = 2) => {
    const num = parseFloat(value)
    if (isNaN(num)) return '0'
    return num.toLocaleString(undefined, {
      maximumFractionDigits: maxDecimals,
    })
  }

  return (
    <div className="max-w-3xl mx-auto bg-[var(--charcoal)] border border-[var(--silver-dark)]/30 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--neon-orange)]/10 rounded-lg">
            <Coins className="h-5 w-5 text-[var(--neon-orange)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--off-white)]">
              Deposit Project Tokens
            </h3>
            <SafeHtml 
              content={`Deposit ${safeTokenSymbol} tokens for sale`}
              as="p"
              className="text-sm text-[var(--silver-light)]"
            />
          </div>
        </div>

        {projectTokenInfo.isComplete && (
          <CheckCircle2 className="h-6 w-6 text-[var(--success-green)]" />
        )}
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--silver-light)]">Progress</span>
          <span className="text-[var(--off-white)] font-medium">
            {projectTokenInfo.progressPercentage.toFixed(2)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-[var(--jet-black)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-red)] transition-all duration-500"
            style={{ width: `${Math.min(projectTokenInfo.progressPercentage, 100)}%` }}
          />
        </div>

        {/* Amount Details */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <p className="text-xs text-[var(--silver-light)] mb-1">Required</p>
            <p className="text-sm font-medium text-[var(--off-white)]">
              {formatDisplayNumber(projectTokenInfo.formattedRequired)}
            </p>
            <SafeHtml 
              content={safeTokenSymbol}
              as="p"
              className="text-xs text-[var(--silver-dark)]"
            />
          </div>

          <div className="text-center">
            <p className="text-xs text-[var(--silver-light)] mb-1">Deposited</p>
            <p className="text-sm font-medium text-[var(--neon-orange)]">
              {formatDisplayNumber(projectTokenInfo.formattedDeposited)}
            </p>
            <SafeHtml 
              content={safeTokenSymbol}
              as="p"
              className="text-xs text-[var(--silver-dark)]"
            />
          </div>

          <div className="text-center">
            <p className="text-xs text-[var(--silver-light)] mb-1">Remaining</p>
            <p className="text-sm font-medium text-[var(--neon-red)]">
              {formatDisplayNumber(projectTokenInfo.formattedRemaining)}
            </p>
            <SafeHtml 
              content={safeTokenSymbol}
              as="p"
              className="text-xs text-[var(--silver-dark)]"
            />
          </div>
        </div>
      </div>

      {/* Input Section - Only show if not complete */}
      {!projectTokenInfo.isComplete && (
        <div className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm text-[var(--silver-light)]">
              Deposit Amount ({safeTokenSymbol})
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={inputAmount}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="0.0"
                maxLength={30} // ✅ Prevent DoS with massive strings
                className={`w-full px-4 py-3 bg-[var(--jet-black)] border rounded-xl text-[var(--off-white)] 
                  placeholder:text-[var(--silver-dark)] focus:outline-none focus:ring-2 transition-all
                  ${
                    inputError
                      ? 'border-[var(--neon-orange)] focus:ring-[var(--neon-orange)]/50'
                      : 'border-[var(--silver-dark)]/30 focus:ring-[var(--neon-orange)]/50'
                  }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--silver-dark)]">
                {safeTokenSymbol}
              </div>
            </div>

            {/* Error Message */}
            {inputError && (
              <div className="flex items-center gap-2 text-sm text-[var(--neon-orange)]">
                <AlertCircle className="h-4 w-4" />
                <SafeHtml 
                  content={inputError}
                  as="span"
                />
              </div>
            )}
          </div>

          {/* Quick Fill Buttons */}
          <div className="flex gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                onClick={() => handleQuickFill(percent)}
                className="flex-1 px-3 py-2 text-xs bg-[var(--jet-black)] hover:bg-[var(--silver-dark)]/20 
                  text-[var(--silver-light)] hover:text-[var(--off-white)] border border-[var(--silver-dark)]/30 
                  rounded-lg transition-all"
              >
                {percent === 100 ? 'MAX' : `${percent}%`}
              </button>
            ))}
          </div>

          {/* Deposit Button */}
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={handleDeposit}
            disabled={buttonState.disabled || !inputAmount || !!inputError}
          >
            {buttonState.loading && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {buttonState.text}
          </Button>
        </div>
      )}

      {/* Completion Message */}
      {projectTokenInfo.isComplete && (
        <div className="bg-[var(--success-green)]/10 border border-[var(--success-green)]/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[var(--success-green)] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--success-green)]">
                Project Tokens Deposited
              </p>
              <p className="text-xs text-[var(--silver-light)] mt-1">
                All required tokens for sale have been deposited. Contributors can now participate once the project starts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="bg-[var(--neon-orange)]/5 border border-[var(--neon-orange)]/20 rounded-xl p-4">
        <p className="text-xs text-[var(--silver-light)] leading-relaxed">
          💡 <span className="text-[var(--off-white)] font-medium">Note:</span> These are your 
          project tokens that will be sold to contributors during the funding period. 
          You can deposit in multiple transactions until the required amount is reached.
        </p>
      </div>
    </div>
  )
}