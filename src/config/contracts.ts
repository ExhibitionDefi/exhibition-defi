// src/config/contracts.ts
import type { Address } from 'viem'

// Helper to safely load and validate addresses
const loadAddress = (envVar: string | undefined, name: string): Address => {
  if (!envVar) {
    console.warn(`⚠️ Missing environment variable for ${name}`)
    return '0x0000000000000000000000000000000000000000' as Address
  }
  
  if (!envVar.startsWith('0x') || envVar.length !== 42) {
    console.warn(`⚠️ Invalid address format for ${name}: ${envVar}`)
    return '0x0000000000000000000000000000000000000000' as Address
  }
  
  return envVar as Address
}

// Load all addresses from environment variables
const EXH = loadAddress(import.meta.env.VITE_EXH_ADDRESS, 'EXH')
const EXUSDT = loadAddress(import.meta.env.VITE_EXUSDT_ADDRESS, 'EXUSDT')
const EXNEX = loadAddress(import.meta.env.VITE_EXNEX_ADDRESS, 'EXNEX')
const EXHIBITION = loadAddress(import.meta.env.VITE_EXHIBITION_ADDRESS, 'EXHIBITION')
const FACTORY = loadAddress(import.meta.env.VITE_FACTORY_ADDRESS, 'FACTORY')
const LP_TOKENS = loadAddress(import.meta.env.VITE_LP_TOKENS_ADDRESS, 'LP_TOKENS')
const AMM = loadAddress(import.meta.env.VITE_AMM_ADDRESS, 'AMM')

export const CONTRACT_ADDRESSES = {
  EXHIBITION,
  FACTORY,
  LP_TOKENS,
  AMM,
  EXH,
  EXUSDT,
  EXNEX,
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
export const EXPLORER_URL = import.meta.env.VITE_NEXUS_TESTNET_EXPLORER_URL

// Contract Addresses (flat exports)
export const EXHIBITION_ADDRESS = EXHIBITION
export const FACTORY_ADDRESS = FACTORY
export const LP_TOKENS_ADDRESS = LP_TOKENS
export const AMM_ADDRESS = AMM
export const EXH_ADDRESS = EXH
export const EXUSDT_ADDRESS = EXUSDT
export const EXNEX_ADDRESS = EXNEX

// Supported Tokens (flat exports)
export const SUPPORTED_EXH = EXH
export const SUPPORTED_EXUSDT = EXUSDT
export const SUPPORTED_EXNEX = EXNEX

// AMM specific constants
export const FEE_RATE = 0.3                // 0.3%
export const DEFAULT_SLIPPAGE = 0.5        // 0.5%
export const DEFAULT_DEADLINE = 20         // 20 minutes
export const MIN_LIQUIDITY_DISPLAY = '0.000001'

export const COMMON_PAIRS = [
  {
    tokenA: EXH as Address,
    tokenB: EXUSDT as Address,
    symbol: 'EXH/exUSDT',
  },
  {
    tokenA: EXH as Address,
    tokenB: EXNEX as Address,
    symbol: 'EXH/exNEX',
  },
  {
    tokenA: EXNEX as Address,
    tokenB: EXUSDT as Address,
    symbol: 'exNEX/exUSDT',
  },
] as const