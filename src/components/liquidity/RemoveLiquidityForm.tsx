// src/components/amm/RemoveLiquidityForm.tsx
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Lock, Unlock, Clock, AlertCircle } from 'lucide-react';
import { MultiTransactionModal } from '@/components/common/MultiTransactionModal';
import { useRemoveLiquidity } from '@/hooks/amm/useRemoveLiquidity';
import { AMMFormatters } from '@/utils/ammFormatters';
import { SafeHtml } from '@/components/SafeHtml';
import { sanitizeText } from '@/utils/sanitization';
import type { Pool } from '@/components/liquidity/PoolList';

interface RemoveLiquidityFormProps {
  positions: Pool[];
  selectedPosition: Pool | null;
  onSelectPosition: (position: Pool | null) => void;
}

const LiquidityLockDisplay: React.FC<{
  isLocked: boolean;
  unlockTime?: bigint;
  lockedAmount?: bigint;
  totalBalance?: bigint;
  withdrawableAmount?: bigint;
}> = ({ isLocked, unlockTime, lockedAmount, totalBalance, withdrawableAmount }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (!unlockTime) return;

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const unlockTimestamp = Number(unlockTime);
      const diff = unlockTimestamp - now;

      if (diff <= 0) {
        setIsUnlocked(true);
        setTimeRemaining('Unlocked');
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [unlockTime]);

  if (!isLocked || !unlockTime) return null;

  const unlockDate = new Date(Number(unlockTime) * 1000);
  const formattedDate = unlockDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`mt-4 p-4 rounded-xl border ${
      isUnlocked 
        ? 'bg-[var(--neon-green)]/10 border-[var(--neon-green)]/30' 
        : 'bg-[var(--neon-orange)]/10 border-[var(--neon-orange)]/30'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          isUnlocked 
            ? 'bg-[var(--neon-green)]/20' 
            : 'bg-[var(--neon-orange)]/20'
        }`}>
          {isUnlocked ? (
            <Unlock className="h-5 w-5 text-[var(--neon-green)]" />
          ) : (
            <Lock className="h-5 w-5 text-[var(--neon-orange)]" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-sm font-semibold ${
              isUnlocked 
                ? 'text-[var(--neon-green)]' 
                : 'text-[var(--neon-orange)]'
            }`}>
              {isUnlocked ? 'Liquidity Unlocked' : 'Liquidity Locked'}
            </h4>
            {!isUnlocked && (
              <div className="flex items-center gap-1 text-xs text-[var(--silver-light)]">
                <Clock className="h-3 w-3" />
                <span className="font-mono">{timeRemaining}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 text-xs text-[var(--silver-light)]">
            {!isUnlocked && (
              <div className="flex items-center justify-between">
                <span>Unlocks on:</span>
                <span className="font-medium text-[var(--silver-light)]">{formattedDate}</span>
              </div>
            )}
            
            {lockedAmount !== undefined && lockedAmount > 0n && (
              <div className="flex items-center justify-between">
                <span>Locked Amount:</span>
                <span className="font-mono text-[var(--neon-orange)]">
                  {AMMFormatters.formatTokenAmountSync(lockedAmount, 18, 6)} LP
                </span>
              </div>
            )}

            {withdrawableAmount !== undefined && (
              <div className="flex items-center justify-between">
                <span>Withdrawable:</span>
                <span className="font-mono text-[var(--neon-green)]">
                  {AMMFormatters.formatTokenAmountSync(withdrawableAmount, 18, 6)} LP
                </span>
              </div>
            )}

            {totalBalance !== undefined && (
              <div className="flex items-center justify-between pt-2 border-t border-[var(--silver-dark)]/20">
                <span>Total Balance:</span>
                <span className="font-mono text-[var(--silver-light)]">
                  {AMMFormatters.formatTokenAmountSync(totalBalance, 18, 6)} LP
                </span>
              </div>
            )}
          </div>

          {!isUnlocked && withdrawableAmount !== undefined && withdrawableAmount > 0n && (
            <div className="mt-3 flex items-start gap-2 p-2 bg-[var(--neon-cyan)]/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-[var(--neon-cyan)] mt-0.5 flex-shrink-0" />
              <p className="text-xs text-[var(--silver-light)] leading-relaxed">
                You can withdraw unlocked liquidity now. Locked liquidity will be available after the unlock time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const RemoveLiquidityForm: React.FC<RemoveLiquidityFormProps> = ({
  positions,
  selectedPosition,
  onSelectPosition,
}) => {
  const removeLiquidity = useRemoveLiquidity();

  // Sync selected position with hook
  React.useEffect(() => {
    removeLiquidity.setSelectedPosition(selectedPosition);
  }, [selectedPosition, removeLiquidity]);

  // ✅ Sanitize LP amount input
  const handleLpAmountChange = useCallback((value: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('') 
      : cleaned;
    
    // Limit decimal places to 18 (LP token standard)
    if (parts[1] && parts[1].length > 18) {
      return; // Don't update if exceeds 18 decimals
    }
    
    removeLiquidity.updateState({ lpAmount: sanitized });
  }, [removeLiquidity]);

  // ✅ Safe token symbol display
  const safeTokenASymbol = useMemo(
    () => sanitizeText(removeLiquidity.tokenAInfo?.symbol || 'Token A'),
    [removeLiquidity.tokenAInfo?.symbol]
  );

  const safeTokenBSymbol = useMemo(
    () => sanitizeText(removeLiquidity.tokenBInfo?.symbol || 'Token B'),
    [removeLiquidity.tokenBInfo?.symbol]
  );

  // ✅ Sanitize pool symbols for select options
  const sanitizePoolOption = useCallback((pool: Pool) => {
    const symbolA = sanitizeText(pool.symbolA || '').slice(0, 20);
    const symbolB = sanitizeText(pool.symbolB || '').slice(0, 20);
    const share = pool.userShare ? Math.min(Math.max(pool.userShare, 0), 100).toFixed(2) : '0.00';
    
    return `${symbolA}/${symbolB} - ${share}% share`;
  }, []);

  return (
    <div className="w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto px-4">
      <div className="space-y-1">
        {/* Remove Liquidity LP Token Input */}
        <div className="bg-[var(--charcoal)] rounded-xl p-4 border border-[var(--silver-dark)] border-opacity-30 hover:border-opacity-50 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--metallic-silver)]">LP Tokens</span>
            {removeLiquidity.lpBalance !== undefined && (
              <div className="text-sm text-[var(--silver-dark)] flex items-center space-x-2">
                <span>
                  Balance:{' '}
                  <span className="text-[var(--silver-light)]">
                    {AMMFormatters.formatTokenAmountSync(removeLiquidity.lpBalance as bigint, 18, 6)}
                  </span>
                </span>
                {(removeLiquidity.lpBalance ?? 0n) > 0n && (
                  <button
                    onClick={() =>
                      removeLiquidity.updateState({
                        lpAmount: AMMFormatters.formatTokenAmountSync(
                          removeLiquidity.withdrawableLP ?? removeLiquidity.lpBalance as bigint, 
                          18, 
                          18
                        ),
                      })
                    }
                    className="text-xs text-[var(--neon-orange)] hover:text-[var(--neon-blue)] px-2 py-1 bg-transparent border-0 hover:bg-[var(--deep-black)] rounded transition-all duration-300"
                  >
                    MAX
                  </button>
                )}
              </div>
            )}
          </div>

          <select
            onChange={(e) => {
              const selected = positions.find((p) => `${p.tokenA}-${p.tokenB}` === e.target.value);
              onSelectPosition(selected || null);
            }}
            value={removeLiquidity.selectedPosition ? `${removeLiquidity.selectedPosition.tokenA}-${removeLiquidity.selectedPosition.tokenB}` : ''}
            disabled={!positions.length}
            className="w-full p-2 bg-[var(--charcoal)] border-[var(--silver-dark)] border-opacity-30 text-[var(--silver-light)] rounded mb-2"
          >
            <option value="" disabled={!positions.length}>
              {positions.length ? 'Select a position' : 'No positions available'}
            </option>
            {positions.map((pool) => (
              <option key={`${pool.tokenA}-${pool.tokenB}`} value={`${pool.tokenA}-${pool.tokenB}`}>
                {sanitizePoolOption(pool)}
              </option>
            ))}
          </select>

          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={removeLiquidity.state.lpAmount}
            onChange={(e) => handleLpAmountChange(e.target.value)}
            maxLength={30} // ✅ Prevent DoS
            className="w-full bg-transparent text-lg font-bold text-[var(--silver-light)] placeholder:text-[var(--silver-dark)] border-0 outline-none text-right"
          />
        </div>

        {/* Liquidity Lock Display */}
        {removeLiquidity.liquidityLockInfo && (
          <LiquidityLockDisplay
            isLocked={removeLiquidity.isLocked ?? false}
            unlockTime={removeLiquidity.liquidityLockInfo.unlockTime}
            lockedAmount={removeLiquidity.liquidityLockInfo.lockedLPAmount}
            totalBalance={removeLiquidity.lpBalance}
            withdrawableAmount={removeLiquidity.withdrawableLP}
          />
        )}

        {/* Expected Token Outputs */}
        {removeLiquidity.removeQuote && (
          <div className="mt-3 p-4 bg-[var(--charcoal)] rounded-xl border border-[var(--silver-dark)] border-opacity-30">
            <div className="flex justify-between text-sm text-[var(--silver-light)] mb-2">
              <span>You will receive</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--silver-dark)]">
              <SafeHtml 
                content={`${safeTokenASymbol}:`}
                as="span"
              />
              <span className="text-[var(--silver-light)]">
                {AMMFormatters.formatTokenAmountSync(
                  removeLiquidity.removeQuote[0] as bigint,
                  removeLiquidity.tokenAInfo?.decimals || 18,
                  6
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm text-[var(--silver-dark)]">
              <SafeHtml 
                content={`${safeTokenBSymbol}:`}
                as="span"
              />
              <span className="text-[var(--silver-light)]">
                {AMMFormatters.formatTokenAmountSync(
                  removeLiquidity.removeQuote[1] as bigint,
                  removeLiquidity.tokenBInfo?.decimals || 18,
                  6
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pool Information */}
      {removeLiquidity.poolExists !== undefined && (
        <div className="mt-4 space-y-2 text-sm text-[var(--silver-dark)]">
          <div className="flex justify-between">
            <span>Pool Status:</span>
            <span className={removeLiquidity.poolExists ? 'text-[var(--neon-blue)]' : 'text-[var(--neon-orange)]'}>
              {removeLiquidity.poolExists ? 'Active' : 'Not Found'}
            </span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-6">
        <button
          onClick={removeLiquidity.executeRemoveLiquidity}
          disabled={removeLiquidity.buttonState.disabled}
          className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 relative ${
            removeLiquidity.buttonState.disabled
              ? 'bg-[var(--silver-dark)] text-[var(--charcoal)] cursor-not-allowed'
              : 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-blue)] text-[var(--deep-black)] hover:from-[var(--neon-blue)] hover:to-[var(--neon-orange)] shadow-[0_0_20px_var(--neon-orange)]'
          }`}
        >
          {removeLiquidity.buttonState.loading && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
            </div>
          )}
          <span className={removeLiquidity.buttonState.loading ? 'ml-6' : ''}>
            {removeLiquidity.buttonState.text}
          </span>
        </button>
      </div>

      {/* Step Progress Indicator */}
      {removeLiquidity.state.isProcessing && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--charcoal)] border border-[var(--silver-dark)] border-opacity-30">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${
                removeLiquidity.state.currentStep === 'removing' ? 'text-[var(--neon-blue)]' : 'text-[var(--silver-dark)]'
              }`}
            >
              {removeLiquidity.state.currentStep === 'removing' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current" />
              )}
              <span className="text-sm font-medium">Remove Liquidity</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {removeLiquidity.state.isProcessing && (
        <div className="mt-3 text-center">
          <div className="text-sm text-[var(--metallic-silver)]">
            {removeLiquidity.state.currentStep === 'removing' && 'Removing liquidity from the pool...'}
          </div>
        </div>
      )}

      {/* Transaction Status Modal */}
      <MultiTransactionModal
        isOpen={removeLiquidity.state.isProcessing}
        onClose={() => {
          if (removeLiquidity.state.transactionSuccess || removeLiquidity.state.error) {
            removeLiquidity.updateState({
              isProcessing: false,
              error: undefined,
              txHash: undefined,
              transactionSuccess: false,
            });
          }
        }}
        transactionType={
          removeLiquidity.state.currentStep === 'removing'
            ? 'withdraw'
            : removeLiquidity.state.transactionSuccess
            ? 'withdraw'
            : null
        }
        mainHash={removeLiquidity.state.txHash}
        isMainPending={false}
        isMainConfirming={removeLiquidity.state.currentStep === 'removing' && !removeLiquidity.state.txHash}
        isMainSuccess={removeLiquidity.state.transactionSuccess}
        isError={!!removeLiquidity.state.error}
        error={removeLiquidity.state.error ? new Error(removeLiquidity.state.error) : null}
      />
    </div>
  );
};