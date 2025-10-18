import React, { useState, useMemo } from 'react';
import type { Address } from 'viem';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { TokenSelector } from '@/components/swap/TokenSelector';
import { MultiTransactionModal } from '@/components/common/MultiTransactionModal';
import { useAddLiquidity } from '@/hooks/amm/useAddLiquidity';
import { AMMFormatters } from '@/utils/ammFormatters';
import { AMM_ADDRESS, CONTRACT_ADDRESSES } from '@/config/contracts';

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
    decimals: 18,
  },
  {
    address: CONTRACT_ADDRESSES.EXUSDT,
    symbol: 'exUSDT',
    name: 'Exhibition USDT',
    logoURI: '/tokens/exusdt.png',
    decimals: 6,
  },
  {
    address: CONTRACT_ADDRESSES.EXNEX,
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

  const handleAddCustomToken = (token: Token) => {
    setCustomTokens((prev) => {
      const exists = prev.some((t) => t.address.toLowerCase() === token.address.toLowerCase());
      if (exists) return prev;
      return [...prev, { ...token, isCustom: true }];
    });
  };

  const handleMaxBalance = (token: 'A' | 'B') => {
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
  };

  return (
    <>
      <div className="space-y-1">
        {/* Token A */}
        <div className="bg-[var(--charcoal)] rounded-xl p-4 border border-[var(--silver-dark)] border-opacity-30 hover:border-opacity-50 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--metallic-silver)]">Token A</span>
            {addLiquidity.balanceA?.value !== undefined && addLiquidity.tokenAInfo && (
              <div className="text-sm text-[var(--silver-dark)] flex items-center space-x-2">
                <span>
                  Balance:{' '}
                  <span className="text-[var(--silver-light)]">
                    {AMMFormatters.formatTokenAmountSync(
                      addLiquidity.balanceA.value,
                      addLiquidity.tokenAInfo.decimals,
                      6
                    )}{' '}
                    {addLiquidity.tokenAInfo.symbol}
                  </span>
                </span>
                {addLiquidity.balanceA.value > 0 && (
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
                {addLiquidity.tokenAInfo ? (
                  <>
                    <span className="font-semibold text-[var(--silver-light)] group-hover:text-[var(--neon-blue)] transition-colors duration-300">
                      {addLiquidity.tokenAInfo.symbol}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-blue)] transition-colors duration-300" />
                  </>
                ) : (
                  <>
                    <span className="text-[var(--silver-dark)] group-hover:text-[var(--neon-blue)] transition-colors duration-300">
                      Select
                    </span>
                    <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-blue)] transition-colors duration-300" />
                  </>
                )}
              </div>
            </button>
            <input
              type="text"
              placeholder="0.0"
              value={addLiquidity.state.amountA}
              onChange={(e) => {
                if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                  addLiquidity.updateState({ amountA: e.target.value });
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
              addLiquidity.updateState({
                tokenA: addLiquidity.state.tokenB,
                tokenB: addLiquidity.state.tokenA,
                amountA: addLiquidity.state.amountB,
                amountB: addLiquidity.state.amountA,
              });
            }}
            disabled={!addLiquidity.state.tokenA || !addLiquidity.state.tokenB}
            className="bg-[var(--deep-black)] border-2 border-[var(--silver-dark)] border-opacity-50 rounded-full p-3 hover:border-[var(--neon-blue)] hover:border-opacity-80 disabled:opacity-50 transition-all duration-300 group"
          >
            <ArrowLeftRight className="w-5 h-5 text-[var(--silver-light)] group-hover:text-[var(--neon-blue)] transition-colors duration-300" />
          </button>
        </div>

        {/* Token B */}
        <div className="bg-[var(--charcoal)] rounded-xl p-4 border border-[var(--silver-dark)] border-opacity-30 hover:border-opacity-50 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--metallic-silver)]">Token B</span>
            {addLiquidity.balanceB?.value !== undefined && addLiquidity.tokenBInfo && (
              <div className="text-sm text-[var(--silver-dark)] flex items-center space-x-2">
                <span>
                  Balance:{' '}
                  <span className="text-[var(--silver-light)]">
                    {AMMFormatters.formatTokenAmountSync(
                      addLiquidity.balanceB.value,
                      addLiquidity.tokenBInfo.decimals,
                      6
                    )}{' '}
                    {addLiquidity.tokenBInfo.symbol}
                  </span>
                </span>
                {addLiquidity.balanceB.value > 0 && (
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
                {addLiquidity.tokenBInfo ? (
                  <>
                    <span className="font-semibold text-[var(--silver-light)] group-hover:text-[var(--neon-orange)] transition-colors duration-300">
                      {addLiquidity.tokenBInfo.symbol}
                    </span>
                    <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-orange)] transition-colors duration-300" />
                  </>
                ) : (
                  <>
                    <span className="text-[var(--silver-dark)] group-hover:text-[var(--neon-orange)] transition-colors duration-300">
                      Select
                    </span>
                    <ChevronDown className="w-4 h-4 text-[var(--silver-dark)] group-hover:text-[var(--neon-orange)] transition-colors duration-300" />
                  </>
                )}
              </div>
            </button>
            <input
              type="text"
              placeholder="0.0"
              value={addLiquidity.state.amountB}
              onChange={(e) => {
                if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                  addLiquidity.updateState({ amountB: e.target.value });
                }
              }}
              className="flex-1 bg-transparent text-lg font-bold text-[var(--silver-light)] placeholder:text-[var(--silver-dark)] border-0 outline-none text-right"
            />
          </div>
        </div>
      </div>

      {/* Pool Information */}
      {addLiquidity.poolExists !== undefined && (
        <div className="mt-4 space-y-2 text-sm text-[var(--silver-dark)]">
          <div className="flex justify-between">
            <span>Pool Status:</span>
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
          className={`w-full py-4 text-lg font-semibold rounded-xl transition-all duration-300 relative ${
            addLiquidity.buttonState.disabled
              ? 'bg-[var(--silver-dark)] text-[var(--charcoal)] cursor-not-allowed'
              : 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] text-[var(--deep-black)] hover:from-[var(--neon-orange)] hover:to-[var(--neon-blue)] shadow-[0_0_20px_var(--neon-blue)]'
          }`}
        >
          {addLiquidity.buttonState.loading && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
            </div>
          )}
          <span className={addLiquidity.buttonState.loading ? 'ml-6' : ''}>{addLiquidity.buttonState.text}</span>
        </button>
      </div>

      {/* Step Progress Indicator */}
      {addLiquidity.state.isProcessing && (
        <div className="mt-4 p-3 rounded-lg bg-[var(--charcoal)] border border-[var(--silver-dark)] border-opacity-30">
          <div className="flex items-center justify-center space-x-4">
            {addLiquidity.approvalA.needsApproval && (
              <>
                <div
                  className={`flex items-center space-x-2 ${
                    addLiquidity.state.currentStep === 'approving-a'
                      ? 'text-[var(--neon-blue)]'
                      : addLiquidity.state.currentStep === 'approving-b' || addLiquidity.state.currentStep === 'adding'
                      ? 'text-[var(--neon-blue)]'
                      : 'text-[var(--silver-dark)]'
                  }`}
                >
                  {addLiquidity.state.currentStep === 'approving-a' ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : addLiquidity.state.currentStep === 'approving-b' || addLiquidity.state.currentStep === 'adding' ? (
                    <div className="w-4 h-4 rounded-full bg-current" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-current" />
                  )}
                  <span className="text-sm font-medium">Approve {addLiquidity.tokenAInfo?.symbol || 'Token A'}</span>
                </div>
                <svg className="w-4 h-4 text-[var(--silver-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}

            {addLiquidity.approvalB.needsApproval && (
              <>
                <div
                  className={`flex items-center space-x-2 ${
                    addLiquidity.state.currentStep === 'approving-b'
                      ? 'text-[var(--neon-orange)]'
                      : addLiquidity.state.currentStep === 'adding'
                      ? 'text-[var(--neon-orange)]'
                      : 'text-[var(--silver-dark)]'
                  }`}
                >
                  {addLiquidity.state.currentStep === 'approving-b' ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : addLiquidity.state.currentStep === 'adding' ? (
                    <div className="w-4 h-4 rounded-full bg-current" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-current" />
                  )}
                  <span className="text-sm font-medium">Approve {addLiquidity.tokenBInfo?.symbol || 'Token B'}</span>
                </div>
                <svg className="w-4 h-4 text-[var(--silver-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}

            <div
              className={`flex items-center space-x-2 ${
                addLiquidity.state.currentStep === 'adding' ? 'text-[var(--neon-blue)]' : 'text-[var(--silver-dark)]'
              }`}
            >
              {addLiquidity.state.currentStep === 'adding' ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current" />
              )}
              <span className="text-sm font-medium">Add Liquidity</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {addLiquidity.state.isProcessing && (
        <div className="mt-3 text-center">
          <div className="text-sm text-[var(--metallic-silver)]">
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
            ? 'contribute'
            : addLiquidity.state.transactionSuccess
            ? 'contribute'
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