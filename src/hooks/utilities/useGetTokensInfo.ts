import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { type Address } from 'viem'
import ExhibitionAMMABI from '../types/abis/ExhibitionAMM.json'
import { CONTRACT_ADDRESSES } from '../config/contracts'

export interface TokenInfo {
  address: Address
  symbol: string
  decimals: number
  totalSupply: bigint
}

export const useGetTokensInfo = (tokens: Address[]) => {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.AMM as Address,
    abi: ExhibitionAMMABI,
    functionName: 'getTokensInfo',
    args: [tokens],
    query: {
      enabled: tokens.length > 0,
    },
  })

  const parsed = useMemo<TokenInfo[] | undefined>(() => {
    if (!data) return undefined

    const [symbols, decimals, totalSupplies] = data as [string[], number[], bigint[]]

    return tokens.map((address, i) => ({
      address,
      symbol: symbols[i],
      decimals: decimals[i],
      totalSupply: totalSupplies[i],
    }))
  }, [data, tokens])

  return { data: parsed, isLoading, error }
}
