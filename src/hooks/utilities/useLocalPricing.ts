// src/hooks/utilities/useLocalPricing.ts
import { useMemo } from 'react';
import { useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import type { Address } from 'viem';
import { exhibitionAmmAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES, EXUSD_ADDRESS } from '@/config/contracts';

interface UseLocalPricingReturn {
  /**
   * Get token price in exUSD terms
   * @param tokenAddress - Token to price
   * @returns Price in exUSD, or null if no path found
   */
  getTokenPrice: (tokenAddress: Address) => number | null;
  
  /**
   * Get formatted token price as USD string
   * @param tokenAddress - Token to price
   * @returns Formatted price like "$1,234.56" or "N/A"
   */
  getTokenPriceUSD: (tokenAddress: Address) => string;
  
  /**
   * Calculate TVL in USD terms
   * @param tokenA - First token address
   * @param amountA - Amount of first token (as bigint with decimals)
   * @param tokenB - Second token address
   * @param amountB - Amount of second token (as bigint with decimals)
   * @param decimalsA - Decimals for token A
   * @param decimalsB - Decimals for token B
   * @returns Total value in exUSD
   */
  calculateTVL: (
    tokenA: Address,
    amountA: bigint,
    tokenB: Address,
    amountB: bigint,
    decimalsA: number,
    decimalsB: number
  ) => number;
  
  /**
   * The base token address (exUSD)
   */
  exUSDAddress: Address;
  
  /**
   * Whether pricing data is ready
   */
  isReady: boolean;
  
  /**
   * Whether pricing data is currently loading
   */
  isLoading: boolean;
}

interface UseLocalPricingOptions {
  /**
   * Maximum number of hops to find price path
   * @default 4
   */
  maxHops?: number;
  
  /**
   * Refetch interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refetchInterval?: number;
}

/**
 * Hook for local token pricing using pool reserves and multi-hop price discovery
 * 
 * This is a testnet utility that calculates token prices relative to exUSD
 * by finding paths through liquidity pools. NOT an oracle, just local math.
 * 
 * @param options - Configuration options
 * @returns Pricing utilities and state
 * 
 * @example
 * ```tsx
 * const { getTokenPrice, calculateTVL, isReady } = useLocalPricing();
 * 
 * if (!isReady) return <LoadingSpinner />;
 * 
 * const ethPrice = getTokenPrice(ETH_ADDRESS); // 2000.50
 * const tvl = calculateTVL(tokenA, amountA, tokenB, amountB, 18, 18);
 * ```
 */
export function useLocalPricing(
  options: UseLocalPricingOptions = {}
): UseLocalPricingReturn {
  const { maxHops = 4, refetchInterval = 30_000 } = options;
  const exUSDAddress = EXUSD_ADDRESS as Address;

  // Step 1: Fetch all pool pairs
  const { data: poolsData, isLoading: isLoadingPools } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getAllPoolPairs',
        args: [],
      },
    ],
    query: {
      refetchInterval,
      staleTime: refetchInterval / 2,
    },
  });

  const allPoolPairsResult = poolsData?.[0]?.result as Address[] | undefined;

  // Step 2: Extract pool pairs from flattened array
  const poolPairs = useMemo(() => {
    if (!allPoolPairsResult || allPoolPairsResult.length === 0) {
      return [];
    }

    // getAllPoolPairs returns: [tokenA0, tokenB0, tokenA1, tokenB1, ...]
    const pairs: Array<{ tokenA: Address; tokenB: Address }> = [];
    
    for (let i = 0; i < allPoolPairsResult.length; i += 2) {
      if (i + 1 < allPoolPairsResult.length) {
        pairs.push({
          tokenA: allPoolPairsResult[i],
          tokenB: allPoolPairsResult[i + 1],
        });
      }
    }

    return pairs;
  }, [allPoolPairsResult]);

  // Step 3: Build adjacency graph for pathfinding
  const poolGraph = useMemo(() => {
    const graph = new Map<Address, Set<Address>>();

    poolPairs.forEach(({ tokenA, tokenB }) => {
      // Add bidirectional edges
      if (!graph.has(tokenA)) {
        graph.set(tokenA, new Set());
      }
      if (!graph.has(tokenB)) {
        graph.set(tokenB, new Set());
      }

      graph.get(tokenA)!.add(tokenB);
      graph.get(tokenB)!.add(tokenA);
    });

    return graph;
  }, [poolPairs]);

  // Step 4: BFS pathfinding to find shortest path to exUSD
  const findPathToExUSD = useMemo(() => {
    return (tokenAddress: Address): Address[] | null => {
      // If token is exUSD itself, return single element path
      if (tokenAddress.toLowerCase() === exUSDAddress.toLowerCase()) {
        return [exUSDAddress];
      }

      // If no graph built yet
      if (poolGraph.size === 0) {
        return null;
      }

      // BFS to find shortest path
      const queue: Array<{ token: Address; path: Address[] }> = [
        { token: tokenAddress, path: [tokenAddress] }
      ];
      const visited = new Set<string>([tokenAddress.toLowerCase()]);

      while (queue.length > 0) {
        const { token, path } = queue.shift()!;

        // Check if we've exceeded max hops
        if (path.length > maxHops) {
          continue;
        }

        // Get neighbors
        const neighbors = poolGraph.get(token);
        if (!neighbors) continue;

        for (const neighbor of neighbors) {
          const neighborLower = neighbor.toLowerCase();

          // Found exUSD!
          if (neighborLower === exUSDAddress.toLowerCase()) {
            return [...path, neighbor];
          }

          // Skip if already visited
          if (visited.has(neighborLower)) {
            continue;
          }

          // Mark as visited and add to queue
          visited.add(neighborLower);
          queue.push({
            token: neighbor,
            path: [...path, neighbor],
          });
        }
      }

      // No path found
      return null;
    };
  }, [poolGraph, exUSDAddress, maxHops]);

  // Step 5: Fetch all token decimals for the tokens in our pools
  const allTokens = useMemo(() => {
    const tokens = new Set<Address>();
    poolPairs.forEach(({ tokenA, tokenB }) => {
      tokens.add(tokenA);
      tokens.add(tokenB);
    });
    return Array.from(tokens);
  }, [poolPairs]);

  const { data: tokensInfoData, isLoading: isLoadingTokens } = useReadContracts({
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
      refetchInterval: refetchInterval * 2,
      staleTime: refetchInterval,
    },
  });

  const tokensInfo = tokensInfoData?.[0]?.result as
    | readonly [readonly string[], readonly bigint[], readonly bigint[]]
    | undefined;

  // Build decimals map
  const decimalsMap = useMemo(() => {
    if (!tokensInfo) return new Map<string, number>();

    const [, decimals] = tokensInfo;
    const map = new Map<string, number>();

    allTokens.forEach((token, index) => {
      if (decimals[index]) {
        map.set(token.toLowerCase(), Number(decimals[index]));
      }
    });

    return map;
  }, [tokensInfo, allTokens]);

  // Helper: Normalize token pair to canonical order (lower address first)
  const normalizeTokenPair = (tokenA: Address, tokenB: Address) => {
    const aLower = tokenA.toLowerCase();
    const bLower = tokenB.toLowerCase();
    return aLower < bLower 
      ? { token0: tokenA, token1: tokenB, isReversed: false }
      : { token0: tokenB, token1: tokenA, isReversed: true };
  };

  // Step 6: Pre-fetch all pool prices (for caching)
  const priceContracts = useMemo(() => {
    return poolPairs.map(({ tokenA, tokenB }) => {
      const { token0, token1 } = normalizeTokenPair(tokenA, tokenB);
      return {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getPrice' as const,
        args: [token0, token1] as const,
      };
    });
  }, [poolPairs]);

  const { data: pricesData, isLoading: isLoadingPrices } = useReadContracts({
    contracts: priceContracts,
    query: {
      enabled: poolPairs.length > 0,
      refetchInterval,
      staleTime: refetchInterval / 2,
    },
  });

  // Build price cache: "tokenA-tokenB" -> price
  const priceCache = useMemo(() => {
    if (!pricesData) return new Map<string, bigint>();

    const cache = new Map<string, bigint>();

    poolPairs.forEach((pair, index) => {
      const priceResult = pricesData[index];
      const rawPrice = priceResult?.result as bigint | undefined;

      if (rawPrice) {
        const keyAB = `${pair.tokenA.toLowerCase()}-${pair.tokenB.toLowerCase()}`;
        const keyBA = `${pair.tokenB.toLowerCase()}-${pair.tokenA.toLowerCase()}`;
        
        cache.set(keyAB, rawPrice);
        // Store reverse price as well (will calculate inverse when needed)
        cache.set(keyBA, rawPrice);
      }
    });

    return cache;
  }, [pricesData, poolPairs]);

  // Helper: Get price between two adjacent tokens in path
  const getPriceForHop = (tokenA: Address, tokenB: Address): number | null => {
    const { token0, token1, isReversed } = normalizeTokenPair(tokenA, tokenB);
    const key = `${token0.toLowerCase()}-${token1.toLowerCase()}`;
  
    const rawPrice = priceCache.get(key);
    if (!rawPrice) return null;

    // Get decimals for proper scaling
    const token0Decimals = decimalsMap.get(token0.toLowerCase()) || 18;
    const token1Decimals = decimalsMap.get(token1.toLowerCase()) || 18;

    // The contract's getPrice(token0, token1) returns: (reserve1_wei * 10^18) / reserve0_wei
    // Where reserve0_wei = reserve0 * 10^token0Decimals
    // and reserve1_wei = reserve1 * 10^token1Decimals
    //
    // So: rawPrice = (reserve1 * 10^token1Decimals * 10^18) / (reserve0 * 10^token0Decimals)
    //              = (reserve1 / reserve0) * 10^(token1Decimals - token0Decimals + 18)
    //
    // To get the true price (1 token0 = X token1):
    // price = reserve1 / reserve0
    //       = rawPrice / 10^(token1Decimals - token0Decimals + 18)
    //       = rawPrice * 10^(token0Decimals - token1Decimals - 18)
  
    const exponent = token0Decimals - token1Decimals - 18;
    let price = parseFloat(formatUnits(rawPrice, -exponent));

    // Now 'price' represents: 1 token0 = price token1
    // If we're asking for tokenA -> tokenB but tokenA is token1, we need to invert
    if (isReversed) {
      // We calculated token0 -> token1, but we need token1 -> token0
      price = 1 / price;
    }

    return price;
  };

  // Calculate price along a path
  const calculatePriceAlongPath = (path: Address[]): number | null => {
    if (path.length < 2) return null;

    let finalPrice = 1;

    for (let i = 0; i < path.length - 1; i++) {
      const hopPrice = getPriceForHop(path[i], path[i + 1]);

      if (hopPrice === null) {
        return null;
      }

      finalPrice *= hopPrice;
    }

    return finalPrice;
  };

  const isReady = !isLoadingPools && !isLoadingTokens && !isLoadingPrices && poolPairs.length > 0;

  // Get token price implementation
  const getTokenPrice = (tokenAddress: Address): number | null => {
    if (!isReady) return null;

    // If token is exUSD, price is 1
    if (tokenAddress.toLowerCase() === exUSDAddress.toLowerCase()) {
      return 1;
    }

    // Find path to exUSD
    const path = findPathToExUSD(tokenAddress);
    
    if (!path || path.length < 2) {
      return null;
    }

    // Calculate price along the path
    const price = calculatePriceAlongPath(path);
    
    return price;
  };

  const getTokenPriceUSD = (tokenAddress: Address): string => {
    const price = getTokenPrice(tokenAddress);
    if (price === null) return 'N/A';
  
    // For very small prices, show more decimal places
    if (price < 0.01) {
      return `$${price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })}`;
    }
  
    return `$${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const calculateTVL = (
    tokenA: Address,
    amountA: bigint,
    tokenB: Address,
    amountB: bigint,
    decimalsA: number,
    decimalsB: number
  ): number => {
    if (!isReady) return 0;

    try {
      // Get prices for both tokens
      const priceA = getTokenPrice(tokenA);
      const priceB = getTokenPrice(tokenB);

      // Format amounts
      const formattedAmountA = parseFloat(formatUnits(amountA, decimalsA));
      const formattedAmountB = parseFloat(formatUnits(amountB, decimalsB));

      let totalValue = 0;
      const valueA = priceA !== null ? formattedAmountA * priceA : 0;
      const valueB = priceB !== null ? formattedAmountB * priceB : 0;

      totalValue = valueA + valueB;

      return totalValue;
    } catch (error) {
      return 0;
    }
  };

  return {
    getTokenPrice,
    getTokenPriceUSD,
    calculateTVL,
    exUSDAddress,
    isReady,
    isLoading: isLoadingPools,
  };
}