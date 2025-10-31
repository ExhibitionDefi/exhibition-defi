// src/config/contracts.ts

import type { Address } from 'viem'

export const CONTRACT_ADDRESSES = { 
  EXHIBITION: import.meta.env.VITE_EXHIBITION_ADDRESS as `0x${string}`,   
  AMM: import.meta.env.VITE_AMM_ADDRESS as `0x${string}`, 
  EXH: import.meta.env.VITE_EXH_ADDRESS as `0x${string}`, 
  EXUSDT: import.meta.env.VITE_EXUSDT_ADDRESS as `0x${string}`, 
  EXNEX: import.meta.env.VITE_EXNEX_ADDRESS as `0x${string}`, 
  FACTORY: import.meta.env.VITE_FACTORY_ADDRESS as `0x${string}`,
} as const

// AMM specific constants
export const AMM_CONFIG = {
  // Fee rate (0.3%)
  FEE_RATE: 0.3,

  // Default slippage tolerance (0.5%)
  DEFAULT_SLIPPAGE: 0.5,

  // Default deadline (20 minutes)
  DEFAULT_DEADLINE: 20,

  // Minimum liquidity for meaningful display
  MIN_LIQUIDITY_DISPLAY: '0.000001',
}

// Nexus Explorer
export const EXPLORER_URL = import.meta.env.VITE_NEXUS_TESTNET_EXPLORER_URL;

// Contract Addresses
export const EXHIBITION_ADDRESS = import.meta.env.VITE_EXHIBITION_ADDRESS as Address
export const AMM_ADDRESS = import.meta.env.VITE_AMM_ADDRESS as Address
export const EXH_ADDRESS = import.meta.env.VITE_EXH_ADDRESS as Address
export const EXUSDT_ADDRESS = import.meta.env.VITE_EXUSDT_ADDRESS as Address
export const EXNEX_ADDRESS = import.meta.env.VITE_EXNEX_ADDRESS as Address
export const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS as Address

// Supported Tokens (flat exports)
export const SUPPORTED_EXH = EXH_ADDRESS
export const SUPPORTED_EXUSDT = EXUSDT_ADDRESS
export const SUPPORTED_EXNEX = EXNEX_ADDRESS

// AMM specific constants
export const FEE_RATE = 0.3                // 0.3%
export const DEFAULT_SLIPPAGE = 0.5        // 0.5%
export const DEFAULT_DEADLINE = 20         // 20 minutes
export const MIN_LIQUIDITY_DISPLAY = '0.000001'

export const COMMON_PAIRS = [
  {
    tokenA: EXH_ADDRESS as Address,
    tokenB: EXUSDT_ADDRESS as Address,
    symbol: 'EXH/exUSDT',
  },
  {
    tokenA: EXH_ADDRESS as Address,
    tokenB: EXNEX_ADDRESS as Address,
    symbol: 'EXH/exNEX',
  },
  {
    tokenA: EXNEX_ADDRESS as Address,
    tokenB: EXUSDT_ADDRESS as Address,
    symbol: 'exNEX/exUSDT',
  },
] as const
