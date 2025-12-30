import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AMMFormatters } from './utils/ammFormatters'


// ✅ initialize AMM formatters before rendering the app
AMMFormatters.initialize()

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error("❌ Root element with id 'root' not found in index.html")
}

ReactDOM.createRoot(rootElement).render(
  <App />
)
