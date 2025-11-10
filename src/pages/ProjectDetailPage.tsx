// src/pages/ProjectDetailPage.tsx
import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Settings } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ProjectDetails } from '../components/project/ProjectDetails'
import { ContributeForm } from '../components/project/ContributeForm'
import { RefundRequestForm } from '../components/project/RefundRequestForm'
import { UserProjectSummary } from '../components/project/UserProjectSummary'
import { DepositLiquidityCard } from '../components/project/DepositLiquidityCard'
import { DepositProjectTokenCard } from '../components/project/DepositProjectTokenCard'
import { FinalizeLiquidityPreviewCard } from '@/components/project/FinalizeLiquidityPreviewCard'
import { WithdrawUnsoldTokensCard } from '../components/project/WithdrawUnsoldTokensCard'
import { MultiTransactionModal } from '../components/common/MultiTransactionModal'
import { useProject } from '../hooks/useProject'
import { usePlatformSettings } from '@/hooks/admin/usePlatformSettings'
import { useAccount } from 'wagmi'
import { useFinalizeProject } from '../hooks/pad/useFinalizeProject'
import { useDepositLiquidityTokens } from '../hooks/pad/useDepositLiquidityTokens'
import { useDepositProjectTokens } from '../hooks/pad/useDepositProjectTokens'
import { useFinalizeLiquidity } from '../hooks/pad/useFinalizeLiquidity'
import { useContributeToProject } from '../hooks/pad/useContributeToProject'
import { useRequestRefund } from '../hooks/pad/useRequestRefund'
import { useWithdrawUnsoldTokens } from '../hooks/pad/useWithdrawUnsoldTokens'
import { ProjectStatus } from '../types/project'

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const { address } = useAccount()

  const {
    project,
    userSummary,
    isLoading,
    error,
    refetch,
  } = useProject(projectId)

  // Fetch platform settings for transaction preview
  const { platformFeePercentage, isLoading: isPlatformSettingsLoading } = usePlatformSettings()

  // Initialize transaction hooks
  const finalize = useFinalizeProject({
    onConfirmed: () => {
      refetch()
    },
    showToast: true,
  })

  const depositLiquidity = useDepositLiquidityTokens({
    project,
    onConfirmed: () => {
      refetch()
    },
    showToast: true,
  })

  // Initialize deposit project tokens hook
  const depositProjectTokens = useDepositProjectTokens({
    project,
    onConfirmed: () => {
      refetch()
    },
    showToast: true,
  })

  // Initialize finalize liquidity hook
  const finalizeLiquidity = useFinalizeLiquidity({
    onConfirmed: () => {
      refetch()
    },
    showToast: true,
  })

  // Initialize contribute hook
  const contribute = useContributeToProject({
    project,
    userSummary,
    onConfirmed: () => {
      refetch()
    },
    showToast: true,
  })

  // Initialize request refund hook
  const requestRefund = useRequestRefund({
    project,
    userSummary,
    onConfirmed: () => {
      refetch()
    },
    showToast: true,
  })

  // Initialize withdraw unsold tokens hook
  const withdrawUnsoldTokens = useWithdrawUnsoldTokens({
    project,
    onConfirmed: () => {
      refetch()
    },
    showToast: true,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" text="Loading project..." />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--neon-orange)] mb-4">
          {error?.message || 'Project not found'}
        </p>
        <Link to="/projects">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    )
  }

  const isProjectOwner = address && project.projectOwner.toLowerCase() === address.toLowerCase()

  // Check if liquidity tokens are deposited (for button state)
  const hasDepositedLiquidity = project.depositedLiquidityTokens >= project.requiredLiquidityTokens

  // Calculate if finalize should show
  const now = Math.floor(Date.now() / 1000)
  const projectHasEnded = now >= Number(project.endTime)
  const canFinalize = project.status === ProjectStatus.Active && projectHasEnded
  
  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>

        <div className="flex items-center space-x-2">
          {/* Block Explorer Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `${import.meta.env.VITE_NEXUS_TESTNET_EXPLORER_URL}/token/${project.projectToken}`,
                '_blank'
              )
            }
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Token
          </Button>

          {/* Owner Dashboard Link */}
          {isProjectOwner && (
            <Link to={`/dashboard?project=${projectId}`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Manage Project
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Project Details - Now receives isProjectOwner prop */}
      <ProjectDetails project={project} isProjectOwner={isProjectOwner} />

      {/* DEPOSIT PROJECT TOKENS CARD - Show when Upcoming and tokens NOT deposited */}
      {isProjectOwner && 
       project.status === ProjectStatus.Upcoming &&
       !depositProjectTokens.projectTokenInfo.isComplete && (
        <DepositProjectTokenCard
          projectId={project.id}
          tokenSymbol={project.tokenSymbol}
          tokenDecimals={project.tokenDecimals}
          projectTokenInfo={depositProjectTokens.projectTokenInfo}
          buttonState={depositProjectTokens.buttonState}
          isOwner={isProjectOwner}
          onDeposit={depositProjectTokens.executeDeposit}
        />
      )}

      {/* DEPOSIT LIQUIDITY CARD - Show when Successful/Claimable and NOT fully deposited */}
      {isProjectOwner && 
       (project.status === ProjectStatus.Successful || 
        project.status === ProjectStatus.Claimable) &&
       project.depositedLiquidityTokens < project.requiredLiquidityTokens && (
        <DepositLiquidityCard
          projectId={project.id}
          tokenSymbol={project.contributionTokenSymbol}
          tokenDecimals={project.contributionTokenDecimals}
          liquidityInfo={depositLiquidity.liquidityInfo}
          buttonState={depositLiquidity.buttonState}
          isOwner={isProjectOwner}
          onDeposit={depositLiquidity.executeDeposit}
        />
      )}

      {/* FINALIZE LIQUIDITY PREVIEW CARD - Show when ready to finalize */}
      {isProjectOwner && 
       (project.status === ProjectStatus.Successful || 
        project.status === ProjectStatus.Claimable) &&
       hasDepositedLiquidity && (
        <FinalizeLiquidityPreviewCard
          project={{
            totalRaised: project.totalRaised,
            liquidityPercentage: project.liquidityPercentage,
            tokenPrice: project.tokenPrice,
            tokenSymbol: project.tokenSymbol ?? 'TOKEN',
            tokenDecimals: project.tokenDecimals ?? 18,
            contributionTokenSymbol: project.contributionTokenSymbol ?? 'TOKEN',
            contributionTokenDecimals: project.contributionTokenDecimals ?? 18,
            contributionTokenAddress: project.contributionTokenAddress,
          }}
          platformFeePercentage={platformFeePercentage}
          isLoading={isPlatformSettingsLoading}
          onFinalize={() => finalizeLiquidity.executeFinalize(project.id)}
          buttonState={finalizeLiquidity.buttonState}
        />
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Contribution/Refund Form */}
        <div className="lg:col-span-2">
          {/* REFUND REQUEST FORM - Show when project Failed/Refundable */}
          {requestRefund.canRefund && (
            <RefundRequestForm
              project={project}
              userContribution={requestRefund.userContribution}
              contributionTokenSymbol={requestRefund.contributionTokenSymbol}
              contributionTokenDecimals={requestRefund.contributionTokenDecimals}
              isConnected={requestRefund.isConnected}
              canRefund={requestRefund.canRefund}
              isLoading={requestRefund.isLoading}
              onRequestRefund={requestRefund.onRequestRefund}
            />
          )}

          {/* WITHDRAW UNSOLD TOKENS CARD - Show when owner can withdraw */}
          {isProjectOwner && withdrawUnsoldTokens.canWithdraw && (
            <WithdrawUnsoldTokensCard
              projectId={project.id}
              tokenSymbol={project.tokenSymbol}
              tokenDecimals={project.tokenDecimals}
              buttonState={withdrawUnsoldTokens.buttonState}
              isWithdrawalUnlocked={withdrawUnsoldTokens.isWithdrawalUnlocked}
              withdrawalUnlocksAt={withdrawUnsoldTokens.withdrawalUnlocksAt}
              unsoldTokensAmount={withdrawUnsoldTokens.tokenInfo.unsoldTokensAmount}
              tokensForSale={withdrawUnsoldTokens.tokenInfo.tokensForSale}
              tokensAllocated={withdrawUnsoldTokens.tokenInfo.tokensAllocated}
              onWithdraw={withdrawUnsoldTokens.withdrawUnsoldTokens}
            />
          )}

          {/* CONTRIBUTE FORM - Show when Active and NOT owner and NOT refund scenario */}
          {project.status === ProjectStatus.Active && !isProjectOwner && !requestRefund.canRefund && (
            <ContributeForm 
              project={project}
              contributionAmount={contribute.contributionAmount}
              tokenAmountDue={contribute.tokenAmountDue}
              balance={contribute.balance}
              inputAmountBigInt={contribute.inputAmountBigInt}
              balanceBigInt={contribute.balanceBigInt}
              contributionTokenSymbol={contribute.contributionTokenSymbol}
              contributionTokenDecimals={contribute.contributionTokenDecimals}
              isConnected={contribute.isConnected}
              canContribute={contribute.canContribute}
              isLoading={contribute.isLoading}
              onSetMaxBalance={contribute.onSetMaxBalance}
              onContributionChange={contribute.onContributionChange}
              onContribute={contribute.onContribute}
              onApprovalComplete={contribute.onApprovalComplete} 
              />
          )}
          
          {(project.status === ProjectStatus.FundingEnded || 
            project.status === ProjectStatus.Successful) && 
            !requestRefund.canRefund && (
            <div className="bg-[var(--charcoal)] border border-[var(--silver-dark)]/30 rounded-2xl p-6 text-center">
              <p className="text-[var(--silver-light)]">
                Funding period has ended. Status: {project.formattedStatus}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - User Summary & Actions */}
        <div className="space-y-6">
          {address && userSummary && (
            <UserProjectSummary
              project={project}
              userSummary={userSummary}
              onRefetch={refetch}
              canFinalize={canFinalize}
              finalizeButtonState={finalize.buttonState}
              onFinalize={finalize.executeFinalize}
            />
          )}
        </div>
      </div>

      {/* ALL TRANSACTION MODALS */}
      
      {/* Deposit Project Tokens Modal */}
      <MultiTransactionModal
        isOpen={depositProjectTokens.transactionStatus.show}
        onClose={depositProjectTokens.closeModal}
        transactionType={depositProjectTokens.transactionType}
        approvalHash={depositProjectTokens.approvalHash}
        mainHash={depositProjectTokens.hash}
        isApprovalPending={depositProjectTokens.approvalWriteState?.isPending}
        isApprovalConfirming={depositProjectTokens.isApprovalConfirming}
        isApprovalSuccess={depositProjectTokens.isApprovalSuccess}
        isMainPending={depositProjectTokens.isPending}
        isMainConfirming={depositProjectTokens.isConfirming}
        isMainSuccess={depositProjectTokens.isConfirmed}
        isError={depositProjectTokens.isError}
        error={depositProjectTokens.error}
      />

      {/* Finalize Project Modal */}
      <MultiTransactionModal
        isOpen={finalize.transactionStatus.show}
        onClose={finalize.reset}
        transactionType={finalize.transactionType}
        mainHash={finalize.hash}
        isMainPending={finalize.isPending}
        isMainConfirming={finalize.isConfirming}
        isMainSuccess={finalize.isConfirmed}
        isError={finalize.isError}
        error={finalize.error}
      />

      {/* Deposit Liquidity Modal */}
      <MultiTransactionModal
        isOpen={depositLiquidity.transactionStatus.show}
        onClose={depositLiquidity.closeModal}
        transactionType={depositLiquidity.transactionType}
        approvalHash={depositLiquidity.approvalHash}
        mainHash={depositLiquidity.hash}
        isApprovalPending={depositLiquidity.approvalWriteState?.isPending}
        isApprovalConfirming={depositLiquidity.isApprovalConfirming}
        isApprovalSuccess={depositLiquidity.isApprovalSuccess}
        isMainPending={depositLiquidity.isPending}
        isMainConfirming={depositLiquidity.isConfirming}
        isMainSuccess={depositLiquidity.isConfirmed}
        isError={depositLiquidity.isError}
        error={depositLiquidity.error}
      />

      {/* Finalize Liquidity Modal */}
      <MultiTransactionModal
        isOpen={finalizeLiquidity.transactionStatus.show}
        onClose={finalizeLiquidity.reset}
        transactionType={finalizeLiquidity.transactionType}
        mainHash={finalizeLiquidity.hash}
        isMainPending={finalizeLiquidity.isPending}
        isMainConfirming={finalizeLiquidity.isConfirming}
        isMainSuccess={finalizeLiquidity.isConfirmed}
        isError={finalizeLiquidity.isError}
        error={finalizeLiquidity.error}
      />

      {/* Contribute Modal */}
      <MultiTransactionModal
        isOpen={contribute.transactionStatus.show}
        onClose={contribute.closeModal}
        transactionType={contribute.transactionType}
        approvalHash={contribute.approvalHash}
        mainHash={contribute.hash}
        isApprovalPending={contribute.approvalWriteState?.isPending}
        isApprovalConfirming={contribute.isApprovalConfirming}
        isApprovalSuccess={contribute.isApprovalSuccess}
        isMainPending={contribute.isPending}
        isMainConfirming={contribute.isConfirming}
        isMainSuccess={contribute.isConfirmed}
        isError={contribute.isError}
        error={contribute.error}
      />

      {/* Request Refund Modal */}
      <MultiTransactionModal
        isOpen={requestRefund.transactionStatus.show}
        onClose={requestRefund.closeModal}
        transactionType={requestRefund.transactionType}
        mainHash={requestRefund.hash}
        isMainPending={requestRefund.isPending}
        isMainConfirming={requestRefund.isConfirming}
        isMainSuccess={requestRefund.isConfirmed}
        isError={requestRefund.isError}
        error={requestRefund.error}
      />

      {/* Withdraw Unsold Tokens Modal */}
      <MultiTransactionModal
        isOpen={withdrawUnsoldTokens.transactionStatus.show}
        onClose={withdrawUnsoldTokens.closeModal}
        transactionType={withdrawUnsoldTokens.transactionType}
        mainHash={withdrawUnsoldTokens.hash}
        isMainPending={withdrawUnsoldTokens.isPending}
        isMainConfirming={withdrawUnsoldTokens.isConfirming}
        isMainSuccess={withdrawUnsoldTokens.isConfirmed}
        isError={withdrawUnsoldTokens.isError}
        error={withdrawUnsoldTokens.error}
      />
    </div>
  )
}