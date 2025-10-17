import { useReadContract } from 'wagmi'
import { exhibitionAbi } from '@/generated/wagmi'
import { EXHIBITION_ADDRESS } from '@/config/contracts'
import { formatUnits, type Address } from 'viem'

interface FaucetSettings {
  exhAmount: string
  usdtAmount: string
  cooldown: number
}

interface AdminSettings {
  owner: Address | undefined
  feePercentage: number
  feeRecipient: Address | undefined
  contributionTokens: readonly Address[]
  faucetSettings: FaucetSettings | null
  isLoading: boolean
  isError: boolean
  refetch: {
    owner: () => void
    feeSettings: () => void
    contributionTokens: () => void
    faucetSettings: () => void
    all: () => void
  }
}

export function useAdminSettings(): AdminSettings {
  const ownerQuery = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'owner',
  })

  const feePercentageQuery = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'platformFeePercentage',
  })

  const feeRecipientQuery = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'platformFeeRecipient',
  })

  const contributionTokensQuery = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'getExhibitionContributionTokens',
  })

  const faucetSettingsQuery = useReadContract({
    address: EXHIBITION_ADDRESS,
    abi: exhibitionAbi,
    functionName: 'getFaucetSettings',
  })

  const isLoading = 
    ownerQuery.isLoading ||
    feePercentageQuery.isLoading ||
    feeRecipientQuery.isLoading ||
    contributionTokensQuery.isLoading ||
    faucetSettingsQuery.isLoading

  const isError =
    ownerQuery.isError ||
    feePercentageQuery.isError ||
    feeRecipientQuery.isError ||
    contributionTokensQuery.isError ||
    faucetSettingsQuery.isError

  return {
    owner: ownerQuery.data as Address | undefined,
    feePercentage: feePercentageQuery.data ? Number(feePercentageQuery.data) : 0,
    feeRecipient: feeRecipientQuery.data as Address | undefined,
    contributionTokens: (contributionTokensQuery.data as readonly Address[]) || [],
    faucetSettings: faucetSettingsQuery.data ? {
      exhAmount: formatUnits((faucetSettingsQuery.data as any)[0], 18),
      usdtAmount: formatUnits((faucetSettingsQuery.data as any)[1], 6),
      cooldown: Number((faucetSettingsQuery.data as any)[2]),
    } : null,
    isLoading,
    isError,
    refetch: {
      owner: () => ownerQuery.refetch(),
      feeSettings: () => {
        feePercentageQuery.refetch()
        feeRecipientQuery.refetch()
      },
      contributionTokens: () => contributionTokensQuery.refetch(),
      faucetSettings: () => faucetSettingsQuery.refetch(),
      all: () => {
        ownerQuery.refetch()
        feePercentageQuery.refetch()
        feeRecipientQuery.refetch()
        contributionTokensQuery.refetch()
        faucetSettingsQuery.refetch()
      },
    },
  }
}