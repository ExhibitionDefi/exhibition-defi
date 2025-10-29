// src/components/amm/SwapSettings.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { Zap, Info, AlertTriangle, Clock, Target } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { SafeHtml } from '../SafeHtml';
import { sanitizeNumber } from '@/utils/sanitization';

interface SwapSettingsProps {
  slippage: number;
  deadline: number;
  recommendedSlippage: number;
  onSlippageChange: (slippage: number) => void;
  onDeadlineChange: (deadline: number) => void;
}

export const SwapSettings: React.FC<SwapSettingsProps> = ({
  slippage,
  deadline,
  recommendedSlippage,
  onSlippageChange,
  onDeadlineChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSlippage, setCustomSlippage] = useState(slippage.toString());

  const predefinedSlippages = [0.1, 0.5, 1.0, 2.0];

  // Calculate slippage status
  const getSlippageStatus = useCallback((value: number) => {
    if (value < 0.1) return { type: 'error', message: 'Slippage too low - transaction may fail' };
    if (value < recommendedSlippage * 0.7) return { type: 'warning', message: 'Low slippage may cause failed transactions' };
    if (value > recommendedSlippage * 1.5) return { type: 'warning', message: 'High slippage may result in unfavorable trades' };
    if (value > 5) return { type: 'error', message: 'Extremely high slippage - not recommended' };
    return { type: 'success', message: 'Optimal slippage range' };
  }, [recommendedSlippage]);

  const slippageStatus = useMemo(() => getSlippageStatus(slippage), [slippage, getSlippageStatus]);
  const isRecommendedSlippage = Math.abs(slippage - recommendedSlippage) < 0.05;

  // ✅ Sanitize and validate slippage input
  const handleCustomSlippageChange = useCallback((value: string) => {
    // Remove any non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('') 
      : cleaned;
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setCustomSlippage(sanitized);

    // ✅ Validate with sanitizeNumber
    const validated = sanitizeNumber(sanitized, {
      min: 0.1,
      max: 50,
      decimals: 2
    });

    if (validated !== null) {
      onSlippageChange(validated);
    }
  }, [onSlippageChange]);

  // ✅ Sanitize and validate deadline input
  const handleDeadlineChange = useCallback((value: string) => {
    // Remove any non-numeric characters
    const cleaned = value.replace(/[^\d]/g, '');
    
    // ✅ Validate with sanitizeNumber
    const validated = sanitizeNumber(cleaned, {
      min: 1,
      max: 120,
      decimals: 0
    });

    if (validated !== null) {
      onDeadlineChange(validated);
    }
  }, [onDeadlineChange]);

  const handleUseRecommended = useCallback(() => {
    onSlippageChange(recommendedSlippage);
    setCustomSlippage(recommendedSlippage.toString());
  }, [recommendedSlippage, onSlippageChange]);

  // ✅ Safe number formatting
  const formatSlippage = useCallback((value: number) => {
    if (isNaN(value)) return '0.0';
    return value.toFixed(1);
  }, []);

  const formatPriceImpact = useCallback((value: number) => {
    if (isNaN(value)) return '0.0';
    return Math.max(0, value - 0.5).toFixed(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Smart Slippage Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-silver-light">
            Slippage Tolerance
          </label>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-neon-blue" />
            <span className="text-xs text-neon-blue">Smart Mode</span>
          </div>
        </div>

        {/* Recommended Slippage Banner */}
        {!isRecommendedSlippage && (
          <div className="mb-4 p-3 rounded-lg bg-neon-blue/10 border border-neon-blue/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-neon-blue" />
                <div>
                  <SafeHtml 
                    content={`Recommended: ${formatSlippage(recommendedSlippage)}%`}
                    as="span"
                    className="text-sm text-neon-blue font-medium"
                  />
                  <p className="text-xs text-silver-dark mt-1">
                    Based on current market conditions and price impact
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleUseRecommended}
                className="bg-neon-blue text-deep-black hover:bg-neon-blue/80 text-xs px-3 py-1"
              >
                Use
              </Button>
            </div>
          </div>
        )}

        {/* Current Slippage Display */}
        <div className="flex items-center justify-between mb-3 p-3 rounded-lg bg-charcoal border border-silver-dark">
          <div className="flex items-center space-x-2">
            <SafeHtml 
              content={`Current: ${formatSlippage(slippage)}%`}
              as="span"
              className="text-sm text-silver-light"
            />
            {isRecommendedSlippage && (
              <div className="flex items-center space-x-1 text-neon-blue">
                <Zap className="w-3 h-3" />
                <span className="text-xs">Optimal</span>
              </div>
            )}
          </div>
          <div className={`flex items-center space-x-1 text-xs ${
            slippageStatus.type === 'error' ? 'text-neon-orange' :
            slippageStatus.type === 'warning' ? 'text-yellow-400' :
            'text-neon-blue'
          }`}>
            {slippageStatus.type === 'error' && <AlertTriangle className="w-3 h-3" />}
            {slippageStatus.type === 'warning' && <Info className="w-3 h-3" />}
            <SafeHtml 
              content={slippageStatus.message}
              as="span"
            />
          </div>
        </div>
        
        {/* Quick Slippage Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {predefinedSlippages.map((preset) => (
            <Button
              key={preset}
              variant={Math.abs(slippage - preset) < 0.05 ? "default" : "outline"}
              size="sm"
              onClick={() => {
                onSlippageChange(preset);
                setCustomSlippage(preset.toString());
              }}
              className={`text-xs ${
                Math.abs(slippage - preset) < 0.05 
                  ? 'bg-neon-blue text-deep-black' 
                  : 'border-silver-dark text-silver-light hover:border-neon-blue'
              }`}
            >
              {preset}%
            </Button>
          ))}
        </div>

        {/* Recommended Slippage Button */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            variant={isRecommendedSlippage ? "default" : "outline"}
            size="sm"
            onClick={handleUseRecommended}
            className={`text-xs flex items-center justify-center space-x-1 ${
              isRecommendedSlippage 
                ? 'bg-neon-blue text-deep-black' 
                : 'border-neon-blue/50 text-neon-blue hover:border-neon-blue'
            }`}
          >
            <Zap className="w-3 h-3" />
            <SafeHtml 
              content={`Smart ${formatSlippage(recommendedSlippage)}%`}
              as="span"
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs border-silver-dark text-silver-light hover:border-neon-blue"
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </Button>
        </div>
        
        {/* Custom Slippage Input */}
        {showAdvanced && (
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              value={customSlippage}
              onChange={(e) => handleCustomSlippageChange(e.target.value)}
              maxLength={10} // ✅ Prevent DoS
              className="pr-8 bg-charcoal border-silver-dark text-silver-light"
              placeholder="Custom slippage"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-silver-dark text-sm pointer-events-none">
              %
            </span>
          </div>
        )}

        {/* Slippage Explanation */}
        <div className="mt-3 p-3 rounded-lg bg-deep-black border border-silver-dark">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-neon-blue mt-0.5 flex-shrink-0" />
            <div className="text-xs text-silver-dark space-y-1">
              <p><span className="text-silver-light">Smart Slippage:</span> Automatically adjusts based on:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <SafeHtml 
                    content={`Current price impact (${formatPriceImpact(recommendedSlippage)}% impact adjustment)`}
                    as="span"
                  />
                </li>
                <li>Pool liquidity depth</li>
                <li>Market volatility indicators</li>
              </ul>
              <p className="mt-2 text-silver-light">
                Recommended slippage helps balance between transaction success and price protection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Deadline */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-silver-light">
            Transaction Deadline
          </label>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-silver-dark" />
            <SafeHtml 
              content={`${deadline} minutes`}
              as="span"
              className="text-xs text-silver-dark"
            />
          </div>
        </div>
        
        {/* Quick Deadline Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[10, 20, 30, 60].map((preset) => (
            <Button
              key={preset}
              variant={deadline === preset ? "default" : "outline"}
              size="sm"
              onClick={() => onDeadlineChange(preset)}
              className={`text-xs ${
                deadline === preset 
                  ? 'bg-neon-blue text-deep-black' 
                  : 'border-silver-dark text-silver-light hover:border-neon-blue'
              }`}
            >
              {preset}m
            </Button>
          ))}
        </div>

        {/* Custom Deadline Input */}
        {showAdvanced && (
          <Input
            type="text"
            inputMode="numeric"
            value={deadline.toString()}
            onChange={(e) => handleDeadlineChange(e.target.value)}
            maxLength={3} // ✅ Prevent DoS (max 120)
            className="bg-charcoal border-silver-dark text-silver-light"
            placeholder="Custom deadline (minutes)"
          />
        )}
        
        {/* Deadline Warning */}
        {deadline < 10 && (
          <div className="mt-2 flex items-start space-x-2 p-2 rounded-lg bg-neon-orange/10 border border-neon-orange/30">
            <AlertTriangle className="w-4 h-4 text-neon-orange mt-0.5 flex-shrink-0" />
            <p className="text-xs text-neon-orange">
              Short deadline may cause transaction failures during network congestion
            </p>
          </div>
        )}
        
        <p className="text-xs text-silver-dark mt-2">
          Transaction will revert if not executed within this time
        </p>
      </div>

      {/* Advanced Settings Toggle */}
      {showAdvanced && (
        <div className="border-t border-silver-dark pt-4">
          <h3 className="text-sm font-medium text-silver-light mb-3">Advanced Options</h3>
          
          {/* Slippage Analysis */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-silver-dark">Base slippage:</span>
              <span className="text-silver-light">0.5%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-silver-dark">Price impact adjustment:</span>
              <SafeHtml 
                content={`+${formatPriceImpact(recommendedSlippage)}%`}
                as="span"
                className="text-neon-blue"
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-silver-dark">Your current setting:</span>
              <SafeHtml 
                content={`${formatSlippage(slippage)}%`}
                as="span"
                className={slippage === recommendedSlippage ? 'text-neon-blue' : 'text-silver-light'}
              />
            </div>
          </div>

          {/* Reset to Defaults */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onSlippageChange(0.5);
              onDeadlineChange(20);
              setCustomSlippage('0.5');
            }}
            className="w-full mt-3 text-xs border-silver-dark text-silver-light hover:border-neon-blue"
          >
            Reset to Defaults
          </Button>
        </div>
      )}
    </div>
  );
};