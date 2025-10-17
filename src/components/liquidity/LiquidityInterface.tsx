import React, { useState, useEffect } from 'react';
import type { Address } from 'viem';
import { MultiTransactionModal } from '@/components/common/MultiTransactionModal';
import { Plus, Minus, ArrowLeftRight, Settings, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TokenSelector } from '@/components/swap/TokenSelector';
import { useLiquidityPool } from '@/hooks/amm/useLiquidityPool';
import { AMMFormatters } from '@/utils/ammFormatters';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { AMM_ADDRESS } from '@/config/contracts';
import type { Pool } from '@/components/liquidity/PoolList';

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
    address: CONTRACT_ADDRESSES.EXH,
    symbol: 'EXH', 
    name: 'Exhibition Token',
    logoURI: '/tokens/EXH.png',
    decimals: 18
  },
  { 
    address: CONTRACT_ADDRESSES.EXUSDT,
    symbol: 'exUSDT', 
    name: 'Exhibition USDT',
    logoURI: '/tokens/exusdt.png',
    decimals: 6
  },
  { 
    address: CONTRACT_ADDRESSES.EXNEX,
    symbol: 'exNEX', 
    name: 'Exhibition Nexus',
    logoURI: '/tokens/exNEX.png',
    decimals: 18
  },
].filter((token) => token.address !== AMMFormatters.CONSTANTS.ZERO_ADDRESS);

interface LiquidityInterfaceProps {
  className?: string;
  initialPositions?: Pool[];
  selectedPosition?: Pool | null;
  onSelectPosition?: (position: Pool | null) => void;
}

export const LiquidityInterface: React.FC<LiquidityInterfaceProps> = ({
  className = '',
  initialPositions = [],
  selectedPosition,
  onSelectPosition,
}) => {
  const liquidityLogic = useLiquidityPool();
  const [mode, setMode] = useState<'add' | 'remove'>('add');

  // Modal states
  const [showTokenSelector, setShowTokenSelector] = useState<'tokenA' | 'tokenB' | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (selectedPosition && mode === 'remove') {
      liquidityLogic.setSelectedPosition(selectedPosition);
      liquidityLogic.updateLiquidityState({
        tokenA: selectedPosition.tokenA,
        tokenB: selectedPosition.tokenB,
      });
    } else if (!selectedPosition && mode === 'remove') {
      liquidityLogic.setSelectedPosition(null);
      liquidityLogic.updateLiquidityState({ amountA: '' });
    }
  }, [selectedPosition, mode]); // ← FIXED: Removed liquidityLogic from dependencies

  // Set default tokens and positions on mount
  useEffect(() => {
    if (COMMON_TOKENS.length >= 2 && !liquidityLogic.liquidityState.tokenA) {
      liquidityLogic.updateLiquidityState({
        tokenA: COMMON_TOKENS[0].address,
        tokenB: COMMON_TOKENS[1].address,
      });
    }
    liquidityLogic.setPositions(initialPositions);
    if (initialPositions.length > 0 && mode === 'remove' && !selectedPosition) {
      onSelectPosition?.(initialPositions[0]);
    }
  }, [initialPositions, mode]); // ← FIXED: This dependency array is now safe

  // Handle transaction execution
  const handleTransaction = async () => {
    if (mode === 'add' && !liquidityLogic.canAddLiquidity) return;
    if (mode === 'remove' && !liquidityLogic.canRemoveLiquidity) return;

    try {
      const txHash = mode === 'add'
        ? await liquidityLogic.executeAddLiquidity()
        : await liquidityLogic.executeRemoveLiquidity();

      console.log('Transaction completed:', txHash);
    } catch (error) {
      console.error(`${mode === 'add' ? 'Add' : 'Remove'} liquidity failed:`, error);
    }
  };

  // Handle max balance for token inputs
  const handleMaxBalance = (token: 'A' | 'B') => {
    if (token === 'A' && liquidityLogic.balanceA?.value && liquidityLogic.tokenAInfo) {
      const maxAmount = AMMFormatters.formatTokenAmountSync(
        liquidityLogic.balanceA.value, 
        liquidityLogic.tokenAInfo.decimals, 
        liquidityLogic.tokenAInfo.decimals
      );
      liquidityLogic.updateLiquidityState({ amountA: maxAmount });
    } else if (token === 'B' && liquidityLogic.balanceB?.value && liquidityLogic.tokenBInfo) {
      const maxAmount = AMMFormatters.formatTokenAmountSync(
        liquidityLogic.balanceB.value, 
        liquidityLogic.tokenBInfo.decimals, 
        liquidityLogic.tokenBInfo.decimals
      );
      liquidityLogic.updateLiquidityState({ amountB: maxAmount });
    }
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      {/* Main Liquidity Card */}
      <div className="bg-[var(--deep-black)] border border-[var(--charcoal)] rounded-2xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--silver-light)]">Liquidity</h2>
          <div className="flex items-center space-x-2">
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

        {/* Mode Switch */}
        <div className="flex space-x-1 bg-[var(--charcoal)] p-2 rounded-lg border border-[var(--silver-dark)] border-opacity-30 mb-6">
          <Button
            variant={mode === 'add' ? 'default' : 'ghost'}
            onClick={() => {
              setMode('add');
              liquidityLogic.updateLiquidityState({ mode: 'add' });
            }}
            disabled={liquidityLogic.liquidityState.isProcessing}
            className={`flex-1 transition-all duration-300 ${
              mode === 'add' 
                ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)] text-[var(--deep-black)] shadow-lg' 
                : 'text-[var(--metallic-silver)] hover:text-[var(--neon-blue)] hover:bg-[var(--deep-black)]'
            }`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Liquidity
          </Button>
          <Button
            variant={mode === 'remove' ? 'default' : 'ghost'}
            onClick={() => {
              setMode('remove');
              liquidityLogic.updateLiquidityState({ mode: 'remove' });
            }}
            disabled={liquidityLogic.liquidityState.isProcessing}
            className={`flex-1 transition-all duration-300 ${
              mode === 'remove' 
                ? 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)] text-[var(--deep-black)] shadow-lg' 
                : 'text-[var(--metallic-silver)] hover:text-[var(--neon-orange)] hover:bg-[var(--deep-black)]'
            }`}
          >
            <Minus className="h-4 w-4 mr-2" />
            Remove Liquidity
          </Button>
        </div>

        {/* Token Input Section */}
        <div className="space-y-1">
          {mode === 'add' ? (
            <>
              {/* Token A */}
              <div className="bg-[var(--charcoal)] rounded-xl p-4 border border-[var(--silver-dark)] border-opacity-30 hover:border-opacity-50 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--metallic-silver)]">Token A</span>
                  {liquidityLogic.balanceA?.value !== undefined && liquidityLogic.tokenAInfo && (
                    <div className="text-sm text-[var(--silver-dark)] flex items-center space-x-2">
                      <span>
                        Balance: <span className="text-[var(--silver-light)]">
                          {AMMFormatters.formatTokenAmountSync(liquidityLogic.balanceA.value, liquidityLogic.tokenAInfo.decimals, 6)} {liquidityLogic.tokenAInfo.symbol}
                        </span>
                      </span>
                      {liquidityLogic.balanceA.value > 0 && (
                        <button
                          onClick={() => handleMaxBalance('A')}
                          className="text-xs text-[var(--neon-blue)] hover:text-[var(--neon-orange)] px-2 py-1 bg-transparent border-0 hover:bg-[var(--deep-black)] rounded transition-all duration-300"
                        >
                          MAX
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowTokenSelector('tokenA')}
                    className="border-opacity-50 rounded-xl p-3 hover:border-[var(--neon-blue)] hover:border-opacity-80 transition-all duration-300 group flex-shrink-0"
                  >
                    <div className="flex items-center space-x-2">
                      {liquidityLogic.tokenAInfo ? (
                        <>
                          <span className="font-semibold text-[var(--silver-light)] group-hover:text-[var(--neon-blue)] transition-colors duration-300">
                            {liquidityLogic.tokenAInfo.symbol}
                          </span>
                          <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-blue)] transition-colors duration-300" />
                        </>
                      ) : (
                        <>
                          <span className="text-[var(--silver-dark)] group-hover:text-[var(--neon-blue)] transition-colors duration-300">Select</span>
                          <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-blue)] transition-colors duration-300" />
                        </>
                      )}
                    </div>
                  </button>
                  <input
                    type="text"
                    placeholder="0.0"
                    value={liquidityLogic.liquidityState.amountA}
                    onChange={(e) => {
                      if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                        liquidityLogic.updateLiquidityState({ amountA: e.target.value });
                      }
                    }}
                    className="flex-1 bg-transparent text-lg font-bold text-[var(--silver-light)] placeholder:text-[var(--silver-dark)] border-0 outline-none text-right"
                  />
                </div>
              </div>

              {/* Swap Direction Button */}
              <div className="flex justify-center -my-2 relative z-10">
                <button
                  onClick={() => {
                    liquidityLogic.updateLiquidityState({
                      tokenA: liquidityLogic.liquidityState.tokenB,
                      tokenB: liquidityLogic.liquidityState.tokenA,
                      amountA: liquidityLogic.liquidityState.amountB,
                      amountB: liquidityLogic.liquidityState.amountA,
                    });
                  }}
                  disabled={!liquidityLogic.liquidityState.tokenA || !liquidityLogic.liquidityState.tokenB}
                  className="bg-[var(--deep-black)] border-2 border-[var(--silver-dark)] border-opacity-50 rounded-full p-3 hover:border-[var(--neon-blue)] hover:border-opacity-80 disabled:opacity-50 transition-all duration-300 group"
                >
                  <ArrowLeftRight className="w-5 h-5 text-[var(--silver-light)] group-hover:text-[var(--neon-blue)] transition-colors duration-300" />
                </button>
              </div>

              {/* Token B */}
              <div className="bg-[var(--charcoal)] rounded-xl p-4 border border-[var(--silver-dark)] border-opacity-30 hover:border-opacity-50 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--metallic-silver)]">Token B</span>
                  {liquidityLogic.balanceB?.value !== undefined && liquidityLogic.tokenBInfo && (
                    <div className="text-sm text-[var(--silver-dark)] flex items-center space-x-2">
                      <span>
                        Balance: <span className="text-[var(--silver-light)]">
                          {AMMFormatters.formatTokenAmountSync(liquidityLogic.balanceB.value, liquidityLogic.tokenBInfo.decimals, 6)} {liquidityLogic.tokenBInfo.symbol}
                        </span>
                      </span>
                      {liquidityLogic.balanceB.value > 0 && (
                        <button
                          onClick={() => handleMaxBalance('B')}
                          className="text-xs text-[var(--neon-orange)] hover:text-[var(--neon-blue)] px-2 py-1 bg-transparent border-0 hover:bg-[var(--deep-black)] rounded transition-all duration-300"
                        >
                          MAX
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowTokenSelector('tokenB')}
                    className="border-opacity-50 rounded-xl p-3 hover:border-[var(--neon-orange)] hover:border-opacity-80 transition-all duration-300 group flex-shrink-0"
                  >
                    <div className="flex items-center space-x-2">
                      {liquidityLogic.tokenBInfo ? (
                        <>
                          <span className="font-semibold text-[var(--silver-light)] group-hover:text-[var(--neon-orange)] transition-colors duration-300">
                            {liquidityLogic.tokenBInfo.symbol}
                          </span>
                          <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-orange)] transition-colors duration-300" />
                        </>
                      ) : (
                        <>
                          <span className="text-[var(--silver-dark)] group-hover:text-[var(--neon-orange)] transition-colors duration-300">Select</span>
                          <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-orange)] transition-colors duration-300" />
                        </>
                      )}
                    </div>
                  </button>
                  <input
                    type="text"
                    placeholder="0.0"
                    value={liquidityLogic.liquidityState.amountB}
                    onChange={(e) => {
                      if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                        liquidityLogic.updateLiquidityState({ amountB: e.target.value });
                      }
                    }}
                    className="flex-1 bg-transparent text-lg font-bold text-[var(--silver-light)] placeholder:text-[var(--silver-dark)] border-0 outline-none text-right"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Remove Liquidity LP Token Input */}
              <div className="bg-[var(--charcoal)] rounded-xl p-4 border border-[var(--silver-dark)] border-opacity-30 hover:border-opacity-50 transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--metallic-silver)]">LP Tokens</span>
                  {liquidityLogic.lpBalance !== undefined && (
                    <div className="text-sm text-[var(--silver-dark)] flex items-center space-x-2">
                      <span>
                        Balance:{' '}
                        <span className="text-[var(--silver-light)]">
                          {AMMFormatters.formatTokenAmountSync(liquidityLogic.lpBalance as bigint, 18, 6)}
                        </span>
                      </span>
                      {(liquidityLogic.lpBalance ?? 0n) > 0n && (
                        <button
                          onClick={() =>
                            liquidityLogic.updateLiquidityState({
                              amountA: AMMFormatters.formatTokenAmountSync(liquidityLogic.lpBalance as bigint, 18, 18),
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
                    const selected = initialPositions.find(
                      (p) => `${p.tokenA}-${p.tokenB}` === e.target.value
                    );
                    onSelectPosition?.(selected || null);
                  }}
                  value={liquidityLogic.selectedPosition ? `${liquidityLogic.selectedPosition.tokenA}-${liquidityLogic.selectedPosition.tokenB}` : ''}
                  disabled={!initialPositions.length}
                  className="w-full p-2 bg-[var(--charcoal)] border-[var(--silver-dark)] border-opacity-30 text-[var(--silver-light)] rounded mb-2"
                >
                  <option value="" disabled={!initialPositions.length}>
                    {initialPositions.length ? 'Select a position' : 'No positions available'}
                  </option>
                  {initialPositions.map((pool) => (
                    <option
                      key={`${pool.tokenA}-${pool.tokenB}`}
                      value={`${pool.tokenA}-${pool.tokenB}`}
                    >
                      {`${pool.symbolA}/${pool.symbolB} - ${pool.userShare?.toFixed(2)}% share`}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="0.0"
                  value={liquidityLogic.liquidityState.amountA}
                  onChange={(e) => {
                    if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                      liquidityLogic.updateLiquidityState({ amountA: e.target.value });
                    }
                  }}
                  className="w-full bg-transparent text-lg font-bold text-[var(--silver-light)] placeholder:text-[var(--silver-dark)] border-0 outline-none text-right"
                />
              </div>

              {/* Expected Token Outputs */}
              {liquidityLogic.removeQuote && (
                <div className="mt-3 p-4 bg-[var(--charcoal)] rounded-xl border border-[var(--silver-dark)] border-opacity-30">
                  <div className="flex justify-between text-sm text-[var(--silver-light)] mb-2">
                    <span>You will receive</span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--silver-dark)]">
                    <span>{liquidityLogic.tokenAInfo?.symbol || 'Token A'}:</span>
                    <span className="text-[var(--silver-light)]">
                      {AMMFormatters.formatTokenAmountSync(
                        liquidityLogic.removeQuote[0] as bigint,
                        liquidityLogic.tokenAInfo?.decimals || 18,
                        6
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--silver-dark)]">
                    <span>{liquidityLogic.tokenBInfo?.symbol || 'Token B'}:</span>
                    <span className="text-[var(--silver-light)]">
                      {AMMFormatters.formatTokenAmountSync(
                        liquidityLogic.removeQuote[1] as bigint,
                        liquidityLogic.tokenBInfo?.decimals || 18,
                        6
                      )}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pool Information */}
        {liquidityLogic.poolExists !== undefined && (
          <div className="mt-4 space-y-2 text-sm text-[var(--silver-dark)]">
            <div className="flex justify-between">
              <span>Pool Status:</span>
              <span className={liquidityLogic.poolExists ? 'text-[var(--neon-blue)]' : 'text-[var(--neon-orange)]'}>
                {liquidityLogic.poolExists ? 'Active' : 'Not Found'}
              </span>
            </div>
            {mode === 'remove' && liquidityLogic.lpBalance !== undefined && (
              <div className="flex justify-between">
                <span>Your LP Balance:</span>
                <span className="text-[var(--silver-light)]">
                  {AMMFormatters.formatTokenAmountSync(liquidityLogic.lpBalance as bigint, 18, 6)}
                </span>
              </div>
            )}
            {liquidityLogic.isLocked !== undefined && liquidityLogic.isLocked && (
              <div className="flex justify-between">
                <span>Liquidity Status:</span>
                <span className="text-[var(--neon-orange)]">Locked</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={handleTransaction}
            disabled={liquidityLogic.buttonState.disabled}
            className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 relative ${
              liquidityLogic.buttonState.disabled
                ? 'bg-[var(--silver-dark)] text-[var(--charcoal)] cursor-not-allowed'
                : mode === 'add'
                ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] text-[var(--deep-black)] hover:from-[var(--neon-orange)] hover:to-[var(--neon-blue)] shadow-[0_0_20px_var(--neon-blue)]'
                : 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-blue)] text-[var(--deep-black)] hover:from-[var(--neon-blue)] hover:to-[var(--neon-orange)] shadow-[0_0_20px_var(--neon-orange)]'
            }`}
          >
            {liquidityLogic.buttonState.loading && (
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
              </div>
            )}
            <span className={liquidityLogic.buttonState.loading ? 'ml-6' : ''}>
              {liquidityLogic.buttonState.text}
            </span>
          </button>
        </div>

        {/* Step Progress Indicator */}
        {liquidityLogic.liquidityState.isProcessing && (
          <div className="mt-4 p-3 rounded-lg bg-[var(--charcoal)] border border-[var(--silver-dark)] border-opacity-30">
            <div className="flex items-center justify-center space-x-4">
              {/* Token A Approval */}
              {liquidityLogic.approvalA.needsApproval && (
                <>
                  <div className={`flex items-center space-x-2 ${
                    liquidityLogic.liquidityState.currentStep === 'approving-a' ? 'text-[var(--neon-blue)]' :
                    liquidityLogic.liquidityState.currentStep === 'approving-b' || liquidityLogic.liquidityState.currentStep === 'adding' ? 'text-[var(--neon-blue)]' :
                    'text-[var(--silver-dark)]'
                  }`}>
                    {liquidityLogic.liquidityState.currentStep === 'approving-a' ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : liquidityLogic.liquidityState.currentStep === 'approving-b' || liquidityLogic.liquidityState.currentStep === 'adding' ? (
                      <div className="w-4 h-4 rounded-full bg-current" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-current" />
                    )}
                    <span className="text-sm font-medium">
                      Approve {liquidityLogic.tokenAInfo?.symbol || 'Token A'}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-[var(--silver-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
              
              {/* Token B Approval */}
              {liquidityLogic.approvalB.needsApproval && (
                <>
                  <div className={`flex items-center space-x-2 ${
                    liquidityLogic.liquidityState.currentStep === 'approving-b' ? 'text-[var(--neon-orange)]' :
                    liquidityLogic.liquidityState.currentStep === 'adding' ? 'text-[var(--neon-orange)]' :
                    'text-[var(--silver-dark)]'
                  }`}>
                    {liquidityLogic.liquidityState.currentStep === 'approving-b' ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : liquidityLogic.liquidityState.currentStep === 'adding' ? (
                      <div className="w-4 h-4 rounded-full bg-current" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-current" />
                    )}
                    <span className="text-sm font-medium">
                      Approve {liquidityLogic.tokenBInfo?.symbol || 'Token B'}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-[var(--silver-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
              
              {/* Add/Remove Liquidity Step */}
              <div className={`flex items-center space-x-2 ${
                liquidityLogic.liquidityState.currentStep === 'adding' || liquidityLogic.liquidityState.currentStep === 'removing' ? 'text-[var(--neon-blue)]' :
                'text-[var(--silver-dark)]'
              }`}>
                {liquidityLogic.liquidityState.currentStep === 'adding' || liquidityLogic.liquidityState.currentStep === 'removing' ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-current" />
                )}
                <span className="text-sm font-medium">
                  {mode === 'add' ? 'Add Liquidity' : 'Remove Liquidity'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {liquidityLogic.liquidityState.isProcessing && (
          <div className="mt-3 text-center">
            <div className="text-sm text-[var(--metallic-silver)]">
              {liquidityLogic.liquidityState.currentStep === 'approving-a' && 
                'Please approve Token A spending in your wallet...'
              }
              {liquidityLogic.liquidityState.currentStep === 'approving-b' && 
                'Please approve Token B spending in your wallet...'
              }
              {liquidityLogic.liquidityState.currentStep === 'adding' && 
                'Adding liquidity to the pool...'
              }
              {liquidityLogic.liquidityState.currentStep === 'removing' && 
                'Removing liquidity from the pool...'
              }
            </div>
          </div>
        )}
      </div>

      {/* Token Selector Modal */}
      <TokenSelector
        tokens={COMMON_TOKENS}
        selectedToken={showTokenSelector === 'tokenA' ? liquidityLogic.liquidityState.tokenA : liquidityLogic.liquidityState.tokenB}
        onSelectToken={(token) => {
          if (showTokenSelector === 'tokenA') {
            liquidityLogic.updateLiquidityState({ tokenA: token.address });
          } else {
            liquidityLogic.updateLiquidityState({ tokenB: token.address });
          }
          setShowTokenSelector(null);
        }}
        isOpen={showTokenSelector !== null}
        onClose={() => setShowTokenSelector(null)}
        contractAddress={AMM_ADDRESS}
      />

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Liquidity Settings"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--silver-light)] mb-2 block">
              Slippage Tolerance
            </label>
            <div className="flex space-x-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => liquidityLogic.updateLiquidityState({ slippage: value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    liquidityLogic.liquidityState.slippage === value
                      ? 'bg-[var(--neon-blue)] text-[var(--deep-black)]'
                      : 'bg-[var(--charcoal)] text-[var(--silver-light)] hover:bg-[var(--silver-dark)] hover:bg-opacity-20'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={liquidityLogic.liquidityState.slippage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 50) {
                    liquidityLogic.updateLiquidityState({ slippage: value });
                  }
                }}
                className="px-3 py-2 bg-[var(--charcoal)] border border-[var(--silver-dark)] border-opacity-30 rounded-lg text-[var(--silver-light)] text-sm w-20"
                placeholder="Custom"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--silver-light)] mb-2 block">
              Transaction Deadline
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="180"
                value={liquidityLogic.liquidityState.deadline}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1 && value <= 180) {
                    liquidityLogic.updateLiquidityState({ deadline: value });
                  }
                }}
                className="px-3 py-2 bg-[var(--charcoal)] border border-[var(--silver-dark)] border-opacity-30 rounded-lg text-[var(--silver-light)] text-sm w-20"
              />
              <span className="text-sm text-[var(--metallic-silver)]">minutes</span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Transaction Status Modal */}
      <MultiTransactionModal
        isOpen={liquidityLogic.liquidityState.isProcessing}
        onClose={() => {
          if (
            liquidityLogic.liquidityState.transactionSuccess ||
            liquidityLogic.liquidityState.approvalASuccess ||
            liquidityLogic.liquidityState.approvalBSuccess ||
            liquidityLogic.liquidityState.error
          ) {
            liquidityLogic.updateLiquidityState({ 
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
          liquidityLogic.liquidityState.currentStep === 'approving-a' ? 'approval' :
          liquidityLogic.liquidityState.currentStep === 'approving-b' ? 'approval' :
          liquidityLogic.liquidityState.currentStep === 'adding' ? 'contribute' :
          liquidityLogic.liquidityState.currentStep === 'removing' ? 'withdraw' :
          liquidityLogic.liquidityState.transactionSuccess ? 
            (liquidityLogic.liquidityState.mode === 'add' ? 'contribute' : 'withdraw') :
          null
        }
        approvalHash={
          liquidityLogic.liquidityState.currentStep === 'approving-a' 
            ? liquidityLogic.liquidityState.approvalAHash 
            : liquidityLogic.liquidityState.currentStep === 'approving-b'
            ? liquidityLogic.liquidityState.approvalBHash
            : undefined
        }
        mainHash={
          liquidityLogic.liquidityState.txHash
        }
        isApprovalPending={false}
        isApprovalConfirming={
          (liquidityLogic.liquidityState.currentStep === 'approving-a' && 
           !liquidityLogic.liquidityState.approvalAHash) ||
          (liquidityLogic.liquidityState.currentStep === 'approving-b' && 
           !liquidityLogic.liquidityState.approvalBHash)
        }
        isApprovalSuccess={
          liquidityLogic.liquidityState.approvalASuccess || 
          liquidityLogic.liquidityState.approvalBSuccess
        }
        isMainPending={false}
        isMainConfirming={
          (liquidityLogic.liquidityState.currentStep === 'adding' || 
           liquidityLogic.liquidityState.currentStep === 'removing') && 
           !liquidityLogic.liquidityState.txHash
        }
        isMainSuccess={
          liquidityLogic.liquidityState.transactionSuccess
        }
        isError={!!liquidityLogic.liquidityState.error}
        error={liquidityLogic.liquidityState.error ? new Error(liquidityLogic.liquidityState.error) : null}
      />
    </div>
  );
};