// src/components/project/FinalizeProjectCard.tsx
import React from 'react'
import { CheckCircle, Loader2, Info } from 'lucide-react'
import { Button } from '../ui/Button'

interface FinalizeProjectCardProps {
  projectId: bigint
  isProjectOwner: boolean
  buttonState: {
    text: string
    disabled: boolean
    loading: boolean
  }
  onFinalize: (projectId: bigint) => void
}

export const FinalizeProjectCard: React.FC<FinalizeProjectCardProps> = ({
  projectId,
  isProjectOwner,
  buttonState,
  onFinalize,
}) => {
  const handleFinalize = () => {
    onFinalize(BigInt(projectId))
  }

  return (
    <div className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-orange)]/30 rounded-2xl p-6 shadow-lg">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-[var(--neon-orange)]/10 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-[var(--neon-orange)]" />
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-[var(--silver-light)] mb-2">
              Funding Period Ended - Ready to Finalize
            </h3>
            <p className="text-[var(--silver-dark)] text-sm leading-relaxed">
              The funding period has ended and the project has{' '}
              <span className="text-[var(--neon-orange)] font-medium">
                successfully reached its funding goal
              </span>
              . Anyone can finalize the project to transition it to the next phase.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-[var(--deep-black)]/50 border border-[var(--silver-dark)]/20 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-[var(--neon-blue)] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--silver-dark)] space-y-1">
                <p>
                  <span className="text-[var(--silver-light)] font-medium">What happens next:</span>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Project status will update to "Successful"</li>
                  <li>Contributors can claim their tokens</li>
                  {isProjectOwner && (
                    <li className="text-[var(--neon-orange)]">
                      You'll need to deposit liquidity tokens
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={handleFinalize}
              disabled={buttonState.disabled}
              className="w-full bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-blue)] text-[var(--deep-black)] font-semibold py-3 rounded-xl hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_var(--neon-orange)]/30"
            >
              {buttonState.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {buttonState.text}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {buttonState.text}
                </>
              )}
            </Button>
            
            {!isProjectOwner && (
              <p className="text-xs text-[var(--silver-dark)] text-center mt-2">
                Anyone can finalize this project
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}