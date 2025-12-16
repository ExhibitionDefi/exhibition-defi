// src/hooks/projects/useCreateProject.ts
import { useState, useCallback, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import { ExhibitionFormatters } from '@/utils/exFormatters'
import { useMultiTransactionModal } from '@/components/common/MultiTransactionModal'
import { logger } from '@/utils/logger'
import { parseEventLogs } from 'viem'

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
 * Hook to create a new launchpad project
 */
export function useCreateProject() {
  const [projectId, setProjectId] = useState<bigint | null>(null)
  const [projectTokenAddress, setProjectTokenAddress] = useState<`0x${string}` | null>(null)
  
  const modalState = useMultiTransactionModal()
  const publicClient = usePublicClient()

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
    data: receipt,  // ✅ ADD THIS
    isLoading: isConfirming,
    isSuccess,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // ✅ ADD THIS ENTIRE useEffect BLOCK
  useEffect(() => {
    if (isSuccess && receipt && publicClient) {
      const parseProjectCreated = async () => {
        try {
          logger.info('🔍 Parsing transaction receipt for ProjectCreated event...')
          
          // Parse logs using the contract ABI
          const logs = parseEventLogs({
            abi: exhibitionAbi,
            eventName: 'ProjectCreated',
            logs: receipt.logs,
          })

          if (logs.length > 0) {
            const projectCreatedEvent = logs[0]
            const { projectId: eventProjectId, projectToken } = projectCreatedEvent.args

            setProjectId(eventProjectId)
            setProjectTokenAddress(projectToken)
            
            logger.info('✅ Project created successfully!')
            logger.info(`   Project ID: ${eventProjectId.toString()}`)
            logger.info(`   Token Address: ${projectToken}`)
          } else {
            logger.warn('⚠️ No ProjectCreated event found in transaction logs')
          }
        } catch (err) {
          logger.error('❌ Failed to parse project creation logs:', err)
        }
      }

      parseProjectCreated()
    }
  }, [isSuccess, receipt, publicClient])

  /**
   * Convert user's selected Date to blockchain timestamp
   * Uses blockchain's current time instead of system time to handle
   * chains with logical timestamps (like Nexus L1 or Hardhat)
   */
  const dateToBlockchainTimestamp = useCallback(async (date: Date): Promise<bigint> => {
    if (!date || isNaN(date.getTime())) {
      throw new Error('Invalid date')
    }

    if (!publicClient) {
      throw new Error('Public client not available')
    }

    try {
      // Get blockchain's current timestamp from latest block
      const latestBlock = await publicClient.getBlock({ blockTag: 'latest' })
      const blockchainNow = latestBlock.timestamp
      
      logger.info(`⏰ Blockchain current time: ${blockchainNow} (${new Date(Number(blockchainNow) * 1000).toLocaleString()})`)
      
      // Calculate offset between user's selected time and current system time
      const systemNow = Math.floor(Date.now() / 1000)
      const userSelectedTime = Math.floor(date.getTime() / 1000)
      const offsetSeconds = userSelectedTime - systemNow
      
      logger.info(`📅 User selected: ${date.toLocaleString()}`)
      logger.info(`⏱️  System now: ${systemNow}, User selected: ${userSelectedTime}`)
      logger.info(`⏳ Offset: ${offsetSeconds} seconds (${offsetSeconds / 3600} hours)`)
      
      // Apply the same offset to blockchain time
      const blockchainTargetTime = blockchainNow + BigInt(offsetSeconds)
      
      logger.info(`🎯 Target blockchain time: ${blockchainTargetTime} (${new Date(Number(blockchainTargetTime) * 1000).toLocaleString()})`)
      
      return blockchainTargetTime
    } catch (error) {
      logger.error('❌ Failed to get blockchain timestamp:', error)
      throw new Error('Failed to get blockchain timestamp')
    }
  }, [publicClient])

  /**
   * Parse form data and prepare contract arguments
   * WITH COMPREHENSIVE DEBUG LOGGING
   */
  const prepareContractArgs = useCallback(async (formData: CreateProjectFormData) => {
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
    
    // Timestamp conversion using blockchain time
    logger.info('⏰ Parsing Timestamps (using blockchain time)...')
    logger.info(`  Start Time Input: ${startTime.toLocaleString()}`)
    logger.info(`  End Time Input: ${endTime.toLocaleString()}`)
    
    const parsedStartTime = await dateToBlockchainTimestamp(startTime)
    const parsedEndTime = await dateToBlockchainTimestamp(endTime)
    
    logger.info(`  Start Time Blockchain: ${parsedStartTime.toString()}`)
    logger.info(`  End Time Blockchain: ${parsedEndTime.toString()}`)
    logger.info(`  Duration: ${Number(parsedEndTime - parsedStartTime) / 86400} days`)
    
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

    return args
  }, [dateToBlockchainTimestamp])

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
        const args = await prepareContractArgs(formData)

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