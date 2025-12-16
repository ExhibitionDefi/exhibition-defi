import React, { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ProjectFilters } from '../components/project/ProjectFilters'
import { useProjects } from '../hooks/launchpad/useProjects'
import { useProjectStore } from '../stores/projectStore'
import { Button } from '../components/ui/Button'
import { Search, TrendingUp, AlertCircle } from 'lucide-react'
import { ProjectStatus } from '@/types/project'

// ✅ Lazy load ProjectCard
const ProjectCard = lazy(() => import('../components/project/ProjectCard').then(module => ({
  default: module.ProjectCard
})))

const PROJECTS_PER_LOAD = 12 // Load 12 at a time

export const ProjectsPage: React.FC = () => {
  const { projects: allProjects, isLoading, error } = useProjects()
  const { searchQuery, statusFilter } = useProjectStore()
  
  const [displayCount, setDisplayCount] = useState(PROJECTS_PER_LOAD)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Apply filters
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
      
      if (a.totalRaised > b.totalRaised) return -1
      if (a.totalRaised < b.totalRaised) return 1
      return 0
    })

    return filtered
  }, [allProjects, statusFilter, searchQuery])

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(PROJECTS_PER_LOAD)
  }, [searchQuery, statusFilter])

  // Projects to display (only show displayCount number)
  const displayedProjects = React.useMemo(() => {
    return filteredProjects.slice(0, displayCount)
  }, [filteredProjects, displayCount])

  const hasMore = displayCount < filteredProjects.length

  // Intersection Observer for infinite scroll
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

  // Stats
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
  }, [allProjects.length])

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-64 space-y-4">
        <div className="relative">
          <LoadingSpinner size="lg" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
        </div>
        <p className="text-lg font-medium" style={{ color: 'var(--silver-light)' }}>
          Loading projects...
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
            Failed to Load Projects
          </h3>
          <p className="text-red-400 mb-4">
            Unable to fetch project data. Please check your connection and try again.
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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center space-y-6">
        <div className="relative">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--silver-light)' }}>
            Live & Upcoming Launches
          </h1>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] rounded-full opacity-60"></div>
        </div>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--metallic-silver)' }}>
          Browse primary-market launches with protocol-enforced liquidity,
          deterministic finalization, and verifiable on-chain execution.
        </p>

        {/* Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-8">
          <div className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] p-4 rounded-xl border border-[var(--neon-blue)]/30 transition-all duration-300 hover:border-[var(--neon-blue)]/50">
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp 
                className="h-5 w-5 drop-shadow-[0_0_6px_var(--neon-blue)]" 
                style={{ color: 'var(--neon-blue)' }}
              />
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: 'var(--silver-light)' }}>
                  {stats.totalProjects}
                </p>
                <p className="text-xs" style={{ color: 'var(--metallic-silver)' }}>
                  Total Projects
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] p-4 rounded-xl border border-[var(--neon-orange)]/30 transition-all duration-300 hover:border-[var(--neon-orange)]/50">
            <div className="flex items-center justify-center space-x-2">
              <Search 
                className="h-5 w-5 drop-shadow-[0_0_6px_var(--neon-orange)]" 
                style={{ color: 'var(--neon-orange)' }}
              />
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: 'var(--silver-light)' }}>
                  {stats.completedCount}
                </p>
                <p className="text-xs" style={{ color: 'var(--metallic-silver)' }}>
                  Completed Projects
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] p-4 rounded-xl border border-[var(--metallic-silver)]/30 transition-all duration-300 hover:border-[var(--metallic-silver)]/50">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] drop-shadow-[0_0_4px_var(--neon-blue)]"></div>
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: 'var(--silver-light)' }}>
                  {stats.liveCount}
                </p>
                <p className="text-xs" style={{ color: 'var(--metallic-silver)' }}>
                  Live Projects
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-gradient-to-r from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 p-6 rounded-xl border border-[var(--metallic-silver)]/20">
        <ProjectFilters />
      </div>

      {/* Enhanced Results Count */}
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center space-x-3">
          <div className="w-1 h-1 rounded-full bg-[var(--neon-blue)] drop-shadow-[0_0_3px_var(--neon-blue)] animate-pulse"></div>
          <p className="text-sm font-medium" style={{ color: 'var(--silver-light)' }}>
            Showing {displayedProjects.length} of {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
      </div>

      {/* Enhanced Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gradient-to-r from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 p-8 rounded-xl border border-[var(--metallic-silver)]/20 max-w-md mx-auto">
            <Search 
              className="h-12 w-12 mx-auto mb-4 opacity-50" 
              style={{ color: 'var(--metallic-silver)' }}
            />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
              No Projects Found
            </h3>
            <p style={{ color: 'var(--metallic-silver)' }}>
              No projects match your current search criteria. Try adjusting your filters or check back later for new launches.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              <LoadingSpinner size="md" />
              <p className="ml-3 text-sm" style={{ color: 'var(--metallic-silver)' }}>
                Loading more projects...
              </p>
            </div>
          )}

          {/* End of Results */}
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