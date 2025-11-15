// src/hooks/useTokenApproval.ts
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAccount, useWaitForTransactionReceipt } from 'wagmi';
import type { Address } from 'viem';

// ✅ Correct imports (note lowercase “Erc20”)
import { useReadErc20, useWriteErc20 } from '@/generated/wagmi';
import { logger } from '@/utils/logger';

type UseTokenApprovalArgs = {
  tokenAddress?: Address;
  spenderAddress?: Address;
  requiredAmount?: bigint;
};

export const useTokenApproval = ({
  tokenAddress,
  spenderAddress,
  requiredAmount,
}: UseTokenApprovalArgs) => {
  const { address } = useAccount();
  const shouldFetchAllowance = !!address && !!tokenAddress && !!spenderAddress;

  // ✅ Read allowance from ERC20 contract
  const { data: allowance, refetch: refetchAllowance } = useReadErc20({
    address: tokenAddress,
    functionName: 'allowance',
    args: shouldFetchAllowance ? [address!, spenderAddress!] : undefined,
    query: {
      enabled: shouldFetchAllowance,
      staleTime: 30_000,
      refetchOnMount: 'always',
    },
  });

  // ✅ Write hook for approvals
  const {
    writeContractAsync: writeErc20,
    data: txHash,
    isPending: isSubmitting,
  } = useWriteErc20();

  // ✅ Whether token approval is required
  const needsApproval = useMemo(() => {
    if (!requiredAmount || requiredAmount === 0n) return false;
    if (allowance === undefined || allowance === null) return false;
    return requiredAmount > allowance;
  }, [requiredAmount, allowance]);

  // Debugging info
  useEffect(() => {
    logger.info('🔐 Token Approval State:', {
      tokenAddress,
      spenderAddress,
      requiredAmount: requiredAmount?.toString(),
      allowance: allowance?.toString(),
      needsApproval,
      shouldFetchAllowance,
    });
  }, [tokenAddress, spenderAddress, requiredAmount, allowance, needsApproval, shouldFetchAllowance]);

  // ✅ Wait for the transaction to confirm
  const { isLoading: isConfirming, isSuccess: isApproved } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  const pendingResolve = useRef<((hash?: `0x${string}`) => void) | null>(null);
  const pendingReject = useRef<((err: any) => void) | null>(null);

  useEffect(() => {
    if (isApproved && pendingResolve.current) {
      try {
        pendingResolve.current(txHash);
      } finally {
        pendingResolve.current = null;
        pendingReject.current = null;
        try {
          refetchAllowance();
        } catch {
          /* ignore */
        }
      }
    }
  }, [isApproved, txHash, refetchAllowance]);

  // ✅ Main approval function
  const submitApproval = useCallback(
    async (overrideAmount?: bigint): Promise<`0x${string}` | undefined> => {
      return new Promise(async (resolve, reject) => {
        const amountToApprove = overrideAmount ?? requiredAmount;

        if (!tokenAddress || !spenderAddress || !amountToApprove) {
          return reject(new Error('Missing parameters for approval'));
        }
        if (!address) {
          return reject(new Error('Wallet not connected'));
        }

        const currentAllowance = allowance ?? 0n;
        if (amountToApprove <= currentAllowance) {
          return resolve(txHash);
        }

        pendingResolve.current = resolve;
        pendingReject.current = reject;

        try {
          const hash = await writeErc20({
            address: tokenAddress,
            functionName: 'approve',
            args: [spenderAddress, amountToApprove],
          });
          resolve(hash);
        } catch (err) {
          pendingResolve.current = null;
          pendingReject.current = null;
          reject(err);
        }
      });
    },
    [tokenAddress, spenderAddress, requiredAmount, address, allowance, writeErc20, txHash],
  );

  // ✅ Add writeState for backward compatibility
  const writeState = useMemo(
    () => ({
      data: txHash,
      isPending: isSubmitting,
    }),
    [txHash, isSubmitting],
  );

  // ✅ Return values
  return {
    allowance,
    needsApproval,
    isSubmitting,
    isConfirming,
    isApproved,
    submitApproval,
    writeState, 
    refetchAllowance,
  };
};
