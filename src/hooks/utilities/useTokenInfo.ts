import { useReadContract } from 'wagmi'
import { erc20Abi } from 'viem'

export const useTokenInfo = (tokenAddress: `0x${string}` | undefined) => {
  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'name',
    query: { enabled: !!tokenAddress }
  })

  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    query: { enabled: !!tokenAddress }
  })

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress }
  })

  return { name, symbol, decimals }
}