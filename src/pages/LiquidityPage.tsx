import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PoolList } from '@/components/liquidity/PoolList';
import { useTVLStats } from '@/hooks/amm/useTVLStats';
import type { Address } from 'viem';

export const LiquidityPage: React.FC = () => {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [showMyPositions, setShowMyPositions] = useState(false);

  // ✨ Clean separation: Hook handles all business logic
  const { tvl, totalPools, volume24h, isLoading: isLoadingStats } = useTVLStats();

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="w-full mx-auto">
        {/* Header Section - Responsive Layout */}
        <div className="mb-6 sm:mb-8">
          {/* Top Row: Title + Stats Cards */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4 sm:mb-6">
            {/* Left: Title + Subtitle */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-[var(--silver-light)] bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] bg-clip-text text-transparent">
                Liquidity Pools
              </h1>
              <p className="text-sm sm:text-base text-[var(--metallic-silver)]">
                Add liquidity to earn trading fees from swaps
              </p>
            </div>

            {/* Right: Stats Cards */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:flex-shrink-0">
              {/* TVL Card */}
              <Card className="p-4 sm:p-5 bg-gradient-to-br from-[var(--deep-black)] to-[var(--charcoal)] border-[var(--silver-dark)] border-opacity-30 min-w-[140px] sm:min-w-[160px] lg:w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--metallic-silver)]">TVL</span>
                  <Droplet className="w-4 h-4 text-[var(--neon-blue)]" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[var(--silver-light)] truncate">
                  {isLoadingStats ? (
                    <div className="w-16 h-6 bg-[var(--charcoal)] animate-pulse rounded" />
                  ) : (
                    `$${tvl}`
                  )}
                </div>
                <div className="text-xs text-[var(--neon-blue)] mt-1">
                  {isLoadingStats ? (
                    <div className="w-12 h-3 bg-[var(--charcoal)] animate-pulse rounded" />
                  ) : (
                    `${totalPools} pools`
                  )}
                </div>
              </Card>

              {/* Volume Card */}
              <Card className="p-4 sm:p-5 bg-gradient-to-br from-[var(--deep-black)] to-[var(--charcoal)] border-[var(--silver-dark)] border-opacity-30 min-w-[140px] sm:min-w-[160px] lg:w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-[var(--metallic-silver)]">Volume (24h)</span>
                  <TrendingUp className="w-4 h-4 text-[var(--neon-orange)]" />
                </div>
                <div className="text-lg sm:text-xl font-bold text-[var(--silver-light)] truncate">
                  {isLoadingStats ? (
                    <div className="w-16 h-6 bg-[var(--charcoal)] animate-pulse rounded" />
                  ) : (
                    `$${volume24h}`
                  )}
                </div>
                <div className="text-xs text-[var(--neon-orange)] mt-1">
                  +0%
                </div>
              </Card>
            </div>
          </div>

          {/* Bottom Row: Title + Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Left: Pool View Title */}
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--silver-light)]">
                {showMyPositions ? 'Your Positions' : 'All Pools'}
              </h2>
            </div>

            {/* Right: Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {address && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMyPositions(!showMyPositions)}
                  className="border-[var(--silver-dark)] border-opacity-30 text-[var(--silver-light)] hover:bg-[var(--charcoal)] text-sm"
                >
                  {showMyPositions ? 'Show All Pools' : 'My Positions'}
                </Button>
              )}
              <Button
                onClick={() => navigate('/liquidity/manage')}
                className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)] hover:from-[var(--neon-blue)] hover:to-[var(--neon-orange)] text-white text-sm"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">New Position</span>
                <span className="xs:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Pool List */}
        <PoolList
          showUserPositionsOnly={showMyPositions}
          onNavigateToAdd={(tokenA: Address, tokenB: Address) => {
            navigate(`/liquidity/manage?tokenA=${tokenA}&tokenB=${tokenB}&mode=add`);
          }}
          onNavigateToRemove={(tokenA: Address, tokenB: Address) => {
            navigate(`/liquidity/manage?tokenA=${tokenA}&tokenB=${tokenB}&mode=remove`);
          }}
          onNavigateToSwap={(tokenA: Address, tokenB: Address) => {
            navigate(`/swap?tokenA=${tokenA}&tokenB=${tokenB}`);
          }}
        />
      </div>
    </div>
  );
};