import { Box, Toolbar, useMediaQuery, useTheme } from '@mui/material'
import { useState } from 'react'
import { Sidebar } from './Sidebar.jsx'
import { Topbar } from './Topbar.jsx'
import { CargaNavegacion } from '../common/CargaNavegacion.jsx'

const sidebarWidth = 286
const sidebarCollapsedWidth = 72

export function AppLayout({ children, menuItems, vistaActual, tituloVista, usuario, navegando, onNavigate, onLogout, onAvisoNavigate }) {
  const [menuAbierto, setMenuAbierto] = useState(true)
  const anchoMenu = menuAbierto ? sidebarWidth : sidebarCollapsedWidth
  // En pantallas pequeñas el menú se abre sobre el contenido, sin desplazarlo.
  const esMovil = useMediaQuery(useTheme().breakpoints.down('md'))
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Topbar onAbrirMenu={() => setMenuMovilAbierto(true)} sidebarWidth={anchoMenu} vistaActual={vistaActual} tituloVista={tituloVista} usuario={usuario} onLogout={onLogout} onAvisoNavigate={onAvisoNavigate} />
      <Sidebar width={sidebarWidth} collapsedWidth={sidebarCollapsedWidth} movil={esMovil} abierto={esMovil ? menuMovilAbierto : menuAbierto} onToggle={() => (esMovil ? setMenuMovilAbierto(false) : setMenuAbierto((actual) => !actual))} menuItems={menuItems} vistaActual={vistaActual} onNavigate={onNavigate} />
      <Box component="main" sx={{ position: 'relative', flexGrow: 1, minWidth: 0, p: { xs: 1.5, md: 3 }, width: { md: `calc(100% - ${anchoMenu}px)` }, transition: (theme) => theme.transitions.create(['width', 'margin'], { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.standard }) }}>
        <Toolbar />
        <Box aria-busy={navegando}>{children}</Box>
        <CargaNavegacion visible={navegando} />
      </Box>
    </Box>
  )
}
