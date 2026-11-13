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
  RENOVACION_AUTOMATICA: 'Renovación automática',
  CONGELAR: 'Congelación registrada',
  PROGRAMAR_CONGELACION: 'Congelación programada',
  REPROGRAMAR_CONGELACION: 'Cambio de fechas de congelación',
  CANCELAR_CONGELACION: 'Cancelación de congelación',
  REACTIVAR: 'Reactivación de membresía',
  CERRAR: 'Cierre de membresía',
  EDITAR_VIGENCIA: 'Cambio de vigencia',
  CAMBIAR_SEDES: 'Cambio de sedes',
  CONFIGURAR_CONTRATO: 'Configuración del contrato',
  DESCUENTO_REGISTRADO: 'Descuento registrado',
  DESCUENTO_EDITADO: 'Descuento editado',
  DESCUENTO_FINALIZADO: 'Descuento finalizado',
  VENTAS_RECALCULADAS: 'Ventas ajustadas al descuento',
  DESCUENTO_AJUSTADO: 'Descuento ajustado al contrato',
  DESCUENTO_RENOVADO: 'Descuento renovado',
  REABRIR: 'Reapertura de membresía',
  EDICION_ADMINISTRATIVA: 'Edición administrativa',
  CAMBIO_PRECIO: 'Cambio de precio del contrato',
  PRECIO_RENOVACION: 'Precio de renovación configurado',
  PRORROGAR_CONGELACION: 'Prórroga de congelación',
  CANCELAR_PROGRAMACION: 'Cancelación de programación',
  CANCELAR: 'Cancelación de membresía',
};
// Un código sin etiqueta propia se muestra igual en formato de oración, nunca en mayúsculas.
const textoTipo = (tipo, vacio) => tituloTipo[tipo]
  || (tipo ? tipo.replaceAll('_', ' ').toLowerCase().replace(/^./, c => c.toUpperCase()) : vacio);
const fechaCampo = campo => /fecha|inicio|fin|vigencia|vencimiento/i.test(campo);
const etiquetaCampo = {
  fecha_inicio: 'Inicio', fecha_fin: 'Fin', fecha_fin_prevista: 'Fin autorizado',
  fecha_fin_real: 'Último día suspendido', fecha_fin_original: 'Vencimiento anterior',
  fecha_fin_ajustada: 'Vencimiento proyectado', fecha_fin_anterior: 'Vencimiento anterior',
  fecha_fin_nueva: 'Nuevo vencimiento', dias_reconocidos: 'Días reconocidos',
  dias_previstos: 'Días previstos', fecha_regreso: 'Regreso efectivo',
  fecha_inicio_original: 'Inicio original', fecha_fin_propuesta: 'Vencimiento propuesto',
  periodo_id: 'Período agregado', cuota_id: 'Cuota agregada',
  vigencia_inicio_anterior: 'Inicio anterior', vigencia_inicio_nueva: 'Nuevo inicio',
  vigencia_fin_anterior: 'Fin anterior', vigencia_fin_nueva: 'Nuevo fin',
  sedes_anteriores: 'Sedes anteriores', sedes_nuevas: 'Sedes nuevas', valor: 'Descuento',
  dias_gracia_anterior: 'Días de gracia anteriores', dias_gracia_nuevo: 'Días de gracia nuevos',
  renovacion_anterior: 'Renovación automática anterior', renovacion_nueva: 'Renovación automática nueva',
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
  const campos = evento.tipo === 'CONFIGURAR_CONTRATO'
    ? [
      ['dias_gracia_anterior', String(d.dias_gracia_anterior ?? '—')], ['dias_gracia_nuevo', String(d.dias_gracia_nuevo ?? '—')],
      ['renovacion_anterior', d.renovacion_automatica_anterior ? 'Activada' : 'No'], ['renovacion_nueva', d.renovacion_automatica_nueva ? 'Activada' : 'No'],
    ]
    : evento.tipo === 'CAMBIAR_SEDES'
    ? [['sedes_anteriores', d.sedes_anteriores], ['sedes_nuevas', d.sedes_nuevas]]
    : String(evento.tipo || '').startsWith('DESCUENTO_')
    ? [
      ['valor', d.tipo === 'PORCENTAJE' ? `${d.valor} %` : `$${Number(d.valor || 0).toFixed(2)}`],
      ['fecha_inicio', d.fecha_inicio],
      ['fecha_fin', d.fecha_fin || 'Sin fin'],
    ]
    : evento.tipo === 'EDITAR_VIGENCIA'
    ? [
      ['vigencia_inicio_anterior', d.vigencia_inicio_anterior || 'Sin límite'],
      ['vigencia_inicio_nueva', d.vigencia_inicio_nueva],
      ['vigencia_fin_anterior', d.vigencia_fin_anterior || 'Sin límite'],
      ['vigencia_fin_nueva', d.vigencia_fin_nueva],
    ] : evento.categoria === 'CICLO_VIDA'
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
    ] : ['RENOVACION_MANUAL', 'RENOVACION_AUTOMATICA'].includes(evento.tipo)
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
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

/**
 * Historial real del contrato: listado con paginación de 5 y detalle interno.
 * Mantiene la lectura de eventos del servicio existente, sin alterar auditoría.
 */
/** Fechas del período o vigencia que deja el movimiento, cuando las tiene. */
const rangoEvento = (evento) => {
  const d = evento.detalle || {};
  if (evento.tipo === 'EDITAR_VIGENCIA') return [d.vigencia_inicio_nueva, d.vigencia_fin_nueva];
  if (['RENOVACION_MANUAL', 'RENOVACION_AUTOMATICA'].includes(evento.tipo)) return [d.fecha_inicio, d.fecha_fin];
  if (evento.suspension) return [evento.suspension.fecha_inicio, evento.suspension.fecha_fin_real || evento.suspension.fecha_fin_prevista];
  return [d.fecha_inicio || d.inicio, d.fecha_fin || d.fin_previsto || d.fecha_fin_nueva];
};

const COLUMNAS_MOVIMIENTOS = {
  movimiento: (evento) => textoTipo(evento.tipo, 'Movimiento'),
  fecha: (evento) => fechaHora(evento.fecha),
  inicio: (evento) => (rangoEvento(evento)[0] ? fecha(rangoEvento(evento)[0]) : '—'),
  fin: (evento) => (rangoEvento(evento)[1] ? fecha(rangoEvento(evento)[1]) : '—'),
  responsable: (evento) => evento.autor_nombre || 'Sistema (automático)',
  tipo: (evento) => (evento.categoria === 'CICLO_VIDA' ? 'Ciclo de vida' : 'Comercial'),
};
const OPCIONES_MOVIMIENTOS = { sinOrdenar: ['fecha', 'inicio', 'fin'] };

export function HistorialIntegralMembresia({ membresia }) {
  const [historial, setHistorial] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
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
    textoTipo(e.tipo, ''),
    e.categoria, e.fecha, e.fecha_efectiva, e.autor_nombre, e.motivo,
  ].some(v => String(v || '').toLocaleLowerCase('es-EC').includes(busqueda.toLocaleLowerCase('es-EC')))), [eventos, busqueda]);
  const tabla = useTablaLocal(filtrados, COLUMNAS_MOVIMIENTOS, OPCIONES_MOVIMIENTOS);
  const { visibles } = tabla;

  return <Box sx={{ width: '100%', minWidth: 0 }}>
    {cargando && <Stack direction="row" gap={1} sx={{ alignItems: 'center', mb: 1 }}>
      <CircularProgress size={18} />
      <Typography variant="body2">Consultando movimientos…</Typography>
    </Stack>}
    {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}
    <GestionToolbar total={filtrados.length} busqueda={busqueda}
      onBusqueda={setBusqueda} />
    <TablaGestion {...tabla.propsTabla} total={eventos.length} cargando={cargando}>
      <TableHead><TableRow>
        <FilterHeaderCell {...tabla.filtro('movimiento')}>Movimiento</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('fecha')}>Registrado</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('inicio')}>Fecha inicio</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('fin')}>Fecha fin</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('responsable')}>Responsable</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('tipo')}>Tipo</FilterHeaderCell>
        <TableCell align="center">Acciones</TableCell>
      </TableRow></TableHead>
      <TableBody>
        {visibles.map((evento, index) => <TableRow key={evento.id || `${evento.tipo}-${evento.fecha}-${index}`} hover>
          <TableCell>
            <Typography variant="body2" fontWeight={700}>
              {textoTipo(evento.tipo, 'Movimiento')}
            </Typography>
          </TableCell>
          <TableCell>{fechaHora(evento.fecha)}</TableCell>
          <TableCell sx={{ whiteSpace: 'nowrap' }}>{COLUMNAS_MOVIMIENTOS.inicio(evento)}</TableCell>
          <TableCell sx={{ whiteSpace: 'nowrap' }}>{COLUMNAS_MOVIMIENTOS.fin(evento)}</TableCell>
          <TableCell>{evento.autor_nombre || 'Sistema (automático)'}</TableCell>
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
          <TableCell colSpan={7} align="center">
            {eventos.length ? 'No hay movimientos con estos filtros.' : 'Sin movimientos registrados.'}
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
      slotProps={{ paper: { sx: { borderRadius: 2, maxHeight: '90vh' } } }}
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
              {textoTipo(seleccionado.tipo, 'Detalle del movimiento')}
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
              value={seleccionado.autor_nombre || 'Sistema (automático)'} />
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
