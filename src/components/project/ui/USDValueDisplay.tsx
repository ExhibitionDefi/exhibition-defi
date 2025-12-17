// src/components/projects/ui/USDValueDisplay.tsx
import React from 'react';
import { DollarSign } from 'lucide-react';

interface USDValueDisplayProps {
  /**
   * The USD value to display (formatted string from hook)
   */
  value: string;
  
  /**
   * Label to show before the value
   */
  label?: string;
  
  /**
   * Whether pricing data is still loading
   */
  isLoading?: boolean;
  
  /**
   * Size variant
   * @default 'default'
   */
  size?: 'small' | 'default' | 'large';
  
  /**
   * Show as inline (horizontal) or stacked (vertical)
   * @default 'inline'
   */
  layout?: 'inline' | 'stacked';
  
  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * Component for displaying USD values in the project creation form
 * 
 * Shows loading state while pricing data is being fetched
 * Consistent styling across all USD displays
 * 
 * @example
 * ```tsx
 * <USDValueDisplay 
 *   value={pricing.hardCapUSD}
 *   label="≈"
 *   isLoading={pricing.isLoading}
 * />
 * ```
 */
export const USDValueDisplay: React.FC<USDValueDisplayProps> = ({
  value,
  label = '≈',
  isLoading = false,
  size = 'default',
  layout = 'inline',
  className = '',
}) => {
  // Size-based styling
  const sizeClasses = {
    small: 'text-xs',
    default: 'text-sm',
    large: 'text-base',
  };

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-4 h-4',
    large: 'w-5 h-5',
  };

  // Layout classes
  const layoutClasses = layout === 'inline' 
    ? 'flex items-center gap-2' 
    : 'flex flex-col gap-1';

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={`${layoutClasses} ${className}`}>
        {label && (
          <span className={`text-[var(--metallic-silver)] ${sizeClasses[size]}`}>
            {label}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <div className={`${iconSizes[size]} bg-[var(--silver-dark)]/20 rounded animate-pulse`} />
          <div className={`h-4 w-16 bg-[var(--silver-dark)]/20 rounded animate-pulse`} />
        </div>
      </div>
    );
  }

  // Not available state
  if (value === 'N/A') {
    return (
      <div className={`${layoutClasses} ${className}`}>
        {label && (
          <span className={`text-[var(--metallic-silver)] ${sizeClasses[size]}`}>
            {label}
          </span>
        )}
        <span className={`text-[var(--silver-dark)] ${sizeClasses[size]} font-mono`}>
          N/A
        </span>
      </div>
    );
  }

  // Normal display
  return (
    <div className={`${layoutClasses} ${className}`}>
      {label && (
        <span className={`text-[var(--metallic-silver)] ${sizeClasses[size]}`}>
          {label}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <DollarSign className={`${iconSizes[size]} text-[var(--neon-blue)]`} />
        <span className={`text-[var(--neon-blue)] font-semibold ${sizeClasses[size]} font-mono`}>
          {value.replace('$', '')}
        </span>
      </div>
    </div>
  );
};

/**
 * Compact inline variant - commonly used in input helpers
 */
export const USDValueInline: React.FC<Omit<USDValueDisplayProps, 'layout' | 'size'>> = (props) => (
  <USDValueDisplay {...props} layout="inline" size="small" />
);

/**
 * Stacked variant - commonly used in summary cards
 */
export const USDValueStacked: React.FC<Omit<USDValueDisplayProps, 'layout'>> = (props) => (
  <USDValueDisplay {...props} layout="stacked" />
);