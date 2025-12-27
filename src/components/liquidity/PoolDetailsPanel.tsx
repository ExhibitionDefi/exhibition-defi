import React, { useMemo } from 'react';
import type { Address } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { TrendingUp, Droplet, Percent, BarChart3, DollarSign, Clock, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { SafeHtml, SafeImage } from '../SafeHtml';
import { exhibitionAmmAbi, exhibitionFactoryAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { logger } from '@/utils/logger';
import { usePoolEarnings } from '@/hooks/amm/usePoolEarnings';
import { useFeeConfig } from '@/hooks/amm/useFeeConfig';
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing';
import { resolveTokenLogo } from '@/utils/tokenLogoResolver';

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

  const hasValidTokens = useMemo(() => {
    return tokenA && tokenB && tokenA !== tokenB;
  }, [tokenA, tokenB]);

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

  const tokensInfo = poolData?.[0]?.result as
    | readonly [readonly string[], readonly bigint[], readonly bigint[]]
    | undefined;
  const poolExists = poolData?.[1]?.result as boolean | undefined;
  const reserves = poolData?.[2]?.result as [bigint, bigint] | undefined;
  const userLPBalance = poolData?.[3]?.result as bigint | undefined;
  const onChainLogoURIA = poolData?.[4]?.result as string | undefined;
  const onChainLogoURIB = poolData?.[5]?.result as string | undefined;

  const logoURIA = useMemo(() => {
    if (!tokenA) return '';
    return resolveTokenLogo(tokenA, onChainLogoURIA);
  }, [tokenA, onChainLogoURIA]);

  const logoURIB = useMemo(() => {
    if (!tokenB) return '';
    return resolveTokenLogo(tokenB, onChainLogoURIB);
  }, [tokenB, onChainLogoURIB]);

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

  const hasPosition = useMemo(() => {
    return Boolean(userLPBalance && userLPBalance > BigInt(0));
  }, [userLPBalance]);

  const { earnings, isLoading: isLoadingEarnings } = usePoolEarnings({
    tokenA: tokenA || undefined,
    tokenB: tokenB || undefined,
    tokenADecimals: tokenInfo?.decimalsA,
    tokenBDecimals: tokenInfo?.decimalsB,
    enabled: hasPosition && !!tokenInfo,
  });

  const { feeConfig } = useFeeConfig();

  const { calculateTVL, getTokenPriceUSD, isReady: isPricingReady } = useLocalPricing();

  const poolStats = useMemo(() => {
    if (!reserves || !tokenInfo) {
      return {
        reserveA: '0',
        reserveB: '0',
        totalLiquidity: '0',
        totalLiquidityUSD: 'N/A',
        priceRatio: '0',
        priceA: 'N/A',
        priceB: 'N/A',
      };
    }

    const [reserveA, reserveB] = reserves;

    const formattedReserveA = formatUnits(reserveA, tokenInfo.decimalsA);
    const formattedReserveB = formatUnits(reserveB, tokenInfo.decimalsB);

    const priceRatio =
      parseFloat(formattedReserveA) > 0
        ? (parseFloat(formattedReserveB) / parseFloat(formattedReserveA)).toFixed(6)
        : '0';

    const totalLiquidity = (
      parseFloat(formattedReserveA) + parseFloat(formattedReserveB)
    ).toFixed(2);

    let totalLiquidityUSD = 'N/A';
    let priceA = 'N/A';
    let priceB = 'N/A';

    if (isPricingReady && tokenA && tokenB) {
      priceA = getTokenPriceUSD(tokenA);
      priceB = getTokenPriceUSD(tokenB);

      const tvlUSD = calculateTVL(
        tokenA,
        reserveA,
        tokenB,
        reserveB,
        tokenInfo.decimalsA,
        tokenInfo.decimalsB
      );

      if (tvlUSD > 0) {
        totalLiquidityUSD = `${tvlUSD.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
    }

    return {
      reserveA: parseFloat(formattedReserveA).toFixed(6),
      reserveB: parseFloat(formattedReserveB).toFixed(6),
      totalLiquidity,
      totalLiquidityUSD,
      priceRatio,
      priceA,
      priceB,
    };
  }, [reserves, tokenInfo, isPricingReady, tokenA, tokenB, calculateTVL, getTokenPriceUSD]);

  const userShare = useMemo(() => {
    if (!userLPBalance || !reserves || userLPBalance === BigInt(0)) {
      return null;
    }

    const lpBalance = formatUnits(userLPBalance, 18);

    return {
      lpBalance: parseFloat(lpBalance).toFixed(6),
    };
  }, [userLPBalance, reserves]);

  if (!poolData && hasValidTokens) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

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
                  className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
                  fallback={
                    <div className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center">
                      ?
                    </div>
                  }
                  onError={() => logger.warn('Failed to load logo A')}
                />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-[var(--silver-dark)]">
                  {tokenInfo?.symbolA[0] || '?'}
                </div>
              )}
              {logoURIB ? (
                <SafeImage
                  src={logoURIB}
                  alt={tokenInfo?.symbolB || ''}
                  className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
                  fallback={
                    <div className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center">
                      ?
                    </div>
                  }
                  onError={() => logger.warn('Failed to load logo B')}
                />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-[var(--silver-dark)]">
                  {tokenInfo?.symbolB[0] || '?'}
                </div>
              )}
            </div>
            <h3 className="text-base font-semibold text-[var(--silver-light)] mb-2">
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

  return (
    <Card className={`p-4 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center -space-x-2">
              {logoURIA ? (
                <SafeImage
                  src={logoURIA}
                  alt={tokenInfo?.symbolA || ''}
                  className="w-8 h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
                  fallback={
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs">
                      ?
                    </div>
                  }
                  onError={() => logger.warn('Failed to load logo A')}
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs text-[var(--silver-dark)]">
                  {tokenInfo?.symbolA[0] || '?'}
                </div>
              )}
              {logoURIB ? (
                <SafeImage
                  src={logoURIB}
                  alt={tokenInfo?.symbolB || ''}
                  className="w-8 h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)]"
                  fallback={
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs">
                      ?
                    </div>
                  }
                  onError={() => logger.warn('Failed to load logo B')}
                />
              ) : (
                <div className="w-8 h-8 rounded-full border-2 border-[var(--deep-black)] bg-[var(--charcoal)] flex items-center justify-center text-xs text-[var(--silver-dark)]">
                  {tokenInfo?.symbolB[0] || '?'}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--silver-light)]">
                <SafeHtml
                  content={`${tokenInfo?.symbolA || 'Token A'}/${
                    tokenInfo?.symbolB || 'Token B'
                  }`}
                />
              </h3>
              <Badge
                variant="default"
                size="sm"
                className="bg-[var(--neon-blue)] bg-opacity-20 text-[var(--neon-blue)] border-[var(--neon-blue)] border-opacity-40 mt-0.5"
              >
                {feeConfig?.formatted.tradingFee || '0.30%'} Fee
              </Badge>
            </div>
          </div>

          {earnings && (
            <div className="text-right">
              <div className="text-xs text-[var(--silver-dark)] mb-1">APY</div>
              <div className="text-lg font-bold text-[var(--neon-blue)]">
                {earnings.formatted.apy}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        {/* Total Liquidity */}
        <div className="bg-[var(--charcoal)] bg-opacity-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Droplet className="w-4 h-4 text-[var(--neon-blue)]" />
            <span className="text-sm text-[var(--metallic-silver)]">
              Total Liquidity
            </span>
          </div>
          <div className="text-lg font-bold text-[var(--silver-light)]">
            ${poolStats.totalLiquidityUSD}
          </div>
          {isPricingReady && (
            <div className="text-xs text-[var(--silver-dark)] mt-1">
              {poolStats.reserveA} {tokenInfo?.symbolA} + {poolStats.reserveB} {tokenInfo?.symbolB}
            </div>
          )}
        </div>

        {/* Reserves */}
        <div className="bg-[var(--charcoal)] bg-opacity-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-[var(--neon-blue)]" />
            <span className="text-sm text-[var(--metallic-silver)]">Reserves</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--silver-dark)]">
                {tokenInfo?.symbolA}:
              </span>
              <div className="text-right">
                <div className="text-sm font-medium text-[var(--silver-light)]">
                  {poolStats.reserveA}
                </div>
                {isPricingReady && poolStats.priceA !== 'N/A' && (
                  <div className="text-xs text-[var(--silver-dark)]">
                    {poolStats.priceA}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-[var(--silver-dark)]">
                {tokenInfo?.symbolB}:
              </span>
              <div className="text-right">
                <div className="text-sm font-medium text-[var(--silver-light)]">
                  {poolStats.reserveB}
                </div>
                {isPricingReady && poolStats.priceB !== 'N/A' && (
                  <div className="text-xs text-[var(--silver-dark)]">
                    {poolStats.priceB}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="bg-[var(--charcoal)] bg-opacity-50 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-[var(--neon-orange)]" />
            <span className="text-sm text-[var(--metallic-silver)]">Price</span>
          </div>
          <div className="text-base font-semibold text-[var(--silver-light)]">
            1 {tokenInfo?.symbolA} = {poolStats.priceRatio} {tokenInfo?.symbolB}
          </div>
        </div>

        {/* User Position with Earnings */}
        {userShare && (
          <div className="bg-gradient-to-br from-[var(--neon-blue)] from-opacity-10 to-[var(--charcoal)] rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Percent className="w-4 h-4 text-[var(--neon-blue)]" />
              <span className="text-sm font-medium text-[var(--silver-light)]">
                Your Position
              </span>
            </div>
            
            <div className="flex justify-between mb-2">
              <span className="text-sm text-[var(--metallic-silver)]">
                LP Tokens:
              </span>
              <span className="text-sm font-medium text-[var(--silver-light)]">
                {userShare.lpBalance}
              </span>
            </div>

            {isLoadingEarnings ? (
              <div className="flex items-center justify-center py-2">
                <div className="w-4 h-4 border-2 border-[var(--neon-blue)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : earnings ? (
              <>
                <div className="mb-2 pb-2 border-b border-[var(--charcoal)]">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-[var(--silver-dark)]">
                      Position Value
                    </span>
                    <span className="text-sm font-semibold text-[var(--silver-light)]">
                      ${earnings.formatted.currentValue}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-[var(--silver-dark)]">
                      Original Deposit
                    </span>
                    <span className="text-xs text-[var(--silver-dark)]">
                      ${earnings.formatted.originalDeposit}
                    </span>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-3 h-3 text-[var(--neon-blue)]" />
                    <span className="text-xs font-medium text-[var(--metallic-silver)]">
                      Unrealized Earnings
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[var(--charcoal)] bg-opacity-50 rounded p-2">
                      <div className="text-xs text-[var(--silver-dark)] mb-1">
                        {tokenInfo?.symbolA}
                      </div>
                      <div className="text-sm font-semibold text-[var(--neon-blue)]">
                        {earnings.formatted.unrealizedA}
                      </div>
                    </div>
                    <div className="bg-[var(--charcoal)] bg-opacity-50 rounded p-2">
                      <div className="text-xs text-[var(--silver-dark)] mb-1">
                        {tokenInfo?.symbolB}
                      </div>
                      <div className="text-sm font-semibold text-[var(--neon-blue)]">
                        {earnings.formatted.unrealizedB}
                      </div>
                    </div>
                  </div>
                </div>

                {(earnings.realizedEarningsA > 0n || earnings.realizedEarningsB > 0n) && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <DollarSign className="w-3 h-3 text-[var(--neon-blue)]" />
                      <span className="text-xs font-medium text-[var(--metallic-silver)]">
                        Total Earnings
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[var(--charcoal)] bg-opacity-50 rounded p-2">
                        <div className="text-xs text-[var(--silver-dark)] mb-1">
                          {tokenInfo?.symbolA}
                        </div>
                        <div className="text-sm font-semibold text-[var(--silver-light)]">
                          {earnings.formatted.totalA}
                        </div>
                      </div>
                      <div className="bg-[var(--charcoal)] bg-opacity-50 rounded p-2">
                        <div className="text-xs text-[var(--silver-dark)] mb-1">
                          {tokenInfo?.symbolB}
                        </div>
                        <div className="text-sm font-semibold text-[var(--silver-light)]">
                          {earnings.formatted.totalB}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[var(--silver-dark)] pt-2 border-t border-[var(--charcoal)]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{earnings.formatted.daysActive} days active</span>
                  </div>
                  <span className="text-[var(--neon-blue)]">
                    {earnings.formatted.apy}
                  </span>
                </div>
              </>
            ) : null}
          </div>
        )}

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