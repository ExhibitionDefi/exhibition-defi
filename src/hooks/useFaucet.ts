// src/hooks/useFaucet.ts
import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import { formatUnits } from 'viem'
import toast from 'react-hot-toast'

interface FaucetSettings {
  exhAmount: bigint
  usdtAmount: bigint
  cooldownSeconds: bigint
}

interface UseFaucetReturn {
  // Settings
  faucetSettings: FaucetSettings | undefined
  exhAmountFormatted: string
  usdtAmountFormatted: string
  
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
        usdtAmount: (faucetSettingsRaw as readonly [bigint, bigint, bigint])[1],
        cooldownSeconds: (faucetSettingsRaw as readonly [bigint, bigint, bigint])[2],
      }
    : undefined

  // Format amounts
  const exhAmountFormatted = faucetSettings
    ? formatUnits(faucetSettings.exhAmount, 18)
    : '0'
  const usdtAmountFormatted = faucetSettings
    ? formatUnits(faucetSettings.usdtAmount, 6)
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

  // Calculate cooldown
  useEffect(() => {
    if (!faucetSettings || !lastRequestTime) {
      setCooldownRemaining(0)
      return
    }

    const updateCooldown = () => {
      const now = BigInt(Math.floor(Date.now() / 1000))
      const timeSinceLastRequest = now - (lastRequestTime as bigint)
      const remaining = Number(faucetSettings.cooldownSeconds - timeSinceLastRequest)
      
      setCooldownRemaining(Math.max(0, remaining))
    }

    updateCooldown()
    const interval = setInterval(updateCooldown, 1000)

    return () => clearInterval(interval)
  }, [lastRequestTime, faucetSettings])

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
      toast.success(`Faucet tokens claimed! You received ${exhAmountFormatted} EXH and ${usdtAmountFormatted} USDT`)
      refetchLastRequest()
      refetchSettings()
    }
  }, [isTransactionSuccess, exhAmountFormatted, usdtAmountFormatted, refetchLastRequest, refetchSettings])

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
    usdtAmountFormatted,
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