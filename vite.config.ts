import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // ✅ Enable source maps for production debugging
    sourcemap: true,
    
    // ✅ Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    
    // ✅ Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          
          // Wagmi and blockchain libraries
          'vendor-wagmi': ['wagmi', 'viem'],
          
          // Wallet connection libraries (large bundle)
          'vendor-wallet': ['@reown/appkit', '@reown/appkit-adapter-wagmi'],
          
          // UI libraries
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          
          // Query and state management
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
  
  // ✅ Optimize dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'wagmi', 
      'viem',
      'lucide-react',
      '@tanstack/react-query',
    ],
  },
  
  // ✅ Better error logging in dev
  server: {
    port: 3000,
    strictPort: false,
  },
})