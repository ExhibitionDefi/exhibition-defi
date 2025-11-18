import React, { useState, useEffect } from 'react';
import { Plus, Minus, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AddLiquidityForm } from './AddLiquidityForm';
import { RemoveLiquidityForm } from './RemoveLiquidityForm';
import { useAddLiquidity } from '@/hooks/amm/useAddLiquidity';
import { useRemoveLiquidity } from '@/hooks/amm/useRemoveLiquidity';
import type { Pool } from './PoolList';
import type { Address } from 'viem';

interface LiquidityInterfaceProps {
  className?: string;
  initialPositions?: Pool[];
  selectedPosition?: Pool | null;
  onSelectPosition?: (position: Pool | null) => void;
  initialMode?: 'add' | 'remove';
  preSelectedTokenA?: Address | null;
  preSelectedTokenB?: Address | null;
  addLiquidity?: ReturnType<typeof useAddLiquidity>;
  removeLiquidity?: ReturnType<typeof useRemoveLiquidity>;
  onModeChange?: (mode: 'add' | 'remove') => void;
}

export const LiquidityInterface: React.FC<LiquidityInterfaceProps> = ({
  className = '',
  initialPositions = [],
  selectedPosition,
  onSelectPosition,
  initialMode = 'add',
  preSelectedTokenA,
  preSelectedTokenB,
  addLiquidity: addLiquidityProp,
  removeLiquidity: removeLiquidityProp,
  onModeChange,
}) => {
  const [mode, setMode] = useState<'add' | 'remove'>(initialMode);
  const [showSettings, setShowSettings] = useState(false);

  // ✅ Use passed hooks or create defaults
  const defaultAddLiquidity = useAddLiquidity(preSelectedTokenA, preSelectedTokenB);
  const addLiquidity = addLiquidityProp || defaultAddLiquidity;
  
  const defaultRemoveLiquidity = useRemoveLiquidity();
  const removeLiquidity = removeLiquidityProp || defaultRemoveLiquidity;

  // Get the current active hook based on mode
  const currentHook = mode === 'add' ? addLiquidity : removeLiquidity;

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // ✅ Handle mode change and notify parent
  const handleModeChange = (newMode: 'add' | 'remove') => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  return (
    <div className={`w-full max-w-[95vw] sm:max-w-lg md:max-w-md mx-auto px-2 sm:px-0 ${className}`}>
      {/* Main Liquidity Card */}
      <div className="bg-[var(--deep-black)] border border-[var(--charcoal)] rounded-2xl p-4 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--silver-light)]">Liquidity</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-[var(--metallic-silver)] hover:text-[var(--neon-blue)] p-2 h-auto border-0 bg-transparent hover:bg-[var(--charcoal)] transition-all duration-300"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Mode Switch */}
        <div className="flex space-x-1 bg-[var(--charcoal)] p-1.5 sm:p-2 rounded-lg border border-[var(--silver-dark)] border-opacity-30 mb-4 sm:mb-6">
          <Button
            variant={mode === 'add' ? 'default' : 'ghost'}
            onClick={() => handleModeChange('add')} // ✅ Use new handler
            disabled={currentHook.state.isProcessing}
            className={`flex-1 transition-all duration-300 text-sm sm:text-base py-2 sm:py-2.5 ${
              mode === 'add'
                ? 'bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-blue)] text-[var(--deep-black)] shadow-lg'
                : 'text-[var(--metallic-silver)] hover:text-[var(--neon-blue)] hover:bg-[var(--deep-black)]'
            }`}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Add Liquidity</span>
            <span className="xs:hidden">Add</span>
          </Button>
          <Button
            variant={mode === 'remove' ? 'default' : 'ghost'}
            onClick={() => handleModeChange('remove')} // ✅ Use new handler
            disabled={currentHook.state.isProcessing}
            className={`flex-1 transition-all duration-300 text-sm sm:text-base py-2 sm:py-2.5 ${
              mode === 'remove'
                ? 'bg-gradient-to-r from-[var(--neon-orange)] to-[var(--neon-orange)] text-[var(--deep-black)] shadow-lg'
                : 'text-[var(--metallic-silver)] hover:text-[var(--neon-orange)] hover:bg-[var(--deep-black)]'
            }`}
          >
            <Minus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Remove Liquidity</span>
            <span className="xs:hidden">Remove</span>
          </Button>
        </div>

        {/* Render Form Based on Mode */}
        {mode === 'add' ? (
          <AddLiquidityForm addLiquidity={addLiquidity} />
        ) : (
          <RemoveLiquidityForm
            positions={initialPositions}
            selectedPosition={selectedPosition || null}
            onSelectPosition={onSelectPosition || (() => {})}
          />
        )}
      </div>

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Liquidity Settings">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--silver-light)] mb-2 block">Slippage Tolerance</label>
            <div className="flex space-x-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => currentHook.updateState({ slippage: value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    currentHook.state.slippage === value
                      ? 'bg-[var(--neon-blue)] text-[var(--deep-black)]'
                      : 'bg-[var(--charcoal)] text-[var(--silver-light)] hover:bg-[var(--silver-dark)] hover:bg-opacity-20'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={currentHook.state.slippage}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 50) {
                    currentHook.updateState({ slippage: value });
                  }
                }}
                className="px-3 py-2 bg-[var(--charcoal)] border border-[var(--silver-dark)] border-opacity-30 rounded-lg text-[var(--silver-light)] text-sm w-20"
                placeholder="Custom"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--silver-light)] mb-2 block">Transaction Deadline</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="180"
                value={currentHook.state.deadline}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1 && value <= 180) {
                    currentHook.updateState({ deadline: value });
                  }
                }}
                className="px-3 py-2 bg-[var(--charcoal)] border border-[var(--silver-dark)] border-opacity-30 rounded-lg text-[var(--silver-light)] text-sm w-20"
              />
              <span className="text-sm text-[var(--metallic-silver)]">minutes</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};