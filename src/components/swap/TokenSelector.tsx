// src/components/amm/TokenSelector.tsx
import React, { useState, useMemo, useCallback } from 'react';
import type { Address } from 'viem';
import { useReadContract } from 'wagmi';
import { Search, AlertCircle, CheckCircle, X, Star, Plus } from 'lucide-react';
import { useTokenBalance } from '../../hooks/utilities/useTokenBalance';
import { exhibitionAmmAbi } from '../../generated/wagmi';
import { AMMFormatters } from '../../utils/ammFormatters';
import { SafeHtml, SafeImage } from '../SafeHtml';
import { sanitizeText, sanitizeAddress } from '../../utils/sanitization';
import { logger } from '@/utils/logger';

interface Token {
  address: Address;
  symbol: string;
  name: string;
  logoURI: string;
  decimals: number;
  isCustom?: boolean;
}

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken?: Address;
  onSelectToken: (token: Token) => void;
  customTokens?: Token[];
  onAddCustomToken?: (token: Token) => void;
  onRemoveCustomToken?: (tokenAddress: Address) => void;
  isOpen?: boolean;
  onClose?: () => void;
  contractAddress: Address;
}

// ✅ Helper function to validate EVM address with sanitization
const isValidAddress = (address: string): address is Address => {
  const sanitized = sanitizeAddress(address);
  return sanitized !== null && /^0x[a-fA-F0-9]{40}$/.test(sanitized);
};

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  selectedToken,
  onSelectToken,
  customTokens = [],
  onAddCustomToken,
  isOpen = false,
  onClose,
  contractAddress,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter] = useState('all');
  const [starredTokens, setStarredTokens] = useState<Set<Address>>(new Set());

  const allTokens = useMemo(() => [...tokens, ...customTokens], [tokens, customTokens]);

  // ✅ Sanitize search query input
  const handleSearchChange = useCallback((value: string) => {
    // Remove any potentially dangerous characters but allow alphanumeric and 0x prefix
    const cleaned = value.replace(/[<>'"]/g, '').slice(0, 100); // Limit length
    setSearchQuery(cleaned);
  }, []);

  // Detect if search query is a potential token address
  const isAddressQuery = searchQuery.startsWith('0x') && searchQuery.length >= 42;
  const isExistingToken = allTokens.some((t) => t.address.toLowerCase() === searchQuery.toLowerCase());

  // Use useReadContract for fetching token info when address is entered
  const { 
    data: tokenInfo, 
    isLoading: isTokenInfoLoading,
    error: tokenInfoError 
  } = useReadContract({
    address: contractAddress,
    abi: exhibitionAmmAbi,
    functionName: 'getTokensInfo',
    args: isAddressQuery && isValidAddress(searchQuery) && !isExistingToken
      ? [[searchQuery as Address]] 
      : undefined,
    query: {
      enabled: isAddressQuery && isValidAddress(searchQuery) && !isExistingToken,
      staleTime: 300000, // 5 minutes
    }
  });

  const filteredTokens = useMemo(() => {
    let filtered = allTokens;

    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();

      if (query.startsWith('0x')) {
        const exactMatch = filtered.find((t) => t.address.toLowerCase() === query);
        if (exactMatch) return [exactMatch];
        return filtered.filter((t) => t.address.toLowerCase().includes(query));
      }

      filtered = filtered.filter(
        (t) =>
          (t.symbol?.toLowerCase() || '').includes(query) ||
          (t.name?.toLowerCase() || '').includes(query)
      );
    }

    return filtered;
  }, [allTokens, searchQuery, activeFilter, starredTokens]);

  // ✅ Sanitize token data before adding
  const handleAddCustomToken = useCallback(async () => {
    if (!isValidAddress(searchQuery) || isExistingToken) {
      return;
    }

    try {
      // Check if we have token info from the query
      if (tokenInfo && Array.isArray(tokenInfo) && tokenInfo.length === 3) {
        const [symbols, decimals] = tokenInfo as [readonly string[], readonly number[], readonly bigint[]];
        
        if (Array.isArray(symbols) && Array.isArray(decimals) && symbols.length > 0) {
          // ✅ Sanitize all token data
          const sanitizedSymbol = sanitizeText(symbols[0]).slice(0, 20); // Limit symbol length
          const sanitizedDecimals = Math.min(Math.max(Number(decimals[0]), 0), 18); // Limit decimals 0-18
          
          if (!sanitizedSymbol) {
            logger.error('Invalid token symbol');
            return;
          }

          const newToken: Token = {
            address: searchQuery as Address,
            symbol: sanitizedSymbol,
            name: sanitizedSymbol, // Use symbol as name for safety
            decimals: sanitizedDecimals,
            logoURI: '/tokens/default.png',
            isCustom: true,
          };

          onAddCustomToken?.(newToken);
          onSelectToken(newToken);
          setSearchQuery('');
        }
      }
    } catch (error) {
      logger.error('Failed to add custom token:', error);
    }
  }, [searchQuery, tokenInfo, isExistingToken, onAddCustomToken, onSelectToken]);

  const toggleStarred = (tokenAddress: Address) => {
    setStarredTokens((prev) => {
      const next = new Set(prev);
      next.has(tokenAddress) ? next.delete(tokenAddress) : next.add(tokenAddress);
      return next;
    });
  };

  // Determine what to show based on search state
  const showAddTokenPrompt = isAddressQuery && isValidAddress(searchQuery) && !isExistingToken && tokenInfo && !tokenInfoError;
  const showTokenError = isAddressQuery && isValidAddress(searchQuery) && !isExistingToken && tokenInfoError;
  const showInvalidAddress = isAddressQuery && !isValidAddress(searchQuery);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.25s_ease-out]">
      <div className="bg-deep-black rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden border border-silver-dark shadow-2xl animate-[slideUp_0.25s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-silver-dark">
          <h3 className="text-xl font-semibold text-silver-light">Select Token</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-silver-dark hover:text-silver-light p-2 h-auto bg-transparent border-0 hover:bg-transparent transition-colors"
              aria-label="Close token selector"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="p-6 pb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-silver-dark pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, symbol or paste address (0x...)"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              maxLength={100} // ✅ Prevent DoS
              className={`w-full bg-charcoal text-silver-light placeholder-silver-dark rounded-xl pl-12 pr-4 py-3 border ${
                showTokenError || showInvalidAddress ? 'border-neon-orange' : 'border-silver-dark'
              } focus:border-neon-blue focus:outline-none transition-colors`}
            />
          </div>

          {/* Status Messages */}
          {showInvalidAddress && (
            <div className="flex items-center space-x-2 text-neon-orange text-sm mt-2 animate-[fadeIn_0.2s_ease-out]">
              <AlertCircle className="w-4 h-4" />
              <span>Invalid address format</span>
            </div>
          )}

          {showTokenError && (
            <div className="flex items-center space-x-2 text-neon-orange text-sm mt-2 animate-[fadeIn_0.2s_ease-out]">
              <AlertCircle className="w-4 h-4" />
              <span>Token not found at this address</span>
            </div>
          )}

          {isTokenInfoLoading && isAddressQuery && (
            <div className="flex items-center space-x-2 text-silver-dark text-sm mt-2 animate-[fadeIn_0.2s_ease-out]">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-silver-dark"></div>
              <span>Searching for token...</span>
            </div>
          )}

          {showAddTokenPrompt && (() => {
            const [symbols, decimals] = tokenInfo as [readonly string[], readonly number[], readonly bigint[]];
            const safeSymbol = sanitizeText(symbols[0]);
            
            return (
              <div className="mt-3 p-3 bg-charcoal rounded-lg border border-neon-blue/40 animate-[fadeIn_0.2s_ease-out]">
                <div className="flex items-start justify-between space-x-3">
                  <div className="flex items-start space-x-2 flex-1">
                    <CheckCircle className="w-5 h-5 text-neon-blue mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-silver-light font-medium">Token Found</div>
                      <SafeHtml 
                        content={`${safeSymbol} • ${Number(decimals[0])} decimals`}
                        as="div"
                        className="text-sm text-silver-dark mt-1"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddCustomToken}
                    className="flex items-center space-x-1 bg-neon-blue hover:bg-neon-orange text-deep-black px-3 py-1.5 rounded-lg font-medium transition-colors text-sm flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {isExistingToken && isAddressQuery && (
            <div className="flex items-center space-x-2 text-neon-blue text-sm mt-2 animate-[fadeIn_0.2s_ease-out]">
              <CheckCircle className="w-4 h-4" />
              <span>Token already in list</span>
            </div>
          )}
        </div>

        {/* Token List */}
        <div className="px-6 pb-6">
          <div className="text-sm text-silver-dark mb-4">
            {filteredTokens.length > 0 ? 'Tokens' : 'No tokens found'}
          </div>

          <div
            className="
              max-h-80 overflow-y-auto pr-1
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-[var(--silver-dark)]
              [&::-webkit-scrollbar-thumb:hover]:bg-[var(--neon-blue)]
            "
          >
            <div className="space-y-1">
              {filteredTokens.length > 0 ? (
                filteredTokens.map((token) => (
                  <TokenRow
                    key={token.address}
                    token={token}
                    isSelected={selectedToken === token.address}
                    isStarred={starredTokens.has(token.address)}
                    onSelect={() => onSelectToken(token)}
                    onToggleStar={() => toggleStarred(token.address)}
                  />
                ))
              ) : !showAddTokenPrompt && (
                <div className="text-center py-8 text-silver-dark animate-[fadeIn_0.3s_ease-out]">
                  {searchQuery ? 'No matching tokens' : 'Start typing to search'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TokenRowProps {
  token: Token;
  isSelected: boolean;
  isStarred: boolean;
  onSelect: () => void;
  onToggleStar: () => void;
}

const TokenRow: React.FC<TokenRowProps> = ({ token, isSelected, isStarred, onSelect, onToggleStar }) => {
  const { data: balance } = useTokenBalance(token.address);

  // ✅ Sanitize token display data
  const safeSymbol = useMemo(() => sanitizeText(token.symbol), [token.symbol]);
  const safeName = useMemo(() => sanitizeText(token.name), [token.name]);

  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-neon-blue/10 border border-neon-blue/40 scale-[1.01]'
          : 'hover:bg-charcoal border border-transparent hover:scale-[1.01]'
      }`}
    >
      <div className="flex items-center space-x-3 flex-1">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-silver-dark flex items-center justify-center overflow-hidden">
            {token.logoURI && token.logoURI !== '/tokens/default.png' ? (
              <SafeImage
                src={token.logoURI}
                alt={safeSymbol}
                className="w-full h-full object-cover"
                fallback={
                  <span className="text-deep-black text-sm font-bold">
                    {safeSymbol.slice(0, 2).toUpperCase()}
                  </span>
                }
              />
            ) : (
              <span className="text-deep-black text-sm font-bold">
                {safeSymbol.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          {token.isCustom && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-neon-blue rounded-full flex items-center justify-center">
              <CheckCircle className="w-3 h-3 text-deep-black" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <SafeHtml 
              content={safeSymbol}
              as="span"
              className="font-semibold text-silver-light"
            />
            {token.isCustom && <CheckCircle className="w-4 h-4 text-neon-blue" />}
          </div>
          <SafeHtml 
            content={safeName}
            as="div"
            className="text-sm text-silver-dark truncate"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="text-right">
          {balance !== undefined ? (
            <div className="font-medium text-silver-light">
              {AMMFormatters.formatTokenAmountPrecise(balance.value, token.decimals, 6)}
            </div>
          ) : (
            <div className="text-sm text-silver-dark">-</div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
          className={`p-1 rounded-full transition-colors ${
            isStarred
              ? 'text-neon-orange hover:text-neon-blue'
              : 'text-silver-dark hover:text-silver-light'
          }`}
          aria-label={isStarred ? 'Unstar token' : 'Star token'}
        >
          <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
};