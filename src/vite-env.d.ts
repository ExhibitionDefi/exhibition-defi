// src/vite-env.d.ts
/// <reference types="vite/client" />

// JSON module declarations
declare module "*.json" {
  const value: any;
  export default value;
}

// Specific ABI module declarations
declare module "@/abis/*.json" {
  const value: any;
  export default value;
}

declare module "../abis/*.json" {
  const value: any;
  export default value;
}

interface ImportMetaEnv {
  // Network Configuration
  readonly VITE_NEXUS_TESTNET_CHAIN_ID: string
  readonly VITE_NEXUS_TESTNET_WALLET_RPC_URL: string
  readonly VITE_NEXUS_TESTNET_RPC_URL: string
  readonly VITE_NEXUS_ALCHEMY_RPC_URL: string
  readonly VITE_NEXUS_TESTNET_WS_RPC_URL: string
  readonly VITE_NEXUS_TESTNET_EXPLORER_URL: string

  readonly VITE_APP_URL: string
  readonly VITE_REOWN_PROJECT_ID: string
  readonly VITE_API_URL: string

  // Contract Addresses
  readonly VITE_EXHIBITION_ADDRESS: string
  readonly VITE_AMM_ADDRESS: string
  readonly VITE_FACTORY_ADDRESS: string

  // Contribution Tokens Addresses
  readonly VITE_EXH_ADDRESS: string
  readonly VITE_EXUSDT_ADDRESS: string
  readonly VITE_EXNEX_ADDRESS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}