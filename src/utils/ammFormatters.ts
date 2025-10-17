import { type Address, formatUnits, getContract, type PublicClient } from 'viem';
import type { LiquidityPool, LiquidityLock, UserPortfolio } from '../types/amm.ts';

// ================================
//     CONSTANTS
// ================================

export const AMM_CONSTANTS = {
  // Default slippage tolerance in percentage
  DEFAULT_SLIPPAGE: 0.5,
  // Maximum slippage allowed (5%)
  MAX_SLIPPAGE: 5,
  // Default deadline in minutes
  DEFAULT_DEADLINE: 20,
  // Maximum deadline allowed (1 hour)
  MAX_DEADLINE: 60,
  // Minimum liquidity for display
  MIN_LIQUIDITY_DISPLAY: 0.000001,
  // Zero address
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000' as Address,
  // Basis points for percentage calculations
  BASIS_POINTS: 10000,
  // Default token decimals
  DEFAULT_DECIMALS: 18,
  // Cache duration for decimals (5 minutes)
  DECIMALS_CACHE_DURATION: 5 * 60 * 1000,
  // UQ112x112 constants for high precision
  Q112: BigInt(2) ** BigInt(112), // 2^112 for fixed-point arithmetic
  MAX_UINT112: (BigInt(2) ** BigInt(112)) - BigInt(1),
  // Precision constants for different operations
  PRICE_PRECISION_DECIMALS: 18,
  LP_PRECISION_DECIMALS: 18,
  RATIO_PRECISION_DECIMALS: 18,
} as const;

export const AMM_ERROR_CODES = {
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INSUFFICIENT_LIQUIDITY: 'INSUFFICIENT_LIQUIDITY',
  SLIPPAGE_TOO_HIGH: 'SLIPPAGE_TOO_HIGH',
  DEADLINE_EXPIRED: 'DEADLINE_EXPIRED',
  POOL_DOES_NOT_EXIST: 'POOL_DOES_NOT_EXIST',
  LIQUIDITY_LOCKED: 'LIQUIDITY_LOCKED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  PRECISION_OVERFLOW: 'PRECISION_OVERFLOW',
  DIVISION_BY_ZERO: 'DIVISION_BY_ZERO',
} as const;

// ================================
//     UQ112x112 PRECISION LIBRARY
// ================================

/**
 * UQ112x112 Fixed Point Arithmetic Library
 * Mirrors the Solidity contract logic for maximum precision
 */
export class UQ112x112 {
  private static readonly Q112 = AMM_CONSTANTS.Q112;

  /**
   * Encode a uint112 value into UQ112x112 format
   * @param y - The uint112 value to encode
   * @returns The encoded UQ112x112 value
   */
  static encode(y: bigint): bigint {
    if (y > AMM_CONSTANTS.MAX_UINT112) {
      throw new Error('UQ112x112: encode overflow');
    }
    return y * this.Q112;
  }

  /**
   * Decode UQ112x112 format back to uint112
   * @param z - The UQ112x112 value to decode
   * @returns The decoded uint112 value
   */
  static decode(z: bigint): bigint {
    return z / this.Q112;
  }

  /**
   * Multiply UQ112x112 by uint256
   * @param x - UQ112x112 value
   * @param y - uint256 value
   * @returns Product as uint256
   */
  static mul(x: bigint, y: bigint): bigint {
    return x * y;
  }

  /**
   * Divide UQ112x112 by uint256
   * @param x - UQ112x112 value
   * @param y - uint256 value
   * @returns Quotient as uint256
   */
  static div(x: bigint, y: bigint): bigint {
    if (y === BigInt(0)) {
      throw new Error('UQ112x112: division by zero');
    }
    return x / y;
  }

  /**
   * High precision multiply and divide: (x * y) / z
   * @param x - First operand
   * @param y - Second operand  
   * @param z - Divisor
   * @returns Result of (x * y) / z
   */
  static mulDiv(x: bigint, y: bigint, z: bigint): bigint {
    if (z === BigInt(0)) {
      throw new Error('UQ112x112: mulDiv division by zero');
    }
    const mm = x * y;
    if (mm === BigInt(0)) return BigInt(0);
    return mm / z;
  }

  /**
   * Square root calculation using Newton's method
   * @param x - Value to calculate square root for
   * @returns Square root
   */
  static sqrt(x: bigint): bigint {
    if (x === BigInt(0)) return BigInt(0);
    
    let z = x;
    let y = (x + BigInt(1)) / BigInt(2);
    
    while (y < z) {
      z = y;
      y = (x / y + y) / BigInt(2);
    }
    
    return z;
  }

  /**
   * Calculate price ratio with UQ112x112 precision
   * @param reserveA - Reserve of token A
   * @param reserveB - Reserve of token B
   * @returns Price ratio encoded in UQ112x112
   */
  static calculatePriceRatio(reserveA: bigint, reserveB: bigint): bigint {
    if (reserveA === BigInt(0)) {
      throw new Error('UQ112x112: reserve A cannot be zero');
    }
    const encoded = this.encode(reserveB);
    return this.div(encoded, reserveA);
  }

  /**
   * Geometric mean for AMM calculations
   * @param x - First value
   * @param y - Second value
   * @returns Geometric mean
   */
  static geometricMean(x: bigint, y: bigint): bigint {
    if (x === BigInt(0) || y === BigInt(0)) return BigInt(0);
    return this.sqrt(x * y);
  }
}

// ================================
//     PRECISION UTILITIES
// ================================

/**
 * High precision math utilities for AMM calculations
 */
export class PrecisionMath {
  /**
   * Scale a value to a specific decimal precision
   * @param value - Value to scale
   * @param fromDecimals - Current decimal places
   * @param toDecimals - Target decimal places
   * @returns Scaled value
   */
  static scaleDecimals(value: bigint, fromDecimals: number, toDecimals: number): bigint {
    if (fromDecimals === toDecimals) return value;
    
    if (fromDecimals > toDecimals) {
      const divisor = BigInt(10) ** BigInt(fromDecimals - toDecimals);
      return value / divisor;
    } else {
      const multiplier = BigInt(10) ** BigInt(toDecimals - fromDecimals);
      return value * multiplier;
    }
  }

  /**
   * Calculate percentage with high precision
   * @param part - Part value
   * @param whole - Whole value
   * @param precision - Decimal precision (default 18)
   * @returns Percentage as scaled integer
   */
  static calculatePercentage(part: bigint, whole: bigint, precision = 18): bigint {
    if (whole === BigInt(0)) return BigInt(0);
    
    const scaledPart = part * (BigInt(10) ** BigInt(precision));
    return (scaledPart * BigInt(100)) / whole;
  }

  /**
   * Apply percentage to a value with high precision
   * @param value - Base value
   * @param percentage - Percentage as scaled integer
   * @param precision - Decimal precision
   * @returns Result after applying percentage
   */
  static applyPercentage(value: bigint, percentage: bigint, precision = 18): bigint {
    const scaledValue = value * percentage;
    const divisor = BigInt(100) * (BigInt(10) ** BigInt(precision));
    return scaledValue / divisor;
  }

  /**
   * Format BigInt with decimal places, removing trailing zeros
   * @param value - BigInt value
   * @param decimals - Decimal places
   * @param displayDecimals - Maximum decimals to display
   * @returns Formatted string
   */
  static formatBigIntWithDecimals(
    value: bigint,
    decimals: number,
    displayDecimals: number = 6
  ): string {
    if (value === BigInt(0)) return '0';

    const isNegative = value < BigInt(0);
    const absValue = isNegative ? -value : value;
    const sign = isNegative ? '-' : '';

    const divisor = BigInt(10) ** BigInt(decimals);
    const wholePart = absValue / divisor;
    const fractionalPart = absValue % divisor;

    if (fractionalPart === BigInt(0)) {
      return `${sign}${wholePart}`;
    }

    // Convert fractional part to string with proper padding
    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    
    // Truncate to display decimals
    const truncatedFractional = fractionalStr.slice(0, displayDecimals);
    
    // Remove trailing zeros
    const cleanFractional = truncatedFractional.replace(/0+$/, '');

    if (cleanFractional === '') {
      return `${sign}${wholePart}`;
    }

    return `${sign}${wholePart}.${cleanFractional}`;
  }

  /**
   * Parse decimal string to BigInt with specified decimals
   * @param value - Decimal string
   * @param decimals - Target decimal places
   * @returns BigInt representation
   */
  static parseToBigInt(value: string, decimals: number): bigint {
    if (!value || value === '') return BigInt(0);
    
    // Handle negative values
    const isNegative = value.startsWith('-');
    const cleanValue = isNegative ? value.slice(1) : value;
    
    const [whole = '0', fractional = ''] = cleanValue.split('.');
    
    // Pad or truncate fractional part
    const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
    
    const result = BigInt(whole + paddedFractional);
    return isNegative ? -result : result;
  }
}

// ================================
//     TYPES
// ================================

interface TokenInfo {
  decimals: number;
  symbol: string;
  totalSupply: bigint;
}

interface CachedTokenInfo extends TokenInfo {
  timestamp: number;
}

interface ContractConfig {
  publicClient: PublicClient;
  contractAddress: Address;
  abi: any[];
}

interface PreciseFormatOptions {
  useUQ112x112?: boolean;
  maxDecimals?: number;
  minDecimals?: number;
  scientific?: boolean;
  preserveTrailingZeros?: boolean;
}

// ================================
//     CACHE MANAGEMENT
// ================================

class TokenInfoCache {
  private cache = new Map<Address, CachedTokenInfo>();

  set(address: Address, info: TokenInfo): void {
    this.cache.set(address, {
      ...info,
      timestamp: Date.now(),
    });
  }

  get(address: Address): TokenInfo | null {
    const cached = this.cache.get(address);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > AMM_CONSTANTS.DECIMALS_CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(address);
      return null;
    }

    return {
      decimals: cached.decimals,
      symbol: cached.symbol,
      totalSupply: cached.totalSupply,
    };
  }

  clear(): void {
    this.cache.clear();
  }

  has(address: Address): boolean {
    const cached = this.cache.get(address);
    if (!cached) return false;
    
    const isExpired = Date.now() - cached.timestamp > AMM_CONSTANTS.DECIMALS_CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(address);
      return false;
    }
    
    return true;
  }
}

const tokenInfoCache = new TokenInfoCache();

// ================================
//     CONTRACT INTERACTION
// ================================

let contractConfig: ContractConfig | null = null;

/**
 * Initialize the contract configuration
 */
export const initializeAMMFormatters = (config: ContractConfig): void => {
  contractConfig = config;
};

/**
 * Get token decimals from contract
 */
export const getTokenDecimals = async (tokenAddress: Address): Promise<number> => {
  if (!contractConfig) {
    console.warn('AMM Formatters not initialized, using default decimals');
    return AMM_CONSTANTS.DEFAULT_DECIMALS;
  }

  // Check cache first
  const cached = tokenInfoCache.get(tokenAddress);
  if (cached) return cached.decimals;

  try {
    const contract = getContract({
      address: contractConfig.contractAddress,
      abi: contractConfig.abi,
      client: contractConfig.publicClient,
    });

    const result = await contract.read.getTokenDecimals([tokenAddress]);
    const decimals = Array.isArray(result) ? (result[0] as number) : (result as number);
    
    // Cache the result with minimal info if we only got decimals
    tokenInfoCache.set(tokenAddress, {
      decimals,
      symbol: '', // Will be fetched separately if needed
      totalSupply: BigInt(0),
    });

    return decimals;
  } catch (error) {
    console.warn(`Failed to fetch decimals for ${tokenAddress}:`, error);
    return AMM_CONSTANTS.DEFAULT_DECIMALS;
  }
};

/**
 * Get token symbol from contract
 */
export const getTokenSymbol = async (tokenAddress: Address): Promise<string> => {
  if (!contractConfig) {
    console.warn('AMM Formatters not initialized');
    return 'Unknown';
  }

  // Check cache first
  const cached = tokenInfoCache.get(tokenAddress);
  if (cached && cached.symbol) return cached.symbol;

  try {
    const contract = getContract({
      address: contractConfig.contractAddress,
      abi: contractConfig.abi,
      client: contractConfig.publicClient,
    });

    const result = await contract.read.getTokenSymbol([tokenAddress]);
    const symbol = Array.isArray(result) ? (result[0] as string) : (result as string);
    
    // Update cache
    if (cached) {
      tokenInfoCache.set(tokenAddress, {
        ...cached,
        symbol,
      });
    } else {
      tokenInfoCache.set(tokenAddress, {
        decimals: AMM_CONSTANTS.DEFAULT_DECIMALS,
        symbol,
        totalSupply: BigInt(0),
      });
    }

    return symbol;
  } catch (error) {
    console.warn(`Failed to fetch symbol for ${tokenAddress}:`, error);
    return 'Unknown';
  }
};

/**
 * Get multiple tokens info at once
 */
export const getTokensInfo = async (tokenAddresses: Address[]): Promise<Record<Address, TokenInfo>> => {
  if (!contractConfig) {
    console.warn('AMM Formatters not initialized');
    return {};
  }

  const result: Record<Address, TokenInfo> = {};
  const uncachedTokens: Address[] = [];

  // Check cache for each token
  for (const address of tokenAddresses) {
    const cached = tokenInfoCache.get(address);
    if (cached) {
      result[address] = cached;
    } else {
      uncachedTokens.push(address);
    }
  }

  // Fetch uncached tokens in batch
  if (uncachedTokens.length > 0) {
    try {
      const contract = getContract({
        address: contractConfig.contractAddress,
        abi: contractConfig.abi,
        client: contractConfig.publicClient,
      });

      const [symbols, decimalsArray, totalSupplies] = await contract.read.getTokensInfo([uncachedTokens]) as [string[], number[], bigint[]];

      uncachedTokens.forEach((address, index) => {
        const tokenInfo: TokenInfo = {
          decimals: decimalsArray[index] || AMM_CONSTANTS.DEFAULT_DECIMALS,
          symbol: symbols[index] || 'Unknown',
          totalSupply: totalSupplies[index] || BigInt(0),
        };

        tokenInfoCache.set(address, tokenInfo);
        result[address] = tokenInfo;
      });
    } catch (error) {
      console.warn('Failed to fetch tokens info:', error);
      
      // Fallback to individual calls or default values
      for (const address of uncachedTokens) {
        result[address] = {
          decimals: AMM_CONSTANTS.DEFAULT_DECIMALS,
          symbol: 'Unknown',
          totalSupply: BigInt(0),
        };
      }
    }
  }

  return result;
};

// ================================
//     ENHANCED PRECISION FORMATTING
// ================================

/**
 * Format token amount with maximum precision using BigInt arithmetic
 */
export const formatTokenAmountPrecise = (
  amount: bigint | string | number,
  decimals: number = AMM_CONSTANTS.DEFAULT_DECIMALS,
  displayDecimals: number = 6,
  options: PreciseFormatOptions = {}
): string => {
  if (!amount) return '0';
  
  try {
    let value: bigint;
    
    // Convert input to BigInt
    if (typeof amount === 'bigint') {
      value = amount;
    } else if (typeof amount === 'string') {
      value = PrecisionMath.parseToBigInt(amount, decimals);
    } else {
      // Handle number input with precision
      const stringValue = amount.toFixed(decimals);
      value = PrecisionMath.parseToBigInt(stringValue, decimals);
    }

    // If using UQ112x112 format, decode first
    if (options.useUQ112x112) {
      value = UQ112x112.decode(value);
    }

    if (value === BigInt(0)) return '0';

    // Use precision math for formatting
    const formatted = PrecisionMath.formatBigIntWithDecimals(value, decimals, displayDecimals);
    
    const num = parseFloat(formatted);
    if (num < AMM_CONSTANTS.MIN_LIQUIDITY_DISPLAY && num > 0) {
      return `< ${AMM_CONSTANTS.MIN_LIQUIDITY_DISPLAY}`;
    }

    return formatted;
  } catch (error) {
    console.warn('Error in formatTokenAmountPrecise:', error);
    return '0';
  }
};

/**
 * Enhanced large number formatter with UQ112x112 precision support
 */
export const formatLargeNumberPrecise = (
  num: number | bigint | string,
  decimals: number = 2,
  options: PreciseFormatOptions = {}
): string => {
  let value: bigint;
  const precision = AMM_CONSTANTS.PRICE_PRECISION_DECIMALS;
  
  // Convert input to BigInt with high precision
  if (typeof num === 'bigint') {
    value = num;
  } else if (typeof num === 'string') {
    value = PrecisionMath.parseToBigInt(num, precision);
  } else {
    const stringValue = num.toFixed(precision);
    value = PrecisionMath.parseToBigInt(stringValue, precision);
  }

  // If using UQ112x112 format, decode first
  if (options.useUQ112x112) {
    value = UQ112x112.decode(value);
  }

  if (value === BigInt(0)) return '0';

  const isNegative = value < BigInt(0);
  const absValue = isNegative ? -value : value;
  const sign = isNegative ? '-' : '';

  // Define scale thresholds as BigInt
  const scaleDivisor = BigInt(10) ** BigInt(precision);
  const billion = BigInt(1e9) * scaleDivisor;
  const million = BigInt(1e6) * scaleDivisor;
  const thousand = BigInt(1e3) * scaleDivisor;

  let suffix = '';
  let divisor = scaleDivisor;

  if (absValue >= billion) {
    suffix = 'B';
    divisor = billion;
  } else if (absValue >= million) {
    suffix = 'M';
    divisor = million;
  } else if (absValue >= thousand) {
    suffix = 'K';
    divisor = thousand;
  }

  // Calculate the result with precision
  const result = PrecisionMath.formatBigIntWithDecimals(absValue, Number(divisor.toString().length - 1), decimals);
  
  return `${sign}${result}${suffix}`;
};

/**
 * Format UQ112x112 encoded values specifically
 */
export const formatUQ112x112 = (
  encodedValue: bigint,
  decimals: number = 6,
  displayDecimals: number = 6
): string => {
  return formatTokenAmountPrecise(encodedValue, decimals, displayDecimals, { useUQ112x112: true });
};

/**
 * Enhanced price formatter with UQ112x112 precision
 */
export const formatPricePrecise = (
  price: bigint | string | number,
  baseCurrency: string = '',
  quoteCurrency: string = '',
  decimals: number = 6,
  options: PreciseFormatOptions = {}
): string => {
  const formattedPrice = formatTokenAmountPrecise(price, AMM_CONSTANTS.PRICE_PRECISION_DECIMALS, decimals, options);
  
  if (baseCurrency && quoteCurrency) {
    return `${formattedPrice} ${quoteCurrency}/${baseCurrency}`;
  }
  
  return formattedPrice;
};

/**
 * Format percentage with high precision
 */
export const formatPercentagePrecise = (
  value: bigint | string | number,
  decimals: number = 2,
  precision: number = AMM_CONSTANTS.PRICE_PRECISION_DECIMALS
): string => {
  const formatted = formatTokenAmountPrecise(value, precision, decimals);
  return `${formatted}%`;
};

/**
 * Format liquidity pool ratios with UQ112x112 precision
 */
export const formatPoolRatio = (
  reserve0: bigint,
  reserve1: bigint,
  decimals0: number = AMM_CONSTANTS.DEFAULT_DECIMALS,
  decimals1: number = AMM_CONSTANTS.DEFAULT_DECIMALS,
  displayDecimals: number = 6
): string => {
  if (reserve1 === BigInt(0)) return '∞';
  
  try {
    // Normalize reserves to same decimal precision
    const normalizedReserve0 = PrecisionMath.scaleDecimals(reserve0, decimals0, AMM_CONSTANTS.RATIO_PRECISION_DECIMALS);
    const normalizedReserve1 = PrecisionMath.scaleDecimals(reserve1, decimals1, AMM_CONSTANTS.RATIO_PRECISION_DECIMALS);
    
    // Calculate ratio using UQ112x112 precision
    const ratio = UQ112x112.calculatePriceRatio(normalizedReserve0, normalizedReserve1);
    
    return formatUQ112x112(ratio, AMM_CONSTANTS.RATIO_PRECISION_DECIMALS, displayDecimals);
  } catch (error) {
    console.warn('Error calculating pool ratio:', error);
    return '0';
  }
};

// ================================
//     ENHANCED FORMATTING FUNCTIONS
// ================================

/**
 * Format token amount with dynamic decimals
 */
export const formatTokenAmount = async (
  amount: bigint | string | number,
  tokenAddress?: Address,
  displayDecimals: number = 6
): Promise<string> => {
  if (!amount) return '0';
  
  try {
    // Get decimals dynamically if token address provided
    const decimals = tokenAddress 
      ? await getTokenDecimals(tokenAddress)
      : AMM_CONSTANTS.DEFAULT_DECIMALS;
    
    return formatTokenAmountPrecise(amount, decimals, displayDecimals);
  } catch {
    return '0';
  }
};

/**
 * Synchronous version for when decimals are already known
 */
export const formatTokenAmountSync = (
  amount: bigint | string | number,
  decimals: number = AMM_CONSTANTS.DEFAULT_DECIMALS,
  displayDecimals: number = 6
): string => {
  return formatTokenAmountPrecise(amount, decimals, displayDecimals);
};

/**
 * Parse token amount with dynamic decimals
 */
export const parseTokenAmount = async (
  amount: string,
  tokenAddress?: Address
): Promise<bigint> => {
  if (!amount || amount === '') return BigInt(0);
  
  try {
    const decimals = tokenAddress 
      ? await getTokenDecimals(tokenAddress)
      : AMM_CONSTANTS.DEFAULT_DECIMALS;
      
    return PrecisionMath.parseToBigInt(amount, decimals);
  } catch {
    return BigInt(0);
  }
};

/**
 * Synchronous version for when decimals are already known
 */
export const parseTokenAmountSync = (
  amount: string,
  decimals: number = AMM_CONSTANTS.DEFAULT_DECIMALS
): bigint => {
  if (!amount || amount === '') return BigInt(0);
  
  try {
    return PrecisionMath.parseToBigInt(amount, decimals);
  } catch {
    return BigInt(0);
  }
};

/**
 * Format price with dynamic decimals
 */
export const formatPrice = async (
  price: bigint | string,
  tokenAddress?: Address,
  displayDecimals?: number
): Promise<string> => {
  if (!price) return '0';
  
  try {
    const decimals = tokenAddress 
      ? await getTokenDecimals(tokenAddress)
      : AMM_CONSTANTS.DEFAULT_DECIMALS;
      
    const priceBigInt = typeof price === 'bigint' ? price : PrecisionMath.parseToBigInt(price, decimals);
    const formatted = formatTokenAmountPrecise(priceBigInt, decimals, displayDecimals || 8);
    
    // Auto-adjust decimals based on price magnitude if not specified
    if (!displayDecimals) {
      const num = parseFloat(formatted);
      if (num >= 1000) return formatTokenAmountPrecise(priceBigInt, decimals, 2);
      else if (num >= 1) return formatTokenAmountPrecise(priceBigInt, decimals, 4);
      else if (num >= 0.01) return formatTokenAmountPrecise(priceBigInt, decimals, 6);
      else return formatTokenAmountPrecise(priceBigInt, decimals, 8);
    }
    
    return formatted;
  } catch {
    return '0';
  }
};

// ================================
//     ENHANCED CALCULATION FUNCTIONS
// ================================

/**
 * Calculate price impact with UQ112x112 precision
 */
export const calculatePriceImpactPrecise = (
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint,
  decimalsIn: number = AMM_CONSTANTS.DEFAULT_DECIMALS,
  decimalsOut: number = AMM_CONSTANTS.DEFAULT_DECIMALS
): bigint => {
  if (!reserveIn || !reserveOut || !amountIn) return BigInt(0);
  
  try {
    // Normalize reserves and amount to same precision
    const precision = AMM_CONSTANTS.PRICE_PRECISION_DECIMALS;
    const normalizedReserveIn = PrecisionMath.scaleDecimals(reserveIn, decimalsIn, precision);
    const normalizedReserveOut = PrecisionMath.scaleDecimals(reserveOut, decimalsOut, precision);
    const normalizedAmountIn = PrecisionMath.scaleDecimals(amountIn, decimalsIn, precision);
    
    // Current price using UQ112x112
    const currentPriceEncoded = UQ112x112.calculatePriceRatio(normalizedReserveIn, normalizedReserveOut);
    
    // Calculate amount out with 0.3% fee (997/1000)
    const newReserveIn = normalizedReserveIn + normalizedAmountIn;
    const amountInWithFee = normalizedAmountIn * BigInt(997);
    const numerator = amountInWithFee * normalizedReserveOut;
    const denominator = newReserveIn * BigInt(1000) + amountInWithFee;
    const amountOut = numerator / denominator;
    
    if (amountOut >= normalizedReserveOut) {
      return BigInt(10000); // 100% impact
    }
    
    const newReserveOut = normalizedReserveOut - amountOut;
    
    // New price using UQ112x112
    const newPriceEncoded = UQ112x112.calculatePriceRatio(newReserveIn, newReserveOut);
    
    // Calculate price impact as percentage
    const priceDiff = newPriceEncoded > currentPriceEncoded 
      ? newPriceEncoded - currentPriceEncoded 
      : currentPriceEncoded - newPriceEncoded;
    
    return PrecisionMath.calculatePercentage(priceDiff, currentPriceEncoded, 2);
  } catch (error) {
    console.warn('Error calculating price impact:', error);
    return BigInt(0);
  }
};

/**
 * Calculate price impact with dynamic decimals (wrapper)
 */
export const calculatePriceImpact = async (
  reserveIn: bigint,
  reserveOut: bigint,
  amountIn: bigint,
  tokenInAddress?: Address,
  tokenOutAddress?: Address
): Promise<number> => {
  if (!reserveIn || !reserveOut || !amountIn) return 0;
  
  try {
    const decimalsIn = tokenInAddress ? await getTokenDecimals(tokenInAddress) : 18;
    const decimalsOut = tokenOutAddress ? await getTokenDecimals(tokenOutAddress) : 18;
    
    const impactBigInt = calculatePriceImpactPrecise(reserveIn, reserveOut, amountIn, decimalsIn, decimalsOut);
    return Number(impactBigInt) / 100; // Convert from basis points to percentage
  } catch {
    return 0;
  }
};

/**
 * Calculate pool share percentage with high precision
 */
export const calculatePoolSharePrecise = (
  lpBalance: bigint,
  totalLPSupply: bigint,
  precision: number = AMM_CONSTANTS.PRICE_PRECISION_DECIMALS
): bigint => {
  if (!lpBalance || !totalLPSupply || totalLPSupply === BigInt(0)) return BigInt(0);
  
  return PrecisionMath.calculatePercentage(lpBalance, totalLPSupply, precision);
};

/**
 * Calculate pool share percentage
 */
export const calculatePoolShare = (
  lpBalance: bigint,
  totalLPSupply: bigint
): number => {
  const preciseBigInt = calculatePoolSharePrecise(lpBalance, totalLPSupply, 2);
  return Number(preciseBigInt) / 100;
};

/**
 * Calculate APR estimate with UQ112x112 precision
 */
export const calculateAPRPrecise = (
  volume24h: bigint,
  totalLiquidity: bigint,
  volumeDecimals: number = AMM_CONSTANTS.DEFAULT_DECIMALS,
  liquidityDecimals: number = AMM_CONSTANTS.DEFAULT_DECIMALS,
  feeRateBasisPoints: number = 30 // 0.3% fee = 30 basis points
): bigint => {
  if (!volume24h || !totalLiquidity || totalLiquidity === BigInt(0)) return BigInt(0);
  
  try {
    // Normalize to same precision
    const precision = AMM_CONSTANTS.PRICE_PRECISION_DECIMALS;
    const normalizedVolume = PrecisionMath.scaleDecimals(volume24h, volumeDecimals, precision);
    const normalizedLiquidity = PrecisionMath.scaleDecimals(totalLiquidity, liquidityDecimals, precision);
    
    // Calculate daily fees: volume * feeRate
    const dailyFees = PrecisionMath.applyPercentage(normalizedVolume, BigInt(feeRateBasisPoints), 2);
    
    // Daily APR = (dailyFees / liquidity) * 100
    const dailyAPR = PrecisionMath.calculatePercentage(dailyFees, normalizedLiquidity, precision);
    
    // Annualized APR = dailyAPR * 365
    return dailyAPR * BigInt(365);
  } catch (error) {
    console.warn('Error calculating APR:', error);
    return BigInt(0);
  }
};

/**
 * Calculate APR estimate with dynamic decimals
 */
export const calculateAPR = async (
  volume24h: bigint,
  totalLiquidity: bigint,
  liquidityTokenAddress?: Address,
  feeRate: number = 0.3 // 0.3% fee
): Promise<number> => {
  if (!volume24h || !totalLiquidity || totalLiquidity === BigInt(0)) return 0;
  
  try {
    const decimals = liquidityTokenAddress ? await getTokenDecimals(liquidityTokenAddress) : 18;
    const feeRateBasisPoints = Math.floor(feeRate * 100);
    
    const aprBigInt = calculateAPRPrecise(volume24h, totalLiquidity, decimals, decimals, feeRateBasisPoints);
    
    // Convert from scaled percentage to regular percentage
    const precision = AMM_CONSTANTS.PRICE_PRECISION_DECIMALS;
    const divisor = BigInt(10) ** BigInt(precision);
    return Number(aprBigInt) / Number(divisor);
  } catch {
    return 0;
  }
};

/**
 * Calculate liquidity value in terms of underlying tokens with precision
 */
export const calculateLiquidityValuePrecise = (
  lpBalance: bigint,
  totalLPSupply: bigint,
  reserve0: bigint,
  reserve1: bigint
): { amount0: bigint; amount1: bigint } => {
  if (!lpBalance || !totalLPSupply || totalLPSupply === BigInt(0)) {
    return { amount0: BigInt(0), amount1: BigInt(0) };
  }
  
  // Use UQ112x112 for precision in share calculation
  const shareEncoded = UQ112x112.encode(lpBalance);
  const amount0 = UQ112x112.div(UQ112x112.mul(shareEncoded, reserve0), totalLPSupply);
  const amount1 = UQ112x112.div(UQ112x112.mul(shareEncoded, reserve1), totalLPSupply);
  
  return { amount0, amount1 };
};

/**
 * Calculate constant product (k = x * y) with overflow protection
 */
export const calculateConstantProduct = (reserve0: bigint, reserve1: bigint): bigint => {
  try {
    return reserve0 * reserve1;
  } catch (error) {
    console.warn('Overflow in constant product calculation:', error);
    return BigInt(0);
  }
};

/**
 * Calculate optimal amounts for adding liquidity
 */
export const calculateOptimalLiquidityAmounts = (
  amountADesired: bigint,
  amountBDesired: bigint,
  reserveA: bigint,
  reserveB: bigint
): { amountA: bigint; amountB: bigint } => {
  if (reserveA === BigInt(0) || reserveB === BigInt(0)) {
    // First liquidity provision
    return { amountA: amountADesired, amountB: amountBDesired };
  }
  
  // Calculate optimal amount B based on desired A
  const optimalB = UQ112x112.mulDiv(amountADesired, reserveB, reserveA);
  
  if (optimalB <= amountBDesired) {
    return { amountA: amountADesired, amountB: optimalB };
  } else {
    // Calculate optimal amount A based on desired B
    const optimalA = UQ112x112.mulDiv(amountBDesired, reserveA, reserveB);
    return { amountA: optimalA, amountB: amountBDesired };
  }
};

/**
 * Create deadline timestamp
 */
export const createDeadline = (minutes: number = AMM_CONSTANTS.DEFAULT_DEADLINE): bigint => {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60);
};

/**
 * Calculate minimum amount out with slippage using precise math
 */
export const calculateMinAmountOutPrecise = (
  amountOut: bigint,
  slippagePercent: number,
  precision: number = 2
): bigint => {
  const slippageBasisPoints = BigInt(Math.floor(slippagePercent * 100));
  const totalBasisPoints = BigInt(10) ** BigInt(precision + 2); // 10000 for 2 decimal precision
  const multiplier = totalBasisPoints - slippageBasisPoints;
  return UQ112x112.mulDiv(amountOut, multiplier, totalBasisPoints);
};

/**
 * Calculate minimum amount out with slippage
 */
export const calculateMinAmountOut = (
  amountOut: bigint,
  slippagePercent: number
): bigint => {
  return calculateMinAmountOutPrecise(amountOut, slippagePercent);
};

// ================================
//     LEGACY FORMATTING FUNCTIONS (for backwards compatibility)
// ================================

/**
 * Format percentage with basis points
 */
export const formatPercentage = (
  basisPoints: bigint | number,
  displayDecimals: number = 2
): string => {
  const percentage = typeof basisPoints === 'bigint' 
    ? Number(basisPoints) / AMM_CONSTANTS.BASIS_POINTS
    : basisPoints / AMM_CONSTANTS.BASIS_POINTS;
  
  return `${(percentage * 100).toFixed(displayDecimals)}%`;
};

/**
 * Parse percentage to basis points
 */
export const parsePercentage = (percentage: string): number => {
  const num = parseFloat(percentage.replace('%', ''));
  if (isNaN(num)) return 0;
  return Math.floor(num * AMM_CONSTANTS.BASIS_POINTS / 100);
};

/**
 * Format large numbers with K, M, B suffixes (Enhanced with BigInt precision)
 */
export const formatLargeNumber = (
  num: number | bigint | string,
  decimals: number = 2
): string => {
  // Use the new precision formatter for better accuracy
  return formatLargeNumberPrecise(num, decimals);
};

/**
 * Format address for display
 */
export const formatAddress = (address: Address, chars: number = 6): string => {
  if (!address) return '';
  if (address === AMM_CONSTANTS.ZERO_ADDRESS) return 'Zero Address';
  
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// ================================
//     ENHANCED VALIDATION FUNCTIONS
// ================================

/**
 * Validate slippage percentage
 */
export const validateSlippage = (slippage: number): boolean => {
  return slippage >= 0 && slippage <= AMM_CONSTANTS.MAX_SLIPPAGE;
};

/**
 * Validate deadline
 */
export const validateDeadline = (deadline: number): boolean => {
  return deadline > 0 && deadline <= AMM_CONSTANTS.MAX_DEADLINE;
};

/**
 * Validate token amount with dynamic decimals and precise arithmetic
 */
export const validateTokenAmount = async (
  amount: string,
  tokenAddress?: Address,
  balance?: bigint
): Promise<{ isValid: boolean; error?: string }> => {
  if (!amount || amount === '') {
    return { isValid: false, error: 'Amount is required' };
  }
  
  try {
    const decimals = tokenAddress 
      ? await getTokenDecimals(tokenAddress)
      : AMM_CONSTANTS.DEFAULT_DECIMALS;
      
    const amountBigInt = PrecisionMath.parseToBigInt(amount, decimals);
    
    if (amountBigInt <= BigInt(0)) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }
    
    if (balance !== undefined && amountBigInt > balance) {
      return { isValid: false, error: 'Insufficient balance' };
    }
    
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Invalid amount format' };
  }
};

/**
 * Validate UQ112x112 encoded value
 */
export const validateUQ112x112 = (value: bigint): { isValid: boolean; error?: string } => {
  try {
    // Check if value can be decoded without overflow
    UQ112x112.decode(value);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid UQ112x112 value' 
    };
  }
};

/**
 * Validate pool reserves for calculations
 */
export const validatePoolReserves = (
  reserveA: bigint, 
  reserveB: bigint
): { isValid: boolean; error?: string } => {
  if (reserveA <= BigInt(0) || reserveB <= BigInt(0)) {
    return { isValid: false, error: 'Reserves must be greater than zero' };
  }
  
  // Check for potential overflow in constant product
  try {
    calculateConstantProduct(reserveA, reserveB);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Reserves too large for calculation' };
  }
};

// ================================
//     ENHANCED PARSING FUNCTIONS
// ================================

/**
 * Parse pool data for display with dynamic decimals and precision
 */
export const parsePoolData = async (
  pool: LiquidityPool & { symbol0?: string; symbol1?: string }
): Promise<{
  tokenA: Address;
  tokenB: Address;
  reserveA: string;
  reserveB: string;
  totalLPSupply: string;
  pairName: string;
  tvl: string;
  decimalsA: number;
  decimalsB: number;
  priceRatio: string;
  inversePriceRatio: string;
}> => {
  // Get token info for both tokens
  const tokensInfo = await getTokensInfo([pool.tokenA, pool.tokenB]);
  
  const tokenAInfo = tokensInfo[pool.tokenA];
  const tokenBInfo = tokensInfo[pool.tokenB];
  
  // Calculate price ratios with precision
  const priceRatio = formatPoolRatio(
    pool.reserveA, 
    pool.reserveB, 
    tokenAInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS,
    tokenBInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS
  );
  
  const inversePriceRatio = formatPoolRatio(
    pool.reserveB, 
    pool.reserveA, 
    tokenBInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS,
    tokenAInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS
  );
  
  return {
    tokenA: pool.tokenA,
    tokenB: pool.tokenB,
    reserveA: formatTokenAmountSync(pool.reserveA, tokenAInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS),
    reserveB: formatTokenAmountSync(pool.reserveB, tokenBInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS),
    totalLPSupply: formatTokenAmountSync(pool.totalLPSupply),
    pairName: (tokenAInfo?.symbol && tokenBInfo?.symbol) 
      ? `${tokenAInfo.symbol}/${tokenBInfo.symbol}` 
      : (pool.symbol0 && pool.symbol1 ? `${pool.symbol0}/${pool.symbol1}` : 'Unknown Pair'),
    tvl: formatLargeNumber(
      Number(formatUnits(pool.reserveA, tokenAInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS)) + 
      Number(formatUnits(pool.reserveB, tokenBInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS))
    ),
    decimalsA: tokenAInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS,
    decimalsB: tokenBInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS,
    priceRatio,
    inversePriceRatio,
  };
};

/**
 * Parse liquidity lock for display with enhanced precision
 */
export const parseLiquidityLock = (lock: LiquidityLock) => {
  const now = Math.floor(Date.now() / 1000);
  const unlockTime = Number(lock.unlockTime);
  const isExpired = now >= unlockTime;
  
  return {
    projectId: lock.projectId.toString(),
    projectOwner: formatAddress(lock.projectOwner),
    unlockTime: new Date(unlockTime * 1000),
    lockedAmount: formatTokenAmountSync(lock.lockedLPAmount),
    lockedAmountRaw: lock.lockedLPAmount,
    isActive: lock.isActive,
    isExpired,
    timeRemaining: isExpired ? 0 : unlockTime - now,
    timeRemainingFormatted: isExpired ? 'Expired' : formatTimeRemaining(unlockTime - now),
    status: !lock.isActive ? 'Unlocked' : isExpired ? 'Expired' : 'Active',
  };
};

/**
 * Format time remaining in human readable format
 */
export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return 'Expired';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Parse user portfolio for display with dynamic decimals and enhanced precision
 */
export const parseUserPortfolio = async (
  portfolio: UserPortfolio
): Promise<{
  positions: Array<{
    tokenA: Address;
    tokenB: Address;
    symbolA: string;
    symbolB: string;
    pairName: string;
    lpBalance: string;
    sharePercentage: string;
    lpBalanceRaw: bigint;
    decimalsA: number;
    decimalsB: number;
    underlyingAmounts?: {
      amountA: string;
      amountB: string;
    };
  }>;
  totalPositions: number;
  hasMore: boolean;
  totalValue: string;
}> => {
  // Get all unique token addresses
  const allTokens = [...new Set([...portfolio.tokenAs, ...portfolio.tokenBs])];
  const tokensInfo = await getTokensInfo(allTokens);
  
  let totalValue = BigInt(0);
  
  const positions = portfolio.tokenAs.map((tokenA, index) => {
    const tokenB = portfolio.tokenBs[index];
    const lpBalance = portfolio.lpBalances[index];
    const sharePercentage = portfolio.sharePercentages[index];
    
    const tokenAInfo = tokensInfo[tokenA];
    const tokenBInfo = tokensInfo[tokenB];
    
    // Add to total value (simplified calculation)
    totalValue += lpBalance;
    
    return {
      tokenA,
      tokenB,
      symbolA: tokenAInfo?.symbol || 'Unknown',
      symbolB: tokenBInfo?.symbol || 'Unknown',
      pairName: (tokenAInfo?.symbol && tokenBInfo?.symbol) 
        ? `${tokenAInfo.symbol}/${tokenBInfo.symbol}` 
        : 'Unknown Pair',
      lpBalance: formatTokenAmountSync(lpBalance),
      sharePercentage: formatPercentage(sharePercentage),
      lpBalanceRaw: lpBalance,
      decimalsA: tokenAInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS,
      decimalsB: tokenBInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS,
    };
  });
  
  return {
    positions,
    totalPositions: Number(portfolio.totalPositions),
    hasMore: portfolio.hasMore,
    totalValue: formatTokenAmountSync(totalValue),
  };
};

// ================================
//     UQ112x112 UTILITY FUNCTIONS
// ================================

/**
 * UQ112x112 utility functions for advanced operations
 */
export const UQ112x112Utils = {
  /**
   * Convert a decimal string to UQ112x112 format
   */
  fromDecimal: (decimal: string, decimals: number = AMM_CONSTANTS.DEFAULT_DECIMALS): bigint => {
    const value = PrecisionMath.parseToBigInt(decimal, decimals);
    const normalized = PrecisionMath.scaleDecimals(value, decimals, AMM_CONSTANTS.DEFAULT_DECIMALS);
    return UQ112x112.encode(normalized / (BigInt(10) ** BigInt(AMM_CONSTANTS.DEFAULT_DECIMALS)));
  },

  /**
   * Convert UQ112x112 format to decimal string
   */
  toDecimal: (encoded: bigint, decimals: number = AMM_CONSTANTS.DEFAULT_DECIMALS): string => {
    const decoded = UQ112x112.decode(encoded);
    return PrecisionMath.formatBigIntWithDecimals(decoded, 0, decimals);
  },

  /**
   * Calculate time-weighted average price (TWAP) using UQ112x112
   */
  calculateTWAP: (
    price0CumulativeLast: bigint,
    price0CumulativeNow: bigint,
    timeElapsed: number
  ): bigint => {
    if (timeElapsed === 0) return BigInt(0);
    
    const priceDiff = price0CumulativeNow - price0CumulativeLast;
    return priceDiff / BigInt(timeElapsed);
  },

  /**
   * Calculate geometric mean for AMM invariant
   */
  geometricMean: UQ112x112.geometricMean,

  /**
   * Calculate square root with UQ112x112 precision
   */
  sqrt: UQ112x112.sqrt,

  /**
   * Convert between different decimal precisions
   */
  convertPrecision: (
    value: bigint,
    fromDecimals: number,
    toDecimals: number
  ): bigint => {
    return PrecisionMath.scaleDecimals(value, fromDecimals, toDecimals);
  },

  /**
   * Check if a value would overflow UQ112x112
   */
  wouldOverflow: (value: bigint): boolean => {
    try {
      UQ112x112.encode(value);
      return false;
    } catch {
      return true;
    }
  }
};

// ================================
//     ERROR HANDLING
// ================================

/**
 * Parse contract error with enhanced error detection
 */
export const parseAMMError = (error: Error): string => {
  const message = error.message.toLowerCase();
  
  if (message.includes('insufficient')) {
    if (message.includes('liquidity')) return 'Insufficient liquidity in pool';
    if (message.includes('balance')) return 'Insufficient token balance';
    return 'Insufficient funds';
  }
  
  if (message.includes('slippage')) return 'Slippage tolerance exceeded';
  if (message.includes('deadline')) return 'Transaction deadline exceeded';
  if (message.includes('pool') && message.includes('not exist')) return 'Pool does not exist';
  if (message.includes('locked')) return 'Liquidity is locked';
  if (message.includes('zero')) return 'Amount cannot be zero';
  if (message.includes('overflow')) return 'Amount too large for calculation';
  if (message.includes('precision')) return 'Precision error in calculation';
  if (message.includes('uq112x112')) return 'Fixed-point arithmetic error';
  
  return 'Transaction failed';
};

// ================================
//     UTILITIES
// ================================

/**
 * Check if address is zero address
 */
export const isZeroAddress = (address: Address): boolean => {
  return address === AMM_CONSTANTS.ZERO_ADDRESS;
};

/**
 * Sort token addresses consistently
 */
export const sortTokens = (tokenA: Address, tokenB: Address): [Address, Address] => {
  return tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
};

/**
 * Generate pair identifier
 */
export const getPairId = (tokenA: Address, tokenB: Address): string => {
  const [token0, token1] = sortTokens(tokenA, tokenB);
  return `${token0}-${token1}`;
};

/**
 * Format transaction summary with dynamic decimals and enhanced precision
 */
export const createAMMTransactionSummary = async (
  type: 'swap' | 'add' | 'remove', 
  params: any
) => {
  const tokensToFetch = [];
  
  // Collect token addresses based on transaction type
  if (type === 'swap') {
    if (params.tokenInAddress) tokensToFetch.push(params.tokenInAddress);
    if (params.tokenOutAddress) tokensToFetch.push(params.tokenOutAddress);
  } else {
    if (params.tokenAAddress) tokensToFetch.push(params.tokenAAddress);
    if (params.tokenBAddress) tokensToFetch.push(params.tokenBAddress);
  }
  
  const tokensInfo = tokensToFetch.length > 0 ? await getTokensInfo(tokensToFetch) : {};
  
  switch (type) {
    case 'swap':
      const tokenInInfo = params.tokenInAddress ? tokensInfo[params.tokenInAddress] : null;
      const tokenOutInfo = params.tokenOutAddress ? tokensInfo[params.tokenOutAddress] : null;
      
      return {
        type: 'Token Swap',
        description: `Swap ${formatTokenAmountSync(params.amountIn, tokenInInfo?.decimals)} ${tokenInInfo?.symbol || params.tokenInSymbol} for ${formatTokenAmountSync(params.amountOut, tokenOutInfo?.decimals)} ${tokenOutInfo?.symbol || params.tokenOutSymbol}`,
        details: {
          'Amount In': `${formatTokenAmountSync(params.amountIn, tokenInInfo?.decimals)} ${tokenInInfo?.symbol || params.tokenInSymbol}`,
          'Expected Out': `${formatTokenAmountSync(params.amountOut, tokenOutInfo?.decimals)} ${tokenOutInfo?.symbol || params.tokenOutSymbol}`,
          'Minimum Out': `${formatTokenAmountSync(params.amountOutMin, tokenOutInfo?.decimals)} ${tokenOutInfo?.symbol || params.tokenOutSymbol}`,
          'Slippage': `${params.slippage}%`,
          'Price Impact': formatPercentagePrecise(params.priceImpact),
          'Exchange Rate': `1 ${tokenInInfo?.symbol} = ${formatPricePrecise(params.exchangeRate)} ${tokenOutInfo?.symbol}`,
        }
      };
      
    case 'add':
      const tokenAInfo = params.tokenAAddress ? tokensInfo[params.tokenAAddress] : null;
      const tokenBInfo = params.tokenBAddress ? tokensInfo[params.tokenBAddress] : null;
      
      return {
        type: 'Add Liquidity',
        description: `Add ${formatTokenAmountSync(params.amountA, tokenAInfo?.decimals)} ${tokenAInfo?.symbol || params.tokenASymbol} + ${formatTokenAmountSync(params.amountB, tokenBInfo?.decimals)} ${tokenBInfo?.symbol || params.tokenBSymbol}`,
        details: {
          'Amount A': `${formatTokenAmountSync(params.amountA, tokenAInfo?.decimals)} ${tokenAInfo?.symbol || params.tokenASymbol}`,
          'Amount B': `${formatTokenAmountSync(params.amountB, tokenBInfo?.decimals)} ${tokenBInfo?.symbol || params.tokenBSymbol}`,
          'LP Tokens': formatTokenAmountSync(params.liquidity),
          'Pool Share': `${calculatePoolShare(params.liquidity, params.totalSupply).toFixed(6)}%`,
          'Exchange Rate': `1 ${tokenAInfo?.symbol} = ${formatPoolRatio(params.amountA, params.amountB, tokenAInfo?.decimals, tokenBInfo?.decimals)} ${tokenBInfo?.symbol}`,
        }
      };
      
    case 'remove':
      return {
        type: 'Remove Liquidity',
        description: `Remove ${formatTokenAmountSync(params.lpAmount)} LP tokens`,
        details: {
          'LP Tokens': formatTokenAmountSync(params.lpAmount),
          'Expected A': `${formatTokenAmountSync(params.amountA)} ${params.tokenASymbol}`,
          'Expected B': `${formatTokenAmountSync(params.amountB)} ${params.tokenBSymbol}`,
          'Minimum A': `${formatTokenAmountSync(params.amountAMin)} ${params.tokenASymbol}`,
          'Minimum B': `${formatTokenAmountSync(params.amountBMin)} ${params.tokenBSymbol}`,
          'Pool Share': `${calculatePoolShare(params.lpAmount, params.totalSupply).toFixed(6)}%`,
        }
      };
      
    default:
      return { type: 'Unknown', description: '', details: {} };
  }
};

// ================================
//     BATCH OPERATIONS WITH PRECISION
// ================================

/**
 * Format multiple token amounts at once with enhanced precision
 */
export const formatTokenAmountsBatch = async (
  amounts: Array<{ amount: bigint; tokenAddress?: Address; displayDecimals?: number }>
): Promise<string[]> => {
  // Get all unique token addresses
  const tokenAddresses = amounts
    .map(item => item.tokenAddress)
    .filter((addr): addr is Address => !!addr);
  
  const uniqueAddresses = [...new Set(tokenAddresses)];
  const tokensInfo = uniqueAddresses.length > 0 ? await getTokensInfo(uniqueAddresses) : {};
  
  return amounts.map(({ amount, tokenAddress, displayDecimals = 6 }) => {
    const decimals = tokenAddress && tokensInfo[tokenAddress] 
      ? tokensInfo[tokenAddress].decimals 
      : AMM_CONSTANTS.DEFAULT_DECIMALS;
    
    return formatTokenAmountPrecise(amount, decimals, displayDecimals);
  });
};

/**
 * Parse multiple token amounts at once with enhanced precision
 */
export const parseTokenAmountsBatch = async (
  amounts: Array<{ amount: string; tokenAddress?: Address }>
): Promise<bigint[]> => {
  // Get all unique token addresses
  const tokenAddresses = amounts
    .map(item => item.tokenAddress)
    .filter((addr): addr is Address => !!addr);
  
  const uniqueAddresses = [...new Set(tokenAddresses)];
  const tokensInfo = uniqueAddresses.length > 0 ? await getTokensInfo(uniqueAddresses) : {};
  
  return amounts.map(({ amount, tokenAddress }) => {
    const decimals = tokenAddress && tokensInfo[tokenAddress] 
      ? tokensInfo[tokenAddress].decimals 
      : AMM_CONSTANTS.DEFAULT_DECIMALS;
    
    return PrecisionMath.parseToBigInt(amount, decimals);
  });
};

/**
 * Get pool reserves with proper decimal formatting and enhanced precision
 */
export const getFormattedPoolReserves = async (
  reserveA: bigint,
  reserveB: bigint,
  tokenA: Address,
  tokenB: Address
): Promise<{
  reserveA: string;
  reserveB: string;
  reserveARaw: bigint;
  reserveBRaw: bigint;
  decimalsA: number;
  decimalsB: number;
  priceRatio: string;
  inversePriceRatio: string;
  constantProduct: string;
}> => {
  const tokensInfo = await getTokensInfo([tokenA, tokenB]);
  
  const tokenAInfo = tokensInfo[tokenA];
  const tokenBInfo = tokensInfo[tokenB];
  
  const decimalsA = tokenAInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS;
  const decimalsB = tokenBInfo?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS;
  
  const priceRatio = formatPoolRatio(reserveA, reserveB, decimalsA, decimalsB);
  const inversePriceRatio = formatPoolRatio(reserveB, reserveA, decimalsB, decimalsA);
  const constantProduct = formatTokenAmountPrecise(calculateConstantProduct(reserveA, reserveB), decimalsA + decimalsB);
  
  return {
    reserveA: formatTokenAmountPrecise(reserveA, decimalsA),
    reserveB: formatTokenAmountPrecise(reserveB, decimalsB),
    reserveARaw: reserveA,
    reserveBRaw: reserveB,
    decimalsA,
    decimalsB,
    priceRatio,
    inversePriceRatio,
    constantProduct,
  };
};

/**
 * Calculate swap amounts with UQ112x112 precision (mirrors Uniswap V2 logic)
 */
export const calculateSwapAmountsOut = (
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  fee: number = 997 // 0.3% fee, so 99.7% remains
): { amountOut: bigint; priceImpact: bigint; newReserveIn: bigint; newReserveOut: bigint } => {
  if (amountIn <= BigInt(0) || reserveIn <= BigInt(0) || reserveOut <= BigInt(0)) {
    throw new Error('Invalid input amounts');
  }
  
  // Calculate amount out with fee: amountOut = (amountIn * fee * reserveOut) / (reserveIn * 1000 + amountIn * fee)
  const amountInWithFee = amountIn * BigInt(fee);
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * BigInt(1000) + amountInWithFee;
  const amountOut = numerator / denominator;
  
  if (amountOut >= reserveOut) {
    throw new Error('Insufficient liquidity');
  }
  
  const newReserveIn = reserveIn + amountIn;
  const newReserveOut = reserveOut - amountOut;
  
  // Calculate price impact using UQ112x112
  const oldPriceEncoded = UQ112x112.calculatePriceRatio(reserveIn, reserveOut);
  const newPriceEncoded = UQ112x112.calculatePriceRatio(newReserveIn, newReserveOut);
  
  const priceDiff = newPriceEncoded > oldPriceEncoded 
    ? newPriceEncoded - oldPriceEncoded 
    : oldPriceEncoded - newPriceEncoded;
  
  const priceImpact = PrecisionMath.calculatePercentage(priceDiff, oldPriceEncoded, 4);
  
  return {
    amountOut,
    priceImpact,
    newReserveIn,
    newReserveOut,
  };
};

/**
 * Calculate swap amounts in (reverse calculation)
 */
export const calculateSwapAmountsIn = (
  amountOut: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  fee: number = 997
): { amountIn: bigint; priceImpact: bigint; newReserveIn: bigint; newReserveOut: bigint } => {
  if (amountOut <= BigInt(0) || reserveIn <= BigInt(0) || reserveOut <= BigInt(0)) {
    throw new Error('Invalid input amounts');
  }
  
  if (amountOut >= reserveOut) {
    throw new Error('Amount out exceeds reserve');
  }
  
  // Calculate amount in: amountIn = (reserveIn * amountOut * 1000) / ((reserveOut - amountOut) * fee) + 1
  const numerator = reserveIn * amountOut * BigInt(1000);
  const denominator = (reserveOut - amountOut) * BigInt(fee);
  const amountIn = numerator / denominator + BigInt(1);
  
  const newReserveIn = reserveIn + amountIn;
  const newReserveOut = reserveOut - amountOut;
  
  // Calculate price impact
  const oldPriceEncoded = UQ112x112.calculatePriceRatio(reserveIn, reserveOut);
  const newPriceEncoded = UQ112x112.calculatePriceRatio(newReserveIn, newReserveOut);
  
  const priceDiff = newPriceEncoded > oldPriceEncoded 
    ? newPriceEncoded - oldPriceEncoded 
    : oldPriceEncoded - newPriceEncoded;
  
  const priceImpact = PrecisionMath.calculatePercentage(priceDiff, oldPriceEncoded, 4);
  
  return {
    amountIn,
    priceImpact,
    newReserveIn,
    newReserveOut,
  };
};

// ================================
//     HOOK HELPERS WITH PRECISION
// ================================

/**
 * Create a hook-friendly formatter with cached token info and enhanced precision
 */
export const createTokenFormatter = (tokensInfo: Record<Address, TokenInfo>) => ({
  formatAmount: (amount: bigint, tokenAddress: Address, displayDecimals = 6) => {
    const decimals = tokensInfo[tokenAddress]?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS;
    return formatTokenAmountPrecise(amount, decimals, displayDecimals);
  },
  
  parseAmount: (amount: string, tokenAddress: Address) => {
    const decimals = tokensInfo[tokenAddress]?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS;
    return PrecisionMath.parseToBigInt(amount, decimals);
  },
  
  getSymbol: (tokenAddress: Address) => {
    return tokensInfo[tokenAddress]?.symbol || 'Unknown';
  },
  
  getDecimals: (tokenAddress: Address) => {
    return tokensInfo[tokenAddress]?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS;
  },
  
  formatPairName: (tokenA: Address, tokenB: Address) => {
    const symbolA = tokensInfo[tokenA]?.symbol || 'Unknown';
    const symbolB = tokensInfo[tokenB]?.symbol || 'Unknown';
    return `${symbolA}/${symbolB}`;
  },
  
  formatPrice: (price: bigint, tokenAddress: Address, displayDecimals = 8) => {
    const decimals = tokensInfo[tokenAddress]?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS;
    return formatTokenAmountPrecise(price, decimals, displayDecimals);
  },
  
  calculateRatio: (amountA: bigint, amountB: bigint, tokenA: Address, tokenB: Address) => {
    const decimalsA = tokensInfo[tokenA]?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS;
    const decimalsB = tokensInfo[tokenB]?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS;
    return formatPoolRatio(amountA, amountB, decimalsA, decimalsB);
  }
});

// ================================
//     PRICE UTILITIES WITH PRECISION
// ================================

/**
 * Calculate exchange rate between two tokens with UQ112x112 precision
 */
export const calculateExchangeRate = async (
  reserveA: bigint,
  reserveB: bigint,
  tokenA: Address,
  tokenB: Address
): Promise<{
  rate: string;
  inverseRate: string;
  rateNumber: number;
  inverseRateNumber: number;
  ratePrecise: bigint;
  inverseRatePrecise: bigint;
}> => {
  const tokensInfo = await getTokensInfo([tokenA, tokenB]);
  
  const decimalsA = tokensInfo[tokenA]?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS;
  const decimalsB = tokensInfo[tokenB]?.decimals || AMM_CONSTANTS.DEFAULT_DECIMALS;
  
  // Calculate precise ratios using UQ112x112
  const ratePrecise = UQ112x112.calculatePriceRatio(reserveA, reserveB);
  const inverseRatePrecise = UQ112x112.calculatePriceRatio(reserveB, reserveA);
  
  // Format for display
  const rate = formatUQ112x112(ratePrecise, AMM_CONSTANTS.RATIO_PRECISION_DECIMALS, 8);
  const inverseRate = formatUQ112x112(inverseRatePrecise, AMM_CONSTANTS.RATIO_PRECISION_DECIMALS, 8);
  
  // Convert to numbers for backward compatibility
  const reserveAFormatted = Number(formatUnits(reserveA, decimalsA));
  const reserveBFormatted = Number(formatUnits(reserveB, decimalsB));
  const rateNumber = reserveBFormatted / reserveAFormatted;
  const inverseRateNumber = reserveAFormatted / reserveBFormatted;
  
  return {
    rate: rate.replace(/\.?0+$/, ''),
    inverseRate: inverseRate.replace(/\.?0+$/, ''),
    rateNumber,
    inverseRateNumber,
    ratePrecise,
    inverseRatePrecise,
  };
};

/**
 * Format price with automatic precision based on magnitude
 */
export const formatPriceAuto = (price: number | bigint, isUQ112x112 = false): string => {
  let value: number;
  
  if (typeof price === 'bigint') {
    if (isUQ112x112) {
      const decoded = UQ112x112.decode(price);
      value = Number(formatUnits(decoded, AMM_CONSTANTS.DEFAULT_DECIMALS));
    } else {
      value = Number(formatUnits(price, AMM_CONSTANTS.DEFAULT_DECIMALS));
    }
  } else {
    value = price;
  }
  
  if (value === 0) return '0';
  
  const absPrice = Math.abs(value);
  let decimals: number;
  
  if (absPrice >= 1000) decimals = 2;
  else if (absPrice >= 100) decimals = 3;
  else if (absPrice >= 1) decimals = 4;
  else if (absPrice >= 0.01) decimals = 6;
  else decimals = 8;
  
  return value.toFixed(decimals).replace(/\.?0+$/, '');
};

/**
 * Calculate price impact for display with multiple precision levels
 */
export const calculatePriceImpactLevels = (
  priceImpactBasisPoints: bigint
): {
  level: 'low' | 'medium' | 'high' | 'very-high';
  percentage: string;
  warning: string;
  color: string;
} => {
  const impactNumber = Number(priceImpactBasisPoints) / 100;
  
  if (impactNumber < 0.1) {
    return {
      level: 'low',
      percentage: `${impactNumber.toFixed(4)}%`,
      warning: 'Low price impact',
      color: '#10B981' // green
    };
  } else if (impactNumber < 1) {
    return {
      level: 'medium',
      percentage: `${impactNumber.toFixed(3)}%`,
      warning: 'Medium price impact',
      color: '#F59E0B' // yellow
    };
  } else if (impactNumber < 5) {
    return {
      level: 'high',
      percentage: `${impactNumber.toFixed(2)}%`,
      warning: 'High price impact',
      color: '#EF4444' // red
    };
  } else {
    return {
      level: 'very-high',
      percentage: `${impactNumber.toFixed(2)}%`,
      warning: 'Very high price impact',
      color: '#DC2626' // dark red
    };
  }
};

// ================================
//     CACHE UTILITIES WITH PRECISION
// ================================

/**
 * Pre-warm cache with token information
 */
export const preloadTokensInfo = async (tokenAddresses: Address[]): Promise<void> => {
  if (tokenAddresses.length === 0) return;
  
  const uncachedTokens = tokenAddresses.filter(addr => !tokenInfoCache.has(addr));
  
  if (uncachedTokens.length > 0) {
    await getTokensInfo(uncachedTokens);
  }
};

/**
 * Clear the token info cache
 */
export const clearTokenCache = (): void => {
  tokenInfoCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = (): { size: number; addresses: Address[] } => {
  return {
    size: tokenInfoCache['cache'].size,
    addresses: Array.from(tokenInfoCache['cache'].keys()),
  };
};

/**
 * Warm cache with commonly used token pairs
 */
export const warmCacheWithCommonPairs = async (
  commonPairs: Array<[Address, Address]>
): Promise<void> => {
  const allTokens = [...new Set(commonPairs.flat())];
  await preloadTokensInfo(allTokens);
};

// ================================
//     ADVANCED AMM CALCULATIONS
// ================================

/**
 * Calculate impermanent loss with UQ112x112 precision
 */
export const calculateImpermanentLoss = (
  initialPriceRatio: bigint,
  currentPriceRatio: bigint
): { lossPercentage: string; lossAmount: bigint } => {
  if (initialPriceRatio === BigInt(0)) {
    throw new Error('Initial price ratio cannot be zero');
  }
  
  // Calculate price change ratio
  const priceChangeRatio = UQ112x112.div(currentPriceRatio, initialPriceRatio);
  
  // IL formula: IL = 2 * sqrt(r) / (1 + r) - 1
  // Where r is the price change ratio
  const sqrtR = UQ112x112.sqrt(priceChangeRatio);
  const numerator = sqrtR * BigInt(2);
  const denominator = UQ112x112.encode(BigInt(1)) + priceChangeRatio;
  const ratio = UQ112x112.div(numerator, denominator);
  
  // Convert to loss percentage
  const lossAmount = UQ112x112.encode(BigInt(1)) - ratio;
  const lossPercentage = formatPercentagePrecise(lossAmount, 4, AMM_CONSTANTS.PRICE_PRECISION_DECIMALS);
  
  return { lossPercentage, lossAmount };
};

/**
 * Calculate optimal arbitrage amount
 */
export const calculateArbitrageAmount = (
  reserveA: bigint,
  reserveB: bigint,
  externalPriceRatio: bigint
): bigint => {
  // Using the square root formula for optimal arbitrage
  const product = calculateConstantProduct(reserveA, reserveB);
  const sqrtProduct = UQ112x112.sqrt(product);
  const sqrtPrice = UQ112x112.sqrt(externalPriceRatio);
  
  return UQ112x112.div(sqrtProduct, sqrtPrice) - reserveA;
};

/**
 * Calculate fee earnings for liquidity providers
 */
export const calculateFeeEarnings = (
  lpBalance: bigint,
  totalSupply: bigint,
  totalFeesCollected: bigint
): bigint => {
  if (totalSupply === BigInt(0)) return BigInt(0);
  
  return UQ112x112.mulDiv(lpBalance, totalFeesCollected, totalSupply);
};

/**
 * Convert basis points to percentage
 * @param basisPoints - Value in basis points (e.g., 1842 for 1.842%)
 * @returns Percentage as decimal (e.g., 1.842 for 1.842%)
 */
export const formatSlippageFromBasisPoints = (basisPoints: number): number => {
  return basisPoints / AMM_CONSTANTS.BASIS_POINTS;
};

/**
 * Convert percentage to basis points
 * @param percentage - Percentage as decimal (e.g., 1.842 for 1.842%)
 * @returns Value in basis points (e.g., 1842)
 */
export const formatSlippageToBasisPoints = (percentage: number): number => {
  return Math.floor(percentage * AMM_CONSTANTS.BASIS_POINTS);
};

/**
 * Format slippage percentage for display
 * @param basisPoints - Slippage in basis points
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted percentage string (e.g., "1.84%")
 */
export const formatSlippageForDisplay = (basisPoints: number, decimals: number = 2): string => {
  const percentage = formatSlippageFromBasisPoints(basisPoints);
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Get slippage warning message based on basis points
 * @param basisPoints - Slippage in basis points
 * @returns Warning message or null if no warning needed
 */
export const getSlippageWarning = (basisPoints: number): string | null => {
  const percentage = formatSlippageFromBasisPoints(basisPoints);
  
  if (percentage > 15) return 'Price impact too high (>15%)';
  if (percentage > 5) return 'High price impact warning';
  if (percentage > 2) return 'Moderate price impact';
  return null;
};

export const AMMFormatters = {
  // Constants
  CONSTANTS: AMM_CONSTANTS,
  ERROR_CODES: AMM_ERROR_CODES,
  
  // Initialization
  initialize: initializeAMMFormatters,
  
  // UQ112x112 Library
  UQ112x112,
  UQ112x112Utils,
  PrecisionMath,
  
  // Token Info
  getTokenDecimals,
  getTokenSymbol,
  getTokensInfo,
  preloadTokensInfo,
  clearTokenCache,
  getCacheStats,
  warmCacheWithCommonPairs,
  
  // Enhanced Precision Formatting
  formatTokenAmountPrecise,
  formatLargeNumberPrecise,
  formatUQ112x112,
  formatPricePrecise,
  formatPercentagePrecise,
  formatPoolRatio,
  formatPriceAuto,
  formatTimeRemaining,
  
  // Formatting (Async with dynamic decimals)
  formatTokenAmount,
  parseTokenAmount,
  formatPrice,
  
  // Formatting (Sync with known decimals)
  formatTokenAmountSync,
  parseTokenAmountSync,
  formatPercentage,
  parsePercentage,
  formatLargeNumber,
  formatAddress,
  
  // Batch Operations
  formatTokenAmountsBatch,
  parseTokenAmountsBatch,
  getFormattedPoolReserves,
  
  // Enhanced Calculations
  calculatePriceImpactPrecise,
  calculatePriceImpact,
  calculatePoolSharePrecise,
  calculatePoolShare,
  calculateAPRPrecise,
  calculateAPR,
  calculateLiquidityValuePrecise,
  calculateConstantProduct,
  calculateOptimalLiquidityAmounts,
  calculateSwapAmountsOut,
  calculateSwapAmountsIn,
  calculateImpermanentLoss,
  calculateArbitrageAmount,
  calculateFeeEarnings,
  createDeadline,
  calculateMinAmountOutPrecise,
  calculateMinAmountOut,
  calculateExchangeRate,
  calculatePriceImpactLevels,
  
  // Enhanced Validation
  validateSlippage, // Your existing function - keep as is
  validateDeadline,
  validateTokenAmount,
  validateUQ112x112,
  validatePoolReserves,
  
  // Enhanced Parsing
  parsePoolData,
  parseLiquidityLock,
  parseUserPortfolio,
  
  // Error handling
  parseAMMError,
  
  // Utilities
  isZeroAddress,
  sortTokens,
  getPairId,
  createAMMTransactionSummary,
  createTokenFormatter,
  
  // NEW: Basis Points Functions (ADD THESE 4 LINES)
  formatSlippageFromBasisPoints,
  formatSlippageToBasisPoints,
  formatSlippageForDisplay,
  getSlippageWarning,
} as const;