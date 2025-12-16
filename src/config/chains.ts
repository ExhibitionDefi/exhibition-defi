import { defineChain } from 'viem'

// 1. Define variables for cleaner configuration below
const NEXUS_TESTNET_WALLET_RPC_URL = [
  import.meta.env.VITE_NEXUS_TESTNET_WALLET_RPC_URL,
].filter(Boolean); // HTTP RPC Endpoints

// 2. Extract the dedicated WebSocket URL
const NEXUS_TESTNET_WS_URLS = [
  import.meta.env.VITE_NEXUS_TESTNET_WS_RPC_URL, // <-- Your WSS URL variable
].filter(Boolean); // WebSocket Endpoints

export const nexusTestnet = defineChain({
  id: parseInt(import.meta.env.VITE_NEXUS_TESTNET_CHAIN_ID),
  name: 'Nexus Testnet',
  network: 'nexus-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'NEX',
    symbol: 'NEX',
  },
  rpcUrls: {
    public: {
      http: NEXUS_TESTNET_WALLET_RPC_URL,
      // ⭐ ADDITION 1: Use the WSS URL here for public connections
      webSocket: NEXUS_TESTNET_WS_URLS, 
    },
    default: {
      http: NEXUS_TESTNET_WALLET_RPC_URL,
      // ⭐ ADDITION 2: Use the WSS URL here for default connections
      webSocket: NEXUS_TESTNET_WS_URLS,
    },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: import.meta.env.VITE_NEXUS_TESTNET_EXPLORER_URL,
    },
  },
})