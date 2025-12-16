import { useBalance } from 'wagmi'
import { useAccount } from 'wagmi'

export const useTokenBalance = (tokenAddress: `0x${string}` | undefined) => {
  const { address } = useAccount()

  return useBalance({
    address,
    token: tokenAddress,
    query: {
      enabled: !!address && !!tokenAddress,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchInterval: 20_000, // poll every 20s
      staleTime: 10_000,
    },
  })
}
