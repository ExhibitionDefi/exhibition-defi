import React, { useState, useMemo } from 'react';
import type { Address } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';
import { Search, ExternalLink, Plus } from 'lucide-react';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';

import { exhibitionAmmAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '../../config/contracts';
import { AMMFormatters } from '../../utils/ammFormatters';
import { SafeHtml, SafeImage } from '../SafeHtml';

// 🆕 Import Factory ABI (you'll need to add this)
import { exhibitionFactoryAbi } from '@/generated/wagmi';

export interface Pool {
  tokenA: Address;
  tokenB: Address;
  symbolA: string;
  symbolB: string;
  reserveA: bigint;
  reserveB: bigint;
  totalLPSupply: bigint;
  userLPBalance?: bigint;
  userShare?: number;
  // 🆕 Add logo URIs
  logoURIA?: string;
  logoURIB?: string;
}

interface PoolListProps {
  className?: string;
  showUserPositionsOnly?: boolean;
  onSelectPool?: (tokenA: Address, tokenB: Address) => void;
}

export const PoolList: React.FC<PoolListProps> = ({
  className = '',
  showUserPositionsOnly = false,
  onSelectPool,
}) => {
  const { address } = useAccount();

  // Component state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // Fetch pools data or user portfolio based on mode
  const { data: poolsData, isLoading: isLoadingPools } = useReadContracts({
    contracts: [
      // getPoolsPaginated
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getPoolsPaginated',
        args: [BigInt(currentPage * pageSize), BigInt(pageSize)],
      },
      // getUserPortfolio
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

  // Fetch token info for all tokens
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
      refetchInterval: 120_000,
      staleTime: 60_000,
    },
  });

  const tokensInfo = tokensInfoData?.[0]?.result as
    | readonly [readonly string[], readonly bigint[], readonly bigint[]]
    | undefined;

  // 🆕 Fetch logo URIs from Factory
  const { data: logoData, isLoading: isLoadingLogos } = useReadContracts({
    contracts: allTokens.map((tokenAddress) => ({
      address: CONTRACT_ADDRESSES.FACTORY,
      abi: exhibitionFactoryAbi,
      functionName: 'getTokenLogoURI',
      args: [tokenAddress],
    })),
    query: {
      enabled: allTokens.length > 0,
      refetchInterval: 300_000, // 5 minutes - logos don't change often
      staleTime: 240_000, // 4 minutes
    },
  });

  // Create pools array with token information and logos
  const pools: Pool[] = useMemo(() => {
    if (!tokensInfo) return [];

    const [symbols] = tokensInfo;
    const tokenSymbolMap: Record<Address, string> = {};
    const tokenLogoMap: Record<Address, string> = {}; // 🆕

    allTokens.forEach((token, index) => {
      if (symbols[index]) {
        tokenSymbolMap[token] = symbols[index];
      }
      // 🆕 Map logos
      if (logoData?.[index]?.result) {
        tokenLogoMap[token] = logoData[index].result as string;
      }
    });

    if (showUserPositionsOnly && userPortfolioResult) {
      const [tokenAs, tokenBs, lpBalances, sharePercentages] = userPortfolioResult;

      if (!tokenAs || !Array.isArray(tokenAs)) {
        return [];
      }

      return tokenAs.map((tokenA: Address, index: number) => {
        const tokenB = tokenBs?.[index] || ('0x0' as Address);
        return {
          tokenA,
          tokenB,
          symbolA: tokenSymbolMap[tokenA] || 'Unknown',
          symbolB: tokenSymbolMap[tokenB] || 'Unknown',
          reserveA: BigInt(0),
          reserveB: BigInt(0),
          totalLPSupply: BigInt(0),
          userLPBalance: lpBalances?.[index] || BigInt(0),
          userShare: sharePercentages?.[index] ? Number(sharePercentages[index]) / 100 : 0,
          // 🆕 Add logos
          logoURIA: tokenLogoMap[tokenA] || '',
          logoURIB: tokenLogoMap[tokenB] || '',
        };
      });
    }

    if (poolsPaginatedResult && !showUserPositionsOnly) {
      const [tokenAs, tokenBs] = poolsPaginatedResult;

      if (!tokenAs || !Array.isArray(tokenAs)) {
        return [];
      }

      return tokenAs.map((tokenA: Address, index: number) => {
        const tokenB = tokenBs?.[index] || ('0x0' as Address);
        return {
          tokenA,
          tokenB,
          symbolA: tokenSymbolMap[tokenA] || 'Unknown',
          symbolB: tokenSymbolMap[tokenB] || 'Unknown',
          reserveA: BigInt(0),
          reserveB: BigInt(0),
          totalLPSupply: BigInt(0),
          // 🆕 Add logos
          logoURIA: tokenLogoMap[tokenA] || '',
          logoURIB: tokenLogoMap[tokenB] || '',
        };
      });
    }

    return [];
  }, [
    poolsPaginatedResult,
    userPortfolioResult,
    tokensInfo,
    logoData, // 🆕
    allTokens,
    showUserPositionsOnly,
  ]);

  // Filter pools
  const filteredPools = useMemo(() => {
    if (!searchQuery) return pools;

    return pools.filter(
      (pool) =>
        pool.symbolA.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pool.symbolB.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${pool.symbolA}/${pool.symbolB}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [pools, searchQuery]);

  const isLoading = isLoadingPools || isLoadingTokens || isLoadingLogos; // 🆕

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
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
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[var(--silver-light)]">
          {showUserPositionsOnly ? 'Your Liquidity Positions' : 'All Pools'}
        </h3>
        {Number(totalPools) > 0 && (
          <span className="text-sm text-[var(--silver-dark)]">
            {Number(totalPools)} pools total
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--silver-dark)]" />
        <Input
          placeholder="Search pools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[var(--charcoal)] border-[var(--silver-dark)] border-opacity-30 text-[var(--silver-light)] placeholder:text-[var(--silver-dark)]"
        />
      </div>

      {/* Pools List */}
      <div className="space-y-3">
        {filteredPools.length === 0 ? (
          <div className="text-center py-8 text-[var(--silver-dark)]">
            {searchQuery
              ? 'No pools found matching your search'
              : showUserPositionsOnly
              ? 'No liquidity positions found'
              : 'No pools found'}
          </div>
        ) : (
          filteredPools.map((pool, index) => (
            <PoolRow
              key={`${pool.tokenA}-${pool.tokenB}-${index}`}
              pool={pool}
              onSelect={onSelectPool}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!showUserPositionsOnly && hasMore && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="bg-[var(--charcoal)] border-[var(--silver-dark)] border-opacity-30 text-[var(--silver-light)] hover:bg-[var(--deep-black)] hover:border-[var(--neon-blue)]"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={!hasMore}
              className="bg-[var(--charcoal)] border-[var(--silver-dark)] border-opacity-30 text-[var(--silver-light)] hover:bg-[var(--deep-black)] hover:border-[var(--neon-blue)]"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

interface PoolRowProps {
  pool: Pool;
  onSelect?: (tokenA: Address, tokenB: Address) => void;
}

const PoolRow: React.FC<PoolRowProps> = ({ pool, onSelect }) => {
  return (
    <div className="flex items-center justify-between p-4 border border-[var(--silver-dark)] border-opacity-30 rounded-lg hover:bg-[var(--charcoal)] hover:border-opacity-50 transition-all duration-300">
      {/* Pool Info */}
      <div className="flex items-center space-x-4">
        {/* 🆕 Token Logo Display */}
        <div className="flex items-center -space-x-2">
          {pool.logoURIA && (
            <SafeImage
              src={pool.logoURIA}
              alt={pool.symbolA}
              className="w-8 h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
              fallback={
                <div className="w-8 h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs text-[var(--silver-dark)]">
                  ?
                </div>
              }
              onError={() => console.warn('Failed to load token A logo:', pool.logoURIA)}
            />
          )}
          {pool.logoURIB && (
            <SafeImage
              src={pool.logoURIB}
              alt={pool.symbolB}
              className="w-8 h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
              fallback={
                <div className="w-8 h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs text-[var(--silver-dark)]">
                  ?
                </div>
              }
              onError={() => console.warn('Failed to load token B logo:', pool.logoURIB)}
            />
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-lg font-medium text-[var(--silver-light)]">
            <SafeHtml content={`${pool.symbolA}/${pool.symbolB}`} />
          </div>
          <Badge
            variant="default"
            size="sm"
            className="bg-[var(--neon-blue)] bg-opacity-20 text-[var(--neon-blue)] border-[var(--neon-blue)] border-opacity-40"
          >
            0.3%
          </Badge>
        </div>

        {pool.userLPBalance !== undefined && pool.userLPBalance > BigInt(0) && (
          <Badge
            variant="success"
            size="sm"
            className="bg-[var(--neon-blue)] bg-opacity-20 text-[var(--neon-blue)] border-[var(--neon-blue)] border-opacity-40"
          >
            Your Position
          </Badge>
        )}
      </div>

      {/* Pool Stats */}
      <div className="flex items-center space-x-6">
        {pool.userLPBalance !== undefined && pool.userLPBalance > BigInt(0) && pool.userShare !== undefined && (
          <div className="text-right">
            <div className="text-sm font-medium text-[var(--silver-light)]">
              {AMMFormatters.formatTokenAmountSync(
                pool.userLPBalance,
                18,
                6
              )}
            </div>
            <div className="text-xs text-[var(--silver-dark)]">
              {pool.userShare.toFixed(2)}% share
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect?.(pool.tokenA, pool.tokenB)}
            className="text-[var(--metallic-silver)] hover:text-[var(--neon-blue)] hover:bg-[var(--deep-black)]"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const pairId = `${pool.tokenA.slice(0, 6)}-${pool.tokenB.slice(0, 6)}`;
              window.open(`/pool/${pairId}`, '_blank');
            }}
            className="text-[var(--metallic-silver)] hover:text-[var(--neon-orange)] hover:bg-[var(--deep-black)]"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};