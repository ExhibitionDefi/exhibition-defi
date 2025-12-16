import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { exhibitionAmmAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing';

interface TVLStats {
  tvl: string;
  tvlRaw: number;
  totalPools: number;
  volume24h: string;
  isLoading: boolean;
  error: Error | null;
}

interface UseTVLStatsOptions {
  /**
   * Maximum number of pools to fetch for TVL calculation
   * @default 100
   */
  maxPools?: number;
  /**
   * Refetch interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refetchInterval?: number;
}

/**
 * Hook to fetch and calculate Total Value Locked (TVL) across all pools
 * 
 * @param options - Configuration options
 * @returns TVL statistics including formatted TVL, total pools, and volume
 * 
 * @example
 * ```tsx
 * const { tvl, totalPools, isLoading } = useTVLStats();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * 
 * return <div>TVL: ${tvl}</div>;
 * ```
 */
export function useTVLStats(options: UseTVLStatsOptions = {}): TVLStats {
  const { maxPools = 100, refetchInterval = 30_000 } = options;

  // Use local pricing hook
  const { calculateTVL, isReady: isPricingReady, isLoading: isPricingLoading } = useLocalPricing({
    refetchInterval,
  });

  // Fetch all pools using getAllPoolPairs (simpler than pagination)
  const { data: poolsData, isLoading: isLoadingPools, error: poolsError } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getAllPoolPairs',
        args: [],
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getPoolCount',
        args: [],
      },
    ],
    query: {
      refetchInterval,
      staleTime: refetchInterval / 2,
    },
  });

  const allPoolPairsResult = poolsData?.[0]?.result as Address[] | undefined;
  const poolCountResult = poolsData?.[1]?.result as bigint | undefined;

  // Extract pool pairs and total count from getAllPoolPairs result
  // Apply maxPools limit here
  const { poolPairs, totalPools } = useMemo(() => {
    if (!allPoolPairsResult || allPoolPairsResult.length === 0) {
      return { poolPairs: [], totalPools: 0 };
    }

    // getAllPoolPairs returns flattened array: [tokenA0, tokenB0, tokenA1, tokenB1, ...]
    const pairs: Array<{ tokenA: Address; tokenB: Address }> = [];
    
    for (let i = 0; i < allPoolPairsResult.length; i += 2) {
      if (i + 1 < allPoolPairsResult.length) {
        pairs.push({
          tokenA: allPoolPairsResult[i],
          tokenB: allPoolPairsResult[i + 1],
        });
      }
    }

    // Apply maxPools limit to the pairs we process
    const limitedPairs = pairs.slice(0, maxPools);

    return {
      poolPairs: limitedPairs,
      totalPools: poolCountResult ? Number(poolCountResult) : pairs.length,
    };
  }, [allPoolPairsResult, poolCountResult, maxPools]);

  // Extract all unique tokens
  const allTokens = useMemo(() => {
    const tokens = new Set<Address>();
    
    poolPairs.forEach(({ tokenA, tokenB }) => {
      tokens.add(tokenA);
      tokens.add(tokenB);
    });
    
    return Array.from(tokens);
  }, [poolPairs]);

  // Always create contracts array, even if empty
  const tokensInfoContracts = useMemo(() => [{
    address: CONTRACT_ADDRESSES.AMM,
    abi: exhibitionAmmAbi,
    functionName: 'getTokensInfo' as const,
    args: allTokens.length > 0 ? [allTokens] : undefined,
  }], [allTokens]);

  // Fetch token info (decimals needed for proper formatting)
  const { data: tokensInfoData, isLoading: isLoadingTokens } = useReadContracts({
    contracts: tokensInfoContracts,
    query: {
      enabled: allTokens.length > 0,
      refetchInterval: refetchInterval * 2, // Tokens info changes less frequently
      staleTime: refetchInterval,
    },
  });

  const tokensInfo = tokensInfoData?.[0]?.result as
    | readonly [readonly string[], readonly bigint[], readonly bigint[]]
    | undefined;

  // Fetch reserves for all pools
  const reservesContracts = useMemo(() => 
    poolPairs.map(({ tokenA, tokenB }) => ({
      address: CONTRACT_ADDRESSES.AMM,
      abi: exhibitionAmmAbi,
      functionName: 'getReserves' as const,
      args: [tokenA, tokenB] as const,
    })),
    [poolPairs]
  );

  const { data: reservesData, isLoading: isLoadingReserves, error: reservesError } = useReadContracts({
    contracts: reservesContracts,
    query: {
      enabled: poolPairs.length > 0,
      refetchInterval,
      staleTime: refetchInterval / 2,
    },
  });

  // Calculate TVL and format stats using local pricing
  const stats = useMemo(() => {
    let tvlRaw = 0;
    
    if (tokensInfo && reservesData && poolPairs.length > 0 && isPricingReady) {
      const [, decimals] = tokensInfo;
      const tokenDecimalsMap: Record<Address, number> = {};
      
      // Build decimals map
      allTokens.forEach((token, index) => {
        if (decimals[index]) {
          tokenDecimalsMap[token] = Number(decimals[index]);
        }
      });

      // Calculate TVL for each pool using local pricing
      poolPairs.forEach((pair, index) => {
        const reserveResult = reservesData[index];
        const reserves = reserveResult?.result as [bigint, bigint] | undefined;
        
        if (reserves) {
          const decimalsA = tokenDecimalsMap[pair.tokenA];
          const decimalsB = tokenDecimalsMap[pair.tokenB];
          
          if (decimalsA && decimalsB) {
            try {
              // Use calculateTVL from pricing hook to get real USD value
              const poolTVL = calculateTVL(
                pair.tokenA,
                reserves[0],
                pair.tokenB,
                reserves[1],
                decimalsA,
                decimalsB
              );
              
              tvlRaw += poolTVL;
            } catch (error) {
              // Skip pools with pricing errors
              console.warn(`Failed to calculate TVL for pool ${index}:`, error);
            }
          }
        }
      });
    }

    // Format TVL with K, M, B abbreviations
    const formatTVL = (value: number): string => {
      if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
      return value.toFixed(2);
    };

    return {
      tvl: formatTVL(tvlRaw),
      tvlRaw,
      volume24h: '0', // Placeholder - requires volume tracking implementation
    };
  }, [tokensInfo, reservesData, poolPairs, allTokens, isPricingReady, calculateTVL]);

  // Aggregate loading states
  const isLoading = isLoadingPools || isLoadingTokens || isLoadingReserves || isPricingLoading;
  
  // Aggregate errors
  const error = poolsError || reservesError || null;

  return {
    ...stats,
    totalPools,
    isLoading,
    error: error as Error | null,
  };
}