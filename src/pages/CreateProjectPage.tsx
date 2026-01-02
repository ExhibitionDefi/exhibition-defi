// src/pages/CreateProjectPage.tsx
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { CreateProjectForm } from '@/components/project/CreateProjectForm'
import { MultiTransactionModal } from '@/components/common/MultiTransactionModal'
import { useCreateProject } from '@/hooks/launchpad/useCreateProject'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Rocket, ArrowLeft, CheckCircle2, Wallet, ArrowRight } from 'lucide-react'
import { logger } from '@/utils/logger'

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate()
  const { isConnected } = useAccount()

  const {
    createProject,
    isCreating,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txHash,
    projectId,
    projectTokenAddress,
    modalState,
    reset,
  } = useCreateProject()

  const [formKey, setFormKey] = React.useState(0)

  useEffect(() => {
    if (isSuccess && projectId !== null && projectId !== undefined) {
      logger.info('🎯 Backup redirect timer started for project:', projectId)
      
      const projectIdStr = projectId.toString()
      
      const timer = setTimeout(() => {
        const route = `/projects/${projectIdStr}`
        logger.info('📍 Auto-navigating to:', route)
        navigate(route)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isSuccess, projectId, navigate])

  useEffect(() => {
    if (isSuccess) {
      setFormKey(prev => prev + 1)
    }
  }, [isSuccess])

  const handleModalClose = () => {
    const savedProjectId = projectId
    
    modalState.hide()
    
    if (isSuccess && savedProjectId !== null && savedProjectId !== undefined) {
      const projectIdStr = savedProjectId.toString()
      const route = `/projects/${projectIdStr}`
      logger.info('🔗 Redirecting on modal close to:', route)
      navigate(route)
    }
    
    if (error) {
      reset()
      setFormKey(prev => prev + 1)
    }
  }

  const handleViewProject = () => {
    if (projectId !== null && projectId !== undefined) {
      const projectIdStr = projectId.toString()
      const route = `/projects/${projectIdStr}`
      logger.info('🔗 Manual navigation to:', route)
      navigate(route)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[var(--deep-black)] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="text-center p-8">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[var(--neon-orange)]/10 border-2 border-[var(--neon-orange)]/30 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-[var(--neon-orange)]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[var(--silver-light)] mb-3">
              Wallet Not Connected
            </h2>
            <p className="text-sm text-[var(--metallic-silver)] mb-6 leading-relaxed">
              Please connect your wallet to access the project creation platform and launch your project on Exhibition.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              variant="primary"
              className="w-full py-2.5 font-semibold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--deep-black)]">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-b from-[var(--charcoal)] to-[var(--deep-black)] border-b border-[var(--silver-dark)]/20">
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[var(--metallic-silver)] mb-4">
              <button 
                onClick={() => navigate('/')}
                className="hover:text-[var(--neon-blue)] transition-colors"
              >
                Home
              </button>
              <span>/</span>
              <button 
                onClick={() => navigate('/projects')}
                className="hover:text-[var(--neon-blue)] transition-colors"
              >
                Launches
              </button>
              <span>/</span>
              <span className="text-[var(--silver-light)]">Create</span>
            </div>

            {/* Hero Content */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-purple)] flex items-center justify-center shadow-lg shadow-[var(--neon-blue)]/30">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-[var(--silver-light)] mb-2">
                  Create a Token Launch
                </h1>
                <p className="text-base text-[var(--metallic-silver)] leading-relaxed">
                  Define and deploy a primary-market token launch on Nexus Layer 1 
                  <span className="font-bold text-[var(--neon-orange)]"> testnet</span> via Exhibition. 
                  Total supply, sale allocation, funding, vesting, and liquidity parameters
                  are enforced as immutable on-chain rules that instantiate the initial market.
                </p>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              <div className="bg-[var(--deep-black)]/50 border border-[var(--silver-dark)]/20 rounded-lg p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[var(--neon-blue)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--silver-light)]">Protocol-Enforced</p>
                    <p className="text-xs text-[var(--metallic-silver)]">Executed entirely on-chain</p>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--deep-black)]/50 border border-[var(--silver-dark)]/20 rounded-lg p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[var(--neon-blue)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--silver-light)]">Liquidity Bootstrapping</p>
                    <p className="text-xs text-[var(--metallic-silver)]">Created and locked at finalization</p>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--deep-black)]/50 border border-[var(--silver-dark)]/20 rounded-lg p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[var(--neon-blue)]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--silver-light)]">Deterministic Vesting</p>
                    <p className="text-xs text-[var(--metallic-silver)]">Predefined unlock schedules</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Section */}
      <div className="container mx-auto px-4 mt-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[var(--charcoal)] rounded-xl p-4">
            <h4 className="text-base font-semibold text-[var(--neon-orange)] mb-2">
              Before You Proceed
            </h4>
            <p className="text-xs text-[var(--metallic-silver)] mb-3">
              Creating a launch configures immutable on-chain parameters on Nexus Layer 1 <span className="text-[var(--neon-orange)]"> testnet</span>. Ensure you have:
            </p>
            <ul className="space-y-1.5 text-xs text-[var(--metallic-silver)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--neon-blue)] mt-0.5">✓</span>
                <span>A well-defined tokenomics and distribution plan</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--neon-blue)] mt-0.5">✓</span>
                <span>Sufficient NEX test token to cover transaction fees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--neon-blue)] mt-0.5">✓</span>
                <span>Reviewed all parameters prior to on-chain confirmation (parameters cannot be modified after submission)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Success Message */}
          {isSuccess && projectId !== null && projectId !== undefined && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--neon-purple)]/10 border-2 border-[var(--neon-blue)]/30 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[var(--neon-blue)] flex items-center justify-center shadow-lg shadow-[var(--neon-blue)]/50">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[var(--silver-light)] mb-2">
                      🎉 Project Created Successfully!
                    </h3>
                    <div className="space-y-2 text-sm text-[var(--metallic-silver)]">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--silver-light)]">Project ID:</span>
                        <span className="font-mono text-[var(--neon-blue)]">{projectId.toString()}</span>
                      </p>
                      {projectTokenAddress && (
                        <p className="flex items-start gap-2">
                          <span className="font-semibold text-[var(--silver-light)] flex-shrink-0">Token Address:</span>
                          <code className="font-mono text-xs bg-[var(--charcoal)] px-2 py-1 rounded border border-[var(--silver-dark)]/20 break-all">
                            {projectTokenAddress}
                          </code>
                        </p>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-[var(--silver-dark)]/20">
                        <p className="text-xs font-medium text-[var(--silver-light)] mb-1.5">
                          🚀 Next Steps:
                        </p>
                        <ul className="text-xs text-[var(--metallic-silver)] space-y-0.5 pl-4 list-disc">
                          <li>Deposit your project tokens</li>
                          <li>Configure liquidity settings</li>
                          <li>Review and launch your project</li>
                        </ul>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <Button
                          onClick={handleViewProject}
                          variant="primary"
                          className="flex items-center gap-2 text-sm"
                        >
                          <span>Continue to Project</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--neon-blue)] animate-pulse"></div>
                        <p className="text-xs font-medium text-[var(--neon-blue)]">
                          Close the transaction modal to view your project, or wait for auto-redirect...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <CreateProjectForm
            key={formKey}
            onSubmit={createProject}
            isSubmitting={isCreating}
            error={error}
          />
        </div>
      </div>

      {/* Transaction Modal */}
      <MultiTransactionModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        transactionType={modalState.transactionType}
        mainHash={txHash}
        isMainPending={isPending}
        isMainConfirming={isConfirming}
        isMainSuccess={isSuccess}
        isError={!!error}
        error={error}
        message={
          isSuccess
            ? 'Project created successfully! Close this modal to continue to your project.'
            : isConfirming
            ? 'Confirming project creation on the blockchain...'
            : 'Creating your launchpad project and deploying smart contracts...'
        }
      />
    </div>
  )
}