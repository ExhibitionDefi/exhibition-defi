import React from 'react'
import { Link } from 'react-router-dom'
import { Rocket, TrendingUp, Shield, Zap, Lock, Target, Bot, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useProjects } from '@/hooks/launchpad/useProjects'
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing'
import { ProjectCard } from '@/components/project/ProjectCard'
import { ProjectStatus } from '@/types/project'
import { formatUnits } from 'viem'

export const HomePage: React.FC = () => {
  const { projects } = useProjects()
  const { getTokenPrice, isReady: isPricingReady } = useLocalPricing()

  // Get featured projects (active projects)
  const activeProjects = projects
    .filter(p => p.status === ProjectStatus.Active)
    .sort((a, b) => {
      const aRaised = BigInt(a.totalRaised || 0)
      const bRaised = BigInt(b.totalRaised || 0)
      return bRaised > aRaised ? 1 : bRaised < aRaised ? -1 : 0
    })
    .slice(0, 3)

  const stats = React.useMemo(() => {
    const totalProjects = projects.length
    const activeProjectsCount = projects.filter(p => p.status === ProjectStatus.Active).length
    const successfulProjects = projects.filter(
      p => p.status === ProjectStatus.Successful || p.status === ProjectStatus.Completed
    ).length
    
    // Calculate total raised in USD
    let totalRaisedUSD = 0
    
    if (isPricingReady) {
      projects.forEach(project => {
        const raisedAmount = BigInt(project.totalRaised || 0)
        if (raisedAmount > 0n && project.contributionTokenAddress) {
          // Get the price of the payment token
          const tokenPrice = getTokenPrice(project.contributionTokenAddress )
          
          if (tokenPrice !== null) {
            // Convert raised amount to decimal and multiply by token price
            const decimals = project.contributionTokenDecimals || 18
            const raisedDecimal = parseFloat(formatUnits(raisedAmount, decimals))
            totalRaisedUSD += raisedDecimal * tokenPrice
          }
        }
      })
    }

    const totalRaisedFormatted = totalRaisedUSD > 0 
      ? totalRaisedUSD.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '0.00'

    return {
      totalProjects,
      activeProjectsCount,
      successfulProjects,
      totalRaised: totalRaisedFormatted
    }
  }, [projects, isPricingReady, getTokenPrice])

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-3xl md:text-5xl font-bold text-[var(--silver-light)]">
          Trustless Launches, Secured by Code
        </h1>
        <p className="text-lg text-[var(--metallic-silver)] max-w-3xl mx-auto">
          Exhibition replaces discretionary market makers with protocol-enforced liquidity.
          Public sale capital is locked on-chain by default, enabling deterministic market initialization
          and verifiable primary-market launches on Nexus Layer 1.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/create">
            <Button size="lg" className="sm:w-auto">
              <Rocket className="h-5 w-5 mr-2" />
              Create Launch
            </Button>
          </Link>
          <Link to="/projects">
            <Button variant="outline" size="lg" className="sm:w-auto">
              Browse Launches
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
          <Card className="text-center hover:border-[var(--neon-blue)]/30 transition-colors duration-300" hover>
            <div className="space-y-2">
              <TrendingUp className="h-6 w-6 text-[var(--neon-blue)] mx-auto drop-shadow-[0_0_6px_var(--neon-blue)]" />
              <p className="text-xl font-bold text-[var(--silver-light)]">{stats.totalProjects}</p>
              <p className="text-xs text-[var(--metallic-silver)]">Total Launches</p>
            </div>
          </Card>

          <Card className="text-center hover:border-[var(--neon-orange)]/30 transition-colors duration-300" hover>
            <div className="space-y-2">
              <Rocket className="h-6 w-6 text-[var(--neon-orange)] mx-auto drop-shadow-[0_0_6px_var(--neon-orange)]" />
              <p className="text-xl font-bold text-[var(--silver-light)]">{stats.activeProjectsCount}</p>
              <p className="text-xs text-[var(--metallic-silver)]">Active Launches</p>
            </div>
          </Card>

          <Card className="text-center hover:border-[var(--neon-blue)]/30 transition-colors duration-300" hover>
            <div className="space-y-2">
              <Shield className="h-6 w-6 text-[var(--neon-blue)] mx-auto drop-shadow-[0_0_6px_var(--neon-blue)]" />
              <p className="text-xl font-bold text-[var(--silver-light)]">{stats.successfulProjects}</p>
              <p className="text-xs text-[var(--metallic-silver)]">Successful Launches</p>
            </div>
          </Card>

          <Card className="text-center hover:border-[var(--neon-orange)]/30 transition-colors duration-300" hover>
            <div className="space-y-2">
              <Zap className="h-6 w-6 text-[var(--neon-orange)] mx-auto drop-shadow-[0_0_6px_var(--neon-orange)]" />
              <p className="text-xl font-bold text-[var(--silver-light)]">
                ${isPricingReady ? stats.totalRaised : '...'}
              </p>
              <p className="text-xs text-[var(--metallic-silver)]">Total Raised</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--silver-light)] mb-3">
            Verifiable Primary-Market Infrastructure
          </h2>
          <p className="text-base text-[var(--metallic-silver)]">
           Exhibition enforces liquidity bootstrapping and deterministic market initialization as on-chain exchange primitives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="text-center hover:border-[var(--neon-blue)]/30 transition-all duration-300" hover>
            <Lock className="h-10 w-10 text-[var(--neon-blue)] mx-auto mb-3 drop-shadow-[0_0_8px_var(--neon-blue)]" />
            <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-2">Liquidity Lock Enforcement</h3>
            <p className="text-sm text-[var(--metallic-silver)]">
             Launch-time liquidity is created and locked as a protocol-enforced invariant. Once finalized, liquidity cannot be withdrawn or modified outside the defined rules.
            </p>
          </Card>

          <Card className="text-center hover:border-[var(--neon-orange)]/30 transition-all duration-300" hover>
            <BarChart3 className="h-10 w-10 text-[var(--neon-orange)] mx-auto mb-3 drop-shadow-[0_0_8px_var(--neon-orange)]" />
            <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-2">Deterministic Market Initialization</h3>
            <p className="text-sm text-[var(--metallic-silver)]">
             The initial market is instantiated through protocol-defined AMM liquidity, without discretionary market makers. Pricing parameters are transparent and verifiable from the first trade.
            </p>
          </Card>

          <Card className="text-center hover:border-[var(--neon-blue)]/30 transition-all duration-300" hover>
            <Shield className="h-10 w-10 text-[var(--neon-blue)] mx-auto mb-3 drop-shadow-[0_0_8px_var(--neon-blue)]" />
            <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-2">Soft Cap Protection</h3>
            <p className="text-sm text-[var(--metallic-silver)]">
             If the minimum raise is not met, finalization is impossible by design. All funds remain refundable without administrative intervention.
            </p>
          </Card>

          <Card className="text-center hover:border-[var(--neon-orange)]/30 transition-all duration-300" hover>
            <Target className="h-10 w-10 text-[var(--neon-orange)] mx-auto mb-3 drop-shadow-[0_0_8px_var(--neon-orange)]" />
            <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-2">Hard Cap Limits</h3>
            <p className="text-sm text-[var(--metallic-silver)]">
             Sales finalize deterministically once the hard cap is reached. Capital intake is bounded and enforced by protocol logic.
            </p>
          </Card>

          <Card className="text-center hover:border-[var(--neon-blue)]/30 transition-all duration-300" hover>
            <Zap className="h-10 w-10 text-[var(--neon-blue)] mx-auto mb-3 drop-shadow-[0_0_8px_var(--neon-blue)]" />
            <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-2">Liquidity Bootstrapping</h3>
            <p className="text-sm text-[var(--metallic-silver)]">
              Public sale capital is programmatically converted into AMM liquidity at finalization. Liquidity is live from day one and secured by protocol defaults.
            </p>
          </Card>

          <Card className="text-center hover:border-[var(--neon-orange)]/30 transition-all duration-300" hover>
            <Bot className="h-10 w-10 text-[var(--neon-orange)] mx-auto mb-3 drop-shadow-[0_0_8px_var(--neon-orange)]" />
            <h3 className="text-lg font-semibold text-[var(--silver-light)] mb-2">Native to Nexus Layer 1</h3>
            <p className="text-sm text-[var(--metallic-silver)]">
              Exhibition is deployed on Nexus — a Layer 1 optimized for verifiable, high-performance exchange computation and deterministic settlement.
            </p>
          </Card>
        </div>
      </section>

      {/* Active Projects Section */}
      {activeProjects.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--silver-light)]">
              Active Launches
            </h2>
            <Link to="/projects">
              <Button variant="outline">
                View All Launches
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeProjects.map((project) => (
              <ProjectCard key={project.id.toString()} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}