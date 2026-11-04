import { useEffect, useState } from 'react';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { HistorialIntegralMembresia } from './HistorialIntegralMembresia.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';

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

function DatoContrato({ titulo, valor }) {
  return <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.45 }}>
      {titulo}
    </Typography>
    <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
      {valor ?? '—'}
    </Typography>
  </Box>;
}

function OperacionContrato({ icono, titulo, descripcion, onClick, disabled = false }) {
  return <Button
    variant="outlined"
    fullWidth
    disabled={disabled}
    onClick={onClick}
    sx={{
      ...dbanuStyles.secondaryButtonRevive,
      minHeight: 64,
      px: 1.5,
      py: 1,
      gap: 1.5,
      justifyContent: 'flex-start',
      textAlign: 'left',
      alignItems: 'center',
      bgcolor: 'background.paper',
      '& .MuiButton-startIcon': { display: 'none' },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', flexShrink: 0 }}>
      {icono}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="body2" fontWeight={800} color="text.primary" sx={{ textTransform: 'none' }}>
        {titulo}
      </Typography>
      <Typography variant="caption" color="text.secondary" component="div"
        sx={{ lineHeight: 1.35, fontWeight: 400, textTransform: 'none' }}>
        {descripcion}
      </Typography>
    </Box>
    <ChevronRightOutlinedIcon sx={{ fontSize: 19, color: 'text.secondary', flexShrink: 0 }} />
  </Button>;
}

/**
 * Pantalla de detalle dentro del Paper 2 existente del perfil integral.
 * La cabecera del perfil (Paper 1) y las pestañas del Paper 2 no se modifican.
 * La sección principal muestra información y operaciones simultáneamente,
 * de acuerdo con el diseño aprobado de REVIVE.
 */
export function DetalleMembresiaCliente({
  membresia, onVolver, onEditar, onGestionarCicloVida, onRenovar,
}) {
  const [mostrandoHistorial, setMostrandoHistorial] = useState(false);

  useEffect(() => { setMostrandoHistorial(false); }, [membresia?.id]);

  if (!membresia) return null;

  const congelada = String(membresia.estado || '').toUpperCase() === 'CONGELADA';
  const tienePeriodos = membresia.cantidad_periodos_contratados != null;
  const nombre = [membresia.plan_nombre, membresia.modalidad_nombre].filter(Boolean).join(' · ') || 'Membresía';

  return <Box sx={{ width: '100%', minWidth: 0, pb: 0.5 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between"
      gap={2} sx={{ mb: 2.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 0.35 }}>
          Detalle de membresía
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
          {nombre}
        </Typography>
        {membresia.codigo_contrato && <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.25 }}>
          Contrato: {membresia.codigo_contrato}
        </Typography>}
      </Box>
      <Stack direction="row" gap={1.5} alignItems="center"
        justifyContent={{ xs: 'space-between', sm: 'flex-end' }} sx={{ flexShrink: 0 }}>
        <StatusChip estado={String(membresia.estado || '').toLowerCase()} />
        <Button variant="outlined" startIcon={<ArrowBackOutlinedIcon />}
          sx={{ ...dbanuStyles.backButton, flexShrink: 0 }}
          onClick={mostrandoHistorial ? () => setMostrandoHistorial(false) : onVolver}>
          {mostrandoHistorial ? 'Volver al detalle' : 'Volver al listado'}
        </Button>
      </Stack>
    </Stack>

    {mostrandoHistorial ? <Box sx={{ pt: 1 }}>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
        <HistoryOutlinedIcon fontSize="small" />
        <Typography variant="subtitle1" fontWeight={800}>
          Historial integral de la membresía
        </Typography>
      </Stack>
      <HistorialIntegralMembresia membresia={membresia} />
    </Box> : <>
      <Divider sx={{ mb: 2.5 }} />
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1.65fr) minmax(340px, 1fr)' },
        gap: { xs: 3, lg: 3.5 },
        alignItems: 'start',
      }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...formStyles.modalSeccionTitulo, fontSize: 16, mb: 2 }}>
            Información de la asignación
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
            columnGap: 3, rowGap: 2.5, mb: 2.5,
          }}>
            <DatoContrato titulo="Plan" valor={membresia.plan_nombre} />
            <DatoContrato titulo="Modalidad" valor={membresia.modalidad_nombre || 'Sin modalidad'} />
            <DatoContrato titulo="Inicio de vigencia" valor={fecha(membresia.fecha_inicio)} />
            <DatoContrato titulo="Fin de vigencia" valor={fecha(membresia.fecha_fin)} />
            <DatoContrato titulo="Precio registrado" valor={importe(membresia.precio_aplicado)} />
            <DatoContrato titulo="Estado contractual" valor={membresia.estado || '—'} />
          </Box>
          <Button variant="outlined" startIcon={<EditOutlinedIcon />}
            sx={dbanuStyles.secondaryButtonRevive} onClick={() => onEditar(membresia)}>
            Editar membresía
          </Button>
        </Box>
        <Box sx={{
          minWidth: 0,
          borderLeft: { xs: 'none', lg: '1px solid' },
          borderTop: { xs: '1px solid', lg: 'none' },
          borderColor: 'divider',
          pl: { xs: 0, lg: 3 },
          pt: { xs: 2.5, lg: 0 },
        }}>
          <Typography sx={{ ...formStyles.modalSeccionTitulo, fontSize: 16, mb: 2 }}>
            Operaciones y trazabilidad
          </Typography>
          <Stack spacing={1.25}>
            <OperacionContrato
              icono={<AcUnitOutlinedIcon fontSize="small" />}
              titulo="Congelación y reactivación"
              descripcion="Suspensiones, reactivaciones y ajustes de vigencia"
              onClick={() => onGestionarCicloVida(membresia)}
            />
            {tienePeriodos && <OperacionContrato
              icono={<AutorenewOutlinedIcon fontSize="small" />}
              titulo="Renovaciones"
              descripcion={congelada ? 'Requiere reactivación previa' : 'Períodos y condiciones comerciales'}
              disabled={congelada}
              onClick={() => onRenovar(membresia)}
            />}
            <OperacionContrato
              icono={<HistoryOutlinedIcon fontSize="small" />}
              titulo="Historial integral"
              descripcion="Movimientos, responsables y auditoría"
              onClick={() => setMostrandoHistorial(true)}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
            Las operaciones disponibles dependen del estado y de las reglas comerciales del contrato.
          </Typography>
        </Box>
      </Box>
    </>}
  </Box>;
}
