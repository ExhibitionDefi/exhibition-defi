import { useState, useCallback, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { exNeXAbi } from '@/generated/wagmi'

const EXNEX_CONTRACT_ADDRESS: Readonly<string> = import.meta.env.VITE_EXNEX_ADDRESS;

interface UseExNEXReturn {
  // State
  isLoading: boolean
  isSuccess: boolean
  error: Error | null
  txHash?: `0x${string}`
  isPending: boolean
  isConfirming: boolean

  // Data
  balance: string // exNEX balance
  nexBalance: string // ✅ NEW: Native NEX balance
  totalSupply: string
  decimals: number
  name: string
  symbol: string

  // Functions
  deposit: (amountNEX: string) => Promise<`0x${string}` | null>
  withdraw: (amountExNEX: string) => Promise<`0x${string}` | null>
  approve: (spender: string, amount: string) => Promise<`0x${string}` | null>
  resetState: () => void
  
  // Refetch functions
  refetchBalance: () => void
  refetchNexBalance: () => void
}

export const useExNEX = (): UseExNEXReturn => {
  const { address, isConnected } = useAccount()
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [currentTxHash, setCurrentTxHash] = useState<`0x${string}`>()
  const [isPending, setIsPending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // ✅ Read native NEX balance (native token balance)
  const { 
    data: nexBalanceData, 
    refetch: refetchNexBalance 
  } = useBalance({
    address: address,
    query: { enabled: isConnected && !!address },
  })

  // Read exNEX balance
  const { 
    data: balanceData,
    refetch: refetchBalance,
  } = useReadContract({
    address: EXNEX_CONTRACT_ADDRESS  as `0x${string}`,
    abi: exNeXAbi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: isConnected && !!address },
  })

  const { 
    data: totalSupplyData,
    refetch: refetchTotalSupply
  } = useReadContract({
    address: EXNEX_CONTRACT_ADDRESS as `0x${string}`,
    abi: exNeXAbi,
    functionName: 'totalSupply',
  })

  // Read decimals
  const { data: decimalsData } = useReadContract({
    address: EXNEX_CONTRACT_ADDRESS as `0x${string}`,
    abi: exNeXAbi,
    functionName: 'decimals',
  })

  // Read name
  const { data: nameData } = useReadContract({
    address: EXNEX_CONTRACT_ADDRESS as `0x${string}`,
    abi: exNeXAbi,
    functionName: 'name',
  })

  // Read symbol
  const { data: symbolData } = useReadContract({
    address: EXNEX_CONTRACT_ADDRESS as `0x${string}`,
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
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
    query: { enabled: !!depositHash },
  })

  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
    hash: withdrawHash,
    query: { enabled: !!withdrawHash },
  })

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
    query: { enabled: !!approveHash },
  })

  // Update pending and confirming states
  useEffect(() => {
    const currentPending = isDepositPending || isWithdrawPending || isApprovePending
    const currentConfirming = isDepositConfirming || isWithdrawConfirming || isApproveConfirming
    
    setIsPending(currentPending)
    setIsConfirming(currentConfirming)
  }, [isDepositPending, isWithdrawPending, isApprovePending, isDepositConfirming, isWithdrawConfirming, isApproveConfirming])

  // Update success state
  useEffect(() => {
    if (isDepositSuccess || isWithdrawSuccess || isApproveSuccess) {
      setIsSuccess(true)
      
      // Refetch balances after successful transaction
      refetchBalance()
      refetchNexBalance()
      refetchTotalSupply()
    }
  }, [isDepositSuccess, isWithdrawSuccess, isApproveSuccess, refetchBalance, refetchNexBalance, refetchTotalSupply])

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

  // Deposit NEX to get exNEX (payable function)
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
          address: EXNEX_CONTRACT_ADDRESS as `0x${string}`,
          abi: exNeXAbi,
          functionName: 'deposit',
          value: parseEther(amountNEX), // ✅ Sending native token as value
          account: address,
        })

        setCurrentTxHash(hash as `0x${string}`)
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
          address: EXNEX_CONTRACT_ADDRESS as `0x${string}`,
          abi: exNeXAbi,
          functionName: 'withdraw',
          args: [parseEther(amountExNEX)],
          account: address,
        })

        setCurrentTxHash(hash as `0x${string}`)
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
          address: EXNEX_CONTRACT_ADDRESS as `0x${string}`,
          abi: exNeXAbi,
          functionName: 'approve',
          args: [spender as `0x${string}`, parseEther(amount)],
          account: address,
        })

        setCurrentTxHash(hash as `0x${string}`)
        return hash as `0x${string}`
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Approval failed')
        setError(error)
        return null
      }
    },
    [address, isConnected, approveAsync, resetState]
  )

  return {
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    txHash: currentTxHash,
    isPending,
    isConfirming,
    
    // Balances
    balance: balanceData ? formatEther(balanceData as bigint) : '0',
    nexBalance: nexBalanceData ? formatEther(nexBalanceData.value) : '0', // ✅ NEX balance
    totalSupply: totalSupplyData ? formatEther(totalSupplyData as bigint) : '0',
    
    // Token info
    decimals: decimalsData ?? 18,
    name: nameData ?? 'exNEX',
    symbol: symbolData ?? 'exNEX',
    
    // Functions
    deposit,
    withdraw,
    approve,
    resetState,
    refetchBalance,
    refetchNexBalance,
  }
}