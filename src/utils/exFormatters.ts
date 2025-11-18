import { formatUnits, isAddressEqual, zeroAddress, parseUnits, getAddress, isAddress, type Address } from 'viem';
import type { ProjectFormData } from '../types/project'
import { logger } from './logger';

// ========================================
// ENUMS AND TYPES
// ========================================

export const ProjectStatus = {
  Upcoming: 0,
  Active: 1,
  FundingEnded: 2,
  Successful: 3,
  Failed: 4,
  Claimable: 5,
  Refundable: 6,
  Completed: 7
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export interface Project {
  projectOwner: string;
  projectToken: string;
  contributionTokenAddress: string;
  fundingGoal: bigint;
  softCap: bigint;
  minContribution: bigint;
  maxContribution: bigint;
  tokenPrice: bigint;
  startTime: bigint;
  endTime: bigint;
  totalRaised: bigint;
  totalProjectTokenSupply: bigint;
  projectTokenLogoURI: string;
  amountTokensForSale: bigint;
  liquidityPercentage: bigint;
  lockDuration: bigint;
  status: ProjectStatus;
  liquidityAdded: boolean;
  vestingEnabled: boolean;
  vestingCliff: bigint;
  vestingDuration: bigint;
  vestingInterval: bigint;
  vestingInitialRelease: bigint;
}

export interface VestingInfo {
  totalAmount: bigint;
  releasedAmount: bigint;
  startTime: bigint;
  lastClaimTime: bigint;
  nextClaimTime: bigint;
}

export interface CalculationPreview {
  tokensReceived: bigint;
  contributionIn18Decimals: bigint;
  effectivePrice: bigint;
  contributionDecimals: number;
  projectDecimals: number;
  minimumContribution: bigint;
  isValid: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errorCode: number;
}

export interface TokenInfo {
  decimals: number;
  symbol: string;
  name: string;
}

export interface SystemConstants {
  minTokenPrice: bigint;
  maxTokenPrice: bigint;
  maxTokenDecimals: number;
  priceDecimals: number;
}

export interface ProjectDetails {
  project: Project;
  progressPercentage: bigint;
  timeRemaining: bigint;
  canContribute: boolean;
  requiredLiquidityTokens: bigint;
  depositedLiquidityTokens: bigint;
}

export interface UserProjectSummary {
  contributionAmount: bigint;
  tokensOwed: bigint;
  tokensVested: bigint;
  tokensClaimed: bigint;
  tokensAvailable: bigint;
  userHasRefunded: boolean;
  canClaim: boolean;
}

export interface PlatformSettings {
  feePercentage: bigint;
  feeRecipient: string;
  minStartDelay: bigint;
  maxProjectDuration: bigint;
  withdrawalDelay: bigint;
}

export interface FaucetSettings {
  exhAmount: bigint;
  usdtAmount: bigint;
  cooldownSeconds: bigint;
}

export interface ContractAddresses {
  factory: string;
  amm: string;
  exhToken: string;
  exUSDTToken: string;
}

// ========================================
// CONSTANTS
// ========================================

export const EXHIBITION_CONSTANTS = {
  MIN_TOKEN_PRICE: parseUnits('0.000001', 18), // 1e12
  MAX_TOKEN_PRICE: parseUnits('1000000', 18),  // 1e24
  MAX_TOKEN_DECIMALS: 30,
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

export const ERROR_CODES = {
  NONE: 0,
  ZERO_CONTRIBUTION: 1,
  ZERO_PRICE: 2,
  PRICE_TOO_LOW: 3,
  PRICE_TOO_HIGH: 4,
  INVALID_DECIMALS: 5,
  CONTRIBUTION_TOO_LARGE: 6,
  CONTRIBUTION_TOO_SMALL: 7,
  CALCULATION_OVERFLOW: 8,
  ZERO_TOKENS_CALCULATED: 9
} as const;

export function debugContractParams(
  _formData: any,
  contractParams: ProjectCreationParamsTuple,
  _contributionTokenDecimals: number
) {
  const now = Math.floor(Date.now() / 1000);
  const startTime = Number(contractParams[10]);
  const endTime = Number(contractParams[11]);
  const lockDuration = Number(contractParams[14]);

  logger.info('=== CONTRACT VALIDATION DEBUG ===');
  logger.info('Current timestamp:', now);
  logger.info('Start timestamp:', startTime);
  logger.info('End timestamp:', endTime);
  logger.info('Time until start:', startTime - now, 'seconds');
  logger.info('Project duration:', endTime - startTime, 'seconds');
  logger.info('Lock duration:', lockDuration, 'seconds');
  
  // Check against contract constants
  const MIN_START_DELAY = 15 * 60; // 15 minutes
  const MAX_PROJECT_DURATION = 7 * 24 * 60 * 60; // 7 days
  const MIN_LOCK_DURATION = 14 * 24 * 60 * 60; // 14 days
  
  logger.info('=== VALIDATION CHECKS ===');
  logger.info('Start delay check:', startTime - now > MIN_START_DELAY, 
              `(need > ${MIN_START_DELAY}, have ${startTime - now})`);
  logger.info('Project duration check:', endTime - startTime <= MAX_PROJECT_DURATION,
              `(need <= ${MAX_PROJECT_DURATION}, have ${endTime - startTime})`);
  logger.info('Lock duration check:', lockDuration >= MIN_LOCK_DURATION,
              `(need >= ${MIN_LOCK_DURATION}, have ${lockDuration})`);
  
  logger.info('=== ALL PARAMETERS ===');
  contractParams.forEach((param, index) => {
    const paramNames = [
      'projectTokenName', 'projectTokenSymbol', 'initialTotalSupply', 'projectTokenLogoURI',
      'contributionTokenAddress', 'fundingGoal', 'softCap', 'minContribution', 'maxContribution',
      'tokenPrice', 'startTime', 'endTime', 'amountTokensForSale', 'liquidityPercentage',
      'lockDuration', 'vestingEnabled', 'vestingCliff', 'vestingDuration', 'vestingInterval', 'vestingInitialRelease'
    ];
    logger.info(`${index}: ${paramNames[index]} =`, param);
  });
}

// Extract type of valid error codes (0..9 here)
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

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
  
  // For very small amounts, show more decimals
  if (num < 0.0001) {
    return num.toFixed(8).replace(/\.?0+$/, '');
  }
  
  // For regular amounts, use fixed decimals
  return num.toFixed(displayDecimals).replace(/\.?0+$/, '');
}

/**
 * Parse token amount to wei/bigint with proper decimals
 * @param amount - Human readable amount (e.g., "100" or "100.5")
 * @param decimals - Token decimals (18 for most tokens, 6 for USDT)
 */
export const parseTokenAmount = (amount: string, decimals: number): bigint => {
  if (!amount || amount === '0' || amount === '') {
    return 0n
  }
  
  try {
    // Remove any whitespace
    const cleanAmount = amount.trim()
    
    // Parse to bigint with decimals using viem
    return parseUnits(cleanAmount, decimals)
  } catch (error) {
    logger.error('Failed to parse token amount:', { amount, decimals, error })
    throw new Error(`Invalid token amount: ${amount}`)
  }
}

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
 * @param percentage - Percentage as string (e.g., "80" for 80%)
 * @returns Basis points as bigint (e.g., 8000n for 80%)
 */
export const parsePercentage = (percentage: string): bigint => {
  if (!percentage || percentage === '0' || percentage === '') {
    return 0n
  }
  
  try {
    const pct = parseFloat(percentage)
    
    if (isNaN(pct) || pct < 0 || pct > 100) {
      throw new Error('Percentage must be between 0 and 100')
    }
    
    // Convert to basis points: 80% -> 8000
    // Multiply by 100 to get basis points
    return BigInt(Math.floor(pct * 100))
  } catch (error) {
    logger.error('Failed to parse percentage:', { percentage, error })
    throw new Error(`Invalid percentage: ${percentage}`)
  }
}

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

/**
 * Format project status to human readable string
 */
export function formatProjectStatus(status: ProjectStatus | number): string {
  const statusMap = {
    [ProjectStatus.Upcoming]: 'Upcoming',
    [ProjectStatus.Active]: 'Active',
    [ProjectStatus.FundingEnded]: 'Funding Ended',
    [ProjectStatus.Successful]: 'Successful',
    [ProjectStatus.Failed]: 'Failed',
    [ProjectStatus.Claimable]: 'Claimable',
    [ProjectStatus.Refundable]: 'Refundable',
    [ProjectStatus.Completed]: 'Completed'
  };
  
  return statusMap[status as ProjectStatus] || 'Unknown';
}

/**
 * Format address to shortened format
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!isAddress(address)) return address;
  
  const checksummed = getAddress(address);
  
  if (checksummed.length <= startChars + endChars) {
    return checksummed;
  }
  
  return `${checksummed.slice(0, startChars)}...${checksummed.slice(-endChars)}`;
}

// ========================================
// CALCULATION HELPERS
// ========================================

/**
 * Calculate tokens due based on contribution, price, and decimals
 */
export function calculateTokensDue(
  contributorContribution: bigint,
  tokenPrice: bigint,
  contributionDecimals: number,
  projectDecimals: number
): bigint {
  if (contributorContribution === 0n) return 0n;
  
  // Scale contribution to 18 decimals
  const contributionIn18Decimals = scaleToDecimals(
    contributorContribution,
    contributionDecimals,
    18
  );
  
  // Calculate tokens in 18 decimals: (contribution * 1e18) / price
  const tokensIn18Decimals = (contributionIn18Decimals * parseUnits('1', 18)) / tokenPrice;
  
  // Scale to project token decimals
  return scaleToDecimals(tokensIn18Decimals, 18, projectDecimals);
}

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
 * Calculate minimum contribution needed to receive 1 token
 */
export function calculateMinimumContribution(
  tokenPrice: bigint,
  contributionDecimals: number,
  projectDecimals: number
): bigint {
  const oneTokenIn18Decimals = scaleToDecimals(1n, projectDecimals, 18);
  const costIn18Decimals = (oneTokenIn18Decimals * tokenPrice) / parseUnits('1', 18);
  
  return scaleToDecimals(costIn18Decimals, 18, contributionDecimals);
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
 * Calculate net amount after platform fee
 */
export function calculateNetAfterFee(
  totalRaised: bigint,
  feePercentage: bigint
): bigint {
  const feeAmount = calculatePlatformFee(totalRaised, feePercentage);
  return totalRaised - feeAmount;
}

/**
 * Calculate liquidity amounts
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
  const platformFeeAmount = calculatePlatformFee(totalRaised, platformFeePercentage);
  const netRaisedAfterFee = totalRaised - platformFeeAmount;
  const contributionTokensForLiquidity = (netRaisedAfterFee * liquidityPercentage) / EXHIBITION_CONSTANTS.FEE_DENOMINATOR;
  
  const projectTokensForLiquidity = calculateTokensDue(
    contributionTokensForLiquidity,
    tokenPrice,
    contributionDecimals,
    projectDecimals
  );
  
  const remainingForOwner = netRaisedAfterFee - contributionTokensForLiquidity;
  
  return {
    platformFeeAmount,
    netRaisedAfterFee,
    contributionTokensForLiquidity,
    projectTokensForLiquidity,
    remainingForOwner
  };
}

/**
 * Calculate project progress percentage
 */
export function calculateProgress(totalRaised: bigint, fundingGoal: bigint): number {
  if (fundingGoal === 0n) return 0;
  
  const progress = Number((totalRaised * 10000n) / fundingGoal) / 100;
  return Math.min(progress, 100);
}

/**
 * Calculate time remaining until project end
 */
export function calculateTimeRemaining(endTime: bigint): bigint {
  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  
  if (currentTime >= endTime) {
    return 0n;
  }
  
  return endTime - currentTime;
}

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Validate token price
 */
export function validateTokenPrice(price: bigint): {
  isValid: boolean;
  error?: string;
} {
  if (price === 0n) {
    return { isValid: false, error: 'Token price cannot be zero' };
  }
  
  if (price < EXHIBITION_CONSTANTS.MIN_TOKEN_PRICE) {
    return { 
      isValid: false, 
      error: `Token price too low. Minimum: ${formatTokenAmount(EXHIBITION_CONSTANTS.MIN_TOKEN_PRICE, 18)}` 
    };
  }
  
  if (price > EXHIBITION_CONSTANTS.MAX_TOKEN_PRICE) {
    return { 
      isValid: false, 
      error: `Token price too high. Maximum: ${formatTokenAmount(EXHIBITION_CONSTANTS.MAX_TOKEN_PRICE, 18)}` 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate project timing
 */
export function validateProjectTiming(
  startTime: bigint,
  endTime: bigint
): {
  isValid: boolean;
  error?: string;
} {
  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  const minStartTime = currentTime + EXHIBITION_CONSTANTS.MIN_START_DELAY;
  
  if (startTime < minStartTime) {
    return {
      isValid: false,
      error: `Start time must be at least ${formatDuration(EXHIBITION_CONSTANTS.MIN_START_DELAY)} from now`
    };
  }
  
  if (endTime <= startTime) {
    return {
      isValid: false,
      error: 'End time must be after start time'
    };
  }
  
  const duration = endTime - startTime;
  if (duration > EXHIBITION_CONSTANTS.MAX_PROJECT_DURATION) {
    return {
      isValid: false,
      error: `Project duration cannot exceed ${formatDuration(EXHIBITION_CONSTANTS.MAX_PROJECT_DURATION)}`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate contribution amounts
 */
export function validateContribution(
  amount: bigint,
  minContribution: bigint,
  maxContribution: bigint,
  currentContribution: bigint = 0n
): {
  isValid: boolean;
  error?: string;
} {
  if (amount === 0n) {
    return { isValid: false, error: 'Contribution amount cannot be zero' };
  }
  
  const newTotal = currentContribution + amount;
  
  if (newTotal < minContribution) {
    return {
      isValid: false,
      error: `Total contribution must be at least ${formatTokenAmount(minContribution)}`
    };
  }
  
  if (newTotal > maxContribution) {
    return {
      isValid: false,
      error: `Total contribution cannot exceed ${formatTokenAmount(maxContribution)}`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate liquidity percentage
 */
export function validateLiquidityPercentage(percentage: bigint): {
  isValid: boolean;
  error?: string;
} {
  if (percentage < EXHIBITION_CONSTANTS.MIN_LIQUIDITY_PERCENTAGE) {
    return {
      isValid: false,
      error: `Liquidity percentage must be at least ${formatPercentage(EXHIBITION_CONSTANTS.MIN_LIQUIDITY_PERCENTAGE)}`
    };
  }
  
  if (percentage > EXHIBITION_CONSTANTS.MAX_LIQUIDITY_PERCENTAGE) {
    return {
      isValid: false,
      error: `Liquidity percentage cannot exceed ${formatPercentage(EXHIBITION_CONSTANTS.MAX_LIQUIDITY_PERCENTAGE)}`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate vesting parameters
 */
export function validateVesting(
  vestingEnabled: boolean,
  vestingCliff: bigint,
  vestingDuration: bigint,
  vestingInterval: bigint,
  vestingInitialRelease: bigint
): {
  isValid: boolean;
  error?: string;
} {
  if (!vestingEnabled) {
    if (vestingCliff !== 0n || vestingDuration !== 0n || vestingInterval !== 0n || vestingInitialRelease !== 0n) {
      return {
        isValid: false,
        error: 'When vesting is disabled, all vesting parameters must be zero'
      };
    }
    return { isValid: true };
  }
  
  if (vestingDuration === 0n) {
    return { isValid: false, error: 'Vesting duration must be set when vesting is enabled' };
  }
  
  if (vestingCliff > vestingDuration) {
    return { isValid: false, error: 'Vesting cliff cannot be longer than total duration' };
  }
  
  if (vestingInterval === 0n && vestingDuration > 0n) {
    return { isValid: false, error: 'Vesting interval must be set when vesting is enabled' };
  }
  
  if (vestingInitialRelease > EXHIBITION_CONSTANTS.FEE_DENOMINATOR) {
    return { isValid: false, error: 'Initial release percentage cannot exceed 100%' };
  }
  
  return { isValid: true };
}

// ========================================
// PARSING HELPERS
// ========================================

/**
 * Parse project from contract response
 */
export function parseProject(projectData: any[]): Project {
  return {
    projectOwner: projectData[0],
    projectToken: projectData[1],
    contributionTokenAddress: projectData[2],
    fundingGoal: BigInt(projectData[3]),
    softCap: BigInt(projectData[4]),
    minContribution: BigInt(projectData[5]),
    maxContribution: BigInt(projectData[6]),
    tokenPrice: BigInt(projectData[7]),
    startTime: BigInt(projectData[8]),
    endTime: BigInt(projectData[9]),
    totalRaised: BigInt(projectData[10]),
    totalProjectTokenSupply: BigInt(projectData[11]),
    projectTokenLogoURI: projectData[12],
    amountTokensForSale: BigInt(projectData[13]),
    liquidityPercentage: BigInt(projectData[14]),
    lockDuration: BigInt(projectData[15]),
    status: Number(projectData[16]) as ProjectStatus,
    liquidityAdded: Boolean(projectData[17]),
    vestingEnabled: Boolean(projectData[18]),
    vestingCliff: BigInt(projectData[19]),
    vestingDuration: BigInt(projectData[20]),
    vestingInterval: BigInt(projectData[21]),
    vestingInitialRelease: BigInt(projectData[22])
  };
}

/**
 * Parse vesting info from contract response
 */
export function parseVestingInfo(vestingData: any[]): VestingInfo {
  return {
    totalAmount: BigInt(vestingData[0]),
    releasedAmount: BigInt(vestingData[1]),
    startTime: BigInt(vestingData[2]),
    lastClaimTime: BigInt(vestingData[3]),
    nextClaimTime: BigInt(vestingData[4])
  };
}

/**
 * Parse calculation preview from contract response
 */
export function parseCalculationPreview(previewData: any[]): CalculationPreview {
  return {
    tokensReceived: BigInt(previewData[0]),
    contributionIn18Decimals: BigInt(previewData[1]),
    effectivePrice: BigInt(previewData[2]),
    contributionDecimals: Number(previewData[3]),
    projectDecimals: Number(previewData[4]),
    minimumContribution: BigInt(previewData[5]),
    isValid: Boolean(previewData[6])
  };
}

/**
 * Parse validation result from contract response
 */
export function parseValidationResult(validationData: any[]): ValidationResult {
  return {
    isValid: Boolean(validationData[0]),
    errorCode: Number(validationData[1])
  };
}

/**
 * Parse platform settings from contract response
 */
export function parsePlatformSettings(settingsData: any[]): PlatformSettings {
  return {
    feePercentage: BigInt(settingsData[0]),
    feeRecipient: settingsData[1],
    minStartDelay: BigInt(settingsData[2]),
    maxProjectDuration: BigInt(settingsData[3]),
    withdrawalDelay: BigInt(settingsData[4])
  };
}

// ========================================
// TIME HELPERS
// ========================================

/**
 * Get current timestamp in seconds
 */
export function getCurrentTimestamp(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

/**
 * Add duration to timestamp
 */
export function addDuration(timestamp: bigint, duration: bigint): bigint {
  return timestamp + duration;
}

/**
 * Check if timestamp is in the past
 */
export function isInPast(timestamp: bigint): boolean {
  return timestamp < getCurrentTimestamp();
}

/**
 * Check if timestamp is in the future
 */
export function isInFuture(timestamp: bigint): boolean {
  return timestamp > getCurrentTimestamp();
}

/**
 * Parse duration in DAYS to SECONDS
 * CRITICAL FIX: This was sending raw days instead of converting to seconds!
 * @param days - Duration in days as string (e.g., "14" for 2 weeks)
 * @returns Duration in seconds as bigint
 */
export const parseDurationToSeconds = (days: string): bigint => {
  if (!days || days === '0' || days === '') {
    return 0n
  }
  
  try {
    const daysNum = parseFloat(days)
    
    if (isNaN(daysNum) || daysNum < 0) {
      throw new Error('Duration must be a positive number')
    }
    
    // CRITICAL: Convert days to seconds
    // 1 day = 24 hours * 60 minutes * 60 seconds = 86,400 seconds
    // Example: 14 days = 14 * 86,400 = 1,209,600 seconds
    const seconds = Math.floor(daysNum * 24 * 60 * 60)
    
    logger.info(`📅 Duration conversion: ${days} days → ${seconds} seconds`)
    
    return BigInt(seconds)
  } catch (error) {
    logger.error('Failed to parse duration:', { days, error })
    throw new Error(`Invalid duration: ${days}`)
  }
}

// ========================================
// UTILITY HELPERS
// ========================================

/**
 * Check if project can accept contributions
 */
export function canProjectAcceptContributions(project: Project): boolean {
  const currentTime = getCurrentTimestamp();
  
  return (
    project.status === ProjectStatus.Active &&
    currentTime >= project.startTime &&
    currentTime < project.endTime &&
    project.totalRaised < project.fundingGoal
  );
}

/**
 * Check if project is successful
 */
export function isProjectSuccessful(project: Project): boolean {
  return project.totalRaised >= project.softCap;
}

/**
 * Check if project reached hard cap
 */
export function hasReachedHardCap(project: Project): boolean {
  return project.totalRaised >= project.fundingGoal;
}

/**
 * Check if project can be finalized
 */
export function canFinalizeProject(project: Project): boolean {
  const currentTime = getCurrentTimestamp();
  
  return (
    project.status === ProjectStatus.Active &&
    currentTime >= project.endTime
  );
}

/**
 * Check if user can claim refund
 */
export function canClaimRefund(project: Project): boolean {
  return (
    project.status === ProjectStatus.Failed ||
    project.status === ProjectStatus.Refundable
  );
}

/**
 * Calculate vesting progress percentage
 */
export function calculateVestingProgress(
  project: Project,
  currentTime?: bigint
): number {
  if (!project.vestingEnabled || project.vestingDuration === 0n) {
    return 100; // No vesting means 100% immediately available
  }
  
  const now = currentTime || getCurrentTimestamp();
  const vestingStart = project.startTime;
  const vestingEnd = vestingStart + project.vestingDuration;
  
  if (now < vestingStart) return 0;
  if (now >= vestingEnd) return 100;
  
  const elapsed = now - vestingStart;
  const progress = Number((elapsed * 10000n) / project.vestingDuration) / 100;
  
  return Math.min(progress, 100);
}


/**
 * Format error code to human readable message
 */
const errorMessages = {
  [ERROR_CODES.NONE]: 'No error',
  [ERROR_CODES.ZERO_CONTRIBUTION]: 'Contribution amount cannot be zero',
  [ERROR_CODES.ZERO_PRICE]: 'Token price cannot be zero',
  [ERROR_CODES.PRICE_TOO_LOW]: 'Token price is too low',
  [ERROR_CODES.PRICE_TOO_HIGH]: 'Token price is too high',
  [ERROR_CODES.INVALID_DECIMALS]: 'Invalid token decimals',
  [ERROR_CODES.CONTRIBUTION_TOO_LARGE]: 'Contribution amount is too large',
  [ERROR_CODES.CONTRIBUTION_TOO_SMALL]: 'Contribution amount is too small',
  [ERROR_CODES.CALCULATION_OVERFLOW]: 'Calculation overflow',
  [ERROR_CODES.ZERO_TOKENS_CALCULATED]: 'Calculated tokens amount is zero'
} as const;

export function formatErrorCode(errorCode: ErrorCode): string {
  return errorMessages[errorCode] ?? `Unknown error code: ${errorCode}`;
}

/**
 * Safe address formatting with validation
 */
export function safeFormatAddress(address: string): string {
  try {
    return getAddress(address);
  } catch {
    return address; // Return original if invalid
  }
}

/**
 * Check if address is zero address
 */
export function isZeroAddress(address: Address): boolean {
  return isAddressEqual(address, zeroAddress);
}

/**
 * Generate project creation parameters for contract call
 */
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

    // Validate required fields
    if (!params.projectTokenName?.trim()) throw new Error('Project token name is required');
    if (!params.projectTokenSymbol?.trim()) throw new Error('Project token symbol is required');
    if (!params.contributionTokenAddress?.startsWith('0x')) throw new Error('Invalid contribution token address');

    // Convert timestamps to bigint (Unix timestamp in seconds)
    const startTimestamp = typeof params.startTime === 'bigint' 
      ? params.startTime 
      : BigInt(Math.floor(params.startTime.getTime() / 1000));

    const endTimestamp = typeof params.endTime === 'bigint'
      ? params.endTime
      : BigInt(Math.floor(params.endTime.getTime() / 1000));

    // Validate timestamps
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (startTimestamp <= now + 900n) { // Must be at least 15 minutes from now
      throw new Error('Start time must be at least 15 minutes from now');
    }
    if (endTimestamp <= startTimestamp) {
      throw new Error('End time must be after start time');
    }

    // Calculate token price with proper decimals
    // Token price should be: contribution_token_amount / project_token_amount
    // So if 1 project token costs 0.001 contribution tokens:
    // price = parseUnits("0.001", contribution_decimals)
    const tokenPrice = parseUnits(params.tokenPrice, tokenDecimals.contribution);

    const result: ProjectCreationParamsTuple = [
      // Token details
      params.projectTokenName.trim(),
      params.projectTokenSymbol.trim().toUpperCase(),
      parseTokenAmount(params.initialTotalSupply, tokenDecimals.project),
      params.projectTokenLogoURI || '', // Ensure empty string if undefined

      // Core project parameters
      params.contributionTokenAddress,
      parseTokenAmount(params.fundingGoal, tokenDecimals.contribution),
      parseTokenAmount(params.softCap, tokenDecimals.contribution),
      parseTokenAmount(params.minContribution, tokenDecimals.contribution),
      parseTokenAmount(params.maxContribution, tokenDecimals.contribution),
      tokenPrice, // Fixed: Use contribution token decimals
      startTimestamp,
      endTimestamp,
      parseTokenAmount(params.amountTokensForSale, tokenDecimals.project),
      parsePercentage(params.liquidityPercentage),
      BigInt(Number(params.lockDuration) * 24 * 60 * 60),
      // Vesting parameters
      params.vestingEnabled,
      params.vestingEnabled && params.vestingCliff ? parseDurationToSeconds(params.vestingCliff) : 0n,
      params.vestingEnabled && params.vestingDuration ? parseDurationToSeconds(params.vestingDuration) : 0n,
      params.vestingEnabled && params.vestingInterval ? parseDurationToSeconds(params.vestingInterval) : 0n,
      params.vestingEnabled && params.vestingInitialRelease ? parsePercentage(params.vestingInitialRelease) : 0n
    ];

    logger.info('Prepared contract params:', result);
    
    // Additional validation
    if (result[5] <= 0n) throw new Error('Funding goal must be greater than 0'); // fundingGoal
    if (result[6] <= 0n) throw new Error('Soft cap must be greater than 0'); // softCap
    if (result[6] > result[5]) throw new Error('Soft cap cannot exceed funding goal'); // softCap <= fundingGoal
    if (result[12] <= 0n) throw new Error('Amount for sale must be greater than 0'); // amountTokensForSale
    if (result[12] > result[2]) throw new Error('Amount for sale cannot exceed total supply'); // amountTokensForSale <= totalSupply

    return result;
  } catch (error) {
    logger.error('Error preparing project creation params:', error);
    throw new Error(`Invalid form data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format project for display
 */

export interface FormattedProject {
  id: string;
  name: string; // project token name
  symbol: string; // project token symbol
  contributionTokenName: string;
  contributionTokenSymbol: string;
  owner: string;
  status: string;
  progress: string;
  timeRemaining: string;
  fundingGoal: string;
  softCap: string;
  totalRaised: string;
  tokenPrice: string;
  amountForSale: string;
  liquidityPercentage: string;
  startTime: string;
  endTime: string;
  vestingEnabled: boolean;
  vestingInfo?: {
    cliff: string;
    duration: string;
    interval: string;
    initialRelease: string;
  };
}



/**
 * Format user project summary for display
 */
export function formatUserSummaryForDisplay(
  summary: UserProjectSummary,
  contributionTokenDecimals: number = 18,
  projectTokenDecimals: number = 18
): {
  contribution: string;
  tokensOwed: string;
  tokensVested: string;
  tokensClaimed: string;
  tokensAvailable: string;
  hasRefunded: boolean;
  canClaim: boolean;
  vestingProgress: string;
} {
  const vestingProgress = summary.tokensOwed > 0n 
    ? Number((summary.tokensVested * 10000n) / summary.tokensOwed) / 100
    : 0;
    
  return {
    contribution: formatTokenAmount(summary.contributionAmount, contributionTokenDecimals),
    tokensOwed: formatTokenAmount(summary.tokensOwed, projectTokenDecimals),
    tokensVested: formatTokenAmount(summary.tokensVested, projectTokenDecimals),
    tokensClaimed: formatTokenAmount(summary.tokensClaimed, projectTokenDecimals),
    tokensAvailable: formatTokenAmount(summary.tokensAvailable, projectTokenDecimals),
    hasRefunded: summary.userHasRefunded,
    canClaim: summary.canClaim,
    vestingProgress: `${vestingProgress.toFixed(2)}%`
  };
}

// ========================================
// TRANSACTION HELPERS
// ========================================

/**
 * Prepare transaction options with gas estimation
 */
export function prepareTxOptions(options: {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  value?: bigint;
} = {}): any {
  const txOptions: any = {};
  
  if (options.gasLimit) txOptions.gasLimit = options.gasLimit;
  if (options.gasPrice) txOptions.gasPrice = options.gasPrice;
  if (options.maxFeePerGas) txOptions.maxFeePerGas = options.maxFeePerGas;
  if (options.maxPriorityFeePerGas) txOptions.maxPriorityFeePerGas = options.maxPriorityFeePerGas;
  if (options.value) txOptions.value = options.value;
  
  return txOptions;
}

/**
 * Create deadline timestamp (current time + buffer)
 */
export function createDeadline(bufferMinutes: number = 60): bigint {
  return getCurrentTimestamp() + BigInt(bufferMinutes * 60);
}

// ========================================
// EVENT PARSING HELPERS
// ========================================

/**
 * Parse ProjectCreated event
 */
export function parseProjectCreatedEvent(log: any): {
  projectId: bigint;
  projectOwner: string;
  projectToken: string;
  contributionTokenAddress: string;
  fundingGoal: bigint;
  softCap: bigint;
  totalProjectTokenSupply: bigint;
  projectTokenLogoURI: string;
  amountTokensForSale: bigint;
  liquidityPercentage: bigint;
  lockDuration: bigint;
  startTime: bigint;
  endTime: bigint;
} {
  return {
    projectId: BigInt(log.args[0]),
    projectOwner: log.args[1],
    projectToken: log.args[2],
    contributionTokenAddress: log.args[3],
    fundingGoal: BigInt(log.args[4]),
    softCap: BigInt(log.args[5]),
    totalProjectTokenSupply: BigInt(log.args[6]),
    projectTokenLogoURI: log.args[7],
    amountTokensForSale: BigInt(log.args[8]),
    liquidityPercentage: BigInt(log.args[9]),
    lockDuration: BigInt(log.args[10]),
    startTime: BigInt(log.args[11]),
    endTime: BigInt(log.args[12])
  };
}

/**
 * Parse ContributionMade event
 */
export function parseContributionMadeEvent(log: any): {
  projectId: bigint;
  contributor: string;
  amount: bigint;
  contributionTokenAddress: string;
  totalRaised: bigint;
} {
  return {
    projectId: BigInt(log.args[0]),
    contributor: log.args[1],
    amount: BigInt(log.args[2]),
    contributionTokenAddress: log.args[3],
    totalRaised: BigInt(log.args[4])
  };
}

/**
 * Parse TokensClaimed event
 */
export function parseTokensClaimedEvent(log: any): {
  projectId: bigint;
  contributor: string;
  amountClaimed: bigint;
  totalClaimedForContributor: bigint;
} {
  return {
    projectId: BigInt(log.args[0]),
    contributor: log.args[1],
    amountClaimed: BigInt(log.args[2]),
    totalClaimedForContributor: BigInt(log.args[3])
  };
}

// ========================================
// DISPLAY HELPERS
// ========================================

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param amount - The bigint amount to format
 * @param decimals - Token decimals (default 18, or pass 6 for exUSDT)
 * @param precision - Number of decimal places for the abbreviated number
 * @param symbol - Optional token symbol to auto-detect decimals
 */
export function formatLargeNumber(
  amount: bigint,
  decimals?: number,
  precision: number = 2,
  symbol?: string
): string {
  // Auto-detect decimals based on symbol if provided
  const tokenDecimals = symbol === 'exUSDT' ? 6 : (decimals ?? 18);
  
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
 * Format token amount with symbol — handles exUSDT = 6 decimals, others = 18
 */
export function formatTokenWithSymbol(
  amount: bigint,
  symbol: string,
  displayDecimals: number = 4
): string {
  // Dynamic decimals: only exUSDT has 6
  const decimals = symbol === 'exUSDT' ? 6 : 18;
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return `0 ${symbol}`;
  if (num < 0.0001) return `${num.toExponential(3)} ${symbol}`;
  
  // Format large numbers with abbreviations
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1_000_000_000) {
    // Billions
    const billions = absNum / 1_000_000_000;
    return `${sign}${billions.toFixed(billions >= 10 ? 1 : 2).replace(/\.?0+$/, '')}B ${symbol}`;
  } else if (absNum >= 1_000_000) {
    // Millions
    const millions = absNum / 1_000_000;
    return `${sign}${millions.toFixed(millions >= 10 ? 1 : 2).replace(/\.?0+$/, '')}M ${symbol}`;
  } else if (absNum >= 1_000) {
    // Thousands
    const thousands = absNum / 1_000;
    return `${sign}${thousands.toFixed(thousands >= 10 ? 1 : 2).replace(/\.?0+$/, '')}K ${symbol}`;
  }
  
  // Numbers less than 1000 - use original formatting
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

/**
 * Create status badge info
 */
export function getStatusBadgeInfo(status: ProjectStatus): {
  text: string;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple';
  description: string;
} {
  const statusInfo = {
    [ProjectStatus.Upcoming]: {
      text: 'Upcoming',
      color: 'gray' as const,
      description: 'Project is scheduled to start'
    },
    [ProjectStatus.Active]: {
      text: 'Active',
      color: 'green' as const,
      description: 'Project is currently accepting contributions'
    },
    [ProjectStatus.FundingEnded]: {
      text: 'Funding Ended',
      color: 'yellow' as const,
      description: 'Funding period has ended, awaiting finalization'
    },
    [ProjectStatus.Successful]: {
      text: 'Successful',
      color: 'green' as const,
      description: 'Project reached its funding goal'
    },
    [ProjectStatus.Failed]: {
      text: 'Failed',
      color: 'red' as const,
      description: 'Project did not reach minimum funding'
    },
    [ProjectStatus.Claimable]: {
      text: 'Claimable',
      color: 'blue' as const,
      description: 'Contributors can claim their tokens'
    },
    [ProjectStatus.Refundable]: {
      text: 'Refundable',
      color: 'purple' as const,
      description: 'Contributors can claim refunds'
    },
    [ProjectStatus.Completed]: {
      text: 'Completed',
      color: 'gray' as const,
      description: 'Project is fully completed'
    }
  };
  
  return statusInfo[status] || {
    text: 'Unknown',
    color: 'gray' as const,
    description: 'Unknown project status'
  };
}

// ========================================
// BATCH OPERATIONS
// ========================================


/**
 * Sort projects by various criteria
 */
export function sortProjects(
  projects: Project[],
  sortBy: 'startTime' | 'endTime' | 'totalRaised' | 'fundingGoal' | 'status',
  direction: 'asc' | 'desc' = 'desc'
): Project[] {
  return [...projects].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'startTime':
        comparison = a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0;
        break;
      case 'endTime':
        comparison = a.endTime < b.endTime ? -1 : a.endTime > b.endTime ? 1 : 0;
        break;
      case 'totalRaised':
        comparison = a.totalRaised < b.totalRaised ? -1 : a.totalRaised > b.totalRaised ? 1 : 0;
        break;
      case 'fundingGoal':
        comparison = a.fundingGoal < b.fundingGoal ? -1 : a.fundingGoal > b.fundingGoal ? 1 : 0;
        break;
      case 'status':
        comparison = a.status - b.status;
        break;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filter projects by status
 */
export function filterProjectsByStatus(
  projects: Project[],
  statuses: ProjectStatus[]
): Project[] {
  return projects.filter(project => statuses.includes(project.status));
}

/**
 * Filter projects by time
 */
export function filterProjectsByTime(
  projects: Project[],
  filter: 'active' | 'upcoming' | 'ended' | 'live'
): Project[] {
  const currentTime = getCurrentTimestamp();
  
  switch (filter) {
    case 'active':
      return projects.filter(p => 
        p.status === ProjectStatus.Active &&
        currentTime >= p.startTime &&
        currentTime < p.endTime
      );
    case 'upcoming':
      return projects.filter(p => 
        p.status === ProjectStatus.Upcoming ||
        (p.status === ProjectStatus.Active && currentTime < p.startTime)
      );
    case 'ended':
      return projects.filter(p => currentTime >= p.endTime);
    case 'live':
      return projects.filter(p => canProjectAcceptContributions(p));
    default:
      return projects;
  }
}

// ========================================
// CALCULATION SIMULATORS
// ========================================

/**
 * Simulate contribution and calculate expected tokens
 */
export function simulateContribution(
  contributionAmount: string,
  project: Project,
  contributionTokenDecimals: number,
  projectTokenDecimals: number
): {
  tokensReceived: string;
  newProgress: number;
  wouldReachSoftCap: boolean;
  wouldReachHardCap: boolean;
  isValidContribution: boolean;
  error?: string;
} {
  const contribution = parseTokenAmount(contributionAmount, contributionTokenDecimals);
  
  // Validate contribution
  const validation = validateContribution(
    contribution,
    project.minContribution,
    project.maxContribution
  );
  
  if (!validation.isValid) {
    return {
      tokensReceived: '0',
      newProgress: calculateProgress(project.totalRaised, project.fundingGoal),
      wouldReachSoftCap: false,
      wouldReachHardCap: false,
      isValidContribution: false,
      error: validation.error
    };
  }
  
  // Check if would exceed funding goal
  const newTotalRaised = project.totalRaised + contribution;
  if (newTotalRaised > project.fundingGoal) {
    return {
      tokensReceived: '0',
      newProgress: calculateProgress(project.totalRaised, project.fundingGoal),
      wouldReachSoftCap: false,
      wouldReachHardCap: false,
      isValidContribution: false,
      error: 'Contribution would exceed funding goal'
    };
  }
  
  const tokensReceived = calculateTokensDue(
    contribution,
    project.tokenPrice,
    contributionTokenDecimals,
    projectTokenDecimals
  );
  
  const newProgress = calculateProgress(newTotalRaised, project.fundingGoal);
  const wouldReachSoftCap = newTotalRaised >= project.softCap;
  const wouldReachHardCap = newTotalRaised >= project.fundingGoal;
  
  return {
    tokensReceived: formatTokenAmount(tokensReceived, projectTokenDecimals),
    newProgress,
    wouldReachSoftCap,
    wouldReachHardCap,
    isValidContribution: true
  };
}

/**
 * Simulate vesting schedule
 */
export function simulateVesting(
  project: Project,
  totalTokens: bigint,
  _currentTime?: bigint
): {
  schedule: Array<{
    timestamp: bigint;
    formattedTime: string;
    cumulativeTokens: bigint;
    formattedTokens: string;
    releaseAmount: bigint;
    formattedRelease: string;
  }>;
  summary: {
    totalTokens: string;
    initialRelease: string;
    vestingDuration: string;
    cliffPeriod: string;
  };
} {
  const schedule: any[] = [];
  
  if (!project.vestingEnabled) {
    schedule.push({
      timestamp: project.startTime,
      formattedTime: formatTimestamp(project.startTime),
      cumulativeTokens: totalTokens,
      formattedTokens: formatTokenAmount(totalTokens, 18),
      releaseAmount: totalTokens,
      formattedRelease: formatTokenAmount(totalTokens, 18)
    });
  } else {
    const initialReleaseAmount = (totalTokens * project.vestingInitialRelease) / EXHIBITION_CONSTANTS.FEE_DENOMINATOR;
    const remainingTokens = totalTokens - initialReleaseAmount;
    
    // Initial release at start
    if (initialReleaseAmount > 0n) {
      schedule.push({
        timestamp: project.startTime,
        formattedTime: formatTimestamp(project.startTime),
        cumulativeTokens: initialReleaseAmount,
        formattedTokens: formatTokenAmount(initialReleaseAmount, 18),
        releaseAmount: initialReleaseAmount,
        formattedRelease: formatTokenAmount(initialReleaseAmount, 18)
      });
    }
    
    // Cliff release
    const cliffTime = project.startTime + project.vestingCliff;
    if (project.vestingCliff > 0n && cliffTime > project.startTime) {
      schedule.push({
        timestamp: cliffTime,
        formattedTime: formatTimestamp(cliffTime),
        cumulativeTokens: initialReleaseAmount,
        formattedTokens: formatTokenAmount(initialReleaseAmount, 18),
        releaseAmount: 0n,
        formattedRelease: '0'
      });
    }
    
    // Vesting intervals
    const vestingEnd = project.startTime + project.vestingDuration;
    const vestingStart = cliffTime;
    
    if (project.vestingInterval > 0n && remainingTokens > 0n) {
      const totalIntervals = (vestingEnd - vestingStart) / project.vestingInterval;
      const tokensPerInterval = remainingTokens / totalIntervals;
      
      for (let i = 1n; i <= totalIntervals; i++) {
        const intervalTime = vestingStart + (i * project.vestingInterval);
        const cumulativeTokens = initialReleaseAmount + (tokensPerInterval * i);
        
        schedule.push({
          timestamp: intervalTime,
          formattedTime: formatTimestamp(intervalTime),
          cumulativeTokens,
          formattedTokens: formatTokenAmount(cumulativeTokens, 18),
          releaseAmount: tokensPerInterval,
          formattedRelease: formatTokenAmount(tokensPerInterval, 18)
        });
      }
    }
  }
  
  return {
    schedule,
    summary: {
      totalTokens: formatTokenAmount(totalTokens, 18),
      initialRelease: formatPercentage(project.vestingInitialRelease),
      vestingDuration: formatDuration(project.vestingDuration),
      cliffPeriod: formatDuration(project.vestingCliff)
    }
  };
}

// ========================================
// INPUT SANITIZATION
// ========================================

/**
 * Sanitize and validate address input
 */
export function sanitizeAddress(address: string): {
  isValid: boolean;
  formatted?: string;
  error?: string;
} {
  try {
    if (!address || address.trim() === '') {
      return { isValid: false, error: 'Address cannot be empty' };
    }
    
    const trimmed = address.trim();
    
    if (!isAddress(trimmed)) {
      return { isValid: false, error: 'Invalid Ethereum address format' };
    }
    
    if (isZeroAddress(trimmed)) {
      return { isValid: false, error: 'Address cannot be zero address' };
    }
    
    return {
      isValid: true,
      formatted: getAddress(trimmed)
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid address format'
    };
  }
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumericInput(
  input: string,
  decimals: number = 18
): {
  isValid: boolean;
  parsed?: bigint;
  formatted?: string;
  error?: string;
} {
  try {
    if (!input || input.trim() === '') {
      return { isValid: false, error: 'Amount cannot be empty' };
    }
    
    const trimmed = input.trim();
    
    // Check for valid number format
    if (!/^\d*\.?\d*$/.test(trimmed)) {
      return { isValid: false, error: 'Invalid number format' };
    }
    
    if (trimmed === '0' || trimmed === '0.' || trimmed === '.0') {
      return { isValid: false, error: 'Amount cannot be zero' };
    }
    
    const parsed = parseTokenAmount(trimmed, decimals);
    
    if (parsed === 0n) {
      return { isValid: false, error: 'Amount too small' };
    }
    
    return {
      isValid: true,
      parsed,
      formatted: formatTokenAmount(parsed, decimals)
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid number format'
    };
  }
}

// ========================================
// URL AND METADATA HELPERS
// ========================================

/**
 * Validate and format logo URI
 */
export function validateLogoURI(uri: string): {
  isValid: boolean;
  formatted?: string;
  error?: string;
} {
  try {
    if (!uri || uri.trim() === '') {
      return { isValid: true, formatted: '' }; // Logo URI is optional
    }
    
    const trimmed = uri.trim();
    const url = new URL(trimmed);
    
    // Basic validation for common image formats
    const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    const hasValidExtension = validExtensions.some(ext => 
      url.pathname.toLowerCase().endsWith(ext)
    );
    
    if (!hasValidExtension && !url.pathname.includes('ipfs')) {
      return {
        isValid: false,
        error: 'Logo URI should point to an image file or IPFS resource'
      };
    }
    
    return { isValid: true, formatted: trimmed };
  } catch {
    return { isValid: false, error: 'Invalid URI format' };
  }
}

// ========================================
// EXPORT UTILITIES
// ========================================

/**
 * Create a complete project creation payload
 */
export function createProjectPayload(params: {
  tokenName: string;
  tokenSymbol: string;
  totalSupply: string;
  logoURI: string;
  contributionToken: string;
  fundingGoal: string;
  softCap: string;
  minContribution: string;
  maxContribution: string;
  tokenPrice: string;
  startDate: Date;
  endDate: Date;
  tokensForSale: string;
  liquidityPercentage: string;
  lockDuration: string;
  vestingEnabled: boolean;
  vestingCliff?: string;
  vestingDuration?: string;
  vestingInterval?: string;
  vestingInitialRelease?: string;
}, tokenDecimals: { project: number; contribution: number }): {
  isValid: boolean;
  payload?: any[];
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate all inputs
  const addressValidation = sanitizeAddress(params.contributionToken);
  if (!addressValidation.isValid) {
    errors.push(`Contribution token: ${addressValidation.error}`);
  }
  
  const logoValidation = validateLogoURI(params.logoURI);
  if (!logoValidation.isValid) {
    errors.push(`Logo URI: ${logoValidation.error}`);
  }
  
  // Validate amounts
  const amountFields = [
    { name: 'Total supply', value: params.totalSupply },
    { name: 'Funding goal', value: params.fundingGoal },
    { name: 'Soft cap', value: params.softCap },
    { name: 'Min contribution', value: params.minContribution },
    { name: 'Max contribution', value: params.maxContribution },
    { name: 'Tokens for sale', value: params.tokensForSale }
  ];
  
  for (const field of amountFields) {
    const validation = sanitizeNumericInput(field.value, tokenDecimals.project);
    if (!validation.isValid) {
      errors.push(`${field.name}: ${validation.error}`);
    }
  }
  
  // Validate token price
  try {
    const price = parseUnits(params.tokenPrice, 18);
    const priceValidation = validateTokenPrice(price);
    if (!priceValidation.isValid) {
      errors.push(`Token price: ${priceValidation.error}`);
    }
  } catch {
    errors.push('Token price: Invalid format');
  }
  
  // Validate timing
  const timingValidation = validateProjectTiming(
    BigInt(Math.floor(params.startDate.getTime() / 1000)),
    BigInt(Math.floor(params.endDate.getTime() / 1000))
  );
  if (!timingValidation.isValid) {
    errors.push(`Timing: ${timingValidation.error}`);
  }
  
  // Validate vesting if enabled
  if (params.vestingEnabled) {
    const vestingValidation = validateVesting(
      params.vestingEnabled,
      params.vestingCliff ? parseDurationToSeconds(params.vestingCliff) : 0n,
      params.vestingDuration ? parseDurationToSeconds(params.vestingDuration) : 0n,
      params.vestingInterval ? parseDurationToSeconds(params.vestingInterval) : 0n,
      params.vestingInitialRelease ? parsePercentage(params.vestingInitialRelease) : 0n
    );
    if (!vestingValidation.isValid) {
      errors.push(`Vesting: ${vestingValidation.error}`);
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, errors };
  }
  
  // Create payload
  const payload = prepareProjectCreationParams(
    {
      projectTokenName: params.tokenName,
      projectTokenSymbol: params.tokenSymbol,
      initialTotalSupply: params.totalSupply,
      projectTokenLogoURI: params.logoURI,
      contributionTokenAddress: params.contributionToken,
      fundingGoal: params.fundingGoal,
      softCap: params.softCap,
      minContribution: params.minContribution,
      maxContribution: params.maxContribution,
      tokenPrice: params.tokenPrice,
      startTime: params.startDate,
      endTime: params.endDate,
      amountTokensForSale: params.tokensForSale,
      liquidityPercentage: params.liquidityPercentage,
      lockDuration: params.lockDuration,
      vestingEnabled: params.vestingEnabled,
      vestingCliff: params.vestingCliff,
      vestingDuration: params.vestingDuration,
      vestingInterval: params.vestingInterval,
      vestingInitialRelease: params.vestingInitialRelease
    },
    tokenDecimals
  );
  
  return { isValid: true, payload, errors: [] };
}

/**
 * Format wei values to display
 */
export const formatWei = {
  toEther: (wei: bigint) => formatTokenAmount(wei, 18),
  toGwei: (wei: bigint) => formatTokenAmount(wei, 9),
  toMwei: (wei: bigint) => formatTokenAmount(wei, 6),
  toToken: (wei: bigint, decimals: number) => formatTokenAmount(wei, decimals)
};

/**
 * Parse display values to wei
 */
export const parseToWei = {
  fromEther: (ether: string) => parseTokenAmount(ether, 18),
  fromGwei: (gwei: string) => parseTokenAmount(gwei, 9),
  fromMwei: (mwei: string) => parseTokenAmount(mwei, 6),
  fromToken: (amount: string, decimals: number) => parseTokenAmount(amount, decimals)
};

// ========================================
// CONTRACT INTERACTION HELPERS
// ========================================

/**
 * Create function call data for contribution
 */
export function prepareContributionCall(
  projectId: bigint,
  amount: bigint
): {
  functionName: string;
  args: any[];
} {
  return {
    functionName: 'contribute',
    args: [projectId, amount]
  };
}

/**
 * Create function call data for token claiming
 */
export function prepareClaimTokensCall(projectId: bigint): {
  functionName: string;
  args: any[];
} {
  return {
    functionName: 'claimTokens',
    args: [projectId]
  };
}

/**
 * Create function call data for refund request
 */
export function prepareRefundCall(projectId: bigint): {
  functionName: string;
  args: any[];
} {
  return {
    functionName: 'requestRefund',
    args: [projectId]
  };
}

/**
 * Create function call data for project finalization
 */
export function prepareFinalizeProjectCall(projectId: bigint): {
  functionName: string;
  args: any[];
} {
  return {
    functionName: 'finalizeProject',
    args: [projectId]
  };
}

/**
 * Create function call data for liquidity token deposit
 */
export function prepareDepositLiquidityCall(
  projectId: bigint,
  amount: bigint
): {
  functionName: string;
  args: any[];
} {
  return {
    functionName: 'depositLiquidityTokens',
    args: [projectId, amount]
  };
}

/**
 * Create function call data for finalizing liquidity and releasing funds
 */
export function prepareFinalizeLiquidityCall(projectId: bigint): {
  functionName: string;
  args: any[];
} {
  return {
    functionName: 'finalizeLiquidityAndReleaseFunds',
    args: [projectId]
  };
}

/**
 * Create function call data for withdrawing unsold tokens
 */
export function prepareWithdrawUnsoldTokensCall(projectId: bigint): {
  functionName: string;
  args: any[];
} {
  return {
    functionName: 'withdrawUnsoldTokens',
    args: [projectId]
  };
}

/**
 * Create function call data for faucet request
 */
export function prepareFaucetRequestCall(): {
  functionName: string;
  args: any[];
} {
  return {
    functionName: 'requestFaucetTokens',
    args: []
  };
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
  
  // Common Exhibition contract errors
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
  
  // Try to extract the custom error name
  let errorCode = 'Unknown';
  let userMessage = 'An unexpected error occurred';
  
  for (const [contractError, message] of Object.entries(errorMap)) {
    if (errorString.includes(contractError)) {
      errorCode = contractError;
      userMessage = message;
      break;
    }
  }
  
  // Handle common EVM errors
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
// COOLDOWN AND TIMING HELPERS
// ========================================

/**
 * Check if faucet is available for user
 */
export function checkFaucetAvailability(
  lastRequestTime: bigint,
  cooldownSeconds: bigint
): {
  canRequest: boolean;
  timeUntilNext: bigint;
  formattedWaitTime: string;
} {
  const currentTime = getCurrentTimestamp();
  const nextAvailableTime = lastRequestTime + cooldownSeconds;
  
  if (currentTime >= nextAvailableTime) {
    return {
      canRequest: true,
      timeUntilNext: 0n,
      formattedWaitTime: 'Available now'
    };
  }
  
  const timeUntilNext = nextAvailableTime - currentTime;
  
  return {
    canRequest: false,
    timeUntilNext,
    formattedWaitTime: formatDuration(timeUntilNext)
  };
}

/**
 * Calculate project timeline milestones
 */
export function calculateProjectMilestones(project: Project): {
  milestones: Array<{
    name: string;
    timestamp: bigint;
    formattedTime: string;
    isPast: boolean;
    isActive: boolean;
  }>;
  currentPhase: string;
} {
  const currentTime = getCurrentTimestamp();
  
  const milestones = [
    {
      name: 'Project Created',
      timestamp: project.startTime - 3600n, // Approximate creation time
      formattedTime: formatTimestamp(project.startTime - 3600n),
      isPast: true,
      isActive: false
    },
    {
      name: 'Funding Starts',
      timestamp: project.startTime,
      formattedTime: formatTimestamp(project.startTime),
      isPast: currentTime >= project.startTime,
      isActive: currentTime >= project.startTime && currentTime < project.endTime && project.status === ProjectStatus.Active
    },
    {
      name: 'Funding Ends',
      timestamp: project.endTime,
      formattedTime: formatTimestamp(project.endTime),
      isPast: currentTime >= project.endTime,
      isActive: false
    }
  ];
  
  if (project.vestingEnabled && project.vestingCliff > 0n) {
    milestones.push({
      name: 'Vesting Cliff',
      timestamp: project.startTime + project.vestingCliff,
      formattedTime: formatTimestamp(project.startTime + project.vestingCliff),
      isPast: currentTime >= (project.startTime + project.vestingCliff),
      isActive: false
    });
  }
  
  if (project.vestingEnabled && project.vestingDuration > 0n) {
    milestones.push({
      name: 'Vesting Complete',
      timestamp: project.startTime + project.vestingDuration,
      formattedTime: formatTimestamp(project.startTime + project.vestingDuration),
      isPast: currentTime >= (project.startTime + project.vestingDuration),
      isActive: false
    });
  }
  
  // Determine current phase
  let currentPhase = 'Unknown';
  if (currentTime < project.startTime) {
    currentPhase = 'Waiting to Start';
  } else if (currentTime >= project.startTime && currentTime < project.endTime) {
    currentPhase = 'Funding Active';
  } else if (currentTime >= project.endTime) {
    switch (project.status) {
      case ProjectStatus.Successful:
        currentPhase = 'Successful - Awaiting Liquidity';
        break;
      case ProjectStatus.Failed:
        currentPhase = 'Failed - Refunds Available';
        break;
      case ProjectStatus.Completed:
        currentPhase = 'Completed';
        break;
      default:
        currentPhase = 'Funding Ended';
    }
  }
  
  return {
    milestones: milestones.sort((a, b) => Number(a.timestamp - b.timestamp)),
    currentPhase
  };
}

// ========================================
// ANALYTICS AND METRICS HELPERS
// ========================================

/**
 * Calculate project analytics
 */
export function calculateProjectAnalytics(project: Project): {
  metrics: {
    fundingProgress: number;
    softCapProgress: number;
    timeProgress: number;
    averageContribution: bigint;
    estimatedContributors: number;
    liquidityValue: bigint;
    tokensSold: bigint;
    tokensRemaining: bigint;
  };
  health: {
    score: number; // 0-100
    factors: string[];
    recommendations: string[];
  };
} {
  const currentTime = getCurrentTimestamp();
  const fundingProgress = calculateProgress(project.totalRaised, project.fundingGoal);
  const softCapProgress = calculateProgress(project.totalRaised, project.softCap);
  
  // Time progress calculation
  let timeProgress = 0;
  if (currentTime >= project.endTime) {
    timeProgress = 100;
  } else if (currentTime >= project.startTime) {
    const elapsed = currentTime - project.startTime;
    const total = project.endTime - project.startTime;
    timeProgress = Number((elapsed * 100n) / total);
  }
  
  // Estimate contributors (rough calculation)
  const avgContribution = project.totalRaised > 0n 
    ? (project.minContribution + project.maxContribution) / 2n
    : 0n;
  const estimatedContributors = avgContribution > 0n 
    ? Number(project.totalRaised / avgContribution)
    : 0;
  
  // Calculate liquidity value
  const liquidityValue = (project.totalRaised * project.liquidityPercentage) / EXHIBITION_CONSTANTS.FEE_DENOMINATOR;
  
  // Tokens sold calculation
  const tokensSold = project.totalRaised > 0n 
    ? calculateTokensDue(project.totalRaised, project.tokenPrice, 18, 18) // Assuming 18 decimals
    : 0n;
  const tokensRemaining = project.amountTokensForSale - tokensSold;
  
  // Health score calculation
  let healthScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];
  
  if (fundingProgress >= 100) {
    healthScore += 30;
    factors.push('Funding goal reached');
  } else if (fundingProgress >= 80) {
    healthScore += 25;
    factors.push('Strong funding progress');
  } else if (fundingProgress >= 50) {
    healthScore += 15;
    factors.push('Moderate funding progress');
  } else if (fundingProgress < 20 && timeProgress > 50) {
    factors.push('Low funding with limited time');
    recommendations.push('Consider marketing push or incentives');
  }
  
  if (softCapProgress >= 100) {
    healthScore += 20;
    factors.push('Soft cap achieved');
  } else if (softCapProgress >= 80) {
    healthScore += 15;
    factors.push('Close to soft cap');
  }
  
  if (timeProgress < 80) {
    healthScore += 10;
    factors.push('Sufficient time remaining');
  } else if (timeProgress >= 90) {
    factors.push('Limited time remaining');
    if (softCapProgress < 100) {
      recommendations.push('Urgent action needed to reach soft cap');
    }
  }
  
  if (project.liquidityPercentage >= 8000n) {
    healthScore += 15;
    factors.push('High liquidity commitment');
  } else if (project.liquidityPercentage < 7500n) {
    factors.push('Low liquidity percentage');
    recommendations.push('Consider increasing liquidity percentage');
  }
  
  if (estimatedContributors > 10) {
    healthScore += 10;
    factors.push('Good community participation');
  } else if (estimatedContributors < 5) {
    factors.push('Limited community participation');
    recommendations.push('Focus on community building');
  }
  
  if (project.vestingEnabled) {
    healthScore += 10;
    factors.push('Vesting enabled for token stability');
  }
  
  return {
    metrics: {
      fundingProgress,
      softCapProgress,
      timeProgress,
      averageContribution: avgContribution,
      estimatedContributors,
      liquidityValue,
      tokensSold,
      tokensRemaining
    },
    health: {
      score: Math.min(healthScore, 100),
      factors,
      recommendations
    }
  };
}

// ========================================
// BATCH FORMATTING UTILITIES
// ========================================

/**
 * Format multiple token amounts in batch
 */
export function batchFormatTokens(
  amounts: bigint[],
  decimals: number[] | number,
  symbols?: string[]
): string[] {
  return amounts.map((amount, index) => {
    const tokenDecimals = Array.isArray(decimals) ? decimals[index] : decimals;
    const symbol = symbols?.[index] || '';
    const formatted = formatTokenAmount(amount, tokenDecimals);
    return symbol ? `${formatted} ${symbol}` : formatted;
  });
}

/**
 * Format multiple addresses in batch
 */
export function batchFormatAddresses(
  addresses: string[],
  shortFormat: boolean = true
): string[] {
  return addresses.map(addr => 
    shortFormat ? formatAddress(addr) : safeFormatAddress(addr)
  );
}

// ========================================
// SEARCH AND FILTER HELPERS
// ========================================

/**
 * Search projects by multiple criteria
 */
export function searchProjects(
  projects: Project[],
  criteria: {
    status?: ProjectStatus[];
    owner?: string;
    minRaised?: bigint;
    maxRaised?: bigint;
    contributionToken?: string;
    hasVesting?: boolean;
  }
): Project[] {
  return projects.filter(project => {
    if (criteria.status && !criteria.status.includes(project.status)) {
      return false;
    }
    
    if (criteria.owner && project.projectOwner.toLowerCase() !== criteria.owner.toLowerCase()) {
      return false;
    }
    
    if (criteria.minRaised && project.totalRaised < criteria.minRaised) {
      return false;
    }
    
    if (criteria.maxRaised && project.totalRaised > criteria.maxRaised) {
      return false;
    }
    
    if (criteria.contributionToken && 
        project.contributionTokenAddress.toLowerCase() !== criteria.contributionToken.toLowerCase()) {
      return false;
    }
    
    if (criteria.hasVesting !== undefined && project.vestingEnabled !== criteria.hasVesting) {
      return false;
    }
    
    return true;
  });
}

// ========================================
// DEBUGGING AND DEVELOPMENT HELPERS
// ========================================

/**
 * Create human-readable transaction summary
 */
export function createTransactionSummary(
  functionName: string,
  args: any[],
  _project?: Project,
  tokenDecimals: { project: number; contribution: number } = { project: 18, contribution: 18 }
): string {
  switch (functionName) {
    case 'contribute':
      const [projectId, amount] = args;
      return `Contributing ${formatTokenAmount(amount, tokenDecimals.contribution)} to project ${projectId}`;
      
    case 'claimTokens':
      return `Claiming tokens from project ${args[0]}`;
      
    case 'requestRefund':
      return `Requesting refund from project ${args[0]}`;
      
    case 'finalizeProject':
      return `Finalizing project ${args[0]}`;
      
    case 'depositLiquidityTokens':
      const [projId, liquidityAmount] = args;
      return `Depositing ${formatTokenAmount(liquidityAmount, tokenDecimals.project)} liquidity tokens for project ${projId}`;
      
    case 'finalizeLiquidityAndReleaseFunds':
      return `Finalizing liquidity and releasing funds for project ${args[0]}`;
      
    case 'withdrawUnsoldTokens':
      return `Withdrawing unsold tokens from project ${args[0]}`;
      
    case 'requestFaucetTokens':
      return 'Requesting tokens from faucet';
      
    default:
      return `Calling ${functionName} with args: ${args.join(', ')}`;
  }
}

/**
 * Log project state for debugging
 */
export function logProjectState(project: Project, label: string = 'Project State'): void {
  // logger.group / logger.groupEnd are not present on the Logger type, use simple info markers instead
  logger.info(`=== ${label} ===`);
  logger.info('Project Owner:', formatAddress(project.projectOwner));
  logger.info('Status:', formatProjectStatus(project.status));
  logger.info('Funding Progress:', `${calculateProgress(project.totalRaised, project.fundingGoal).toFixed(2)}%`);
  logger.info('Total Raised:', formatTokenAmount(project.totalRaised, 18));
  logger.info('Funding Goal:', formatTokenAmount(project.fundingGoal, 18));
  logger.info('Soft Cap:', formatTokenAmount(project.softCap, 18));
  logger.info('Time Remaining:', formatDuration(calculateTimeRemaining(project.endTime)));
  logger.info('Vesting Enabled:', project.vestingEnabled);
  logger.info('Liquidity Added:', project.liquidityAdded);
  logger.info(`=== End ${label} ===`);
}

// ========================================
// TYPE GUARDS AND VALIDATORS
// ========================================

/**
 * Type guard for Project
 */
export function isValidProject(obj: any): obj is Project {
  return (
    obj &&
    typeof obj.projectOwner === 'string' &&
    typeof obj.projectToken === 'string' &&
    typeof obj.contributionTokenAddress === 'string' &&
    typeof obj.fundingGoal === 'bigint' &&
    typeof obj.softCap === 'bigint' &&
    typeof obj.status === 'number' &&
    Object.values(ProjectStatus).includes(obj.status)
  );
}

export const validateProjectCreationData = (formData: ProjectFormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Validate timing
  const now = Date.now()
  const startTime = formData.startTime.getTime()
  const endTime = formData.endTime.getTime()
  
  if (startTime <= now + 15 * 60 * 1000) {
    errors.push('Start time must be at least 15 minutes in the future')
  }
  
  if (endTime <= startTime) {
    errors.push('End time must be after start time')
  }
  
  const duration = (endTime - startTime) / (24 * 60 * 60 * 1000)
  if (duration > 7) {
    errors.push('Project duration cannot exceed 7 days')
  }
  
  // Validate amounts
  const fundingGoal = Number(formData.fundingGoal)
  const softCap = Number(formData.softCap)
  const minContribution = Number(formData.minContribution)
  const maxContribution = Number(formData.maxContribution)
  const tokensForSale = Number(formData.amountTokensForSale)
  const totalSupply = Number(formData.initialTotalSupply)
  
  if (softCap > fundingGoal) {
    errors.push('Soft cap cannot exceed hard cap')
  }
  
  if (minContribution > maxContribution) {
    errors.push('Minimum contribution cannot exceed maximum contribution')
  }
  
  if (tokensForSale > totalSupply) {
    errors.push('Tokens for sale cannot exceed total supply')
  }
  
  // Validate liquidity percentage
  const liquidityPercentage = Number(formData.liquidityPercentage)
  if (liquidityPercentage < 70 || liquidityPercentage > 100) {
    errors.push('Liquidity percentage must be between 70% and 100%')
  }
  
  // Validate lock duration
  const lockDuration = Number(formData.lockDuration)
  if (lockDuration < 30 || lockDuration > 365) {
    errors.push('Lock duration must be between 30 and 365 days')
  }
  
  // Validate vesting if enabled
  if (formData.vestingEnabled) {
    const vestingCliff = Number(formData.vestingCliff)
    const vestingDuration = Number(formData.vestingDuration)
    const vestingInterval = Number(formData.vestingInterval)
    const vestingInitialRelease = Number(formData.vestingInitialRelease)
    
    if (vestingCliff < 0) {
      errors.push('Vesting cliff cannot be negative')
    }
    
    if (vestingDuration <= 0) {
      errors.push('Vesting duration must be greater than 0')
    }
    
    if (vestingInterval <= 0) {
      errors.push('Vesting interval must be greater than 0')
    }
    
    if (vestingInitialRelease < 0 || vestingInitialRelease > 100) {
      errors.push('Vesting initial release must be between 0% and 100%')
    }
    
    if (vestingInterval > vestingDuration) {
      errors.push('Vesting interval cannot be longer than vesting duration')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Type guard for VestingInfo
 */
export function isValidVestingInfo(obj: any): obj is VestingInfo {
  return (
    obj &&
    typeof obj.totalAmount === 'bigint' &&
    typeof obj.releasedAmount === 'bigint' &&
    typeof obj.startTime === 'bigint' &&
    typeof obj.lastClaimTime === 'bigint' &&
    typeof obj.nextClaimTime === 'bigint'
  );
}

// ========================================
// EXPORT ALL UTILITIES
// ========================================

/**
 * Main export object with all utilities organized
 */
export const ExhibitionFormatters = {
  // Constants
  CONSTANTS: EXHIBITION_CONSTANTS,
  ERROR_CODES,
  
  // Core formatting
  formatTokenAmount,
  parseTokenAmount,
  formatPercentage,
  parsePercentage,
  formatTimestamp,
  formatDuration,
  formatProjectStatus,
  formatAddress,
  
  // Calculations
  calculateTokensDue,
  scaleToDecimals,
  calculateMinimumContribution,
  calculatePlatformFee,
  calculateNetAfterFee,
  calculateLiquidityAmounts,
  calculateProgress,
  calculateTimeRemaining,
  
  // Validation
  validateTokenPrice,
  validateProjectTiming,
  validateContribution,
  validateLiquidityPercentage,
  validateVesting,
  validateProjectCreationData,
  
  // Parsing
  parseProject,
  parseVestingInfo,
  parseCalculationPreview,
  parseValidationResult,
  parsePlatformSettings,
  
  // Time utilities
  getCurrentTimestamp,
  addDuration,
  isInPast,
  isInFuture,
  parseDurationToSeconds,
  
  // Project utilities
  canProjectAcceptContributions,
  isProjectSuccessful,
  hasReachedHardCap,
  canFinalizeProject,
  canClaimRefund,
  calculateVestingProgress,
  
  // Display formatting
  formatUserSummaryForDisplay,
  formatLargeNumber,
  formatTokenWithSymbol,
  formatTokenPrice,
  getStatusBadgeInfo,
  
  // Contract interaction
  prepareProjectCreationParams,
  prepareContributionCall,
  prepareClaimTokensCall,
  prepareRefundCall,
  prepareFinalizeProjectCall,
  prepareDepositLiquidityCall,
  prepareFinalizeLiquidityCall,
  prepareWithdrawUnsoldTokensCall,
  prepareFaucetRequestCall,
  
  // Error handling
  parseContractError,
  formatErrorCode,
  
  // Batch operations
  sortProjects,
  filterProjectsByStatus,
  filterProjectsByTime,
  batchFormatTokens,
  batchFormatAddresses,
  searchProjects,
  
  // Analytics
  calculateProjectAnalytics,
  calculateProjectMilestones,
  checkFaucetAvailability,
  
  // Utilities
  safeFormatAddress,
  isZeroAddress,
  sanitizeAddress,
  sanitizeNumericInput,
  validateLogoURI,
  createProjectPayload,
  createTransactionSummary,
  logProjectState,
  
  // Type guards
  isValidProject,
  isValidVestingInfo,
  
  // Wei helpers
  formatWei,
  parseToWei,
  
  // Transaction helpers
  prepareTxOptions,
  createDeadline,
  
  // Event parsing
  parseProjectCreatedEvent,
  parseContributionMadeEvent,
  parseTokensClaimedEvent
} as const;

export default ExhibitionFormatters;