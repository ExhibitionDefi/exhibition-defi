import { useState, useCallback, useMemo, useEffect } from 'react';
import { type Address, parseUnits, formatUnits, erc20Abi, isAddress } from 'viem';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';
import { exhibitionAmmAbi } from '@/generated/wagmi';
import { useTokenApproval } from '@/hooks/utilities/useTokenApproval';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { publicClient } from '@/config/wagmi';
import { logger } from '@/utils/logger';
import { useBlockchainTime } from '@/hooks/utilities/useBlockchainTime'; // ✅ Import the hook

interface AddLiquidityState {
  tokenA?: Address;
  tokenB?: Address;
  amountA: string;
  amountB: string;
  slippage: number;
  deadline: number;
  isProcessing: boolean;
  currentStep: 'idle' | 'approving-a' | 'approving-b' | 'adding';
  txHash?: `0x${string}`;
  approvalAHash?: `0x${string}`;
  approvalBHash?: `0x${string}`;
  error?: string;
  approvalASuccess?: boolean;
  approvalBSuccess?: boolean;
  transactionSuccess?: boolean;
}

const isValidAddress = (address: any): address is Address => {
  return typeof address === 'string' && address.length > 0 && isAddress(address);
};

export const useAddLiquidity = (initialTokenA?: Address | null, initialTokenB?: Address | null) => {
  const { address } = useAccount();
  
  // ✅ Get blockchain time
  const { timestampNumber: blockchainTime, isLoading: isLoadingTime } = useBlockchainTime({
    refetchInterval: 5000,
    enabled: true,
  });

  // Initialize with default tokens from environment variables
  const [state, setState] = useState<AddLiquidityState>(() => {
    const defaultTokenA = initialTokenA || import.meta.env.VITE_EXH_ADDRESS as Address;
    const defaultTokenB = initialTokenB || import.meta.env.VITE_EXUSD_ADDRESS as Address;
    
    return {
      tokenA: isValidAddress(defaultTokenA) ? defaultTokenA : undefined,
      tokenB: isValidAddress(defaultTokenB) ? defaultTokenB : undefined,
      amountA: '',
      amountB: '',
      slippage: 0.5,
      deadline: 20,
      isProcessing: false,
      currentStep: 'idle',
    };
  });

  const [amountABigInt, setAmountABigInt] = useState<bigint | undefined>();
  const [amountBBigInt, setAmountBBigInt] = useState<bigint | undefined>();
  const [tokenAInfo, setTokenAInfo] = useState<{ address: Address; symbol: string; decimals: number } | undefined>();
  const [tokenBInfo, setTokenBInfo] = useState<{ address: Address; symbol: string; decimals: number } | undefined>();

  const { writeContract: writeAMM, reset: resetAMMWrite } = useWriteContract();

  const tokensToQuery = useMemo(() => {
    return [state.tokenA, state.tokenB].filter((t): t is Address => isValidAddress(t));
  }, [state.tokenA, state.tokenB]);

  const shouldFetchData = useMemo(() => {
    return isValidAddress(state.tokenA) && isValidAddress(state.tokenB);
  }, [state.tokenA, state.tokenB]);

  // Fetch token info and pool data
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
        functionName: 'getReserves',
        args: shouldFetchData ? [state.tokenA!, state.tokenB!] : undefined,
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
  const reservesData = ammData?.[2]?.result as [bigint, bigint] | undefined;

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

  // Get user token balances
  const { data: tokenBalancesData, refetch: refetchBalances } = useReadContracts({
    contracts: [
      {
        address: state.tokenA,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      {
        address: state.tokenB,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: Boolean(address && shouldFetchData),
      refetchInterval: 15_000,
      staleTime: 10_000,
    },
  });

  const balanceA = tokenBalancesData?.[0]?.result
    ? {
        value: tokenBalancesData[0].result as bigint,
        decimals: tokenAInfo?.decimals ?? 18,
        symbol: tokenAInfo?.symbol ?? '',
        formatted: tokenAInfo
          ? formatUnits(tokenBalancesData[0].result as bigint, tokenAInfo.decimals)
          : '0',
      }
    : undefined;

  const balanceB = tokenBalancesData?.[1]?.result
    ? {
        value: tokenBalancesData[1].result as bigint,
        decimals: tokenBInfo?.decimals ?? 18,
        symbol: tokenBInfo?.symbol ?? '',
        formatted: tokenBInfo
          ? formatUnits(tokenBalancesData[1].result as bigint, tokenBInfo.decimals)
          : '0',
      }
    : undefined;

  // Parse amounts
  useEffect(() => {
    if (!state.amountA || !tokenAInfo) {
      setAmountABigInt(undefined);
      return;
    }
    try {
      setAmountABigInt(parseUnits(state.amountA, tokenAInfo.decimals));
    } catch {
      setAmountABigInt(undefined);
    }
  }, [state.amountA, tokenAInfo]);

  useEffect(() => {
    if (!state.amountB || !tokenBInfo) {
      setAmountBBigInt(undefined);
      return;
    }
    try {
      setAmountBBigInt(parseUnits(state.amountB, tokenBInfo.decimals));
    } catch {
      setAmountBBigInt(undefined);
    }
  }, [state.amountB, tokenBInfo]);

  // Calculate optimal Token B amount
  const calculatedAmountB = useMemo(() => {
    if (!amountABigInt || !reservesData || !poolExists || !tokenBInfo) return undefined;

    try {
      const [reserveA, reserveB] = reservesData;
      if (reserveA === BigInt(0) || reserveB === BigInt(0)) return undefined;
      return (amountABigInt * reserveB) / reserveA;
    } catch (error) {
      logger.error('Error calculating optimal amount B:', error);
      return undefined;
    }
  }, [amountABigInt, reservesData, poolExists, tokenBInfo]);

  // Auto-update Token B amount
  useEffect(() => {
    if (!tokenBInfo || !poolExists) return;

    if (!amountABigInt || !calculatedAmountB) {
      if (state.amountB !== '') {
        setState((prev) => ({ ...prev, amountB: '' }));
      }
      return;
    }

    try {
      const formattedAmount = formatUnits(calculatedAmountB, tokenBInfo.decimals);
      if (state.amountB !== formattedAmount) {
        setState((prev) => ({ ...prev, amountB: formattedAmount }));
      }
    } catch (err) {
      logger.error('Failed to format calculatedAmountB:', err);
    }
  }, [amountABigInt, calculatedAmountB, tokenBInfo, poolExists, state.amountB]);

  // Approvals
  const approvalA = useTokenApproval({
    tokenAddress: state.tokenA,
    spenderAddress: CONTRACT_ADDRESSES.AMM,
    requiredAmount: amountABigInt,
  });

  const approvalB = useTokenApproval({
    tokenAddress: state.tokenB,
    spenderAddress: CONTRACT_ADDRESSES.AMM,
    requiredAmount: calculatedAmountB || amountBBigInt,
  });

  const waitForTx = useCallback(async (hash: `0x${string}`) => {
    if (!hash) throw new Error('Invalid transaction hash');
    return publicClient.waitForTransactionReceipt({ hash });
  }, []);

  // Enhanced updateState with validation to prevent same token selection
  const updateState = useCallback((updates: Partial<AddLiquidityState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      
      // Validate that tokenA and tokenB are different
      if (updates.tokenA !== undefined && newState.tokenB) {
        const tokenALower = updates.tokenA.toLowerCase();
        const tokenBLower = newState.tokenB.toLowerCase();
        
        if (tokenALower === tokenBLower) {
          // Swap tokens if trying to select the same token
          logger.info('Same token detected, swapping tokens');
          return {
            ...prev,
            tokenA: updates.tokenA,
            tokenB: prev.tokenA,
            // Reset amounts when swapping
            amountA: prev.amountB || '',
            amountB: prev.amountA || '',
          };
        }
      }
      
      if (updates.tokenB !== undefined && newState.tokenA) {
        const tokenALower = newState.tokenA.toLowerCase();
        const tokenBLower = updates.tokenB.toLowerCase();
        
        if (tokenALower === tokenBLower) {
          // Swap tokens if trying to select the same token
          logger.info('Same token detected, swapping tokens');
          return {
            ...prev,
            tokenA: prev.tokenB,
            tokenB: updates.tokenB,
            // Reset amounts when swapping
            amountA: prev.amountB || '',
            amountB: prev.amountA || '',
          };
        }
      }
      
      return newState;
    });
  }, []);

  const executeAddLiquidity = useCallback(async () => {
    const finalAmountB = calculatedAmountB || amountBBigInt;

    if (!address || !state.tokenA || !state.tokenB || !amountABigInt || !finalAmountB) {
      throw new Error('Missing required data for adding liquidity');
    }

    // ✅ Check if blockchain time is loaded
    if (isLoadingTime || blockchainTime === 0) {
      throw new Error('Waiting for blockchain time...');
    }

    setState((prev) => ({
      ...prev,
      isProcessing: true,
      error: undefined,
      txHash: undefined,
      approvalAHash: undefined,
      approvalBHash: undefined,
      approvalASuccess: false,
      approvalBSuccess: false,
      transactionSuccess: false,
    }));

    try {
      // Token A Approval
      if (approvalA.needsApproval) {
        setState((prev) => ({ ...prev, currentStep: 'approving-a' }));
        const approvalAHash = await approvalA.submitApproval(amountABigInt);
        if (!approvalAHash) throw new Error('Failed to get approval A hash');

        const approvalAReceipt = await waitForTx(approvalAHash);
        if (approvalAReceipt.status !== 'success') {
          throw new Error('Token A approval transaction failed');
        }

        setState((prev) => ({ ...prev, approvalAHash, approvalASuccess: true }));
        await new Promise((resolve) => setTimeout(resolve, 100));
        setState((prev) => ({ ...prev, approvalAHash: undefined, approvalASuccess: false, isProcessing: false }));
        await new Promise((resolve) => setTimeout(resolve, 500));
        setState((prev) => ({ ...prev, isProcessing: true }));
      }

      // Token B Approval
      if (approvalB.needsApproval) {
        setState((prev) => ({ ...prev, currentStep: 'approving-b' }));
        const approvalBHash = await approvalB.submitApproval(finalAmountB);
        if (!approvalBHash) throw new Error('Failed to get approval B hash');

        const approvalBReceipt = await waitForTx(approvalBHash);
        if (approvalBReceipt.status !== 'success') {
          throw new Error('Token B approval transaction failed');
        }

        setState((prev) => ({ ...prev, approvalBHash, approvalBSuccess: true }));
        await new Promise((resolve) => setTimeout(resolve, 100));
        setState((prev) => ({ ...prev, approvalBHash: undefined, approvalBSuccess: false, isProcessing: false }));
        await new Promise((resolve) => setTimeout(resolve, 500));
        setState((prev) => ({ ...prev, isProcessing: true }));
      }

      // Add Liquidity
      setState((prev) => ({ ...prev, currentStep: 'adding' }));

      const minAmountA = (amountABigInt * BigInt(Math.floor((100 - state.slippage) * 100))) / BigInt(10000);
      const minAmountB = (finalAmountB * BigInt(Math.floor((100 - state.slippage) * 100))) / BigInt(10000);
      
      // ✅ Use blockchain time instead of Date.now()
      const deadline = BigInt(blockchainTime + state.deadline * 60);
      
      logger.info('💡 Using blockchain time for deadline:', {
        blockchainTime,
        deadlineMinutes: state.deadline,
        deadline: deadline.toString(),
      });

      const txHash = await new Promise<`0x${string}`>((resolve, reject) => {
        writeAMM(
          {
            address: CONTRACT_ADDRESSES.AMM,
            abi: exhibitionAmmAbi,
            functionName: 'addLiquidity',
            args: [state.tokenA as Address, state.tokenB as Address, amountABigInt, finalAmountB, minAmountA, minAmountB, address, deadline],
          },
          {
            onSuccess: (hash) => resolve(hash),
            onError: (error) => reject(error),
          }
        );
      });

      const receipt = await waitForTx(txHash);
      if (receipt.status !== 'success') {
        throw new Error('Add liquidity transaction failed');
      }

      await Promise.all([refetchBalances(), refetchAMMData()]);

      setState((prev) => ({ ...prev, currentStep: 'idle', txHash: receipt.transactionHash, transactionSuccess: true }));
      await new Promise((resolve) => setTimeout(resolve, 10000));

      setState((prev) => ({ ...prev, amountA: '', amountB: '', isProcessing: false, txHash: undefined, transactionSuccess: false }));
      resetAMMWrite();
      return receipt.transactionHash;
    } catch (error) {
      logger.error('❌ Add liquidity failed:', error);
      setState((prev) => ({
        ...prev,
        currentStep: 'idle',
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Adding liquidity failed',
      }));
      throw error;
    }
  }, [address, state, amountABigInt, calculatedAmountB, amountBBigInt, approvalA, approvalB, writeAMM, waitForTx, refetchBalances, refetchAMMData, resetAMMWrite, blockchainTime, isLoadingTime]);

  const canAddLiquidity = useMemo(() => {
    if (!address || !state.tokenA || !state.tokenB) return false;
    if (!state.amountA || !amountABigInt) return false;

    const finalAmountB = calculatedAmountB || amountBBigInt;
    if (!finalAmountB) return false;

    if (balanceA?.value !== undefined && amountABigInt > balanceA.value) return false;
    if (balanceB?.value !== undefined && finalAmountB > balanceB.value) return false;
    
    // ✅ Wait for blockchain time
    if (isLoadingTime || blockchainTime === 0) return false;
    
    return true;
  }, [address, state, amountABigInt, calculatedAmountB, amountBBigInt, balanceA, balanceB, isLoadingTime, blockchainTime]);

  const buttonState = useMemo(() => {
    // ✅ Show loading state while waiting for blockchain time
    if (isLoadingTime || blockchainTime === 0) {
      return { text: 'Loading blockchain time...', disabled: true, loading: true };
    }
    
    if (state.isProcessing) {
      switch (state.currentStep) {
        case 'approving-a':
          return { text: 'Approving Token A...', disabled: true, loading: true };
        case 'approving-b':
          return { text: 'Approving Token B...', disabled: true, loading: true };
        case 'adding':
          return { text: 'Adding Liquidity...', disabled: true, loading: true };
        default:
          return { text: 'Processing...', disabled: true, loading: true };
      }
    }

    if (approvalA.needsApproval || approvalB.needsApproval) {
      const tokensNeedingApproval: string[] = [];
      if (approvalA.needsApproval && tokenAInfo) tokensNeedingApproval.push(tokenAInfo.symbol);
      if (approvalB.needsApproval && tokenBInfo) tokensNeedingApproval.push(tokenBInfo.symbol);
      return { text: `Approve ${tokensNeedingApproval.join(' & ')} & Add Liquidity`, disabled: !canAddLiquidity, loading: false };
    }

    return { text: canAddLiquidity ? 'Add Liquidity' : 'Enter amounts', disabled: !canAddLiquidity, loading: false };
  }, [state, approvalA, approvalB, tokenAInfo, tokenBInfo, canAddLiquidity, isLoadingTime, blockchainTime]);

  return {
    state,
    poolExists,
    balanceA,
    balanceB,
    reserves: reservesData,
    calculatedAmountB,
    tokenAInfo,
    tokenBInfo,
    approvalA,
    approvalB,
    amountABigInt,
    amountBBigInt,
    canAddLiquidity,
    buttonState,
    blockchainTime, // ✅ Expose for debugging
    isLoadingTime, // ✅ Expose for debugging
    updateState,
    executeAddLiquidity,
    refetchBalances,
    refetchAMMData,
  };
};