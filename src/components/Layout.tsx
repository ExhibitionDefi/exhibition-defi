import React, { lazy, Suspense, useMemo, useCallback } from 'react'
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
import type { TransactionType } from '@/components/common/MultiTransactionModal'
import { getCurrentUser, logout } from '@/utils/api'
import exhLogo from '@/assets/svg.svg'

// ✅ Lazy load the heavy MultiTransactionModal
const MultiTransactionModal = lazy(() => 
  import('@/components/common/MultiTransactionModal').then(module => ({
    default: module.MultiTransactionModal
  }))
)

interface LayoutProps {
  children: React.ReactNode
  mainClassName?: string
  disableContainer?: boolean
  disablePadding?: boolean
  headerClassName?: string
}

// ✅ Memoize navigation item component to prevent unnecessary re-renders
const NavigationItem = React.memo<{
  item: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }
  isActive: boolean
  onClick?: () => void
}>(({ item, isActive, onClick }) => {
  const Icon = item.icon
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={clsx(
        'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-[var(--neon-blue-tone)] text-[var(--neon-blue)] shadow-[0_0_4px_var(--neon-blue)]/30'
          : 'text-[var(--metallic-silver)] hover:text-[var(--silver-light)] hover:bg-[var(--silver-dark)]/10'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.name}</span>
    </Link>
  )
})

NavigationItem.displayName = 'NavigationItem'

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

  const customMessage ="Welcome to Exhibition. A trustless launch infrastructure on Nexus Layer 1 where public sale funds secure liquidity by default. No market makers. No broken agreements.";

  // ✅ Memoize navigation array - it never changes
  const navigation = useMemo(() => [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Launches', href: '/projects', icon: Rocket },
    { name: 'Create Launch', href: '/create', icon: PlusCircle },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Swap', href: '/swap', icon: ArrowUpDown },
    { name: 'Liquidity', href: '/liquidity', icon: Droplets },
    { name: 'Faucet', href: '/faucet', icon: Droplets },
    { name: 'Admin', href: '/admin', icon: Settings },
  ], [])

  // ✅ Memoize the active path checker
  const isActivePath = useCallback((path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }, [location.pathname])

  // ✅ Memoize container classes
  const mainContainerClasses = useMemo(() => clsx(
    !disableContainer && 'max-w-7xl mx-auto',
    !disablePadding && 'px-4 sm:px-6 lg:px-8 py-10',
    mainClassName
  ), [disableContainer, disablePadding, mainClassName])

  // ✅ Memoize mobile menu close handler
  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuOpen(false)
  }, [])

  // ✅ Check backend auth on mount/wallet change
  React.useEffect(() => {
    if (isConnected && address) {
      const checkAuth = async () => {
        setIsCheckingAuth(true)
        
        try {
          const response = await getCurrentUser()
          
          // ✅ CHECK: JWT address must match connected wallet
          if (response.success && response.data?.address.toLowerCase() === address.toLowerCase()) {
            setVerified(true)
          } else if (response.success && response.data?.address.toLowerCase() !== address.toLowerCase()) {
            // JWT is for different wallet, clear it and re-verify
            await logout()
            setVerified(false)
            show('verify-wallet' as TransactionType)
          } else {
            setVerified(false)
            show('verify-wallet' as TransactionType)
          }
        } catch (error) {
          setVerified(false)
          show('verify-wallet' as TransactionType)
        } finally {
          setIsCheckingAuth(false)
        }
      }
      
      checkAuth()
    } else {
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
            setVerified(true)
          }
        } catch (error) {
          // Silent fail on re-check
        }
      }
      
      recheckAuth()
    }
  }, [isOpen, isConnected, address, verified])

  // ✅ Memoize visibility flags
  const shouldShowContent = useMemo(
    () => !isConnected || (isConnected && verified),
    [isConnected, verified]
  )
  const shouldShowVerificationModal = useMemo(
    () => isConnected && !verified && !isCheckingAuth,
    [isConnected, verified, isCheckingAuth]
  )
  const shouldShowLoadingSpinner = useMemo(
    () => isConnected && isCheckingAuth,
    [isConnected, isCheckingAuth]
  )

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
                <img
                  src={exhLogo}
                  alt="EXH logo"
                  className="w-8 h-8 rounded-lg shadow-[0_0_8px_var(--neon-blue)]/40"
                  loading="eager"
                />
                <span className="text-sm text-[var(--neon-orange)] underline underline-offset-4 decoration-current">
                  TESTNET
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigation.map((item) => (
                <NavigationItem
                  key={item.href}
                  item={item}
                  isActive={isActivePath(item.href)}
                />
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center justify-end gap-1 md:gap-3"> 
              {/* Wallet Button */}
              <div className="flex items-center">
                <w3m-button />
              </div>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg text-[var(--metallic-silver)] hover:text-[var(--silver-light)] hover:bg-[var(--silver-dark)]/20 flex-shrink-0"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--silver-dark)] bg-[var(--charcoal)]">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => (
                <NavigationItem
                  key={item.href}
                  item={item}
                  isActive={isActivePath(item.href)}
                  onClick={handleMobileMenuClose}
                />
              ))}
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
          {/* Loading Spinner - Checking auth after wallet connection */}
          {shouldShowLoadingSpinner && (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neon-blue)] mx-auto mb-4"></div>
                <p className="text-[var(--silver-light)]">Verifying wallet...</p>
              </div>
            </div>
          )}

          {/* Verification Modal - Show when connected but not verified */}
          {shouldShowVerificationModal && (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
              <Suspense fallback={
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--neon-blue)] mx-auto mb-4"></div>
                  <p className="text-[var(--silver-light)]">Loading...</p>
                </div>
              }>
                <MultiTransactionModal 
                  isOpen={isOpen}
                  onClose={hide}
                  transactionType={transactionType}
                  message={customMessage}
                  signMessageText={customMessage}
                />
              </Suspense>
            </div>
          )}

          {/* ✅ Content - Show when NOT connected OR when verified */}
          {shouldShowContent && children}
        </main>
      </div>
    </div>
  )
}