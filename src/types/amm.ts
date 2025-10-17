import type { Address } from 'viem';

export interface AMMToken {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface AMMPool {
  tokenA: AMMToken;
  tokenB: AMMToken;
  reserveA: bigint;
  reserveB: bigint;
  totalLPSupply: bigint;
  fee: number;
  volume24h?: bigint;
  tvl?: bigint;
  apr?: number;
}

export interface AMMPosition {
  pool: AMMPool;
  lpBalance: bigint;
  sharePercentage: number;
  lockedAmount?: bigint;
  unlockTime?: Date;
  isLocked: boolean;
}

export interface SwapQuote {
  amountIn: bigint;
  amountOut: bigint;
  priceImpact: number;
  route: Address[];
  gasEstimate?: bigint;
}

export interface LiquidityQuote {
  amountA: bigint;
  amountB: bigint;
  lpTokensToReceive: bigint;
  shareOfPool: number;
  priceA?: bigint;
  priceB?: bigint;
}

export interface LiquidityPool {
  tokenA: Address;
  tokenB: Address;
  reserveA: bigint;
  reserveB: bigint;
  totalLPSupply: bigint;
}

export interface LiquidityLock {
  projectId: bigint;
  projectOwner: Address;
  unlockTime: bigint;
  lockedLPAmount: bigint;
  isActive: boolean;
}

export interface UserPortfolio {
  tokenAs: Address[];
  tokenBs: Address[];
  lpBalances: bigint[];
  sharePercentages: bigint[];
  totalPositions: bigint;
  hasMore: boolean;
}