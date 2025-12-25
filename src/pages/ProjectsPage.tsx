import React, { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ProjectFilters } from '../components/project/ProjectFilters'
import { useProjects } from '../hooks/launchpad/useProjects'
import { useProjectStore } from '../stores/projectStore'
import { Button } from '../components/ui/Button'
import { Search, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { ProjectStatus } from '@/types/project'
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing'
import { formatUnits } from 'viem'

const ProjectCard = lazy(() => import('../components/project/ProjectCard').then(module => ({
  default: module.ProjectCard
})))

const PROJECTS_PER_LOAD = 12

export const ProjectsPage: React.FC = () => {
  const { projects: allProjects, isLoading, error } = useProjects()
  const { searchQuery, statusFilter } = useProjectStore()
  const { getTokenPrice, isReady: isPricingReady } = useLocalPricing()
  
  const [displayCount, setDisplayCount] = useState(PROJECTS_PER_LOAD)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const calculateProjectUSD = React.useCallback((project: typeof allProjects[0]): number => {
    if (!isPricingReady || !project.contributionTokenAddress) return 0
    
    const tokenPrice = getTokenPrice(project.contributionTokenAddress)
    if (tokenPrice === null) return 0
    
    const decimals = project.contributionTokenDecimals || 18
    const raisedDecimal = parseFloat(formatUnits(project.totalRaised, decimals))
    
    return raisedDecimal * tokenPrice
  }, [isPricingReady, getTokenPrice])

  const filteredProjects = React.useMemo(() => {
    let filtered = allProjects

    if (statusFilter !== null) {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        (p.tokenName?.toLowerCase().includes(query) ?? false) ||
        (p.tokenSymbol?.toLowerCase().includes(query) ?? false) ||
        (p.projectOwner?.toLowerCase().includes(query) ?? false)
      )
    }

    filtered.sort((a, b) => {
      const getStatusPriority = (status: number) => {
        if (status === ProjectStatus.Active) return 1
        if (status === ProjectStatus.Upcoming) return 2
        if (status === ProjectStatus.Claimable) return 3
        if (status === ProjectStatus.Successful) return 4
        if (status === ProjectStatus.Completed) return 5
        return 6
      }
      
      const aPriority = getStatusPriority(a.status)
      const bPriority = getStatusPriority(b.status)
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      const aUSD = calculateProjectUSD(a)
      const bUSD = calculateProjectUSD(b)
      
      return bUSD - aUSD
    })

    return filtered
  }, [allProjects, statusFilter, searchQuery, calculateProjectUSD])

  useEffect(() => {
    setDisplayCount(PROJECTS_PER_LOAD)
  }, [searchQuery, statusFilter])

  const displayedProjects = React.useMemo(() => {
    return filteredProjects.slice(0, displayCount)
  }, [filteredProjects, displayCount])

  const hasMore = displayCount < filteredProjects.length

  useEffect(() => {
    if (!hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount(prev => prev + PROJECTS_PER_LOAD)
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasMore, isLoading])

  const stats = React.useMemo(() => {
    const totalProjects = allProjects.length
    const completedCount = allProjects.filter(p => p.status === ProjectStatus.Completed).length
    const successfulCount = allProjects.filter(p => p.status === ProjectStatus.Successful).length
    const liveCount = allProjects.filter(p => 
      p.status === ProjectStatus.Active || 
      p.status === ProjectStatus.Upcoming ||
      p.status === ProjectStatus.Claimable
    ).length

    return { totalProjects, completedCount, successfulCount, liveCount }
  }, [allProjects])

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-64 space-y-4">
        <div className="relative">
          <LoadingSpinner size="lg" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
        </div>
        <p className="text-lg font-medium" style={{ color: 'var(--silver-light)' }}>
          Loading launches...
        </p>
        <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
          Discovering innovative token launches
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 p-6 rounded-xl border border-red-500/30 max-w-md mx-auto">
          <AlertCircle 
            className="h-12 w-12 mx-auto mb-4 drop-shadow-[0_0_8px_#ef4444]" 
            style={{ color: '#ef4444' }}
          />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
            Failed to Load launches
          </h3>
          <p className="text-red-400 mb-4">
            Unable to fetch launch data. Please check your connection and try again.
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Compact Header */}
      <div className="text-center space-y-3">
        <div className="relative">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--silver-light)' }}>
            Live & Upcoming Launches
          </h1>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] rounded-full opacity-60"></div>
        </div>
        <p className="text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--metallic-silver)' }}>
          Browse primary-market launches on Nexus Layer 1 <span className="text-[var(--neon-orange)]">testnet</span> with protocol-enforced liquidity, deterministic finalization, and verifiable on-chain execution.
        </p>

        {/* Compact Stats - Single Row, Inline */}
        <div className="flex items-center justify-center gap-6 text-xs pt-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--neon-blue)' }} />
            <span className="font-bold text-base" style={{ color: 'var(--silver-light)' }}>
              {stats.totalProjects}
            </span>
            <span style={{ color: 'var(--metallic-silver)' }}>Total</span>
          </div>
          
          <div className="w-px h-4 bg-[var(--metallic-silver)]/30"></div>
          
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-orange)] animate-pulse"></div>
            <span className="font-bold text-base" style={{ color: 'var(--silver-light)' }}>
              {stats.liveCount}
            </span>
            <span style={{ color: 'var(--metallic-silver)' }}>Live</span>
          </div>
          
          <div className="w-px h-4 bg-[var(--metallic-silver)]/30"></div>
          
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" style={{ color: 'var(--neon-blue)' }} />
            <span className="font-bold text-base" style={{ color: 'var(--silver-light)' }}>
              {stats.completedCount}
            </span>
            <span style={{ color: 'var(--metallic-silver)' }}>Completed</span>
          </div>
        </div>
      </div>

      {/* Compact Filters - No background card */}
      <div className="border-t border-b border-[var(--metallic-silver)]/10 py-3">
        <ProjectFilters />
      </div>

      {/* Compact Results Count - Smaller, inline */}
      <div className="flex justify-between items-center text-xs px-1">
        <p style={{ color: 'var(--metallic-silver)' }}>
          <span className="font-medium" style={{ color: 'var(--silver-light)' }}>
            {displayedProjects.length}
          </span> of {filteredProjects.length} {filteredProjects.length === 1 ? 'launch' : 'launches'}
        </p>
        {isPricingReady && (
          <p style={{ color: 'var(--metallic-silver)' }}>
            Ranked by USD value
          </p>
        )}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gradient-to-r from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 p-8 rounded-xl border border-[var(--metallic-silver)]/20 max-w-md mx-auto">
            <Search 
              className="h-12 w-12 mx-auto mb-4 opacity-50" 
              style={{ color: 'var(--metallic-silver)' }}
            />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
              No Launches Found
            </h3>
            <p style={{ color: 'var(--metallic-silver)' }}>
              No launches match your current search criteria. Try adjusting your filters or check back later for new launches.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedProjects.map((project, index) => (
              <div 
                key={project.id.toString()}
                className="transform transition-all duration-300 hover:scale-[1.02]"
                style={{
                  animationDelay: `${index * 100}ms`
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

          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              <LoadingSpinner size="md" />
              <p className="ml-3 text-sm" style={{ color: 'var(--metallic-silver)' }}>
                Loading more launches...
              </p>
            </div>
          )}

          {!hasMore && filteredProjects.length > PROJECTS_PER_LOAD && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: 'var(--metallic-silver)' }}>
                You've reached the end of the list
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}