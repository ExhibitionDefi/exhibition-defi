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

  const customMessage = "Welcome to Exhibition, a comprehensive launchpad integrated with DEX and dedicated lock, built on Nexus verifiable network for the AI era."

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

  React.useEffect(() => {
    if (isConnected && address) {
      const stored = localStorage.getItem(`walletVerified_${address}`)
      if (stored) {
        const { timestamp } = JSON.parse(stored)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setVerified(true)
          return
        }
      }
      show('verify-wallet' as TransactionType)
    } else {
      setVerified(false)
    }
  }, [isConnected, address, show])

  React.useEffect(() => {
    if (isConnected && address) {
      const stored = localStorage.getItem(`walletVerified_${address}`)
      if (stored) {
        const { timestamp } = JSON.parse(stored)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setVerified(true)
        }
      }
    }
  }, [isConnected, address, isOpen])

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
                <span className="hidden sm:inline text-xl font-bold text-[var(--neon-blue)]">EXHIBITION</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
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

            {/* Right Side - Flex layout to prevent overlap */}
            <div className="flex items-center justify-end gap-1"> 
              {/* Wallet Button - Trimmed */}
              <div className="flex items-center scale-75 origin-right">
                <w3m-button />
              </div>

              {/* Mobile Menu Button - Always visible */}
              <button
                className="md:hidden p-2 rounded-lg text-[var(--metallic-silver)] hover:text-[var(--silver-light)] hover:bg-[var(--silver-dark)]/20 flex-shrink-0"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
            
            {/* Mobile Wallet Button - Show in menu when on small screens */}
            <div className="sm:hidden border-t border-[var(--silver-dark)] px-4 py-3">
              <w3m-button />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <main className={mainContainerClasses}>
          {isConnected && !verified ? (
            <div className="flex justify-center items-center min-h-screen">
              <MultiTransactionModal 
                isOpen={isOpen}
                onClose={() => { hide(); setVerified(true); }}
                transactionType={transactionType}
                message={customMessage}
              />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}