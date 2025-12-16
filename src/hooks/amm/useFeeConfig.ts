// src/hooks/amm/useFeeConfig.ts
import { useMemo } from 'react';
import { type Address } from 'viem';
import { useReadContracts } from 'wagmi';
import { exhibitionAmmAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

interface FeeConfig {
  tradingFee: bigint; // in basis points
  protocolFee: bigint; // in basis points
  feeRecipient: Address;
  feesEnabled: boolean;
  
  formatted: {
    tradingFee: string; // e.g., "0.30%"
    protocolFee: string; // e.g., "0.05%"
    tradingFeeDisplay: string; // e.g., "30 bps"
    protocolFeeDisplay: string; // e.g., "5 bps"
  };
  
  // Calculated values
  totalFee: bigint; // tradingFee + protocolFee
  lpFee: bigint; // tradingFee - protocolFee (what goes to LPs)
}

interface UseFeeConfigReturn {
  feeConfig?: FeeConfig;
  maxTradingFee?: bigint;
  maxProtocolFee?: bigint;
  feeDenominator?: bigint;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * useFeeConfig
 * 
 * Fetches the current fee configuration for the AMM.
 * Includes trading fees, protocol fees, and fee recipient.
 * 
 * @param enabled - Enable/disable fetching
 * @returns Fee configuration data and utilities
 * 
 * @example
 * ```tsx
 * const { feeConfig, isLoading } = useFeeConfig();
 * 
 * if (feeConfig) {
 *   console.log(`Trading Fee: ${feeConfig.formatted.tradingFee}`);
 *   console.log(`Protocol Fee: ${feeConfig.formatted.protocolFee}`);
 *   console.log(`Fee Recipient: ${feeConfig.feeRecipient}`);
 * }
 * ```
 */
export function useFeeConfig(enabled = true): UseFeeConfigReturn {
  const {
    data: feeData,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getFeeConfig',
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'MAX_TRADING_FEE',
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'MAX_PROTOCOL_FEE',
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'FEE_DENOMINATOR',
      },
    ],
    query: {
      enabled,
      refetchInterval: 120_000, // Refetch every 2 minutes (fee config changes rarely)
      staleTime: 60_000,
    },
  });

  const feeConfig = useMemo(() => {
    if (!feeData?.[0]?.result) return undefined;

    const [tradingFee, protocolFee, feeRecipient, feesEnabled] = feeData[0].result as [
      bigint,
      bigint,
      Address,
      boolean
    ];

    const totalFee = tradingFee + protocolFee;
    const lpFee = tradingFee - protocolFee;

    return {
      tradingFee,
      protocolFee,
      feeRecipient,
      feesEnabled,
      totalFee,
      lpFee,
      formatted: {
        tradingFee: formatBpsToPercent(tradingFee),
        protocolFee: formatBpsToPercent(protocolFee),
        tradingFeeDisplay: `${tradingFee.toString()} bps`,
        protocolFeeDisplay: `${protocolFee.toString()} bps`,
      },
    };
  }, [feeData]);

  const maxTradingFee = feeData?.[1]?.result as bigint | undefined;
  const maxProtocolFee = feeData?.[2]?.result as bigint | undefined;
  const feeDenominator = feeData?.[3]?.result as bigint | undefined;

  return {
    feeConfig,
    maxTradingFee,
    maxProtocolFee,
    feeDenominator,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Format basis points to percentage string
 * @param bps - Basis points (100 = 1%)
 * @returns Formatted percentage (e.g., "0.30%")
 */
function formatBpsToPercent(bps: bigint): string {
  try {
    const percent = Number(bps) / 100;
    return `${percent.toFixed(2)}%`;
  } catch {
    return '0.00%';
  }
}

/**
 * useSwapFeeCalculator
 * 
 * Calculate fees for a given swap amount.
 * Useful for showing fee breakdown before executing a swap.
 * 
 * @example
 * ```tsx
 * const { calculateFees } = useSwapFeeCalculator();
 * 
 * const amountIn = parseUnits('100', 18);
 * const fees = calculateFees(amountIn);
 * 
 * console.log(`Total Fee: ${fees.formatted.totalFee}`);
 * console.log(`LP Fee: ${fees.formatted.lpFee}`);
 * console.log(`Protocol Fee: ${fees.formatted.protocolFee}`);
 * ```
 */
export function useSwapFeeCalculator() {
  const { feeConfig, feeDenominator } = useFeeConfig();

  const calculateFees = useMemo(() => {
    if (!feeConfig || !feeDenominator) {
      return () => null;
    }

    return (amountIn: bigint, tokenDecimals = 18) => {
      const totalFee = (amountIn * feeConfig.totalFee) / feeDenominator;
      const protocolFee = (amountIn * feeConfig.protocolFee) / feeDenominator;
      const lpFee = totalFee - protocolFee;
      const amountAfterFees = amountIn - totalFee;

      return {
        totalFee,
        protocolFee,
        lpFee,
        amountAfterFees,
        formatted: {
          totalFee: formatTokenAmount(totalFee, tokenDecimals),
          protocolFee: formatTokenAmount(protocolFee, tokenDecimals),
          lpFee: formatTokenAmount(lpFee, tokenDecimals),
          amountAfterFees: formatTokenAmount(amountAfterFees, tokenDecimals),
        },
      };
    };
  }, [feeConfig, feeDenominator]);

  return {
    feeConfig,
    calculateFees,
    isReady: Boolean(feeConfig && feeDenominator),
  };
}

/**
 * Simple token amount formatter
 */
function formatTokenAmount(amount: bigint, decimals: number): string {
  try {
    const divisor = BigInt(10 ** decimals);
    const integerPart = amount / divisor;
    const fractionalPart = amount % divisor;
    
    const fractionalStr = fractionalPart
      .toString()
      .padStart(decimals, '0')
      .slice(0, 6); // Show up to 6 decimal places
    
    return `${integerPart}.${fractionalStr}`.replace(/\.?0+$/, '');
  } catch {
    return '0';
  }
}