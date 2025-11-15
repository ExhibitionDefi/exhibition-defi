import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { exhibitionAmmAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { LiquidityInterface } from '@/components/liquidity/LiquidityInterface';
import { PoolList } from '@/components/liquidity/PoolList';
import { Button } from '@/components/ui/Button';
import type { Pool } from '@/components/liquidity/PoolList';
import type { Address } from 'viem';
import { logger } from '@/utils/logger';

export const LiquidityPage: React.FC = () => {
  const { address } = useAccount();
  const [showMyPositions, setShowMyPositions] = useState(false);
  const [initialPositions, setInitialPositions] = useState<Pool[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Pool | null>(null);

  // Fetch user portfolio when address is available
  const { data: portfolioData, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getUserPortfolio',
        args: address ? [address, BigInt(0), BigInt(50)] : undefined,
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: 30_000,
      staleTime: 15_000,
    },
  });

  // Extract portfolio result
  const portfolioResult = portfolioData?.[0]?.result as
    | [Address[], Address[], bigint[], bigint[]]
    | undefined;

  // Gather all unique tokens from portfolio
  const allTokens = useMemo(() => {
    if (!portfolioResult) return [];

    const tokens = new Set<Address>();
    const [tokenAs, tokenBs] = portfolioResult;

    tokenAs?.forEach((token: Address) => tokens.add(token));
    tokenBs?.forEach((token: Address) => tokens.add(token));

    return Array.from(tokens);
  }, [portfolioResult]);

  // Fetch token info for all tokens in portfolio
  const { data: tokensInfoData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getTokensInfo',
        args: allTokens.length > 0 ? [allTokens] : undefined,
      },
    ],
    query: {
      enabled: allTokens.length > 0,
      refetchInterval: 120_000,
      staleTime: 60_000,
    },
  });

  const tokensInfo = tokensInfoData?.[0]?.result as
    | readonly [readonly string[], readonly bigint[], readonly bigint[]]
    | undefined;

  // Transform portfolio data into Pool array with correct symbols
  useEffect(() => {
    if (!portfolioResult || !address || !tokensInfo) {
      logger.info('Missing data:', { portfolioResult: !!portfolioResult, address: !!address, tokensInfo: !!tokensInfo });
      setInitialPositions([]);
      setSelectedPosition(null);
      return;
    }

    logger.info('Portfolio data:', portfolioResult);
    logger.info('Tokens info:', tokensInfo);

    const [tokenAs, tokenBs, lpBalances, sharePercentages] = portfolioResult;
    const [symbols] = tokensInfo;

    // Create token symbol map
    const tokenSymbolMap: Record<Address, string> = {};
    allTokens.forEach((token, index) => {
      if (symbols[index]) {
        tokenSymbolMap[token] = symbols[index];
      }
    });

    logger.info('Token symbol map:', tokenSymbolMap);

    const positions: Pool[] = tokenAs.map((tokenA, index) => {
      const tokenB = tokenBs[index] || ('0x0' as Address);
      const lpBalance = lpBalances[index] || BigInt(0);
      const sharePercentage = sharePercentages[index] || BigInt(0);

      const symbolA = tokenSymbolMap[tokenA] || 'Unknown';
      const symbolB = tokenSymbolMap[tokenB] || 'Unknown';

      return {
        tokenA,
        tokenB,
        symbolA,
        symbolB,
        reserveA: BigInt(0),
        reserveB: BigInt(0),
        totalLPSupply: BigInt(0),
        userLPBalance: lpBalance,
        userShare: Number(sharePercentage) / 100,
      };
    });

    logger.info('Transformed positions:', positions);
    setInitialPositions(positions);
    if (positions.length > 0 && !selectedPosition) {
      setSelectedPosition(positions[0]);
    }
  }, [portfolioResult, address, tokensInfo, allTokens, selectedPosition]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-[var(--silver-light)] bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] bg-clip-text text-transparent">Liquidity Pools</h1>
          <p className="text-[var(--metallic-silver)]">
            Provide liquidity to earn trading fees
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Liquidity Interface */}
          <div>
            {isLoading && <div className="text-[var(--silver-light)]">Loading positions...</div>}
            {error && <div className="text-[var(--neon-orange)]">Error: {error.message}</div>}
            <LiquidityInterface
              initialPositions={initialPositions}
              selectedPosition={selectedPosition}
              onSelectPosition={setSelectedPosition}
            />
          </div>

          {/* Pool List */}
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[var(--silver-light)]">
                {showMyPositions ? 'Your Positions' : 'All Pools'}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMyPositions(!showMyPositions)}
              >
                {showMyPositions ? 'Show All Pools' : 'Show My Positions'}
              </Button>
            </div>

            <PoolList
              showUserPositionsOnly={showMyPositions}
              onSelectPool={(tokenA, tokenB) => {
                const position = initialPositions.find(
                  (p) => p.tokenA === tokenA && p.tokenB === tokenB
                );
                if (position) {
                  setSelectedPosition(position);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};