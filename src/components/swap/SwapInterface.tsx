// src/components/swap/SwapInterface.tsx
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
import { SafeHtml } from '../SafeHtml';
import { sanitizeText } from '@/utils/sanitization';
import { logger } from '@/utils/logger';
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing';

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
    address: (import.meta.env.VITE_EXUSD_ADDRESS ) as Address,
    symbol: 'exUSD',
    name: 'Exhibition USD',
    logoURI: '/tokens/exusd.png',
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
  // ✨ NEW: Callbacks for token changes
  onTokenInChange?: (token: Address | null) => void;
  onTokenOutChange?: (token: Address | null) => void;
}

export const SwapInterface: React.FC<SwapInterfaceProps> = ({
  className = '',
  defaultTokenIn,
  defaultTokenOut,
  onTokenInChange,
  onTokenOutChange,
}) => {
  const swapLogic = useSwapLogic({
    defaultTokenIn: defaultTokenIn || COMMON_TOKENS[0]?.address,
    defaultTokenOut: defaultTokenOut || COMMON_TOKENS[1]?.address,
  });

  const { getTokenPriceUSD, isReady: isPricingReady } = useLocalPricing();

  // ✅ Safe localStorage handling with validation
  const [customTokens, setCustomTokens] = useState<Token[]>(() => {
    try {
      const saved = localStorage.getItem('customTokens');
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      
      // ✅ Validate parsed data is an array
      if (!Array.isArray(parsed)) return [];
      
      // ✅ Validate and sanitize each token
      return parsed
        .filter((token): token is Token => {
          return (
            token &&
            typeof token.address === 'string' &&
            typeof token.symbol === 'string' &&
            typeof token.decimals === 'number' &&
            /^0x[a-fA-F0-9]{40}$/.test(token.address) &&
            token.decimals >= 0 &&
            token.decimals <= 18
          );
        })
        .map((token) => ({
          ...token,
          symbol: sanitizeText(token.symbol).slice(0, 20),
          name: sanitizeText(token.name || token.symbol).slice(0, 100),
          decimals: Math.min(Math.max(Number(token.decimals), 0), 18),
        }))
        .slice(0, 50); // ✅ Limit to 50 custom tokens max
    } catch {
      return [];
    }
  });

  const [showTokenSelector, setShowTokenSelector] = useState<'in' | 'out' | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // ✨ NEW: Notify parent when tokens change
  useEffect(() => {
    onTokenInChange?.(swapLogic.tokenIn || null);
  }, [swapLogic.tokenIn, onTokenInChange]);

  useEffect(() => {
    onTokenOutChange?.(swapLogic.tokenOut || null);
  }, [swapLogic.tokenOut, onTokenOutChange]);

  // ✅ Safe localStorage save with error handling
  useEffect(() => {
    try {
      // Only save valid tokens
      const validTokens = customTokens.filter(
        (token) =>
          token.address &&
          /^0x[a-fA-F0-9]{40}$/.test(token.address) &&
          token.symbol &&
          typeof token.decimals === 'number'
      );
      
      localStorage.setItem('customTokens', JSON.stringify(validTokens));
    } catch (error) {
      logger.warn('Failed to save custom tokens:', error);
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

  // Calculate USD values
  const getUSDValue = (amount: string, decimals: number, tokenAddress?: Address): string => {
    if (!isPricingReady || !tokenAddress || !amount || amount === '0' || amount === '0.0') return '';
    
    try {
      const tokenPrice = getTokenPriceUSD(tokenAddress);
      if (tokenPrice === 'N/A') return '';
      
      // Parse the price (remove $ and commas)
      const priceValue = parseFloat(tokenPrice.replace(/[$,]/g, ''));
      
      // Parse amount as number
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) return '';
      
      // Calculate USD value
      const usdValue = amountValue * priceValue;
      
      return `$${usdValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } catch (error) {
      return '';
    }
  };

  const amountInUSD = getUSDValue(
    swapLogic.amountIn,
    swapLogic.tokenInInfo?.decimals || 18,
    swapLogic.tokenIn || undefined
  );

  const amountOutUSD = getUSDValue(
    swapLogic.formattedAmountOut || '0',
    swapLogic.tokenOutInfo?.decimals || 18,
    swapLogic.tokenOut || undefined
  );

  // ✅ Validate custom token before adding
  const handleAddCustomToken = (token: Token) => {
    setCustomTokens((prev) => {
      // Check if already exists
      const exists = prev.some((t) => t.address.toLowerCase() === token.address.toLowerCase());
      if (exists) return prev;
      
      // ✅ Validate token data
      if (!token.address || !token.symbol || typeof token.decimals !== 'number') {
        logger.warn('Invalid token data');
        return prev;
      }
      
      // ✅ Sanitize token data
      const sanitizedToken: Token = {
        ...token,
        symbol: sanitizeText(token.symbol).slice(0, 20),
        name: sanitizeText(token.name || token.symbol).slice(0, 100),
        decimals: Math.min(Math.max(Number(token.decimals), 0), 18),
        isCustom: true,
      };
      
      // ✅ Limit to 50 custom tokens
      const newTokens = [...prev, sanitizedToken];
      return newTokens.slice(0, 50);
    });
  };

  // ✅ Sanitize amount input
  const handleAmountInChange = (value: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('') 
      : cleaned;
    
    // Limit decimal places based on token decimals
    if (swapLogic.tokenInInfo && parts[1] && parts[1].length > swapLogic.tokenInInfo.decimals) {
      return; // Don't update if exceeds decimals
    }
    
    swapLogic.setAmountIn(sanitized);
  };

  const handleSwap = async () => {
    if (!swapLogic.validation.canProceed) return;

    try {
      await swapLogic.executeSwap();
    } catch (error) {
      logger.error('Swap failed:', error);
    }
  };

  const handleFlipTokens = () => {
    const currentIn = swapLogic.tokenIn;
    const currentOut = swapLogic.tokenOut;
    swapLogic.setTokenIn(currentOut);
    swapLogic.setTokenOut(currentIn);
  };

  // ✅ Safe token symbol display
  const safeTokenInSymbol = useMemo(
    () => sanitizeText(swapLogic.tokenInInfo?.symbol || 'Select'),
    [swapLogic.tokenInInfo?.symbol]
  );

  const safeTokenOutSymbol = useMemo(
    () => sanitizeText(swapLogic.tokenOutInfo?.symbol || 'Select'),
    [swapLogic.tokenOutInfo?.symbol]
  );

  return (
    <div className={`w-full max-w-[95vw] sm:max-w-md mx-auto ${className}`}>
      {/* Main Card */}
      <div className="bg-[var(--deep-black)] border border-[var(--charcoal)] rounded-2xl p-4 sm:p-6 shadow-2xl">
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
              aria-label="Open swap settings"
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
                <SafeHtml 
                  content={`Max: ${swapLogic.formatBalance(swapLogic.balanceIn.value, swapLogic.tokenInInfo)}`}
                  as="span"
                />
              </button>
            )}
          </div>
          <div className="flex items-center bg-[var(--charcoal)] rounded-xl px-3 sm:px-4 py-3 gap-2">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                inputMode="decimal"
                value={swapLogic.amountIn}
                onChange={(e) => handleAmountInChange(e.target.value)}
                placeholder="0.0"
                maxLength={30}
                className="w-full bg-transparent text-lg text-[var(--silver-light)] outline-none"
              />
              {amountInUSD && (
                <div className="text-xs text-[var(--silver-dark)] mt-1">
                  ≈ {amountInUSD}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowTokenSelector('in')}
              className="flex items-center space-x-1.5 shrink-0"
            >
              <SafeHtml 
                content={safeTokenInSymbol}
                as="span"
                className="font-semibold text-[var(--silver-light)] text-sm sm:text-base"
              />
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
            aria-label="Flip token positions"
          >
            <ArrowUpDown className="w-5 h-5" />
          </button>
        </div>

        {/* Token Out */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-[var(--silver-dark)]">To</span>
            {swapLogic.balanceOut && swapLogic.tokenOutInfo && (
              <SafeHtml 
                content={`Bal: ${swapLogic.formatBalance(swapLogic.balanceOut.value, swapLogic.tokenOutInfo)}`}
                as="span"
                className="text-xs text-[var(--silver-dark)]"
              />
            )}
          </div>
          <div className="flex items-center bg-[var(--charcoal)] rounded-xl px-3 sm:px-4 py-3 gap-2">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={swapLogic.formattedAmountOut || ''}
                readOnly
                placeholder="0.0"
                className="w-full bg-transparent text-lg text-[var(--silver-light)] outline-none"
              />
              {amountOutUSD && (
                <div className="text-xs text-[var(--silver-dark)] mt-1">
                  ≈ {amountOutUSD}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowTokenSelector('out')}
              className="flex items-center space-x-1.5 shrink-0"
            >
              <SafeHtml 
                content={safeTokenOutSymbol}
                as="span"
                className="font-semibold text-[var(--silver-light)] text-sm sm:text-base"
              />
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
                    <SafeHtml 
                      content={`Approve ${safeTokenInSymbol}`}
                      as="span"
                      className="text-sm font-medium"
                    />
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