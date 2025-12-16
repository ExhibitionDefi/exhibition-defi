import { type Address } from 'viem';
import { logger } from './logger.ts';

// ================================
//     CONSTANTS
// ================================

export const AMM_CONSTANTS = {
  DEFAULT_DECIMALS: 18,
  MIN_LIQUIDITY_DISPLAY: 0.000001,
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000' as Address,
} as const;

// ================================
//     PRECISION UTILITIES
// ================================

/**
 * High precision math utilities for AMM calculations
 */
export class PrecisionMath {
  /**
   * Format BigInt with decimal places, removing trailing zeros
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
//     INITIALIZATION (Stub for backward compatibility)
// ================================

/**
 * Initialize stub - not needed in minimal version
 */
export const initializeAMMFormatters = (): void => {
  // No-op in minimal version - we don't need contract config
  // for the basic formatting functions
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
  displayDecimals: number = 6
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

    if (value === BigInt(0)) return '0';

    // Use precision math for formatting
    const formatted = PrecisionMath.formatBigIntWithDecimals(value, decimals, displayDecimals);
    
    const num = parseFloat(formatted);
    if (num < AMM_CONSTANTS.MIN_LIQUIDITY_DISPLAY && num > 0) {
      return `< ${AMM_CONSTANTS.MIN_LIQUIDITY_DISPLAY}`;
    }

    return formatted;
  } catch (error) {
    logger.warn('Error in formatTokenAmountPrecise:', error);
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
 * Format address for display
 */
export const formatAddress = (address: Address, chars: number = 6): string => {
  if (!address) return '';
  if (address === AMM_CONSTANTS.ZERO_ADDRESS) return 'Zero Address';
  
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// ================================
//     EXPORT ALL UTILITIES
// ================================

export const AMMFormatters = {
  CONSTANTS: AMM_CONSTANTS,
  PrecisionMath,
  
  // Initialization (stub)
  initialize: initializeAMMFormatters,
  
  // Formatting functions
  formatTokenAmountPrecise,
  formatTokenAmountSync,
  formatAddress,
} as const;

export default AMMFormatters;