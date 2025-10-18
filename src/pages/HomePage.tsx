import React from 'react'
import { Link } from 'react-router-dom'
import { Rocket, TrendingUp, Shield, Zap, Lock, Target, Bot, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useProjects } from '@/hooks/useProjects'
import { ProjectCard } from '@/components/project/ProjectCard'
import { ProjectStatus } from '@/types/project'
import { formatTokenAmount } from '@/utils/exFormatters'

export const HomePage: React.FC = () => {
  const { projects} = useProjects()

  // Get featured projects (active projects)
  const activeProjects = projects
    .filter(p => p.status === ProjectStatus.Active)
    .slice(0, 3)

  const stats = React.useMemo(() => {
    const totalProjects = projects.length
    const activeProjectsCount = projects.filter(p => p.status === ProjectStatus.Active).length
    const successfulProjects = projects.filter(p => p.status === ProjectStatus.Successful || p.status === ProjectStatus.Completed).length
    
    // Calculate total raised and format it properly
    const totalRaisedWei = projects.reduce((sum, p) => sum + BigInt(p.totalRaised || 0), 0n)
    const totalRaisedFormatted = formatTokenAmount(totalRaisedWei, 18, 2)

    return {
      totalProjects,
      activeProjectsCount,
      successfulProjects,
      totalRaised: totalRaisedFormatted
    }
  }, [projects])

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-[var(--silver-light)]">
          Launch Your Token On Exhibition
        </h1>
        <p className="text-xl text-[var(--metallic-silver)] max-w-3xl mx-auto">
          The most advanced decentralized launchpad on Nexus. Launch your token with guaranteed security—blockchain-enforced liquidity locks, protected funding, and transparent vesting. No rug pulls. No surprises.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/create">
            <Button size="lg" className="sm:w-auto">
              <Rocket className="h-5 w-5 mr-2" />
              Launch Your Project
            </Button>
          </Link>
          <Link to="/projects">
            <Button variant="outline" size="lg" className="sm:w-auto">
              Explore Projects
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="text-center hover:border-[var(--neon-blue)]/30 transition-colors duration-300" hover>
            <div className="space-y-2">
              <TrendingUp className="h-8 w-8 text-[var(--neon-blue)] mx-auto drop-shadow-[0_0_6px_var(--neon-blue)]" />
              <p className="text-2xl font-bold text-[var(--silver-light)]">{stats.totalProjects}</p>
              <p className="text-sm text-[var(--metallic-silver)]">Total Projects</p>
            </div>
          </Card>

          <Card className="text-center hover:border-[var(--neon-orange)]/30 transition-colors duration-300" hover>
            <div className="space-y-2">
              <Rocket className="h-8 w-8 text-[var(--neon-orange)] mx-auto drop-shadow-[0_0_6px_var(--neon-orange)]" />
              <p className="text-2xl font-bold text-[var(--silver-light)]">{stats.activeProjectsCount}</p>
              <p className="text-sm text-[var(--metallic-silver)]">Active Projects</p>
            </div>
          </Card>

          <Card className="text-center hover:border-[var(--neon-blue)]/30 transition-colors duration-300" hover>
            <div className="space-y-2">
              <Shield className="h-8 w-8 text-[var(--neon-blue)] mx-auto drop-shadow-[0_0_6px_var(--neon-blue)]" />
              <p className="text-2xl font-bold text-[var(--silver-light)]">{stats.successfulProjects}</p>
              <p className="text-sm text-[var(--metallic-silver)]">Successful Launches</p>
            </div>
          </Card>

          <Card className="text-center hover:border-[var(--neon-orange)]/30 transition-colors duration-300" hover>
            <div className="space-y-2">
              <Zap className="h-8 w-8 text-[var(--neon-orange)] mx-auto drop-shadow-[0_0_6px_var(--neon-orange)]" />
              <p className="text-2xl font-bold text-[var(--silver-light)]">${stats.totalRaised}</p>
              <p className="text-sm text-[var(--metallic-silver)]">Total Raised</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--silver-light)] mb-4">
            Why Choose Exhibition?
          </h2>
          <p className="text-lg text-[var(--metallic-silver)]">
            Built for the future of decentralized fundraising
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="text-center hover:border-[var(--neon-blue)]/30 transition-all duration-300" hover>
            <Lock className="h-12 w-12 text-[var(--neon-blue)] mx-auto mb-4 drop-shadow-[0_0_8px_var(--neon-blue)]" />
            <h3 className="text-xl font-semibold text-[var(--silver-light)] mb-2">Liquidity Lock Enforcement</h3>
            <p className="text-[var(--metallic-silver)]">
              Smart contract-enforced liquidity locks (minimum 21 days on testnet). Project owners cannot rug pull - the blockchain guarantees it.
            </p>
          </Card>

          <Card className="text-center hover:border-[var(--neon-orange)]/30 transition-all duration-300" hover>
            <BarChart3 className="h-12 w-12 text-[var(--neon-orange)] mx-auto mb-4 drop-shadow-[0_0_8px_var(--neon-orange)]" />
            <h3 className="text-xl font-semibold text-[var(--silver-light)] mb-2">Fair Token Distribution</h3>
            <p className="text-[var(--metallic-silver)]">
              Transparent vesting schedules with cliff periods. Contributors see exactly when they can claim tokens - no surprises, no games.
            </p>
          </Card>

          <Card className="text-center hover:border-[var(--neon-blue)]/30 transition-all duration-300" hover>
            <Shield className="h-12 w-12 text-[var(--neon-blue)] mx-auto mb-4 drop-shadow-[0_0_8px_var(--neon-blue)]" />
            <h3 className="text-xl font-semibold text-[var(--silver-light)] mb-2">Soft Cap Protection</h3>
            <p className="text-[var(--metallic-silver)]">
              Projects must reach their soft cap or all funds are refunded. Your capital is protected by smart contract logic.
            </p>
          </Card>

          <Card className="text-center hover:border-[var(--neon-orange)]/30 transition-all duration-300" hover>
            <Target className="h-12 w-12 text-[var(--neon-orange)] mx-auto mb-4 drop-shadow-[0_0_8px_var(--neon-orange)]" />
            <h3 className="text-xl font-semibold text-[var(--silver-light)] mb-2">Hard Cap Limits</h3>
            <p className="text-[var(--metallic-silver)]">
              Instant finalization when hard cap is reached. No over-funding, no whale manipulation - just fair launches for everyone.
            </p>
          </Card>

          <Card className="text-center hover:border-[var(--neon-blue)]/30 transition-all duration-300" hover>
            <Zap className="h-12 w-12 text-[var(--neon-blue)] mx-auto mb-4 drop-shadow-[0_0_8px_var(--neon-blue)]" />
            <h3 className="text-xl font-semibold text-[var(--silver-light)] mb-2">Automatic LP Creation</h3>
            <p className="text-[var(--metallic-silver)]">
              Initial liquidity is automatically added to our AMM and locked. Project owners can't touch it until the lock period expires.
            </p>
          </Card>

          <Card className="text-center hover:border-[var(--neon-orange)]/30 transition-all duration-300" hover>
            <Bot className="h-12 w-12 text-[var(--neon-orange)] mx-auto mb-4 drop-shadow-[0_0_8px_var(--neon-orange)]" />
            <h3 className="text-xl font-semibold text-[var(--silver-light)] mb-2">Built for AI Era</h3>
            <p className="text-[var(--metallic-silver)]">
              Deployed on Nexus Verifiable Layer Network -- the blockchain designed for verifiable AI computations and next-gen applications.
            </p>
          </Card>
        </div>
      </section>

      {/* Active Projects Section */}
      {activeProjects.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[var(--silver-light)]">
              Active Projects
            </h2>
            <Link to="/projects">
              <Button variant="outline">
                View All Projects
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.map((project) => (
              <ProjectCard key={project.id.toString()} project={project} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}