// src/hooks/useFaucet.ts
import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import { formatUnits } from 'viem'
import toast from 'react-hot-toast'

interface FaucetSettings {
  exhAmount: bigint
  exUSDAmount: bigint
  cooldownSeconds: bigint
}

interface UseFaucetReturn {
  // Settings
  faucetSettings: FaucetSettings | undefined
  exhAmountFormatted: string
  exusdAmountFormatted: string
  
  // Cooldown state
  lastRequestTime: bigint
  canRequestFaucet: boolean
  cooldownRemaining: number
  cooldownPercentage: number
  
  // Transaction state
  requestFaucetTokens: () => void
  isTransactionPending: boolean
  isTransactionConfirming: boolean
  isTransactionSuccess: boolean
  transactionHash: `0x${string}` | undefined
  
  // Loading/Error
  isLoading: boolean
  error: Error | null
  
  // Refetch
  refetch: () => void
}

export function useFaucet(): UseFaucetReturn {
  const { address } = useAccount()
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const publicClient = usePublicClient()

  // Fetch faucet settings
  const {
    data: faucetSettingsRaw,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings,
  } = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'getFaucetSettings',
    query: {
      staleTime: 60_000, // 1 minute
    },
  })

  // Fetch last request time for the user
  const {
    data: lastRequestTime,
    isLoading: isLoadingLastRequest,
    refetch: refetchLastRequest,
  } = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'lastFaucetRequest',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
      refetchInterval: 5_000, // Refetch every 5 seconds to update cooldown
    },
  })

  // Parse faucet settings
  const faucetSettings: FaucetSettings | undefined = faucetSettingsRaw
    ? {
        exhAmount: (faucetSettingsRaw as readonly [bigint, bigint, bigint])[0],
        exUSDAmount: (faucetSettingsRaw as readonly [bigint, bigint, bigint])[1],
        cooldownSeconds: (faucetSettingsRaw as readonly [bigint, bigint, bigint])[2],
      }
    : undefined

  // Format amounts
  const exhAmountFormatted = faucetSettings
    ? formatUnits(faucetSettings.exhAmount, 18)
    : '0'
  const exusdAmountFormatted = faucetSettings
    ? formatUnits(faucetSettings.exUSDAmount, 6)
    : '0'

  // Write contract for requesting tokens
  const {
    writeContract,
    data: txHash,
    isPending: isTransactionPending,
    error: writeError,
  } = useWriteContract()

  // Wait for transaction receipt
  const {
    isLoading: isTransactionConfirming,
    isSuccess: isTransactionSuccess,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Calculate cooldown using blockchain time
  useEffect(() => {
    if (!faucetSettings || lastRequestTime === undefined || !publicClient) {
      setCooldownRemaining(0)
      return
    }

    const updateCooldown = async () => {
      const lastRequest = lastRequestTime as bigint
      
      // If user has never requested (lastRequestTime = 0), they can request immediately
      if (lastRequest === 0n) {
        setCooldownRemaining(0)
        return
      }

      try {
        // Get blockchain's current timestamp from latest block
        const latestBlock = await publicClient.getBlock({ blockTag: 'latest' })
        const blockchainNow = latestBlock.timestamp
        
        // Calculate time since last request using blockchain time
        const timeSinceLastRequest = blockchainNow - lastRequest
        const remaining = Number(faucetSettings.cooldownSeconds - timeSinceLastRequest)
        
        setCooldownRemaining(Math.max(0, remaining))
      } catch (error) {
        console.error('Failed to get blockchain time for cooldown:', error)
        // Fallback: set to 0 to allow retry
        setCooldownRemaining(0)
      }
    }

    updateCooldown()
    const interval = setInterval(updateCooldown, 5000) // Update every 5 seconds to match block time

    return () => clearInterval(interval)
  }, [lastRequestTime, faucetSettings, publicClient])

  // Determine if user can request
  const canRequestFaucet = cooldownRemaining === 0

  // Calculate cooldown percentage for progress bar
  const cooldownPercentage = faucetSettings
    ? ((Number(faucetSettings.cooldownSeconds) - cooldownRemaining) / 
       Number(faucetSettings.cooldownSeconds)) * 100
    : 0

  // Request faucet tokens
  const requestFaucetTokens = () => {
    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    if (!canRequestFaucet) {
      toast.error('Please wait for cooldown to finish')
      return
    }

    writeContract({
      address: EXHIBITION_ADDRESS,
      abi: exhibitionAbi,
      functionName: 'requestFaucetTokens',
    })
  }

  // Handle transaction success
  useEffect(() => {
    if (isTransactionSuccess) {
      toast.success(`Faucet tokens claimed! You received ${exhAmountFormatted} EXH and ${exusdAmountFormatted} exUSD`)
      refetchLastRequest()
      refetchSettings()
    }
  }, [isTransactionSuccess, exhAmountFormatted, exusdAmountFormatted, refetchLastRequest, refetchSettings])

  // Handle errors
  useEffect(() => {
    if (writeError) {
      toast.error(`Transaction failed: ${writeError.message}`)
    }
  }, [writeError])

  const refetch = () => {
    refetchSettings()
    refetchLastRequest()
  }

  return {
    faucetSettings,
    exhAmountFormatted,
    exusdAmountFormatted,
    lastRequestTime: (lastRequestTime as bigint) ?? 0n,
    canRequestFaucet,
    cooldownRemaining,
    cooldownPercentage,
    requestFaucetTokens,
    isTransactionPending,
    isTransactionConfirming,
    isTransactionSuccess,
    transactionHash: txHash,
    isLoading: isLoadingSettings || isLoadingLastRequest,
    error: settingsError || writeError,
    refetch,
  }
}