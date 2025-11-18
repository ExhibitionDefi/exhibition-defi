import React, { useMemo } from 'react';
import type { Address } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { TrendingUp, Droplet, Percent, BarChart3 } from 'lucide-react';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { SafeHtml, SafeImage } from '../SafeHtml';

import { exhibitionAmmAbi, exhibitionFactoryAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { logger } from '@/utils/logger';

interface PoolDetailsPanelProps {
  tokenA?: Address | null;
  tokenB?: Address | null;
  className?: string;
}

export const PoolDetailsPanel: React.FC<PoolDetailsPanelProps> = ({
  tokenA,
  tokenB,
  className = '',
}) => {
  const { address } = useAccount();

  // Check if we have valid tokens
  const hasValidTokens = useMemo(() => {
    return tokenA && tokenB && tokenA !== tokenB;
  }, [tokenA, tokenB]);

  // Fetch pool data - following your pattern
  const { data: poolData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getTokensInfo',
        args: hasValidTokens ? [[tokenA!, tokenB!]] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'doesPoolExist',
        args: hasValidTokens ? [tokenA!, tokenB!] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getReserves',
        args: hasValidTokens ? [tokenA!, tokenB!] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getLPBalance',
        args: hasValidTokens && address ? [tokenA!, tokenB!, address] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.FACTORY,
        abi: exhibitionFactoryAbi,
        functionName: 'getTokenLogoURI',
        args: tokenA ? [tokenA] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.FACTORY,
        abi: exhibitionFactoryAbi,
        functionName: 'getTokenLogoURI',
        args: tokenB ? [tokenB] : undefined,
      },
    ],
    query: {
      enabled: !!hasValidTokens,
      refetchInterval: 30_000,
      staleTime: 15_000,
    },
  });

  // Extract results - following your pattern
  const tokensInfo = poolData?.[0]?.result as
    | readonly [readonly string[], readonly bigint[], readonly bigint[]]
    | undefined;
  const poolExists = poolData?.[1]?.result as boolean | undefined;
  const reserves = poolData?.[2]?.result as [bigint, bigint] | undefined;
  const userLPBalance = poolData?.[3]?.result as bigint | undefined;
  const logoURIA = poolData?.[4]?.result as string | undefined;
  const logoURIB = poolData?.[5]?.result as string | undefined;

  // Parse token info
  const tokenInfo = useMemo(() => {
    if (!tokensInfo) return null;

    const [symbols, decimals] = tokensInfo;

    return {
      symbolA: symbols[0] || 'Unknown',
      symbolB: symbols[1] || 'Unknown',
      decimalsA: Number(decimals[0] || 18),
      decimalsB: Number(decimals[1] || 18),
    };
  }, [tokensInfo]);

  // Calculate pool stats
  const poolStats = useMemo(() => {
    if (!reserves || !tokenInfo) {
      return {
        reserveA: '0',
        reserveB: '0',
        totalLiquidity: '0',
        priceRatio: '0',
      };
    }

    const [reserveA, reserveB] = reserves;

    const formattedReserveA = formatUnits(reserveA, tokenInfo.decimalsA);
    const formattedReserveB = formatUnits(reserveB, tokenInfo.decimalsB);

    const priceRatio =
      reserveA > BigInt(0)
        ? (Number(reserveB) / Number(reserveA)).toFixed(6)
        : '0';

    const totalLiquidity = (
      parseFloat(formattedReserveA) + parseFloat(formattedReserveB)
    ).toFixed(2);

    return {
      reserveA: parseFloat(formattedReserveA).toFixed(6),
      reserveB: parseFloat(formattedReserveB).toFixed(6),
      totalLiquidity,
      priceRatio,
    };
  }, [reserves, tokenInfo]);

  // User position - calculate share percentage
  const userShare = useMemo(() => {
    if (!userLPBalance || !reserves || userLPBalance === BigInt(0)) {
      return null;
    }

    const lpBalance = formatUnits(userLPBalance, 18);

    // You'd need totalLPSupply to calculate accurate share
    // For now, just show the LP balance
    return {
      lpBalance: parseFloat(lpBalance).toFixed(6),
    };
  }, [userLPBalance, reserves]);

  // Loading state - check if data exists
  if (!poolData && hasValidTokens) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  // No tokens selected
  if (!hasValidTokens) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <Droplet className="w-12 h-12 mx-auto mb-4 text-[var(--silver-dark)] opacity-50" />
          <p className="text-[var(--silver-dark)]">
            Select tokens to view pool details
          </p>
        </div>
      </Card>
    );
  }

  // Pool doesn't exist
  if (!poolExists) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-12">
          <div className="mb-6">
            <div className="flex items-center justify-center -space-x-2 mb-4">
              {logoURIA ? (
                <SafeImage
                  src={logoURIA}
                  alt={tokenInfo?.symbolA || ''}
                  className="w-12 h-12 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
                  fallback={
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center">
                      ?
                    </div>
                  }
                  onError={() => logger.warn('Failed to load logo A')}
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-[var(--silver-dark)]">
                  {tokenInfo?.symbolA[0] || '?'}
                </div>
              )}
              {logoURIB ? (
                <SafeImage
                  src={logoURIB}
                  alt={tokenInfo?.symbolB || ''}
                  className="w-12 h-12 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
                  fallback={
                    <div className="w-12 h-12 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center">
                      ?
                    </div>
                  }
                  onError={() => logger.warn('Failed to load logo B')}
                />
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-[var(--silver-dark)]">
                  {tokenInfo?.symbolB[0] || '?'}
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-2">
              <SafeHtml
                content={`${tokenInfo?.symbolA || 'Token A'}/${
                  tokenInfo?.symbolB || 'Token B'
                }`}
              />
            </h3>
          </div>
          <Badge
            variant="default"
            className="bg-[var(--neon-orange)] bg-opacity-20 text-[var(--neon-orange)] border-[var(--neon-orange)] border-opacity-40"
          >
            Pool Not Found
          </Badge>
          <p className="text-sm text-[var(--silver-dark)] mt-4">
            This pool doesn't exist yet. You'll be the first to add liquidity!
          </p>
        </div>
      </Card>
    );
  }

  // Pool exists - show details
  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center -space-x-2">
            {logoURIA ? (
              <SafeImage
                src={logoURIA}
                alt={tokenInfo?.symbolA || ''}
                className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
                fallback={
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs">
                    ?
                  </div>
                }
                onError={() => logger.warn('Failed to load logo A')}
              />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs text-[var(--silver-dark)]">
                {tokenInfo?.symbolA[0] || '?'}
              </div>
            )}
            {logoURIB ? (
              <SafeImage
                src={logoURIB}
                alt={tokenInfo?.symbolB || ''}
                className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
                fallback={
                  <div className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs">
                    ?
                  </div>
                }
                onError={() => logger.warn('Failed to load logo B')}
              />
            ) : (
              <div className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs text-[var(--silver-dark)]">
                {tokenInfo?.symbolB[0] || '?'}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--silver-light)]">
              <SafeHtml
                content={`${tokenInfo?.symbolA || 'Token A'}/${
                  tokenInfo?.symbolB || 'Token B'
                }`}
              />
            </h3>
            <Badge
              variant="default"
              size="sm"
              className="bg-[var(--neon-blue)] bg-opacity-20 text-[var(--neon-blue)] border-[var(--neon-blue)] border-opacity-40 mt-1"
            >
              0.3% Fee
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        {/* Total Liquidity */}
        <div className="bg-[var(--charcoal)] bg-opacity-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Droplet className="w-4 h-4 text-[var(--neon-blue)]" />
            <span className="text-sm text-[var(--metallic-silver)]">
              Total Liquidity
            </span>
          </div>
          <div className="text-2xl font-bold text-[var(--silver-light)]">
            ${poolStats.totalLiquidity}
          </div>
        </div>

        {/* Reserves */}
        <div className="bg-[var(--charcoal)] bg-opacity-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-4 h-4 text-[var(--neon-blue)]" />
            <span className="text-sm text-[var(--metallic-silver)]">Reserves</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--silver-dark)]">
                {tokenInfo?.symbolA}:
              </span>
              <span className="text-sm font-medium text-[var(--silver-light)]">
                {poolStats.reserveA}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--silver-dark)]">
                {tokenInfo?.symbolB}:
              </span>
              <span className="text-sm font-medium text-[var(--silver-light)]">
                {poolStats.reserveB}
              </span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="bg-[var(--charcoal)] bg-opacity-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[var(--neon-orange)]" />
            <span className="text-sm text-[var(--metallic-silver)]">Price</span>
          </div>
          <div className="text-lg font-semibold text-[var(--silver-light)]">
            1 {tokenInfo?.symbolA} = {poolStats.priceRatio} {tokenInfo?.symbolB}
          </div>
        </div>

        {/* User Position */}
        {userShare && (
          <div className="bg-gradient-to-br from-[var(--neon-blue)] from-opacity-10 to-[var(--charcoal)] rounded-lg p-4 border border-[var(--neon-blue)] border-opacity-30">
            <div className="flex items-center space-x-2 mb-3">
              <Percent className="w-4 h-4 text-[var(--neon-blue)]" />
              <span className="text-sm font-medium text-[var(--silver-light)]">
                Your Position
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--metallic-silver)]">
                LP Tokens:
              </span>
              <span className="text-sm font-medium text-[var(--silver-light)]">
                {userShare.lpBalance}
              </span>
            </div>
          </div>
        )}

        {/* No Position */}
        {!userShare && address && (
          <div className="bg-[var(--charcoal)] bg-opacity-30 rounded-lg p-4 text-center">
            <p className="text-sm text-[var(--silver-dark)]">
              You don't have a position in this pool yet
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};