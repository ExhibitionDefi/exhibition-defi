import { defineChain } from 'viem'

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
      http: [
        import.meta.env.VITE_NEXUS_TESTNET_RPC_URL,
        import.meta.env.VITE_NEXUS_ALCHEMY_RPC_URL,
      ].filter(Boolean),
    },
    default: {
      http: [
        import.meta.env.VITE_NEXUS_TESTNET_RPC_URL,
        import.meta.env.VITE_NEXUS_ALCHEMY_RPC_URL,
      ].filter(Boolean),
    },
  },
  blockExplorers: {
    default: {
      name: 'Explorer',
      url: import.meta.env.VITE_NEXUS_TESTNET_EXPLORER_URL,
    },
  },
})
