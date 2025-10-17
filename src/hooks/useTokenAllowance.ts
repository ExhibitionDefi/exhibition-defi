// src/hooks/useTokenAllowance.ts
import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'

export const useTokenAllowance = (tokenAddress: string, owner: string, spender: string) => {
  return useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner as `0x${string}`, spender as `0x${string}`],
    query: {
      enabled: !!tokenAddress && !!owner && !!spender,
    }
  })
}