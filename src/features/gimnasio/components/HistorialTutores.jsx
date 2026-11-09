import { Box, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { formatearFechaLocal } from '../../../utils/fechaLocal.js';

export const RELACIONES_TUTOR = { PADRE: 'Padre', MADRE: 'Madre', TUTOR: 'Tutor', REPRESENTANTE_LEGAL: 'Representante legal', OTRO: 'Otro' };

export const textoRelacion = (item) => RELACIONES_TUTOR[item.tipo_relacion] || item.tipo_relacion || '';

// Ejemplo: "jueves, 12 de noviembre de 2026, 10:30".
export const fechaVinculo = (valor) => (valor ? formatearFechaLocal(valor, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
}) : 'Sin fecha');

const COLUMNAS = {
  tutor: (item) => item.nombre_completo || '',
  relacion: textoRelacion,
  desde: (item) => fechaVinculo(item.fecha_inicio),
  hasta: (item) => (item.fecha_fin ? fechaVinculo(item.fecha_fin) : 'Actualidad'),
  motivo: (item) => item.motivo_fin || 'Sin motivo',
  quitado: (item) => item.finalizado_por_nombre || 'Sin registro',
  estado: (item) => (item.activo ? 'Vigente' : 'Finalizado'),
};

const OPCIONES_TABLA = { sinOrdenar: ['desde', 'hasta'] };

export function HistorialTutores({ historial = [] }) {
  const { filtro, visibles, sinResultados, propsTabla } = useTablaLocal(historial, COLUMNAS, OPCIONES_TABLA);

  if (historial.length === 0) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" fontWeight={800} sx={{ mb: 1 }}>Historial de tutores</Typography>
      <TablaGestion {...propsTabla}>
        <TableHead>
          <TableRow>
            <FilterHeaderCell {...filtro('tutor')}>Tutor</FilterHeaderCell>
            <FilterHeaderCell {...filtro('relacion')}>Relación</FilterHeaderCell>
            <FilterHeaderCell {...filtro('desde')}>Desde</FilterHeaderCell>
            <FilterHeaderCell {...filtro('hasta')}>Hasta</FilterHeaderCell>
            <FilterHeaderCell {...filtro('motivo')}>Motivo</FilterHeaderCell>
            <FilterHeaderCell {...filtro('quitado')}>Quitado por</FilterHeaderCell>
            <FilterHeaderCell {...filtro('estado')}>Estado</FilterHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibles.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>{item.nombre_completo}</Typography>
                <Typography variant="caption" color="text.secondary">{item.identificacion || 'Sin identificación'}</Typography>
              </TableCell>
              <TableCell>{COLUMNAS.relacion(item)}</TableCell>
              <TableCell>{COLUMNAS.desde(item)}</TableCell>
              <TableCell>{COLUMNAS.hasta(item)}</TableCell>
              <TableCell>{item.motivo_fin || '—'}</TableCell>
              <TableCell>{item.finalizado_por_nombre || '—'}</TableCell>
              <TableCell>
                <StatusChip estado={item.activo ? 'activo' : 'cerrado'} label={COLUMNAS.estado(item)} />
              </TableCell>
            </TableRow>
          ))}
          {sinResultados ? <TablaEstadoFila colSpan={7} texto="No hay registros con estos filtros." /> : null}
        </TableBody>
      </TablaGestion>
    </Box>
  );
}
