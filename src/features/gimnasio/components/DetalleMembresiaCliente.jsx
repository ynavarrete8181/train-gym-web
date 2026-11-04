import { useEffect, useState } from 'react';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { HistorialIntegralMembresia } from './HistorialIntegralMembresia.jsx';
import { RenovacionesMembresiaCliente } from './RenovacionesMembresiaCliente.jsx';
import { GestionCicloVidaMembresia } from './GestionCicloVidaMembresia.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';

const fecha = (valor) => {
  if (!valor) return '—';
  const partes = String(valor).slice(0, 10).split('-');
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(valor);
};

const importe = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '—';
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(numero)
    : '—';
};

const SECCIONES_MEMBRESIA = [
  { id: 'informacion', nombre: 'Información del contrato', descripcion: 'Plan, modalidad y vigencia', Icono: CardMembershipOutlinedIcon },
  { id: 'congelacion', nombre: 'Congelación y reactivación', descripcion: 'Suspensiones y reactivaciones', Icono: AcUnitOutlinedIcon },
  { id: 'renovaciones', nombre: 'Renovaciones', descripcion: 'Períodos y condiciones', Icono: AutorenewOutlinedIcon },
  { id: 'historial', nombre: 'Historial integral', descripcion: 'Movimientos y auditoría', Icono: HistoryOutlinedIcon },
];

function DatoContrato({ titulo, valor }) {
  return <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>{titulo}</Typography>
    <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
      {valor ?? '—'}
    </Typography>
  </Box>;
}

/**
 * Navegación lateral dentro del Paper 2 existente del perfil integral.
 * Sigue el patrón de secciones de "Datos del cliente" y sus estilos globales.
 * Todas las operaciones comerciales continúan autorizándose en Laravel.
 */
export function DetalleMembresiaCliente({
  membresia, onVolver, onEditar, onActualizado,
}) {
  const [seccion, setSeccion] = useState('informacion');

  useEffect(() => { setSeccion('informacion'); }, [membresia?.id]);

  if (!membresia) return null;

  const nombre = [membresia.plan_nombre, membresia.modalidad_nombre].filter(Boolean).join(' · ') || 'Membresía';

  return <Box sx={{ width: '100%', minWidth: 0 }}>
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '230px minmax(0, 1fr)' },
      gap: 2,
      alignItems: 'start',
    }}>
      <Box component="nav" aria-label="Secciones de la membresía" sx={{
        p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2,
        bgcolor: 'background.paper',
        position: { md: 'sticky' }, top: { md: 16 },
      }}>
        <Typography variant="overline" sx={{
          display: 'block', px: 1.5, pt: 1, pb: 0.5,
          color: 'text.secondary', fontWeight: 850,
        }}>
          Membresía
        </Typography>
        <Stack spacing={0.5}>
          {SECCIONES_MEMBRESIA.map(({ id, nombre: titulo, descripcion, Icono }) => {
            const activo = seccion === id;
            return <Button key={id} type="button" fullWidth
              onClick={() => setSeccion(id)}
              aria-current={activo ? 'step' : undefined}
              startIcon={<Icono sx={{ fontSize: 19 }} />}
              sx={{
                justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none',
                borderRadius: 1.5, px: 1.2, py: 1.1, minHeight: 54,
                color: activo ? uiTokens.colores.textoFuerte : 'text.secondary',
                bgcolor: activo ? uiTokens.colores.acento : 'transparent',
                borderLeft: activo ? `3px solid ${uiTokens.colores.acentoOscuro}` : '3px solid transparent',
                '&:hover': {
                  bgcolor: activo ? uiTokens.colores.acentoOscuro : 'action.hover',
                },
                '& .MuiButton-startIcon': { mr: 1.1, flexShrink: 0 },
              }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{
                  fontWeight: activo ? 900 : 700, lineHeight: 1.3,
                  color: activo ? uiTokens.colores.textoFuerte : 'inherit',
                }}>{titulo}</Typography>
                <Typography variant="caption" sx={{
                  display: 'block', fontSize: 10.5, lineHeight: 1.3, mt: 0.25,
                  color: activo ? uiTokens.colores.textoFuerte : 'text.secondary',
                }}>{descripcion}</Typography>
              </Box>
            </Button>;
          })}
        </Stack>
      </Box>

      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <Box sx={formStyles.seccion}>
          <Stack direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between" gap={1.5} sx={{ mb: 2 }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={800}>Detalle de membresía</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {nombre}
              </Typography>
              {membresia.codigo_contrato && <Typography variant="caption" display="block" color="text.secondary">
                Contrato: {membresia.codigo_contrato}
              </Typography>}
            </Box>
            <Stack direction="row" alignItems="center" justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
              gap={1} sx={{ flexShrink: 0 }}>
              <StatusChip estado={String(membresia.estado || '').toLowerCase()} />
              <Button variant="outlined" startIcon={<ArrowBackOutlinedIcon />}
                onClick={onVolver} sx={{ ...dbanuStyles.backButton, whiteSpace: 'nowrap' }}>
                Volver al listado
              </Button>
            </Stack>
          </Stack>
          <Divider sx={{ mb: 2 }} />

          {seccion === 'informacion' && <>
            <Typography sx={{ ...formStyles.modalSeccionTitulo, mb: 2 }}>
              Información de la asignación
            </Typography>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
              columnGap: 2.5, rowGap: 2.5, mb: 3,
            }}>
              <DatoContrato titulo="Plan" valor={membresia.plan_nombre} />
              <DatoContrato titulo="Modalidad" valor={membresia.modalidad_nombre || 'Sin modalidad'} />
              <DatoContrato titulo="Inicio de vigencia" valor={fecha(membresia.fecha_inicio)} />
              <DatoContrato titulo="Fin de vigencia" valor={fecha(membresia.fecha_fin)} />
              <DatoContrato titulo="Precio registrado" valor={importe(membresia.precio_aplicado)} />
              <DatoContrato titulo="Estado contractual" valor={membresia.estado || '—'} />
            </Box>
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="outlined" startIcon={<EditOutlinedIcon />}
                onClick={() => onEditar(membresia)} sx={dbanuStyles.secondaryButtonRevive}>
                Editar membresía
              </Button>
            </Stack>
          </>}

          {seccion === 'congelacion' && <GestionCicloVidaMembresia
            membresia={membresia}
            integrado
            onVolver={() => setSeccion('informacion')}
            onActualizado={onActualizado}
          />}

          {seccion === 'renovaciones' && <RenovacionesMembresiaCliente
            membresia={membresia}
            onActualizado={onActualizado}
          />}

          {seccion === 'historial' && <>
            <Typography sx={{ ...formStyles.modalSeccionTitulo, mb: 1.5 }}>
              Historial integral del contrato
            </Typography>
            <HistorialIntegralMembresia membresia={membresia} />
          </>}
        </Box>
      </Stack>
    </Box>
  </Box>;
}
