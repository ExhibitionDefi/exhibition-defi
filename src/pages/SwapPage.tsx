import React from 'react';
import { SwapInterface } from '@/components/swap/SwapInterface';

export const SwapPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-[var(--deep-black)]">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-[var(--silver-light)] bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] bg-clip-text text-transparent">
            Token Swap
          </h1>
          <p className="text-[var(--metallic-silver)] text-lg">
            Swap tokens instantly with minimal slippage and smart routing
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="h-1 w-8 bg-gradient-to-r from-[var(--neon-blue)] to-transparent rounded-full"></div>
            <div className="h-1 w-4 bg-[var(--neon-orange)] rounded-full opacity-60"></div>
            <div className="h-1 w-8 bg-gradient-to-l from-[var(--neon-orange)] to-transparent rounded-full"></div>
          </div>
        </div>
        <SwapInterface />
      </div>
    </div>
  );
};