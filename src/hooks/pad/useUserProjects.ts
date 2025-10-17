import { useMemo, useEffect, useState } from 'react'
import { useAccount, useReadContracts } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import type { ProjectDisplayData, ProjectStatus } from '@/types/project'
import { ProjectStatusLabels } from '@/types/project'

/**
 * useUserProjects
 * Fetches projects owned by the connected user AND all projects they've contributed to
 */
export function useUserProjects() {
  const { address } = useAccount()
  const [ownedProjectIds, setOwnedProjectIds] = useState<bigint[]>([])
  const [allProjectIds, setAllProjectIds] = useState<bigint[]>([])

  // --- Step 1: Fetch user's owned projects AND all project IDs ---
  const {
    data: initialData,
    isLoading: isLoadingIds,
    error: idsError,
    refetch: refetchIds,
  } = useReadContracts({
    contracts: [
      {
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'getProjectsByOwner',
        args: address ? [address] : undefined,
      },
      {
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'getProjects',
        args: [0n, 100n], // Get all projects
      },
    ],
    query: {
      enabled: Boolean(address),
      refetchInterval: 60_000,
      staleTime: 30_000,
    },
  })

  // Extract project IDs
  useEffect(() => {
    if (initialData?.[0]?.result) {
      const owned = initialData[0].result as bigint[]
      setOwnedProjectIds(owned)
    }
    if (initialData?.[1]?.result) {
      const all = initialData[1].result as bigint[]
      setAllProjectIds(all)
    }
  }, [initialData])

  // --- Step 2: Fetch user contributions for ALL projects ---
  const contributionsContracts = useMemo(() => {
    if (!allProjectIds.length || !address) return []

    return allProjectIds.map((id) => ({
      address: EXHIBITION_ADDRESS,
      abi: exhibitionAbi,
      functionName: 'getUserContribution',
      args: [id, address],
    } as const))
  }, [allProjectIds, address])

  const {
    data: contributionsData,
    isLoading: isLoadingContributions,
  } = useReadContracts({
    contracts: contributionsContracts,
    query: {
      enabled: contributionsContracts.length > 0,
      refetchInterval: 60_000,
      staleTime: 30_000,
    },
  })

  // --- Step 3: Get project IDs where user has contributed ---
  const contributedProjectIds = useMemo(() => {
    if (!contributionsData || !allProjectIds.length) return []

    return allProjectIds.filter((_projectId, i) => {
      const contribution = contributionsData[i]?.result as bigint | undefined
      return contribution && contribution > 0n
    })
  }, [contributionsData, allProjectIds])

  // --- Step 4: Fetch details for owned projects ---
  const ownedDetailsContracts = useMemo(() => {
    if (!ownedProjectIds.length) return []

    return ownedProjectIds.map((id) => ({
      address: EXHIBITION_ADDRESS,
      abi: exhibitionAbi,
      functionName: 'getProjectDetails',
      args: [id],
    } as const))
  }, [ownedProjectIds])

  const {
    data: ownedDetailsData,
    isLoading: isLoadingOwnedDetails,
  } = useReadContracts({
    contracts: ownedDetailsContracts,
    query: {
      enabled: ownedDetailsContracts.length > 0,
      refetchInterval: 60_000,
      staleTime: 30_000,
    },
  })

  // --- Step 5: Extract token addresses from owned projects ---
  const ownedTokenAddresses = useMemo(() => {
    if (!ownedDetailsData) return { projectTokens: [], contributionTokens: [] }

    const projectTokens: `0x${string}`[] = []
    const contributionTokens: `0x${string}`[] = []

    ownedDetailsData.forEach((result) => {
      if (result?.result) {
        const details = result.result as any
        if (details[0]) {
          projectTokens.push(details[0].projectToken)
          contributionTokens.push(details[0].contributionTokenAddress)
        }
      }
    })

    return { projectTokens, contributionTokens }
  }, [ownedDetailsData])

  // --- Step 6: Fetch token info for owned projects ---
  const ownedTokenInfoContracts = useMemo(() => {
    const { projectTokens, contributionTokens } = ownedTokenAddresses
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
  }, [ownedTokenAddresses])

  const {
    data: ownedTokenInfoData,
    isLoading: isLoadingOwnedTokens,
  } = useReadContracts({
    contracts: ownedTokenInfoContracts,
    query: {
      enabled: ownedTokenInfoContracts.length > 0,
      refetchInterval: 120_000,
      staleTime: 60_000,
    },
  })

  // --- Step 7: Transform owned projects into ProjectDisplayData ---
  const userProjects: ProjectDisplayData[] = useMemo(() => {
    if (!ownedDetailsData || !ownedTokenInfoData || !ownedProjectIds.length) return []

    const formatted: ProjectDisplayData[] = []
    const numProjects = ownedProjectIds.length

    for (let i = 0; i < numProjects; i++) {
      const detailsResult = ownedDetailsData[i]
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
          bigint,
          bigint,
          boolean,
          bigint,
          bigint
        ]

        const project = details[0]
        const progressPercentage = details[1]
        const timeRemaining = details[2]
        const canContribute = details[3]

        const projectTokenInfo = ownedTokenInfoData[i]?.result as
          | { decimals: number; symbol: string; name: string }
          | undefined
        const contributionTokenInfo = ownedTokenInfoData[numProjects + i]?.result as
          | { decimals: number; symbol: string; name: string }
          | undefined

        formatted.push({
          id: ownedProjectIds[i],
          projectOwner: project.projectOwner,
          projectToken: project.projectToken,
          contributionTokenAddress: project.contributionTokenAddress,
          tokenName: projectTokenInfo?.name ?? '',
          tokenSymbol: projectTokenInfo?.symbol ?? '',
          tokenDecimals: projectTokenInfo?.decimals ?? 18,
          contributionTokenSymbol: contributionTokenInfo?.symbol ?? '',
          fundingGoal: project.fundingGoal,
          softCap: project.softCap,
          totalRaised: project.totalRaised,
          tokenPrice: project.tokenPrice,
          startTime: project.startTime,
          endTime: project.endTime,
          amountTokensForSale: project.amountTokensForSale,
          liquidityPercentage: project.liquidityPercentage,
          lockDuration: project.lockDuration,
          status: Number(project.status),
          minContribution: project.minContribution,
          maxContribution: project.maxContribution,
          vestingEnabled: project.vestingEnabled,
          vestingCliff: project.vestingCliff,
          vestingDuration: project.vestingDuration,
          vestingInterval: project.vestingInterval,
          vestingInitialRelease: project.vestingInitialRelease,
          progressPercentage: Number(progressPercentage),
          timeRemaining: Number(timeRemaining),
          canContribute: Boolean(canContribute),
          formattedStatus: ProjectStatusLabels[Number(project.status) as ProjectStatus] ?? 'Unknown',
          totalProjectTokenSupply: 0n,
          requiredLiquidityTokens: 0n,
          depositedLiquidityTokens: 0n
        })
      } catch (err) {
        console.error('Failed to format user project:', ownedProjectIds[i], err)
      }
    }

    return formatted
  }, [ownedDetailsData, ownedTokenInfoData, ownedProjectIds])

  // --- Step 8: Extract contributions with amounts ---
  const userContributions = useMemo(() => {
    if (!contributionsData || !allProjectIds.length) return []

    return allProjectIds
      .map((projectId, i) => {
        const contribution = contributionsData[i]?.result as bigint | undefined
        if (!contribution || contribution === 0n) return null
        
        return {
          projectId: projectId.toString(),
          amount: contribution.toString(),
        }
      })
      .filter((c): c is { projectId: string; amount: string } => c !== null)
  }, [contributionsData, allProjectIds])

  // --- Step 9: Calculate total raised from user's owned projects ---
  const totalRaised = useMemo(() => {
    return userProjects.reduce((total, project) => {
      const raised = Number(project.totalRaised) / 1e18
      return total + raised
    }, 0)
  }, [userProjects])

  const isLoading = 
    isLoadingIds || 
    isLoadingContributions || 
    isLoadingOwnedDetails || 
    isLoadingOwnedTokens

  return {
    userProjects, // Projects owned by the user
    userContributions, // All contributions made by the user (including amount)
    contributedProjectIds, // IDs of projects user contributed to
    totalRaised, // Total raised from owned projects
    isLoading,
    error: idsError,
    refetch: refetchIds,
  }
}