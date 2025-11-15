import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { exhibitionAbi } from '@/generated/wagmi';
import { EXHIBITION_ADDRESS } from '@/config/contracts';
import { parseUnits } from 'viem';
import { logger } from '@/utils/logger';

interface UseFaucetSettingsReturn {
  // Set EXH Amount
  setEXHAmount: (amount: string) => void;
  isEXHAmountLoading: boolean;
  isEXHAmountConfirming: boolean;
  isEXHAmountConfirmed: boolean;
  exhAmountHash: `0x${string}` | undefined;
  exhAmountError: Error | null;

  // Set USDT Amount
  setUSDTAmount: (amount: string) => void;
  isUSDTAmountLoading: boolean;
  isUSDTAmountConfirming: boolean;
  isUSDTAmountConfirmed: boolean;
  usdtAmountHash: `0x${string}` | undefined;
  usdtAmountError: Error | null;

  // Set Cooldown
  setCooldown: (seconds: number) => void;
  isCooldownLoading: boolean;
  isCooldownConfirming: boolean;
  isCooldownConfirmed: boolean;
  cooldownHash: `0x${string}` | undefined;
  cooldownError: Error | null;
}

export function useFaucetSettings(): UseFaucetSettingsReturn {
  // EXH Amount
  const {
    writeContract: writeEXHAmount,
    data: exhAmountHash,
    isPending: isEXHAmountPending,
    error: exhAmountWriteError,
  } = useWriteContract();

  const {
    isLoading: isEXHAmountConfirming,
    isSuccess: isEXHAmountConfirmed,
  } = useWaitForTransactionReceipt({
    hash: exhAmountHash,
  });

  // USDT Amount
  const {
    writeContract: writeUSDTAmount,
    data: usdtAmountHash,
    isPending: isUSDTAmountPending,
    error: usdtAmountWriteError,
  } = useWriteContract();

  const {
    isLoading: isUSDTAmountConfirming,
    isSuccess: isUSDTAmountConfirmed,
  } = useWaitForTransactionReceipt({
    hash: usdtAmountHash,
  });

  // Cooldown
  const {
    writeContract: writeCooldown,
    data: cooldownHash,
    isPending: isCooldownPending,
    error: cooldownWriteError,
  } = useWriteContract();

  const {
    isLoading: isCooldownConfirming,
    isSuccess: isCooldownConfirmed,
  } = useWaitForTransactionReceipt({
    hash: cooldownHash,
  });

  // Handler functions
  const setEXHAmount = (amount: string) => {
    try {
      const amountInWei = parseUnits(amount, 18);
      writeEXHAmount({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'setFaucetAmountEXH',
        args: [amountInWei],
      });
    } catch (error) {
      logger.error('Failed to set EXH amount:', error);
    }
  };

  const setUSDTAmount = (amount: string) => {
    try {
      const amountInWei = parseUnits(amount, 6); // USDT has 6 decimals
      writeUSDTAmount({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'setFaucetAmountUSDT',
        args: [amountInWei],
      });
    } catch (error) {
      logger.error('Failed to set USDT amount:', error);
    }
  };

  const setCooldown = (seconds: number) => {
    try {
      writeCooldown({
        address: EXHIBITION_ADDRESS,
        abi: exhibitionAbi,
        functionName: 'setFaucetCooldown',
        args: [BigInt(seconds)],
      });
    } catch (error) {
      logger.error('Failed to set cooldown:', error);
    }
  };

  return {
    // EXH Amount
    setEXHAmount,
    isEXHAmountLoading: isEXHAmountPending || isEXHAmountConfirming,
    isEXHAmountConfirming,
    isEXHAmountConfirmed,
    exhAmountHash,
    exhAmountError: exhAmountWriteError,

    // USDT Amount
    setUSDTAmount,
    isUSDTAmountLoading: isUSDTAmountPending || isUSDTAmountConfirming,
    isUSDTAmountConfirming,
    isUSDTAmountConfirmed,
    usdtAmountHash,
    usdtAmountError: usdtAmountWriteError,

    // Cooldown
    setCooldown,
    isCooldownLoading: isCooldownPending || isCooldownConfirming,
    isCooldownConfirming,
    isCooldownConfirmed,
    cooldownHash,
    cooldownError: cooldownWriteError,
  };
}