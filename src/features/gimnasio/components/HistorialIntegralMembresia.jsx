import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Chip, CircularProgress, Stack, Typography,
  TableBody, TableCell, TableHead, TableRow, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { formStyles } from '../../../styles/formStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { uiTokens } from '../../../styles/uiTokens.js';

const fecha = value => {
  if (!value) return '—';
  const text = String(value).slice(0, 10);
  const parts = text.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : text;
};
const fechaHora = value => {
  if (!value) return 'Fecha sin registrar';
  const d = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? String(value)
    : d.toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' });
};
const dinero = value => {
  if (value === undefined || value === null || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n)
    ? new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n) : '—';
};
const tituloTipo = {
  CONTRATACION: 'Contratación original',
  MODIFICACION: 'Modificación administrativa',
  ACTUALIZAR_CONTRATO: 'Actualización contractual',
  RENOVACION_MANUAL: 'Renovación manual',
  CONGELAR: 'Congelación registrada',
  PROGRAMAR_CONGELACION: 'Congelación programada',
  REPROGRAMAR_CONGELACION: 'Cambio de fechas de congelación',
  CANCELAR_CONGELACION: 'Cancelación de congelación',
  REACTIVAR: 'Reactivación de membresía',
  CERRAR: 'Cierre de membresía',
  REABRIR: 'Reapertura de membresía',
};
const fechaCampo = campo => /fecha|inicio|fin|vigencia|vencimiento/i.test(campo);
const etiquetaCampo = {
  fecha_inicio: 'Inicio', fecha_fin: 'Fin', fecha_fin_prevista: 'Fin autorizado',
  fecha_fin_real: 'Último día suspendido', fecha_fin_original: 'Vencimiento anterior',
  fecha_fin_ajustada: 'Vencimiento proyectado', fecha_fin_anterior: 'Vencimiento anterior',
  fecha_fin_nueva: 'Nuevo vencimiento', dias_reconocidos: 'Días reconocidos',
  dias_previstos: 'Días previstos', fecha_regreso: 'Regreso efectivo',
  fecha_inicio_original: 'Inicio original', fecha_fin_propuesta: 'Vencimiento propuesto',
  periodo_id: 'Período agregado', cuota_id: 'Cuota agregada',
  numero_periodo_nuevo: 'Número del período nuevo',
  precio: 'Importe de renovación', tipo: 'Modalidad',
  sedes_autorizadas: 'Sedes autorizadas', sede_id: 'Sede principal',
  dias_gracia: 'Días de gracia', estado: 'Estado',
};
const valor = (input, campo) => {
  if (input === null || input === undefined || input === '') return '—';
  if (typeof input === 'boolean') return input ? 'Sí' : 'No';
  if (fechaCampo(campo) && typeof input === 'string') return fecha(input);
  if (campo === 'precio' || campo === 'precio_aplicado') return dinero(input);
  if (Array.isArray(input)) return input.map(x => typeof x === 'object'
    ? (x?.nombre || x?.id || 'Registro') : String(x)).join(', ') || '—';
  return typeof input === 'object' ? 'Consultar el registro' : String(input);
};

function Dato({ label, value, destacado = false }) {
  return <Box sx={{
    minWidth: 0, p: 1.35, borderRadius: 1.5, border: '1px solid',
    borderColor: destacado ? uiTokens.colores.acentoBorde : 'divider',
    bgcolor: destacado ? uiTokens.colores.acentoSuave : 'background.paper',
  }}>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
      {value}
    </Typography>
  </Box>;
}

function DetalleEvento({ evento }) {
  const d = evento.detalle || {};
  const cambios = d.cambios && typeof d.cambios === 'object' ? Object.entries(d.cambios) : [];
  const campos = evento.categoria === 'CICLO_VIDA'
    ? [
      ['fecha_regreso', d.fecha_regreso || (evento.tipo === 'REACTIVAR' ? evento.fecha_efectiva : null)],
      ['fecha_inicio', d.inicio || d.fecha_inicio || evento.suspension?.fecha_inicio],
      ['fecha_fin_prevista', d.fin_previsto || d.fecha_fin_prevista || evento.suspension?.fecha_fin_prevista],
      ['fecha_fin_real', d.fecha_fin_real || evento.suspension?.fecha_fin_real],
      ['dias_reconocidos', d.dias_reconocidos || (evento.tipo === 'REACTIVAR' ? evento.suspension?.dias_reconocidos : null)],
      ['dias_previstos', d.dias_previstos],
      ['fecha_fin_anterior', d.fecha_fin_anterior || d.fecha_fin_original || evento.suspension?.fecha_fin_original],
      ['fecha_fin_nueva', d.fecha_fin_nueva || d.fecha_fin_ajustada || evento.suspension?.fecha_fin_ajustada],
      ['tipo', d.tipo || evento.suspension?.tipo],
    ] : evento.tipo === 'RENOVACION_MANUAL'
      ? [
        ['numero_periodo_nuevo', d.numero_periodo_nuevo],
        ['fecha_inicio', d.fecha_inicio],
        ['fecha_fin', d.fecha_fin],
        ['precio', d.precio],
        ['periodo_id', d.periodo_id],
        ['cuota_id', d.cuota_id],
      ] : [];

  return <Stack spacing={1.25}>
    {evento.fecha_efectiva && <Typography variant="caption" color="text.secondary">
      Fecha efectiva: {fecha(evento.fecha_efectiva)}
    </Typography>}
    {evento.motivo && <Dato label="Motivo o justificación" value={evento.motivo}/>}
    {cambios.map(([campo, cambio]) => <Box key={campo} sx={{ minWidth: 0 }}>
      <Typography variant="caption" fontWeight={800}>
        {etiquetaCampo[campo] || campo.replaceAll('_', ' ')}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 1, mt: 0.5 }}>
        <Dato label="Anterior" value={valor(cambio?.antes, campo)}/>
        <Dato label="Nuevo" value={valor(cambio?.despues, campo)} destacado/>
      </Box>
    </Box>)}
    {d.antes && d.despues && <Box sx={{ display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
      <Dato label="Programación anterior"
        value={`${fecha(d.antes.fecha_inicio)} – ${fecha(d.antes.fecha_fin_prevista)}`}/>
      <Dato label="Programación nueva"
        value={`${fecha(d.despues.fecha_inicio)} – ${fecha(d.despues.fecha_fin_prevista)}`} destacado/>
    </Box>}
    {campos.filter(([, v]) => v !== undefined && v !== null).length > 0 &&
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))' },
        gap: 1 }}>
        {campos.filter(([, v]) => v !== undefined && v !== null)
          .map(([campo, dato]) => <Dato key={campo}
            label={etiquetaCampo[campo] || campo} value={valor(dato, campo)}/>)}
      </Box>}
    {!cambios.length && !campos.some(([, v]) => v !== undefined && v !== null)
      && !evento.motivo && <Typography variant="body2" color="text.secondary">
        Movimiento registrado sin detalles adicionales.
      </Typography>}
  </Stack>;
}

import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

/**
 * Historial real del contrato: listado con paginación de 5 y detalle interno.
 * Mantiene la lectura de eventos del servicio existente, sin alterar auditoría.
 */
export function HistorialIntegralMembresia({ membresia }) {
  const [historial, setHistorial] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const [seleccionado, setSeleccionado] = useState(null);
  const id = membresia?.id;

  useEffect(() => {
    if (!id) return;
    let vigente = true;
    setHistorial(null);
    setCargando(true);
    setError('');
    setSeleccionado(null);
    setBusqueda('');
    setPagina(1);
    gimnasioServicio.obtenerHistorialIntegralMembresia(id)
      .then(datos => { if (vigente) setHistorial(datos); })
      .catch(e => {
        if (vigente) setError(Object.values(e?.response?.data?.errors || {}).flat().find(Boolean)
          || e?.response?.data?.mensaje || 'No se pudo consultar el historial.');
      })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [id]);

  const eventos = useMemo(() => historial?.eventos || [], [historial]);
  const filtrados = useMemo(() => eventos.filter(e => [
    tituloTipo[e.tipo] || e.tipo,
    e.categoria, e.fecha, e.fecha_efectiva, e.autor_nombre, e.motivo,
  ].some(v => String(v || '').toLocaleLowerCase('es-EC').includes(busqueda.toLocaleLowerCase('es-EC')))), [eventos, busqueda]);
  const paginaActual = Math.max(1, Math.min(pagina, Math.ceil(filtrados.length / porPagina) || 1));
  const visibles = filtrados.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);

  return <Box sx={{ width: '100%', minWidth: 0 }}>
    {cargando && <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
      <CircularProgress size={18} />
      <Typography variant="body2">Consultando movimientos…</Typography>
    </Stack>}
    {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
    <GestionToolbar total={filtrados.length} busqueda={busqueda}
      onBusqueda={valor => { setBusqueda(valor); setPagina(1); }} />
    <TablaGestion total={eventos.length} filtrados={filtrados.length} cargando={cargando}
      page={paginaActual} onPageChange={setPagina} rowsPerPage={porPagina}
      onRowsPerPageChange={valor => { setPorPagina(valor); setPagina(1); }}>
      <TableHead><TableRow>
        <TableCell>Movimiento</TableCell>
        <TableCell>Fecha</TableCell>
        <TableCell>Responsable</TableCell>
        <TableCell>Tipo</TableCell>
        <TableCell align="center">Acciones</TableCell>
      </TableRow></TableHead>
      <TableBody>
        {visibles.map((evento, index) => <TableRow key={evento.id || `${evento.tipo}-${evento.fecha}-${index}`} hover>
          <TableCell>
            <Typography variant="body2" fontWeight={700}>
              {tituloTipo[evento.tipo] || evento.tipo?.replaceAll('_', ' ') || 'Movimiento'}
            </Typography>
          </TableCell>
          <TableCell>{fechaHora(evento.fecha)}</TableCell>
          <TableCell>{evento.autor_nombre || 'Sistema / no disponible'}</TableCell>
          <TableCell><Chip size="small" variant="outlined"
            label={evento.categoria === 'CICLO_VIDA' ? 'Ciclo de vida' : 'Comercial'}/></TableCell>
          <TableCell align="center">
            <Tooltip title="Ver detalle del movimiento">
              <IconButton size="small" sx={dbanuStyles.actionView}
                aria-label="Ver detalle del movimiento"
                onClick={() => setSeleccionado(evento)}>
                <VisibilityOutlinedIcon sx={{ fontSize: 18 }}/>
              </IconButton>
            </Tooltip>
          </TableCell>
        </TableRow>)}
        {!cargando && !visibles.length && <TableRow>
          <TableCell colSpan={5} align="center">
            {busqueda ? 'No hay movimientos que coincidan con la búsqueda.' : 'Sin movimientos registrados.'}
          </TableCell>
        </TableRow>}
      </TableBody>
    </TablaGestion>

    <Dialog
      open={Boolean(seleccionado)}
      onClose={() => setSeleccionado(null)}
      fullWidth
      maxWidth="md"
      aria-labelledby="detalle-movimiento-membresia-titulo"
      PaperProps={{ sx: { borderRadius: 2, maxHeight: '90vh' } }}
    >
      {seleccionado && <>
        <DialogTitle sx={{ ...formStyles.modalHeader, gap: 1.5, pr: 1.5 }}>
          <Box sx={{
            ...formStyles.modalIcono,
            bgcolor: uiTokens.colores.acentoSuave,
            border: `1px solid ${uiTokens.colores.acentoBorde}`,
            color: uiTokens.colores.textoFuerte,
            boxShadow: 'none',
          }}>
            <HistoryOutlinedIcon />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography id="detalle-movimiento-membresia-titulo"
              variant="subtitle1" fontWeight={850} sx={{ overflowWrap: 'anywhere' }}>
              {tituloTipo[seleccionado.tipo] || seleccionado.tipo?.replaceAll('_', ' ') || 'Detalle del movimiento'}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {membresia?.codigo_contrato || 'Contrato'} · {fechaHora(seleccionado.fecha)}
            </Typography>
          </Box>
          <Tooltip title="Cerrar">
            <IconButton aria-label="Cerrar detalle" size="small"
              onClick={() => setSeleccionado(null)} sx={{ color: 'text.secondary', alignSelf: 'flex-start' }}>
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: { xs: 2, sm: 2.5 }, py: 2.5 }}>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.25,
            mb: 2,
          }}>
            <Dato label="Responsable"
              value={seleccionado.autor_nombre || 'Sistema / autor no disponible'} />
            <Dato label="Tipo de movimiento"
              value={seleccionado.categoria === 'CICLO_VIDA' ? 'Ciclo de vida' : 'Comercial'} />
          </Box>
          <Typography sx={{ ...formStyles.modalSeccionTitulo, mb: 1.25 }}>
            Información registrada
          </Typography>
          <DetalleEvento evento={seleccionado} />
        </DialogContent>
        <Divider />
        <DialogActions sx={{ ...dbanuStyles.dialogActions, py: 1.5 }}>
          <BotonCancelar texto="Cerrar" onClick={() => setSeleccionado(null)} />
        </DialogActions>
      </>}
    </Dialog>
  </Box>;
}
