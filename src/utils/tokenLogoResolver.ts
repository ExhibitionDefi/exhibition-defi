// src/utils/tokenLogoResolver.ts

import type { Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';

/**
 * Configuration for contribution token logos
 * These tokens are NOT deployed by ExhibitionFactory, so logos are stored on IPFS
 * Using Pinata Dedicated Gateway for fast, reliable access
 */
const CONTRIBUTION_TOKEN_LOGOS: Record<Address, string> = {
  // Replace these CIDs with your actual uploaded logo CIDs
  [CONTRACT_ADDRESSES.EXH]: 'https://aquamarine-decent-pig-446.mypinata.cloud/ipfs/bafkreiep6logftzuzreehr54zsg4hlnobe6arwydahnn5rocqnhz5smrp4',
  [CONTRACT_ADDRESSES.EXUSD]: 'https://aquamarine-decent-pig-446.mypinata.cloud/ipfs/bafybeifmtxeszcv6wmsttufiumjcxmkuhfhyqdkw2h2bt6uagcmbpxmty4',
  [CONTRACT_ADDRESSES.EXNEX]: 'https://aquamarine-decent-pig-446.mypinata.cloud/ipfs/bafkreiavoown5j5jiknod53zhkvjk76u2oilv7ttkrywjyp6dl7pymwliq',
};

/**
 * Storage for external token logos (added by pool owners)
 * This can be extended dynamically
 */
const EXTERNAL_TOKEN_LOGOS: Map<Address, string> = new Map();

/**
 * In-memory cache for resolved logos
 */
const logoCache: Map<Address, string> = new Map();

/**
 * Resolves token logo URL with fallback chain:
 * 1. Check cache
 * 2. Check contribution token mapping
 * 3. Check external token mapping
 * 4. Use on-chain logo (passed as parameter from ExhibitionFactory)
 * 5. Return empty string (component will show fallback)
 * 
 * @param tokenAddress - The token address
 * @param onChainLogoURI - Logo URI from ExhibitionFactory.getTokenLogoURI() (optional)
 * @returns Logo URL or empty string
 */
export function resolveTokenLogo(
  tokenAddress: Address,
  onChainLogoURI?: string
): string {
  // 1. Check cache first
  if (logoCache.has(tokenAddress)) {
    return logoCache.get(tokenAddress)!;
  }

  let logoUrl = '';

  // 2. Check if it's a contribution token
  if (tokenAddress in CONTRIBUTION_TOKEN_LOGOS) {
    logoUrl = CONTRIBUTION_TOKEN_LOGOS[tokenAddress];
  }
  // 3. Check external token mapping
  else if (EXTERNAL_TOKEN_LOGOS.has(tokenAddress)) {
    logoUrl = EXTERNAL_TOKEN_LOGOS.get(tokenAddress)!;
  }
  // 4. Use on-chain logo if available
  else if (onChainLogoURI && onChainLogoURI.trim() !== '') {
    logoUrl = onChainLogoURI;
  }

  // Cache the result
  if (logoUrl) {
    logoCache.set(tokenAddress, logoUrl);
  }

  return logoUrl;
}

/**
 * Batch resolve multiple token logos
 * Useful for components that display multiple tokens
 * 
 * @param tokens - Array of token addresses with optional on-chain logos
 * @returns Map of token addresses to logo URLs
 */
export function resolveTokenLogos(
  tokens: Array<{ address: Address; onChainLogoURI?: string }>
): Map<Address, string> {
  const results = new Map<Address, string>();

  for (const token of tokens) {
    const logoUrl = resolveTokenLogo(token.address, token.onChainLogoURI);
    if (logoUrl) {
      results.set(token.address, logoUrl);
    }
  }

  return results;
}

/**
 * Add an external token logo (for pool owners or admin)
 * This logo will be persisted in memory during the session
 * 
 * @param tokenAddress - The token address
 * @param logoUrl - Full HTTPS URL to the logo (IPFS gateway, CDN, etc.)
 */
export function addExternalTokenLogo(tokenAddress: Address, logoUrl: string): void {
  // Validate URL format
  if (!logoUrl.startsWith('http://') && !logoUrl.startsWith('https://')) {
    console.warn(`Invalid logo URL format for ${tokenAddress}: ${logoUrl}`);
    return;
  }

  EXTERNAL_TOKEN_LOGOS.set(tokenAddress, logoUrl);
  logoCache.set(tokenAddress, logoUrl); // Update cache
}

/**
 * Remove an external token logo
 * 
 * @param tokenAddress - The token address
 */
export function removeExternalTokenLogo(tokenAddress: Address): void {
  EXTERNAL_TOKEN_LOGOS.delete(tokenAddress);
  logoCache.delete(tokenAddress);
}

/**
 * Get all external token logos
 * Useful for admin panels or debugging
 * 
 * @returns Map of external token logos
 */
export function getExternalTokenLogos(): Map<Address, string> {
  return new Map(EXTERNAL_TOKEN_LOGOS);
}

/**
 * Clear the logo cache
 * Useful for forcing a refresh
 */
export function clearLogoCache(): void {
  logoCache.clear();
}

/**
 * Check if a token is a contribution token
 * 
 * @param tokenAddress - The token address
 * @returns True if it's a contribution token
 */
export function isContributionToken(tokenAddress: Address): boolean {
  return tokenAddress in CONTRIBUTION_TOKEN_LOGOS;
}

/**
 * Get contribution token addresses
 * 
 * @returns Array of contribution token addresses
 */
export function getContributionTokenAddresses(): Address[] {
  return Object.keys(CONTRIBUTION_TOKEN_LOGOS) as Address[];
}