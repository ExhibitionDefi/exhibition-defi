// src/pages/CreateProjectPage.tsx
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { CreateProjectForm } from '@/components/project/CreateProjectForm'
import { MultiTransactionModal } from '@/components/common/MultiTransactionModal'
import { useCreateProject } from '@/hooks/pad/useCreateProject'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Rocket, ArrowLeft, CheckCircle2, Wallet, ArrowRight } from 'lucide-react'
import { logger } from '@/utils/logger'

/**
 * Create Project Page
 * Professional UI for launching new projects on the Exhibition Launchpad
 */
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

  // ✅ FIXED: Redirect to project details page
  useEffect(() => {
    if (isSuccess && projectId !== null && projectId !== undefined) {
      logger.info('🎯 Redirecting to project:', projectId)
      
      // Convert bigint to string for URL
      const projectIdStr = projectId.toString()
      
      const timer = setTimeout(() => {
        const route = `/projects/${projectIdStr}`
        
        logger.info('📍 Navigating to:', route)
        navigate(route)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isSuccess, projectId, navigate])

  useEffect(() => {
    if (isSuccess) {
      setFormKey(prev => prev + 1)
    }
  }, [isSuccess])

  const handleModalClose = () => {
    modalState.hide()
    if (isSuccess || error) {
      reset()
      if (error) {
        setFormKey(prev => prev + 1)
      }
    }
  }

  // ✅ Manual navigation to project details
  const handleViewProject = () => {
    if (projectId !== null && projectId !== undefined) {
      const projectIdStr = projectId.toString()
      const route = `/projects/${projectIdStr}` // ✅ Matches your route
      logger.info('🔗 Manual navigation to:', route)
      navigate(route)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[var(--deep-black)] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Card className="text-center p-12">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[var(--neon-orange)]/10 border-2 border-[var(--neon-orange)]/30 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-[var(--neon-orange)]" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[var(--silver-light)] mb-4">
              Wallet Not Connected
            </h2>
            <p className="text-[var(--metallic-silver)] mb-8 leading-relaxed">
              Please connect your wallet to access the project creation platform and launch your token on Exhibition.
            </p>
            <Button 
              onClick={() => navigate('/')} 
              variant="primary"
              className="w-full py-3 font-semibold"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
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
        <div className="w-full px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[var(--metallic-silver)] mb-6">
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
                Projects
              </button>
              <span>/</span>
              <span className="text-[var(--silver-light)]">Create</span>
            </div>

            {/* Hero Content */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--neon-blue)] to-[var(--neon-purple)] flex items-center justify-center shadow-lg shadow-[var(--neon-blue)]/30">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-[var(--silver-light)] mb-3">
                  Create Launchpad Project
                </h1>
                <p className="text-lg text-[var(--metallic-silver)] leading-relaxed">
                  Launch your token with Exhibition's decentralized launchpad. Configure your tokenomics, 
                  set funding goals, and bring your project to life with complete transparency and security.
                </p>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-[var(--deep-black)]/50 border border-[var(--silver-dark)]/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[var(--neon-blue)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--silver-light)]">Secure & Trustless</p>
                    <p className="text-xs text-[var(--metallic-silver)]">Smart contract verified</p>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--deep-black)]/50 border border-[var(--silver-dark)]/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[var(--neon-blue)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--silver-light)]">Automated Liquidity</p>
                    <p className="text-xs text-[var(--metallic-silver)]">Lock & pool creation</p>
                  </div>
                </div>
              </div>
              <div className="bg-[var(--deep-black)]/50 border border-[var(--silver-dark)]/20 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--neon-blue)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[var(--neon-blue)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--silver-light)]">Flexible Vesting</p>
                    <p className="text-xs text-[var(--metallic-silver)]">Custom schedules</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Success Message */}
          {isSuccess && projectId !== null && projectId !== undefined && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-[var(--neon-blue)]/10 to-[var(--neon-purple)]/10 border-2 border-[var(--neon-blue)]/30 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-[var(--neon-blue)] flex items-center justify-center shadow-lg shadow-[var(--neon-blue)]/50">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-[var(--silver-light)] mb-2">
                      🎉 Project Created Successfully!
                    </h3>
                    <div className="space-y-3 text-[var(--metallic-silver)]">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--silver-light)]">Project ID:</span>
                        <span className="font-mono text-[var(--neon-blue)]">{projectId.toString()}</span>
                      </p>
                      {projectTokenAddress && (
                        <p className="flex items-start gap-2">
                          <span className="font-semibold text-[var(--silver-light)] flex-shrink-0">Token Address:</span>
                          <code className="font-mono text-sm bg-[var(--charcoal)] px-3 py-1 rounded border border-[var(--silver-dark)]/20 break-all">
                            {projectTokenAddress}
                          </code>
                        </p>
                      )}
                      
                      {/* ✅ Next Steps Info */}
                      <div className="mt-4 pt-4 border-t border-[var(--silver-dark)]/20">
                        <p className="text-sm font-medium text-[var(--silver-light)] mb-2">
                          🚀 Next Steps:
                        </p>
                        <ul className="text-sm text-[var(--metallic-silver)] space-y-1 pl-5 list-disc">
                          <li>Deposit your project tokens</li>
                          <li>Configure liquidity settings</li>
                          <li>Review and launch your project</li>
                        </ul>
                      </div>

                      {/* ✅ Action Button */}
                      <div className="flex items-center gap-3 mt-6">
                        <Button
                          onClick={handleViewProject}
                          variant="primary"
                          className="flex items-center gap-2"
                        >
                          <span>Continue to Project</span>
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* ✅ Auto-redirect indicator */}
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-2 h-2 rounded-full bg-[var(--neon-blue)] animate-pulse"></div>
                        <p className="text-sm font-medium text-[var(--neon-blue)]">
                          Auto-redirecting to project page in 3 seconds...
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

          {/* Help Section */}
          <div className="mt-8 bg-[var(--charcoal)] border border-[var(--silver-dark)]/20 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-[var(--silver-light)] mb-3">
              Need Help?
            </h4>
            <p className="text-sm text-[var(--metallic-silver)] mb-4">
              Creating a launchpad project involves multiple steps. Make sure you have:
            </p>
            <ul className="space-y-2 text-sm text-[var(--metallic-silver)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--neon-blue)] mt-0.5">✓</span>
                <span>Sufficient funds for gas fees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--neon-blue)] mt-0.5">✓</span>
                <span>Tokens ready to deposit after project creation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--neon-blue)] mt-0.5">✓</span>
                <span>Reviewed all parameters carefully (they cannot be changed)</span>
              </li>
            </ul>
          </div>
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
            ? 'Project created successfully! Redirecting to your project...'
            : isConfirming
            ? 'Confirming project creation on the blockchain...'
            : 'Creating your launchpad project and deploying smart contracts...'
        }
      />
    </div>
  )
}