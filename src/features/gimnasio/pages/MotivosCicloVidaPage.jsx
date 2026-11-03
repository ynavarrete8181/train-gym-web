import { useCallback, useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Alert, Box, Button, Chip, IconButton, MenuItem, Stack, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { formStyles } from '../../../styles/formStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const operaciones = [
  { value: 'CONGELAR', label: 'Congelaciones' },
  { value: 'REACTIVAR', label: 'Reactivaciones' },
  { value: 'CERRAR', label: 'Cierres y cancelaciones' },
  { value: 'REABRIR', label: 'Reaperturas excepcionales' },
];
const inicial = { codigo: '', nombre: '', operacion: 'CONGELAR', descripcion: '', orden: 100, activo: true };
const errorTexto = e => Object.values(e?.response?.data?.errors || e?.response?.data?.errores || {})
  .flat().find(Boolean) || e?.response?.data?.mensaje || 'No se pudo completar la operación.';

export function MotivosCicloVidaPage() {
  const [datos, setDatos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [operacionFiltro, setOperacionFiltro] = useState('');
  const [edicion, setEdicion] = useState(null);
  const [form, setForm] = useState(inicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [notificacion, setNotificacion] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);

  const cargar = useCallback(async () => {
    setCargando(true);
    try { setDatos(await gimnasioServicio.listarMotivosCicloVida()); setError(''); }
    catch (e) { setError(errorTexto(e)); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => datos.filter(item =>
    (!operacionFiltro || item.operacion === operacionFiltro) &&
    [item.nombre, item.codigo, item.descripcion].some(v =>
      String(v || '').toLocaleLowerCase('es-EC').includes(busqueda.toLocaleLowerCase('es-EC'))
    )), [datos, busqueda, operacionFiltro]);
  const paginaReal = Math.max(1, Math.min(pagina, Math.ceil(filtrados.length / porPagina) || 1));

  const guardar = async () => {
    setError('');
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setError('Completa el código y nombre del motivo.');
      return;
    }
    setGuardando(true);
    try {
      await gimnasioServicio.guardarMotivoCicloVida({
        ...form, codigo: form.codigo.trim().toUpperCase(),
        nombre: form.nombre.trim(), orden: Number(form.orden),
      });
      setEdicion(null); setNotificacion('Motivo guardado correctamente.');
      await cargar();
    } catch (e) { setError(errorTexto(e)); }
    finally { setGuardando(false); }
  };

  return <Box sx={{ width: '100%', pb: 3 }}>
    <PageHeader titulo="Motivos del ciclo de vida" descripcion="Catálogo de motivos de congelación, reactivación, cierre y reapertura." />
    <Box sx={{ ...formStyles.seccion, mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {edicion !== null ? <>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>
            {edicion === 'nuevo' ? 'Añadir motivo' : 'Editar motivo'}
          </Typography>
          <BotonVolver onClick={() => { setEdicion(null); setError(''); }}/>
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
          <TextField size="small" label="Código" required disabled={edicion !== 'nuevo'}
            value={form.codigo} onChange={e => setForm(x => ({ ...x, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}/>
          <TextField size="small" label="Nombre" required value={form.nombre}
            onChange={e => setForm(x => ({ ...x, nombre: e.target.value }))}/>
          <TextField select size="small" label="Operación" disabled={edicion !== 'nuevo'}
            value={form.operacion} onChange={e => setForm(x => ({ ...x, operacion: e.target.value }))}>
            {operaciones.map(x => <MenuItem key={x.value} value={x.value}>{x.label}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Orden" type="number" value={form.orden}
            onChange={e => setForm(x => ({ ...x, orden: e.target.value }))}/>
          <TextField select size="small" label="Estado" value={form.activo ? '1' : '0'}
            onChange={e => setForm(x => ({ ...x, activo: e.target.value === '1' }))}>
            <MenuItem value="1">Activo</MenuItem><MenuItem value="0">Inactivo</MenuItem>
          </TextField>
          <TextField size="small" multiline minRows={2} label="Descripción (opcional)" value={form.descripcion || ''}
            onChange={e => setForm(x => ({ ...x, descripcion: e.target.value }))}/>
        </Box>
        <AccionesFormulario sx={{ mt: 2 }} guardando={guardando} onCancelar={() => setEdicion(null)}
          onGuardar={guardar}/>
      </> : <>
        <GestionToolbar total={filtrados.length} busqueda={busqueda}
          onBusqueda={v => { setBusqueda(v); setPagina(1); }}
          resumen={<TextField select size="small" label="Operación" value={operacionFiltro}
            sx={{ minWidth: 230 }} onChange={e => { setOperacionFiltro(e.target.value); setPagina(1); }}>
            <MenuItem value="">Todas las operaciones</MenuItem>
            {operaciones.map(x => <MenuItem key={x.value} value={x.value}>{x.label}</MenuItem>)}
          </TextField>}
          acciones={<Button startIcon={<AddOutlinedIcon/>} onClick={() => {
            setForm(inicial); setEdicion('nuevo'); setError('');
          }}>Añadir</Button>}/>
        <TablaGestion total={datos.length} filtrados={filtrados.length} page={paginaReal}
          onPageChange={setPagina} rowsPerPage={porPagina}
          onRowsPerPageChange={v => { setPorPagina(v); setPagina(1); }} cargando={cargando}>
          <TableHead><TableRow><TableCell>Código</TableCell><TableCell>Motivo</TableCell>
            <TableCell>Operación</TableCell><TableCell>Estado</TableCell>
            <TableCell align="center">Acciones</TableCell></TableRow></TableHead>
          <TableBody>{filtrados.slice((paginaReal - 1) * porPagina, paginaReal * porPagina).map(item =>
            <TableRow key={item.id} hover>
              <TableCell>{item.codigo}</TableCell><TableCell>{item.nombre}</TableCell>
              <TableCell>{operaciones.find(x => x.value === item.operacion)?.label || item.operacion}</TableCell>
              <TableCell><Chip size="small" variant="outlined" label={item.activo ? 'Activo' : 'Inactivo'}
                color={item.activo ? 'success' : 'default'}/></TableCell>
              <TableCell align="center"><Tooltip title="Editar motivo"><IconButton size="small"
                onClick={() => { setForm({ ...item }); setEdicion(item.id); setError(''); }}>
                <EditOutlinedIcon fontSize="small"/></IconButton></Tooltip></TableCell>
            </TableRow>)}
            {!filtrados.length && <TableRow><TableCell colSpan={5} align="center">
              Sin motivos para mostrar.
            </TableCell></TableRow>}
          </TableBody>
        </TablaGestion>
      </>}
    </Box>
    <NotificacionSnackbar mensaje={notificacion} tipo="success" onClose={() => setNotificacion('')}/>
  </Box>;
}
