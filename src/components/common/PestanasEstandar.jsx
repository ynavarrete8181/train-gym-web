import { Tab, Tabs } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { obtenerCapacidadesVista, vistaTieneCapacidadesBackend } from '../../services/capacidadesVistaService.js'

/** Navegación por pestañas compartida y adaptable para todos los módulos. */
export function PestanasEstandar({ value, onChange, opciones, sx = {}, ...props }) {
  const vistaActual = localStorage.getItem('base_vista_actual') || ''
  const [capacidades, setCapacidades] = useState(null)

  useEffect(() => {
    let activo = true

    if (!vistaTieneCapacidadesBackend(vistaActual)) {
      setCapacidades(null)
      return () => { activo = false }
    }

    obtenerCapacidadesVista(vistaActual)
      .then((datos) => {
        if (activo) setCapacidades(datos || {})
      })
      .catch(() => {
        if (activo) setCapacidades({})
      })

    return () => { activo = false }
  }, [vistaActual])

  const opcionesVisibles = useMemo(() => {
    if (!vistaTieneCapacidadesBackend(vistaActual) || capacidades === null) return opciones
    return opciones.filter((opcion) => capacidades[opcion.value] !== false)
  }, [opciones, capacidades, vistaActual])

  return (
    <Tabs
      value={opcionesVisibles.some((opcion) => opcion.value === value) ? value : false}
      onChange={onChange}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      sx={{
        minHeight: 44,
        borderBottom: '1px solid #dbe5f0',
        bgcolor: '#f8fafc',
        px: { xs: 0.5, sm: 1.5 },
        '& .MuiTab-root': { minHeight: 44, minWidth: 'auto', px: 1.4, textTransform: 'none', fontSize: 12.5, fontWeight: 700, color: 'text.secondary' },
        '& .Mui-selected': { fontWeight: 850, color: 'primary.main' },
        '& .MuiTabs-indicator': { height: 2, borderRadius: '2px 2px 0 0' },
        ...sx,
      }}
      {...props}
    >
      {opcionesVisibles.map(({ value: optionValue, label, icon, disabled }) => (
        <Tab key={optionValue ?? label} value={optionValue} label={label} icon={icon} iconPosition={icon ? 'start' : undefined} disabled={disabled} />
      ))}
    </Tabs>
  )
}
