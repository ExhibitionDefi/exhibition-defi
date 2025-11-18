import React, { useState, useMemo } from 'react';
import type { Address } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';
import { Search, Plus, Minus, ArrowLeftRight } from 'lucide-react';
import { formatUnits } from 'viem';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';

import { exhibitionAmmAbi, exhibitionFactoryAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SafeHtml, SafeImage } from '../SafeHtml';
import { logger } from '@/utils/logger';

export interface Pool {
  tokenA: Address;
  tokenB: Address;
  symbolA: string;
  symbolB: string;
  logoURIA?: string;
  logoURIB?: string;
  reserveA: bigint;
  reserveB: bigint;
  totalLPSupply: bigint;
  totalLiquidity: string;
  volume24h: string;
  feeTier: string;
  userLPBalance?: bigint;
  userShare?: number;
  decimalsA?: number;
  decimalsB?: number;
}

interface PoolListProps {
  className?: string;
  showUserPositionsOnly?: boolean;
  onNavigateToAdd?: (tokenA: Address, tokenB: Address) => void;
  onNavigateToRemove?: (tokenA: Address, tokenB: Address) => void;
  onNavigateToSwap?: (tokenA: Address, tokenB: Address) => void;
}

export const PoolList: React.FC<PoolListProps> = ({
  className = '',
  showUserPositionsOnly = false,
  onNavigateToAdd,
  onNavigateToRemove,
  onNavigateToSwap,
}) => {
  const { address } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // Fetch pools data
  const { data: poolsData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getPoolsPaginated',
        args: [BigInt(currentPage * pageSize), BigInt(pageSize)],
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getUserPortfolio',
        args: address ? [address, BigInt(0), BigInt(50)] : undefined,
      },
    ],
    query: {
      enabled: true,
      refetchInterval: 30_000,
      staleTime: 15_000,
    },
  });

  const poolsPaginatedResult = poolsData?.[0]?.result as
    | [Address[], Address[], bigint, boolean]
    | undefined;
  const userPortfolioResult = poolsData?.[1]?.result as
    | [Address[], Address[], bigint[], bigint[], bigint, boolean]
    | undefined;

  // Gather all tokens
  const allTokens = useMemo(() => {
    const tokens = new Set<Address>();

    if (poolsPaginatedResult && !showUserPositionsOnly) {
      const [tokenAs, tokenBs] = poolsPaginatedResult;
      tokenAs?.forEach((token: Address) => tokens.add(token));
      tokenBs?.forEach((token: Address) => tokens.add(token));
    }

    if (userPortfolioResult && showUserPositionsOnly) {
      const [tokenAs, tokenBs] = userPortfolioResult;
      tokenAs?.forEach((token: Address) => tokens.add(token));
      tokenBs?.forEach((token: Address) => tokens.add(token));
    }

    return Array.from(tokens);
  }, [poolsPaginatedResult, userPortfolioResult, showUserPositionsOnly]);

  // Fetch token info
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

  // Fetch logo URIs
  const { data: logoData } = useReadContracts({
    contracts: allTokens.map((tokenAddress) => ({
      address: CONTRACT_ADDRESSES.FACTORY,
      abi: exhibitionFactoryAbi,
      functionName: 'getTokenLogoURI',
      args: [tokenAddress],
    })),
    query: {
      enabled: allTokens.length > 0,
      refetchInterval: 300_000,
      staleTime: 240_000,
    },
  });

  // Fetch reserves for all pools
  const poolPairs = useMemo(() => {
    if (showUserPositionsOnly && userPortfolioResult) {
      const [tokenAs, tokenBs] = userPortfolioResult;
      return tokenAs?.map((tokenA, idx) => ({ tokenA, tokenB: tokenBs[idx] })) || [];
    }
    
    if (poolsPaginatedResult && !showUserPositionsOnly) {
      const [tokenAs, tokenBs] = poolsPaginatedResult;
      return tokenAs?.map((tokenA, idx) => ({ tokenA, tokenB: tokenBs[idx] })) || [];
    }
    
    return [];
  }, [poolsPaginatedResult, userPortfolioResult, showUserPositionsOnly]);

  const { data: reservesData } = useReadContracts({
    contracts: poolPairs.map(({ tokenA, tokenB }) => ({
      address: CONTRACT_ADDRESSES.AMM,
      abi: exhibitionAmmAbi,
      functionName: 'getReserves',
      args: [tokenA, tokenB],
    })),
    query: {
      enabled: poolPairs.length > 0,
      refetchInterval: 30_000,
      staleTime: 15_000,
    },
  });

  // Create pools array
  const pools: Pool[] = useMemo(() => {
    if (!tokensInfo) return [];

    const [symbols, decimals] = tokensInfo;
    const tokenSymbolMap: Record<Address, string> = {};
    const tokenDecimalsMap: Record<Address, number> = {};
    const tokenLogoMap: Record<Address, string> = {};

    allTokens.forEach((token, index) => {
      if (symbols[index]) tokenSymbolMap[token] = symbols[index];
      if (decimals[index]) tokenDecimalsMap[token] = Number(decimals[index]);
      if (logoData?.[index]?.result) {
        tokenLogoMap[token] = logoData[index].result as string;
      }
    });

    if (showUserPositionsOnly && userPortfolioResult) {
      const [tokenAs, tokenBs, lpBalances, sharePercentages] = userPortfolioResult;

      if (!tokenAs || !Array.isArray(tokenAs)) return [];

      return tokenAs.map((tokenA: Address, index: number) => {
        const tokenB = tokenBs?.[index] || ('0x0' as Address);
        const reserves = (reservesData as any)?.[index]?.result as [bigint, bigint] | undefined;

        return {
          tokenA,
          tokenB,
          symbolA: tokenSymbolMap[tokenA] || 'Unknown',
          symbolB: tokenSymbolMap[tokenB] || 'Unknown',
          decimalsA: tokenDecimalsMap[tokenA],
          decimalsB: tokenDecimalsMap[tokenB],
          logoURIA: tokenLogoMap[tokenA] || '',
          logoURIB: tokenLogoMap[tokenB] || '',
          reserveA: reserves?.[0] || BigInt(0),
          reserveB: reserves?.[1] || BigInt(0),
          totalLPSupply: BigInt(0),
          totalLiquidity: '0',
          volume24h: '0',
          feeTier: '0.3%',
          userLPBalance: lpBalances?.[index] || BigInt(0),
          userShare: sharePercentages?.[index] ? Number(sharePercentages[index]) / 100 : 0,
        };
      });
    }

    if (poolsPaginatedResult && !showUserPositionsOnly) {
      const [tokenAs, tokenBs] = poolsPaginatedResult;

      if (!tokenAs || !Array.isArray(tokenAs)) return [];

      return tokenAs.map((tokenA: Address, index: number) => {
        const tokenB = tokenBs?.[index] || ('0x0' as Address);
        const reserves = (reservesData as any)?.[index]?.result as [bigint, bigint] | undefined;

        return {
          tokenA,
          tokenB,
          symbolA: tokenSymbolMap[tokenA] || 'Unknown',
          symbolB: tokenSymbolMap[tokenB] || 'Unknown',
          decimalsA: tokenDecimalsMap[tokenA],
          decimalsB: tokenDecimalsMap[tokenB],
          logoURIA: tokenLogoMap[tokenA] || '',
          logoURIB: tokenLogoMap[tokenB] || '',
          reserveA: reserves?.[0] || BigInt(0),
          reserveB: reserves?.[1] || BigInt(0),
          totalLPSupply: BigInt(0),
          totalLiquidity: '0',
          volume24h: '0',
          feeTier: '0.3%',
        };
      });
    }

    return [];
  }, [
    poolsPaginatedResult,
    userPortfolioResult,
    tokensInfo,
    showUserPositionsOnly,
    allTokens.length,
    Boolean(logoData),
    Boolean(reservesData),
  ]);

  // Filter pools
  const filteredPools = useMemo(() => {
    if (!searchQuery) return pools;

    return pools.filter(
      (pool) =>
        pool.symbolA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.symbolB.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${pool.symbolA}/${pool.symbolB}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pools, searchQuery]);

  const isLoading = !poolsData;

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const totalPools = showUserPositionsOnly
    ? userPortfolioResult?.[4] || BigInt(0)
    : poolsPaginatedResult?.[2] || BigInt(0);

  const hasMore = showUserPositionsOnly
    ? userPortfolioResult?.[5] || false
    : poolsPaginatedResult?.[3] || false;

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="relative mb-4 sm:mb-6 w-[300px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[var(--silver-dark)]" />
        <Input
          placeholder="Search by token name or symbol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 sm:pl-10 bg-[var(--charcoal)] border-[var(--silver-dark)] border-opacity-30 text-[var(--silver-light)] placeholder:text-[var(--silver-dark)] h-10 sm:h-12 text-sm sm:text-base"
        />
      </div>

      {/* Pool List */}
      {filteredPools.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <div className="text-[var(--silver-dark)] mb-2">
            {searchQuery
              ? 'No pools found matching your search'
              : showUserPositionsOnly
              ? 'No liquidity positions found'
              : 'No pools available'}
          </div>
          {!showUserPositionsOnly && !searchQuery && (
            <Button
              onClick={() => onNavigateToAdd?.('' as Address, '' as Address)}
              variant="outline"
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Pool
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredPools.map((pool, index) => (
            <PoolRow
              key={`${pool.tokenA}-${pool.tokenB}-${index}`}
              pool={pool}
              showUserPosition={showUserPositionsOnly}
              onAdd={() => onNavigateToAdd?.(pool.tokenA, pool.tokenB)}
              onRemove={() => onNavigateToRemove?.(pool.tokenA, pool.tokenB)}
              onSwap={() => onNavigateToSwap?.(pool.tokenA, pool.tokenB)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!showUserPositionsOnly && filteredPools.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-6">
          <span className="text-xs sm:text-sm text-[var(--silver-dark)]">
            Showing {currentPage * pageSize + 1} -{' '}
            {Math.min((currentPage + 1) * pageSize, Number(totalPools))} of {Number(totalPools)}
          </span>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="border-[var(--silver-dark)] border-opacity-30 text-sm"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={!hasMore}
              className="border-[var(--silver-dark)] border-opacity-30 text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

interface PoolRowProps {
  pool: Pool;
  showUserPosition?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  onSwap?: () => void;
}

const PoolRow: React.FC<PoolRowProps> = ({ pool, showUserPosition = false, onAdd, onRemove, onSwap }) => {
  const formatLiquidity = (reserveA: bigint, reserveB: bigint, decimalsA?: number, decimalsB?: number) => {
    if (!decimalsA || !decimalsB) return '$0';
    
    try {
      const amountA = parseFloat(formatUnits(reserveA, decimalsA));
      const amountB = parseFloat(formatUnits(reserveB, decimalsB));
      const total = amountA + amountB;
      
      // Format with K, M, B abbreviations
      if (total >= 1_000_000_000) return `$${(total / 1_000_000_000).toFixed(2)}B`;
      if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(2)}M`;
      if (total >= 1_000) return `$${(total / 1_000).toFixed(2)}K`;
      return `$${total.toFixed(2)}`;
    } catch {
      return '$0';
    }
  };

  const formatNumber = (num: string) => {
    const value = parseFloat(num);
    if (isNaN(value)) return '$0';
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const truncateSymbol = (symbol: string, maxLength: number = 8) => {
    if (symbol.length <= maxLength) return symbol;
    return symbol.substring(0, maxLength) + '...';
  };

  // Calculate placeholder APR (you'd calculate this from actual fees)
  const calculateAPR = () => {
    // Placeholder calculation
    return '12.5%';
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Main Pool Info - Single Line on Desktop, Stacked on Mobile */}
      <Card fullWidth={true} className="p-4 sm:p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          {/* Pool Identity */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-shrink-0">
            {/* Token Logos */}
            <div className="flex items-center -space-x-2 flex-shrink-0">
              {pool.logoURIA ? (
                <SafeImage
                  src={pool.logoURIA}
                  alt={pool.symbolA}
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
                  fallback={
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs">
                      {pool.symbolA[0]}
                    </div>
                  }
                  onError={() => logger.warn('Failed to load logo A')}
                />
              ) : (
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs text-[var(--silver-dark)]">
                  {pool.symbolA[0]}
                </div>
              )}
              {pool.logoURIB ? (
                <SafeImage
                  src={pool.logoURIB}
                  alt={pool.symbolB}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
                  fallback={
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs">
                      {pool.symbolB[0]}
                    </div>
                  }
                  onError={() => logger.warn('Failed to load logo B')}
                />
              ) : (
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs text-[var(--silver-dark)]">
                  {pool.symbolB[0]}
                </div>
              )}
            </div>

            {/* Pool Name + Fee */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <span className="text-base sm:text-lg font-semibold text-[var(--silver-light)] truncate">
                <SafeHtml content={`${truncateSymbol(pool.symbolA)}/${truncateSymbol(pool.symbolB)}`} />
              </span>
              <Badge
                variant="default"
                size="sm"
                className="bg-[var(--neon-blue)] bg-opacity-20 text-[var(--neon-blue)] border-[var(--neon-blue)] border-opacity-40 text-xs flex-shrink-0"
              >
                {pool.feeTier}
              </Badge>
            </div>
          </div>

          {/* Divider - Hidden on Mobile */}
          <div className="hidden lg:block h-6 w-px bg-[var(--silver-dark)] opacity-30" />

          {/* Pool Stats - Grid on Mobile, Inline on Desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-3 sm:gap-5 lg:gap-8 xl:gap-32 flex-1 min-w-0 text-xs sm:text-base lg:text-lg">
            <div className="min-w-0">
              <div className="text-[var(--silver-dark)] mb-0.5 lg:mb-0 truncate">Liquidity</div>
              <div className="font-medium text-[var(--silver-light)] truncate">
                {formatLiquidity(pool.reserveA, pool.reserveB, pool.decimalsA, pool.decimalsB)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[var(--silver-dark)] mb-0.5 lg:mb-0 truncate">Volume</div>
              <div className="font-medium text-[var(--silver-light)] truncate">
                {formatNumber(pool.volume24h)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[var(--silver-dark)] mb-0.5 lg:mb-0 truncate">Fees (24h)</div>
              <div className="font-medium text-[var(--silver-light)] truncate">$0</div>
            </div>
            <div className="min-w-0">
              <div className="text-[var(--silver-dark)] mb-0.5 lg:mb-0 truncate">APR</div>
              <div className="font-medium text-[var(--neon-blue)] truncate">{calculateAPR()}</div>
            </div>
          </div>

          {/* Divider - Hidden on Mobile */}
          <div className="hidden lg:block h-6 w-px bg-[var(--silver-dark)] opacity-30" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onSwap}
              className="text-[var(--metallic-silver)] hover:text-[var(--neon-blue)] hover:bg-[var(--deep-black)] border-[var(--silver-dark)] border-opacity-30 text-xs sm:text-sm"
            >
              <ArrowLeftRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Swap</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="text-[var(--metallic-silver)] hover:text-[var(--neon-blue)] hover:bg-[var(--deep-black)] border-[var(--silver-dark)] border-opacity-30 text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>

        {/* User Position Card - Only shows when viewing "My Positions" */}
        {showUserPosition && (pool.userLPBalance ?? BigInt(0)) > BigInt(0) && (
          <div className="mt-3 sm:mt-4">
            <div className="bg-gradient-to-r from-[var(--neon-blue)] from-opacity-10 to-[var(--charcoal)] rounded-lg p-3 sm:p-4 border border-[var(--neon-blue)] border-opacity-30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Position Stats */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--silver-dark)]">Your Position:</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[var(--silver-dark)]">LP: </span>
                    <span className="font-medium text-[var(--silver-light)] truncate">
                      {pool.userLPBalance ? formatUnits(pool.userLPBalance, 18).slice(0, 8) : '0'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[var(--silver-dark)]">Share: </span>
                    <span className="font-medium text-[var(--neon-blue)] truncate">
                      {pool.userShare?.toFixed(4)}%
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[var(--silver-dark)]">Value: </span>
                    <span className="font-medium text-[var(--silver-light)] truncate">$0</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[var(--silver-dark)]">Fees Earned: </span>
                    <span className="font-medium text-[var(--neon-blue)] truncate">$0</span>
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRemove}
                  className="text-[var(--metallic-silver)] hover:text-[var(--neon-orange)] hover:bg-[var(--deep-black)] border-[var(--silver-dark)] border-opacity-30 text-xs sm:text-sm flex-shrink-0"
                >
                  <Minus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span>Remove</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};