import React from 'react'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ProjectCard } from '../components/project/ProjectCard'
import { ProjectFilters } from '../components/project/ProjectFilters'
import { useProjects } from '../hooks/useProjects'
import { useProjectStore } from '../stores/projectStore'
import { Button } from '../components/ui/Button'
import { Search, TrendingUp, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { ProjectStatus } from '@/types/project'

export const ProjectsPage: React.FC = () => {
  const { projects: allProjects, isLoading, error } = useProjects()
  const { currentPage, pageSize, setCurrentPage, searchQuery, statusFilter } = useProjectStore()

  // Apply filters and default sort by contribution (totalRaised desc)
  const filteredProjects = React.useMemo(() => {
    let filtered = allProjects

    // Status filter
    if (statusFilter !== null) {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Search query on tokenName, tokenSymbol, projectOwner (address)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        (p.tokenName?.toLowerCase().includes(query) ?? false) ||
        (p.tokenSymbol?.toLowerCase().includes(query) ?? false) ||
        (p.projectOwner?.toLowerCase().includes(query) ?? false)
      )
    }

    // Sort by contribution desc (totalRaised bigint - compare numerically)
    filtered.sort((a, b) => {
      if (a.totalRaised > b.totalRaised) return -1
      if (a.totalRaised < b.totalRaised) return 1
      return 0
    })

    return filtered
  }, [allProjects, statusFilter, searchQuery])

  // Stats based on all projects (unfiltered)
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

  // Pagination on filtered
  const totalPages = Math.ceil(filteredProjects.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

  // Reset page if needed
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [currentPage, totalPages, setCurrentPage])

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
            Explore Projects
          </h1>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] rounded-full opacity-60"></div>
        </div>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--metallic-silver)' }}>
          Discover and contribute to innovative token projects shaping the future of decentralized finance
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
            Showing {paginatedProjects.length} of {filteredProjects.length} projects
          </p>
        </div>
        {totalPages > 1 && (
          <p className="text-xs" style={{ color: 'var(--metallic-silver)' }}>
            Page {currentPage} of {totalPages}
          </p>
        )}
      </div>

      {/* Enhanced Projects Grid */}
      {paginatedProjects.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedProjects.map((project, index) => (
            <div 
              key={project.id.toString()}
              className="transform transition-all duration-300 hover:scale-[1.02]"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="transition-all duration-300 hover:border-[var(--neon-blue)]/50 hover:bg-[var(--neon-blue)]/10 disabled:opacity-30"
            style={{ 
              borderColor: 'var(--metallic-silver)', 
              color: 'var(--silver-light)' 
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page: number
              if (totalPages <= 7) {
                page = i + 1
              } else if (currentPage <= 4) {
                page = i + 1
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i
              } else {
                page = currentPage - 3 + i
              }

              const isActive = page === currentPage
              return (
                <Button
                  key={page}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[var(--neon-blue)]/80 to-[var(--neon-blue)] border-[var(--neon-blue)] shadow-lg shadow-[var(--neon-blue)]/30'
                      : 'hover:border-[var(--neon-blue)]/50 hover:bg-[var(--neon-blue)]/10'
                  }`}
                  style={{ 
                    borderColor: isActive ? 'var(--neon-blue)' : 'var(--metallic-silver)', 
                    color: 'var(--silver-light)' 
                  }}
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="transition-all duration-300 hover:border-[var(--neon-blue)]/50 hover:bg-[var(--neon-blue)]/10 disabled:opacity-30"
            style={{ 
              borderColor: 'var(--metallic-silver)', 
              color: 'var(--silver-light)' 
            }}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}