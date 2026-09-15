import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { Alert, Box, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const extraerDatos = (respuesta) => respuesta?.datos ?? respuesta?.data ?? [];

export function TrabajoEntrenadorPanel({ tipo }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const esDeportistas = tipo === 'deportistas';
  const config = useMemo(() => esDeportistas
    ? {
        titulo: 'Mis deportistas',
        descripcion: 'Deportistas activos asignados a tu seguimiento.',
        icono: <GroupsOutlinedIcon />,
      }
    : {
        titulo: 'Mi agenda',
        descripcion: 'Horarios y servicios que tienes asignados.',
        icono: <CalendarMonthOutlinedIcon />,
      }, [esDeportistas]);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');

    const cargar = esDeportistas
      ? gimnasioServicio.obtenerMisDeportistasEntrenador
      : gimnasioServicio.obtenerMiAgendaEntrenador;

    cargar()
      .then((respuesta) => {
        if (activo) setItems(extraerDatos(respuesta));
      })
      .catch((err) => {
        if (activo) setError(err?.response?.data?.mensaje || err?.message || 'No se pudo cargar la información.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => { activo = false; };
  }, [esDeportistas]);

  return <Box className="page-wrapper">
    <PageHeader titulo={config.titulo} descripcion={config.descripcion} icono={config.icono} />

    <Paper className="page-content-container" elevation={0} sx={{ p: 2 }}>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {cargando ? <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}><CircularProgress size={28} /></Box> : null}

      {!cargando && !error && items.length === 0 ? <Alert severity="info">
        {esDeportistas ? 'No tienes deportistas activos asignados.' : 'No tienes horarios activos asignados.'}
      </Alert> : null}

      {!cargando && !error && items.length > 0 ? <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {esDeportistas ? <>
                <TableCell>Deportista</TableCell>
                <TableCell>Código</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>Sede</TableCell>
                <TableCell>Días</TableCell>
                <TableCell>Horario</TableCell>
                <TableCell>Estado</TableCell>
              </> : <>
                <TableCell>Horario</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell>Sede</TableCell>
                <TableCell>Días</TableCell>
                <TableCell>Hora</TableCell>
                <TableCell>Capacidad</TableCell>
              </>}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => <TableRow key={item.id} hover>
              {esDeportistas ? <>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{item.deportista_nombre || `${item.deportista_nombres || ''} ${item.deportista_apellidos || ''}`.trim() || '—'}</Typography>
                </TableCell>
                <TableCell>{item.codigo_deportista || '—'}</TableCell>
                <TableCell>{item.servicio_nombre || '—'}</TableCell>
                <TableCell>{item.sede_nombre || '—'}</TableCell>
                <TableCell>{item.dia_semana || '—'}</TableCell>
                <TableCell>{item.hora_inicio && item.hora_fin ? `${item.hora_inicio} - ${item.hora_fin}` : '—'}</TableCell>
                <TableCell><Chip size="small" label={item.estado || 'ACTIVO'} variant="outlined" /></TableCell>
              </> : <>
                <TableCell><Typography variant="body2" fontWeight={600}>{item.nombre || '—'}</Typography></TableCell>
                <TableCell>{item.servicio_nombre || '—'}</TableCell>
                <TableCell>{item.sede_nombre || '—'}</TableCell>
                <TableCell>{item.dia_semana || '—'}</TableCell>
                <TableCell>{item.hora_inicio && item.hora_fin ? `${item.hora_inicio} - ${item.hora_fin}` : '—'}</TableCell>
                <TableCell>{item.capacidad ?? '—'}</TableCell>
              </>}
            </TableRow>)}
          </TableBody>
        </Table>
      </TableContainer> : null}
    </Paper>
  </Box>;
}
