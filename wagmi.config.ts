import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import type { Abi } from 'abitype'

import ExhibitionABI from './src/types/abis/Exhibition.json'
import ExhibitionAMMabi from './src/types/abis/ExhibitionAMM.json'
import exNEXABI from './src/types/abis/exNEX.json'
import { erc20Abi } from 'viem';

export default defineConfig({
  out: 'src/generated/wagmi.ts',
  contracts: [
    { name: 'Exhibition', abi: ExhibitionABI as Abi },
    { name: 'ExhibitionAMM', abi: ExhibitionAMMabi as Abi },
    { name: 'exNeX', abi: exNEXABI as Abi },
    { name: 'ERC20', abi: erc20Abi as Abi },
  ],
  plugins: [react()],
})