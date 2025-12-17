// src/hooks/launchpad/useProjectFormPricing.ts
import { useMemo } from 'react';
import { useLocalPricing } from '@/hooks/utilities/useLocalPricing';
import type { Address } from 'viem';
import type { CreateProjectFormData } from '@/hooks/launchpad/useCreateProject';

// ✅ Add 'export' keyword here
export interface ProjectFormPricingReturn {
  /**
   * Hard cap value in USD
   */
  hardCapUSD: string;
  
  /**
   * Soft cap value in USD
   */
  softCapUSD: string;
  
  /**
   * Token price in USD
   */
  tokenPriceUSD: string;
  
  /**
   * Total value of tokens for sale in USD
   */
  tokensForSaleValueUSD: string;
  
  /**
   * Min contribution in USD
   */
  minContributionUSD: string;
  
  /**
   * Max contribution in USD
   */
  maxContributionUSD: string;
  
  /**
   * Raw numeric values (for calculations)
   */
  values: {
    hardCap: number | null;
    softCap: number | null;
    tokenPrice: number | null;
    tokensForSaleValue: number | null;
    minContribution: number | null;
    maxContribution: number | null;
  };
  
  /**
   * Whether pricing data is ready
   */
  isReady: boolean;
  
  /**
   * Whether pricing data is loading
   */
  isLoading: boolean;
  
  /**
   * Price of contribution token in USD
   */
  contributionTokenPriceUSD: number | null;
}

/**
 * Hook for calculating USD values in project creation form
 * 
 * Integrates with useLocalPricing to convert token amounts to USD equivalents
 * Updates in real-time as user types
 * 
 * @param formData - Current form data from CreateProjectForm
 * @returns USD values and pricing state
 * 
 * @example
 * ```tsx
 * const pricing = useProjectFormPricing(formData);
 * 
 * if (!pricing.isReady) return <LoadingSpinner />;
 * 
 * <div>Hard Cap: {pricing.hardCapUSD}</div>
 * <div>Token Price: {pricing.tokenPriceUSD}</div>
 * ```
 */
export function useProjectFormPricing(
  formData: CreateProjectFormData
): ProjectFormPricingReturn {
  const { getTokenPrice, isReady, isLoading } = useLocalPricing();

  // Get contribution token price once
  const contributionTokenPrice = useMemo(() => {
    if (!isReady) return null;
    return getTokenPrice(formData.contributionTokenAddress as Address);
  }, [isReady, getTokenPrice, formData.contributionTokenAddress]);

  // Calculate USD values
  const calculations = useMemo(() => {
    // If pricing not ready or no contribution token price, return nulls
    if (!contributionTokenPrice) {
      return {
        hardCap: null,
        softCap: null,
        tokenPrice: null,
        tokensForSaleValue: null,
        minContribution: null,
        maxContribution: null,
      };
    }

    // Parse form values
    const hardCap = parseFloat(formData.fundingGoal) || 0;
    const softCap = parseFloat(formData.softCap) || 0;
    const tokenPrice = parseFloat(formData.tokenPrice) || 0;
    const tokensForSale = parseFloat(formData.amountTokensForSale) || 0;
    const minContribution = parseFloat(formData.minContribution) || 0;
    const maxContribution = parseFloat(formData.maxContribution) || 0;

    // Calculate USD equivalents
    return {
      hardCap: hardCap * contributionTokenPrice,
      softCap: softCap * contributionTokenPrice,
      tokenPrice: tokenPrice * contributionTokenPrice,
      tokensForSaleValue: tokensForSale * tokenPrice * contributionTokenPrice,
      minContribution: minContribution * contributionTokenPrice,
      maxContribution: maxContribution * contributionTokenPrice,
    };
  }, [
    contributionTokenPrice,
    formData.fundingGoal,
    formData.softCap,
    formData.tokenPrice,
    formData.amountTokensForSale,
    formData.minContribution,
    formData.maxContribution,
  ]);

  // Format USD values
  const formatUSD = (value: number | null): string => {
    if (value === null || value === 0) return 'N/A';

    // For very small values, show more decimals
    if (value < 0.01) {
      return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      })}`;
    }

    // For large values, use compact notation
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}M`;
    }

    if (value >= 1_000) {
      return `$${(value / 1_000).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}K`;
    }

    // Standard formatting for normal values
    return `$${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return {
    hardCapUSD: formatUSD(calculations.hardCap),
    softCapUSD: formatUSD(calculations.softCap),
    tokenPriceUSD: formatUSD(calculations.tokenPrice),
    tokensForSaleValueUSD: formatUSD(calculations.tokensForSaleValue),
    minContributionUSD: formatUSD(calculations.minContribution),
    maxContributionUSD: formatUSD(calculations.maxContribution),
    values: calculations,
    isReady,
    isLoading,
    contributionTokenPriceUSD: contributionTokenPrice,
  };
}