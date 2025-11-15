// src/hooks/amm/useSwapLogic.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useReadContracts, useWriteContract } from 'wagmi';
import { parseUnits, type Address, erc20Abi } from 'viem';
import { exhibitionAmmAbi } from '@/generated/wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { AMMFormatters } from '@/utils/ammFormatters';
import { useTokenApproval } from '@/hooks/useTokenApproval';
import { publicClient } from '@/config/wagmi';
import { logger } from '@/utils/logger';

interface SwapLogicProps {
  defaultTokenIn?: Address;
  defaultTokenOut?: Address;
}

export const useSwapLogic = ({ defaultTokenIn, defaultTokenOut }: SwapLogicProps = {}) => {
  const { address, isConnected } = useAccount();

  // Swap state
  const [tokenIn, setTokenIn] = useState<Address | undefined>();
  const [tokenOut, setTokenOut] = useState<Address | undefined>();
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);
  
  // Transaction state (matches useLiquidityPool pattern)
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'swapping'>('idle');
  const [approvalHash, setApprovalHash] = useState<`0x${string}` | undefined>();
  const [swapHash, setSwapHash] = useState<`0x${string}` | undefined>();
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Write contract for swap
  const { writeContract: writeSwap, reset: resetSwapWrite } = useWriteContract();

  // Get token information
  const tokensToQuery = useMemo(() => {
    return [tokenIn, tokenOut].filter((t): t is Address => !!t);
  }, [tokenIn, tokenOut]);

  // Calculate amountIn as bigint
  const [amountInBigInt, setAmountInBigInt] = useState<bigint>(BigInt(0));

  // ✅ SEPARATE: Static data fetching (token info, pool existence, balances)
  const {
    data: staticData,
    refetch: refetchSwapData,
  } = useReadContracts({
    contracts: [
      // getTokensInfo
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getTokensInfo',
        args: tokensToQuery.length > 0 ? [tokensToQuery] : undefined,
      },
      // doesPoolExist
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'doesPoolExist',
        args: tokenIn && tokenOut ? [tokenIn, tokenOut] : undefined,
      },
      // Token In balance
      {
        address: tokenIn,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      // Token Out balance
      {
        address: tokenOut,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: Boolean(tokenIn || tokenOut),
      refetchInterval: 15_000,
      staleTime: 10_000,
    },
  });

  // Extract static data
  const tokensInfo = staticData?.[0]?.result;
  const poolExists = staticData?.[1]?.result as boolean | undefined;
  const balanceInValue = staticData?.[2]?.result as bigint | undefined;
  const balanceOutValue = staticData?.[3]?.result as bigint | undefined;

  // ✅ SEPARATE: Dynamic quote fetching (only when amount changes)
  const {
    data: quoteData,
    isLoading: isLoadingQuote,
  } = useReadContracts({
    contracts: [
      // getAmountOut
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getAmountOut',
        args: amountInBigInt && tokenIn && tokenOut ? [amountInBigInt, tokenIn, tokenOut] : undefined,
      },
      // getSlippageImpact
      {
        address: CONTRACT_ADDRESSES.AMM,
        abi: exhibitionAmmAbi,
        functionName: 'getSlippageImpact',
        args: tokenIn && tokenOut && amountInBigInt ? [tokenIn, tokenOut, amountInBigInt] : undefined,
      },
    ],
    query: {
      // ✅ Only fetch when we have all required data AND pool exists
      enabled: Boolean(amountInBigInt && tokenIn && tokenOut && poolExists),
      refetchInterval: false, // Don't auto-refetch quotes
      staleTime: 5_000,
    },
  });

  // Extract quote data
  const amountOutResult = quoteData?.[0]?.result;
  const slippageImpactRaw = quoteData?.[1]?.result;

  // Parse token info map
  const tokenInfoMap = useMemo(() => {
    if (!tokensInfo || !Array.isArray(tokensInfo) || tokensInfo.length !== 3) return new Map();

    const [symbols, decimals] = tokensInfo as unknown as readonly [readonly string[], readonly bigint[], readonly bigint[]];
    const map = new Map();

    tokensToQuery.forEach((address, index) => {
      if (symbols[index] && decimals[index] !== undefined) {
        map.set(address, {
          address,
          symbol: symbols[index],
          decimals: Number(decimals[index]),
        });
      }
    });

    return map;
  }, [tokensInfo, tokensToQuery]);

  const tokenInInfo = tokenIn ? tokenInfoMap.get(tokenIn) : undefined;
  const tokenOutInfo = tokenOut ? tokenInfoMap.get(tokenOut) : undefined;

  // Update amountInBigInt when amountIn or tokenInInfo changes
  useEffect(() => {
    if (!amountIn || !tokenInInfo) {
      setAmountInBigInt(BigInt(0));
      return;
    }
    try {
      setAmountInBigInt(parseUnits(amountIn, tokenInInfo.decimals));
    } catch {
      setAmountInBigInt(BigInt(0));
    }
  }, [amountIn, tokenInInfo]);

  // Format balances
  const balanceIn = useMemo(() => {
    if (!balanceInValue || !tokenInInfo) return undefined;
    return {
      value: balanceInValue,
      decimals: tokenInInfo.decimals,
      symbol: tokenInInfo.symbol,
      formatted: AMMFormatters.formatTokenAmountSync(balanceInValue, tokenInInfo.decimals, 6),
    };
  }, [balanceInValue, tokenInInfo]);

  const balanceOut = useMemo(() => {
    if (!balanceOutValue || !tokenOutInfo) return undefined;
    return {
      value: balanceOutValue,
      decimals: tokenOutInfo.decimals,
      symbol: tokenOutInfo.symbol,
      formatted: AMMFormatters.formatTokenAmountSync(balanceOutValue, tokenOutInfo.decimals, 6),
    };
  }, [balanceOutValue, tokenOutInfo]);

  // Use token approval hook
  const approval = useTokenApproval({
    tokenAddress: tokenIn,
    spenderAddress: CONTRACT_ADDRESSES.AMM as Address,
    requiredAmount: amountInBigInt,
  });

  // Normalized slippage percent
  const slippageImpactPercent = useMemo(() => {
    if (slippageImpactRaw === undefined || slippageImpactRaw === null) return undefined;
    const raw = Array.isArray(slippageImpactRaw) ? slippageImpactRaw[0] : slippageImpactRaw;
    return Number(raw) / 100;
  }, [slippageImpactRaw]);

  // Normalize price impact
  const slippageImpact = slippageImpactRaw;
  const priceImpact = useMemo(() => {
    if (!slippageImpact) return 0;
    try {
      const raw =
        typeof slippageImpact === 'bigint'
          ? Number(slippageImpact) / 1e36
          : Number(slippageImpact) / 1e18;
      const percent = raw * 100;
      return isFinite(percent) ? percent : 0;
    } catch (err) {
      logger.error('Error parsing slippageImpact:', err);
      return 0;
    }
  }, [slippageImpact]);

  // Extract amount out value
  const amountOutValue = useMemo(() => {
    if (amountOutResult === undefined || amountOutResult === null) return undefined;
    return Array.isArray(amountOutResult)
      ? (amountOutResult[0] as bigint | undefined)
      : (amountOutResult as bigint);
  }, [amountOutResult]);

  // ✅ Format amount out (smooth, no flicker)
  const formattedAmountOut = useMemo(() => {
    if (isLoadingQuote && amountIn) return 'Calculating...';
    if (!amountOutValue || !tokenOutInfo) return '';
    return AMMFormatters.formatTokenAmountSync(amountOutValue, tokenOutInfo.decimals, 6);
  }, [amountOutValue, isLoadingQuote, amountIn, tokenOutInfo]);

  // Recommended slippage
  const recommendedSlippage = useMemo(() => {
    if (slippageImpactPercent === undefined) return 0.5;
    const impact = slippageImpactPercent;
    let recommended = 0.5;
    if (impact > 5) recommended += 1;
    else if (impact > 2) recommended += 0.5;
    else if (impact > 0.5) recommended += 0.2;
    return Math.min(recommended, 15);
  }, [slippageImpactPercent]);

  // Validation
  const validation = useMemo(() => {
    if (!address)
      return { canProceed: false, message: 'Connect wallet to swap', step: 'connect' as const };
    if (!tokenIn || !tokenOut)
      return { canProceed: false, message: 'Select tokens to swap', step: 'select' as const };
    if (tokenIn === tokenOut)
      return {
        canProceed: false,
        message: 'Select different tokens',
        step: 'select' as const,
      };
    if (!poolExists)
      return {
        canProceed: false,
        message: 'Pool does not exist for this pair',
        step: 'pool' as const,
      };
    if (!amountIn || parseFloat(amountIn) === 0)
      return { canProceed: false, message: 'Enter an amount', step: 'amount' as const };
    if (!tokenInInfo)
      return {
        canProceed: false,
        message: 'Loading token information...',
        step: 'loading' as const,
      };
    if (
      balanceIn?.value !== undefined &&
      amountInBigInt &&
      amountInBigInt > balanceIn.value
    )
      return { canProceed: false, message: 'Insufficient balance', step: 'balance' as const };
    if (!amountOutValue && !isLoadingQuote && amountIn)
      return {
        canProceed: false,
        message: 'Unable to calculate output amount',
        step: 'quote' as const,
      };
    if (priceImpact > 15)
      return {
        canProceed: false,
        message: 'Price impact too high (>15%)',
        step: 'impact' as const,
      };

    if (approval.needsApproval) {
      return {
        canProceed: true,
        message: `Approve ${tokenInInfo?.symbol ?? 'Token'} & Swap`,
        step: 'approve' as const,
        needsApproval: true,
      };
    }

    return {
      canProceed: true,
      message: 'Swap Tokens',
      step: 'swap' as const,
      needsApproval: false,
    };
  }, [
    address,
    tokenIn,
    tokenOut,
    poolExists,
    amountIn,
    tokenInInfo,
    balanceIn,
    amountInBigInt,
    amountOutValue,
    isLoadingQuote,
    priceImpact,
    approval.needsApproval,
  ]);

  // Wait for transaction helper
  const waitForTx = useCallback(
    async (hash: `0x${string}`) => {
      if (!hash) throw new Error('Invalid transaction hash');
      return publicClient.waitForTransactionReceipt({ hash });
    },
    []
  );

  // 🔥 Sequential Swap Flow (matches useLiquidityPool pattern)
  const executeSwap = useCallback(async () => {
    if (!address || !tokenIn || !tokenOut || !amountInBigInt || !amountOutValue) {
      throw new Error('Missing required data for swap');
    }

    setIsProcessing(true);
    setError(undefined);
    setApprovalHash(undefined);
    setSwapHash(undefined);
    setApprovalSuccess(false);
    setSwapSuccess(false);

    try {
      // Step 1: Approval (if needed)
      if (approval.needsApproval) {
        logger.info('🔐 Step 1: Approving token...');
        setCurrentStep('approving');

        const approvalTxHash = await approval.submitApproval(amountInBigInt);
        if (!approvalTxHash) throw new Error('Failed to get approval hash');

        logger.info('⏳ Waiting for approval confirmation...');
        const approvalReceipt = await waitForTx(approvalTxHash);

        if (approvalReceipt.status !== 'success') {
          throw new Error('Approval transaction failed');
        }

        logger.info('✅ Token approved successfully:', approvalTxHash);
        setApprovalHash(approvalTxHash);
        setApprovalSuccess(true);

        // ✅ Close approval modal immediately
        await new Promise(resolve => setTimeout(resolve, 100));
        setApprovalHash(undefined);
        setApprovalSuccess(false);
        setIsProcessing(false);

        await new Promise(resolve => setTimeout(resolve, 500));
        setIsProcessing(true);
      }

      // Step 2: Swap
      logger.info('💱 Step 2: Executing swap...');
      setCurrentStep('swapping');

      const minAmountOut =
        amountOutValue -
        (amountOutValue * BigInt(Math.floor(slippage * 100))) / BigInt(10000);
      const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + deadline * 60);

      const txHash = await new Promise<`0x${string}`>((resolve, reject) => {
        writeSwap(
          {
            address: CONTRACT_ADDRESSES.AMM,
            abi: exhibitionAmmAbi,
            functionName: 'swapTokenForToken',
            args: [tokenIn, tokenOut, amountInBigInt, minAmountOut, address, deadlineTimestamp],
          },
          {
            onSuccess: (hash) => resolve(hash),
            onError: (error) => reject(error),
          }
        );
      });

      logger.info('⏳ Waiting for swap confirmation...');
      const receipt = await waitForTx(txHash);

      if (receipt.status !== 'success') {
        throw new Error('Swap transaction failed');
      }

      logger.info('✅ Swap completed successfully!');
      await Promise.all([refetchSwapData()]);

      setCurrentStep('idle');
      setSwapHash(receipt.transactionHash);
      setSwapSuccess(true);

      // ✅ Show success for 10 seconds
      logger.info('⏱️ Showing swap success for 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Reset
      setAmountIn('');
      setIsProcessing(false);
      setSwapHash(undefined);
      setSwapSuccess(false);

      resetSwapWrite();
      return receipt.transactionHash;

    } catch (error) {
      logger.error('❌ Swap failed:', error);
      setCurrentStep('idle');
      setIsProcessing(false);
      setError(error instanceof Error ? error.message : 'Swap failed');
      throw error;
    }
  }, [
    address,
    tokenIn,
    tokenOut,
    amountInBigInt,
    amountOutValue,
    approval,
    slippage,
    deadline,
    writeSwap,
    waitForTx,
    refetchSwapData,
    resetSwapWrite,
  ]);

  // Default tokens on mount
  useEffect(() => {
    if (defaultTokenIn && !tokenIn) setTokenIn(defaultTokenIn);
    if (defaultTokenOut && !tokenOut) setTokenOut(defaultTokenOut);
  }, [defaultTokenIn, defaultTokenOut, tokenIn, tokenOut]);

  // Input handlers
  const handleAmountInChange = useCallback((value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) setAmountIn(value);
  }, []);

  const handleMaxBalance = useCallback(() => {
    if (balanceIn?.value && tokenInInfo) {
      const maxAmount = AMMFormatters.formatTokenAmountSync(
        balanceIn.value,
        tokenInInfo.decimals,
        tokenInInfo.decimals
      );
      setAmountIn(maxAmount);
    }
  }, [balanceIn, tokenInInfo]);

  const flipTokens = useCallback(() => {
    if (tokenIn && tokenOut) {
      setTokenIn(tokenOut);
      setTokenOut(tokenIn);
      setAmountIn('');
    }
  }, [tokenIn, tokenOut]);

  const handleUseRecommendedSlippage = useCallback(
    () => setSlippage(recommendedSlippage),
    [recommendedSlippage]
  );

  const priceImpactLevel = useMemo(() => {
    if (priceImpact <= 1) return 'low';
    if (priceImpact <= 5) return 'medium';
    return 'high';
  }, [priceImpact]);

  const shouldShowSlippageRecommendation = useMemo(
    () => Math.abs(slippage - recommendedSlippage) > 0.2 && recommendedSlippage > slippage,
    [slippage, recommendedSlippage]
  );

  const formatBalance = useCallback(
    (balance: bigint | undefined, tokenInfo: typeof tokenInInfo) => {
      if (!balance || !tokenInfo) return '';
      return AMMFormatters.formatTokenAmountSync(balance, tokenInfo.decimals, 6);
    },
    []
  );

  const formatSlippage = useCallback((slippage: number) => `${slippage.toFixed(1)}%`, []);

  // Button state
  const buttonState = useMemo(() => {
    if (isProcessing) {
      switch (currentStep) {
        case 'approving':
          return {
            text: approval.isSubmitting
              ? 'Submitting Approval...'
              : approval.isConfirming
              ? 'Confirming Approval...'
              : 'Approving...',
            disabled: true,
            loading: true,
          };
        case 'swapping':
          return { text: 'Swapping...', disabled: true, loading: true };
        default:
          return { text: 'Processing...', disabled: true, loading: true };
      }
    }

    if (isLoadingQuote && amountIn) {
      return { text: 'Calculating...', disabled: true, loading: false };
    }

    return {
      text: validation.message || 'Swap Tokens',
      disabled: !validation.canProceed,
      loading: false,
    };
  }, [
    isProcessing,
    currentStep,
    approval.isSubmitting,
    approval.isConfirming,
    isLoadingQuote,
    amountIn,
    validation,
  ]);

  return {
    // State
    tokenIn,
    tokenOut,
    amountIn,
    slippage,
    deadline,
    isProcessing,
    currentStep,
    approvalHash,
    swapHash,
    approvalSuccess,
    swapSuccess,
    error,

    // Approval states
    approval,

    // Computed
    tokenInInfo,
    tokenOutInfo,
    balanceIn,
    balanceOut,
    poolExists,
    amountOutValue,
    formattedAmountOut,
    slippageImpact,
    priceImpact,
    priceImpactLevel,
    recommendedSlippage,
    shouldShowSlippageRecommendation,
    isLoadingQuote,
    validation,
    isConnected,
    buttonState,

    // Actions
    setTokenIn,
    setTokenOut,
    setAmountIn: handleAmountInChange,
    setSlippage,
    setDeadline,
    handleMaxBalance,
    flipTokens,
    executeSwap,
    handleUseRecommendedSlippage,

    // Formatters
    formatBalance,
    formatSlippage,

    // Refetch
    refetchSwapData,
  };
};