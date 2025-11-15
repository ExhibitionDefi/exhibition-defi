// src/hooks/projects/useCreateProject.ts
import { useState, useCallback } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import { ExhibitionFormatters } from '@/utils/exFormatters'
import { useMultiTransactionModal } from '@/components/common/MultiTransactionModal'
import { logger } from '@/utils/logger'

export interface CreateProjectFormData {
  // Project Token Details
  projectTokenName: string
  projectTokenSymbol: string
  initialTotalSupply: string
  projectTokenLogoURI: string

  // Core Project Parameters
  contributionTokenAddress: `0x${string}`
  fundingGoal: string
  softCap: string
  minContribution: string
  maxContribution: string
  tokenPrice: string
  startTime: Date
  endTime: Date
  amountTokensForSale: string
  liquidityPercentage: string
  lockDuration: string

  // Vesting Schedule Parameters
  vestingEnabled: boolean
  vestingCliff: string
  vestingDuration: string
  vestingInterval: string
  vestingInitialRelease: string

  // Token Decimals (contribution token is dynamic, others are fixed at 18)
  contributionTokenDecimals: number
}

/**
 * Safely convert Date to Unix timestamp (in seconds)
 */
const dateToUnixTimestamp = (date: Date): bigint => {
  if (!date || isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }
  
  // Get timestamp in seconds (JavaScript gives milliseconds)
  const timestampInSeconds = Math.floor(date.getTime() / 1000)
  
  return BigInt(timestampInSeconds)
}

/**
 * Hook to create a new launchpad project
 */
export function useCreateProject() {
  const [projectId, setProjectId] = useState<bigint | null>(null)
  const [projectTokenAddress, setProjectTokenAddress] = useState<`0x${string}` | null>(null)
  
  const modalState = useMultiTransactionModal()

  // Write contract hook
  const {
    writeContract,
    data: txHash,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  // Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  /**
   * Parse form data and prepare contract arguments
   * WITH COMPREHENSIVE DEBUG LOGGING
   */
  const prepareContractArgs = useCallback((formData: CreateProjectFormData) => {
    logger.info('🔧 ===== PREPARING CONTRACT ARGUMENTS =====')
    logger.info('📋 Raw Form Data:', formData)

    const {
      projectTokenName,
      projectTokenSymbol,
      initialTotalSupply,
      projectTokenLogoURI,
      contributionTokenAddress,
      fundingGoal,
      softCap,
      minContribution,
      maxContribution,
      tokenPrice,
      startTime,
      endTime,
      amountTokensForSale,
      liquidityPercentage,
      lockDuration,
      vestingEnabled,
      vestingCliff,
      vestingDuration,
      vestingInterval,
      vestingInitialRelease,
      contributionTokenDecimals,
    } = formData

    // Validate form data
    ExhibitionFormatters.validateProjectCreationData(formData)

    // Project token is ALWAYS 18 decimals (created by factory)
    const PROJECT_TOKEN_DECIMALS = 18
    
    logger.info('💰 Parsing Token Amounts...')
    const parsedInitialSupply = ExhibitionFormatters.parseTokenAmount(
      initialTotalSupply,
      PROJECT_TOKEN_DECIMALS
    )
    logger.info(`  Initial Supply: ${initialTotalSupply} -> ${parsedInitialSupply.toString()}`)
    
    const parsedAmountForSale = ExhibitionFormatters.parseTokenAmount(
      amountTokensForSale,
      PROJECT_TOKEN_DECIMALS
    )
    logger.info(`  Amount For Sale: ${amountTokensForSale} -> ${parsedAmountForSale.toString()}`)
    
    // Contribution token amounts use DYNAMIC decimals
    logger.info(`💵 Parsing Contribution Amounts (${contributionTokenDecimals} decimals)...`)
    const parsedFundingGoal = ExhibitionFormatters.parseTokenAmount(
      fundingGoal,
      contributionTokenDecimals
    )
    logger.info(`  Funding Goal: ${fundingGoal} -> ${parsedFundingGoal.toString()}`)
    
    const parsedSoftCap = ExhibitionFormatters.parseTokenAmount(
      softCap,
      contributionTokenDecimals
    )
    logger.info(`  Soft Cap: ${softCap} -> ${parsedSoftCap.toString()}`)
    
    const parsedMinContribution = ExhibitionFormatters.parseTokenAmount(
      minContribution,
      contributionTokenDecimals
    )
    logger.info(`  Min Contribution: ${minContribution} -> ${parsedMinContribution.toString()}`)
    
    const parsedMaxContribution = ExhibitionFormatters.parseTokenAmount(
      maxContribution,
      contributionTokenDecimals
    )
    logger.info(`  Max Contribution: ${maxContribution} -> ${parsedMaxContribution.toString()}`)
    
    // Token price is ALWAYS 18 decimals per contract requirement
    logger.info('💲 Parsing Token Price (ALWAYS 18 decimals)...')
    const parsedTokenPrice = ExhibitionFormatters.parseTokenAmount(
      tokenPrice,
      18
    )
    logger.info(`  Token Price: ${tokenPrice} -> ${parsedTokenPrice.toString()}`)
    
    // Percentage conversion
    logger.info('📊 Parsing Percentage...')
    const parsedLiquidityPercentage = ExhibitionFormatters.parsePercentage(liquidityPercentage)
    logger.info(`  Liquidity %: ${liquidityPercentage}% -> ${parsedLiquidityPercentage.toString()} basis points`)
    
    // Timestamp conversion
    logger.info('⏰ Parsing Timestamps...')
    logger.info(`  Start Time Input: ${startTime.toLocaleString()}`)
    logger.info(`  End Time Input: ${endTime.toLocaleString()}`)
    
    const parsedStartTime = dateToUnixTimestamp(startTime)
    const parsedEndTime = dateToUnixTimestamp(endTime)
    
    logger.info(`  Start Time Unix: ${parsedStartTime.toString()} (${new Date(Number(parsedStartTime) * 1000).toLocaleString()})`)
    logger.info(`  End Time Unix: ${parsedEndTime.toString()} (${new Date(Number(parsedEndTime) * 1000).toLocaleString()})`)
    
    // Duration conversion (DAYS -> SECONDS)
    logger.info('⏳ Parsing Durations (converting DAYS to SECONDS)...')
    const parsedLockDuration = ExhibitionFormatters.parseDurationToSeconds(lockDuration)
    logger.info(`  Lock Duration: ${lockDuration} days -> ${parsedLockDuration.toString()} seconds`)
    
    const parsedVestingCliff = vestingEnabled 
      ? ExhibitionFormatters.parseDurationToSeconds(vestingCliff)
      : 0n
    logger.info(`  Vesting Cliff: ${vestingCliff} days -> ${parsedVestingCliff.toString()} seconds`)
    
    const parsedVestingDuration = vestingEnabled
      ? ExhibitionFormatters.parseDurationToSeconds(vestingDuration)
      : 0n
    logger.info(`  Vesting Duration: ${vestingDuration} days -> ${parsedVestingDuration.toString()} seconds`)
    
    const parsedVestingInterval = vestingEnabled
      ? ExhibitionFormatters.parseDurationToSeconds(vestingInterval)
      : 0n
    logger.info(`  Vesting Interval: ${vestingInterval} days -> ${parsedVestingInterval.toString()} seconds`)
    
    const parsedVestingInitialRelease = vestingEnabled
      ? ExhibitionFormatters.parsePercentage(vestingInitialRelease)
      : 0n
    logger.info(`  Vesting Initial Release: ${vestingInitialRelease}% -> ${parsedVestingInitialRelease.toString()} basis points`)

    const args = [
      projectTokenName,
      projectTokenSymbol,
      parsedInitialSupply,
      projectTokenLogoURI,
      contributionTokenAddress,
      parsedFundingGoal,
      parsedSoftCap,
      parsedMinContribution,
      parsedMaxContribution,
      parsedTokenPrice,
      parsedStartTime,
      parsedEndTime,
      parsedAmountForSale,
      parsedLiquidityPercentage,
      parsedLockDuration,
      vestingEnabled,
      parsedVestingCliff,
      parsedVestingDuration,
      parsedVestingInterval,
      parsedVestingInitialRelease,
    ] as const

    logger.info('✅ Final Contract Arguments:', args)
    logger.info('===== PREPARATION COMPLETE =====\n')

    return args
  }, [])

  /**
   * Create a new launchpad project
   */
  const createProject = useCallback(
    async (formData: CreateProjectFormData) => {
      try {
        logger.info('🚀 CREATING PROJECT...')
        
        // Show modal
        modalState.show('create')

        // Prepare contract arguments with full validation
        const args = prepareContractArgs(formData)

        logger.info('📤 Sending transaction to contract...')
        
        // Execute transaction
        writeContract({
          address: EXHIBITION_ADDRESS,
          abi: exhibitionAbi,
          functionName: 'createLaunchpadProject',
          args,
        })
      } catch (err) {
        logger.error('❌ Failed to create project:', err)
        modalState.hide()
        throw err
      }
    },
    [writeContract, prepareContractArgs, modalState]
  )

  /**
   * Reset all states
   */
  const reset = useCallback(() => {
    resetWrite()
    setProjectId(null)
    setProjectTokenAddress(null)
    modalState.hide()
  }, [resetWrite, modalState])

  // Combined error
  const error = writeError || confirmError

  // Combined loading state
  const isCreating = isPending || isConfirming

  return {
    // Actions
    createProject,
    reset,

    // Transaction states
    isCreating,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash,

    // Project data
    projectId,
    projectTokenAddress,

    // Modal state
    modalState,
  }
}