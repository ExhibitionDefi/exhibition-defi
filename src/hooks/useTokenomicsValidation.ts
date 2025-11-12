// src/hooks/useTokenomicsValidation.ts
import { useMemo } from 'react'
import type { CreateProjectFormData } from '@/hooks/pad/useCreateProject'

/* -------------------- Types -------------------- */
export interface TokenomicsInput {
  fundingGoal: bigint
  softCap: bigint
  tokenPrice: bigint
  amountTokensForSale: bigint
  initialTotalSupply: bigint
  liquidityPercentage: bigint // e.g. 8000 = 80%
  contributionTokenDecimals: number
  projectTokenDecimals: number
}

export interface TokenomicsValidation {
  expectedTokensForSale: bigint
  liquidityTokens: bigint
  warnings: string[]
  hints: string[]
  valid: boolean
}

/* -------------------- Helpers -------------------- */
const normalizeTo18 = (amount: bigint, decimals: number): bigint => {
  if (decimals < 18) return amount * BigInt(10 ** (18 - decimals))
  if (decimals > 18) return amount / BigInt(10 ** (decimals - 18))
  return amount
}

const convertFrom18 = (amount: bigint, decimals: number): bigint => {
  if (decimals < 18) return amount / BigInt(10 ** (18 - decimals))
  if (decimals > 18) return amount * BigInt(10 ** (decimals - 18))
  return amount
}

/* -------------------- Core Validation -------------------- */
export function validateTokenomics(data: TokenomicsInput): TokenomicsValidation {
  const warnings: string[] = []
  const hints: string[] = []

  const fundingGoalNorm = normalizeTo18(data.fundingGoal, data.contributionTokenDecimals)

  // 1️⃣ Expected tokens for sale
  let expectedTokensForSale = 0n
  if (data.fundingGoal > 0n && data.tokenPrice > 0n) {
    expectedTokensForSale = convertFrom18(
      (fundingGoalNorm * 10n ** 18n) / data.tokenPrice,
      data.projectTokenDecimals
    )
    hints.push('💡 Suggestion: ' + expectedTokensForSale.toString() + ' tokens for sale')
  }

  // 2️⃣ Liquidity tokens needed
  let liquidityTokens = 0n
  if (data.fundingGoal > 0n && data.tokenPrice > 0n) {
    const liquidityContribution = (fundingGoalNorm * data.liquidityPercentage) / 10000n
    liquidityTokens = convertFrom18(
      (liquidityContribution * 10n ** 18n) / data.tokenPrice,
      data.projectTokenDecimals
    )
  }

  // 3️⃣ Tokens for sale mismatch
  if (expectedTokensForSale > 0n && data.amountTokensForSale > 0n) {
    const diff =
      data.amountTokensForSale > expectedTokensForSale
        ? data.amountTokensForSale - expectedTokensForSale
        : expectedTokensForSale - data.amountTokensForSale
    const tolerance = expectedTokensForSale / 1000n || 1n
    if (diff > tolerance)
      warnings.push('⚠️ Tokens for Sale mismatch with funding goal & price')
  }

  // 4️⃣ Total supply vs liquidity
  const totalNeeded = data.amountTokensForSale + liquidityTokens
  const minRequired = totalNeeded + totalNeeded / 100n
  if (data.initialTotalSupply > 0n && data.initialTotalSupply < minRequired) {
    warnings.push('⚠️ Total supply too low to cover sale + liquidity')
  }

  // 5️⃣ Soft cap validation
  if (data.softCap > 0n && data.fundingGoal > 0n) {
    const minSoft = (data.fundingGoal * 51n) / 100n
    if (data.softCap < minSoft)
      warnings.push('⚠️ Soft cap must be at least 51% of funding goal')
  }

  const valid = warnings.length === 0
  return { expectedTokensForSale, liquidityTokens, warnings, hints, valid }
}

/* -------------------- React Hook -------------------- */
export function useTokenomicsValidation(
  formData: CreateProjectFormData
): TokenomicsValidation | null {
  return useMemo(() => {
    // Only validate if we have the minimum required data
    if (!formData.fundingGoal || !formData.tokenPrice || !formData.amountTokensForSale) {
      return null
    }

    try {
      const input: TokenomicsInput = {
        fundingGoal: BigInt(
          Math.floor(parseFloat(formData.fundingGoal) * 10 ** formData.contributionTokenDecimals)
        ),
        softCap: BigInt(
          Math.floor(parseFloat(formData.softCap || '0') * 10 ** formData.contributionTokenDecimals)
        ),
        tokenPrice: BigInt(Math.floor(parseFloat(formData.tokenPrice) * 10 ** 18)),
        amountTokensForSale: BigInt(Math.floor(parseFloat(formData.amountTokensForSale) * 10 ** 18)),
        initialTotalSupply: BigInt(
          Math.floor(parseFloat(formData.initialTotalSupply || '0') * 10 ** 18)
        ),
        liquidityPercentage: BigInt(
          Math.floor(parseFloat(formData.liquidityPercentage || '0') * 100)
        ),
        contributionTokenDecimals: formData.contributionTokenDecimals,
        projectTokenDecimals: 18, // All project tokens use 18 decimals
      }

      return validateTokenomics(input)
    } catch (error) {
      console.error('Tokenomics validation error:', error)
      return null
    }
  }, [
    formData.fundingGoal,
    formData.softCap,
    formData.tokenPrice,
    formData.amountTokensForSale,
    formData.initialTotalSupply,
    formData.liquidityPercentage,
    formData.contributionTokenDecimals,
  ])
}