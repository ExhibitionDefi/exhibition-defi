import React, { useState, useMemo, useEffect } from 'react';
import type { Address } from 'viem';
import { Settings, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TokenSelector } from './TokenSelector';
import { SwapSettings } from './SwapSettings';
import { MultiTransactionModal } from '@/components/common/MultiTransactionModal';
import { useSwapLogic } from '@/hooks/amm/useSwapLogic';
import { AMMFormatters } from '@/utils/ammFormatters';
import { AMM_ADDRESS } from '@/config/contracts';

// Token interface
interface Token {
  address: Address;
  symbol: string;
  name: string;
  logoURI: string;
  decimals: number;
  isCustom?: boolean;
}

// Common tokens
const COMMON_TOKENS: Omit<Token, 'decimals'>[] = [
  {
    address: (import.meta.env.VITE_EXH_ADDRESS ) as Address,
    symbol: 'EXH',
    name: 'Exhibition Token',
    logoURI: '/tokens/EXH.png',
  },
  {
    address: (import.meta.env.VITE_EXUSDT_ADDRESS ) as Address,
    symbol: 'exUSDT',
    name: 'Exhibition USDT',
    logoURI: '/tokens/exusdt.png',
  },
  {
    address: (import.meta.env.VITE_EXNEX_ADDRESS ) as Address,
    symbol: 'exNEX',
    name: 'Exhibition Nexus',
    logoURI: '/tokens/exNEX.png',
  },
].filter((token) => token.address !== AMMFormatters.CONSTANTS.ZERO_ADDRESS);

interface SwapInterfaceProps {
  className?: string;
  defaultTokenIn?: Address;
  defaultTokenOut?: Address;
}

export const SwapInterface: React.FC<SwapInterfaceProps> = ({
  className = '',
  defaultTokenIn,
  defaultTokenOut,
}) => {
  const swapLogic = useSwapLogic({
    defaultTokenIn: defaultTokenIn || COMMON_TOKENS[0]?.address,
    defaultTokenOut: defaultTokenOut || COMMON_TOKENS[1]?.address,
  });

  const [customTokens, setCustomTokens] = useState<Token[]>(() => {
    try {
      const saved = localStorage.getItem('customTokens');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showTokenSelector, setShowTokenSelector] = useState<'in' | 'out' | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('customTokens', JSON.stringify(customTokens));
    } catch {
      // ignore
    }
  }, [customTokens]);

  const allTokens = useMemo(() => {
    const tokensWithDecimals: Token[] = COMMON_TOKENS.map((token) => ({
      ...token,
      decimals:
        swapLogic.tokenInInfo?.address === token.address
          ? swapLogic.tokenInInfo.decimals
          : swapLogic.tokenOutInfo?.address === token.address
          ? swapLogic.tokenOutInfo.decimals
          : 18,
    }));

    return [...tokensWithDecimals, ...customTokens];
  }, [customTokens, swapLogic.tokenInInfo, swapLogic.tokenOutInfo]);

  const handleAddCustomToken = (token: Token) => {
    setCustomTokens((prev) => {
      const exists = prev.some((t) => t.address.toLowerCase() === token.address.toLowerCase());
      if (exists) return prev;
      return [...prev, { ...token, isCustom: true }];
    });
  };

  const handleSwap = async () => {
    if (!swapLogic.validation.canProceed) return;

    try {
      await swapLogic.executeSwap();
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  const handleFlipTokens = () => {
    const currentIn = swapLogic.tokenIn;
    const currentOut = swapLogic.tokenOut;
    swapLogic.setTokenIn(currentOut);
    swapLogic.setTokenOut(currentIn);
  };

  return (
    <div className={`w-full max-w-md mx-auto px-4 sm:px-0 ${className}`}>
      {/* Main Card */}
      <div className="bg-[var(--deep-black)] border border-[var(--charcoal)] rounded-2xl p-4 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--silver-light)]">Swap</h2>
          <div className="flex items-center gap-1 sm:gap-2">
            {swapLogic.shouldShowSlippageRecommendation && (
              <button
                onClick={swapLogic.handleUseRecommendedSlippage}
                className="flex items-center gap-1 text-xs bg-[var(--neon-blue)] bg-opacity-20 text-[var(--neon-blue)] px-2 py-1 rounded-lg hover:bg-opacity-30 border border-[var(--neon-blue)] border-opacity-40 transition-all duration-300 whitespace-nowrap"
                title={`Use recommended slippage: ${swapLogic.recommendedSlippage.toFixed(1)}%`}
              >
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
                <span className="hidden xs:inline">Smart</span>
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-[var(--metallic-silver)] hover:text-[var(--neon-blue)] p-2 h-auto border-0 bg-transparent hover:bg-[var(--charcoal)] transition-all duration-300"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Token In */}
        <div className="mb-4">
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center mb-2 gap-1 xs:gap-0">
            <span className="text-xs sm:text-sm text-[var(--silver-dark)]">From</span>
            {swapLogic.balanceIn && swapLogic.tokenInInfo && (
              <button
                onClick={swapLogic.handleMaxBalance}
                className="text-xs text-[var(--neon-blue)] hover:underline truncate text-left xs:text-right"
              >
                Max: {swapLogic.formatBalance(swapLogic.balanceIn.value, swapLogic.tokenInInfo)}
              </button>
            )}
          </div>
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-0 bg-[var(--charcoal)] rounded-xl px-3 xs:px-4 py-2 xs:py-3">
            <input
              type="number"
              value={swapLogic.amountIn}
              onChange={(e) => swapLogic.setAmountIn(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-base xs:text-lg text-[var(--silver-light)] outline-none w-full xs:w-auto"
            />
            <button
              onClick={() => setShowTokenSelector('in')}
              className="flex items-center gap-1 xs:gap-2 ml-0 xs:ml-3 w-full xs:w-auto justify-center xs:justify-end flex-shrink-0"
            >
              <span className="font-semibold text-xs xs:text-sm text-[var(--silver-light)] truncate">
                {swapLogic.tokenInInfo?.symbol || 'Select'}
              </span>
              <ChevronDown className="w-3 h-3 xs:w-4 xs:h-4 text-[var(--silver-dark)] flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Flip toggle */}
        <div className="flex justify-center my-3">
          <button
            onClick={handleFlipTokens}
            className="p-2 rounded-full bg-[var(--charcoal)] hover:bg-[var(--neon-blue)] hover:text-[var(--deep-black)] transition-all duration-300"
            title="Flip tokens"
          >
            <ArrowUpDown className="w-4 h-4 xs:w-5 xs:h-5" />
          </button>
        </div>

        {/* Token Out */}
        <div className="mb-4">
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center mb-2 gap-1 xs:gap-0">
            <span className="text-xs sm:text-sm text-[var(--silver-dark)]">To</span>
            {swapLogic.balanceOut && swapLogic.tokenOutInfo && (
              <span className="text-xs text-[var(--silver-dark)] truncate text-left xs:text-right">
                Bal: {swapLogic.formatBalance(swapLogic.balanceOut.value, swapLogic.tokenOutInfo)}
              </span>
            )}
          </div>
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-0 bg-[var(--charcoal)] rounded-xl px-3 xs:px-4 py-2 xs:py-3">
            <input
              type="text"
              value={swapLogic.formattedAmountOut || ''}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-transparent text-base xs:text-lg text-[var(--silver-light)] outline-none w-full xs:w-auto"
            />
            <button
              onClick={() => setShowTokenSelector('out')}
              className="flex items-center gap-1 xs:gap-2 ml-0 xs:ml-3 w-full xs:w-auto justify-center xs:justify-end flex-shrink-0"
            >
              <span className="font-semibold text-xs xs:text-sm text-[var(--silver-light)] truncate">
                {swapLogic.tokenOutInfo?.symbol || 'Select'}
              </span>
              <ChevronDown className="w-3 h-3 xs:w-4 xs:h-4 text-[var(--silver-dark)] flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Swap Details */}
        <div className="mt-4 text-xs sm:text-sm text-[var(--metallic-silver)] space-y-1">
          <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
            <span className="whitespace-nowrap">Slippage Tolerance</span>
            <span className="truncate text-right xs:text-left">{swapLogic.formatSlippage(swapLogic.slippage)}</span>
          </div>
          <div className="flex flex-col xs:flex-row xs:justify-between gap-1 xs:gap-2">
            <span className="whitespace-nowrap">Price Impact</span>
            <span className={`truncate text-right xs:text-left ${swapLogic.priceImpactLevel === 'high' ? 'text-[var(--neon-orange)]' : ''}`}>
              {swapLogic.priceImpact.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Swap Button */}
        <div className="mt-6">
          <button
            onClick={handleSwap}
            disabled={swapLogic.buttonState.disabled}
            className={`w-full py-3 xs:py-4 text-base xs:text-lg font-semibold rounded-xl transition-all duration-300 relative ${
              swapLogic.buttonState.disabled
                ? 'bg-[var(--silver-dark)] text-[var(--charcoal)] cursor-not-allowed'
                : swapLogic.currentStep === 'approving'
                ? 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-blue)] text-[var(--deep-black)] shadow-[0_0_20px_var(--neon-orange)]'
                : swapLogic.currentStep === 'swapping'
                ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] text-[var(--deep-black)] shadow-[0_0_20px_var(--neon-blue)]'
                : swapLogic.validation.needsApproval
                ? 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-blue)] text-[var(--deep-black)] hover:from-[var(--neon-blue)] hover:to-[var(--neon-orange)] shadow-[0_0_20px_var(--neon-orange)]'
                : 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] text-[var(--deep-black)] hover:from-[var(--neon-orange)] hover:to-[var(--neon-blue)] shadow-[0_0_20px_var(--neon-blue)] hover:shadow-[0_0_25px_var(--neon-orange)]'
            }`}
          >
            {swapLogic.buttonState.loading && (
              <div className="absolute left-3 xs:left-4 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 xs:w-5 xs:h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
              </div>
            )}
            <span className={swapLogic.buttonState.loading ? 'ml-4 xs:ml-6' : ''}>
              {swapLogic.buttonState.text}
            </span>
          </button>
        </div>

        {/* Step Progress Indicator */}
        {swapLogic.isProcessing && (
          <div className="mt-4 p-3 rounded-lg bg-[var(--charcoal)] border border-[var(--silver-dark)] border-opacity-30">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-center gap-2 xs:gap-4">
              {/* Approval Step */}
              {swapLogic.approval.needsApproval && (
                <>
                  <div className={`flex items-center gap-2 text-xs xs:text-sm ${
                    swapLogic.currentStep === 'approving' ? 'text-[var(--neon-orange)]' :
                    swapLogic.currentStep === 'swapping' ? 'text-[var(--neon-orange)]' :
                    'text-[var(--silver-dark)]'
                  }`}>
                    {swapLogic.currentStep === 'approving' ? (
                      <div className="w-3 h-3 xs:w-4 xs:h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : swapLogic.currentStep === 'swapping' ? (
                      <div className="w-3 h-3 xs:w-4 xs:h-4 rounded-full bg-current flex-shrink-0" />
                    ) : (
                      <div className="w-3 h-3 xs:w-4 xs:h-4 rounded-full border-2 border-current flex-shrink-0" />
                    )}
                    <span className="font-medium whitespace-nowrap">
                      Approve {swapLogic.tokenInInfo?.symbol || 'Token'}
                    </span>
                  </div>
                  <svg className="w-3 h-3 xs:w-4 xs:h-4 text-[var(--silver-dark)] hidden xs:block flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
              
              {/* Swap Step */}
              <div className={`flex items-center gap-2 text-xs xs:text-sm ${
                swapLogic.currentStep === 'swapping' ? 'text-[var(--neon-blue)]' :
                'text-[var(--silver-dark)]'
              }`}>
                {swapLogic.currentStep === 'swapping' ? (
                  <div className="w-3 h-3 xs:w-4 xs:h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-3 h-3 xs:w-4 xs:h-4 rounded-full border-2 border-current flex-shrink-0" />
                )}
                <span className="font-medium whitespace-nowrap">Swap Tokens</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {swapLogic.isProcessing && (
          <div className="mt-3 text-center">
            <div className="text-xs xs:text-sm text-[var(--metallic-silver)]">
              {swapLogic.currentStep === 'approving' && 
                'Please approve token spending in your wallet...'
              }
              {swapLogic.currentStep === 'swapping' && 
                'Swapping tokens...'
              }
            </div>
          </div>
        )}
      </div>

      {/* Token Selector */}
      <TokenSelector
        tokens={allTokens}
        selectedToken={showTokenSelector === 'in' ? swapLogic.tokenIn : swapLogic.tokenOut}
        onSelectToken={(token) => {
          if (showTokenSelector === 'in') {
            swapLogic.setTokenIn(token.address);
          } else {
            swapLogic.setTokenOut(token.address);
          }
          setShowTokenSelector(null);
        }}
        customTokens={customTokens}
        onAddCustomToken={handleAddCustomToken}
        isOpen={showTokenSelector !== null}
        onClose={() => setShowTokenSelector(null)}
        contractAddress={AMM_ADDRESS}
      />

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Swap Settings">
        <SwapSettings
          slippage={swapLogic.slippage}
          deadline={swapLogic.deadline}
          recommendedSlippage={swapLogic.recommendedSlippage}
          onSlippageChange={swapLogic.setSlippage}
          onDeadlineChange={swapLogic.setDeadline}
        />
      </Modal>

      {/* MultiTransaction Modal */}
      <MultiTransactionModal
        isOpen={swapLogic.isProcessing}
        onClose={() => {
          if (swapLogic.swapSuccess || swapLogic.approvalSuccess || swapLogic.error) {
            swapLogic.setAmountIn('');
          }
        }}
        transactionType={
          swapLogic.currentStep === 'approving' ? 'approval' :
          swapLogic.currentStep === 'swapping' ? 'swap' :
          swapLogic.swapSuccess ? 'swap' :
          null
        }
        approvalHash={swapLogic.approvalHash}
        mainHash={swapLogic.swapHash}
        isApprovalPending={false}
        isApprovalConfirming={
          swapLogic.currentStep === 'approving' && !swapLogic.approvalHash
        }
        isApprovalSuccess={swapLogic.approvalSuccess}
        isMainPending={false}
        isMainConfirming={
          swapLogic.currentStep === 'swapping' && !swapLogic.swapHash
        }
        isMainSuccess={swapLogic.swapSuccess}
        isError={!!swapLogic.error}
        error={swapLogic.error ? new Error(swapLogic.error) : null}
      />
    </div>
  );
};