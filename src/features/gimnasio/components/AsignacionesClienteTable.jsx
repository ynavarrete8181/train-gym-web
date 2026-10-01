import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {
  Chip,
  IconButton,
  Stack,
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

const fecha = (valor) => {
  if (!valor) return '—';
  return String(valor).slice(0, 10);
};

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
  titulo,
  asignaciones = [],
  cargando = false,
  historial = false,
  onFinalizar,
}) {
  const columnas = historial ? 6 : 5;

  return (
    <TablaGestion
      total={asignaciones.length}
      filtrados={asignaciones.length}
      cargando={cargando}
      textoResumen={
        historial
          ? `${asignaciones.length} asignación(es) histórica(s)`
          : `${asignaciones.length} asignación(es) activa(s)`
      }
    >
      <TableHead>
        <TableRow>
          <TableCell>Entrenador</TableCell>
          <TableCell>Disponibilidad</TableCell>
          <TableCell>Sede</TableCell>
          <TableCell>{historial ? 'Vigencia' : 'Desde'}</TableCell>
          {historial ? <TableCell>Estado</TableCell> : null}
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {asignaciones.map((item) => (
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
              {historial ? (
                <Stack spacing={0.2}>
                  <Typography variant="body2">
                    {fecha(item.fecha_inicio)} → {fecha(item.fecha_fin)}
                  </Typography>
                  {item.observaciones ? (
                    <Typography variant="caption" color="text.secondary">
                      {item.observaciones}
                    </Typography>
                  ) : null}
                </Stack>
              ) : (
                <Typography variant="body2">{fecha(item.fecha_inicio)}</Typography>
              )}
            </TableCell>

            {historial ? (
              <TableCell>
                <Chip
                  label={item.estado || 'FINALIZADO'}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 800, height: 24 }}
                />
              </TableCell>
            ) : null}

            <TableCell align="right">
              {!historial && onFinalizar ? (
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
        ))}

        {asignaciones.length === 0 ? (
          <TablaEstadoFila
            colSpan={columnas}
            cargando={cargando}
            texto={
              historial
                ? 'Este cliente todavía no tiene asignaciones finalizadas.'
                : 'Este cliente no tiene entrenador ni horario asignado todavía.'
            }
          />
        ) : null}
      </TableBody>
    </TablaGestion>
  );
}
