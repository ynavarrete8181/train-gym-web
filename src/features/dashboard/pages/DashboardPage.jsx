import { Box } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../../components/common/PageHeader.jsx'
import { obtenerUsuarioActual } from '../../auth/services/authService.js'
import { DashboardCard } from '../components/DashboardCard.jsx'

const metricasPorRol = {
  SUPERADMINISTRADOR: [
    { titulo: 'Usuarios', valor: '—', detalle: 'Indicador técnico pendiente de integración' },
    { titulo: 'Roles', valor: '—', detalle: 'Indicador técnico pendiente de integración' },
    { titulo: 'Menús', valor: '—', detalle: 'Indicador técnico pendiente de integración' },
    { titulo: 'Funciones', valor: '—', detalle: 'Indicador técnico pendiente de integración' },
  ],
  ADMINISTRADOR: [
    { titulo: 'Clientes activos', valor: '—', detalle: 'Indicador operativo pendiente de integración' },
    { titulo: 'Membresías', valor: '—', detalle: 'Indicador operativo pendiente de integración' },
    { titulo: 'Ventas del día', valor: '—', detalle: 'Indicador operativo pendiente de integración' },
    { titulo: 'Asistencia', valor: '—', detalle: 'Indicador operativo pendiente de integración' },
  ],
  'SUPERVISOR DE VENTAS': [
    { titulo: 'Ventas del día', valor: '—', detalle: 'Consolidado comercial pendiente de integración' },
    { titulo: 'Pagos registrados', valor: '—', detalle: 'Cobros del día pendiente de integración' },
    { titulo: 'Membresías vendidas', valor: '—', detalle: 'Altas y renovaciones pendientes de integración' },
    { titulo: 'Cajas', valor: '—', detalle: 'Estado de cajas pendiente de integración' },
  ],
  CAJERO: [
    { titulo: 'Mi caja', valor: '—', detalle: 'Estado de caja pendiente de integración' },
    { titulo: 'Ventas del día', valor: '—', detalle: 'Ventas registradas pendiente de integración' },
    { titulo: 'Pagos', valor: '—', detalle: 'Pagos procesados pendiente de integración' },
    { titulo: 'Comprobantes', valor: '—', detalle: 'Comprobantes emitidos pendiente de integración' },
  ],
  RECEPCIONISTA: [
    { titulo: 'Clientes', valor: '—', detalle: 'Atención del día pendiente de integración' },
    { titulo: 'Reservas', valor: '—', detalle: 'Reservas del día pendiente de integración' },
    { titulo: 'Membresías', valor: '—', detalle: 'Estado comercial pendiente de integración' },
    { titulo: 'Check-in', valor: '—', detalle: 'Ingresos del día pendiente de integración' },
  ],
  ENTRENADOR: [
    { titulo: 'Deportistas asignados', valor: '—', detalle: 'Indicador deportivo pendiente de integración' },
    { titulo: 'Sesiones de hoy', valor: '—', detalle: 'Agenda deportiva pendiente de integración' },
    { titulo: 'Evaluaciones', valor: '—', detalle: 'Evaluaciones pendientes de integración' },
    { titulo: 'Alertas', valor: '—', detalle: 'Seguimiento pendiente de integración' },
  ],
  DEPORTISTA: [
    { titulo: 'Mi membresía', valor: '—', detalle: 'Estado pendiente de integración' },
    { titulo: 'Próxima sesión', valor: '—', detalle: 'Agenda pendiente de integración' },
    { titulo: 'Progreso', valor: '—', detalle: 'Seguimiento pendiente de integración' },
    { titulo: 'Reservas', valor: '—', detalle: 'Reservas pendientes de integración' },
  ],
}

const metricasGenerales = [
  { titulo: 'Actividad', valor: '—', detalle: 'Indicador pendiente de integración' },
  { titulo: 'Operación', valor: '—', detalle: 'Indicador pendiente de integración' },
  { titulo: 'Pendientes', valor: '—', detalle: 'Indicador pendiente de integración' },
  { titulo: 'Resumen', valor: '—', detalle: 'Indicador pendiente de integración' },
]

export function DashboardPage() {
  const [rol, setRol] = useState('')

  useEffect(() => {
    let activo = true

    obtenerUsuarioActual()
      .then((datos) => {
        if (activo) setRol(datos?.usuario?.rol_nombre || '')
      })
      .catch(() => {
        if (activo) setRol('')
      })

    return () => { activo = false }
  }, [])

  const metricas = useMemo(() => metricasPorRol[rol] || metricasGenerales, [rol])
  const descripcion = rol === 'SUPERVISOR DE VENTAS'
    ? 'Resumen comercial y control diario de ventas.'
    : 'Vista inicial del Revive.'

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        descripcion={descripcion}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        {metricas.map((metrica) => (
          <Box key={metrica.titulo}>
            <DashboardCard {...metrica} />
          </Box>
        ))}
      </Box>
    </>
  )
}
