import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Rocket, 
  PlusCircle, 
  LayoutDashboard, 
  Settings,
  ArrowUpDown,
  Droplets,
  Menu,
  X
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAccount } from 'wagmi'
import { useMultiTransactionModal } from '@/components/common/MultiTransactionModal'
import { MultiTransactionModal } from '@/components/common/MultiTransactionModal'
import type { TransactionType } from '@/components/common/MultiTransactionModal'
import { getCurrentUser, logout } from '@/utils/api' // ← ADD logout

interface LayoutProps {
  children: React.ReactNode
  mainClassName?: string
  disableContainer?: boolean
  disablePadding?: boolean
  headerClassName?: string
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  mainClassName,
  disableContainer = false,
  disablePadding = false,
  headerClassName
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const location = useLocation()
  const { address, isConnected } = useAccount()
  const { show, hide, isOpen, transactionType } = useMultiTransactionModal()
  const [verified, setVerified] = React.useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(false)

  const customMessage = "Welcome to Exhibition, a comprehensive token launchpad integrated with DEX and dedicated lock, built on Nexus verifiable network for the AI era."

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Projects', href: '/projects', icon: Rocket },
    { name: 'Create Project', href: '/create', icon: PlusCircle },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Swap', href: '/swap', icon: ArrowUpDown },
    { name: 'Liquidity', href: '/liquidity', icon: Droplets },
    { name: 'Faucet', href: '/faucet', icon: Droplets },
    { name: 'Admin', href: '/admin', icon: Settings },
  ]

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const mainContainerClasses = clsx(
    !disableContainer && 'max-w-7xl mx-auto',
    !disablePadding && 'px-4 sm:px-6 lg:px-8 py-10',
    mainClassName
  )

  // ✅ Check backend auth on mount/wallet change
  React.useEffect(() => {
    console.log('🔍 Layout: Connection changed', { isConnected, address })
    
    if (isConnected && address) {
      const checkAuth = async () => {
        setIsCheckingAuth(true)
        console.log('🔍 Layout: Checking auth for', address)
        
        try {
          const response = await getCurrentUser()
          console.log('🔍 Layout: Auth response', response)
          
          // ✅ CHECK: JWT address must match connected wallet
          if (response.success && response.data?.address.toLowerCase() === address.toLowerCase()) {
            console.log('✅ User authenticated:', response.data?.address)
            setVerified(true)
          } else if (response.success && response.data?.address.toLowerCase() !== address.toLowerCase()) {
            // JWT is for different wallet, clear it and re-verify
            console.log('⚠️  JWT is for different wallet, clearing and re-verifying')
            await logout()
            setVerified(false)
            show('verify-wallet' as TransactionType)
          } else {
            console.log('⚠️  No valid JWT, showing verification modal')
            setVerified(false)
            show('verify-wallet' as TransactionType)
          }
        } catch (error) {
          console.log('❌ Auth check failed:', error)
          setVerified(false)
          show('verify-wallet' as TransactionType)
        } finally {
          setIsCheckingAuth(false)
        }
      }
      
      checkAuth()
    } else {
      console.log('🔍 Layout: Not connected, setting verified=false')
      setVerified(false)
    }
  }, [isConnected, address, show])

  // ✅ Re-check auth when modal closes
  React.useEffect(() => {
    if (!isOpen && isConnected && address && !verified) {
      const recheckAuth = async () => {
        try {
          const response = await getCurrentUser()
          if (response.success && response.data?.address.toLowerCase() === address.toLowerCase()) {
            console.log('✅ Re-check: User authenticated')
            setVerified(true)
          } else {
            console.log('⚠️  Re-check: Address mismatch or not authenticated')
          }
        } catch (error) {
          console.log('⚠️  Re-check: Still not authenticated')
        }
      }
      
      recheckAuth()
    }
  }, [isOpen, isConnected, address, verified])

  // ✅ CRITICAL: Determine if user can access the app
  // User MUST be connected AND verified to see content
  const canAccessApp = isConnected && verified
  const shouldShowConnectPrompt = !isConnected
  const shouldShowVerificationModal = isConnected && !verified && !isCheckingAuth
  const shouldShowLoadingSpinner = isConnected && isCheckingAuth

  return (
    <div className="min-h-screen bg-[var(--deep-black)]">
      {/* Fixed Header */}
      <header className={clsx(
        "fixed top-0 left-0 right-0 z-50 bg-[var(--charcoal)] shadow-sm border-b border-[var(--silver-dark)]",
        headerClassName
      )}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-orange)] rounded-lg flex items-center justify-center shadow-[0_0_8px_var(--neon-blue)]/40">
                  <span className="font-bold text-sm text-[var(--deep-black)]">EXH</span>
                </div>
                <span className={clsx(
                  'text-xl font-bold text-[var(--neon-blue)]',
                  isConnected && 'hidden sm:inline'
                )}>EXHIBITION</span>
              </Link>
            </div>

            {/* Desktop Navigation - Only show if user can access */}
            {canAccessApp && (
              <nav className="hidden md:flex space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={clsx(
                        'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActivePath(item.href)
                          ? 'bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] border border-[var(--neon-blue)] shadow-[0_0_4px_var(--neon-blue)]/30'
                          : 'text-[var(--metallic-silver)] hover:text-[var(--silver-light)] hover:bg-[var(--silver-dark)]/10'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            )}

            {/* Right Side */}
            <div className="flex items-center justify-end gap-1 md:gap-3"> 
              {/* Wallet Button */}
              <div className="flex items-center">
                <w3m-button />
              </div>

              {/* Mobile Menu Button - Only show if user can access */}
              {canAccessApp && (
                <button
                  className="md:hidden p-2 rounded-lg text-[var(--metallic-silver)] hover:text-[var(--silver-light)] hover:bg-[var(--silver-dark)]/20 flex-shrink-0"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation - Only show if user can access */}
        {canAccessApp && isMobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--silver-dark)] bg-[var(--charcoal)]">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={clsx(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActivePath(item.href)
                        ? 'bg-[var(--neon-blue)]/20 text-[var(--neon-blue)] border border-[var(--neon-blue)]'
                        : 'text-[var(--metallic-silver)] hover:text-[var(--silver-light)] hover:bg-[var(--silver-dark)]/10'
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
            
            {/* Mobile Wallet Button */}
            <div className="sm:hidden border-t border-[var(--silver-dark)] px-4 py-3">
              <w3m-button />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="pt-16">
        <main className={mainContainerClasses}>
          {/* ✅ OPTION 1: Block everything until verified */}
          {shouldShowConnectPrompt && (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-orange)] rounded-2xl flex items-center justify-center shadow-[0_0_30px_var(--neon-blue)]/40 mb-6">
                <span className="font-bold text-3xl text-[var(--deep-black)]">EXH</span>
              </div>
              <h1 className="text-3xl font-bold text-[var(--silver-light)] mb-4">
                Welcome to Exhibition
              </h1>
              <p className="text-[var(--silver-dark)] mb-8 max-w-md">
                A comprehensive launchpad integrated with DEX and dedicated lock, built on Nexus verifiable network for the AI era.
              </p>
              <div className="bg-[var(--charcoal)] border border-[var(--silver-dark)] rounded-xl p-6">
                <p className="text-[var(--silver-light)] mb-4">
                  Connect your wallet to get started
                </p>
                <w3m-button />
              </div>
            </div>
          )}

          {shouldShowLoadingSpinner && (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neon-blue)] mx-auto mb-4"></div>
                <p className="text-[var(--silver-light)]">Checking authentication...</p>
              </div>
            </div>
          )}

          {shouldShowVerificationModal && (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
              <MultiTransactionModal 
                isOpen={isOpen}
                onClose={hide}
                transactionType={transactionType}
                message={customMessage}
                signMessageText={customMessage}
              />
            </div>
          )}

          {/* ✅ ONLY render children when fully authenticated */}
          {canAccessApp && children}
        </main>
      </div>
    </div>
  )
}