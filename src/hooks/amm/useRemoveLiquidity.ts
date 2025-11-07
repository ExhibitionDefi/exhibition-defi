import { useState, useCallback, useMemo, useEffect } from 'react';
import { type Address, parseUnits, isAddress } from 'viem';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';
import { exhibitionAmmAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { publicClient } from '@/config/wagmi';
import type { Pool } from '@/components/liquidity/PoolList';

interface RemoveLiquidityState {
  tokenA?: Address;
  tokenB?: Address;
  lpAmount: string;
  slippage: number;
  deadline: number;
  isProcessing: boolean;
  currentStep: 'idle' | 'removing';
  txHash?: `0x${string}`;
  error?: string;
  transactionSuccess?: boolean;
}

interface LiquidityLockInfo {
  projectId: bigint;
  projectOwner: Address;
  unlockTime: bigint;
  lockedLPAmount: bigint;
  isActive: boolean;
}

const isValidAddress = (address: any): address is Address => {
  return typeof address === 'string' && address.length > 0 && isAddress(address);
};

export const useRemoveLiquidity = () => {
  const { address } = useAccount();

  const [state, setState] = useState<RemoveLiquidityState>({
    lpAmount: '',
    slippage: 0.5,
    deadline: 20,
    isProcessing: false,
    currentStep: 'idle',
  });

  const [selectedPosition, setSelectedPosition] = useState<Pool | null>(null);
  const [tokenAInfo, setTokenAInfo] = useState<{ address: Address; symbol: string; decimals: number } | undefined>();
  const [tokenBInfo, setTokenBInfo] = useState<{ address: Address; symbol: string; decimals: number } | undefined>();

  const { writeContract: writeAMM, reset: resetAMMWrite } = useWriteContract();

  // Update tokens when position is selected
  useEffect(() => {
    if (selectedPosition) {
      setState((prev) => ({
        ...prev,
        tokenA: selectedPosition.tokenA,
        tokenB: selectedPosition.tokenB,
      }));
    }
  }, [selectedPosition]);

  const tokensToQuery = useMemo(() => {
    return [state.tokenA, state.tokenB].filter((t): t is Address => isValidAddress(t));
  }, [state.tokenA, state.tokenB]);

  const shouldFetchData = useMemo(() => {
    return isValidAddress(state.tokenA) && isValidAddress(state.tokenB);
  }, [state.tokenA, state.tokenB]);

  // Fetch token info, pool data, and lock info
  const { data: ammData, refetch: refetchAMMData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getTokensInfo',
        args: tokensToQuery.length > 0 ? [tokensToQuery] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'doesPoolExist',
        args: shouldFetchData ? [state.tokenA!, state.tokenB!] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getLPBalance',
        args: shouldFetchData && address ? [state.tokenA!, state.tokenB!, address] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getWithdrawableLPAmount',
        args: shouldFetchData && address ? [state.tokenA!, state.tokenB!, address] : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'isLiquidityLocked',
        args: shouldFetchData && address ? [state.tokenA!, state.tokenB!, address] : undefined,
      },
      // NEW: Fetch lock info including unlock time
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getLiquidityLock',
        args: shouldFetchData && address ? [state.tokenA!, state.tokenB!, address] : undefined,
      },
    ],
    query: {
      enabled: shouldFetchData,
      refetchInterval: 30_000,
      staleTime: 15_000,
    },
  });

  const tokensInfoArray = ammData?.[0]?.result;
  const poolExists = ammData?.[1]?.result as boolean | undefined;
  const lpBalance = ammData?.[2]?.result as bigint | undefined;
  const withdrawableLP = ammData?.[3]?.result as bigint | undefined;
  const isLocked = ammData?.[4]?.result as boolean | undefined;
  const liquidityLockInfo = ammData?.[5]?.result as LiquidityLockInfo | undefined;

  // Parse token info
  useEffect(() => {
    if (!tokensInfoArray || !Array.isArray(tokensInfoArray) || tokensInfoArray.length !== 3) {
      setTokenAInfo(undefined);
      setTokenBInfo(undefined);
      return;
    }

    const [symbols, decimals] = tokensInfoArray as unknown as readonly [
      readonly string[],
      readonly bigint[],
    ];

    if (state.tokenA && symbols[0] && decimals[0] !== undefined) {
      setTokenAInfo({
        address: state.tokenA,
        symbol: symbols[0],
        decimals: Number(decimals[0]),
      });
    }

    if (state.tokenB && symbols[1] && decimals[1] !== undefined) {
      setTokenBInfo({
        address: state.tokenB,
        symbol: symbols[1],
        decimals: Number(decimals[1]),
      });
    }
  }, [tokensInfoArray, state.tokenA, state.tokenB]);

  // LP amount to remove
  const lpAmountToRemove = useMemo(() => {
    if (!state.lpAmount) return undefined;
    try {
      return parseUnits(state.lpAmount, 18);
    } catch {
      return undefined;
    }
  }, [state.lpAmount]);

  const shouldFetchRemoveQuote = useMemo(() => {
    return Boolean(lpAmountToRemove && shouldFetchData);
  }, [lpAmountToRemove, shouldFetchData]);

  // Get remove liquidity quote
  const { data: removeQuoteData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getRemoveLiquidityQuote',
        args: shouldFetchRemoveQuote ? [state.tokenA!, state.tokenB!, lpAmountToRemove!] : undefined,
      },
    ],
    query: {
      enabled: shouldFetchRemoveQuote,
    },
  });

  const removeQuote = removeQuoteData?.[0]?.result as [bigint, bigint] | undefined;

  const waitForTx = useCallback(async (hash: `0x${string}`) => {
    if (!hash) throw new Error('Invalid transaction hash');
    return publicClient.waitForTransactionReceipt({ hash });
  }, []);

  const updateState = useCallback((updates: Partial<RemoveLiquidityState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const executeRemoveLiquidity = useCallback(async () => {
    if (!address || !state.tokenA || !state.tokenB || !lpAmountToRemove || !removeQuote) {
      throw new Error('Missing required data for removing liquidity');
    }

    setState((prev) => ({
      ...prev,
      isProcessing: true,
      currentStep: 'removing',
      error: undefined,
      txHash: undefined,
      transactionSuccess: false,
    }));

    try {
      const [amountAMin, amountBMin] = removeQuote;
      const minAmountA = (amountAMin * BigInt(Math.floor((100 - state.slippage) * 100))) / BigInt(10000);
      const minAmountB = (amountBMin * BigInt(Math.floor((100 - state.slippage) * 100))) / BigInt(10000);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + state.deadline * 60);

      const txHash = await new Promise<`0x${string}`>((resolve, reject) => {
        writeAMM(
          {
            address: CONTRACT_ADDRESSES.AMM,
            abi: exhibitionAmmAbi,
            functionName: 'removeLiquidity',
            args: [state.tokenA as Address, state.tokenB as Address, lpAmountToRemove, minAmountA, minAmountB, address, deadline],
          },
          {
            onSuccess: (hash) => resolve(hash),
            onError: (error) => reject(error),
          }
        );
      });

      console.log('⏳ Waiting for remove liquidity confirmation...');

      const receipt = await waitForTx(txHash);
      if (receipt.status !== 'success') {
        throw new Error('Remove liquidity transaction failed');
      }

      console.log('✅ Liquidity removed successfully!');

      await refetchAMMData();

      setState((prev) => ({ 
        ...prev, 
        currentStep: 'idle', 
        txHash: receipt.transactionHash, 
        transactionSuccess: true 
      }));

      console.log('⏱️ Showing remove liquidity success for 10 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 10000));

      setState((prev) => ({ 
        ...prev, 
        lpAmount: '', 
        isProcessing: false, 
        txHash: undefined, 
        transactionSuccess: false 
      }));

      resetAMMWrite();
      return receipt.transactionHash;
    } catch (error) {
      console.error('❌ Remove liquidity failed:', error);
      setState((prev) => ({
        ...prev,
        currentStep: 'idle',
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Removing liquidity failed',
      }));
      throw error;
    }
  }, [address, state, lpAmountToRemove, removeQuote, writeAMM, waitForTx, refetchAMMData, resetAMMWrite]);

  const canRemoveLiquidity = useMemo(() => {
    if (!address || !state.tokenA || !state.tokenB) return false;
    if (!lpAmountToRemove || !lpBalance) return false;
    if (lpAmountToRemove > lpBalance) return false;
    if (withdrawableLP !== undefined && lpAmountToRemove > withdrawableLP) return false;
    return true;
  }, [address, state, lpAmountToRemove, lpBalance, withdrawableLP]);

  const buttonState = useMemo(() => {
    if (state.isProcessing) {
      return { text: 'Removing Liquidity...', disabled: true, loading: true };
    }
    return { 
      text: canRemoveLiquidity ? 'Remove Liquidity' : 'Enter LP amount', 
      disabled: !canRemoveLiquidity, 
      loading: false 
    };
  }, [state.isProcessing, canRemoveLiquidity]);

  return {
    state,
    poolExists,
    lpBalance,
    withdrawableLP,
    isLocked,
    liquidityLockInfo, // NEW: Expose lock info including unlockTime
    removeQuote,
    tokenAInfo,
    tokenBInfo,
    lpAmountToRemove,
    canRemoveLiquidity,
    buttonState,
    selectedPosition,
    setSelectedPosition,
    updateState,
    executeRemoveLiquidity,
    refetchAMMData,
  };
};