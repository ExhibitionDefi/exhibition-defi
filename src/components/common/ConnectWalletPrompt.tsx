import React from 'react'
import { Wallet } from 'lucide-react'
import { Card } from '../ui/Card'

interface ConnectWalletPromptProps {
  message?: string
}

export const ConnectWalletPrompt: React.FC<ConnectWalletPromptProps> = ({
  message = "Connect your wallet to continue"
}) => {
  return (
    <Card className="text-center py-12 bg-charcoal border border-neon-blue glow-neon-blue" hover={true}>
      <div className="mb-4 relative">
        <Wallet className="h-12 w-12 text-neon-blue mx-auto text-glow-neon-blue animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-neon-blue border-opacity-30 rounded-full animate-ping"></div>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-silver-light mb-2 text-glow-silver-light">
        Wallet Connection Required
      </h3>
      <p className="text-metallic-silver mb-6 max-w-sm mx-auto">
        {message}
      </p>
      <div className="flex justify-center">
        <w3m-button />
      </div>
    </Card>
  )
}