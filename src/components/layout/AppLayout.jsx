import { Box, Toolbar } from '@mui/material'
import { useState } from 'react'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { CargaNavegacion } from '../common/CargaNavegacion.jsx'

const sidebarWidth = 286
const sidebarCollapsedWidth = 72

export function AppLayout({ children, menuItems, vistaActual, tituloVista, usuario, navegando, onNavigate, onLogout, onAvisoNavigate }) {
  const [menuAbierto, setMenuAbierto] = useState(true)
  const anchoMenu = menuAbierto ? sidebarWidth : sidebarCollapsedWidth

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Topbar sidebarWidth={anchoMenu} vistaActual={vistaActual} tituloVista={tituloVista} usuario={usuario} onLogout={onLogout} onAvisoNavigate={onAvisoNavigate} />
      <Sidebar width={sidebarWidth} collapsedWidth={sidebarCollapsedWidth} abierto={menuAbierto} onToggle={() => setMenuAbierto((actual) => !actual)} menuItems={menuItems} vistaActual={vistaActual} onNavigate={onNavigate} />
      <Box component="main" sx={{ position: 'relative', flexGrow: 1, p: 3, width: { md: `calc(100% - ${anchoMenu}px)` }, transition: (theme) => theme.transitions.create(['width', 'margin'], { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.standard }) }}>
        <Toolbar />
        <Box aria-busy={navegando}>{children}</Box>
        <CargaNavegacion visible={navegando} />
      </Box>
    </Box>
  )
}
