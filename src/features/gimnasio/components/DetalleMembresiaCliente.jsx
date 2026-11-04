import { useEffect, useState } from 'react';
import { Box, Button, Chip, Stack, Typography } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { HistorialIntegralMembresia } from './HistorialIntegralMembresia.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';

const fecha = (valor) => {
  if (!valor) return '—';
  const partes = String(valor).slice(0, 10).split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(valor);
};

const importe = (valor) => valor == null
  ? '—'
  : new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(Number(valor));

function DatoContrato({ titulo, valor }) {
  return <Box sx={{ minWidth: 0, py: 0.5 }}>
    <Typography variant="caption" color="text.secondary" display="block">{titulo}</Typography>
    <Typography variant="body2" fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{valor || '—'}</Typography>
  </Box>;
}

/**
 * Vista interna del Paper 2 del perfil integral.
 * No crea Paper ni altera el encabezado, las pestañas o la estructura global.
 * Las operaciones se autorizan en Laravel; aquí solo se presentan los accesos.
 */
export function DetalleMembresiaCliente({
  membresia, onVolver, onEditar, onGestionarCicloVida, onRenovar,
}) {
  const [seccion, setSeccion] = useState('informacion');

  useEffect(() => { setSeccion('informacion'); }, [membresia?.id]);

  if (!membresia) return null;

  const congelada = String(membresia.estado || '').toUpperCase() === 'CONGELADA';
  const permiteAccesoRenovacion = membresia.cantidad_periodos_contratados != null && !congelada;

  const secciones = [
    { id: 'informacion', titulo: 'Información' },
    { id: 'operaciones', titulo: 'Operaciones' },
    { id: 'historial', titulo: 'Historial' },
  ];

  return <Box sx={{ width: '100%', minWidth: 0 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
      alignItems={{ xs: 'stretch', sm: 'center' }} gap={1.5} sx={{ mb: 2 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" fontWeight={800}>Detalle de membresía</Typography>
        <Typography variant="body2" color="text.secondary">
          {[membresia.plan_nombre, membresia.modalidad_nombre].filter(Boolean).join(' · ') || 'Membresía'}
        </Typography>
        {membresia.codigo_contrato && <Typography variant="caption" color="text.secondary">
          Contrato: {membresia.codigo_contrato}
        </Typography>}
      </Box>
      <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
        <StatusChip estado={String(membresia.estado || '').toLowerCase()} />
        <Button variant="outlined" startIcon={<ArrowBackOutlinedIcon />} onClick={onVolver}>
          Volver al listado
        </Button>
      </Stack>
    </Stack>

    <Stack direction="row" flexWrap="wrap" gap={1} role="tablist" aria-label="Secciones de la membresía"
      sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1.25, mb: 2 }}>
      {secciones.map(item => <Button key={item.id} size="small" role="tab"
        aria-selected={seccion === item.id} variant={seccion === item.id ? 'contained' : 'outlined'}
        onClick={() => setSeccion(item.id)}
        sx={{ textTransform: 'none', fontWeight: 700, minWidth: 0 }}>
        {item.titulo}
      </Button>)}
    </Stack>

    {seccion === 'informacion' && <Box>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
        Información de la asignación
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: {
        xs: 'repeat(1, minmax(0, 1fr))',
        sm: 'repeat(2, minmax(0, 1fr))',
        md: 'repeat(3, minmax(0, 1fr))',
      }, gap: 2, mb: 2 }}>
        <DatoContrato titulo="Plan" valor={membresia.plan_nombre} />
        <DatoContrato titulo="Modalidad" valor={membresia.modalidad_nombre || 'Sin modalidad'} />
        <DatoContrato titulo="Inicio de vigencia" valor={fecha(membresia.fecha_inicio)} />
        <DatoContrato titulo="Fin de vigencia" valor={fecha(membresia.fecha_fin)} />
        <DatoContrato titulo="Precio registrado" valor={importe(membresia.precio_aplicado)} />
        <DatoContrato titulo="Estado del contrato" valor={membresia.estado} />
      </Box>
      <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => onEditar(membresia)}>
        Editar membresía
      </Button>
    </Box>}

    {seccion === 'operaciones' && <Box>
      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>Operaciones del contrato</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Consulta la disponibilidad de cada operación según el estado del contrato y las reglas del sistema.
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems="stretch" gap={1.5}>
        <Button variant="outlined" startIcon={<AcUnitOutlinedIcon />}
          onClick={() => onGestionarCicloVida(membresia)} sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
          Congelación y reactivación
        </Button>
        {membresia.cantidad_periodos_contratados != null && <Button variant="outlined"
          startIcon={<AutorenewOutlinedIcon />} disabled={!permiteAccesoRenovacion}
          onClick={() => onRenovar(membresia)} sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
          Renovar membresía
        </Button>}
        <Button variant="outlined" startIcon={<HistoryOutlinedIcon />}
          onClick={() => setSeccion('historial')} sx={{ justifyContent: 'flex-start', textTransform: 'none' }}>
          Ver historial
        </Button>
      </Stack>
      {congelada && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
        Reactiva la membresía antes de solicitar una renovación.
      </Typography>}
      <Box sx={{ mt: 2, px: 1.5, py: 1.25, borderRadius: 1.5,
        border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
        <Typography variant="caption" sx={{ color: uiTokens.colores.textoSecundario }}>
          No se ofrece eliminación directa: las operaciones comerciales y sus movimientos deben conservar trazabilidad.
        </Typography>
      </Box>
    </Box>}

    {seccion === 'historial' && <Box>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
        <HistoryOutlinedIcon fontSize="small" />
        <Typography variant="subtitle1" fontWeight={800}>Historial integral del contrato</Typography>
        <Chip size="small" variant="outlined" label="Trazabilidad" />
      </Stack>
      <HistorialIntegralMembresia membresia={membresia} />
    </Box>}
  </Box>;
}
