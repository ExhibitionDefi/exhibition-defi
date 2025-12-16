import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { wagmiAdapter } from './config/wagmi'
// Pages
import { HomePage } from './pages/HomePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { CreateProjectPage } from './pages/CreateProjectPage'
import { DashboardPage } from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import { SwapPage } from './pages/SwapPage'
import { LiquidityPage } from './pages/LiquidityPage'
import { ManageLiquidityPage } from './pages/ManageLiquidityPage'
import { FaucetPage } from './pages/FaucetPage'
// Layout
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/create" element={<CreateProjectPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/swap" element={<SwapPage />} />
              <Route path="/liquidity" element={<LiquidityPage />} />
              <Route path="/liquidity/manage" element={<ManageLiquidityPage />} />
              <Route path="/faucet" element={<FaucetPage />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </Layout>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App