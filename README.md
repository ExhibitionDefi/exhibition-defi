src/
├── main.tsx                     
├── App.tsx                     # Main app component 
├── index.css                   # Global tailwindcss directive
├── vite-env.d.ts              # env types 
├── components/
│   ├── ui/                     # Base UI components
│   │   ├── Alert.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Label.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Badge.tsx
│   │   ├── Progress.tsx
│   │   └── LoadingSpinner.tsx
│   ├── common/                 # Shared components   
│   │   ├── ConnectWalletPrompt.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── TokenApproval.tsx    
│   │   └── MultiTransactionModal.tsx
│   ├── project/                # Project-specific
│   │   ├── ContributeForm.tsx
│   │   ├── CreateProjectForm.tsx
│   │   ├── DepositLiquidityCard.tsx
│   │   ├── DepositProjectTokenCard.tsx
│   │   ├── FinalizeLiquidityPreviewCard.tsx
│   │   ├── ProjectCard.tsx     # UI Component
│   │   ├── ProjectFilters.tsx  # UI components
│   │   ├── ProjectDetails.tsx  # UI components 
│   │   ├── UserProjectSummary.tsx # integrated with claimtokens
│   │   ├── RefundRequestForm.tsx
│   │   └── WithdrawUnsoldTokensCard.tsx
│   ├── swap/                  
│   │   ├── SwapInterface.tsx # update swap UI component
│   │   ├── TokenSelector.tsx  # updated base on the generic hook
│   │   └── SwapSettings.tsx   # swap setting modal/UI components
│   ├── liquidity/              
│   │   ├── LiquidityInterface.tsx
│   │   └── PoolList.tsx
│   └── Layout.tsx        
├──config/
│   │   ├── chains.ts
│   │   ├── contracts.ts
│   │   └── wagmi.ts 
├── generated/ # contain wagmi-cli generated hooks & functions    
├── hooks/  # Custom hooks
│   ├──admin/ # contain admin functions
│   ├── amm/
│   │   ├── useLiquidityPool.ts 
│   │   └── useSwapLogic.ts                  
│   ├── pad/ # contains Launchpad Logic/actions
│   ├── useProjects.ts
│   ├── useProject.ts
│   ├── useFaucet.ts
│   ├── useGetTokensInfo.ts
│   ├── useTokenAllowance.ts
│   ├── useTokenApproval.ts
│   ├── useTokenBalance.ts                 
│   └──useTokenInfo.ts     
├── pages/                      # Page components
│   ├── HomePage.tsx
│   ├── ProjectsPage.tsx
│   ├── ProjectDetailPage.tsx
│   ├── CreateProjectPage.tsx
│   ├── DashboardPage.tsx
│   ├── FaucetPage.tsx
│   ├── AdminPage.tsx
│   ├── SwapPage.tsx            # Dedicated swap page
│   └── LiquidityPage.tsx       # Liquidity management page  
├── stores/
│   └── projectStore.ts           
├── types/
│   ├── abis/                   # Generated ABIs array
│   │   ├── Exhibition.json
│   │   ├── ExhibitionAMM.json
│   │   └── exNEX.json
│   ├── project.ts              # Exhibition project types                 
│   └── amm.ts                   # ExhibitionAMM Interface types
└── utils/
    ├── exFormatters.ts         # Exhibition formatters
    ├── ammFormatters.ts        # ExhibitionAMM formatters & utilities
    └── timeHelpers.ts
