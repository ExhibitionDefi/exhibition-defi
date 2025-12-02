import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { nexusTestnet } from './chains'
import { cookieStorage, createStorage, http } from 'wagmi'
import { getPublicClient } from 'wagmi/actions'
import favicon from '@/assets/favicon-16x16.png'

// Get project ID from environment
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('VITE_REOWN_PROJECT_ID is not set')
}

// ✅ Set up the Wagmi Adapter with explicit backend proxy transport
const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: false,
  networks: [nexusTestnet],
  projectId,
  // 🆕 ADD THIS: Override transport to use your backend proxy
  transports: {
    [nexusTestnet.id]: http(import.meta.env.VITE_NEXUS_TESTNET_RPC_URL),
  },
})

// Create AppKit with wallet-only authentication
createAppKit({
  adapters: [wagmiAdapter],
  networks: [nexusTestnet],
  metadata: {
    name: 'Exhibition defi',
    description: 'Decentralized Token Launchpad Integated with Dex on Nexus',
    url: import.meta.env.VITE_APP_URL || 'https://localhost:3000',
    icons: [favicon],
  },
  projectId,
  features: {
    analytics: false,
    email: false,
    socials: [],
  },
})

export { wagmiAdapter }

export const publicClient = getPublicClient(wagmiAdapter.wagmiConfig)!