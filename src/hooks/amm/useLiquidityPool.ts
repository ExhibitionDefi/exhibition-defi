import { useState, useCallback, useMemo, useEffect } from 'react';
import { type Address, parseUnits, formatUnits, erc20Abi, isAddress } from 'viem';
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { exhibitionAmmAbi } from '@/generated/wagmi';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { publicClient } from '@/config/wagmi';
import type { Pool } from '@/components/liquidity/PoolList';

export interface LiquidityState {
  tokenA?: Address;
  tokenB?: Address;
  amountA: string;
  amountB: string;
  slippage: number;
  deadline: number;
  isProcessing: boolean;
  currentStep: 'idle' | 'approving-a' | 'approving-b' | 'adding' | 'removing';
  mode: 'add' | 'remove';
  txHash?: `0x${string}`;
  approvalAHash?: `0x${string}`;
  approvalBHash?: `0x${string}`;
  error?: string;
  approvalASuccess?: boolean;
  approvalBSuccess?: boolean;
  transactionSuccess?: boolean;
}

// ✅ Helper function to validate address
const isValidAddress = (address: any): address is Address => {
  return typeof address === 'string' && address.length > 0 && isAddress(address);
};

export const useLiquidityPool = () => {
  const { address } = useAccount();

  const [liquidityState, setLiquidityState] = useState<LiquidityState>({
    amountA: '',
    amountB: '',
    slippage: 0.5,
    deadline: 20,
    isProcessing: false,
    currentStep: 'idle',
    mode: 'add',
  });

  const [positions, setPositions] = useState<Pool[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Pool | null>(null);

  // Update when a position is selected
  useEffect(() => {
    if (selectedPosition) {
      setLiquidityState((prev) => ({
        ...prev,
        tokenA: selectedPosition.tokenA,
        tokenB: selectedPosition.tokenB,
        mode: 'remove',
      }));
    } else {
      setLiquidityState((prev) => ({
        ...prev,
        tokenA: undefined,
        tokenB: undefined,
        mode: 'add',
      }));
    }
  }, [selectedPosition]);

  // Parsed amounts (for calculating approval requirements)
  const [amountABigInt, setAmountABigInt] = useState<bigint | undefined>();
  const [amountBBigInt, setAmountBBigInt] = useState<bigint | undefined>();
  const [tokenAInfo, setTokenAInfo] = useState<{ address: Address; symbol: string; decimals: number } | undefined>();
  const [tokenBInfo, setTokenBInfo] = useState<{ address: Address; symbol: string; decimals: number } | undefined>();

  // Write contract hooks
  const {
    writeContract: writeAMM,
    data: ammTxHash,
    reset: resetAMMWrite,
  } = useWriteContract();

  const { 
    isLoading: isAMMConfirming,
  } = useWaitForTransactionReceipt({
    hash: ammTxHash,
  });

  // ✅ FIXED: More defensive token validation
  const tokensToQuery = useMemo(() => {
    const tokens = [liquidityState.tokenA, liquidityState.tokenB]
      .filter((t): t is Address => isValidAddress(t));
    
    // Debug log for production
    if (tokens.length === 0 && (liquidityState.tokenA || liquidityState.tokenB)) {
      console.warn('⚠️ Invalid token addresses detected:', {
        tokenA: liquidityState.tokenA,
        tokenB: liquidityState.tokenB,
      });
    }
    
    return tokens;
  }, [liquidityState.tokenA, liquidityState.tokenB]);

  // ✅ FIXED: More defensive enabled check
  const shouldFetchAMMData = useMemo(() => {
    return isValidAddress(liquidityState.tokenA) && isValidAddress(liquidityState.tokenB);
  }, [liquidityState.tokenA, liquidityState.tokenB]);

  // Main data fetching - AMM reads
  const {
    data: ammData,
    refetch: refetchAMMData,
  } = useReadContracts({
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
        args: shouldFetchAMMData
          ? [liquidityState.tokenA!, liquidityState.tokenB!]
          : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getPool',
        args: shouldFetchAMMData
          ? [liquidityState.tokenA!, liquidityState.tokenB!]
          : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getReserves',
        args: shouldFetchAMMData
          ? [liquidityState.tokenA!, liquidityState.tokenB!]
          : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getLPBalance',
        args: shouldFetchAMMData && address
          ? [liquidityState.tokenA!, liquidityState.tokenB!, address]
          : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getWithdrawableLPAmount',
        args: shouldFetchAMMData && address
          ? [liquidityState.tokenA!, liquidityState.tokenB!, address]
          : undefined,
      },
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'isLiquidityLocked',
        args: shouldFetchAMMData && address
          ? [liquidityState.tokenA!, liquidityState.tokenB!, address]
          : undefined,
      },
    ],
    query: {
      enabled: shouldFetchAMMData,
      refetchInterval: 30_000,
      staleTime: 15_000,
    },
  });

  // Extract AMM data
  const tokensInfoArray = ammData?.[0]?.result;
  const poolExists = ammData?.[1]?.result as boolean | undefined;
  const poolData = ammData?.[2]?.result;
  const reservesData = ammData?.[3]?.result as [bigint, bigint] | undefined;
  const lpBalance = ammData?.[4]?.result as bigint | undefined;
  const withdrawableLP = ammData?.[5]?.result as bigint | undefined;
  const isLocked = ammData?.[6]?.result as boolean | undefined;

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

    if (liquidityState.tokenA && symbols[0] && decimals[0] !== undefined) {
      setTokenAInfo({
        address: liquidityState.tokenA,
        symbol: symbols[0],
        decimals: Number(decimals[0]),
      });
    }

    if (liquidityState.tokenB && symbols[1] && decimals[1] !== undefined) {
      setTokenBInfo({
        address: liquidityState.tokenB,
        symbol: symbols[1],
        decimals: Number(decimals[1]),
      });
    }
  }, [tokensInfoArray, liquidityState.tokenA, liquidityState.tokenB]);

  // ✅ FIXED: More defensive enabled check for balances
  const shouldFetchBalances = useMemo(() => {
    return Boolean(address && isValidAddress(liquidityState.tokenA) && isValidAddress(liquidityState.tokenB));
  }, [address, liquidityState.tokenA, liquidityState.tokenB]);

  // Get user token balances and allowances
  const {
    data: tokenBalancesData,
    refetch: refetchBalances,
  } = useReadContracts({
    contracts: [
      {
        address: liquidityState.tokenA,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      {
        address: liquidityState.tokenB,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      {
        address: liquidityState.tokenA,
        abi: erc20Abi,
        functionName: 'allowance',
        args: address ? [address, CONTRACT_ADDRESSES.AMM] : undefined,
      },
      {
        address: liquidityState.tokenB,
        abi: erc20Abi,
        functionName: 'allowance',
        args: address ? [address, CONTRACT_ADDRESSES.AMM] : undefined,
      },
    ],
    query: {
      enabled: shouldFetchBalances,
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

  // Parse amounts to BigInt
  useEffect(() => {
    if (!liquidityState.amountA || !tokenAInfo) {
      setAmountABigInt(undefined);
      return;
    }
    try {
      setAmountABigInt(parseUnits(liquidityState.amountA, tokenAInfo.decimals));
    } catch {
      setAmountABigInt(undefined);
    }
  }, [liquidityState.amountA, tokenAInfo]);

  useEffect(() => {
    if (!liquidityState.amountB || !tokenBInfo) {
      setAmountBBigInt(undefined);
      return;
    }
    try {
      setAmountBBigInt(parseUnits(liquidityState.amountB, tokenBInfo.decimals));
    } catch {
      setAmountBBigInt(undefined);
    }
  }, [liquidityState.amountB, tokenBInfo]);

  // Calculate optimal Token B amount
  const calculatedAmountB = useMemo(() => {
    if (!amountABigInt || !reservesData || !poolExists || !tokenBInfo) return undefined;

    try {
      const [reserveA, reserveB] = reservesData;

      if (reserveA === BigInt(0) || reserveB === BigInt(0)) return undefined;

      const optimalB = (amountABigInt * reserveB) / reserveA;

      console.log('📊 Off-chain calculation:', {
        amountA: amountABigInt.toString(),
        reserveA: reserveA.toString(),
        reserveB: reserveB.toString(),
        calculatedOptimalB: optimalB.toString(),
      });

      return optimalB;
    } catch (error) {
      console.error('Error calculating optimal amount B:', error);
      return undefined;
    }
  }, [amountABigInt, reservesData, poolExists, tokenBInfo]);

  // Auto-update Token B amount when user types Token A
  useEffect(() => {
    if (liquidityState.mode !== 'add') return;
    if (!tokenBInfo) return;
    if (!poolExists) return;

    if (!amountABigInt || !calculatedAmountB) {
      if (liquidityState.amountB !== '') {
        setLiquidityState((prev) => ({ ...prev, amountB: '' }));
      }
      return;
    }

    try {
      const formattedAmount = formatUnits(calculatedAmountB, tokenBInfo.decimals);

      if (liquidityState.amountB !== formattedAmount) {
        setLiquidityState((prev) => ({ ...prev, amountB: formattedAmount }));
      }
    } catch (err) {
      console.error('Failed to format calculatedAmountB:', err);
    }
  }, [amountABigInt, calculatedAmountB, tokenBInfo, poolExists, liquidityState.amountB, liquidityState.mode]);

  // Use token approval hooks
  const approvalA = useTokenApproval({
    tokenAddress: liquidityState.tokenA,
    spenderAddress: CONTRACT_ADDRESSES.AMM,
    requiredAmount: amountABigInt,
  });

  const approvalB = useTokenApproval({
    tokenAddress: liquidityState.tokenB,
    spenderAddress: CONTRACT_ADDRESSES.AMM,
    requiredAmount: calculatedAmountB || amountBBigInt,
  });

  // LP amount to remove
  const lpAmountToRemove = useMemo(() => {
    if (!liquidityState.amountA) return undefined;
    try {
      return parseUnits(liquidityState.amountA, 18);
    } catch {
      return undefined;
    }
  }, [liquidityState.amountA]);

  // ✅ FIXED: More defensive enabled check for remove quote
  const shouldFetchRemoveQuote = useMemo(() => {
    return Boolean(
      lpAmountToRemove && 
      isValidAddress(liquidityState.tokenA) && 
      isValidAddress(liquidityState.tokenB)
    );
  }, [lpAmountToRemove, liquidityState.tokenA, liquidityState.tokenB]);

  // Get remove liquidity quote
  const { data: removeQuoteData } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getRemoveLiquidityQuote',
        args: shouldFetchRemoveQuote
          ? [liquidityState.tokenA!, liquidityState.tokenB!, lpAmountToRemove!]
          : undefined,
      },
    ],
    query: {
      enabled: shouldFetchRemoveQuote,
    },
  });

  const removeQuote = removeQuoteData?.[0]?.result as [bigint, bigint] | undefined;

  const waitForTx = useCallback(
    async (hash: `0x${string}`) => {
      if (!hash) throw new Error('Invalid transaction hash');
      return publicClient.waitForTransactionReceipt({ hash });
    },
    []
  );

  // State updater
  const updateLiquidityState = useCallback((updates: Partial<LiquidityState>) => {
    setLiquidityState((prev) => ({ ...prev, ...updates }));
  }, []);

  // 🔥 FIXED: Sequential Add Liquidity Flow
  const executeAddLiquidity = useCallback(async () => {
    const finalAmountB = calculatedAmountB || amountBBigInt;

    if (
      !address ||
      !liquidityState.tokenA ||
      !liquidityState.tokenB ||
      !amountABigInt ||
      !finalAmountB
    ) {
      throw new Error('Missing required data for adding liquidity');
    }

    setLiquidityState((prev) => ({ 
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
   
      if (approvalA.needsApproval) {
        console.log('🔐 Step 1: Approving Token A...');
        setLiquidityState((prev) => ({ 
          ...prev, 
          currentStep: 'approving-a',
          approvalAHash: undefined,
          approvalASuccess: false,
        }));

        // Submit approval
        const approvalAHash = await approvalA.submitApproval(amountABigInt);
        if (!approvalAHash) throw new Error('Failed to get approval A hash');
      
        console.log('⏳ Waiting for Token A approval confirmation...');
      
        // Wait for confirmation
        const approvalAReceipt = await waitForTx(approvalAHash);
      
        if (approvalAReceipt.status !== 'success') {
          throw new Error('Token A approval transaction failed');
        }

        console.log('✅ Token A approved successfully:', approvalAHash);
      
        // ✅ Set success state with hash
        setLiquidityState((prev) => ({ 
          ...prev, 
          approvalAHash,
          approvalASuccess: true,
        }));

        // ✅ Close approval A modal IMMEDIATELY (no 10 sec wait)
        await new Promise(resolve => setTimeout(resolve, 100)); // Just a tiny delay to show success
      
        // Clear approval A modal state
        setLiquidityState((prev) => ({ 
          ...prev, 
          approvalAHash: undefined,
          approvalASuccess: false,
          isProcessing: false, // ✅ Close modal
        }));

        // Small pause before next step
        await new Promise(resolve => setTimeout(resolve, 500));
      
        // Re-open for next step
        setLiquidityState((prev) => ({ 
          ...prev, 
          isProcessing: true,
        }));
      }

      if (approvalB.needsApproval) {
        console.log('🔐 Step 2: Approving Token B...');
        setLiquidityState((prev) => ({ 
          ...prev, 
          currentStep: 'approving-b',
          approvalBHash: undefined,
          approvalBSuccess: false,
        }));

        // Submit approval
        const approvalBHash = await approvalB.submitApproval(finalAmountB);
        if (!approvalBHash) throw new Error('Failed to get approval B hash');
      
        console.log('⏳ Waiting for Token B approval confirmation...');
      
        // Wait for confirmation
        const approvalBReceipt = await waitForTx(approvalBHash);
      
        if (approvalBReceipt.status !== 'success') {
          throw new Error('Token B approval transaction failed');
        }

        console.log('✅ Token B approved successfully:', approvalBHash);
      
        // ✅ Set success state with hash
        setLiquidityState((prev) => ({ 
          ...prev, 
          approvalBHash,
          approvalBSuccess: true,
        }));

        // ✅ Close approval B modal IMMEDIATELY (no 10 sec wait)
        await new Promise(resolve => setTimeout(resolve, 100)); // Just a tiny delay to show success
      
        // Clear approval B modal state
        setLiquidityState((prev) => ({ 
          ...prev, 
          approvalBHash: undefined,
          approvalBSuccess: false,
          isProcessing: false, // ✅ Close modal
        }));

        // Small pause before next step
        await new Promise(resolve => setTimeout(resolve, 500));
      
        // Re-open for next step
        setLiquidityState((prev) => ({ 
          ...prev, 
          isProcessing: true,
        }));
      }

      console.log('💰 Step 3: Adding Liquidity...');
      setLiquidityState((prev) => ({ 
        ...prev, 
        currentStep: 'adding',
        txHash: undefined,
        transactionSuccess: false,
      }));

      const minAmountA =
        (amountABigInt * BigInt(Math.floor((100 - liquidityState.slippage) * 100))) /
        BigInt(10000);
      const minAmountB =
        (finalAmountB * BigInt(Math.floor((100 - liquidityState.slippage) * 100))) /
        BigInt(10000);
      const deadline = BigInt(
        Math.floor(Date.now() / 1000) + liquidityState.deadline * 60
      );

      console.log('💰 Adding liquidity with:', {
        amountA: amountABigInt.toString(),
        amountB: finalAmountB.toString(),
        minAmountA: minAmountA.toString(),
        minAmountB: minAmountB.toString(),
      });

      // Submit add liquidity transaction
      const txHash = await new Promise<`0x${string}`>((resolve, reject) => {
        writeAMM(
          {
            address: CONTRACT_ADDRESSES.AMM,
            abi: exhibitionAmmAbi,
            functionName: 'addLiquidity',
            args: [
              liquidityState.tokenA as Address,
              liquidityState.tokenB as Address,
              amountABigInt,
              finalAmountB,
              minAmountA,
              minAmountB,
              address,
              deadline,
            ],
          },
          {
            onSuccess: (hash) => resolve(hash),
            onError: (error) => reject(error),
          }
        );
      });

      console.log('⏳ Waiting for add liquidity confirmation...');

      // Wait for confirmation
      const receipt = await waitForTx(txHash);

      if (receipt.status !== 'success') {
        throw new Error('Add liquidity transaction failed');
      }

      console.log('✅ Liquidity added successfully!');
    
      // Refetch balances
      await Promise.all([refetchBalances(), refetchAMMData()]);
    
      // ✅ Set success state with hash
      setLiquidityState((prev) => ({
        ...prev,
        currentStep: 'idle',
        txHash: receipt.transactionHash,
        transactionSuccess: true,
      }));

      // ✅ ONLY THIS STEP WAITS 10 SECONDS
      console.log('⏱️ Showing add liquidity success for 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    
      // ✅ Close modal and reset
      setLiquidityState((prev) => ({
        ...prev,
        amountA: '',
        amountB: '',
        isProcessing: false,
        txHash: undefined,
        transactionSuccess: false,
      }));

      resetAMMWrite();
      return receipt.transactionHash;

    } catch (error) {
      console.error('❌ Add liquidity failed:', error);
      setLiquidityState((prev) => ({
        ...prev,
        currentStep: 'idle',
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Adding liquidity failed',
      }));
      throw error;
    }
  }, [
    address,
    liquidityState,
    amountABigInt,
    calculatedAmountB,
    amountBBigInt,
    approvalA,
    approvalB,
    writeAMM,
    waitForTx,
    refetchBalances,
    refetchAMMData,
    resetAMMWrite,
  ]);

  // 🔥 FIXED: Execute remove liquidity
  const executeRemoveLiquidity = useCallback(async () => {
    if (
      !address ||
      !liquidityState.tokenA ||
      !liquidityState.tokenB ||
      !lpAmountToRemove ||
      !removeQuote
    ) {
      throw new Error('Missing required data for removing liquidity');
    }

    setLiquidityState((prev) => ({
      ...prev,
      isProcessing: true,
      currentStep: 'removing',
      error: undefined,
      txHash: undefined,
      transactionSuccess: false,
    }));

    try {
      const [amountAMin, amountBMin] = removeQuote;
      const minAmountA =
        (amountAMin * BigInt(Math.floor((100 - liquidityState.slippage) * 100))) /
        BigInt(10000);
      const minAmountB =
        (amountBMin * BigInt(Math.floor((100 - liquidityState.slippage) * 100))) /
        BigInt(10000);
      const deadline = BigInt(
        Math.floor(Date.now() / 1000) + liquidityState.deadline * 60
      );

      const txHash = await new Promise<`0x${string}`>((resolve, reject) => {
        writeAMM(
          {
            address: CONTRACT_ADDRESSES.AMM,
            abi: exhibitionAmmAbi,
            functionName: 'removeLiquidity',
            args: [
              liquidityState.tokenA as Address,
              liquidityState.tokenB as Address,
              lpAmountToRemove,
              minAmountA,
              minAmountB,
              address,
              deadline,
            ],
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
    
      await Promise.all([refetchBalances(), refetchAMMData()]);
    
      setLiquidityState((prev) => ({
        ...prev,
        currentStep: 'idle',
        txHash: receipt.transactionHash,
        transactionSuccess: true, 
      }));

      console.log('⏱️ Showing remove liquidity success for 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    
      setLiquidityState((prev) => ({
        ...prev,
        amountA: '',
        amountB: '',
        isProcessing: false,
        txHash: undefined,
        transactionSuccess: false,
      }));

      resetAMMWrite();
      return receipt.transactionHash;

    } catch (error) {
      console.error('❌ Remove liquidity failed:', error);
      setLiquidityState((prev) => ({
        ...prev,
        currentStep: 'idle',
        isProcessing: false,
        error:
        error instanceof Error ? error.message : 'Removing liquidity failed',
      }));
      throw error;
    }
  }, [
    address,
    liquidityState,
    lpAmountToRemove,
    removeQuote,
    writeAMM,
    waitForTx,
    refetchBalances,
    refetchAMMData,
    resetAMMWrite,
  ]);

  // Validation
  const canAddLiquidity = useMemo(() => {
    if (!address || !liquidityState.tokenA || !liquidityState.tokenB) return false;
    if (!liquidityState.amountA || !amountABigInt) return false;

    const finalAmountB = calculatedAmountB || amountBBigInt;
    if (!finalAmountB) return false;

    if (balanceA?.value !== undefined && amountABigInt > balanceA.value) return false;
    if (balanceB?.value !== undefined && finalAmountB > balanceB.value) return false;
    return true;
  }, [
    address,
    liquidityState,
    amountABigInt,
    calculatedAmountB,
    amountBBigInt,
    balanceA,
    balanceB,
  ]);

  const canRemoveLiquidity = useMemo(() => {
    if (!address || !liquidityState.tokenA || !liquidityState.tokenB) return false;
    if (!lpAmountToRemove || !lpBalance) return false;

    if (lpAmountToRemove > lpBalance) return false;
    if (withdrawableLP !== undefined && lpAmountToRemove > withdrawableLP) return false;
    return true;
  }, [address, liquidityState, lpAmountToRemove, lpBalance, withdrawableLP]);

  // Button state
  const buttonState = useMemo(() => {
    if (liquidityState.isProcessing) {
      switch (liquidityState.currentStep) {
        case 'approving-a':
          return {
            text: approvalA.isSubmitting
              ? 'Submitting Token A Approval...'
              : approvalA.isConfirming
              ? 'Confirming Token A Approval...'
              : 'Approving Token A...',
            disabled: true,
            loading: true,
          };
        case 'approving-b':
          return {
            text: approvalB.isSubmitting
              ? 'Submitting Token B Approval...'
              : approvalB.isConfirming
              ? 'Confirming Token B Approval...'
              : 'Approving Token B...',
            disabled: true,
            loading: true,
          };
        case 'adding':
          return {
            text: isAMMConfirming ? 'Confirming Add Liquidity...' : 'Adding Liquidity...',
            disabled: true,
            loading: true,
          };
        case 'removing':
          return {
            text: isAMMConfirming ? 'Confirming Remove Liquidity...' : 'Removing Liquidity...',
            disabled: true,
            loading: true,
          };
        default:
          return { text: 'Processing...', disabled: true, loading: true };
      }
    }

    if (liquidityState.mode === 'add') {
      if (approvalA.needsApproval || approvalB.needsApproval) {
        const tokensNeedingApproval: string[] = [];
        if (approvalA.needsApproval && tokenAInfo) tokensNeedingApproval.push(tokenAInfo.symbol);
        if (approvalB.needsApproval && tokenBInfo) tokensNeedingApproval.push(tokenBInfo.symbol);

        return {
          text: `Approve ${tokensNeedingApproval.join(' & ')} & Add Liquidity`,
          disabled: !canAddLiquidity,
          loading: false,
        };
      }

      return {
        text: canAddLiquidity ? 'Add Liquidity' : 'Enter amounts',
        disabled: !canAddLiquidity,
        loading: false,
      };
    }

    if (liquidityState.mode === 'remove') {
      return {
        text: canRemoveLiquidity ? 'Remove Liquidity' : 'Enter LP amount',
        disabled: !canRemoveLiquidity,
        loading: false,
      };
    }

    return { text: 'Enter details', disabled: true, loading: false };
  }, [
    liquidityState.isProcessing,
    liquidityState.currentStep,
    liquidityState.mode,
    approvalA.isSubmitting,
    approvalA.isConfirming,
    approvalA.needsApproval,
    approvalB.isSubmitting,
    approvalB.isConfirming,
    approvalB.needsApproval,
    isAMMConfirming,
    tokenAInfo,
    tokenBInfo,
    canAddLiquidity,
    canRemoveLiquidity,
  ]);

  return {
    // State
    liquidityState,

    // Data
    poolExists,
    poolData,
    balanceA,
    balanceB,
    lpBalance,
    withdrawableLP,
    isLocked,
    reserves: reservesData,
    calculatedAmountB,
    removeQuote,
    tokenAInfo,
    tokenBInfo,

    // Approval states
    approvalA,
    approvalB,

    // Computed values
    amountABigInt,
    amountBBigInt,
    canAddLiquidity,
    canRemoveLiquidity,
    buttonState,

    // Actions
    updateLiquidityState,
    executeAddLiquidity,
    executeRemoveLiquidity,
    waitForTx,
    refetchBalances,
    refetchAMMData,

    // Position management
    positions,
    setPositions,
    selectedPosition,
    setSelectedPosition,
  };
};