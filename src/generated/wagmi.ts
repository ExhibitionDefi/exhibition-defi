import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20Abi = [
  {
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Exhibition
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const exhibitionAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AmmApprovedForToken',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'contributor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'contributionTokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'totalRaised',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ContributionMade',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ExhTokenAddressSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ExhibitionAMMAddressSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ExhibitionContributionTokenAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ExhibitionContributionTokenRemoved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ExhibitionFactoryAddressSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ExhibitionUSDTAddressSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'FaucetMinted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'exhAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'usdtAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'FaucetRequested',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'FeesWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'projectOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amountReleased',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'finalStatus',
        internalType: 'enum ProjectStatus',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'FundsReleasedToProjectOwner',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'totalRaised',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'hardCap',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'HardCapReached',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'projectOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'projectTokensAdded',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'contributionTokensAdded',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'liquidityMinted',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LiquidityAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'depositor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LiquidityTokensDeposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'tokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'PlatformFeeCollected',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldPercentage',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newPercentage',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'PlatformFeePercentageUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldRecipient',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'newRecipient',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'PlatformFeeRecipientUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'projectOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'projectToken',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'contributionTokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'fundingGoal',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'softCap',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalProjectTokenSupply',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'projectTokenLogoURI',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'amountTokensForSale',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'liquidityPercentage',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'lockDuration',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'startTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'endTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ProjectCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'newStatus',
        internalType: 'enum ProjectStatus',
        type: 'uint8',
        indexed: false,
      },
      {
        name: 'totalRaised',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ProjectFinalized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'newStatus',
        internalType: 'enum ProjectStatus',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'ProjectStatusUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'participant',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'refundedAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RefundIssued',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'totalRaised',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SoftCapNotReach',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'totalRaised',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'softCap',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'SoftCapReach',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'deployer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'name', internalType: 'string', type: 'string', indexed: false },
      {
        name: 'symbol',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'initialSupply',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'logoURI',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'StandaloneTokenDeployed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'contributor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amountClaimed',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalClaimedForContributor',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'TokensClaimed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'tokenAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'Status',
        internalType: 'enum ProjectStatus',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'TokensDepositedForProject',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'projectOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'UnsoldTokensWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'VestingClaimed',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'ExhibitionContributionTokens',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_PROJECT_DURATION',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_TOKEN_DECIMALS',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_TOKEN_PRICE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_LOCK_DURATION',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_START_DELAY',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MIN_TOKEN_PRICE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'PRICE_DECIMALS',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'WITHDRAWAL_DELAY',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'accumulatedFees',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'addExhibitionContributionToken',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'approveAmmForContributionTokens',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'contributionAmounts',
        internalType: 'uint256[]',
        type: 'uint256[]',
      },
      { name: 'tokenPrice', internalType: 'uint256', type: 'uint256' },
      {
        name: 'contributionTokenAddress',
        internalType: 'address',
        type: 'address',
      },
      { name: 'projectTokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'batchCalculateTokens',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'contributorContribution',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'tokenPrice', internalType: 'uint256', type: 'uint256' },
      {
        name: 'contributionTokenAddress',
        internalType: 'address',
        type: 'address',
      },
      { name: 'projectTokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'calculateTokensDue',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'canAcceptContributions',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'claimTokens',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_projectId', internalType: 'uint256', type: 'uint256' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'contribute',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'contributions',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_projectTokenName', internalType: 'string', type: 'string' },
      { name: '_projectTokenSymbol', internalType: 'string', type: 'string' },
      { name: '_initialTotalSupply', internalType: 'uint256', type: 'uint256' },
      { name: '_projectTokenLogoURI', internalType: 'string', type: 'string' },
      {
        name: '_contributionTokenAddress',
        internalType: 'address',
        type: 'address',
      },
      { name: '_fundingGoal', internalType: 'uint256', type: 'uint256' },
      { name: '_softCap', internalType: 'uint256', type: 'uint256' },
      { name: '_minContribution', internalType: 'uint256', type: 'uint256' },
      { name: '_maxContribution', internalType: 'uint256', type: 'uint256' },
      { name: '_tokenPrice', internalType: 'uint256', type: 'uint256' },
      { name: '_startTime', internalType: 'uint256', type: 'uint256' },
      { name: '_endTime', internalType: 'uint256', type: 'uint256' },
      {
        name: '_amountTokensForSale',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: '_liquidityPercentage',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: '_lockDuration', internalType: 'uint256', type: 'uint256' },
      { name: '_vestingEnabled', internalType: 'bool', type: 'bool' },
      { name: '_vestingCliff', internalType: 'uint256', type: 'uint256' },
      { name: '_vestingDuration', internalType: 'uint256', type: 'uint256' },
      { name: '_vestingInterval', internalType: 'uint256', type: 'uint256' },
      {
        name: '_vestingInitialRelease',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    name: 'createLaunchpadProject',
    outputs: [
      { name: 'projectId', internalType: 'uint256', type: 'uint256' },
      { name: 'projectTokenAddress', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_name', internalType: 'string', type: 'string' },
      { name: '_symbol', internalType: 'string', type: 'string' },
      { name: '_initialSupply', internalType: 'uint256', type: 'uint256' },
      { name: '_logoURI', internalType: 'string', type: 'string' },
    ],
    name: 'deployStandaloneToken',
    outputs: [
      { name: 'newTokenAddress', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_projectId', internalType: 'uint256', type: 'uint256' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'depositLiquidityTokens',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_projectId', internalType: 'uint256', type: 'uint256' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'depositProjectTokens',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'exUSDTTokenAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'exhTokenAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'exhibitionAMM',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'exhibitionFactory',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'faucetAmountEXH',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'faucetAmountUSDT',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'faucetCooldownSeconds',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'finalizeLiquidityAndReleaseFunds',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'finalizeProject',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'contributorContribution',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'tokenPrice', internalType: 'uint256', type: 'uint256' },
      {
        name: 'contributionTokenAddress',
        internalType: 'address',
        type: 'address',
      },
      { name: 'projectTokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'getCalculationPreview',
    outputs: [
      {
        name: '',
        internalType: 'struct ITokenCalculation.CalculationPreview',
        type: 'tuple',
        components: [
          { name: 'tokensReceived', internalType: 'uint256', type: 'uint256' },
          {
            name: 'contributionIn18Decimals',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'effectivePrice', internalType: 'uint256', type: 'uint256' },
          {
            name: 'contributionDecimals',
            internalType: 'uint8',
            type: 'uint8',
          },
          { name: 'projectDecimals', internalType: 'uint8', type: 'uint8' },
          {
            name: 'minimumContribution',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'isValid', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getContractAddresses',
    outputs: [
      { name: 'factory', internalType: 'address', type: 'address' },
      { name: 'amm', internalType: 'address', type: 'address' },
      { name: 'exhToken', internalType: 'address', type: 'address' },
      { name: 'exUSDTToken', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getExNEXAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getExhibitionContributionTokens',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getFaucetSettings',
    outputs: [
      { name: 'exhAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'usdtAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'cooldownSeconds', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getMinLockDuration',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenPrice', internalType: 'uint256', type: 'uint256' },
      {
        name: 'contributionTokenAddress',
        internalType: 'address',
        type: 'address',
      },
      { name: 'projectTokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'getMinimumContribution',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getPlatformSettings',
    outputs: [
      { name: 'feePercentage', internalType: 'uint256', type: 'uint256' },
      { name: 'feeRecipient', internalType: 'address', type: 'address' },
      { name: 'minStartDelay', internalType: 'uint256', type: 'uint256' },
      { name: 'maxProjectDuration', internalType: 'uint256', type: 'uint256' },
      { name: 'withdrawalDelay', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getProjectCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'getProjectDetails',
    outputs: [
      {
        name: 'project',
        internalType: 'struct Project',
        type: 'tuple',
        components: [
          { name: 'projectOwner', internalType: 'address', type: 'address' },
          { name: 'projectToken', internalType: 'address', type: 'address' },
          {
            name: 'contributionTokenAddress',
            internalType: 'address',
            type: 'address',
          },
          { name: 'fundingGoal', internalType: 'uint256', type: 'uint256' },
          { name: 'softCap', internalType: 'uint256', type: 'uint256' },
          { name: 'minContribution', internalType: 'uint256', type: 'uint256' },
          { name: 'maxContribution', internalType: 'uint256', type: 'uint256' },
          { name: 'tokenPrice', internalType: 'uint256', type: 'uint256' },
          { name: 'startTime', internalType: 'uint256', type: 'uint256' },
          { name: 'endTime', internalType: 'uint256', type: 'uint256' },
          { name: 'totalRaised', internalType: 'uint256', type: 'uint256' },
          {
            name: 'totalProjectTokenSupply',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'projectTokenLogoURI',
            internalType: 'string',
            type: 'string',
          },
          {
            name: 'amountTokensForSale',
            internalType: 'uint256',
            type: 'uint256',
          },
          {
            name: 'liquidityPercentage',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'lockDuration', internalType: 'uint256', type: 'uint256' },
          { name: 'status', internalType: 'enum ProjectStatus', type: 'uint8' },
          { name: 'liquidityAdded', internalType: 'bool', type: 'bool' },
          { name: 'vestingEnabled', internalType: 'bool', type: 'bool' },
          { name: 'vestingCliff', internalType: 'uint256', type: 'uint256' },
          { name: 'vestingDuration', internalType: 'uint256', type: 'uint256' },
          { name: 'vestingInterval', internalType: 'uint256', type: 'uint256' },
          {
            name: 'vestingInitialRelease',
            internalType: 'uint256',
            type: 'uint256',
          },
        ],
      },
      { name: 'progressPercentage', internalType: 'uint256', type: 'uint256' },
      { name: 'timeRemaining', internalType: 'uint256', type: 'uint256' },
      { name: 'canContribute', internalType: 'bool', type: 'bool' },
      {
        name: 'requiredLiquidityTokens',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: 'depositedLiquidityTokens',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'getProjectLiquidityDeposit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'getProjectProgress',
    outputs: [
      { name: 'progressPercentage', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'getProjectTimeRemaining',
    outputs: [
      { name: 'timeRemaining', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'offset', internalType: 'uint256', type: 'uint256' },
      { name: 'limit', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getProjects',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'getProjectsByOwner',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'status', internalType: 'enum ProjectStatus', type: 'uint8' },
    ],
    name: 'getProjectsByStatus',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'getRequiredLiquidityTokens',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getSystemConstants',
    outputs: [
      {
        name: '',
        internalType: 'struct ITokenCalculation.SystemConstants',
        type: 'tuple',
        components: [
          { name: 'minTokenPrice', internalType: 'uint256', type: 'uint256' },
          { name: 'maxTokenPrice', internalType: 'uint256', type: 'uint256' },
          { name: 'maxTokenDecimals', internalType: 'uint8', type: 'uint8' },
          { name: 'priceDecimals', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'getTokenInfo',
    outputs: [
      {
        name: '',
        internalType: 'struct ITokenCalculation.TokenInfo',
        type: 'tuple',
        components: [
          { name: 'decimals', internalType: 'uint8', type: 'uint8' },
          { name: 'symbol', internalType: 'string', type: 'string' },
          { name: 'name', internalType: 'string', type: 'string' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'projectId', internalType: 'uint256', type: 'uint256' },
      { name: 'user', internalType: 'address', type: 'address' },
    ],
    name: 'getUserContribution',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'projectId', internalType: 'uint256', type: 'uint256' },
      { name: 'user', internalType: 'address', type: 'address' },
    ],
    name: 'getUserProjectSummary',
    outputs: [
      { name: 'contributionAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'tokensOwed', internalType: 'uint256', type: 'uint256' },
      { name: 'tokensVested', internalType: 'uint256', type: 'uint256' },
      { name: 'tokensClaimed', internalType: 'uint256', type: 'uint256' },
      { name: 'tokensAvailable', internalType: 'uint256', type: 'uint256' },
      { name: 'userHasRefunded', internalType: 'bool', type: 'bool' },
      { name: 'canClaim', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'projectId', internalType: 'uint256', type: 'uint256' },
      { name: 'user', internalType: 'address', type: 'address' },
    ],
    name: 'getUserVestingInfo',
    outputs: [
      { name: 'totalAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'releasedAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'startTime', internalType: 'uint256', type: 'uint256' },
      { name: 'lastClaimTime', internalType: 'uint256', type: 'uint256' },
      { name: 'nextClaimTime', internalType: 'uint256', type: 'uint256' },
      { name: 'availableAmount', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'hasRefunded',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'projectId', internalType: 'uint256', type: 'uint256' },
      { name: 'user', internalType: 'address', type: 'address' },
    ],
    name: 'hasUserBeenRefunded',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'isExhibitionContributionToken',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_user', internalType: 'address', type: 'address' }],
    name: 'lastFaucetRequest',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'platformFeePercentage',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'platformFeeRecipient',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'projectLiquidityTokenDeposits',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'projects',
    outputs: [
      { name: 'projectOwner', internalType: 'address', type: 'address' },
      { name: 'projectToken', internalType: 'address', type: 'address' },
      {
        name: 'contributionTokenAddress',
        internalType: 'address',
        type: 'address',
      },
      { name: 'fundingGoal', internalType: 'uint256', type: 'uint256' },
      { name: 'softCap', internalType: 'uint256', type: 'uint256' },
      { name: 'minContribution', internalType: 'uint256', type: 'uint256' },
      { name: 'maxContribution', internalType: 'uint256', type: 'uint256' },
      { name: 'tokenPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'startTime', internalType: 'uint256', type: 'uint256' },
      { name: 'endTime', internalType: 'uint256', type: 'uint256' },
      { name: 'totalRaised', internalType: 'uint256', type: 'uint256' },
      {
        name: 'totalProjectTokenSupply',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'projectTokenLogoURI', internalType: 'string', type: 'string' },
      { name: 'amountTokensForSale', internalType: 'uint256', type: 'uint256' },
      { name: 'liquidityPercentage', internalType: 'uint256', type: 'uint256' },
      { name: 'lockDuration', internalType: 'uint256', type: 'uint256' },
      { name: 'status', internalType: 'enum ProjectStatus', type: 'uint8' },
      { name: 'liquidityAdded', internalType: 'bool', type: 'bool' },
      { name: 'vestingEnabled', internalType: 'bool', type: 'bool' },
      { name: 'vestingCliff', internalType: 'uint256', type: 'uint256' },
      { name: 'vestingDuration', internalType: 'uint256', type: 'uint256' },
      { name: 'vestingInterval', internalType: 'uint256', type: 'uint256' },
      {
        name: 'vestingInitialRelease',
        internalType: 'uint256',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'removeExhibitionContributionToken',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'requestFaucetTokens',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'requestRefund',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_exUSDTTokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'setExUSDTTokenAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_exhTokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'setExhTokenAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_exhibitionAMMAddress',
        internalType: 'address',
        type: 'address',
      },
    ],
    name: 'setExhibitionAMMAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_exhibitionFactoryAddress',
        internalType: 'address',
        type: 'address',
      },
    ],
    name: 'setExhibitionFactoryAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_amount', internalType: 'uint256', type: 'uint256' }],
    name: 'setFaucetAmountEXH',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_amount', internalType: 'uint256', type: 'uint256' }],
    name: 'setFaucetAmountUSDT',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_seconds', internalType: 'uint256', type: 'uint256' }],
    name: 'setFaucetCooldown',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_newPercentage', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'setPlatformFeePercentage',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_newRecipient', internalType: 'address', type: 'address' },
    ],
    name: 'setPlatformFeeRecipient',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'contributorContribution',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'tokenPrice', internalType: 'uint256', type: 'uint256' },
      {
        name: 'contributionTokenAddress',
        internalType: 'address',
        type: 'address',
      },
      { name: 'projectTokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'validateCalculation',
    outputs: [
      {
        name: '',
        internalType: 'struct ITokenCalculation.ValidationResult',
        type: 'tuple',
        components: [
          { name: 'isValid', internalType: 'bool', type: 'bool' },
          { name: 'errorCode', internalType: 'uint8', type: 'uint8' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'vestingInfo',
    outputs: [
      { name: 'totalAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'releasedAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'startTime', internalType: 'uint256', type: 'uint256' },
      { name: 'lastClaimTime', internalType: 'uint256', type: 'uint256' },
      { name: 'nextClaimTime', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenAddress', internalType: 'address', type: 'address' },
      { name: '_recipient', internalType: 'address', type: 'address' },
    ],
    name: 'withdrawAccumulatedFees',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_projectId', internalType: 'uint256', type: 'uint256' }],
    name: 'withdrawUnsoldTokens',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ExhibitionAMM
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const exhibitionAmmAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'EmergencyWithdrawal',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oldAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newAddress',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ExhibitionContractSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'provider',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenA',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenB',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amountA',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'amountB',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'liquidityMinted',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LiquidityAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'tokenA',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenB',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'projectOwner',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'lpAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'unlockTime',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LiquidityLocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'provider',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenA',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenB',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amountA',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'amountB',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LiquidityRemoved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'projectId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'tokenA',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenB',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'projectOwner',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'lpAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'LiquidityUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenA',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenB',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'PoolCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token0',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'token1',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'reserve0',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'reserve1',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'ReservesUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenIn',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenOut',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amountIn',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'amountOut',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Swap',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ExhTokenAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_amountADesired', internalType: 'uint256', type: 'uint256' },
      { name: '_amountBDesired', internalType: 'uint256', type: 'uint256' },
      { name: '_amountAMin', internalType: 'uint256', type: 'uint256' },
      { name: '_amountBMin', internalType: 'uint256', type: 'uint256' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_deadline', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addLiquidity',
    outputs: [
      { name: 'amountA', internalType: 'uint256', type: 'uint256' },
      { name: 'amountB', internalType: 'uint256', type: 'uint256' },
      { name: 'liquidity', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_amountADesired', internalType: 'uint256', type: 'uint256' },
      { name: '_amountBDesired', internalType: 'uint256', type: 'uint256' },
      { name: '_amountAMin', internalType: 'uint256', type: 'uint256' },
      { name: '_amountBMin', internalType: 'uint256', type: 'uint256' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_deadline', internalType: 'uint256', type: 'uint256' },
      { name: '_projectId', internalType: 'uint256', type: 'uint256' },
      { name: '_lockDuration', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addLiquidityWithLock',
    outputs: [
      { name: 'amountA', internalType: 'uint256', type: 'uint256' },
      { name: 'amountB', internalType: 'uint256', type: 'uint256' },
      { name: 'liquidity', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'allPoolPairs',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'blockTimestampLast',
    outputs: [{ name: '', internalType: 'uint32', type: 'uint32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_projectId', internalType: 'uint256', type: 'uint256' },
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_projectOwner', internalType: 'address', type: 'address' },
      { name: '_lpAmount', internalType: 'uint256', type: 'uint256' },
      { name: '_lockDuration', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createLiquidityLock',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
    ],
    name: 'doesPoolExist',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'emergencyPause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_token', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_recipient', internalType: 'address', type: 'address' },
    ],
    name: 'emergencyWithdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'exNEXADDRESS',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'exUSDTADDRESS',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'exhibitionContract',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'exhibitionLPTokens',
    outputs: [
      {
        name: '',
        internalType: 'contract IExhibitionLPTokens',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getAllPoolPairs',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_amountIn', internalType: 'uint256', type: 'uint256' },
      { name: '_tokenIn', internalType: 'address', type: 'address' },
      { name: '_tokenOut', internalType: 'address', type: 'address' },
    ],
    name: 'getAmountOut',
    outputs: [{ name: 'amountOut', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_user', internalType: 'address', type: 'address' },
    ],
    name: 'getLPBalance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    name: 'getLiquidityLock',
    outputs: [
      {
        name: '',
        internalType: 'struct LiquidityLock',
        type: 'tuple',
        components: [
          { name: 'projectId', internalType: 'uint256', type: 'uint256' },
          { name: 'projectOwner', internalType: 'address', type: 'address' },
          { name: 'unlockTime', internalType: 'uint256', type: 'uint256' },
          { name: 'lockedLPAmount', internalType: 'uint256', type: 'uint256' },
          { name: 'isActive', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenPairs', internalType: 'address[][]', type: 'address[][]' },
    ],
    name: 'getMultiplePoolInfo',
    outputs: [
      {
        name: 'pools',
        internalType: 'struct LiquidityPool[]',
        type: 'tuple[]',
        components: [
          { name: 'tokenA', internalType: 'address', type: 'address' },
          { name: 'tokenB', internalType: 'address', type: 'address' },
          { name: 'reserveA', internalType: 'uint256', type: 'uint256' },
          { name: 'reserveB', internalType: 'uint256', type: 'uint256' },
          { name: 'totalLPSupply', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_amountADesired', internalType: 'uint256', type: 'uint256' },
      { name: '_amountBDesired', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getOptimalLiquidityAmounts',
    outputs: [
      { name: 'optimalAmountA', internalType: 'uint256', type: 'uint256' },
      { name: 'optimalAmountB', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
    ],
    name: 'getPool',
    outputs: [
      {
        name: '',
        internalType: 'struct LiquidityPool',
        type: 'tuple',
        components: [
          { name: 'tokenA', internalType: 'address', type: 'address' },
          { name: 'tokenB', internalType: 'address', type: 'address' },
          { name: 'reserveA', internalType: 'uint256', type: 'uint256' },
          { name: 'reserveB', internalType: 'uint256', type: 'uint256' },
          { name: 'totalLPSupply', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getPoolCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
    ],
    name: 'getPoolCumulatives',
    outputs: [
      { name: 'price0Cumulative', internalType: 'uint256', type: 'uint256' },
      { name: 'price1Cumulative', internalType: 'uint256', type: 'uint256' },
      { name: 'blockTimestamp', internalType: 'uint32', type: 'uint32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
    ],
    name: 'getPoolStatistics',
    outputs: [
      { name: 'volume24h', internalType: 'uint256', type: 'uint256' },
      { name: 'tvl', internalType: 'uint256', type: 'uint256' },
      { name: 'utilization', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_offset', internalType: 'uint256', type: 'uint256' },
      { name: '_limit', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getPoolsPaginated',
    outputs: [
      { name: 'tokenAs', internalType: 'address[]', type: 'address[]' },
      { name: 'tokenBs', internalType: 'address[]', type: 'address[]' },
      { name: 'totalPools', internalType: 'uint256', type: 'uint256' },
      { name: 'hasMore', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
    ],
    name: 'getPrice',
    outputs: [{ name: 'price', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_lpAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRemoveLiquidityQuote',
    outputs: [
      { name: 'amountA', internalType: 'uint256', type: 'uint256' },
      { name: 'amountB', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
    ],
    name: 'getReserves',
    outputs: [
      { name: 'reserveA', internalType: 'uint256', type: 'uint256' },
      { name: 'reserveB', internalType: 'uint256', type: 'uint256' },
      { name: 'blockTimestampLast_', internalType: 'uint32', type: 'uint32' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenIn', internalType: 'address', type: 'address' },
      { name: '_tokenOut', internalType: 'address', type: 'address' },
      { name: '_amountIn', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getSlippageImpact',
    outputs: [
      { name: 'slippagePercentage', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_period', internalType: 'uint32', type: 'uint32' },
    ],
    name: 'getTWAP',
    outputs: [{ name: 'twapPrice', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_token', internalType: 'address', type: 'address' }],
    name: 'getTokenDecimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_token', internalType: 'address', type: 'address' }],
    name: 'getTokenSymbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_tokens', internalType: 'address[]', type: 'address[]' }],
    name: 'getTokensInfo',
    outputs: [
      { name: 'symbols', internalType: 'string[]', type: 'string[]' },
      { name: 'decimals', internalType: 'uint8[]', type: 'uint8[]' },
      { name: 'totalSupplies', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
    ],
    name: 'getTotalLPSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_user', internalType: 'address', type: 'address' },
      { name: '_tokenPairs', internalType: 'address[][]', type: 'address[][]' },
    ],
    name: 'getUserBalancesForPools',
    outputs: [
      { name: 'balances', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_user', internalType: 'address', type: 'address' },
      { name: '_offset', internalType: 'uint256', type: 'uint256' },
      { name: '_limit', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getUserPortfolio',
    outputs: [
      { name: 'tokenAs', internalType: 'address[]', type: 'address[]' },
      { name: 'tokenBs', internalType: 'address[]', type: 'address[]' },
      { name: 'lpBalances', internalType: 'uint256[]', type: 'uint256[]' },
      {
        name: 'sharePercentages',
        internalType: 'uint256[]',
        type: 'uint256[]',
      },
      { name: 'totalPositions', internalType: 'uint256', type: 'uint256' },
      { name: 'hasMore', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_user', internalType: 'address', type: 'address' }],
    name: 'getUserPositionCount',
    outputs: [{ name: 'count', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_user', internalType: 'address', type: 'address' }],
    name: 'getUserPositionSummary',
    outputs: [
      { name: 'positionCount', internalType: 'uint256', type: 'uint256' },
      { name: 'totalLPValue', internalType: 'uint256', type: 'uint256' },
      { name: 'activePoolCount', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    name: 'getWithdrawableLPAmount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    name: 'isLiquidityLocked',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'lastFeeUpdateTime',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'liquidityLocks',
    outputs: [
      { name: 'projectId', internalType: 'uint256', type: 'uint256' },
      { name: 'projectOwner', internalType: 'address', type: 'address' },
      { name: 'unlockTime', internalType: 'uint256', type: 'uint256' },
      { name: 'lockedLPAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'isActive', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'liquidityPools',
    outputs: [
      { name: 'tokenA', internalType: 'address', type: 'address' },
      { name: 'tokenB', internalType: 'address', type: 'address' },
      { name: 'reserveA', internalType: 'uint256', type: 'uint256' },
      { name: 'reserveB', internalType: 'uint256', type: 'uint256' },
      { name: 'totalLPSupply', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'poolExists',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'price0CumulativeLast',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'price1CumulativeLast',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'projectTokenPairs',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
      { name: '_lpAmount', internalType: 'uint256', type: 'uint256' },
      { name: '_amountAMin', internalType: 'uint256', type: 'uint256' },
      { name: '_amountBMin', internalType: 'uint256', type: 'uint256' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_deadline', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'removeLiquidity',
    outputs: [
      { name: 'amountA', internalType: 'uint256', type: 'uint256' },
      { name: 'amountB', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_exNEXAddress', internalType: 'address', type: 'address' },
    ],
    name: 'setExNEXAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_exUSDTAddress', internalType: 'address', type: 'address' },
    ],
    name: 'setExUSDTAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_exhTokenAddress', internalType: 'address', type: 'address' },
    ],
    name: 'setExhTokenAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_exhibitionContract', internalType: 'address', type: 'address' },
    ],
    name: 'setExhibitionContract',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_lpTokensAddress', internalType: 'address', type: 'address' },
    ],
    name: 'setLPTokensAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenIn', internalType: 'address', type: 'address' },
      { name: '_tokenOut', internalType: 'address', type: 'address' },
      { name: '_amountIn', internalType: 'uint256', type: 'uint256' },
      { name: '_minAmountOut', internalType: 'uint256', type: 'uint256' },
      { name: '_to', internalType: 'address', type: 'address' },
      { name: '_deadline', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'swapTokenForToken',
    outputs: [{ name: 'amountOut', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'totalFeesCollected',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenA', internalType: 'address', type: 'address' },
      { name: '_tokenB', internalType: 'address', type: 'address' },
    ],
    name: 'unlockLiquidity',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_newExhibitionContract',
        internalType: 'address',
        type: 'address',
      },
    ],
    name: 'updateExhibitionContract',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'userHasPosition',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'userPoolTokensA',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'userPoolTokensB',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exNeX
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const exNeXAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amountNEX',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'amountExNEX',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Deposit',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amountExNEX',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'amountNEX',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Withdrawal',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useReadErc20 = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"allowance"`
 */
export const useReadErc20Allowance = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadErc20BalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"decimals"`
 */
export const useReadErc20Decimals = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"name"`
 */
export const useReadErc20Name = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"symbol"`
 */
export const useReadErc20Symbol = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadErc20TotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useWriteErc20 = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const useWriteErc20Approve = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transfer"`
 */
export const useWriteErc20Transfer = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteErc20TransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useSimulateErc20 = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const useSimulateErc20Approve = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateErc20Transfer = /*#__PURE__*/ createUseSimulateContract(
  { abi: erc20Abi, functionName: 'transfer' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateErc20TransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: erc20Abi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20Abi}__
 */
export const useWatchErc20Event = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc20Abi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20Abi}__ and `eventName` set to `"Approval"`
 */
export const useWatchErc20ApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: erc20Abi,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20Abi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchErc20TransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: erc20Abi,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__
 */
export const useReadExhibition = /*#__PURE__*/ createUseReadContract({
  abi: exhibitionAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"ExhibitionContributionTokens"`
 */
export const useReadExhibitionExhibitionContributionTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'ExhibitionContributionTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"MAX_PROJECT_DURATION"`
 */
export const useReadExhibitionMaxProjectDuration =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'MAX_PROJECT_DURATION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"MAX_TOKEN_DECIMALS"`
 */
export const useReadExhibitionMaxTokenDecimals =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'MAX_TOKEN_DECIMALS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"MAX_TOKEN_PRICE"`
 */
export const useReadExhibitionMaxTokenPrice =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'MAX_TOKEN_PRICE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"MIN_LOCK_DURATION"`
 */
export const useReadExhibitionMinLockDuration =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'MIN_LOCK_DURATION',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"MIN_START_DELAY"`
 */
export const useReadExhibitionMinStartDelay =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'MIN_START_DELAY',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"MIN_TOKEN_PRICE"`
 */
export const useReadExhibitionMinTokenPrice =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'MIN_TOKEN_PRICE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"PRICE_DECIMALS"`
 */
export const useReadExhibitionPriceDecimals =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'PRICE_DECIMALS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"WITHDRAWAL_DELAY"`
 */
export const useReadExhibitionWithdrawalDelay =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'WITHDRAWAL_DELAY',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"accumulatedFees"`
 */
export const useReadExhibitionAccumulatedFees =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'accumulatedFees',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"batchCalculateTokens"`
 */
export const useReadExhibitionBatchCalculateTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'batchCalculateTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"calculateTokensDue"`
 */
export const useReadExhibitionCalculateTokensDue =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'calculateTokensDue',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"canAcceptContributions"`
 */
export const useReadExhibitionCanAcceptContributions =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'canAcceptContributions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"contributions"`
 */
export const useReadExhibitionContributions =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'contributions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"exUSDTTokenAddress"`
 */
export const useReadExhibitionExUsdtTokenAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'exUSDTTokenAddress',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"exhTokenAddress"`
 */
export const useReadExhibitionExhTokenAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'exhTokenAddress',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"exhibitionAMM"`
 */
export const useReadExhibitionExhibitionAmm =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'exhibitionAMM',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"exhibitionFactory"`
 */
export const useReadExhibitionExhibitionFactory =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'exhibitionFactory',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"faucetAmountEXH"`
 */
export const useReadExhibitionFaucetAmountExh =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'faucetAmountEXH',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"faucetAmountUSDT"`
 */
export const useReadExhibitionFaucetAmountUsdt =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'faucetAmountUSDT',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"faucetCooldownSeconds"`
 */
export const useReadExhibitionFaucetCooldownSeconds =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'faucetCooldownSeconds',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getCalculationPreview"`
 */
export const useReadExhibitionGetCalculationPreview =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getCalculationPreview',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getContractAddresses"`
 */
export const useReadExhibitionGetContractAddresses =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getContractAddresses',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getExNEXAddress"`
 */
export const useReadExhibitionGetExNexAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getExNEXAddress',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getExhibitionContributionTokens"`
 */
export const useReadExhibitionGetExhibitionContributionTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getExhibitionContributionTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getFaucetSettings"`
 */
export const useReadExhibitionGetFaucetSettings =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getFaucetSettings',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getMinLockDuration"`
 */
export const useReadExhibitionGetMinLockDuration =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getMinLockDuration',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getMinimumContribution"`
 */
export const useReadExhibitionGetMinimumContribution =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getMinimumContribution',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getPlatformSettings"`
 */
export const useReadExhibitionGetPlatformSettings =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getPlatformSettings',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getProjectCount"`
 */
export const useReadExhibitionGetProjectCount =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getProjectCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getProjectDetails"`
 */
export const useReadExhibitionGetProjectDetails =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getProjectDetails',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getProjectLiquidityDeposit"`
 */
export const useReadExhibitionGetProjectLiquidityDeposit =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getProjectLiquidityDeposit',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getProjectProgress"`
 */
export const useReadExhibitionGetProjectProgress =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getProjectProgress',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getProjectTimeRemaining"`
 */
export const useReadExhibitionGetProjectTimeRemaining =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getProjectTimeRemaining',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getProjects"`
 */
export const useReadExhibitionGetProjects = /*#__PURE__*/ createUseReadContract(
  { abi: exhibitionAbi, functionName: 'getProjects' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getProjectsByOwner"`
 */
export const useReadExhibitionGetProjectsByOwner =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getProjectsByOwner',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getProjectsByStatus"`
 */
export const useReadExhibitionGetProjectsByStatus =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getProjectsByStatus',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getRequiredLiquidityTokens"`
 */
export const useReadExhibitionGetRequiredLiquidityTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getRequiredLiquidityTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getSystemConstants"`
 */
export const useReadExhibitionGetSystemConstants =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getSystemConstants',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getTokenInfo"`
 */
export const useReadExhibitionGetTokenInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getTokenInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getUserContribution"`
 */
export const useReadExhibitionGetUserContribution =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getUserContribution',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getUserProjectSummary"`
 */
export const useReadExhibitionGetUserProjectSummary =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getUserProjectSummary',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"getUserVestingInfo"`
 */
export const useReadExhibitionGetUserVestingInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'getUserVestingInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"hasRefunded"`
 */
export const useReadExhibitionHasRefunded = /*#__PURE__*/ createUseReadContract(
  { abi: exhibitionAbi, functionName: 'hasRefunded' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"hasUserBeenRefunded"`
 */
export const useReadExhibitionHasUserBeenRefunded =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'hasUserBeenRefunded',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"isExhibitionContributionToken"`
 */
export const useReadExhibitionIsExhibitionContributionToken =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'isExhibitionContributionToken',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"lastFaucetRequest"`
 */
export const useReadExhibitionLastFaucetRequest =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'lastFaucetRequest',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"owner"`
 */
export const useReadExhibitionOwner = /*#__PURE__*/ createUseReadContract({
  abi: exhibitionAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"platformFeePercentage"`
 */
export const useReadExhibitionPlatformFeePercentage =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'platformFeePercentage',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"platformFeeRecipient"`
 */
export const useReadExhibitionPlatformFeeRecipient =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'platformFeeRecipient',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"projectLiquidityTokenDeposits"`
 */
export const useReadExhibitionProjectLiquidityTokenDeposits =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'projectLiquidityTokenDeposits',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"projects"`
 */
export const useReadExhibitionProjects = /*#__PURE__*/ createUseReadContract({
  abi: exhibitionAbi,
  functionName: 'projects',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"validateCalculation"`
 */
export const useReadExhibitionValidateCalculation =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAbi,
    functionName: 'validateCalculation',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"vestingInfo"`
 */
export const useReadExhibitionVestingInfo = /*#__PURE__*/ createUseReadContract(
  { abi: exhibitionAbi, functionName: 'vestingInfo' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__
 */
export const useWriteExhibition = /*#__PURE__*/ createUseWriteContract({
  abi: exhibitionAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"addExhibitionContributionToken"`
 */
export const useWriteExhibitionAddExhibitionContributionToken =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'addExhibitionContributionToken',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"approveAmmForContributionTokens"`
 */
export const useWriteExhibitionApproveAmmForContributionTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'approveAmmForContributionTokens',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"claimTokens"`
 */
export const useWriteExhibitionClaimTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'claimTokens',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"contribute"`
 */
export const useWriteExhibitionContribute =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'contribute',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"createLaunchpadProject"`
 */
export const useWriteExhibitionCreateLaunchpadProject =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'createLaunchpadProject',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"deployStandaloneToken"`
 */
export const useWriteExhibitionDeployStandaloneToken =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'deployStandaloneToken',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"depositLiquidityTokens"`
 */
export const useWriteExhibitionDepositLiquidityTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'depositLiquidityTokens',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"depositProjectTokens"`
 */
export const useWriteExhibitionDepositProjectTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'depositProjectTokens',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"finalizeLiquidityAndReleaseFunds"`
 */
export const useWriteExhibitionFinalizeLiquidityAndReleaseFunds =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'finalizeLiquidityAndReleaseFunds',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"finalizeProject"`
 */
export const useWriteExhibitionFinalizeProject =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'finalizeProject',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"removeExhibitionContributionToken"`
 */
export const useWriteExhibitionRemoveExhibitionContributionToken =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'removeExhibitionContributionToken',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteExhibitionRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"requestFaucetTokens"`
 */
export const useWriteExhibitionRequestFaucetTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'requestFaucetTokens',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"requestRefund"`
 */
export const useWriteExhibitionRequestRefund =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'requestRefund',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setExUSDTTokenAddress"`
 */
export const useWriteExhibitionSetExUsdtTokenAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'setExUSDTTokenAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setExhTokenAddress"`
 */
export const useWriteExhibitionSetExhTokenAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'setExhTokenAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setExhibitionAMMAddress"`
 */
export const useWriteExhibitionSetExhibitionAmmAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'setExhibitionAMMAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setExhibitionFactoryAddress"`
 */
export const useWriteExhibitionSetExhibitionFactoryAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'setExhibitionFactoryAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setFaucetAmountEXH"`
 */
export const useWriteExhibitionSetFaucetAmountExh =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'setFaucetAmountEXH',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setFaucetAmountUSDT"`
 */
export const useWriteExhibitionSetFaucetAmountUsdt =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'setFaucetAmountUSDT',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setFaucetCooldown"`
 */
export const useWriteExhibitionSetFaucetCooldown =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'setFaucetCooldown',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setPlatformFeePercentage"`
 */
export const useWriteExhibitionSetPlatformFeePercentage =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'setPlatformFeePercentage',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setPlatformFeeRecipient"`
 */
export const useWriteExhibitionSetPlatformFeeRecipient =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'setPlatformFeeRecipient',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteExhibitionTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"withdrawAccumulatedFees"`
 */
export const useWriteExhibitionWithdrawAccumulatedFees =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'withdrawAccumulatedFees',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"withdrawUnsoldTokens"`
 */
export const useWriteExhibitionWithdrawUnsoldTokens =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAbi,
    functionName: 'withdrawUnsoldTokens',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__
 */
export const useSimulateExhibition = /*#__PURE__*/ createUseSimulateContract({
  abi: exhibitionAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"addExhibitionContributionToken"`
 */
export const useSimulateExhibitionAddExhibitionContributionToken =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'addExhibitionContributionToken',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"approveAmmForContributionTokens"`
 */
export const useSimulateExhibitionApproveAmmForContributionTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'approveAmmForContributionTokens',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"claimTokens"`
 */
export const useSimulateExhibitionClaimTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'claimTokens',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"contribute"`
 */
export const useSimulateExhibitionContribute =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'contribute',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"createLaunchpadProject"`
 */
export const useSimulateExhibitionCreateLaunchpadProject =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'createLaunchpadProject',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"deployStandaloneToken"`
 */
export const useSimulateExhibitionDeployStandaloneToken =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'deployStandaloneToken',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"depositLiquidityTokens"`
 */
export const useSimulateExhibitionDepositLiquidityTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'depositLiquidityTokens',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"depositProjectTokens"`
 */
export const useSimulateExhibitionDepositProjectTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'depositProjectTokens',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"finalizeLiquidityAndReleaseFunds"`
 */
export const useSimulateExhibitionFinalizeLiquidityAndReleaseFunds =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'finalizeLiquidityAndReleaseFunds',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"finalizeProject"`
 */
export const useSimulateExhibitionFinalizeProject =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'finalizeProject',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"removeExhibitionContributionToken"`
 */
export const useSimulateExhibitionRemoveExhibitionContributionToken =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'removeExhibitionContributionToken',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateExhibitionRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"requestFaucetTokens"`
 */
export const useSimulateExhibitionRequestFaucetTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'requestFaucetTokens',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"requestRefund"`
 */
export const useSimulateExhibitionRequestRefund =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'requestRefund',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setExUSDTTokenAddress"`
 */
export const useSimulateExhibitionSetExUsdtTokenAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'setExUSDTTokenAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setExhTokenAddress"`
 */
export const useSimulateExhibitionSetExhTokenAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'setExhTokenAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setExhibitionAMMAddress"`
 */
export const useSimulateExhibitionSetExhibitionAmmAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'setExhibitionAMMAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setExhibitionFactoryAddress"`
 */
export const useSimulateExhibitionSetExhibitionFactoryAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'setExhibitionFactoryAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setFaucetAmountEXH"`
 */
export const useSimulateExhibitionSetFaucetAmountExh =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'setFaucetAmountEXH',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setFaucetAmountUSDT"`
 */
export const useSimulateExhibitionSetFaucetAmountUsdt =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'setFaucetAmountUSDT',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setFaucetCooldown"`
 */
export const useSimulateExhibitionSetFaucetCooldown =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'setFaucetCooldown',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setPlatformFeePercentage"`
 */
export const useSimulateExhibitionSetPlatformFeePercentage =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'setPlatformFeePercentage',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"setPlatformFeeRecipient"`
 */
export const useSimulateExhibitionSetPlatformFeeRecipient =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'setPlatformFeeRecipient',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateExhibitionTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"withdrawAccumulatedFees"`
 */
export const useSimulateExhibitionWithdrawAccumulatedFees =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'withdrawAccumulatedFees',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAbi}__ and `functionName` set to `"withdrawUnsoldTokens"`
 */
export const useSimulateExhibitionWithdrawUnsoldTokens =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAbi,
    functionName: 'withdrawUnsoldTokens',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__
 */
export const useWatchExhibitionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: exhibitionAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"AmmApprovedForToken"`
 */
export const useWatchExhibitionAmmApprovedForTokenEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'AmmApprovedForToken',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"ContributionMade"`
 */
export const useWatchExhibitionContributionMadeEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'ContributionMade',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"ExhTokenAddressSet"`
 */
export const useWatchExhibitionExhTokenAddressSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'ExhTokenAddressSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"ExhibitionAMMAddressSet"`
 */
export const useWatchExhibitionExhibitionAmmAddressSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'ExhibitionAMMAddressSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"ExhibitionContributionTokenAdded"`
 */
export const useWatchExhibitionExhibitionContributionTokenAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'ExhibitionContributionTokenAdded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"ExhibitionContributionTokenRemoved"`
 */
export const useWatchExhibitionExhibitionContributionTokenRemovedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'ExhibitionContributionTokenRemoved',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"ExhibitionFactoryAddressSet"`
 */
export const useWatchExhibitionExhibitionFactoryAddressSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'ExhibitionFactoryAddressSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"ExhibitionUSDTAddressSet"`
 */
export const useWatchExhibitionExhibitionUsdtAddressSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'ExhibitionUSDTAddressSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"FaucetMinted"`
 */
export const useWatchExhibitionFaucetMintedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'FaucetMinted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"FaucetRequested"`
 */
export const useWatchExhibitionFaucetRequestedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'FaucetRequested',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"FeesWithdrawn"`
 */
export const useWatchExhibitionFeesWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'FeesWithdrawn',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"FundsReleasedToProjectOwner"`
 */
export const useWatchExhibitionFundsReleasedToProjectOwnerEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'FundsReleasedToProjectOwner',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"HardCapReached"`
 */
export const useWatchExhibitionHardCapReachedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'HardCapReached',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"LiquidityAdded"`
 */
export const useWatchExhibitionLiquidityAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'LiquidityAdded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"LiquidityTokensDeposited"`
 */
export const useWatchExhibitionLiquidityTokensDepositedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'LiquidityTokensDeposited',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchExhibitionOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"PlatformFeeCollected"`
 */
export const useWatchExhibitionPlatformFeeCollectedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'PlatformFeeCollected',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"PlatformFeePercentageUpdated"`
 */
export const useWatchExhibitionPlatformFeePercentageUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'PlatformFeePercentageUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"PlatformFeeRecipientUpdated"`
 */
export const useWatchExhibitionPlatformFeeRecipientUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'PlatformFeeRecipientUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"ProjectCreated"`
 */
export const useWatchExhibitionProjectCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'ProjectCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"ProjectFinalized"`
 */
export const useWatchExhibitionProjectFinalizedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'ProjectFinalized',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"ProjectStatusUpdated"`
 */
export const useWatchExhibitionProjectStatusUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'ProjectStatusUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"RefundIssued"`
 */
export const useWatchExhibitionRefundIssuedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'RefundIssued',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"SoftCapNotReach"`
 */
export const useWatchExhibitionSoftCapNotReachEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'SoftCapNotReach',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"SoftCapReach"`
 */
export const useWatchExhibitionSoftCapReachEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'SoftCapReach',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"StandaloneTokenDeployed"`
 */
export const useWatchExhibitionStandaloneTokenDeployedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'StandaloneTokenDeployed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"TokensClaimed"`
 */
export const useWatchExhibitionTokensClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'TokensClaimed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"TokensDepositedForProject"`
 */
export const useWatchExhibitionTokensDepositedForProjectEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'TokensDepositedForProject',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"UnsoldTokensWithdrawn"`
 */
export const useWatchExhibitionUnsoldTokensWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'UnsoldTokensWithdrawn',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAbi}__ and `eventName` set to `"VestingClaimed"`
 */
export const useWatchExhibitionVestingClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAbi,
    eventName: 'VestingClaimed',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__
 */
export const useReadExhibitionAmm = /*#__PURE__*/ createUseReadContract({
  abi: exhibitionAmmAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"ExhTokenAddress"`
 */
export const useReadExhibitionAmmExhTokenAddress =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'ExhTokenAddress',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"allPoolPairs"`
 */
export const useReadExhibitionAmmAllPoolPairs =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'allPoolPairs',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"blockTimestampLast"`
 */
export const useReadExhibitionAmmBlockTimestampLast =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'blockTimestampLast',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"doesPoolExist"`
 */
export const useReadExhibitionAmmDoesPoolExist =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'doesPoolExist',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"exNEXADDRESS"`
 */
export const useReadExhibitionAmmExNexaddress =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'exNEXADDRESS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"exUSDTADDRESS"`
 */
export const useReadExhibitionAmmExUsdtaddress =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'exUSDTADDRESS',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"exhibitionContract"`
 */
export const useReadExhibitionAmmExhibitionContract =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'exhibitionContract',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"exhibitionLPTokens"`
 */
export const useReadExhibitionAmmExhibitionLpTokens =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'exhibitionLPTokens',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getAllPoolPairs"`
 */
export const useReadExhibitionAmmGetAllPoolPairs =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getAllPoolPairs',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getAmountOut"`
 */
export const useReadExhibitionAmmGetAmountOut =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getAmountOut',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getLPBalance"`
 */
export const useReadExhibitionAmmGetLpBalance =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getLPBalance',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getLiquidityLock"`
 */
export const useReadExhibitionAmmGetLiquidityLock =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getLiquidityLock',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getMultiplePoolInfo"`
 */
export const useReadExhibitionAmmGetMultiplePoolInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getMultiplePoolInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getOptimalLiquidityAmounts"`
 */
export const useReadExhibitionAmmGetOptimalLiquidityAmounts =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getOptimalLiquidityAmounts',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getPool"`
 */
export const useReadExhibitionAmmGetPool = /*#__PURE__*/ createUseReadContract({
  abi: exhibitionAmmAbi,
  functionName: 'getPool',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getPoolCount"`
 */
export const useReadExhibitionAmmGetPoolCount =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getPoolCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getPoolCumulatives"`
 */
export const useReadExhibitionAmmGetPoolCumulatives =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getPoolCumulatives',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getPoolStatistics"`
 */
export const useReadExhibitionAmmGetPoolStatistics =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getPoolStatistics',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getPoolsPaginated"`
 */
export const useReadExhibitionAmmGetPoolsPaginated =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getPoolsPaginated',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getPrice"`
 */
export const useReadExhibitionAmmGetPrice = /*#__PURE__*/ createUseReadContract(
  { abi: exhibitionAmmAbi, functionName: 'getPrice' },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getRemoveLiquidityQuote"`
 */
export const useReadExhibitionAmmGetRemoveLiquidityQuote =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getRemoveLiquidityQuote',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getReserves"`
 */
export const useReadExhibitionAmmGetReserves =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getReserves',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getSlippageImpact"`
 */
export const useReadExhibitionAmmGetSlippageImpact =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getSlippageImpact',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getTWAP"`
 */
export const useReadExhibitionAmmGetTwap = /*#__PURE__*/ createUseReadContract({
  abi: exhibitionAmmAbi,
  functionName: 'getTWAP',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getTokenDecimals"`
 */
export const useReadExhibitionAmmGetTokenDecimals =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getTokenDecimals',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getTokenSymbol"`
 */
export const useReadExhibitionAmmGetTokenSymbol =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getTokenSymbol',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getTokensInfo"`
 */
export const useReadExhibitionAmmGetTokensInfo =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getTokensInfo',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getTotalLPSupply"`
 */
export const useReadExhibitionAmmGetTotalLpSupply =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getTotalLPSupply',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getUserBalancesForPools"`
 */
export const useReadExhibitionAmmGetUserBalancesForPools =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getUserBalancesForPools',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getUserPortfolio"`
 */
export const useReadExhibitionAmmGetUserPortfolio =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getUserPortfolio',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getUserPositionCount"`
 */
export const useReadExhibitionAmmGetUserPositionCount =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getUserPositionCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getUserPositionSummary"`
 */
export const useReadExhibitionAmmGetUserPositionSummary =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getUserPositionSummary',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"getWithdrawableLPAmount"`
 */
export const useReadExhibitionAmmGetWithdrawableLpAmount =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'getWithdrawableLPAmount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"isLiquidityLocked"`
 */
export const useReadExhibitionAmmIsLiquidityLocked =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'isLiquidityLocked',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"lastFeeUpdateTime"`
 */
export const useReadExhibitionAmmLastFeeUpdateTime =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'lastFeeUpdateTime',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"liquidityLocks"`
 */
export const useReadExhibitionAmmLiquidityLocks =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'liquidityLocks',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"liquidityPools"`
 */
export const useReadExhibitionAmmLiquidityPools =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'liquidityPools',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"owner"`
 */
export const useReadExhibitionAmmOwner = /*#__PURE__*/ createUseReadContract({
  abi: exhibitionAmmAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"poolExists"`
 */
export const useReadExhibitionAmmPoolExists =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'poolExists',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"price0CumulativeLast"`
 */
export const useReadExhibitionAmmPrice0CumulativeLast =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'price0CumulativeLast',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"price1CumulativeLast"`
 */
export const useReadExhibitionAmmPrice1CumulativeLast =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'price1CumulativeLast',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"projectTokenPairs"`
 */
export const useReadExhibitionAmmProjectTokenPairs =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'projectTokenPairs',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"totalFeesCollected"`
 */
export const useReadExhibitionAmmTotalFeesCollected =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'totalFeesCollected',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"userHasPosition"`
 */
export const useReadExhibitionAmmUserHasPosition =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'userHasPosition',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"userPoolTokensA"`
 */
export const useReadExhibitionAmmUserPoolTokensA =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'userPoolTokensA',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"userPoolTokensB"`
 */
export const useReadExhibitionAmmUserPoolTokensB =
  /*#__PURE__*/ createUseReadContract({
    abi: exhibitionAmmAbi,
    functionName: 'userPoolTokensB',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__
 */
export const useWriteExhibitionAmm = /*#__PURE__*/ createUseWriteContract({
  abi: exhibitionAmmAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"addLiquidity"`
 */
export const useWriteExhibitionAmmAddLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'addLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"addLiquidityWithLock"`
 */
export const useWriteExhibitionAmmAddLiquidityWithLock =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'addLiquidityWithLock',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"createLiquidityLock"`
 */
export const useWriteExhibitionAmmCreateLiquidityLock =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'createLiquidityLock',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"emergencyPause"`
 */
export const useWriteExhibitionAmmEmergencyPause =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'emergencyPause',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"emergencyWithdraw"`
 */
export const useWriteExhibitionAmmEmergencyWithdraw =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'emergencyWithdraw',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"removeLiquidity"`
 */
export const useWriteExhibitionAmmRemoveLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'removeLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useWriteExhibitionAmmRenounceOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"setExNEXAddress"`
 */
export const useWriteExhibitionAmmSetExNexAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'setExNEXAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"setExUSDTAddress"`
 */
export const useWriteExhibitionAmmSetExUsdtAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'setExUSDTAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"setExhTokenAddress"`
 */
export const useWriteExhibitionAmmSetExhTokenAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'setExhTokenAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"setExhibitionContract"`
 */
export const useWriteExhibitionAmmSetExhibitionContract =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'setExhibitionContract',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"setLPTokensAddress"`
 */
export const useWriteExhibitionAmmSetLpTokensAddress =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'setLPTokensAddress',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"swapTokenForToken"`
 */
export const useWriteExhibitionAmmSwapTokenForToken =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'swapTokenForToken',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useWriteExhibitionAmmTransferOwnership =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"unlockLiquidity"`
 */
export const useWriteExhibitionAmmUnlockLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'unlockLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"updateExhibitionContract"`
 */
export const useWriteExhibitionAmmUpdateExhibitionContract =
  /*#__PURE__*/ createUseWriteContract({
    abi: exhibitionAmmAbi,
    functionName: 'updateExhibitionContract',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__
 */
export const useSimulateExhibitionAmm = /*#__PURE__*/ createUseSimulateContract(
  { abi: exhibitionAmmAbi },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"addLiquidity"`
 */
export const useSimulateExhibitionAmmAddLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'addLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"addLiquidityWithLock"`
 */
export const useSimulateExhibitionAmmAddLiquidityWithLock =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'addLiquidityWithLock',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"createLiquidityLock"`
 */
export const useSimulateExhibitionAmmCreateLiquidityLock =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'createLiquidityLock',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"emergencyPause"`
 */
export const useSimulateExhibitionAmmEmergencyPause =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'emergencyPause',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"emergencyWithdraw"`
 */
export const useSimulateExhibitionAmmEmergencyWithdraw =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'emergencyWithdraw',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"removeLiquidity"`
 */
export const useSimulateExhibitionAmmRemoveLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'removeLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"renounceOwnership"`
 */
export const useSimulateExhibitionAmmRenounceOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'renounceOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"setExNEXAddress"`
 */
export const useSimulateExhibitionAmmSetExNexAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'setExNEXAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"setExUSDTAddress"`
 */
export const useSimulateExhibitionAmmSetExUsdtAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'setExUSDTAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"setExhTokenAddress"`
 */
export const useSimulateExhibitionAmmSetExhTokenAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'setExhTokenAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"setExhibitionContract"`
 */
export const useSimulateExhibitionAmmSetExhibitionContract =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'setExhibitionContract',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"setLPTokensAddress"`
 */
export const useSimulateExhibitionAmmSetLpTokensAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'setLPTokensAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"swapTokenForToken"`
 */
export const useSimulateExhibitionAmmSwapTokenForToken =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'swapTokenForToken',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"transferOwnership"`
 */
export const useSimulateExhibitionAmmTransferOwnership =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'transferOwnership',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"unlockLiquidity"`
 */
export const useSimulateExhibitionAmmUnlockLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'unlockLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `functionName` set to `"updateExhibitionContract"`
 */
export const useSimulateExhibitionAmmUpdateExhibitionContract =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exhibitionAmmAbi,
    functionName: 'updateExhibitionContract',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__
 */
export const useWatchExhibitionAmmEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: exhibitionAmmAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `eventName` set to `"EmergencyWithdrawal"`
 */
export const useWatchExhibitionAmmEmergencyWithdrawalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAmmAbi,
    eventName: 'EmergencyWithdrawal',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `eventName` set to `"ExhibitionContractSet"`
 */
export const useWatchExhibitionAmmExhibitionContractSetEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAmmAbi,
    eventName: 'ExhibitionContractSet',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `eventName` set to `"LiquidityAdded"`
 */
export const useWatchExhibitionAmmLiquidityAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAmmAbi,
    eventName: 'LiquidityAdded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `eventName` set to `"LiquidityLocked"`
 */
export const useWatchExhibitionAmmLiquidityLockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAmmAbi,
    eventName: 'LiquidityLocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `eventName` set to `"LiquidityRemoved"`
 */
export const useWatchExhibitionAmmLiquidityRemovedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAmmAbi,
    eventName: 'LiquidityRemoved',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `eventName` set to `"LiquidityUnlocked"`
 */
export const useWatchExhibitionAmmLiquidityUnlockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAmmAbi,
    eventName: 'LiquidityUnlocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `eventName` set to `"OwnershipTransferred"`
 */
export const useWatchExhibitionAmmOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAmmAbi,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `eventName` set to `"PoolCreated"`
 */
export const useWatchExhibitionAmmPoolCreatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAmmAbi,
    eventName: 'PoolCreated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `eventName` set to `"ReservesUpdated"`
 */
export const useWatchExhibitionAmmReservesUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAmmAbi,
    eventName: 'ReservesUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exhibitionAmmAbi}__ and `eventName` set to `"Swap"`
 */
export const useWatchExhibitionAmmSwapEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exhibitionAmmAbi,
    eventName: 'Swap',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exNeXAbi}__
 */
export const useReadExNeX = /*#__PURE__*/ createUseReadContract({
  abi: exNeXAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"allowance"`
 */
export const useReadExNeXAllowance = /*#__PURE__*/ createUseReadContract({
  abi: exNeXAbi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadExNeXBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: exNeXAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"decimals"`
 */
export const useReadExNeXDecimals = /*#__PURE__*/ createUseReadContract({
  abi: exNeXAbi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"name"`
 */
export const useReadExNeXName = /*#__PURE__*/ createUseReadContract({
  abi: exNeXAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadExNeXSymbol = /*#__PURE__*/ createUseReadContract({
  abi: exNeXAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadExNeXTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: exNeXAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exNeXAbi}__
 */
export const useWriteExNeX = /*#__PURE__*/ createUseWriteContract({
  abi: exNeXAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteExNeXApprove = /*#__PURE__*/ createUseWriteContract({
  abi: exNeXAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"deposit"`
 */
export const useWriteExNeXDeposit = /*#__PURE__*/ createUseWriteContract({
  abi: exNeXAbi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"transfer"`
 */
export const useWriteExNeXTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: exNeXAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteExNeXTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: exNeXAbi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"withdraw"`
 */
export const useWriteExNeXWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: exNeXAbi,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exNeXAbi}__
 */
export const useSimulateExNeX = /*#__PURE__*/ createUseSimulateContract({
  abi: exNeXAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateExNeXApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: exNeXAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"deposit"`
 */
export const useSimulateExNeXDeposit = /*#__PURE__*/ createUseSimulateContract({
  abi: exNeXAbi,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateExNeXTransfer = /*#__PURE__*/ createUseSimulateContract(
  { abi: exNeXAbi, functionName: 'transfer' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateExNeXTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: exNeXAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link exNeXAbi}__ and `functionName` set to `"withdraw"`
 */
export const useSimulateExNeXWithdraw = /*#__PURE__*/ createUseSimulateContract(
  { abi: exNeXAbi, functionName: 'withdraw' },
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exNeXAbi}__
 */
export const useWatchExNeXEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: exNeXAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exNeXAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchExNeXApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exNeXAbi,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exNeXAbi}__ and `eventName` set to `"Deposit"`
 */
export const useWatchExNeXDepositEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exNeXAbi,
    eventName: 'Deposit',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exNeXAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchExNeXTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exNeXAbi,
    eventName: 'Transfer',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link exNeXAbi}__ and `eventName` set to `"Withdrawal"`
 */
export const useWatchExNeXWithdrawalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: exNeXAbi,
    eventName: 'Withdrawal',
  })
