import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {
  Chip,
  IconButton,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const CORTO = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
  DOMINGO: 'Dom',
};

const resumirDias = (valor = '') => {
  const dias = String(valor)
    .split(',')
    .map((dia) => dia.trim().toUpperCase())
    .filter(Boolean);

  const posiciones = dias.map((dia) => DIAS.indexOf(dia)).filter((i) => i >= 0);
  const consecutivos = posiciones.length > 1
    && posiciones.every((posicion, indice) => indice === 0 || posicion === posiciones[indice - 1] + 1);

  if (consecutivos) {
    return `${CORTO[dias[0]]}–${CORTO[dias[dias.length - 1]]}`;
  }

  return dias.map((dia) => CORTO[dia] || dia).join(', ');
};

const fecha = (valor) => (valor ? String(valor).slice(0, 10) : null);

const nombreEntrenador = (item) =>
  [item.entrenador_nombres, item.entrenador_apellidos].filter(Boolean).join(' ')
  || item.entrenador_nombre
  || 'Sin entrenador';

const disponibilidad = (item) => {
  if (!item.dia_semana) return 'Sin detalle';
  const inicio = item.hora_inicio ? String(item.hora_inicio).slice(0, 5) : '';
  const fin = item.hora_fin ? String(item.hora_fin).slice(0, 5) : '';
  return `${resumirDias(item.dia_semana)} · ${inicio}-${fin}`;
};

export function AsignacionesClienteTable({
  asignaciones = [],
  cargando = false,
  onFinalizar,
}) {
  const ordenadas = [...asignaciones].sort((a, b) => {
    const aActivo = String(a.estado || '').toUpperCase() === 'ACTIVO' ? 1 : 0;
    const bActivo = String(b.estado || '').toUpperCase() === 'ACTIVO' ? 1 : 0;

    if (aActivo !== bActivo) return bActivo - aActivo;

    const aFecha = String(a.fecha_inicio || '');
    const bFecha = String(b.fecha_inicio || '');
    return bFecha.localeCompare(aFecha);
  });

  return (
    <TablaGestion
      total={ordenadas.length}
      filtrados={ordenadas.length}
      cargando={cargando}
      textoResumen={`${ordenadas.length} asignación(es) registrada(s)`}
    >
      <TableHead>
        <TableRow>
          <TableCell>Entrenador</TableCell>
          <TableCell>Disponibilidad</TableCell>
          <TableCell>Sede</TableCell>
          <TableCell>Vigencia</TableCell>
          <TableCell>Estado</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {ordenadas.map((item) => {
          const activa = String(item.estado || '').toUpperCase() === 'ACTIVO';
          const desde = fecha(item.fecha_inicio);
          const hasta = activa ? 'Actual' : (fecha(item.fecha_fin) || '—');

          return (
            <TableRow key={item.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {nombreEntrenador(item)}
                </Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">{disponibilidad(item)}</Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">{item.sede_nombre || 'Sin sede'}</Typography>
              </TableCell>

              <TableCell>
                <Typography variant="body2">
                  {desde || '—'} → {hasta}
                </Typography>
              </TableCell>

              <TableCell>
                <Chip
                  label={activa ? 'VIGENTE' : (item.estado || 'FINALIZADO')}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 800, height: 24 }}
                />
              </TableCell>

              <TableCell align="right">
                {activa && onFinalizar ? (
                  <Tooltip title="Finalizar asignación">
                    <IconButton
                      sx={dbanuStyles.actionDelete}
                      size="small"
                      onClick={() => onFinalizar(item)}
                    >
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Typography variant="caption" color="text.secondary">—</Typography>
                )}
              </TableCell>
            </TableRow>
          );
        })}

        {ordenadas.length === 0 ? (
          <TablaEstadoFila
            colSpan={6}
            cargando={cargando}
            texto="Este cliente todavía no tiene asignaciones registradas."
          />
        ) : null}
      </TableBody>
    </TablaGestion>
  );
}
