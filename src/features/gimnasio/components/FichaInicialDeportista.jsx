import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Divider, IconButton, MenuItem, Paper, Stack, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { FotosEvaluacionDeportista } from './FotosEvaluacionDeportista.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const secciones = [
  { id: 'antecedentes', titulo: 'Antecedentes de salud', icono: HealthAndSafetyOutlinedIcon, campos: [['descripcion', 'Descripción', true], ['tipo', 'Tipo de antecedente'], ['restricciones', 'Restricciones o precauciones', true], ['observaciones', 'Observaciones', true]] },
  { id: 'evaluacion', titulo: 'Evaluación física', icono: MonitorHeartOutlinedIcon, campos: [['peso_kg', 'Peso (kg)'], ['talla_cm', 'Estatura (cm)'], ['cintura_cm', 'Cintura (cm)'], ['grasa_corporal_pct', 'Grasa corporal (%)'], ['movilidad', 'Movilidad y pruebas funcionales', true], ['observaciones', 'Observaciones', true]] },
  { id: 'objetivos', titulo: 'Objetivos deportivos', icono: FlagOutlinedIcon, campos: [['objetivo', 'Objetivo', true], ['indicador', 'Indicador de evaluación'], ['valor_inicial', 'Valor inicial'], ['valor_meta', 'Meta esperada'], ['observaciones', 'Observaciones', true]] },
  { id: 'valoracion', titulo: 'Valoración profesional', icono: AssignmentTurnedInOutlinedIcon, campos: [['conclusiones', 'Conclusiones', true], ['recomendaciones', 'Recomendaciones', true], ['observaciones', 'Observaciones', true]] },
];
const TIPOS_ANTECEDENTES = [{ value: 'LESION', label: 'Lesión' }, { value: 'CONDICION', label: 'Condición de salud' }, { value: 'RESTRICCION', label: 'Restricción de actividad' }, { value: 'OTRO', label: 'Otro antecedente' }];
const PRUEBAS = [
  { codigo: 'FLEXIONES', nombre: 'Flexiones', unidad: 'repeticiones', sentido: 'MAYOR' },
  { codigo: 'PLANCHA', nombre: 'Plancha abdominal', unidad: 'segundos', sentido: 'MAYOR' },
  { codigo: 'CARRERA_2KM', nombre: 'Carrera 2 km', unidad: 'segundos', sentido: 'MENOR' },
];
const OBJETIVOS = [
  ['FUERZA', 'Mejorar fuerza'], ['RESISTENCIA', 'Mejorar resistencia'], ['MOVILIDAD', 'Mejorar movilidad'],
  ['COMPOSICION', 'Composición corporal'], ['ADHERENCIA', 'Constancia en el entrenamiento'],
];
const hoy = () => new Date().toLocaleDateString('en-CA');
const limpio = () => ({ titulo: '', fecha_registro: hoy(), fecha_inicio: '', fecha_fin: '', proximo_control: '', datos: {} });
const mostrarFecha = (fecha) => fecha ? String(fecha).substring(0, 10).split('-').reverse().join('/') : '—';

const CampoFecha = ({ etiqueta, valor, onChange, obligatorio = false }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography component="label" sx={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'text.secondary', mb: 0.6 }}>
      {etiqueta}{obligatorio ? ' *' : ''}
    </Typography>
    <TextField
      fullWidth
      type="date"
      size="small"
      value={valor || ''}
      onChange={(evento) => onChange(evento.target.value)}
      inputProps={{ 'aria-label': etiqueta }}
      sx={dbanuStyles.field}
    />
  </Box>
);


export function FichaInicialDeportista({ deportistaId, onNotificacion }) {
  const [seccion, setSeccion] = useState('antecedentes');
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [vista, setVista] = useState('listado');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const [form, setForm] = useState(limpio);
  const [ver, setVer] = useState(null);
  const [error, setError] = useState('');
  const actual = secciones.find((s) => s.id === seccion) || secciones[0];

  useEffect(() => {
    if (!deportistaId) return;
    let activo = true;
    setCargando(true);
    setError('');
    setVista('listado');
    setVer(null);
    gimnasioServicio.obtenerValoracionesDeportista(deportistaId, seccion)
      .then((r) => { if (activo) setRegistros(Array.isArray(r.datos) ? r.datos : []); })
      .catch((e) => {
        if (!activo) return;
        const mensaje = e.response?.status === 500
          ? 'No se pudo cargar el historial. Verifica las migraciones de valoración en la base de desarrollo.'
          : e.response?.data?.mensaje || 'No se pudo consultar el historial.';
        setError(mensaje);
        onNotificacion?.(mensaje, 'error');
      })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [deportistaId, seccion]);

  const filtrados = useMemo(() => registros.filter((r) => {
    const coincideTexto = !busqueda || [r.titulo, ...Object.values(r.datos || {})]
      .some((v) => String(v ?? '').toLocaleLowerCase('es').includes(busqueda.toLocaleLowerCase('es')));
    return coincideTexto;
  }), [registros, busqueda]);

  const paginaRegistros = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina);
  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));
  const guardar = async () => {
    if (!form.titulo.trim() || !form.fecha_registro || !actual.campos.some(([campo]) => String(form.datos[campo] ?? '').trim())) {
      onNotificacion?.('Completa título, fecha y al menos un dato de la valoración.', 'warning');
      return;
    }
    setGuardando(true);
    try {
      await gimnasioServicio.crearValoracionDeportista(deportistaId, {
        seccion, titulo: form.titulo.trim(), fecha_registro: form.fecha_registro,
        fecha_inicio: form.fecha_inicio || null, fecha_fin: form.fecha_fin || null,
        proximo_control: form.proximo_control || null, datos: form.datos,
      });
      const res = await gimnasioServicio.obtenerValoracionesDeportista(deportistaId, seccion);
      setRegistros(Array.isArray(res.datos) ? res.datos : []);
      setForm(limpio());
      setVista('listado');
      setVer(null);
      onNotificacion?.('Valoración registrada correctamente.', 'success');
    } catch (e) {
      const errores = e.response?.data?.errors;
      const mensaje = errores ? Object.values(errores).flat()[0] : e.response?.data?.mensaje || 'No se pudo guardar el registro.';
      onNotificacion?.(mensaje, e.response?.status === 422 ? 'warning' : 'error');
    } finally { setGuardando(false); }
  };

  if (!deportistaId) return <Alert severity="info">Guarda primero los datos del cliente.</Alert>;

  return <Box sx={{ mt: 0.5 }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2, gap: 1 }}>
      <Box>
        <Typography sx={{ fontWeight: 850, fontSize: 15 }}>Ficha de valoración y seguimiento</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>Historial de antecedentes, controles físicos, objetivos y valoraciones.</Typography>
      </Box>
      <Chip size="small" variant="outlined" label="Seguimiento continuo" />
    </Stack>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '224px minmax(0,1fr)' }, gap: 1.5, alignItems: 'start' }}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', p: 0.75 }}>
        {secciones.map((s) => {
          const Icono = s.icono;
          const seleccionado = s.id === seccion;
          return <Box key={s.id} component="button" type="button" onClick={() => { setSeccion(s.id); setPagina(1); setForm(limpio()); }}
            sx={{ width: '100%', display: 'flex', alignItems: 'center', textAlign: 'left', gap: 1, p: 1.4,
              fontSize: 12, fontWeight: seleccionado ? 850 : 650, cursor: 'pointer',
              color: seleccionado ? 'primary.main' : 'text.primary',
              bgcolor: seleccionado ? uiTokens.colores.primarioSuave : 'transparent',
              border: 0, borderLeft: seleccionado ? `3px solid ${uiTokens.colores.primario}` : '3px solid transparent',
              borderRadius: 0.5, '&:hover': { bgcolor: uiTokens.colores.primarioSuave } }}>
            <Icono sx={{ fontSize: 18, flexShrink: 0 }} />{s.titulo}
          </Box>;
        })}
      </Paper>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: { xs: 2, md: 2.5 }, minWidth: 0 }}>
        {vista !== 'listado' && <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 850, fontSize: 14 }}>{vista === 'nuevo' ? `Nuevo registro · ${actual.titulo}` : `Detalle · ${actual.titulo}`}</Typography>
          </Box>
          <Box sx={{ ml: 'auto', flexShrink: 0 }}><BotonVolver disabled={guardando} onClick={() => { setVista('listado'); setVer(null); }} /></Box>
        </Stack>}
        {vista === 'nuevo' && <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>
            <TextField size="small" label="Título del registro *" value={form.titulo} onChange={(e) => cambiar('titulo', e.target.value)} sx={{ ...dbanuStyles.field, gridColumn: '1 / -1' }} />
            <CampoFecha etiqueta="Fecha del registro" obligatorio valor={form.fecha_registro} onChange={(valor) => cambiar('fecha_registro', valor)} />
            <CampoFecha etiqueta="Próximo control" valor={form.proximo_control} onChange={(valor) => cambiar('proximo_control', valor)} />
            {(seccion === 'antecedentes' || seccion === 'objetivos') && <>
              <CampoFecha etiqueta="Fecha de inicio" valor={form.fecha_inicio} onChange={(valor) => cambiar('fecha_inicio', valor)} />
              <CampoFecha etiqueta="Fecha de finalización" valor={form.fecha_fin} onChange={(valor) => cambiar('fecha_fin', valor)} />
            </>}
            {seccion === 'evaluacion' && <>
              <TextField select size="small" label="Prueba física estandarizada" value={form.datos.prueba_codigo || ''}
                onChange={(e) => {
                  const prueba = PRUEBAS.find((item) => item.codigo === e.target.value);
                  setForm((prev) => ({ ...prev, datos: { ...prev.datos, prueba_codigo: prueba?.codigo || '',
                    prueba_unidad: prueba?.unidad || '', prueba_valor: '', prueba_protocolo: '' } }));
                }} sx={dbanuStyles.field}>
                <MenuItem value="">Sin prueba adicional</MenuItem>
                {PRUEBAS.map((prueba) => <MenuItem key={prueba.codigo} value={prueba.codigo}>{prueba.nombre} · {prueba.unidad}</MenuItem>)}
              </TextField>
              {form.datos.prueba_codigo && <TextField size="small" type="number" label={`Resultado (${form.datos.prueba_unidad})`}
                value={form.datos.prueba_valor ?? ''} onChange={(e) => setForm((prev) => ({ ...prev,
                  datos: { ...prev.datos, prueba_valor: e.target.value } }))} sx={dbanuStyles.field} />}
              {form.datos.prueba_codigo && <TextField size="small" label="Protocolo o condiciones de medición"
                value={form.datos.prueba_protocolo || ''} onChange={(e) => setForm((prev) => ({ ...prev,
                  datos: { ...prev.datos, prueba_protocolo: e.target.value } }))} sx={{ ...dbanuStyles.field, gridColumn: '1 / -1' }} />}
            </>}
            {seccion === 'objetivos' && <>
              <TextField select size="small" label="Categoría del objetivo" value={form.datos.objetivo_codigo || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, datos: { ...prev.datos, objetivo_codigo: e.target.value } }))}
                sx={dbanuStyles.field}>
                <MenuItem value="">Seleccionar</MenuItem>
                {OBJETIVOS.map(([codigo, etiqueta]) => <MenuItem key={codigo} value={codigo}>{etiqueta}</MenuItem>)}
              </TextField>
              <TextField size="small" type="number" label="Plazo previsto (semanas)" value={form.datos.plazo_semanas ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, datos: { ...prev.datos, plazo_semanas: e.target.value } }))}
                sx={dbanuStyles.field} />
            </>}
            {actual.campos.map(([campo, etiqueta, multilinea]) => {
              if (seccion === 'antecedentes' && campo === 'tipo') return <TextField key={campo} select size="small"
                label={etiqueta} value={form.datos[campo] ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, datos: { ...prev.datos, [campo]: e.target.value } }))}
                sx={dbanuStyles.field}>
                <MenuItem value="">Seleccionar</MenuItem>
                {TIPOS_ANTECEDENTES.map((tipo) => <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>)}
              </TextField>;
              return <TextField key={campo} size="small" label={etiqueta} fullWidth
                type={seccion === 'evaluacion' && ['peso_kg','talla_cm','cintura_cm','grasa_corporal_pct'].includes(campo) ? 'number' : 'text'}
                multiline={Boolean(multilinea)} minRows={multilinea ? 2 : undefined}
                value={form.datos[campo] ?? ''}
                onChange={(e) => setForm((prev) => ({ ...prev, datos: { ...prev.datos, [campo]: e.target.value } }))}
                sx={{ ...dbanuStyles.field, gridColumn: multilinea ? '1 / -1' : 'auto' }} />;
            })}

          </Box>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" sx={{ ...dbanuStyles.formActions, px: 0, pb: 0, mt: 0, justifyContent: 'flex-end' }}>
            <BotonGuardar guardando={guardando} onClick={guardar} />
          </Stack>
        </Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {vista === 'listado' && <>
          {seccion === 'evaluacion' && <Alert severity="info" sx={{ mb: 1.5 }}>
            Para subir fotografías de evolución, primero guarda una evaluación física. Después utiliza «Añadir foto» en su fila.
          </Alert>}
          <GestionToolbar
            total={filtrados.length}
            busqueda={busqueda}
            onBusqueda={(valor) => { setBusqueda(valor); setPagina(1); }}
            acciones={<Button startIcon={<AddOutlinedIcon />} onClick={() => { setVista('nuevo'); setForm(limpio()); }} disabled={cargando || Boolean(error)}>Añadir</Button>}

          />
          <TablaGestion total={registros.length} filtrados={filtrados.length} page={pagina} rowsPerPage={porPagina}
            onPageChange={setPagina} onRowsPerPageChange={(cantidad) => { setPorPagina(cantidad); setPagina(1); }} cargando={cargando}>
            <TableHead><TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Registro</TableCell>
              <TableCell>Próximo control</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {paginaRegistros.map((registro) => <TableRow key={registro.id} hover>
                <TableCell>{mostrarFecha(registro.fecha_registro)}</TableCell>
                <TableCell>{registro.titulo}</TableCell>
                <TableCell>{mostrarFecha(registro.proximo_control)}</TableCell>
                <TableCell><StatusChip estado={String(registro.estado || 'ACTIVO').toLowerCase()} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Ver detalle">
                    <IconButton sx={dbanuStyles.actionView} onClick={() => { setVer(registro); setVista('detalle'); }}>
                      <VisibilityOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                  {seccion === 'evaluacion' && <Tooltip title="Añadir foto a esta evaluación">
                    <IconButton sx={dbanuStyles.actionView} aria-label="Añadir foto"
                      onClick={() => { setVer(registro); setVista('detalle'); }}>
                      <AddPhotoAlternateOutlinedIcon sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>}
                </TableCell>
              </TableRow>)}
              {!paginaRegistros.length && !cargando && <TableRow><TableCell colSpan={5} align="center">No se encontraron registros.</TableCell></TableRow>}
            </TableBody>
          </TablaGestion>
        </>}
        {vista === 'detalle' && ver && <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Typography fontWeight={800} sx={{ mb: 1 }}>{ver.titulo} · {mostrarFecha(ver.fecha_registro)}</Typography>
          {actual.campos.map(([campo, etiqueta]) => ver.datos?.[campo] !== undefined && ver.datos?.[campo] !== '' ? <Typography key={campo} variant="body2" sx={{ mb: 0.5 }}><strong>{etiqueta}:</strong> {ver.datos[campo]}</Typography> : null)}
          <Typography variant="caption" color="text.secondary">Registrado por usuario #{ver.registrado_por}</Typography>
          {seccion === "evaluacion" && <FotosEvaluacionDeportista deportistaId={deportistaId} registro={ver} onNotificacion={onNotificacion} />}
        </Box>}
      </Paper>
    </Box>
  </Box>;
}
