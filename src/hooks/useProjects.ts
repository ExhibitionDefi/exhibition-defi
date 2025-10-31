// src/hooks/useProjects.ts
import { useMemo, useEffect, useRef, useState } from 'react'
import { useReadContracts } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import { useProjectStore } from '@/stores/projectStore'
import type { ProjectDisplayData, ProjectStatus } from '@/types/project'
import { ProjectStatusLabels } from '@/types/project'

/**
 * useProjects
 * Fetches and formats all projects from the Exhibition contract
 */
export function useProjects() {
  const { setProjects, statusFilter, searchQuery } = useProjectStore()
  const [projectIds, setProjectIds] = useState<bigint[]>([])

  // --- Step 1: Fetch project IDs ---
  const {
    data: idsData,
    isLoading: isLoadingIds,
    error: idsError,
    refetch: refetchIds,
  } = useReadContracts({
    contracts: [
      {
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'getProjectCount',
      },
      {
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'getProjects',
        args: [0n, 100n], // offset: 0, limit: 100
      },
    ],
    query: {
      refetchInterval: 60_000,
      staleTime: 30_000,
    },
  })

  // Extract project IDs
  useEffect(() => {
    if (idsData?.[1]?.result) {
      const ids = idsData[1].result as bigint[]
      setProjectIds(ids)
    }
  }, [idsData])

  // --- Step 2: Fetch details for all projects ---
  const detailsContracts = useMemo(() => {
    if (!projectIds.length) return []
    
    return projectIds.map((id) => ({
      address: EXHIBITION_ADDRESS,
      abi: exhibitionAbi,
      functionName: 'getProjectDetails',
      args: [id],
    } as const))
  }, [projectIds])

  const {
    data: detailsData,
    isLoading: isLoadingDetails,
    error: detailsError,
  } = useReadContracts({
    contracts: detailsContracts,
    query: {
      enabled: projectIds.length > 0,
      refetchInterval: 60_000,
      staleTime: 30_000,
    },
  })

  // --- Step 3: Extract token addresses for fetching metadata ---
  const tokenAddresses = useMemo(() => {
    if (!detailsData) return { projectTokens: [], contributionTokens: [] }

    const projectTokens: `0x${string}`[] = []
    const contributionTokens: `0x${string}`[] = []

    detailsData.forEach((result) => {
      if (result?.result) {
        const details = result.result as any
        if (details[0]) {
          projectTokens.push(details[0].projectToken)
          contributionTokens.push(details[0].contributionTokenAddress)
        }
      }
    })

    return { projectTokens, contributionTokens }
  }, [detailsData])

  // --- Step 4: Fetch token info for all tokens ---
  const tokenInfoContracts = useMemo(() => {
    const { projectTokens, contributionTokens } = tokenAddresses
    if (!projectTokens.length) return []

    return [
      ...projectTokens.map((address) => ({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'getTokenInfo',
        args: [address],
      } as const)),
      ...contributionTokens.map((address) => ({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'getTokenInfo',
        args: [address],
      } as const)),
    ]
  }, [tokenAddresses])

  const {
    data: tokenInfoData,
    isLoading: isLoadingTokens,
  } = useReadContracts({
    contracts: tokenInfoContracts,
    query: {
      enabled: tokenInfoContracts.length > 0,
      refetchInterval: 120_000, // Tokens don't change often
      staleTime: 60_000,
    },
  })

  // --- Step 5: Transform raw data into UI display format ---
  const projects: ProjectDisplayData[] = useMemo(() => {
    if (!detailsData || !tokenInfoData || !projectIds.length) return []

    const formatted: ProjectDisplayData[] = []
    const numProjects = projectIds.length

    for (let i = 0; i < numProjects; i++) {
      const detailsResult = detailsData[i]
      if (!detailsResult?.result) continue

      try {
        const details = detailsResult.result as readonly [
          {
            projectOwner: `0x${string}`
            projectToken: `0x${string}`
            contributionTokenAddress: `0x${string}`
            fundingGoal: bigint
            softCap: bigint
            minContribution: bigint
            maxContribution: bigint
            tokenPrice: bigint
            startTime: bigint
            endTime: bigint
            totalRaised: bigint
            totalProjectTokenSupply: bigint
            projectTokenLogoURI: string
            amountTokensForSale: bigint
            liquidityPercentage: bigint
            lockDuration: bigint
            status: number
            liquidityAdded: boolean
            vestingEnabled: boolean
            vestingCliff: bigint
            vestingDuration: bigint
            vestingInterval: bigint
            vestingInitialRelease: bigint
          },
          bigint, // progressPercentage
          bigint, // timeRemaining
          boolean, // canContribute
          bigint, // requiredLiquidityTokens
          bigint // depositedLiquidityTokens
        ]

        const project = details[0]
        const progressPercentage = details[1]
        const timeRemaining = details[2]
        const canContribute = details[3]
        const requiredLiquidityTokens = details[4]
        const depositedLiquidityTokens = details[5] 

        // Get token info (first half is project tokens, second half is contribution tokens)
        const projectTokenInfo = tokenInfoData[i]?.result as
          | { decimals: number; symbol: string; name: string }
          | undefined
        const contributionTokenInfo = tokenInfoData[numProjects + i]?.result as
          | { decimals: number; symbol: string; name: string }
          | undefined

        formatted.push({
          id: projectIds[i],
          projectOwner: project.projectOwner,
          projectToken: project.projectToken,
          contributionTokenAddress: project.contributionTokenAddress,

          // Token metadata
          tokenName: projectTokenInfo?.name ?? '',
          tokenSymbol: projectTokenInfo?.symbol ?? '',
          tokenDecimals: projectTokenInfo?.decimals ?? 18,
          contributionTokenSymbol: contributionTokenInfo?.symbol ?? '',
          contributionTokenDecimals: contributionTokenInfo?.decimals ?? 18,
          projectTokenLogoURI: project.projectTokenLogoURI ?? '',

          fundingGoal: project.fundingGoal,
          softCap: project.softCap,
          totalRaised: project.totalRaised,
          tokenPrice: project.tokenPrice,
          startTime: project.startTime,
          endTime: project.endTime,
          amountTokensForSale: project.amountTokensForSale,
          totalProjectTokenSupply: project.totalProjectTokenSupply,
          liquidityPercentage: project.liquidityPercentage,
          lockDuration: project.lockDuration,
          status: Number(project.status),
          minContribution: project.minContribution,
          maxContribution: project.maxContribution,

          // Vesting info
          vestingEnabled: project.vestingEnabled,
          vestingCliff: project.vestingCliff,
          vestingDuration: project.vestingDuration,
          vestingInterval: project.vestingInterval,
          vestingInitialRelease: project.vestingInitialRelease,

          progressPercentage: Number(progressPercentage),
          timeRemaining: Number(timeRemaining),
          canContribute: Boolean(canContribute),
          formattedStatus: ProjectStatusLabels[Number(project.status) as ProjectStatus] ?? 'Unknown',

          // 🆕 Liquidity data
          requiredLiquidityTokens,
          depositedLiquidityTokens,
        } satisfies ProjectDisplayData)
      } catch (err) {
        console.error('Failed to format project:', projectIds[i], err)
      }
    }

    return formatted
  }, [detailsData, tokenInfoData, projectIds])

  // --- Store sync: only update when data changes ---
  const prevProjectsRef = useRef<ProjectDisplayData[]>([])

  useEffect(() => {
    if (!projects.length) return

    const hasChanged =
      projects.length !== prevProjectsRef.current.length ||
      projects.some((p, i) => {
        const prev = prevProjectsRef.current[i]
        return (
          !prev ||
          p.id !== prev.id ||
          p.totalRaised !== prev.totalRaised ||
          p.status !== prev.status
        )
      })

    if (hasChanged) {
      prevProjectsRef.current = projects
      setProjects(projects)
    }
  }, [projects, setProjects])

  // --- Filtering logic ---
  const filteredProjects = useMemo(() => {
    let filtered = projects

    if (statusFilter !== null) {
      filtered = filtered.filter((p) => p.status === statusFilter)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.tokenName?.toLowerCase().includes(q) ||
          p.tokenSymbol?.toLowerCase().includes(q) ||
          p.projectOwner.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [projects, statusFilter, searchQuery])

  return {
    projects: filteredProjects,
    allProjects: projects,
    isLoading: isLoadingIds || isLoadingDetails || isLoadingTokens,
    error: idsError || detailsError,
    refetch: refetchIds,
  }
}