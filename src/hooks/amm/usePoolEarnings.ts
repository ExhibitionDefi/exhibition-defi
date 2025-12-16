// src/hooks/amm/usePoolEarnings.ts
import { useMemo } from 'react';
import { type Address } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';
import { exhibitionAmmAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { AMMFormatters } from '@/utils/ammFormatters';

interface PoolEarningsData {
  // Unrealized earnings (current position)
  unrealizedEarningsA: bigint;
  unrealizedEarningsB: bigint;
  
  // Realized earnings (from withdrawals)
  realizedEarningsA: bigint;
  realizedEarningsB: bigint;
  
  // Total earnings
  totalEarningsA: bigint;
  totalEarningsB: bigint;
  
  // Position values
  currentValue: bigint;
  originalDeposit: bigint;
  
  // Performance metrics
  apy: bigint; // APY in basis points (10000 = 100%)
  daysActive: bigint;
  
  // Formatted strings for display
  formatted: {
    unrealizedA: string;
    unrealizedB: string;
    realizedA: string;
    realizedB: string;
    totalA: string;
    totalB: string;
    currentValue: string;
    originalDeposit: string;
    apy: string; // e.g., "12.5%"
    daysActive: string;
  };
}

interface UsePoolEarningsParams {
  tokenA?: Address;
  tokenB?: Address;
  /**
   * Token decimals for formatting
   */
  tokenADecimals?: number;
  tokenBDecimals?: number;
  /**
   * Enable/disable fetching
   */
  enabled?: boolean;
  /**
   * Refetch interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refetchInterval?: number;
}

interface UsePoolEarningsReturn {
  earnings?: PoolEarningsData;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * usePoolEarnings
 * 
 * Fetches comprehensive earnings data for a user's LP position in a specific pool.
 * Includes unrealized earnings, realized earnings, APY, and position value tracking.
 * 
 * @param params - Configuration options
 * @returns Earnings data and utilities
 * 
 * @example
 * ```tsx
 * const { earnings, isLoading } = usePoolEarnings({
 *   tokenA: '0x...',
 *   tokenB: '0x...',
 *   tokenADecimals: 18,
 *   tokenBDecimals: 6,
 * });
 * 
 * if (earnings) {
 *   console.log(`APY: ${earnings.formatted.apy}`);
 *   console.log(`Total Earnings A: ${earnings.formatted.totalA}`);
 * }
 * ```
 */
export function usePoolEarnings({
  tokenA,
  tokenB,
  tokenADecimals = 18,
  tokenBDecimals = 18,
  enabled = true,
  refetchInterval = 30000,
}: UsePoolEarningsParams = {}): UsePoolEarningsReturn {
  const { address } = useAccount();

  const shouldFetch = useMemo(() => {
    return Boolean(enabled && address && tokenA && tokenB);
  }, [enabled, address, tokenA, tokenB]);

  const {
    data: earningsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getEarningsReport',
        args: shouldFetch ? [address!, tokenA!, tokenB!] : undefined,
      },
    ],
    query: {
      enabled: shouldFetch,
      refetchInterval,
      staleTime: 15_000,
    },
  });

  const earnings = useMemo(() => {
    if (!earningsData?.[0]?.result) return undefined;

    const result = earningsData[0].result as [
      bigint, // unrealizedEarningsA
      bigint, // unrealizedEarningsB
      bigint, // realizedEarningsA
      bigint, // realizedEarningsB
      bigint, // totalEarningsA
      bigint, // totalEarningsB
      bigint, // currentValue
      bigint, // originalDeposit
      bigint, // apy (in basis points)
      bigint, // daysActive
    ];

    const [
      unrealizedEarningsA,
      unrealizedEarningsB,
      realizedEarningsA,
      realizedEarningsB,
      totalEarningsA,
      totalEarningsB,
      currentValue,
      originalDeposit,
      apy,
      daysActive,
    ] = result;

    return {
      unrealizedEarningsA,
      unrealizedEarningsB,
      realizedEarningsA,
      realizedEarningsB,
      totalEarningsA,
      totalEarningsB,
      currentValue,
      originalDeposit,
      apy,
      daysActive,
      formatted: {
        unrealizedA: AMMFormatters.formatTokenAmountSync(
          unrealizedEarningsA,
          tokenADecimals,
          6
        ),
        unrealizedB: AMMFormatters.formatTokenAmountSync(
          unrealizedEarningsB,
          tokenBDecimals,
          6
        ),
        realizedA: AMMFormatters.formatTokenAmountSync(
          realizedEarningsA,
          tokenADecimals,
          6
        ),
        realizedB: AMMFormatters.formatTokenAmountSync(
          realizedEarningsB,
          tokenBDecimals,
          6
        ),
        totalA: AMMFormatters.formatTokenAmountSync(totalEarningsA, tokenADecimals, 6),
        totalB: AMMFormatters.formatTokenAmountSync(totalEarningsB, tokenBDecimals, 6),
        currentValue: AMMFormatters.formatTokenAmountSync(currentValue, 18, 2), // USD value
        originalDeposit: AMMFormatters.formatTokenAmountSync(originalDeposit, 18, 2),
        apy: formatAPY(apy),
        daysActive: daysActive.toString(),
      },
    };
  }, [earningsData, tokenADecimals, tokenBDecimals]);

  return {
    earnings,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Format APY from basis points to percentage string
 * @param apyBps - APY in basis points (10000 = 100%)
 * @returns Formatted APY string (e.g., "12.50%")
 */
function formatAPY(apyBps: bigint): string {
  try {
    const apy = Number(apyBps) / 100; // Convert basis points to percentage
    return `${apy.toFixed(2)}%`;
  } catch {
    return '0.00%';
  }
}

export interface UseUnrealizedEarningsReturn {
  earningsA?: bigint;
  earningsB?: bigint;
  valueAtDeposit?: bigint;
  currentValue?: bigint;
  apy?: bigint;
  formatted?: {
    earningsA: string;
    earningsB: string;
    valueAtDeposit: string;
    currentValue: string;
    apy: string;
  };
  isLoading: boolean;
  refetch: () => void;
}