// src/components/amm/AddLiquidityForm.tsx
import React, { useState, useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { TokenSelector } from '@/components/swap/TokenSelector';
import { MultiTransactionModal } from '@/components/common/MultiTransactionModal';
import { useAddLiquidity } from '@/hooks/amm/useAddLiquidity';
import { AMMFormatters } from '@/utils/ammFormatters';
import { AMM_ADDRESS } from '@/config/contracts';
import { SafeHtml } from '@/components/SafeHtml';
import { sanitizeText } from '@/utils/sanitization';

interface Token {
  address: Address;
  symbol: string;
  name: string;
  logoURI: string;
  decimals: number;
  isCustom?: boolean;
}

const COMMON_TOKENS: Token[] = [
  {
    address: (import.meta.env.VITE_EXH_ADDRESS ) as Address,
    symbol: 'EXH',
    name: 'Exhibition Token',
    logoURI: '/tokens/EXH.png',
    decimals: 18,
  },
  {
    address: (import.meta.env.VITE_EXUSDT_ADDRESS ) as Address,
    symbol: 'exUSDT',
    name: 'Exhibition USDT',
    logoURI: '/tokens/exusdt.png',
    decimals: 6,
  },
  {
    address: (import.meta.env.VITE_EXNEX_ADDRESS ) as Address,
    symbol: 'exNEX',
    name: 'Exhibition Nexus',
    logoURI: '/tokens/exNEX.png',
    decimals: 18,
  },
].filter((token) => token.address !== AMMFormatters.CONSTANTS.ZERO_ADDRESS);

export const AddLiquidityForm: React.FC = () => {
  const addLiquidity = useAddLiquidity();
  const [showTokenSelector, setShowTokenSelector] = useState<'tokenA' | 'tokenB' | null>(null);
  const [customTokens, setCustomTokens] = useState<Token[]>([]);

  const allTokens = useMemo(() => {
    const tokensWithDecimals: Token[] = COMMON_TOKENS.map((token) => ({
      ...token,
      decimals:
        (addLiquidity.tokenAInfo?.address === token.address && addLiquidity.tokenAInfo?.decimals) ||
        (addLiquidity.tokenBInfo?.address === token.address && addLiquidity.tokenBInfo?.decimals) ||
        token.decimals,
    }));
    return [...tokensWithDecimals, ...customTokens];
  }, [customTokens, addLiquidity.tokenAInfo, addLiquidity.tokenBInfo]);

  // ✅ Validate and sanitize custom token before adding
  const handleAddCustomToken = useCallback((token: Token) => {
    setCustomTokens((prev) => {
      const exists = prev.some((t) => t.address.toLowerCase() === token.address.toLowerCase());
      if (exists) return prev;
      
      // ✅ Sanitize token data
      const sanitizedToken: Token = {
        ...token,
        symbol: sanitizeText(token.symbol).slice(0, 20),
        name: sanitizeText(token.name || token.symbol).slice(0, 100),
        decimals: Math.min(Math.max(Number(token.decimals), 0), 18),
        isCustom: true,
      };
      
      return [...prev, sanitizedToken].slice(0, 50); // ✅ Limit to 50 custom tokens
    });
  }, []);

  // ✅ Sanitize amount input
  const handleAmountChange = useCallback((value: string, token: 'A' | 'B') => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('') 
      : cleaned;
    
    // Get token decimals
    const tokenInfo = token === 'A' ? addLiquidity.tokenAInfo : addLiquidity.tokenBInfo;
    const decimals = tokenInfo?.decimals || 18;
    
    // Limit decimal places
    if (parts[1] && parts[1].length > decimals) {
      return; // Don't update if exceeds token decimals
    }
    
    // Update state with sanitized value
    if (token === 'A') {
      addLiquidity.updateState({ amountA: sanitized });
    } else {
      addLiquidity.updateState({ amountB: sanitized });
    }
  }, [addLiquidity]);

  const handleMaxBalance = useCallback((token: 'A' | 'B') => {
    if (token === 'A' && addLiquidity.balanceA?.value && addLiquidity.tokenAInfo) {
      const maxAmount = AMMFormatters.formatTokenAmountSync(
        addLiquidity.balanceA.value,
        addLiquidity.tokenAInfo.decimals,
        addLiquidity.tokenAInfo.decimals
      );
      addLiquidity.updateState({ amountA: maxAmount });
    } else if (token === 'B' && addLiquidity.balanceB?.value && addLiquidity.tokenBInfo) {
      const maxAmount = AMMFormatters.formatTokenAmountSync(
        addLiquidity.balanceB.value,
        addLiquidity.tokenBInfo.decimals,
        addLiquidity.tokenBInfo.decimals
      );
      addLiquidity.updateState({ amountB: maxAmount });
    }
  }, [addLiquidity]);

  // ✅ Safe token symbol display
  const safeTokenASymbol = useMemo(
    () => sanitizeText(addLiquidity.tokenAInfo?.symbol || 'Token A'),
    [addLiquidity.tokenAInfo?.symbol]
  );

  const safeTokenBSymbol = useMemo(
    () => sanitizeText(addLiquidity.tokenBInfo?.symbol || 'Token B'),
    [addLiquidity.tokenBInfo?.symbol]
  );

  return (
    <>
      <div className="space-y-1">
        {/* Token A */}
        <div className="bg-[var(--charcoal)] rounded-xl p-3 sm:p-4 border border-[var(--silver-dark)] border-opacity-30 hover:border-opacity-50 transition-all duration-300">
          {/* Header with Balance */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2 sm:gap-0">
            <span className="text-xs sm:text-sm font-medium text-[var(--metallic-silver)]">Token A</span>
            {addLiquidity.balanceA?.value !== undefined && addLiquidity.tokenAInfo && (
              <div className="text-xs sm:text-sm text-[var(--silver-dark)] flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="whitespace-nowrap">Balance:</span>
                  <SafeHtml 
                    content={`${AMMFormatters.formatTokenAmountSync(
                      addLiquidity.balanceA.value,
                      addLiquidity.tokenAInfo.decimals,
                      6
                    )} ${safeTokenASymbol}`}
                    as="span"
                    className="text-[var(--silver-light)] truncate"
                  />
                </div>
                {addLiquidity.balanceA.value > 0 && (
                  <button
                    onClick={() => handleMaxBalance('A')}
                    className="text-xs text-[var(--neon-blue)] hover:text-[var(--neon-orange)] px-2 py-1 bg-transparent border-0 hover:bg-[var(--deep-black)] rounded transition-all duration-300 whitespace-nowrap self-start sm:self-auto"
                  >
                    MAX
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Input Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowTokenSelector('tokenA')}
              className="border-opacity-50 rounded-xl p-2 sm:p-3 hover:border-[var(--neon-blue)] hover:border-opacity-80 transition-all duration-300 group flex-shrink-0 w-full sm:w-auto border border-[var(--silver-dark)]"
            >
              <div className="flex items-center space-x-2 justify-center sm:justify-start">
                {addLiquidity.tokenAInfo ? (
                  <>
                    <SafeHtml 
                      content={safeTokenASymbol}
                      as="span"
                      className="font-semibold text-xs sm:text-sm text-[var(--silver-light)] group-hover:text-[var(--neon-blue)] transition-colors duration-300"
                    />
                    <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-blue)] transition-colors duration-300" />
                  </>
                ) : (
                  <>
                    <span className="text-xs sm:text-sm text-[var(--silver-dark)] group-hover:text-[var(--neon-blue)] transition-colors duration-300">
                      Select
                    </span>
                    <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-blue)] transition-colors duration-300" />
                  </>
                )}
              </div>
            </button>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={addLiquidity.state.amountA}
              onChange={(e) => handleAmountChange(e.target.value, 'A')}
              maxLength={30} // ✅ Prevent DoS
              className="flex-1 bg-transparent text-base sm:text-lg font-bold text-[var(--silver-light)] placeholder:text-[var(--silver-dark)] border-0 outline-none text-center sm:text-right"
            />
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={() => {
              addLiquidity.updateState({
                tokenA: addLiquidity.state.tokenB,
                tokenB: addLiquidity.state.tokenA,
                amountA: addLiquidity.state.amountB,
                amountB: addLiquidity.state.amountA,
              });
            }}
            disabled={!addLiquidity.state.tokenA || !addLiquidity.state.tokenB}
            className="bg-[var(--deep-black)] border-2 border-[var(--silver-dark)] border-opacity-50 rounded-full p-2 sm:p-3 hover:border-[var(--neon-blue)] hover:border-opacity-80 disabled:opacity-50 transition-all duration-300 group"
            aria-label="Swap token positions"
          >
            <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--silver-light)] group-hover:text-[var(--neon-blue)] transition-colors duration-300" />
          </button>
        </div>

        {/* Token B */}
        <div className="bg-[var(--charcoal)] rounded-xl p-3 sm:p-4 border border-[var(--silver-dark)] border-opacity-30 hover:border-opacity-50 transition-all duration-300">
          {/* Header with Balance */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2 sm:gap-0">
            <span className="text-xs sm:text-sm font-medium text-[var(--metallic-silver)]">Token B</span>
            {addLiquidity.balanceB?.value !== undefined && addLiquidity.tokenBInfo && (
              <div className="text-xs sm:text-sm text-[var(--silver-dark)] flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="whitespace-nowrap">Balance:</span>
                  <SafeHtml 
                    content={`${AMMFormatters.formatTokenAmountSync(
                      addLiquidity.balanceB.value,
                      addLiquidity.tokenBInfo.decimals,
                      6
                    )} ${safeTokenBSymbol}`}
                    as="span"
                    className="text-[var(--silver-light)] truncate"
                  />
                </div>
                {addLiquidity.balanceB.value > 0 && (
                  <button
                    onClick={() => handleMaxBalance('B')}
                    className="text-xs text-[var(--neon-orange)] hover:text-[var(--neon-blue)] px-2 py-1 bg-transparent border-0 hover:bg-[var(--deep-black)] rounded transition-all duration-300 whitespace-nowrap self-start sm:self-auto"
                  >
                    MAX
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Input Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowTokenSelector('tokenB')}
              className="border-opacity-50 rounded-xl p-2 sm:p-3 hover:border-[var(--neon-orange)] hover:border-opacity-80 transition-all duration-300 group flex-shrink-0 w-full sm:w-auto border border-[var(--silver-dark)]"
            >
              <div className="flex items-center space-x-2 justify-center sm:justify-start">
                {addLiquidity.tokenBInfo ? (
                  <>
                    <SafeHtml 
                      content={safeTokenBSymbol}
                      as="span"
                      className="font-semibold text-xs sm:text-sm text-[var(--silver-light)] group-hover:text-[var(--neon-orange)] transition-colors duration-300"
                    />
                    <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-orange)] transition-colors duration-300" />
                  </>
                ) : (
                  <>
                    <span className="text-xs sm:text-sm text-[var(--silver-dark)] group-hover:text-[var(--neon-orange)] transition-colors duration-300">
                      Select
                    </span>
                    <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-orange)] transition-colors duration-300" />
                  </>
                )}
              </div>
            </button>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={addLiquidity.state.amountB}
              onChange={(e) => handleAmountChange(e.target.value, 'B')}
              maxLength={30} // ✅ Prevent DoS
              className="flex-1 bg-transparent text-base sm:text-lg font-bold text-[var(--silver-light)] placeholder:text-[var(--silver-dark)] border-0 outline-none text-center sm:text-right"
            />
          </div>
        </div>
      </div>

      {/* Pool Information */}
      {addLiquidity.poolExists !== undefined && (
        <div className="mt-4 space-y-2 text-xs sm:text-sm text-[var(--silver-dark)]">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="whitespace-nowrap">Pool Status:</span>
            <span className={addLiquidity.poolExists ? 'text-[var(--neon-blue)]' : 'text-[var(--neon-orange)]'}>
              {addLiquidity.poolExists ? 'Active' : 'Not Found'}
            </span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-6">
        <button
          onClick={addLiquidity.executeAddLiquidity}
          disabled={addLiquidity.buttonState.disabled}
          className={`w-full py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-xl transition-all duration-300 relative ${
            addLiquidity.buttonState.disabled
              ? 'bg-[var(--silver-dark)] text-[var(--charcoal)] cursor-not-allowed'
              : 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] text-[var(--deep-black)] hover:from-[var(--neon-orange)] hover:to-[var(--neon-blue)] shadow-[0_0_20px_var(--neon-blue)]'
          }`}
        >
          {addLiquidity.buttonState.loading && (
            <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
            </div>
          )}
          <span className={addLiquidity.buttonState.loading ? 'ml-4 sm:ml-6' : ''}>{addLiquidity.buttonState.text}</span>
        </button>
      </div>

      {/* Step Progress Indicator */}
      {addLiquidity.state.isProcessing && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--charcoal)] border border-[var(--silver-dark)] border-opacity-30">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            {addLiquidity.approvalA.needsApproval && (
              <>
                <div
                  className={`flex items-center space-x-2 text-xs sm:text-sm ${
                    addLiquidity.state.currentStep === 'approving-a'
                      ? 'text-[var(--neon-blue)]'
                      : addLiquidity.state.currentStep === 'approving-b' || addLiquidity.state.currentStep === 'adding'
                      ? 'text-[var(--neon-blue)]'
                      : 'text-[var(--silver-dark)]'
                  }`}
                >
                  {addLiquidity.state.currentStep === 'approving-a' ? (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : addLiquidity.state.currentStep === 'approving-b' || addLiquidity.state.currentStep === 'adding' ? (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-current flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-current flex-shrink-0" />
                  )}
                  <SafeHtml 
                    content={safeTokenASymbol}
                    as="span"
                    className="font-medium whitespace-nowrap"
                  />
                </div>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--silver-dark)] hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}

            {addLiquidity.approvalB.needsApproval && (
              <>
                <div
                  className={`flex items-center space-x-2 text-xs sm:text-sm ${
                    addLiquidity.state.currentStep === 'approving-b'
                      ? 'text-[var(--neon-orange)]'
                      : addLiquidity.state.currentStep === 'adding'
                      ? 'text-[var(--neon-orange)]'
                      : 'text-[var(--silver-dark)]'
                  }`}
                >
                  {addLiquidity.state.currentStep === 'approving-b' ? (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : addLiquidity.state.currentStep === 'adding' ? (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-current flex-shrink-0" />
                  ) : (
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-current flex-shrink-0" />
                  )}
                  <SafeHtml 
                    content={safeTokenBSymbol}
                    as="span"
                    className="font-medium whitespace-nowrap"
                  />
                </div>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--silver-dark)] hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}

            <div
              className={`flex items-center space-x-2 text-xs sm:text-sm ${
                addLiquidity.state.currentStep === 'adding' ? 'text-[var(--neon-blue)]' : 'text-[var(--silver-dark)]'
              }`}
            >
              {addLiquidity.state.currentStep === 'adding' ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
              ) : (
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-current flex-shrink-0" />
              )}
              <span className="font-medium whitespace-nowrap">Add Liquidity</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {addLiquidity.state.isProcessing && (
        <div className="mt-3 text-center">
          <div className="text-xs sm:text-sm text-[var(--metallic-silver)]">
            {addLiquidity.state.currentStep === 'approving-a' && 'Please approve Token A spending in your wallet...'}
            {addLiquidity.state.currentStep === 'approving-b' && 'Please approve Token B spending in your wallet...'}
            {addLiquidity.state.currentStep === 'adding' && 'Adding liquidity to the pool...'}
          </div>
        </div>
      )}

      {/* Token Selector Modal */}
      <TokenSelector
        tokens={allTokens}
        selectedToken={showTokenSelector === 'tokenA' ? addLiquidity.state.tokenA : addLiquidity.state.tokenB}
        onSelectToken={(token) => {
          if (showTokenSelector === 'tokenA') {
            addLiquidity.updateState({ tokenA: token.address });
          } else {
            addLiquidity.updateState({ tokenB: token.address });
          }
          setShowTokenSelector(null);
        }}
        customTokens={customTokens}
        onAddCustomToken={handleAddCustomToken}
        isOpen={showTokenSelector !== null}
        onClose={() => setShowTokenSelector(null)}
        contractAddress={AMM_ADDRESS}
      />

      {/* Transaction Status Modal */}
      <MultiTransactionModal
        isOpen={addLiquidity.state.isProcessing}
        onClose={() => {
          if (addLiquidity.state.transactionSuccess || addLiquidity.state.approvalASuccess || addLiquidity.state.approvalBSuccess || addLiquidity.state.error) {
            addLiquidity.updateState({
              isProcessing: false,
              error: undefined,
              approvalAHash: undefined,
              approvalBHash: undefined,
              txHash: undefined,
              approvalASuccess: false,
              approvalBSuccess: false,
              transactionSuccess: false,
            });
          }
        }}
        transactionType={
          addLiquidity.state.currentStep === 'approving-a'
            ? 'approval'
            : addLiquidity.state.currentStep === 'approving-b'
            ? 'approval'
            : addLiquidity.state.currentStep === 'adding'
            ? 'adding'
            : addLiquidity.state.transactionSuccess
            ? 'adding'
            : null
        }
        approvalHash={
          addLiquidity.state.currentStep === 'approving-a'
            ? addLiquidity.state.approvalAHash
            : addLiquidity.state.currentStep === 'approving-b'
            ? addLiquidity.state.approvalBHash
            : undefined
        }
        mainHash={addLiquidity.state.txHash}
        isApprovalPending={false}
        isApprovalConfirming={
          (addLiquidity.state.currentStep === 'approving-a' && !addLiquidity.state.approvalAHash) ||
          (addLiquidity.state.currentStep === 'approving-b' && !addLiquidity.state.approvalBHash)
        }
        isApprovalSuccess={addLiquidity.state.approvalASuccess || addLiquidity.state.approvalBSuccess}
        isMainPending={false}
        isMainConfirming={addLiquidity.state.currentStep === 'adding' && !addLiquidity.state.txHash}
        isMainSuccess={addLiquidity.state.transactionSuccess}
        isError={!!addLiquidity.state.error}
        error={addLiquidity.state.error ? new Error(addLiquidity.state.error) : null}
      />
    </>
  );
};