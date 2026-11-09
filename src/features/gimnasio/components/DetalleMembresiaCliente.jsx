import { useEffect, useState } from 'react';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { HistorialIntegralMembresia } from './HistorialIntegralMembresia.jsx';
import { RenovacionesMembresiaCliente } from './RenovacionesMembresiaCliente.jsx';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import DiscountOutlinedIcon from '@mui/icons-material/DiscountOutlined';
import { SedesMembresia } from './SedesMembresia.jsx';
import { ConfiguracionContrato } from './ConfiguracionContrato.jsx';
import { DescuentosMembresia } from './DescuentosMembresia.jsx';
import { GestionCicloVidaMembresia } from './GestionCicloVidaMembresia.jsx';
import { esPaseDiario, presentarEstadoMembresia, textoVigenciaPase } from './estadoMembresia.js';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
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

export const SECCION_NUEVA_MEMBRESIA = [{ id: 'nueva', nombre: 'Datos del contrato', descripcion: 'Nueva asignación', Icono: CardMembershipOutlinedIcon }];

const SECCIONES_MEMBRESIA = [
  { id: 'informacion', nombre: 'Información', descripcion: 'Datos del contrato', Icono: CardMembershipOutlinedIcon },
  { id: 'sedes', nombre: 'Sedes', descripcion: 'Dónde se vende y se usa', Icono: LocationCityOutlinedIcon },
  { id: 'congelacion', nombre: 'Congelaciones', descripcion: 'Suspensiones y reactivaciones', Icono: AcUnitOutlinedIcon },
  { id: 'renovaciones', nombre: 'Renovaciones', descripcion: 'Períodos registrados', Icono: AutorenewOutlinedIcon },
  { id: 'contrato', nombre: 'Acciones del contrato', descripcion: 'Cancelar, reactivar o reabrir', Icono: GavelOutlinedIcon },
  { id: 'descuentos', nombre: 'Descuentos', descripcion: 'Beneficios dentro del contrato', Icono: DiscountOutlinedIcon },
  { id: 'historial', nombre: 'Historial', descripcion: 'Movimientos', Icono: HistoryOutlinedIcon },
];

function DatoContrato({ titulo, valor }) {
  return <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>{titulo}</Typography>
    <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
      {valor ?? '—'}
    </Typography>
  </Box>;
}

/** Menú lateral de la membresía; Añadir lo usa con una sola sección. */
export function MenuSeccionesMembresia({ secciones, seccion, onSeleccionar }) {
  return (
  <Box component="nav" aria-label="Secciones de la membresía" sx={{
    p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2,
    bgcolor: 'background.paper',
    position: { md: 'sticky' }, top: { md: 16 },
  }}>
    <Typography variant="overline" sx={{
      display: 'block', px: 1.5, pt: 1, pb: 0.5,
      color: 'text.secondary', fontWeight: 850,
    }}>
      Secciones
    </Typography>
    <Stack spacing={0.5}>
      {secciones.map(({ id, nombre: titulo, descripcion, Icono }) => {
        const activo = seccion === id;
        return <Button key={id} type="button" fullWidth
          onClick={() => onSeleccionar?.(id)}
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
  );
}

/**
 * Navegación lateral dentro del Paper 2 existente del perfil integral.
 * Sigue el patrón de secciones de "Datos del cliente" y sus estilos globales.
 * Todas las operaciones comerciales continúan autorizándose en Laravel.
 */
export function DetalleMembresiaCliente({
  membresia, onVolver, onActualizado, sedes = [] }) {
  const [seccion, setSeccion] = useState('informacion');

  useEffect(() => { setSeccion('informacion'); }, [membresia?.id]);

  if (!membresia) return null;

  const tituloSeccion = SECCIONES_MEMBRESIA.find(item => item.id === seccion)?.nombre || 'Información';
  // El Pase Diario no se congela ni se renueva: cada uso es una venta.
  const secciones = esPaseDiario(membresia)
    ? SECCIONES_MEMBRESIA.filter(item => !['congelacion', 'renovaciones'].includes(item.id))
      .map(item => item.id === 'contrato' ? { ...item, descripcion: 'Editar vigencia, cancelar o reabrir' } : item)
    : SECCIONES_MEMBRESIA;
  const estadoVisible = presentarEstadoMembresia(membresia);
  const referenciaContrato = [membresia.plan_nombre, membresia.codigo_contrato].filter(Boolean).join(' · ');

  return <Box sx={{ width: '100%', minWidth: 0 }}>
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '230px minmax(0, 1fr)' },
      gap: 2,
      alignItems: 'start',
    }}>
      <MenuSeccionesMembresia secciones={secciones} seccion={seccion} onSeleccionar={setSeccion} />

      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <Box sx={formStyles.seccion}>
          <Stack direction="row" gap={1.5} sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', mb: 1.75 }}>
            <Box sx={{ minWidth: 0, flex: '1 1 220px' }}>
              <Typography variant="subtitle1" fontWeight={800}>{tituloSeccion}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {referenciaContrato}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}
              sx={{ alignItems: 'center', flexShrink: 0, maxWidth: '100%', columnGap: 2 }}>
              <StatusChip estado={estadoVisible.chip} label={estadoVisible.label}
                sx={{ height: 34, borderRadius: 1, fontWeight: 700,
                  '& .MuiChip-label': { px: 1.25, fontSize: 12 } }} />
              <BotonVolver onClick={onVolver} sx={{
                height: 34, minHeight: 34, minWidth: 0, width: 'auto',
                px: 1.25, ml: 1, fontSize: 12, whiteSpace: 'nowrap',
              }} />
            </Stack>
          </Stack>
          <Divider sx={{ mb: 1.75 }} />

          {seccion === 'informacion' && <>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' },
              columnGap: 2.5, rowGap: 2.5, mb: 3,
            }}>
              <DatoContrato titulo="Plan" valor={membresia.plan_nombre} />
              <DatoContrato titulo="Modalidad" valor={membresia.modalidad_nombre || 'Sin modalidad'} />
              {esPaseDiario(membresia)
                ? <>
                  <DatoContrato titulo="Vigencia" valor={textoVigenciaPase(membresia, fecha)} />
                  <DatoContrato titulo="Última fecha de uso" valor={fecha(membresia.fecha_inicio)} />
                </>
                : <>
                  <DatoContrato titulo="Inicio de vigencia" valor={fecha(membresia.fecha_inicio)} />
                  <DatoContrato titulo="Fin de vigencia" valor={fecha(membresia.fecha_fin)} />
                  {!esPaseDiario(membresia) && <ConfiguracionContrato membresia={membresia} onActualizado={onActualizado} />}
          </>}
              <DatoContrato titulo="Precio registrado" valor={importe(membresia.precio_aplicado)} />
            </Box>
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

          {seccion === 'sedes' && <SedesMembresia membresia={membresia} sedes={sedes} onActualizado={onActualizado} />}

          {seccion === 'descuentos' && <DescuentosMembresia membresia={membresia} onActualizado={onActualizado} />}

          {seccion === 'historial' && <HistorialIntegralMembresia membresia={membresia} />}

          {seccion === 'contrato' && <GestionCicloVidaMembresia
            membresia={membresia}
            integrado
            modo="contrato"
            onActualizado={onActualizado}
          />}
        </Box>
      </Stack>
    </Box>
  </Box>;
}
