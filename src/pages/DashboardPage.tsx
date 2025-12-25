import React, { lazy, Suspense } from 'react'
import { useAccount } from 'wagmi'
import { LayoutDashboard, Plus, TrendingUp, Wallet, DollarSign, Activity, Zap, Target, Award, Eye } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Link } from 'react-router-dom'
import ExhibitionFormatters from '../utils/exFormatters'
import { useUserProjects } from '@/hooks/launchpad/useUserProjects'
import { useProject } from '@/hooks/launchpad/useProject'
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing'
import { formatUnits } from 'viem'

const ProjectCard = lazy(() => import('../components/project/ProjectCard').then(module => ({
  default: module.ProjectCard
})))

// Component to display a single contribution with project logo
const ContributionCard: React.FC<{ projectId: string; amount: string | bigint; index: number }> = ({ 
  projectId, 
  amount, 
  index 
}) => {
  const { project } = useProject(projectId)
  
  return (
    <Card 
      className="bg-gradient-to-r from-[var(--charcoal)]/80 to-[var(--deep-black)]/80 border border-[var(--neon-orange)]/30 transition-all duration-300 hover:border-[var(--neon-orange)]/50 hover:shadow-lg hover:shadow-[var(--neon-orange)]/10"
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {/* Project Logo */}
          {project?.projectTokenLogoURI ? (
            <img
              src={project.projectTokenLogoURI}
              alt={`${project.tokenName || 'Project'} logo`}
              className="w-10 h-10 rounded-lg object-cover border border-[var(--metallic-silver)]/20 flex-shrink-0"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 drop-shadow-[0_0_4px_var(--neon-orange)]"></div>
          )}
          
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--silver-light)' }}>
              {project?.tokenName || `Project #${projectId}`}
            </p>
            <p className="text-xs" style={{ color: 'var(--metallic-silver)' }}>
              Contributed: {ExhibitionFormatters.formatLargeNumber(BigInt(amount), 18, 2)} tokens
            </p>
            {project?.tokenSymbol && (
              <p className="text-xs font-mono" style={{ color: 'var(--silver-dark)' }}>
                {project.tokenSymbol}
              </p>
            )}
          </div>
        </div>
        
        <Link to={`/projects/${projectId}`}>
          <Button 
            variant="outline" 
            size="sm"
            className="border-[var(--neon-orange)]/50 hover:bg-[var(--neon-orange)]/10 hover:border-[var(--neon-orange)] transition-all duration-300"
            style={{ color: 'var(--silver-light)' }}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View Launch
          </Button>
        </Link>
      </div>
    </Card>
  )
}

const MemoizedContributionCard = React.memo(ContributionCard)

export const DashboardPage: React.FC = () => {
  const { isConnected } = useAccount()
  
  const {
    userProjects,
    userContributions,
    isLoading,
  } = useUserProjects()

  const { getTokenPrice, isReady: isPricingReady } = useLocalPricing()

  // Calculate total raised in USD
  const totalRaisedUSD = React.useMemo(() => {
    if (!isPricingReady || !userProjects) return 0

    let total = 0
    userProjects.forEach(project => {
      const raisedAmount = BigInt(project.totalRaised || 0)
      if (raisedAmount > 0n && project.contributionTokenAddress) {
        const tokenPrice = getTokenPrice(project.contributionTokenAddress)
        
        if (tokenPrice !== null) {
          const decimals = project.contributionTokenDecimals || 18
          const raisedDecimal = parseFloat(formatUnits(raisedAmount, decimals))
          total += raisedDecimal * tokenPrice
        }
      }
    })

    return total
  }, [userProjects, isPricingReady, getTokenPrice])

  const sortedProjects = React.useMemo(() => {
    if (!userProjects) return []
    
    return [...userProjects].sort((a, b) => {
      const getStatusPriority = (status: number) => {
        if (status === 1) return 1 // Active
        if (status === 0) return 2 // Upcoming
        if (status === 4) return 3 // Claimable
        if (status === 2) return 4 // Successful
        if (status === 6) return 5 // Completed
        return 3 // Failed, Refundable, etc.
      }
      
      const aPriority = getStatusPriority(a.status)
      const bPriority = getStatusPriority(b.status)
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      const aRaised = BigInt(a.totalRaised || 0)
      const bRaised = BigInt(b.totalRaised || 0)
      return bRaised > aRaised ? 1 : bRaised < aRaised ? -1 : 0
    })
  }, [userProjects])

  const sortedContributions = React.useMemo(() => {
    if (!userContributions) return []
    
    return [...userContributions].sort((a, b) => {
      const aAmount = BigInt(a.amount || 0)
      const bAmount = BigInt(b.amount || 0)
      return bAmount > aAmount ? 1 : bAmount < aAmount ? -1 : 0
    })
  }, [userContributions])

  if (!isConnected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center p-8 bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/30">
          <div className="space-y-6">
            <div className="relative">
              <Wallet className="h-16 w-16 mx-auto drop-shadow-[0_0_12px_var(--neon-blue)]" style={{ color: 'var(--neon-blue)' }} />
              <div className="absolute -inset-4 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--silver-light)' }}>
                Connect Your Wallet
              </h2>
              <p style={{ color: 'var(--metallic-silver)' }}>
                Connect your wallet to access your personalized dashboard and manage your Launches
              </p>
            </div>
            <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--neon-orange)]/10 p-4 rounded-lg ">
              <w3m-button />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 p-4 rounded-xl border border-[var(--metallic-silver)]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <LayoutDashboard 
                className="h-8 w-8 drop-shadow-[0_0_8px_var(--neon-blue)]" 
                style={{ color: 'var(--neon-blue)' }}
              />
              <div className="absolute -inset-2 bg-[var(--neon-blue)]/20 rounded-full blur-sm"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--silver-light)' }}>
                Dashboard
              </h1>
              <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
                Manage your Launches and track your contributions
              </p>
            </div>
          </div>
          
          <Link to="/create">
            <Button className="bg-gradient-to-r from-[var(--neon-orange)]/80 to-[var(--neon-orange)] hover:from-[var(--neon-orange)] hover:to-[var(--neon-orange)]/80 border-[var(--neon-orange)] shadow-lg shadow-[var(--neon-orange)]/30 transition-all duration-300">
              <Plus className="h-5 w-5 mr-2 drop-shadow-[0_0_4px_currentColor]" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Compact Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/40 transition-all duration-300 hover:border-[var(--neon-blue)]/60 hover:shadow-lg hover:shadow-[var(--neon-blue)]/20">
          <div className="text-center space-y-3 p-4">
            <div className="relative">
              <TrendingUp 
                className="h-8 w-8 mx-auto drop-shadow-[0_0_8px_var(--neon-blue)]" 
                style={{ color: 'var(--neon-blue)' }}
              />
              <div className="absolute -inset-3 bg-[var(--neon-blue)]/10 rounded-full blur-md"></div>
            </div>
            <div>
              <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--silver-light)' }}>
                {sortedProjects.length}
              </p>
              <p className="text-xs" style={{ color: 'var(--metallic-silver)' }}>
                Your Launches
              </p>
            </div>
            <div className="w-full bg-[var(--charcoal)] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)]/70 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(sortedProjects.length * 20, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-orange)]/40 transition-all duration-300 hover:border-[var(--neon-orange)]/60 hover:shadow-lg hover:shadow-[var(--neon-orange)]/20">
          <div className="text-center space-y-3 p-4">
            <div className="relative">
              <Activity 
                className="h-8 w-8 mx-auto drop-shadow-[0_0_8px_var(--neon-orange)]" 
                style={{ color: 'var(--neon-orange)' }}
              />
              <div className="absolute -inset-3 bg-[var(--neon-orange)]/10 rounded-full blur-md"></div>
            </div>
            <div>
              <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--silver-light)' }}>
                {sortedContributions.length}
              </p>
              <p className="text-xs" style={{ color: 'var(--metallic-silver)' }}>
                Contributions Made
              </p>
            </div>
            <div className="w-full bg-[var(--charcoal)] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)]/70 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(sortedContributions.length * 25, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--metallic-silver)]/40 transition-all duration-300 hover:border-[var(--metallic-silver)]/60 hover:shadow-lg hover:shadow-[var(--metallic-silver)]/10">
          <div className="text-center space-y-3 p-4">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--neon-orange)]/10 rounded-full blur-md"></div>
              <div className="relative z-10 w-8 h-8 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] rounded-full mx-auto flex items-center justify-center drop-shadow-[0_0_8px_var(--neon-blue)]">
                <DollarSign className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold mb-0.5" style={{ color: 'var(--silver-light)' }}>
                {isPricingReady 
                  ? `$${totalRaisedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '...'
                }
              </p>
              <p className="text-xs" style={{ color: 'var(--metallic-silver)' }}>
                Total Raised (USD)
              </p>
            </div>
            <div className="w-full bg-[var(--charcoal)] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalRaisedUSD / 1000 * 10, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Your Projects Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Target 
              className="h-5 w-5 drop-shadow-[0_0_6px_var(--neon-blue)]" 
              style={{ color: 'var(--neon-blue)' }}
            />
            <h2 className="text-xl font-bold" style={{ color: 'var(--silver-light)' }}>
              Your Launches
            </h2>
          </div>
          {sortedProjects.length > 0 && (
            <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--metallic-silver)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-blue)] animate-pulse"></div>
              <span>{sortedProjects.length} Active</span>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <LoadingSpinner size="lg" />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p style={{ color: 'var(--metallic-silver)' }}>Loading your launches...</p>
          </div>
        ) : sortedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedProjects.map((project, index) => (
              <div 
                key={project.id.toString()}
                className="transform transition-all duration-300 hover:scale-[1.02]"
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                <Suspense 
                  fallback={
                    <div className="bg-[var(--charcoal)] rounded-xl p-6 h-64 flex items-center justify-center border border-[var(--silver-dark)]/20">
                      <LoadingSpinner size="sm" />
                    </div>
                  }
                >
                  <ProjectCard project={project} />
                </Suspense>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8 bg-gradient-to-br from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 border border-[var(--neon-orange)]/30">
            <div className="space-y-4">
              <Zap 
                className="h-12 w-12 mx-auto opacity-50" 
                style={{ color: 'var(--metallic-silver)' }}
              />
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
                  Ready to Launch?
                </h3>
                <p className="mb-4 max-w-md mx-auto text-sm" style={{ color: 'var(--metallic-silver)' }}>
                  You haven't created any projects yet. Start your journey by launching your first token project.
                </p>
              </div>
              <Link to="/create">
                <Button className="bg-gradient-to-r from-[var(--neon-orange)]/80 to-[var(--neon-orange)] hover:from-[var(--neon-orange)] hover:to-[var(--neon-orange)]/80 border-[var(--neon-orange)] shadow-lg shadow-[var(--neon-orange)]/30">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Launch
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </section>

      {/* Your Contributions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Award 
              className="h-5 w-5 drop-shadow-[0_0_6px_var(--neon-orange)]" 
              style={{ color: 'var(--neon-orange)' }}
            />
            <h2 className="text-xl font-bold" style={{ color: 'var(--silver-light)' }}>
              Your Contributions
            </h2>
          </div>
          {sortedContributions.length > 0 && (
            <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--metallic-silver)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-orange)] animate-pulse"></div>
              <span>{sortedContributions.length} Active</span>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <LoadingSpinner size="lg" />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-orange)]/20 to-[var(--neon-blue)]/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <p style={{ color: 'var(--metallic-silver)' }}>Loading your contributions...</p>
          </div>
        ) : sortedContributions.length > 0 ? (
          <div className="space-y-3">
            {sortedContributions.map(({ projectId, amount }, index) => (
              <MemoizedContributionCard
                key={projectId}
                projectId={projectId}
                amount={amount}
                index={index}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-8 bg-gradient-to-br from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 border border-[var(--neon-blue)]/30">
            <div className="space-y-4">
              <Target 
                className="h-12 w-12 mx-auto opacity-50" 
                style={{ color: 'var(--metallic-silver)' }}
              />
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
                  Start Contributing
                </h3>
                <p className="mb-4 max-w-md mx-auto text-sm" style={{ color: 'var(--metallic-silver)' }}>
                  You haven't contributed to any projects yet. Explore innovative projects and support the ecosystem.
                </p>
              </div>
              <Link to="/projects">
                <Button 
                  variant="outline"
                  className="border-[var(--neon-blue)]/50 hover:bg-[var(--neon-blue)]/10 hover:border-[var(--neon-blue)] transition-all duration-300"
                  style={{ color: 'var(--silver-light)' }}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Explore Projects
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}