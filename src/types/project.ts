// src/types/project.ts
export interface ProjectFormData {
  // Token details
  projectTokenName: string
  projectTokenSymbol: string
  initialTotalSupply: string
  projectTokenLogoURI: string
  // Project parameters
  contributionTokenAddress: `0x${string}`
  fundingGoal: string
  softCap: string
  minContribution: string
  maxContribution: string
  tokenPrice: string
  startTime: Date
  endTime: Date
  amountTokensForSale: string
  liquidityPercentage: string
  lockDuration: string
  // Vesting settings
  vestingEnabled: boolean
  vestingCliff: string
  vestingDuration: string
  vestingInterval: string
  vestingInitialRelease: string
}

export interface ProjectDisplayData {
  id: bigint
  projectOwner: `0x${string}`
  projectToken: `0x${string}`
  contributionTokenAddress: `0x${string}`
  fundingGoal: bigint
  softCap: bigint
  totalRaised: bigint
  tokenPrice: bigint
  startTime: bigint
  endTime: bigint
  amountTokensForSale: bigint
  totalProjectTokenSupply: bigint
  liquidityPercentage: bigint
  lockDuration: bigint
  status: number
  minContribution: bigint
  maxContribution: bigint
  
  vestingEnabled: boolean
  vestingCliff: bigint
  vestingDuration: bigint
  vestingInterval: bigint
  vestingInitialRelease: bigint

  // Computed fields
  progressPercentage: number
  timeRemaining: number
  canContribute: boolean
  formattedStatus: string

  // Token info
  tokenName?: string
  tokenSymbol?: string
  tokenDecimals?: number
  contributionTokenSymbol?: string
  contributionTokenDecimals?: number

  // 🆕 Liquidity fields
  requiredLiquidityTokens: bigint
  depositedLiquidityTokens: bigint
}

export interface UserProjectSummary {
  contributionAmount: bigint
  tokensOwed: bigint
  tokensVested: bigint
  tokensClaimed: bigint
  tokensAvailable: bigint
  userHasRefunded: boolean
  canClaim: boolean
}

export interface VestingInfo {
  enabled: boolean
  cliff: bigint // seconds
  duration: bigint // seconds  
  interval: bigint // seconds
  initialRelease: bigint // percentage (0-100)
}

export interface ProjectCreationResult {
  projectId: bigint
  projectTokenAddress: `0x${string}`
  transactionHash: string
}

export const ProjectStatus = {
  Upcoming: 0,
  Active: 1,
  FundingEnded: 2,
  Successful: 3,
  Failed: 4,
  Claimable: 5,
  Refundable: 6,
  Completed: 7,
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const ProjectStatusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.Upcoming]: 'Upcoming',
  [ProjectStatus.Active]: 'Active',
  [ProjectStatus.FundingEnded]: 'Funding Ended',
  [ProjectStatus.Successful]: 'Successful',
  [ProjectStatus.Failed]: 'Failed',
  [ProjectStatus.Claimable]: 'Claimable',
  [ProjectStatus.Refundable]: 'Refundable',
  [ProjectStatus.Completed]: 'Completed',
}

// Type guards
export const isValidProject = (project: any): project is ProjectDisplayData => {
  return (
    project &&
    typeof project.id === 'bigint' &&
    typeof project.projectOwner === 'string' &&
    typeof project.projectToken === 'string' &&
    typeof project.contributionTokenAddress === 'string' &&
    typeof project.fundingGoal === 'bigint' &&
    typeof project.softCap === 'bigint' &&
    typeof project.totalRaised === 'bigint' &&
    typeof project.tokenPrice === 'bigint' &&
    typeof project.startTime === 'bigint' &&
    typeof project.endTime === 'bigint' &&
    typeof project.amountTokensForSale === 'bigint' &&
    typeof project.liquidityPercentage === 'bigint' &&
    typeof project.lockDuration === 'bigint' &&
    typeof project.status === 'number' &&
    typeof project.minContribution === 'bigint' &&
    typeof project.maxContribution === 'bigint'
  )
}

export const isValidVestingInfo = (vesting: any): vesting is VestingInfo => {
  return (
    vesting &&
    typeof vesting.enabled === 'boolean' &&
    typeof vesting.cliff === 'bigint' &&
    typeof vesting.duration === 'bigint' &&
    typeof vesting.interval === 'bigint' &&
    typeof vesting.initialRelease === 'bigint'
  )
}