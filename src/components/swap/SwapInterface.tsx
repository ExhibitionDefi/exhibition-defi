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
    address: (import.meta.env.VITE_EXH_ADDRESS ||
      '0x2923faaDe9cc4b1fe2881eBbAcE8EC821ad80dB4') as Address,
    symbol: 'EXH',
    name: 'Exhibition Token',
    logoURI: '/tokens/EXH.png',
  },
  {
    address: (import.meta.env.VITE_EXUSDT_ADDRESS ||
      '0x3F9bEf1d5e1A23B95bC69B2E99F57534971aD56D') as Address,
    symbol: 'exUSDT',
    name: 'Exhibition USDT',
    logoURI: '/tokens/exusdt.png',
  },
  {
    address: (import.meta.env.VITE_EXNEX_ADDRESS ||
      '0x28fC7752e06A66b0219E78Dee00537E620cE9573') as Address,
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
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Main Card */}
      <div className="bg-[var(--deep-black)] border border-[var(--charcoal)] rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--silver-light)]">Swap</h2>
          <div className="flex items-center space-x-2">
            {swapLogic.shouldShowSlippageRecommendation && (
              <button
                onClick={swapLogic.handleUseRecommendedSlippage}
                className="flex items-center space-x-1 text-xs bg-[var(--neon-blue)] bg-opacity-20 text-[var(--neon-blue)] px-2 py-1 rounded-lg hover:bg-opacity-30 border border-[var(--neon-blue)] border-opacity-40 transition-all duration-300"
                title={`Use recommended slippage: ${swapLogic.recommendedSlippage.toFixed(1)}%`}
              >
                <ChevronDown className="w-3 h-3" />
                <span>Smart</span>
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-[var(--metallic-silver)] hover:text-[var(--neon-blue)] p-2 h-auto border-0 bg-transparent hover:bg-[var(--charcoal)] transition-all duration-300"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Token In */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[var(--silver-dark)]">From</span>
            {swapLogic.balanceIn && swapLogic.tokenInInfo && (
              <button
                onClick={swapLogic.handleMaxBalance}
                className="text-xs text-[var(--neon-blue)] hover:underline"
              >
                Max: {swapLogic.formatBalance(swapLogic.balanceIn.value, swapLogic.tokenInInfo)}
              </button>
            )}
          </div>
          <div className="flex items-center bg-[var(--charcoal)] rounded-xl px-4 py-3">
            <input
              type="number"
              value={swapLogic.amountIn}
              onChange={(e) => swapLogic.setAmountIn(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-lg text-[var(--silver-light)] outline-none"
            />
            <button
              onClick={() => setShowTokenSelector('in')}
              className="flex items-center space-x-2 ml-3"
            >
              <span className="font-semibold text-[var(--silver-light)]">
                {swapLogic.tokenInInfo?.symbol || 'Select'}
              </span>
              <ChevronDown className="w-4 h-4 text-[var(--silver-dark)]" />
            </button>
          </div>
        </div>

        {/* Flip toggle */}
        <div className="flex justify-center my-2">
          <button
            onClick={handleFlipTokens}
            className="p-2 rounded-full bg-[var(--charcoal)] hover:bg-[var(--neon-blue)] hover:text-[var(--deep-black)] transition-all duration-300"
            title="Flip tokens"
          >
            <ArrowUpDown className="w-5 h-5" />
          </button>
        </div>

        {/* Token Out */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[var(--silver-dark)]">To</span>
            {swapLogic.balanceOut && swapLogic.tokenOutInfo && (
              <span className="text-xs text-[var(--silver-dark)]">
                Bal: {swapLogic.formatBalance(swapLogic.balanceOut.value, swapLogic.tokenOutInfo)}
              </span>
            )}
          </div>
          <div className="flex items-center bg-[var(--charcoal)] rounded-xl px-4 py-3">
            <input
              type="text"
              value={swapLogic.formattedAmountOut || ''}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-transparent text-lg text-[var(--silver-light)] outline-none"
            />
            <button
              onClick={() => setShowTokenSelector('out')}
              className="flex items-center space-x-2 ml-3"
            >
              <span className="font-semibold text-[var(--silver-light)]">
                {swapLogic.tokenOutInfo?.symbol || 'Select'}
              </span>
              <ChevronDown className="w-4 h-4 text-[var(--silver-dark)]" />
            </button>
          </div>
        </div>

        {/* Swap Details */}
        <div className="mt-4 text-sm text-[var(--metallic-silver)] space-y-1">
          <div className="flex justify-between">
            <span>Slippage Tolerance</span>
            <span>{swapLogic.formatSlippage(swapLogic.slippage)}</span>
          </div>
          <div className="flex justify-between">
            <span>Price Impact</span>
            <span className={swapLogic.priceImpactLevel === 'high' ? 'text-[var(--neon-orange)]' : ''}>
              {swapLogic.priceImpact.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Swap Button */}
        <div className="mt-6">
          <button
            onClick={handleSwap}
            disabled={swapLogic.buttonState.disabled}
            className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 relative ${
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
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
              </div>
            )}
            <span className={swapLogic.buttonState.loading ? 'ml-6' : ''}>
              {swapLogic.buttonState.text}
            </span>
          </button>
        </div>

        {/* Step Progress Indicator */}
        {swapLogic.isProcessing && (
          <div className="mt-4 p-3 rounded-lg bg-[var(--charcoal)] border border-[var(--silver-dark)] border-opacity-30">
            <div className="flex items-center justify-center space-x-4">
              {/* Approval Step */}
              {swapLogic.approval.needsApproval && (
                <>
                  <div className={`flex items-center space-x-2 ${
                    swapLogic.currentStep === 'approving' ? 'text-[var(--neon-orange)]' :
                    swapLogic.currentStep === 'swapping' ? 'text-[var(--neon-orange)]' :
                    'text-[var(--silver-dark)]'
                  }`}>
                    {swapLogic.currentStep === 'approving' ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : swapLogic.currentStep === 'swapping' ? (
                      <div className="w-4 h-4 rounded-full bg-current" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-current" />
                    )}
                    <span className="text-sm font-medium">
                      Approve {swapLogic.tokenInInfo?.symbol || 'Token'}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-[var(--silver-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
              
              {/* Swap Step */}
              <div className={`flex items-center space-x-2 ${
                swapLogic.currentStep === 'swapping' ? 'text-[var(--neon-blue)]' :
                'text-[var(--silver-dark)]'
              }`}>
                {swapLogic.currentStep === 'swapping' ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-current" />
                )}
                <span className="text-sm font-medium">Swap Tokens</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {swapLogic.isProcessing && (
          <div className="mt-3 text-center">
            <div className="text-sm text-[var(--metallic-silver)]">
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
          // Only allow manual close during success or error states
          if (swapLogic.swapSuccess || swapLogic.approvalSuccess || swapLogic.error) {
            // Reset all states
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