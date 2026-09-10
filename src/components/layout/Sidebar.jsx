import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import MenuOpenOutlinedIcon from '@mui/icons-material/MenuOpenOutlined'
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined'
import { Box, Collapse, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { IconoMaterial } from '../common/IconoMaterial.jsx'
import { uiTokens } from '../../styles/uiTokens.js'
import reviveLogo from '../../assets/brand/revive-logo.jpeg'

const iconosPorCodigo = {
  DASHBOARD: <DashboardOutlinedIcon />,
  'SEGURIDAD-USUARIOS': <ManageAccountsOutlinedIcon />,
  'SEGURIDAD-ROLES': <ShieldOutlinedIcon />,
  'ACADEMICO-PERIODOS': <EventNoteOutlinedIcon />,
  MATRICULAS: <GroupsOutlinedIcon />,
  ASISTENCIA: <FactCheckOutlinedIcon />,
}

const iconosPorMenu = {
  admin_panel_settings: <AdminPanelSettingsOutlinedIcon />,
  school: <SchoolOutlinedIcon />,
}

function normalizar(valor) {
  return String(valor || '').trim().toLowerCase()
}

function obtenerIconoGrupo(grupo) {
  if (grupo.icono) return <IconoMaterial nombre={grupo.icono} />
  return iconosPorMenu[normalizar(grupo.icono)] || <SchoolOutlinedIcon />
}

function obtenerIconoOpcion(opcion) {
  if (opcion.icono) return <IconoMaterial nombre={opcion.icono} />
  return iconosPorCodigo[opcion.id_menu] || <DashboardOutlinedIcon />
}

function esDashboard(opcion) {
  return opcion?.id_menu === 'DASHBOARD'
}

export function Sidebar({ width, collapsedWidth, abierto, onToggle, menuItems = [], vistaActual, onNavigate }) {
  const dashboard = useMemo(
    () => menuItems.flatMap((grupo) => grupo.subItems || []).find(esDashboard) || null,
    [menuItems],
  )
  const gruposMenu = useMemo(
    () => menuItems
      .map((grupo) => ({ ...grupo, subItems: (grupo.subItems || []).filter((opcion) => !esDashboard(opcion)) }))
      .filter((grupo) => grupo.subItems.length > 0),
    [menuItems],
  )
  const grupoActivo = useMemo(
    () => gruposMenu.find((grupo) => grupo.subItems?.some((opcion) => opcion.id_menu === vistaActual)),
    [gruposMenu, vistaActual],
  )
  const [gruposAbiertos, setGruposAbiertos] = useState({})
  const [menuContraido, setMenuContraido] = useState({ anchor: null, grupo: null })

  useEffect(() => {
    if (!grupoActivo) return
    setGruposAbiertos((actual) => ({ ...actual, [grupoActivo.id_usermenu]: true }))
  }, [grupoActivo])

  const alternarGrupo = (grupo, evento) => {
    if (!abierto) {
      setMenuContraido({ anchor: evento.currentTarget, grupo })
      return
    }

    setGruposAbiertos((actual) => ({
      [grupo.id_usermenu]: !actual[grupo.id_usermenu],
    }))
  }

  const navegar = (opcion) => {
    setMenuContraido({ anchor: null, grupo: null })
    onNavigate(opcion)
  }

  const anchoActual = abierto ? width : collapsedWidth

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: anchoActual,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: anchoActual,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            bgcolor: '#0b0b0b',
            color: '#fff',
            borderRight: 1,
            borderColor: '#202020',
            boxShadow: '8px 0 28px rgba(0, 0, 0, 0.20)',
            transition: (theme) => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          },
        }}
      >
        <Box sx={{ height: 68, px: abierto ? 2 : 1, display: 'flex', alignItems: 'center', justifyContent: abierto ? 'space-between' : 'center' }}>
          {abierto ? (
            <Stack direction="row" spacing={1.1} sx={{ minWidth: 0, alignItems: 'center' }}>
              <Box
                component="img"
                src={reviveLogo}
                alt="Revive Sports"
                sx={{ width: 38, height: 38, borderRadius: 1.2, objectFit: 'cover', bgcolor: uiTokens.colores.primario }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 900, lineHeight: 1.1, color: '#fff' }} noWrap>
                  Revive
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,0.68)' }} noWrap>
                  Gestión deportiva
                </Typography>
              </Box>
            </Stack>
          ) : null}
          <Tooltip title={abierto ? 'Contraer menú' : 'Ampliar menú'} placement="right">
            <IconButton
              onClick={onToggle}
              sx={{
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.20)',
                bgcolor: 'rgba(255,255,255,0.06)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              {abierto ? <MenuOpenOutlinedIcon /> : <ViewSidebarOutlinedIcon />}
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ borderColor: '#181818' }} />

        <List sx={{ px: abierto ? 1.2 : 0.8, py: 1.2 }}>
          {dashboard ? (
            <Box sx={{ mb: 1 }}>
              <Tooltip title={!abierto ? dashboard.nombre : ''} placement="right">
                <ListItemButton
                  selected={dashboard.id_menu === vistaActual}
                  onClick={() => navegar(dashboard)}
                  sx={{
                    minHeight: 44,
                    justifyContent: abierto ? 'initial' : 'center',
                    px: abierto ? 1.2 : 0.9,
                    borderRadius: 1.2,
                    color: '#fff',
                    bgcolor: dashboard.id_menu === vistaActual ? 'rgba(212,160,23,0.28)' : 'transparent',
                    border: `1px solid ${dashboard.id_menu === vistaActual ? 'rgba(212,160,23,0.42)' : '#202020'}`,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: abierto ? 36 : 0, color: dashboard.id_menu === vistaActual ? uiTokens.colores.acento : '#fff', justifyContent: 'center' }}>
                    <DashboardOutlinedIcon />
                  </ListItemIcon>
                  {abierto ? (
                    <ListItemText
                      primary={dashboard.nombre || 'Dashboard'}
                      slotProps={{ primary: { sx: { fontSize: 12.8, fontWeight: 900 }, noWrap: true } }}
                    />
                  ) : null}
                </ListItemButton>
              </Tooltip>
            </Box>
          ) : null}

          {dashboard && gruposMenu.length ? <Divider sx={{ my: 1, borderColor: '#181818' }} /> : null}

          {gruposMenu.map((grupo) => {
            const grupoEstaActivo = grupo.id_usermenu === grupoActivo?.id_usermenu
            const grupoEstaAbierto = Boolean(gruposAbiertos[grupo.id_usermenu])

            return (
              <Box key={grupo.id_usermenu} sx={{ mb: 0.5 }}>
                <Tooltip title={!abierto ? grupo.menu : ''} placement="right">
                  <ListItemButton
                    selected={grupoEstaActivo}
                    onClick={(evento) => alternarGrupo(grupo, evento)}
                    sx={{
                      minHeight: 42,
                      justifyContent: abierto ? 'initial' : 'center',
                      px: abierto ? 1.2 : 0.9,
                      borderRadius: 1.2,
                      color: '#fff',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(212,160,23,0.30)',
                      },
                      '&.Mui-selected:hover, &:hover': { bgcolor: 'rgba(212,160,23,0.22)' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: abierto ? 36 : 0, color: grupoEstaActivo ? uiTokens.colores.acento : 'rgba(255,255,255,0.86)', justifyContent: 'center' }}>
                      {obtenerIconoGrupo(grupo)}
                    </ListItemIcon>
                    {abierto ? (
                      <>
                        <ListItemText
                          primary={grupo.menu}
                          slotProps={{ primary: { sx: { fontSize: 12.5, fontWeight: 850 }, noWrap: true } }}
                        />
                        {grupoEstaAbierto ? <ExpandLessOutlinedIcon fontSize="small" /> : <ExpandMoreOutlinedIcon fontSize="small" />}
                      </>
                    ) : null}
                  </ListItemButton>
                </Tooltip>

                {abierto ? (
                  <Collapse in={grupoEstaAbierto} timeout="auto" unmountOnExit>
                    <List
                      disablePadding
                      sx={{
                        mt: 0.35,
                        mb: 0.5,
                        ml: 2.65,
                        pl: 1.15,
                        py: 0.2,
                        borderLeft: `2px solid ${grupoEstaActivo ? 'rgba(212,160,23,0.42)' : '#202020'}`,
                      }}
                    >
                      {grupo.subItems?.map((opcion) => (
                        <ListItemButton
                          key={opcion.id_menu}
                          selected={opcion.id_menu === vistaActual}
                          onClick={() => navegar(opcion)}
                          sx={{
                            minHeight: 36,
                            borderRadius: 1.2,
                            mb: 0.35,
                            px: 1,
                            color: 'rgba(255,255,255,0.78)',
                            '&.Mui-selected': {
                              bgcolor: 'rgba(255,255,255,0.12)',
                              color: '#fff',
                              fontWeight: 900,
                            },
                            '&.Mui-selected:hover': { bgcolor: 'rgba(255,255,255,0.16)' },
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 30, color: 'inherit', '& .MuiSvgIcon-root': { fontSize: 19 } }}>
                            {obtenerIconoOpcion(opcion)}
                          </ListItemIcon>
                          <ListItemText primary={opcion.nombre} slotProps={{ primary: { sx: { fontSize: 12.2, fontWeight: 750 }, noWrap: true } }} />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                ) : null}
              </Box>
            )
          })}
        </List>
      </Drawer>

      <Popover
        open={Boolean(menuContraido.anchor)}
        anchorEl={menuContraido.anchor}
        onClose={() => setMenuContraido({ anchor: null, grupo: null })}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        PaperProps={{ sx: { ml: 1, width: 230, borderRadius: 2, border: `1px solid ${uiTokens.colores.borde}`, boxShadow: '0 14px 36px rgba(15, 23, 42, 0.18)' } }}
      >
        <Box sx={{ px: 1.5, py: 1.2, bgcolor: uiTokens.colores.primarioSuave, borderBottom: `1px solid ${uiTokens.colores.bordeSuave}` }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 900, color: uiTokens.colores.primario }}>
            {menuContraido.grupo?.menu}
          </Typography>
        </Box>
        <List dense sx={{ p: 0.7 }}>
          {menuContraido.grupo?.subItems?.map((opcion) => (
            <ListItemButton key={opcion.id_menu} selected={opcion.id_menu === vistaActual} onClick={() => navegar(opcion)} sx={{ borderRadius: 1, mb: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 34 }}>{obtenerIconoOpcion(opcion)}</ListItemIcon>
              <ListItemText primary={opcion.nombre} slotProps={{ primary: { sx: { fontSize: 12.5, fontWeight: 750 } } }} />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </>
  )
}
