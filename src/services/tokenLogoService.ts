// src/services/tokenLogoService.ts
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'

const CONTRIBUTION_TOKEN_LOGOS: Record<string, string> = {
  'exNEX': `${IPFS_GATEWAY}bafkreibyj5u47zea6vos2dattsp3zhhpxrjj4wvhzfil7thsf4ojf5cl5a`,
  'exUSD': `${IPFS_GATEWAY}bafybeib7jslogru5e6v53fyxr3zcad4rdwmowxi652j4kckwwevou64gqq`,
  'EXH': `${IPFS_GATEWAY}bafkreigeg3fupmq2477zhe4z5gr36jw623ttpofel6oe7iiw7u2wby5mhe`,
}

/**
 * Get token logo - prioritizes contribution token IPFS logos,
 * falls back to on-chain logo URI for project tokens
 */
export function getTokenLogo(symbol: string, onChainLogoURI?: string): string {
  // First check if it's one of our contribution tokens
  if (CONTRIBUTION_TOKEN_LOGOS[symbol]) {
    return CONTRIBUTION_TOKEN_LOGOS[symbol]
  }
  
  // Otherwise use the on-chain logo URI (for project tokens)
  if (onChainLogoURI) {
    return onChainLogoURI
  }
  
  // Fallback to placeholder
  return '/images/token-placeholder.png'
}