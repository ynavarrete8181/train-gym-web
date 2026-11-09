import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import { Box, IconButton, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { fechaVinculo, textoRelacion } from './HistorialTutores.jsx';

const nombreDeportista = (item) => item.nombre_completo || item.codigo_deportista || '';
const textoEstado = (item) => {
  const estado = String(item.estado || '').toLowerCase();
  return estado.charAt(0).toUpperCase() + estado.slice(1);
};

const COLUMNAS_VIGENTES = {
  deportista: nombreDeportista,
  relacion: textoRelacion,
  pago: (item) => (item.responsable_pago ? 'Sí' : 'No'),
  estado: textoEstado,
};

const COLUMNAS_ANTERIORES = {
  deportista: nombreDeportista,
  relacion: textoRelacion,
  desde: (item) => fechaVinculo(item.fecha_inicio),
  hasta: (item) => fechaVinculo(item.fecha_fin),
  motivo: (item) => item.motivo_fin || 'Sin motivo',
};

const OPCIONES_ANTERIORES = { sinOrdenar: ['desde', 'hasta'] };

function CeldaDeportista({ item }) {
  return (
    <TableCell>
      <Typography variant="body2" fontWeight={500}>{nombreDeportista(item)}</Typography>
      <Typography variant="caption" color="text.secondary">{item.identificacion || 'Sin identificación'}</Typography>
    </TableCell>
  );
}

function AccionAbrir({ item, onAbrir }) {
  return (
    <TableCell align="right">
      <Tooltip title="Abrir ficha del cliente">
        <IconButton aria-label="Abrir ficha del cliente" sx={dbanuStyles.actionView} onClick={() => onAbrir(item)}>
          <AssignmentIndOutlinedIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Tooltip>
    </TableCell>
  );
}

export function RepresentadosTutor({ representados = [], anteriores = [], onAbrir }) {
  const vigentes = useTablaLocal(representados, COLUMNAS_VIGENTES);
  const pasados = useTablaLocal(anteriores, COLUMNAS_ANTERIORES, OPCIONES_ANTERIORES);

  return (
    <Box sx={formStyles.seccion}>
      <Typography sx={formStyles.modalSeccionTitulo}>Representados</Typography>
      <TablaGestion {...vigentes.propsTabla}>
        <TableHead>
          <TableRow>
            <FilterHeaderCell {...vigentes.filtro('deportista')}>Deportista</FilterHeaderCell>
            <FilterHeaderCell {...vigentes.filtro('relacion')}>Relación</FilterHeaderCell>
            <FilterHeaderCell {...vigentes.filtro('pago')}>Responsable de pago</FilterHeaderCell>
            <FilterHeaderCell {...vigentes.filtro('estado')}>Estado</FilterHeaderCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {vigentes.visibles.map((item) => (
            <TableRow key={item.id} hover>
              <CeldaDeportista item={item} />
              <TableCell>{textoRelacion(item)}</TableCell>
              <TableCell>{COLUMNAS_VIGENTES.pago(item)}</TableCell>
              <TableCell><StatusChip estado={String(item.estado).toLowerCase()} /></TableCell>
              <AccionAbrir item={item} onAbrir={onAbrir} />
            </TableRow>
          ))}
          {vigentes.sinResultados ? (
            <TablaEstadoFila
              colSpan={5}
              texto={representados.length === 0
                ? 'Sin deportistas a su cargo. Se vinculan desde la sección Tutor de cada deportista.'
                : 'No hay registros con estos filtros.'}
            />
          ) : null}
        </TableBody>
      </TablaGestion>

      {anteriores.length > 0 ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={800} sx={{ mb: 1 }}>Representados anteriores</Typography>
          <TablaGestion {...pasados.propsTabla}>
            <TableHead>
              <TableRow>
                <FilterHeaderCell {...pasados.filtro('deportista')}>Deportista</FilterHeaderCell>
                <FilterHeaderCell {...pasados.filtro('relacion')}>Relación</FilterHeaderCell>
                <FilterHeaderCell {...pasados.filtro('desde')}>Desde</FilterHeaderCell>
                <FilterHeaderCell {...pasados.filtro('hasta')}>Hasta</FilterHeaderCell>
                <FilterHeaderCell {...pasados.filtro('motivo')}>Motivo</FilterHeaderCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pasados.visibles.map((item) => (
                <TableRow key={item.vinculo_id} hover>
                  <CeldaDeportista item={item} />
                  <TableCell>{textoRelacion(item)}</TableCell>
                  <TableCell>{COLUMNAS_ANTERIORES.desde(item)}</TableCell>
                  <TableCell>{COLUMNAS_ANTERIORES.hasta(item)}</TableCell>
                  <TableCell>{item.motivo_fin || '—'}</TableCell>
                  <AccionAbrir item={item} onAbrir={onAbrir} />
                </TableRow>
              ))}
              {pasados.sinResultados ? <TablaEstadoFila colSpan={6} texto="No hay registros con estos filtros." /> : null}
            </TableBody>
          </TablaGestion>
        </Box>
      ) : null}
    </Box>
  );
}
