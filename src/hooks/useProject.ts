// src/hooks/useProject.ts
import { useMemo, useState, useEffect } from 'react'
import { useAccount, useReadContracts } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import type {
  ProjectDisplayData,
  UserProjectSummary,
  ProjectStatus,
} from '@/types/project'
import { ProjectStatusLabels } from '@/types/project'

/**
 * useProject
 * Fetches and transforms a single project and user-specific data
 */
export function useProject(projectId?: string) {
  const { address } = useAccount()
  const parsedProjectId = projectId ? BigInt(projectId) : 0n
  const [tokenAddresses, setTokenAddresses] = useState<{
    projectToken: `0x${string}` | null
    contributionToken: `0x${string}` | null
  }>({ projectToken: null, contributionToken: null })

  // --- Step 1: Fetch project details + user summary ---
  const {
    data: baseData,
    isLoading: isLoadingBase,
    error: baseError,
    refetch: refetchBase,
  } = useReadContracts({
    contracts: [
      {
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'getProjectDetails',
        args: [parsedProjectId],
      },
      {
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'getUserProjectSummary',
        args: address ? [parsedProjectId, address] : undefined,
      },
    ],
    query: {
      enabled: Boolean(projectId),
      refetchInterval: 30_000,
      staleTime: 15_000,
    },
  })

  const projectRaw = baseData?.[0]?.result
  const userSummaryRaw = baseData?.[1]?.result

  // Extract token addresses from project details
  useEffect(() => {
    if (projectRaw) {
      const details = projectRaw as readonly [any, bigint, bigint, boolean, bigint, bigint]
      const projectData = details[0]
      setTokenAddresses({
        projectToken: projectData.projectToken,
        contributionToken: projectData.contributionTokenAddress,
      })
    }
  }, [projectRaw])

  // --- Step 2: Fetch token info ---
  const {
    data: tokenData,
    isLoading: isLoadingTokens,
  } = useReadContracts({
    contracts: [
      {
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'getTokenInfo',
        args: tokenAddresses.projectToken ? [tokenAddresses.projectToken] : undefined,
      },
      {
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'getTokenInfo',
        args: tokenAddresses.contributionToken ? [tokenAddresses.contributionToken] : undefined,
      },
    ],
    query: {
      enabled: Boolean(tokenAddresses.projectToken && tokenAddresses.contributionToken),
      refetchInterval: 120_000,
      staleTime: 60_000,
    },
  })

  const projectTokenInfoRaw = tokenData?.[0]?.result
  const contributionTokenInfoRaw = tokenData?.[1]?.result

  // --- Transform project data ---
  const project: ProjectDisplayData | undefined = useMemo(() => {
    if (!projectRaw) return undefined

    try {
      const details = projectRaw as readonly [
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

      const projectData = details[0]
      const progressPercentage = details[1]
      const timeRemaining = details[2]
      const canContribute = details[3]
      const requiredLiquidityTokens = details[4] 
      const depositedLiquidityTokens = details[5] 

      // Get token info
      const projectTokenInfo = projectTokenInfoRaw as
        | { decimals: number; symbol: string; name: string }
        | undefined
      const contributionTokenInfo = contributionTokenInfoRaw as
        | { decimals: number; symbol: string; name: string }
        | undefined

      const projectDisplayData: ProjectDisplayData = {
        id: parsedProjectId,
        projectOwner: projectData.projectOwner,
        projectToken: projectData.projectToken,
        contributionTokenAddress: projectData.contributionTokenAddress,

        // Token metadata
        tokenName: projectTokenInfo?.name ?? '',
        tokenSymbol: projectTokenInfo?.symbol ?? '',
        tokenDecimals: projectTokenInfo?.decimals ?? 18,
        contributionTokenSymbol: contributionTokenInfo?.symbol ?? '',
        contributionTokenDecimals: contributionTokenInfo?.decimals ?? 18,
        // 🆕 Logo field
        projectTokenLogoURI: projectData.projectTokenLogoURI ?? '',

        fundingGoal: projectData.fundingGoal,
        softCap: projectData.softCap,
        totalRaised: projectData.totalRaised,
        tokenPrice: projectData.tokenPrice,
        totalProjectTokenSupply: projectData.totalProjectTokenSupply,
        startTime: projectData.startTime,
        endTime: projectData.endTime,
        amountTokensForSale: projectData.amountTokensForSale,
        liquidityPercentage: projectData.liquidityPercentage,
        lockDuration: projectData.lockDuration,
        status: Number(projectData.status),
        minContribution: projectData.minContribution,
        maxContribution: projectData.maxContribution,

        // Vesting info
        vestingEnabled: projectData.vestingEnabled,
        vestingCliff: projectData.vestingCliff,
        vestingDuration: projectData.vestingDuration,
        vestingInterval: projectData.vestingInterval,
        vestingInitialRelease: projectData.vestingInitialRelease,

        // ✅ ADD LIQUIDITY FIELDS
        requiredLiquidityTokens,
        depositedLiquidityTokens,

        progressPercentage: Number(progressPercentage),
        timeRemaining: Number(timeRemaining),
        canContribute: Boolean(canContribute),
        formattedStatus:
          ProjectStatusLabels[Number(projectData.status) as ProjectStatus] ?? 'Unknown',
      }

      return projectDisplayData
    } catch (err) {
      console.error('Failed to format project:', err)
      return undefined
    }
  }, [projectRaw, projectTokenInfoRaw, contributionTokenInfoRaw, parsedProjectId])

  // --- Transform user summary ---
  const userSummary: UserProjectSummary | undefined = useMemo(() => {
    if (!userSummaryRaw) return undefined

    const summary = userSummaryRaw as readonly [
      bigint, // contributionAmount
      bigint, // tokensOwed
      bigint, // tokensVested
      bigint, // tokensClaimed
      bigint, // tokensAvailable
      boolean, // userHasRefunded
      boolean // canClaim
    ]

    return {
      contributionAmount: summary[0],
      tokensOwed: summary[1],
      tokensVested: summary[2],
      tokensClaimed: summary[3],
      tokensAvailable: summary[4],
      userHasRefunded: summary[5],
      canClaim: summary[6],
    }
  }, [userSummaryRaw])

  const isLoading = isLoadingBase || isLoadingTokens

  return {
    project,
    userSummary,
    isLoading,
    isLoadingProject: isLoading,
    isLoadingUserSummary: isLoading,
    error: baseError,
    refetch: refetchBase,
    refetchProject: refetchBase,
    refetchUserSummary: refetchBase,
  }
}