import { useEffect, useState } from 'react';
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography, Chip } from '@mui/material';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { PestanasEstandar } from '../../../components/common/PestanasEstandar.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { DeportistasTable } from '../components/DeportistasTable.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { formStyles } from '../../../styles/formStyles.js';

const TABS = [
  { value: 'datos', label: 'Datos del cliente', icon: <BadgeOutlinedIcon sx={{ fontSize: 17 }} /> },
  { value: 'membresia', label: 'Membresía', icon: <CardMembershipOutlinedIcon sx={{ fontSize: 17 }} /> },
];

const estadoColor = (estado) => {
  const valor = String(estado || '').toUpperCase();
  if (valor === 'ACTIVA') return 'success';
  if (valor === 'PENDIENTE_PAGO') return 'warning';
  if (valor === 'CANCELADA' || valor === 'VENCIDA') return 'error';
  return 'default';
};

export function ClientesSupervisorPage() {
  const [vista, setVista] = useState('lista');
  const [tab, setTab] = useState('datos');
  const [clientes, setClientes] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 5 });
  const [filtrosColumna, setFiltrosColumna] = useState({ codigo: [], nombres: [], telefono: [], sede: [], estado: [] });
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const avisar = (mensaje, tipo = 'info') => setNotificacion({ mensaje, tipo });

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const response = await gimnasioServicio.obtenerDeportistas(params);
      setClientes(response.datos || []);
      setMeta(response.meta || {});
    } catch (error) {
      avisar(error.response?.data?.mensaje || 'Error al cargar los clientes', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const buscar = () => {
    const nuevos = { ...filtros, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const aplicarFiltroColumna = (columna, valor) => {
    const nuevosColumna = { ...filtrosColumna, [columna]: valor };
    const nuevos = { ...filtros, ...nuevosColumna, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevosColumna);
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const abrirFicha = async (fila) => {
    setCargando(true);
    try {
      const response = await gimnasioServicio.obtenerDeportistaPorId(fila.id);
      setCliente(response.datos || fila);
      setTab('datos');
      setVista('ficha');
    } catch (error) {
      avisar(error.response?.data?.mensaje || 'Error al cargar la ficha del cliente', 'error');
    } finally {
      setCargando(false);
    }
  };

  const guardar = async () => {
    try {
      await gimnasioServicio.actualizarDeportista(cliente.id, cliente);
      avisar('Datos comerciales del cliente actualizados', 'success');
      await cargar();
    } catch (error) {
      avisar(error.response?.data?.mensaje || 'Error al guardar el cliente', 'error');
    }
  };

  if (vista === 'ficha' && cliente) {
    const membresias = cliente.membresias || [];
    return (
      <>
        <PageHeader
          titulo={`Ficha de ${cliente.usuario_nombre || cliente.name || 'cliente'}`}
          descripcion="Vista comercial del cliente para supervisión de ventas."
          icono={<PeopleAltOutlinedIcon />}
        />
        <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 2 }}>
          <PestanasEstandar value={tab} onChange={(_, value) => setTab(value)} opciones={TABS} />
          <Box sx={{ p: 2 }}>
            {tab === 'datos' ? (
              <Stack spacing={2}>
                <Box sx={formStyles.seccion}>
                  <Typography sx={formStyles.modalSeccionTitulo}>Información comercial</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                    <TextField label="Cliente" value={cliente.usuario_nombre || cliente.name || ''} size="small" disabled />
                    <TextField label="Código Cliente" value={cliente.codigo_deportista || ''} size="small" disabled />
                    <TextField label="Sede principal" value={cliente.sede_nombre || 'No asignada'} size="small" disabled />
                    <TextField label="Teléfono" value={cliente.telefono || ''} size="small" onChange={(e) => setCliente((actual) => ({ ...actual, telefono: e.target.value }))} />
                    <TextField select label="Estado" value={cliente.estado || 'PROSPECTO'} size="small" onChange={(e) => setCliente((actual) => ({ ...actual, estado: e.target.value }))}>
                      <MenuItem value="PROSPECTO">Prospecto</MenuItem>
                      <MenuItem value="ACTIVO">Activo</MenuItem>
                      <MenuItem value="INACTIVO">Inactivo</MenuItem>
                      <MenuItem value="SUSPENDIDO">Suspendido</MenuItem>
                    </TextField>
                    <TextField label="Fecha de nacimiento" type="date" value={cliente.fecha_nacimiento ? String(cliente.fecha_nacimiento).slice(0, 10) : ''} size="small" disabled slotProps={{ inputLabel: { shrink: true } }} />
                  </Box>
                </Box>
                <Box sx={formStyles.seccion}>
                  <Typography sx={formStyles.modalSeccionTitulo}>Contacto</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                    <TextField label="Contacto de emergencia" value={cliente.contacto_emergencia_nombre || ''} size="small" onChange={(e) => setCliente((actual) => ({ ...actual, contacto_emergencia_nombre: e.target.value }))} />
                    <TextField label="Teléfono de emergencia" value={cliente.contacto_emergencia_telefono || ''} size="small" onChange={(e) => setCliente((actual) => ({ ...actual, contacto_emergencia_telefono: e.target.value }))} />
                  </Box>
                </Box>
                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                  <Button variant="outlined" color="error" onClick={() => setVista('lista')}>Volver a la lista</Button>
                  <Button variant="contained" onClick={guardar}>Guardar</Button>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" fontWeight={800}>Membresías del cliente</Typography>
                {membresias.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">El cliente no registra membresías.</Typography>
                ) : membresias.map((membresia) => (
                  <Paper key={membresia.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" gap={1}>
                      <Box>
                        <Typography fontWeight={800}>{membresia.plan_nombre || 'Membresía'}</Typography>
                        <Typography variant="body2" color="text.secondary">Contrato: {membresia.codigo_contrato || 'Sin código'}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {membresia.fecha_inicio ? String(membresia.fecha_inicio).slice(0, 10) : 'Sin inicio'} — {membresia.fecha_fin ? String(membresia.fecha_fin).slice(0, 10) : 'Sin fin'}
                        </Typography>
                      </Box>
                      <Chip size="small" label={membresia.estado || 'SIN ESTADO'} color={estadoColor(membresia.estado)} />
                    </Stack>
                  </Paper>
                ))}
                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="outlined" color="error" onClick={() => setVista('lista')}>Volver a la lista</Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </Paper>
        <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ mensaje: '', tipo: 'info' })} />
      </>
    );
  }

  return (
    <>
      <PageHeader titulo="Clientes" descripcion="Directorio comercial de clientes y miembros del gimnasio." icono={<PeopleAltOutlinedIcon />} />
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.5 }}>
          <TextField
            size="small"
            label="Buscar"
            value={filtros.busqueda}
            onChange={(e) => setFiltros((actual) => ({ ...actual, busqueda: e.target.value }))}
            onKeyDown={(e) => { if (e.key === 'Enter') buscar(); }}
            sx={{ minWidth: 280 }}
          />
          <Button variant="contained" onClick={buscar}>Buscar</Button>
        </Stack>
        <DeportistasTable
          deportistas={clientes}
          meta={meta}
          cargando={cargando}
          filtrosColumna={filtrosColumna}
          onFiltroColumna={aplicarFiltroColumna}
          onAbrirFicha={abrirFicha}
          onPageChange={(page) => { const nuevos = { ...filtros, page }; setFiltros(nuevos); cargar(nuevos); }}
          onRowsPerPageChange={(per_page) => { const nuevos = { ...filtros, per_page, page: 1 }; setFiltros(nuevos); cargar(nuevos); }}
        />
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={() => setNotificacion({ mensaje: '', tipo: 'info' })} />
    </>
  );
}
