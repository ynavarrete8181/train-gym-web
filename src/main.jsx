import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'
import { escucharVersionNueva } from './recargaVersionNueva.js'

escucharVersionNueva()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
)
