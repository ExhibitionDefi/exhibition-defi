import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 👇 bring in AMM setup
import { AMMFormatters } from './utils/ammFormatters'
import { publicClient } from './config/wagmi'
import {AMM_ADDRESS } from './config/contracts'
import AMM_ABI from './types/abis/ExhibitionAMM.json'

// ✅ initialize AMM formatters before rendering the app
AMMFormatters.initialize({
  publicClient,
  contractAddress: AMM_ADDRESS,
  abi: AMM_ABI,
})

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error("❌ Root element with id 'root' not found in index.html")
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
