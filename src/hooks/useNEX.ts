import { useState, useCallback, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { exNeXAbi } from '@/generated/wagmi'

// Update with your actual exNEX contract address
const EXNEX_CONTRACT_ADDRESS = '0x...' as const

interface UseExNEXReturn {
  // State
  isLoading: boolean
  isSuccess: boolean
  error: Error | null
  txHash?: `0x${string}`
  isPending: boolean
  isConfirming: boolean

  // Data
  balance: string
  totalSupply: string
  decimals: number
  name: string
  symbol: string

  // Functions
  deposit: (amountNEX: string) => Promise<`0x${string}` | null>
  withdraw: (amountExNEX: string) => Promise<`0x${string}` | null>
  approve: (spender: string, amount: string) => Promise<`0x${string}` | null>
  allowance: (owner: string, spender: string) => Promise<string>
  resetState: () => void
}

export const useExNEX = (): UseExNEXReturn => {
  const { address, isConnected } = useAccount()
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}`>()
  const [isPending, setIsPending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // Read balance of exNEX
  const { data: balanceData } = useReadContract({
    address: EXNEX_CONTRACT_ADDRESS,
    abi: exNeXAbi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: isConnected && !!address },
  })

  // Read total supply
  const { data: totalSupplyData } = useReadContract({
    address: EXNEX_CONTRACT_ADDRESS,
    abi: exNeXAbi,
    functionName: 'totalSupply',
  })

  // Read decimals
  const { data: decimalsData } = useReadContract({
    address: EXNEX_CONTRACT_ADDRESS,
    abi: exNeXAbi,
    functionName: 'decimals',
  })

  // Read name
  const { data: nameData } = useReadContract({
    address: EXNEX_CONTRACT_ADDRESS,
    abi: exNeXAbi,
    functionName: 'name',
  })

  // Read symbol
  const { data: symbolData } = useReadContract({
    address: EXNEX_CONTRACT_ADDRESS,
    abi: exNeXAbi,
    functionName: 'symbol',
  })

  // Write functions
  const {
    writeContractAsync: depositAsync,
    isPending: isDepositPending,
    data: depositHash,
  } = useWriteContract()

  const {
    writeContractAsync: withdrawAsync,
    isPending: isWithdrawPending,
    data: withdrawHash,
  } = useWriteContract()

  const {
    writeContractAsync: approveAsync,
    isPending: isApprovePending,
    data: approveHash,
  } = useWriteContract()

  // Wait for transaction receipts
  const { isLoading: isDepositConfirming } = useWaitForTransactionReceipt({
    hash: depositHash,
    query: { enabled: !!depositHash },
  })

  const { isLoading: isWithdrawConfirming } = useWaitForTransactionReceipt({
    hash: withdrawHash,
    query: { enabled: !!withdrawHash },
  })

  const { isLoading: isApproveConfirming } = useWaitForTransactionReceipt({
    hash: approveHash,
    query: { enabled: !!approveHash },
  })

  // Update pending and confirming states based on current operation
  useEffect(() => {
    const currentPending = isDepositPending || isWithdrawPending || isApprovePending
    const currentConfirming = isDepositConfirming || isWithdrawConfirming || isApproveConfirming
    
    setIsPending(currentPending)
    setIsConfirming(currentConfirming)
  }, [isDepositPending, isWithdrawPending, isApprovePending, isDepositConfirming, isWithdrawConfirming, isApproveConfirming])

  // Update current hash
  useEffect(() => {
    if (depositHash) setCurrentTxHash(depositHash)
    else if (withdrawHash) setCurrentTxHash(withdrawHash)
    else if (approveHash) setCurrentTxHash(approveHash)
  }, [depositHash, withdrawHash, approveHash])

  // Reset state helper
  const resetState = useCallback(() => {
    setIsSuccess(false)
    setError(null)
    setCurrentTxHash(undefined)
    setIsPending(false)
    setIsConfirming(false)
  }, [])

  // Deposit NEX to get exNEX
  const deposit = useCallback(
    async (amountNEX: string): Promise<`0x${string}` | null> => {
      if (!address || !isConnected) {
        const err = new Error('Wallet not connected')
        setError(err)
        return null
      }

      try {
        resetState()
        
        const hash = await depositAsync({
          address: EXNEX_CONTRACT_ADDRESS,
          abi: exNeXAbi,
          functionName: 'deposit',
          value: parseEther(amountNEX),
          account: address,
        })

        setCurrentTxHash(hash as `0x${string}`)
        setIsSuccess(true)
        return hash as `0x${string}`
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Deposit failed')
        setError(error)
        return null
      }
    },
    [address, isConnected, depositAsync, resetState]
  )

  // Withdraw exNEX to get NEX back
  const withdraw = useCallback(
    async (amountExNEX: string): Promise<`0x${string}` | null> => {
      if (!address || !isConnected) {
        const err = new Error('Wallet not connected')
        setError(err)
        return null
      }

      try {
        resetState()

        const hash = await withdrawAsync({
          address: EXNEX_CONTRACT_ADDRESS,
          abi: exNeXAbi,
          functionName: 'withdraw',
          args: [parseEther(amountExNEX)],
          account: address,
        })

        setCurrentTxHash(hash as `0x${string}`)
        setIsSuccess(true)
        return hash as `0x${string}`
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Withdrawal failed')
        setError(error)
        return null
      }
    },
    [address, isConnected, withdrawAsync, resetState]
  )

  // Approve spender
  const approve = useCallback(
    async (spender: string, amount: string): Promise<`0x${string}` | null> => {
      if (!address || !isConnected) {
        const err = new Error('Wallet not connected')
        setError(err)
        return null
      }

      try {
        resetState()

        const hash = await approveAsync({
          address: EXNEX_CONTRACT_ADDRESS,
          abi: exNeXAbi,
          functionName: 'approve',
          args: [spender as `0x${string}`, parseEther(amount)],
          account: address,
        })

        setCurrentTxHash(hash as `0x${string}`)
        setIsSuccess(true)
        return hash as `0x${string}`
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Approval failed')
        setError(error)
        return null
      }
    },
    [address, isConnected, approveAsync, resetState]
  )

  // Read allowance
  const allowance = useCallback(
    async (_owner: string, _spender: string): Promise<string> => {
      try {
        // This would need to be implemented with useReadContract in a separate call
        // For now returning placeholder
        return '0'
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Allowance query failed')
        setError(error)
        return '0'
      }
    },
    []
  )

  return {
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    txHash: currentTxHash,
    isPending,
    isConfirming,
    balance: balanceData ? formatEther(balanceData as bigint) : '0',
    totalSupply: totalSupplyData ? formatEther(totalSupplyData as bigint) : '0',
    decimals: decimalsData ?? 18,
    name: nameData ?? 'exNEX',
    symbol: symbolData ?? 'exNEX',
    deposit,
    withdraw,
    approve,
    allowance,
    resetState,
  }
}