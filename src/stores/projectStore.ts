import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ProjectDisplayData, UserProjectSummary } from '../types/project'

interface ProjectStore {
  // Project data
  projects: ProjectDisplayData[]
  selectedProject: ProjectDisplayData | null
  userSummaries: Record<string, UserProjectSummary>
  
  // Loading states
  isLoading: boolean
  isLoadingProject: boolean
  
  // Pagination
  currentPage: number
  totalPages: number
  pageSize: number
  
  // Filters
  statusFilter: number | null
  searchQuery: string
  
  // Actions
  setProjects: (projects: ProjectDisplayData[]) => void
  setSelectedProject: (project: ProjectDisplayData | null) => void
  setUserSummary: (projectId: string, summary: UserProjectSummary) => void
  setLoading: (loading: boolean) => void
  setLoadingProject: (loading: boolean) => void
  setCurrentPage: (page: number) => void
  setStatusFilter: (status: number | null) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
}

export const useProjectStore = create<ProjectStore>()(
  devtools(
    (set) => ({
      // Initial state
      projects: [],
      selectedProject: null,
      userSummaries: {},
      isLoading: false,
      isLoadingProject: false,
      currentPage: 1,
      totalPages: 1,
      pageSize: 10,
      statusFilter: null,
      searchQuery: '',

      // Actions
      setProjects: (projects) => set({ projects }),
      setSelectedProject: (project) => set({ selectedProject: project }),
      setUserSummary: (projectId, summary) =>
        set((state) => ({
          userSummaries: { ...state.userSummaries, [projectId]: summary },
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      setLoadingProject: (loading) => set({ isLoadingProject: loading }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setStatusFilter: (status) => set({ statusFilter: status }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      clearFilters: () => set({ statusFilter: null, searchQuery: '', currentPage: 1 }),
    }),
    {
      name: 'project-store',
    }
  )
)