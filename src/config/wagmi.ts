import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { nexusTestnet } from './chains'
import { cookieStorage, createStorage } from 'wagmi'
import { getPublicClient } from 'wagmi/actions'
import favicon from '@/assets/favicon-16x16.png'

// Get project ID from environment
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('VITE_REOWN_PROJECT_ID is not set')
}

// Set up the Wagmi Adapter (Config)
const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: false,
  networks: [nexusTestnet],
  projectId,
})

// Create AppKit with wallet-only authentication
createAppKit({
  adapters: [wagmiAdapter],
  networks: [nexusTestnet],
  metadata: {
    name: 'Exhibition defi',
    description: 'Decentralized Token Launchpad Integated with Dex on Nexus',
    url: import.meta.env.VITE_APP_URL || 'https://localhost:5173',
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