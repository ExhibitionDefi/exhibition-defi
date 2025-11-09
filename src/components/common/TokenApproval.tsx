import React, { useEffect } from 'react'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ExhibitionFormatters } from '../../utils/exFormatters'
import { useTokenApproval } from '../../hooks/useTokenApproval'
import { escapeHtml } from '@/utils/sanitization'
import { SafeHtml } from '@/components/SafeHtml'

interface TokenApprovalProps {
  tokenAddress: `0x${string}`
  spenderAddress: `0x${string}`
  requiredAmount: bigint
  tokenSymbol?: string
  onApprovalComplete?: () => void
  children?: React.ReactNode
}

export const TokenApproval: React.FC<TokenApprovalProps> = ({
  tokenAddress,
  spenderAddress,
  requiredAmount,
  tokenSymbol = 'Tokens',
  onApprovalComplete,
  children,
}) => {
  const {
    allowance,
    needsApproval,
    isSubmitting,
    isConfirming,
    isApproved,
    submitApproval,
    writeState,
    refetchAllowance,
  } = useTokenApproval({
    tokenAddress,
    spenderAddress,
    requiredAmount,
  })

  const safeTokenSymbol = escapeHtml(tokenSymbol)

  useEffect(() => {
    if (isApproved) {
      refetchAllowance?.()
      onApprovalComplete?.()
    }
  }, [isApproved, refetchAllowance, onApprovalComplete])

  const handleApprove = async () => {
    try {
      await submitApproval()
    } catch (err) {
      console.error('Approval failed:', err)
    }
  }

  if (allowance === undefined) {
    return (
      <Card>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span>Checking token approval...</span>
        </div>
      </Card>
    )
  }

  if (!needsApproval) {
    return (
      <Card className="bg-green-50 border-green-200">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-800 font-medium">
            <SafeHtml content={`${safeTokenSymbol} approved for spending`} />
          </span>
        </div>
        {children && <div className="mt-4">{children}</div>}
      </Card>
    )
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800">Approval Required</h4>
            <p className="text-sm text-yellow-700 mt-1">
              <SafeHtml
                content={`You need to approve ${ExhibitionFormatters.formatTokenWithSymbol(
                  requiredAmount,
                  safeTokenSymbol
                )} for spending before proceeding.`}
              />
            </p>
          </div>
        </div>
        <Button
          onClick={handleApprove}
          isLoading={Boolean(writeState.isPending || isSubmitting || isConfirming)}
          loadingText={writeState.isPending ? 'Submitting...' : 'Confirming...'}
          className="w-full"
        >
          Approve {safeTokenSymbol}
        </Button>
      </div>
    </Card>
  )
}
