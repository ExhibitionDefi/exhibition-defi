import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAdminSettings } from '../hooks/admin/useAdminSettings';
import { useUpdatePlatformFee } from '../hooks/admin/useUpdatePlatformFee';
import { useUpdateFeeRecipient } from '../hooks/admin/useUpdateFeeRecipient';
import { useManageContributionTokens } from '../hooks/admin/useManageContributionTokens';
import { useFaucetSettings } from '../hooks/admin/useFaucetSettings';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Shield, AlertTriangle, Settings, Plus, Minus, Lock, Key, Database, Server, Droplets, Clock } from 'lucide-react';
import { EXHIBITION_ADDRESS } from '../config/contracts';
import { clsx } from 'clsx';
import type { Address } from 'viem';

interface AdminPageProps {
  containerClassName?: string;
  gridClassName?: string;
}

const AdminPage: React.FC<AdminPageProps> = ({ 
  containerClassName, 
  gridClassName 
}) => {
  const { address, isConnected } = useAccount();
  
  // Use refactored hooks
  const adminSettings = useAdminSettings();
  const updateFee = useUpdatePlatformFee();
  const updateRecipient = useUpdateFeeRecipient();
  const manageTokens = useManageContributionTokens();
  const faucetSettings = useFaucetSettings();

  // Form states
  const [feePercentage, setFeePercentage] = useState('');
  const [feeRecipient, setFeeRecipient] = useState('');
  const [newTokenAddress, setNewTokenAddress] = useState('');
  
  // Faucet form states
  const [exhFaucetAmount, setExhFaucetAmount] = useState('');
  const [usdtFaucetAmount, setUsdtFaucetAmount] = useState('');
  const [faucetCooldown, setFaucetCooldown] = useState('');

  // Enhanced loading state
  if (adminSettings.isLoading) {
    return (
      <div className={clsx('flex justify-center items-center min-h-screen', containerClassName)}>
        <Card className="max-w-md mx-auto text-center bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/40 p-8">
          <div className="relative">
            <Shield className="h-16 w-16 mx-auto mb-4 drop-shadow-[0_0_12px_var(--neon-blue)]" style={{ color: 'var(--neon-blue)' }} />
            <div className="absolute -inset-6 bg-gradient-to-r from-[var(--neon-blue)]/20 to-[var(--neon-orange)]/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--silver-light)' }}>
            Security Check
          </h3>
          <p style={{ color: 'var(--metallic-silver)' }}>
            Verifying admin credentials and permissions...
          </p>
          <div className="mt-4 w-full bg-[var(--charcoal)] rounded-full h-2">
            <div className="bg-gradient-to-r from-[var(--neon-blue)] to-[var(--neon-orange)] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </Card>
      </div>
    );
  }

  // Enhanced not connected state
  if (!isConnected) {
    return (
      <div className={clsx('flex justify-center items-center min-h-screen', containerClassName)}>
        <Card className="max-w-md mx-auto text-center bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-orange)]/40 p-8">
          <div className="relative">
            <Lock className="h-16 w-16 mx-auto mb-6 drop-shadow-[0_0_12px_var(--neon-orange)]" style={{ color: 'var(--neon-orange)' }} />
            <div className="absolute -inset-6 bg-gradient-to-r from-[var(--neon-orange)]/20 to-red-500/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--silver-light)' }}>
            Admin Access Required
          </h2>
          <p className="mb-6" style={{ color: 'var(--metallic-silver)' }}>
            Connect your wallet to access administrative functions and platform controls
          </p>
          <div className="bg-gradient-to-r from-[var(--neon-orange)]/10 to-red-500/10 p-4 rounded-lg border border-[var(--neon-orange)]/20">
            <w3m-button />
          </div>
        </Card>
      </div>
    );
  }

  // Enhanced access denied state
  if (address?.toLowerCase() !== adminSettings.owner?.toLowerCase()) {
    return (
      <div className={clsx('flex justify-center items-center min-h-screen', containerClassName)}>
        <Card className="max-w-md mx-auto text-center bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-red-500/40 p-8">
          <div className="relative">
            <AlertTriangle className="h-16 w-16 mx-auto mb-6 drop-shadow-[0_0_12px_#ef4444]" style={{ color: '#ef4444' }} />
            <div className="absolute -inset-6 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--silver-light)' }}>
            Access Denied
          </h2>
          <p className="mb-4" style={{ color: 'var(--metallic-silver)' }}>
            Only the contract owner can access this administrative panel.
          </p>
          <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <p className="text-sm text-red-400">
              Your address: <code className="bg-red-500/20 px-2 py-1 rounded text-xs">{address?.slice(0, 8)}...{address?.slice(-6)}</code>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Action handlers
  const handleUpdateFeePercentage = async () => {
    if (!feePercentage) return;
    try {
      const percentage = Math.floor(parseFloat(feePercentage) * 100);
      updateFee.updateFee(percentage);
      
      if (updateFee.isConfirmed) {
        setFeePercentage('');
        await adminSettings.refetch.feeSettings();
      }
    } catch (error) {
      console.error('Failed to update fee percentage:', error);
    }
  };

  const handleUpdateFeeRecipient = async () => {
    if (!feeRecipient) return;
    try {
      updateRecipient.updateRecipient(feeRecipient as Address);
      
      if (updateRecipient.isConfirmed) {
        setFeeRecipient('');
        await adminSettings.refetch.feeSettings();
      }
    } catch (error) {
      console.error('Failed to update fee recipient:', error);
    }
  };

  const handleAddToken = async () => {
    if (!newTokenAddress) return;
    try {
      manageTokens.add(newTokenAddress as Address);
      
      if (manageTokens.isAddConfirmed) {
        setNewTokenAddress('');
        await adminSettings.refetch.contributionTokens();
      }
    } catch (error) {
      console.error('Failed to add token:', error);
    }
  };

  const handleRemoveToken = async (tokenAddress: Address) => {
    try {
      manageTokens.remove(tokenAddress);
      
      if (manageTokens.isRemoveConfirmed) {
        await adminSettings.refetch.contributionTokens();
      }
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  };

  // Faucet handlers
  const handleUpdateEXHAmount = async () => {
    if (!exhFaucetAmount) return;
    try {
      faucetSettings.setEXHAmount(exhFaucetAmount);
      
      if (faucetSettings.isEXHAmountConfirmed) {
        setExhFaucetAmount('');
        await adminSettings.refetch.faucetSettings();
      }
    } catch (error) {
      console.error('Failed to update EXH faucet amount:', error);
    }
  };

  const handleUpdateUSDTAmount = async () => {
    if (!usdtFaucetAmount) return;
    try {
      faucetSettings.setUSDTAmount(usdtFaucetAmount);
      
      if (faucetSettings.isUSDTAmountConfirmed) {
        setUsdtFaucetAmount('');
        await adminSettings.refetch.faucetSettings();
      }
    } catch (error) {
      console.error('Failed to update USDT faucet amount:', error);
    }
  };

  const handleUpdateCooldown = async () => {
    if (!faucetCooldown) return;
    try {
      const seconds = parseInt(faucetCooldown);
      faucetSettings.setCooldown(seconds);
      
      if (faucetSettings.isCooldownConfirmed) {
        setFaucetCooldown('');
        await adminSettings.refetch.faucetSettings();
      }
    } catch (error) {
      console.error('Failed to update faucet cooldown:', error);
    }
  };

  const isActionPending = 
    updateFee.isLoading || 
    updateRecipient.isLoading || 
    manageTokens.isAddLoading || 
    manageTokens.isRemoveLoading ||
    faucetSettings.isEXHAmountLoading ||
    faucetSettings.isUSDTAmountLoading ||
    faucetSettings.isCooldownLoading;

  // Enhanced admin dashboard
  return (
    <div className={clsx('space-y-8 max-w-7xl mx-auto px-4', containerClassName)}>
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-[var(--charcoal)]/80 to-[var(--deep-black)]/80 p-6 rounded-xl border border-[var(--neon-blue)]/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Shield className="h-10 w-10 drop-shadow-[0_0_8px_var(--neon-blue)]" style={{ color: 'var(--neon-blue)' }} />
              <div className="absolute -inset-2 bg-[var(--neon-blue)]/20 rounded-full blur-sm"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--silver-light)' }}>
                Admin Control Panel
              </h1>
              <p style={{ color: 'var(--metallic-silver)' }}>
                Platform configuration and security management
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse drop-shadow-[0_0_4px_#22c55e]"></div>
            <span className="text-sm font-medium" style={{ color: 'var(--silver-light)' }}>
              System Online
            </span>
          </div>
        </div>
      </div>

      <div className={clsx('grid grid-cols-1 lg:grid-cols-2 gap-8', gridClassName)}>
        {/* Enhanced Platform Settings */}
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/40 transition-all duration-300 hover:border-[var(--neon-blue)]/60 hover:shadow-lg hover:shadow-[var(--neon-blue)]/20">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Settings 
                className="h-6 w-6 mr-3 drop-shadow-[0_0_6px_var(--neon-blue)]" 
                style={{ color: 'var(--neon-blue)' }}
              />
              <h3 className="text-xl font-semibold" style={{ color: 'var(--silver-light)' }}>
                Platform Settings
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--silver-light)' }}>
                  Platform Fee Percentage
                </label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={feePercentage}
                    onChange={(e) => setFeePercentage(e.target.value)}
                    placeholder={(adminSettings.feePercentage / 100).toString()}
                    className="flex-1 bg-[var(--charcoal)] border-[var(--metallic-silver)]/30 text-white focus:border-[var(--neon-blue)]/50"
                  />
                  <span className="text-sm px-3 py-2 bg-[var(--neon-blue)]/20 rounded-lg border border-[var(--neon-blue)]/30" style={{ color: 'var(--neon-blue)' }}>
                    %
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--metallic-silver)' }}>
                  Current: {(adminSettings.feePercentage / 100).toFixed(2)}%
                </p>
              </div>
              <Button 
                onClick={handleUpdateFeePercentage}
                disabled={!feePercentage || isActionPending}
                isLoading={updateFee.isLoading}
                className="w-full bg-gradient-to-r from-[var(--neon-blue)]/80 to-[var(--neon-blue)] hover:from-[var(--neon-blue)] hover:to-[var(--neon-blue)]/80 border-[var(--neon-blue)] shadow-lg shadow-[var(--neon-blue)]/30"
              >
                <Key className="h-4 w-4 mr-2" />
                Update Fee Percentage
              </Button>

              <div className="pt-4 border-t border-[var(--metallic-silver)]/20">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--silver-light)' }}>
                  Fee Recipient Address
                </label>
                <Input
                  type="text"
                  value={feeRecipient}
                  onChange={(e) => setFeeRecipient(e.target.value)}
                  placeholder={adminSettings.feeRecipient || '0x...'}
                  className="w-full bg-[var(--charcoal)] border-[var(--metallic-silver)]/30 text-white focus:border-[var(--neon-blue)]/50 font-mono text-sm mb-3"
                />
                <p className="text-xs mb-3" style={{ color: 'var(--metallic-silver)' }}>
                  Current: {adminSettings.feeRecipient ? `${adminSettings.feeRecipient.slice(0, 10)}...${adminSettings.feeRecipient.slice(-8)}` : 'Not set'}
                </p>
                <Button 
                  onClick={handleUpdateFeeRecipient}
                  disabled={!feeRecipient || isActionPending}
                  isLoading={updateRecipient.isLoading}
                  className="w-full bg-gradient-to-r from-[var(--neon-blue)]/80 to-[var(--neon-blue)] hover:from-[var(--neon-blue)] hover:to-[var(--neon-blue)]/80"
                >
                  Update Fee Recipient
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Faucet Settings */}
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-blue)]/40 transition-all duration-300 hover:border-[var(--neon-blue)]/60 hover:shadow-lg hover:shadow-[var(--neon-blue)]/20">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Droplets 
                className="h-6 w-6 mr-3 drop-shadow-[0_0_6px_var(--neon-blue)]" 
                style={{ color: 'var(--neon-blue)' }}
              />
              <h3 className="text-xl font-semibold" style={{ color: 'var(--silver-light)' }}>
                Faucet Settings
              </h3>
            </div>
            <div className="space-y-6">
              {/* EXH Amount */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--silver-light)' }}>
                  EXH Faucet Amount
                </label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={exhFaucetAmount}
                    onChange={(e) => setExhFaucetAmount(e.target.value)}
                    placeholder={adminSettings.faucetSettings?.exhAmount || '0'}
                    className="flex-1 bg-[var(--charcoal)] border-[var(--metallic-silver)]/30 text-white focus:border-[var(--neon-blue)]/50"
                  />
                  <span className="text-sm px-3 py-2 bg-[var(--neon-blue)]/20 rounded-lg border border-[var(--neon-blue)]/30" style={{ color: 'var(--neon-blue)' }}>
                    EXH
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--metallic-silver)' }}>
                  Current: {adminSettings.faucetSettings?.exhAmount || '0'} EXH
                </p>
                <Button 
                  onClick={handleUpdateEXHAmount}
                  disabled={!exhFaucetAmount || isActionPending}
                  isLoading={faucetSettings.isEXHAmountLoading}
                  className="w-full mt-3 bg-gradient-to-r from-[var(--neon-blue)]/80 to-[var(--neon-blue)] hover:from-[var(--neon-blue)] hover:to-[var(--neon-blue)]/80"
                >
                  Update EXH Amount
                </Button>
              </div>

              {/* USDT Amount */}
              <div className="pt-4 border-t border-[var(--metallic-silver)]/20">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--silver-light)' }}>
                  USDT Faucet Amount
                </label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={usdtFaucetAmount}
                    onChange={(e) => setUsdtFaucetAmount(e.target.value)}
                    placeholder={adminSettings.faucetSettings?.usdtAmount || '0'}
                    className="flex-1 bg-[var(--charcoal)] border-[var(--metallic-silver)]/30 text-white focus:border-[var(--neon-blue)]/50"
                  />
                  <span className="text-sm px-3 py-2 bg-[var(--neon-blue)]/20 rounded-lg border border-[var(--neon-blue)]/30" style={{ color: 'var(--neon-blue)' }}>
                    USDT
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--metallic-silver)' }}>
                  Current: {adminSettings.faucetSettings?.usdtAmount || '0'} USDT
                </p>
                <Button 
                  onClick={handleUpdateUSDTAmount}
                  disabled={!usdtFaucetAmount || isActionPending}
                  isLoading={faucetSettings.isUSDTAmountLoading}
                  className="w-full mt-3 bg-gradient-to-r from-[var(--neon-blue)]/80 to-[var(--neon-blue)] hover:from-[var(--neon-blue)] hover:to-[var(--neon-blue)]/80"
                >
                  Update USDT Amount
                </Button>
              </div>

              {/* Cooldown */}
              <div className="pt-4 border-t border-[var(--metallic-silver)]/20">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--silver-light)' }}>
                  Faucet Cooldown
                </label>
                <div className="flex items-center space-x-3">
                  <Input
                    type="number"
                    min="0"
                    value={faucetCooldown}
                    onChange={(e) => setFaucetCooldown(e.target.value)}
                    placeholder={adminSettings.faucetSettings?.cooldown?.toString() || '0'}
                    className="flex-1 bg-[var(--charcoal)] border-[var(--metallic-silver)]/30 text-white focus:border-[var(--neon-blue)]/50"
                  />
                  <span className="text-sm px-3 py-2 bg-[var(--neon-blue)]/20 rounded-lg border border-[var(--neon-blue)]/30 flex items-center" style={{ color: 'var(--neon-blue)' }}>
                    <Clock className="h-4 w-4 mr-1" />
                    sec
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--metallic-silver)' }}>
                  Current: {adminSettings.faucetSettings?.cooldown || '0'} seconds ({Math.floor((adminSettings.faucetSettings?.cooldown || 0) / 3600)}h {Math.floor(((adminSettings.faucetSettings?.cooldown || 0) % 3600) / 60)}m)
                </p>
                <Button 
                  onClick={handleUpdateCooldown}
                  disabled={!faucetCooldown || isActionPending}
                  isLoading={faucetSettings.isCooldownLoading}
                  className="w-full mt-3 bg-gradient-to-r from-[var(--neon-blue)]/80 to-[var(--neon-blue)] hover:from-[var(--neon-blue)] hover:to-[var(--neon-blue)]/80"
                >
                  Update Cooldown
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Contribution Tokens */}
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--metallic-silver)]/40 transition-all duration-300 hover:border-[var(--metallic-silver)]/60 hover:shadow-lg hover:shadow-[var(--metallic-silver)]/10">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Database 
                className="h-6 w-6 mr-3 drop-shadow-[0_0_6px_var(--metallic-silver)]" 
                style={{ color: 'var(--metallic-silver)' }}
              />
              <h3 className="text-xl font-semibold" style={{ color: 'var(--silver-light)' }}>
                Approved Tokens
              </h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--metallic-silver)]/30">
                {adminSettings.contributionTokens?.map((token, index) => (
                  <div 
                    key={token} 
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 rounded-lg border border-[var(--metallic-silver)]/20 transition-all duration-300 hover:border-[var(--neon-blue)]/40"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse drop-shadow-[0_0_3px_#22c55e]"></div>
                      <Badge 
                        variant="success" 
                        size="sm"
                        className="bg-green-500/20 text-green-400 border-green-500/30"
                      >
                        Active
                      </Badge>
                      <code className="font-mono text-sm bg-[var(--charcoal)]/60 px-3 py-1 rounded border border-[var(--metallic-silver)]/20" style={{ color: 'var(--silver-light)' }}>
                        {`${token.slice(0, 8)}...${token.slice(-6)}`}
                      </code>
                    </div>
                    <Button 
                      onClick={() => handleRemoveToken(token)}
                      disabled={isActionPending}
                      isLoading={manageTokens.isRemoveLoading}
                      variant="outline" 
                      size="sm" 
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all duration-300"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-3 pt-4 border-t border-[var(--metallic-silver)]/20">
                <Input
                  value={newTokenAddress}
                  onChange={(e) => setNewTokenAddress(e.target.value)}
                  placeholder="0x... token address"
                  className="flex-1 bg-[var(--charcoal)] border-[var(--metallic-silver)]/30 text-white focus:border-[var(--neon-blue)]/50 font-mono text-sm"
                />
                <Button 
                  onClick={handleAddToken}
                  disabled={!newTokenAddress || isActionPending}
                  isLoading={manageTokens.isAddLoading}
                  className="px-4 bg-gradient-to-r from-[var(--neon-blue)]/80 to-[var(--neon-blue)] hover:from-[var(--neon-blue)] hover:to-[var(--neon-blue)]/80 border-[var(--neon-blue)] shadow-lg shadow-[var(--neon-blue)]/20"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Contract Addresses */}
        <Card className="bg-gradient-to-br from-[var(--charcoal)] to-[var(--deep-black)] border border-[var(--neon-orange)]/40 transition-all duration-300 hover:border-[var(--neon-orange)]/60 hover:shadow-lg hover:shadow-[var(--neon-orange)]/20 lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <Server 
                className="h-6 w-6 mr-3 drop-shadow-[0_0_6px_var(--neon-orange)]" 
                style={{ color: 'var(--neon-orange)' }}
              />
              <h3 className="text-xl font-semibold" style={{ color: 'var(--silver-light)' }}>
                Contract Registry
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-r from-[var(--charcoal)]/60 to-[var(--deep-black)]/60 rounded-lg border border-[var(--metallic-silver)]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--silver-light)' }}>Exhibition Contract</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <code className="block bg-[var(--charcoal)]/80 px-3 py-2 rounded font-mono text-xs border border-[var(--metallic-silver)]/20 break-all" style={{ color: 'var(--metallic-silver)' }}>
                  {EXHIBITION_ADDRESS}
                </code>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;