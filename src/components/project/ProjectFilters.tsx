import React, { useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { useProjectStore } from '../../stores/projectStore'
import { ProjectStatus, ProjectStatusLabels } from '../../types/project'

export const ProjectFilters: React.FC = () => {
  const {
    searchQuery,
    statusFilter,
    setSearchQuery,
    setStatusFilter,
  } = useProjectStore()

  // Initialize with 'All status' (null) on first render
  useEffect(() => {
    if (statusFilter === undefined) {
      setStatusFilter(null)
    }
  }, [])

  // Status options in preferred order, with All first, Upcoming after Active, added Claimable
  const statusOptions = [
    { value: null, label: 'All status' },
    { value: ProjectStatus.Active, label: ProjectStatusLabels[ProjectStatus.Active] },
    { value: ProjectStatus.Upcoming, label: ProjectStatusLabels[ProjectStatus.Upcoming] },
    { value: ProjectStatus.Successful, label: ProjectStatusLabels[ProjectStatus.Successful] },
    { value: ProjectStatus.Completed, label: ProjectStatusLabels[ProjectStatus.Completed] },
    { value: ProjectStatus.Failed, label: ProjectStatusLabels[ProjectStatus.Failed] },
    { value: ProjectStatus.Refundable, label: ProjectStatusLabels[ProjectStatus.Refundable] },
    { value: ProjectStatus.Claimable, label: ProjectStatusLabels[ProjectStatus.Claimable] },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="sm:max-w-md flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--neon-blue)] opacity-60" />
              <Input
                type="text"
                placeholder="Search launches by name, symbol, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full bg-[var(--charcoal)] border-[var(--silver-dark)] border-opacity-30 text-[var(--silver-light)] placeholder:text-[var(--metallic-silver)] focus:border-[var(--neon-blue)] focus:border-opacity-80 focus:ring-[var(--neon-blue)] focus:ring-opacity-20 hover:border-opacity-50 transition-all duration-300"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--neon-orange)] opacity-60 pointer-events-none" />
              <select
                value={statusFilter ?? ''}
                onChange={(e) => setStatusFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full pl-10 pr-8 py-2 rounded-lg border border-[var(--silver-dark)] border-opacity-30 bg-[var(--charcoal)] text-[var(--silver-light)] text-sm focus:border-[var(--neon-orange)] focus:border-opacity-80 focus:outline-none focus:ring-1 focus:ring-[var(--neon-orange)] focus:ring-opacity-20 hover:border-opacity-50 transition-all duration-300 appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23C0C0C0' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                }}
              >
                {statusOptions.map(({ value, label }) => (
                  <option key={value ?? 'all'} value={value ?? ''} className="bg-[var(--charcoal)] text-[var(--silver-light)]">
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery.length > 0 || statusFilter !== null) && (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter(null);
              }}
              className="sm:w-auto border-[var(--neon-orange)] border-opacity-40 text-[var(--neon-orange)] hover:bg-[var(--neon-orange)] hover:bg-opacity-10 hover:border-opacity-80 transition-all duration-300 group"
            >
              <X className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {(searchQuery.length > 0 || statusFilter !== null) && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge 
                variant="info"
                className="bg-[var(--charcoal)] border-[var(--neon-blue)] border-opacity-40 text-[var(--neon-blue)] hover:border-opacity-60 hover:shadow-[0_0_8px_var(--neon-blue)] hover:shadow-opacity-20 transition-all duration-300"
              >
                <Search className="h-3 w-3 mr-1 opacity-60" />
                Search: <span className="font-medium">{searchQuery}</span>
              </Badge>
            )}
            {statusFilter !== null && (
              <Badge 
                variant="info"
                className="bg-[var(--charcoal)] border-[var(--neon-orange)] border-opacity-40 text-[var(--neon-orange)] hover:border-opacity-60 hover:shadow-[0_0_8px_var(--neon-orange)] hover:shadow-opacity-20 transition-all duration-300"
              >
                <Filter className="h-3 w-3 mr-1 opacity-60" />
                Status: <span className="font-medium">{statusFilter === null ? 'All status' : ProjectStatusLabels[statusFilter as ProjectStatus]}</span>
              </Badge>
            )}
          </div>
        )}

        {/* Filter Results Summary */}
        {(searchQuery.length > 0 || statusFilter !== null) && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--silver-dark)] border-opacity-20">
            <div className="text-xs text-[var(--metallic-silver)]">
              Filters applied • Ranked by contribution
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-[var(--neon-blue)] opacity-60 animate-pulse"></div>
              <span className="text-xs text-[var(--silver-dark)]">Filtering results</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}