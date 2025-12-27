// src/pages/SwapPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SwapInterface } from '@/components/swap/SwapInterface';
import { PoolDetailsPanel } from '@/components/liquidity/PoolDetailsPanel';
import type { Address } from 'viem';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const SwapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  const tokenAParam = searchParams.get('tokenA') as Address | null;
  const tokenBParam = searchParams.get('tokenB') as Address | null;

  const [selectedTokenIn, setSelectedTokenIn] = useState<Address | null>(tokenAParam);
  const [selectedTokenOut, setSelectedTokenOut] = useState<Address | null>(tokenBParam);
  
  const [showPoolDetails, setShowPoolDetails] = useState(false);

  useEffect(() => {
    if (tokenAParam) setSelectedTokenIn(tokenAParam);
    if (tokenBParam) setSelectedTokenOut(tokenBParam);
  }, [tokenAParam, tokenBParam]);

  return (
    <div className="container mx-auto px-4 py-6 min-h-screen bg-[var(--deep-black)]">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-3 text-[var(--silver-light)] bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] bg-clip-text text-transparent">
          Token Swap
        </h1>
        <p className="text-[var(--metallic-silver)] text-base">
          Swap tokens instantly with minimal slippage and smart routing
        </p>
        <div className="mt-3 flex items-center justify-center space-x-2">
          <div className="h-1 w-8 bg-gradient-to-r from-[var(--neon-blue)] to-transparent rounded-full"></div>
          <div className="h-1 w-4 bg-[var(--neon-orange)] rounded-full opacity-60"></div>
          <div className="h-1 w-8 bg-gradient-to-l from-[var(--neon-orange)] to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Desktop Layout: Side by Side */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4 lg:max-w-7xl lg:mx-auto">
        {/* Swap Interface */}
        <div>
          <SwapInterface 
            defaultTokenIn={tokenAParam || undefined}
            defaultTokenOut={tokenBParam || undefined}
            onTokenInChange={setSelectedTokenIn}
            onTokenOutChange={setSelectedTokenOut}
          />
        </div>

        {/* Pool Details Panel */}
        <div className="sticky top-6 self-start">
          <PoolDetailsPanel 
            tokenA={selectedTokenIn}
            tokenB={selectedTokenOut}
          />
        </div>
      </div>

      {/* Mobile/Tablet Layout: Stacked */}
      <div className="lg:hidden max-w-2xl mx-auto">
        {/* Swap Interface */}
        <SwapInterface 
          defaultTokenIn={tokenAParam || undefined}
          defaultTokenOut={tokenBParam || undefined}
          onTokenInChange={setSelectedTokenIn}
          onTokenOutChange={setSelectedTokenOut}
        />

        {/* Pool Details Toggle Button */}
        {(selectedTokenIn || selectedTokenOut) && (
          <button
            onClick={() => setShowPoolDetails(!showPoolDetails)}
            className="w-full mt-3 px-4 py-2.5 bg-[var(--charcoal)] hover:bg-opacity-80 rounded-lg border border-[var(--metallic-silver)] border-opacity-20 transition-colors flex items-center justify-between text-[var(--silver-light)]"
          >
            <span className="font-medium">Pool Details</span>
            {showPoolDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Pool Details Panel (Collapsible on Mobile) */}
        {showPoolDetails && (
          <div className="mt-3 animate-in slide-in-from-top duration-300">
            <PoolDetailsPanel 
              tokenA={selectedTokenIn}
              tokenB={selectedTokenOut}
            />
          </div>
        )}
      </div>
    </div>
  );
};