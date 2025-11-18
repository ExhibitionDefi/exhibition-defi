import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LiquidityInterface } from '@/components/liquidity/LiquidityInterface';
import { PoolDetailsPanel } from '@/components/liquidity/PoolDetailsPanel';
import type { Address } from 'viem';
import type { Pool } from '@/components/liquidity/PoolList';
import { useAccount, useReadContracts } from 'wagmi';
import { exhibitionAmmAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { useAddLiquidity } from '@/hooks/amm/useAddLiquidity';
import { useRemoveLiquidity } from '@/hooks/amm/useRemoveLiquidity';

export const ManageLiquidityPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { address } = useAccount();
  
  // Get params from URL
  const tokenAParam = searchParams.get('tokenA') as Address | null;
  const tokenBParam = searchParams.get('tokenB') as Address | null;
  const modeParam = searchParams.get('mode') as 'add' | 'remove' | null;

  const [initialPositions, setInitialPositions] = useState<Pool[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Pool | null>(null);
  
  // ✅ Track current mode (not just URL param)
  const [currentMode, setCurrentMode] = useState<'add' | 'remove'>(modeParam || 'add');

  // ✅ Initialize both hooks here so we can access their state
  const addLiquidity = useAddLiquidity(tokenAParam, tokenBParam);
  const removeLiquidity = useRemoveLiquidity();

  // ✅ Track current tokens (either from hook state or selected position)
  const [currentTokenA, setCurrentTokenA] = useState<Address | null>(tokenAParam);
  const [currentTokenB, setCurrentTokenB] = useState<Address | null>(tokenBParam);

  // ✅ Update current tokens when addLiquidity state changes (Add mode)
  useEffect(() => {
    if (currentMode === 'add' && addLiquidity.state.tokenA && addLiquidity.state.tokenB) {
      setCurrentTokenA(addLiquidity.state.tokenA);
      setCurrentTokenB(addLiquidity.state.tokenB);
    }
  }, [addLiquidity.state.tokenA, addLiquidity.state.tokenB, currentMode]);

  // ✅ Update current tokens when removeLiquidity state changes (Remove mode)
  useEffect(() => {
    if (currentMode === 'remove' && removeLiquidity.state.tokenA && removeLiquidity.state.tokenB) {
      setCurrentTokenA(removeLiquidity.state.tokenA);
      setCurrentTokenB(removeLiquidity.state.tokenB);
    }
  }, [removeLiquidity.state.tokenA, removeLiquidity.state.tokenB, currentMode]);

  // ✅ Also update when position is selected (for remove mode via dropdown)
  useEffect(() => {
    if (currentMode === 'remove' && selectedPosition) {
      setCurrentTokenA(selectedPosition.tokenA);
      setCurrentTokenB(selectedPosition.tokenB);
    }
  }, [selectedPosition, currentMode]);

  // Fetch user portfolio when address is available
  const { data: portfolioData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getUserPortfolio',
        args: address ? [address, BigInt(0), BigInt(50)] : undefined,
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: 30_000,
      staleTime: 15_000,
    },
  });

  const portfolioResult = portfolioData?.[0]?.result as
    | [Address[], Address[], bigint[], bigint[]]
    | undefined;

  // Gather all unique tokens from portfolio
  const allTokens = React.useMemo(() => {
    if (!portfolioResult) return [];

    const tokens = new Set<Address>();
    const [tokenAs, tokenBs] = portfolioResult;

    tokenAs?.forEach((token: Address) => tokens.add(token));
    tokenBs?.forEach((token: Address) => tokens.add(token));

    return Array.from(tokens);
  }, [portfolioResult]);

  // Fetch token info for all tokens in portfolio
  const { data: tokensInfoData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getTokensInfo',
        args: allTokens.length > 0 ? [allTokens] : undefined,
      },
    ],
    query: {
      enabled: allTokens.length > 0,
      refetchInterval: 120_000,
      staleTime: 60_000,
    },
  });

  const tokensInfo = tokensInfoData?.[0]?.result as
    | readonly [readonly string[], readonly bigint[], readonly bigint[]]
    | undefined;

  // Transform portfolio data into Pool array
  useEffect(() => {
    if (!portfolioResult || !address || !tokensInfo) {
      setInitialPositions([]);
      return;
    }

    const [tokenAs, tokenBs, lpBalances, sharePercentages] = portfolioResult;
    const [symbols] = tokensInfo;

    // Create token symbol map
    const tokenSymbolMap: Record<Address, string> = {};
    allTokens.forEach((token, index) => {
      if (symbols[index]) {
        tokenSymbolMap[token] = symbols[index];
      }
    });

    const positions: Pool[] = tokenAs.map((tokenA, index) => {
      const tokenB = tokenBs[index] || ('0x0' as Address);
      const lpBalance = lpBalances[index] || BigInt(0);
      const sharePercentage = sharePercentages[index] || BigInt(0);

      const symbolA = tokenSymbolMap[tokenA] || 'Unknown';
      const symbolB = tokenSymbolMap[tokenB] || 'Unknown';

      return {
        tokenA,
        tokenB,
        symbolA,
        symbolB,
        reserveA: BigInt(0),
        reserveB: BigInt(0),
        totalLPSupply: BigInt(0),
        totalLiquidity: '0',
        volume24h: '0',
        feeTier: '0.3%',
        userLPBalance: lpBalance,
        userShare: Number(sharePercentage) / 100,
      };
    });

    setInitialPositions(positions);

    // If tokenA and tokenB from URL match a position, select it
    if (tokenAParam && tokenBParam) {
      const matchingPosition = positions.find(
        (p) => 
          (p.tokenA.toLowerCase() === tokenAParam.toLowerCase() && 
           p.tokenB.toLowerCase() === tokenBParam.toLowerCase()) ||
          (p.tokenA.toLowerCase() === tokenBParam.toLowerCase() && 
           p.tokenB.toLowerCase() === tokenAParam.toLowerCase())
      );
      
      if (matchingPosition) {
        setSelectedPosition(matchingPosition);
      }
    }
  }, [portfolioResult, address, tokensInfo, allTokens, tokenAParam, tokenBParam]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/liquidity')}
          className="mb-6 text-[var(--metallic-silver)] hover:text-[var(--neon-blue)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Pools
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-[var(--silver-light)] bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] bg-clip-text text-transparent">
            Manage Liquidity
          </h1>
          <p className="text-[var(--metallic-silver)]">
            Add or remove liquidity from your positions
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Liquidity Interface (Forms) */}
          <div>
            <LiquidityInterface
              initialPositions={initialPositions}
              selectedPosition={selectedPosition}
              onSelectPosition={setSelectedPosition}
              initialMode={modeParam || 'add'}
              onModeChange={setCurrentMode}
              preSelectedTokenA={tokenAParam}
              preSelectedTokenB={tokenBParam}
              addLiquidity={addLiquidity}
              removeLiquidity={removeLiquidity}
            />
          </div>

          {/* Right: Pool Details Panel - ✅ Now uses current tokens */}
          <div>
            <PoolDetailsPanel
              tokenA={currentTokenA}
              tokenB={currentTokenB}
            />
          </div>
        </div>
      </div>
    </div>
  );
};