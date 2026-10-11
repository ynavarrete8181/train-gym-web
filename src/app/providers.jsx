import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../services/queryClient.js'
import { TemaProvider } from '../contexts/TemaContext.jsx'
import { useTema } from '../hooks/useTema.js'
import { crearTema } from '../styles/theme.js'
import '../styles/global.css'

function ProveedorTemaMui({ children }) {
  const tema = useTema()

  return (
    <ThemeProvider theme={crearTema(tema.modoResuelto)}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TemaProvider>
        <ProveedorTemaMui>{children}</ProveedorTemaMui>
      </TemaProvider>
    </QueryClientProvider>
  )
}
