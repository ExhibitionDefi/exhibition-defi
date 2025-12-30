import { formatUnits, parseUnits } from 'viem';
import type { ProjectFormData } from '../types/project';
import { logger } from './logger';

// ========================================
// ENUMS AND TYPES
// ========================================

export const ProjectStatus = {
  Upcoming: 0,
  Active: 1,
  Successful: 2,
  Failed: 3,
  Claimable: 4,
  Refundable: 5,
  Completed: 6
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

// ========================================
// CONSTANTS
// ========================================

export const EXHIBITION_CONSTANTS = {
  MIN_TOKEN_PRICE: parseUnits('0.000001', 18),
  MAX_TOKEN_PRICE: parseUnits('1000000', 18),
  PRICE_DECIMALS: 18,
  MIN_LIQUIDITY_PERCENTAGE: 7000n, // 70%
  MAX_LIQUIDITY_PERCENTAGE: 10000n, // 100%
  FEE_DENOMINATOR: 10000n,
  BASIS_POINTS_DENOMINATOR: 10000n,
  MIN_START_DELAY: 15n * 60n, // 15 minutes
  MAX_PROJECT_DURATION: 7n * 24n * 60n * 60n, // 7 days
  MIN_LOCK_DURATION: 14n * 24n * 60n * 60n, // 14 days
  WITHDRAWAL_DELAY: 24n * 60n * 60n, // 1 day
} as const;

// ========================================
// FORMATTING FUNCTIONS
// ========================================

/**
 * Format token amount from wei to human readable format
 */
export function formatTokenAmount(
  amount: bigint | string,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  if (typeof amount === 'string') {
    amount = BigInt(amount);
  }
  
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  
  if (num < 0.0001) {
    return num.toFixed(8).replace(/\.?0+$/, '');
  }
  
  return num.toFixed(displayDecimals).replace(/\.?0+$/, '');
}

/**
 * Parse token amount to wei/bigint with proper decimals
 */
export const parseTokenAmount = (amount: string, decimals: number): bigint => {
  if (!amount || amount === '0' || amount === '') {
    return 0n;
  }
  
  try {
    const cleanAmount = amount.trim();
    return parseUnits(cleanAmount, decimals);
  } catch (error) {
    logger.error('Failed to parse token amount:', { amount, decimals, error });
    throw new Error(`Invalid token amount: ${amount}`);
  }
};

/**
 * Format percentage from basis points
 */
export function formatPercentage(
  basisPoints: bigint | string | number,
  decimals: number = 2
): string {
  const bp = typeof basisPoints === 'bigint' ? basisPoints : BigInt(basisPoints);
  const percentage = Number(bp) / 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Parse percentage to basis points (10000 = 100%)
 */
export const parsePercentage = (percentage: string): bigint => {
  if (!percentage || percentage === '0' || percentage === '') {
    return 0n;
  }
  
  try {
    const pct = parseFloat(percentage);
    
    if (isNaN(pct) || pct < 0 || pct > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    
    return BigInt(Math.floor(pct * 100));
  } catch (error) {
    logger.error('Failed to parse percentage:', { percentage, error });
    throw new Error(`Invalid percentage: ${percentage}`);
  }
};

/**
 * Format timestamp to human readable date
 */
export function formatTimestamp(timestamp: bigint | string | number): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : Number(timestamp);
  return new Date(ts * 1000).toLocaleString();
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: bigint | string | number): string {
  const secs = typeof seconds === 'bigint' ? Number(seconds) : Number(seconds);
  
  if (secs === 0) return '0 seconds';
  
  const days = Math.floor(secs / (24 * 60 * 60));
  const hours = Math.floor((secs % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((secs % (60 * 60)) / 60);
  const remainingSeconds = secs % 60;
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (remainingSeconds > 0 && parts.length < 2) {
    parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
  }
  
  if (parts.length === 0) return '0 seconds';
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

// ========================================
// CALCULATION HELPERS
// ========================================

/**
 * Scale amount between different decimal places
 */
export function scaleToDecimals(
  amount: bigint,
  fromDecimals: number,
  toDecimals: number
): bigint {
  if (fromDecimals === toDecimals) {
    return amount;
  }
  
  if (fromDecimals < toDecimals) {
    const decimalDiff = toDecimals - fromDecimals;
    const scaleFactor = 10n ** BigInt(decimalDiff);
    return amount * scaleFactor;
  } else {
    const decimalDiff = fromDecimals - toDecimals;
    const scaleFactor = 10n ** BigInt(decimalDiff);
    return amount / scaleFactor;
  }
}

/**
 * Calculate tokens due based on contribution, price, and decimals
 * MATCHES CONTRACT LOGIC: Always scales to 18 decimals first
 */
export function calculateTokensDue(
  contributorContribution: bigint,
  tokenPrice: bigint,
  contributionDecimals: number,
  projectDecimals: number
): bigint {
  if (contributorContribution === 0n) return 0n;
  
  // ✅ FIXED: Always scale to 18 decimals (matching contract)
  const contributionIn18Decimals = scaleToDecimals(
    contributorContribution,
    contributionDecimals,
    18  // Always 18, not projectDecimals
  );
  
  // Calculate tokens in 18 decimals
  const tokensIn18Decimals = (contributionIn18Decimals * parseUnits('1', 18)) / tokenPrice;
  
  // Scale to project token decimals
  return scaleToDecimals(tokensIn18Decimals, 18, projectDecimals);
}

/**
 * Calculate platform fee amount
 */
export function calculatePlatformFee(
  totalRaised: bigint,
  feePercentage: bigint
): bigint {
  return (totalRaised * feePercentage) / EXHIBITION_CONSTANTS.FEE_DENOMINATOR;
}

/**
 * Calculate liquidity amounts
 * UPDATED: Uses fixed calculateTokensDue function
 */
export function calculateLiquidityAmounts(
  totalRaised: bigint,
  platformFeePercentage: bigint,
  liquidityPercentage: bigint,
  tokenPrice: bigint,
  contributionDecimals: number,
  projectDecimals: number
): {
  platformFeeAmount: bigint;
  netRaisedAfterFee: bigint;
  contributionTokensForLiquidity: bigint;
  projectTokensForLiquidity: bigint;
  remainingForOwner: bigint;
} {
  // 1. Calculate platform fee
  const platformFeeAmount = calculatePlatformFee(totalRaised, platformFeePercentage);
  
  // 2. Calculate net raised after fee
  const netRaisedAfterFee = totalRaised - platformFeeAmount;
  
  // 3. Calculate contribution tokens for liquidity
  const contributionTokensForLiquidity = (netRaisedAfterFee * liquidityPercentage) / EXHIBITION_CONSTANTS.BASIS_POINTS_DENOMINATOR;
  
  // 4. Calculate project tokens for liquidity using FIXED calculateTokensDue
  const projectTokensForLiquidity = calculateTokensDue(
    contributionTokensForLiquidity,
    tokenPrice,
    contributionDecimals,
    projectDecimals
  );
  
  // 5. Calculate remaining for owner
  const remainingForOwner = netRaisedAfterFee - contributionTokensForLiquidity;
  
  return {
    platformFeeAmount,
    netRaisedAfterFee,
    contributionTokensForLiquidity,
    projectTokensForLiquidity,
    remainingForOwner
  };
}

// ========================================
// TIME HELPERS
// ========================================

/**
 * Parse duration in DAYS to SECONDS
 */
export const parseDurationToSeconds = (days: string): bigint => {
  if (!days || days === '0' || days === '') {
    return 0n;
  }
  
  try {
    const daysNum = parseFloat(days);
    
    if (isNaN(daysNum) || daysNum < 0) {
      throw new Error('Duration must be a positive number');
    }
    
    const seconds = Math.floor(daysNum * 24 * 60 * 60);
    
    logger.info(`📅 Duration conversion: ${days} days → ${seconds} seconds`);
    
    return BigInt(seconds);
  } catch (error) {
    logger.error('Failed to parse duration:', { days, error });
    throw new Error(`Invalid duration: ${days}`);
  }
};

// ========================================
// DISPLAY HELPERS
// ========================================

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatLargeNumber(
  amount: bigint,
  decimals?: number,
  precision: number = 2,
  symbol?: string
): string {
  const tokenDecimals = symbol === 'exUSD' ? 6 : (decimals ?? 18);
  
  const num = Number(formatUnits(amount, tokenDecimals));
 
  if (num === 0) return '0';
 
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
 
  if (absNum >= 1e9) {
    return `${sign}${(absNum / 1e9).toFixed(precision).replace(/\.?0+$/, '')}B`;
  } else if (absNum >= 1e6) {
    return `${sign}${(absNum / 1e6).toFixed(precision).replace(/\.?0+$/, '')}M`;
  } else if (absNum >= 1e3) {
    return `${sign}${(absNum / 1e3).toFixed(precision).replace(/\.?0+$/, '')}K`;
  }
 
  return `${sign}${absNum.toFixed(precision).replace(/\.?0+$/, '')}`;
}

/**
 * Format token amount with symbol
 */
export function formatTokenWithSymbol(
  amount: bigint,
  symbol: string,
  displayDecimals: number = 4
): string {
  const decimals = symbol === 'exUSD' ? 6 : 18;
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return `0 ${symbol}`;
  if (num < 0.0001) return `${num.toExponential(3)} ${symbol}`;
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1_000_000_000) {
    const billions = absNum / 1_000_000_000;
    return `${sign}${billions.toFixed(billions >= 10 ? 1 : 2).replace(/\.?0+$/, '')}B ${symbol}`;
  } else if (absNum >= 1_000_000) {
    const millions = absNum / 1_000_000;
    return `${sign}${millions.toFixed(millions >= 10 ? 1 : 2).replace(/\.?0+$/, '')}M ${symbol}`;
  } else if (absNum >= 1_000) {
    const thousands = absNum / 1_000;
    return `${sign}${thousands.toFixed(thousands >= 10 ? 1 : 2).replace(/\.?0+$/, '')}K ${symbol}`;
  }
  
  return `${num.toFixed(displayDecimals).replace(/\.?0+$/, '')} ${symbol}`;
}

/**
 * Format price with currency pair
 */
export function formatTokenPrice(
  price: bigint,
  projectTokenSymbol: string,
  contributionTokenSymbol: string
): string {
  const formattedPrice = formatTokenAmount(price, 18, 6);
  return `${formattedPrice} ${contributionTokenSymbol} per ${projectTokenSymbol}`;
}

// ========================================
// ERROR HANDLING HELPERS
// ========================================

/**
 * Parse contract error and provide user-friendly message
 */
export function parseContractError(error: any): {
  code: string;
  message: string;
  details?: string;
} {
  const errorString = error?.reason || error?.message || error?.toString() || 'Unknown error';
  
  const errorMap: Record<string, string> = {
    'ZeroAddress': 'Invalid address provided (cannot be zero address)',
    'ZeroAmount': 'Amount cannot be zero',
    'InvalidInput': 'Invalid input parameters provided',
    'ProjectNotFound': 'Project does not exist',
    'NotProjectOwner': 'Only the project owner can perform this action',
    'ProjectNotActive': 'Project is not currently accepting contributions',
    'ContributionTooLow': 'Contribution amount is below the minimum required',
    'ExceedsMaxContribution': 'Contribution would exceed the maximum allowed per user',
    'FundingGoalExceeded': 'Contribution would exceed the project funding goal',
    'CannotContributeToOwnProject': 'Project owners cannot contribute to their own projects',
    'InvalidProjectStatus': 'Project status does not allow this operation',
    'FundingPeriodNotEnded': 'Funding period has not yet ended',
    'ProjectNotSuccessfulForLiquidity': 'Project must be successful to add liquidity',
    'LiquidityAlreadyAdded': 'Liquidity has already been added for this project',
    'InsufficientLiquidityTokensDeposited': 'Insufficient project tokens deposited for liquidity',
    'NoContributionFound': 'No contribution found for this user',
    'NoTokensCurrentlyVested': 'No tokens are currently available for claiming',
    'ProjectNotRefundable': 'Project is not in a refundable state',
    'NoContributionToRefund': 'No contribution found to refund',
    'AlreadyRefunded': 'Refund has already been processed',
    'FaucetCooldownActive': 'Faucet is still on cooldown',
    'FaucetNotConfigured': 'Faucet is not properly configured',
    'TokenNotApprovedAsExhibitionContributionToken': 'Token is not approved for contributions on this platform',
    'InvalidPercentage': 'Invalid percentage value',
    'InvalidStartTime': 'Invalid start time',
    'InvalidProjectDuration': 'Invalid project duration',
    'InvalidLockDuration': 'Lock duration is too short',
    'TokenPriceTooLow': 'Token price is below minimum allowed',
    'TokenPriceTooHigh': 'Token price is above maximum allowed',
    'CalculationOverflow': 'Calculation resulted in overflow',
    'ContributionTooSmall': 'Contribution amount is too small',
    'WithdrawalLocked': 'Withdrawal is currently locked',
    'NoUnsoldTokens': 'No unsold tokens available for withdrawal',
    'InsufficientTokenBalance': 'Insufficient token balance',
    'Unauthorized': 'Unauthorized action'
  };
  
  let errorCode = 'Unknown';
  let userMessage = 'An unexpected error occurred';
  
  for (const [contractError, message] of Object.entries(errorMap)) {
    if (errorString.includes(contractError)) {
      errorCode = contractError;
      userMessage = message;
      break;
    }
  }
  
  if (errorString.includes('insufficient funds')) {
    errorCode = 'InsufficientFunds';
    userMessage = 'Insufficient funds to complete transaction';
  } else if (errorString.includes('gas')) {
    errorCode = 'GasError';
    userMessage = 'Transaction failed due to gas issues';
  } else if (errorString.includes('nonce')) {
    errorCode = 'NonceError';
    userMessage = 'Transaction nonce error';
  } else if (errorString.includes('replacement')) {
    errorCode = 'ReplacementError';
    userMessage = 'Transaction replacement error';
  }
  
  return {
    code: errorCode,
    message: userMessage,
    details: errorString
  };
}

// ========================================
// VALIDATION
// ========================================

export const validateProjectCreationData = (formData: ProjectFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const now = Date.now();
  const startTime = formData.startTime.getTime();
  const endTime = formData.endTime.getTime();
  
  if (startTime <= now + 15 * 60 * 1000) {
    errors.push('Start time must be at least 15 minutes in the future');
  }
  
  if (endTime <= startTime) {
    errors.push('End time must be after start time');
  }
  
  const duration = (endTime - startTime) / (24 * 60 * 60 * 1000);
  if (duration > 7) {
    errors.push('Project duration cannot exceed 7 days');
  }
  
  const fundingGoal = Number(formData.fundingGoal);
  const softCap = Number(formData.softCap);
  const minContribution = Number(formData.minContribution);
  const maxContribution = Number(formData.maxContribution);
  const tokensForSale = Number(formData.amountTokensForSale);
  const totalSupply = Number(formData.initialTotalSupply);
  
  if (softCap > fundingGoal) {
    errors.push('Soft cap cannot exceed hard cap');
  }
  
  if (minContribution > maxContribution) {
    errors.push('Minimum contribution cannot exceed maximum contribution');
  }
  
  if (tokensForSale > totalSupply) {
    errors.push('Tokens for sale cannot exceed total supply');
  }
  
  const liquidityPercentage = Number(formData.liquidityPercentage);
  if (liquidityPercentage < 70 || liquidityPercentage > 100) {
    errors.push('Liquidity percentage must be between 70% and 100%');
  }
  
  const lockDuration = Number(formData.lockDuration);
  if (lockDuration < 30 || lockDuration > 365) {
    errors.push('Lock duration must be between 30 and 365 days');
  }
  
  if (formData.vestingEnabled) {
    const vestingCliff = Number(formData.vestingCliff);
    const vestingDuration = Number(formData.vestingDuration);
    const vestingInterval = Number(formData.vestingInterval);
    const vestingInitialRelease = Number(formData.vestingInitialRelease);
    
    if (vestingCliff < 0) {
      errors.push('Vesting cliff cannot be negative');
    }
    
    if (vestingDuration <= 0) {
      errors.push('Vesting duration must be greater than 0');
    }
    
    if (vestingInterval <= 0) {
      errors.push('Vesting interval must be greater than 0');
    }
    
    if (vestingInitialRelease < 0 || vestingInitialRelease > 100) {
      errors.push('Vesting initial release must be between 0% and 100%');
    }
    
    if (vestingInterval > vestingDuration) {
      errors.push('Vesting interval cannot be longer than vesting duration');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ========================================
// PROJECT CREATION PARAMS
// ========================================

export type ProjectCreationParamsTuple = [
  string,  // _projectTokenName
  string,  // _projectTokenSymbol
  bigint,  // _initialTotalSupply
  string,  // _projectTokenLogoURI
  string,  // _contributionTokenAddress
  bigint,  // _fundingGoal
  bigint,  // _softCap
  bigint,  // _minContribution
  bigint,  // _maxContribution
  bigint,  // _tokenPrice
  bigint,  // _startTime
  bigint,  // _endTime
  bigint,  // _amountTokensForSale
  bigint,  // _liquidityPercentage
  bigint,  // _lockDuration
  boolean, // _vestingEnabled
  bigint,  // _vestingCliff
  bigint,  // _vestingDuration
  bigint,  // _vestingInterval
  bigint   // _vestingInitialRelease
];

export function prepareProjectCreationParams(
  params: {
    projectTokenName: string;
    projectTokenSymbol: string;
    initialTotalSupply: string;
    projectTokenLogoURI: string;
    contributionTokenAddress: string;
    fundingGoal: string;
    softCap: string;
    minContribution: string;
    maxContribution: string;
    tokenPrice: string;
    startTime: Date | bigint;
    endTime: Date | bigint;
    amountTokensForSale: string;
    liquidityPercentage: string;
    lockDuration: string;
    vestingEnabled: boolean;
    vestingCliff?: string;
    vestingDuration?: string;
    vestingInterval?: string;
    vestingInitialRelease?: string;
  },
  tokenDecimals: {
    project: number;
    contribution: number;
  }
): ProjectCreationParamsTuple {
  try {
    logger.info('Input params:', params);
    logger.info('Token decimals:', tokenDecimals);

    if (!params.projectTokenName?.trim()) throw new Error('Project token name is required');
    if (!params.projectTokenSymbol?.trim()) throw new Error('Project token symbol is required');
    if (!params.contributionTokenAddress?.startsWith('0x')) throw new Error('Invalid contribution token address');

    const startTimestamp = typeof params.startTime === 'bigint' 
      ? params.startTime 
      : BigInt(Math.floor(params.startTime.getTime() / 1000));

    const endTimestamp = typeof params.endTime === 'bigint'
      ? params.endTime
      : BigInt(Math.floor(params.endTime.getTime() / 1000));

    const now = BigInt(Math.floor(Date.now() / 1000));
    if (startTimestamp <= now + 900n) {
      throw new Error('Start time must be at least 15 minutes from now');
    }
    if (endTimestamp <= startTimestamp) {
      throw new Error('End time must be after start time');
    }

    const tokenPrice = parseUnits(params.tokenPrice, tokenDecimals.contribution);

    const result: ProjectCreationParamsTuple = [
      params.projectTokenName.trim(),
      params.projectTokenSymbol.trim().toUpperCase(),
      parseTokenAmount(params.initialTotalSupply, tokenDecimals.project),
      params.projectTokenLogoURI || '',
      params.contributionTokenAddress,
      parseTokenAmount(params.fundingGoal, tokenDecimals.contribution),
      parseTokenAmount(params.softCap, tokenDecimals.contribution),
      parseTokenAmount(params.minContribution, tokenDecimals.contribution),
      parseTokenAmount(params.maxContribution, tokenDecimals.contribution),
      tokenPrice,
      startTimestamp,
      endTimestamp,
      parseTokenAmount(params.amountTokensForSale, tokenDecimals.project),
      parsePercentage(params.liquidityPercentage),
      BigInt(Number(params.lockDuration) * 24 * 60 * 60),
      params.vestingEnabled,
      params.vestingEnabled && params.vestingCliff ? parseDurationToSeconds(params.vestingCliff) : 0n,
      params.vestingEnabled && params.vestingDuration ? parseDurationToSeconds(params.vestingDuration) : 0n,
      params.vestingEnabled && params.vestingInterval ? parseDurationToSeconds(params.vestingInterval) : 0n,
      params.vestingEnabled && params.vestingInitialRelease ? parsePercentage(params.vestingInitialRelease) : 0n
    ];

    logger.info('Prepared contract params:', result);
    
    if (result[5] <= 0n) throw new Error('Funding goal must be greater than 0');
    if (result[6] <= 0n) throw new Error('Soft cap must be greater than 0');
    if (result[6] > result[5]) throw new Error('Soft cap cannot exceed funding goal');
    if (result[12] <= 0n) throw new Error('Amount for sale must be greater than 0');
    if (result[12] > result[2]) throw new Error('Amount for sale cannot exceed total supply');

    return result;
  } catch (error) {
    logger.error('Error preparing project creation params:', error);
    throw new Error(`Invalid form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ========================================
// EXPORT ALL UTILITIES (for backward compatibility)
// ========================================

export const ExhibitionFormatters = {
  CONSTANTS: EXHIBITION_CONSTANTS,
  
  formatTokenAmount,
  parseTokenAmount,
  formatPercentage,
  parsePercentage,
  formatTimestamp,
  formatDuration,
  calculateLiquidityAmounts,
  validateProjectCreationData,
  parseDurationToSeconds,
  formatLargeNumber,
  formatTokenWithSymbol,
  formatTokenPrice,
  parseContractError,
  prepareProjectCreationParams,
} as const;

export default ExhibitionFormatters;