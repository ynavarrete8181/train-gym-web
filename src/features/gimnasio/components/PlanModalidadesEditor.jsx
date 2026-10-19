import { useState } from 'react';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';

const nuevaModalidad = () => ({
  id: null,
  codigo: '',
  nombre: '',
  descripcion: '',
  dias_por_semana: 3,
  usos_por_semana: 3,
  uso_ilimitado: false,
  tipo_duracion: 'SEMANAS',
  duracion: 4,
  precio_base: 0,
  tarifa_inscripcion: 0,
  modelo_cobro: 'FIJO_POR_PERIODO',
  momento_cobro: 'ANTICIPADO',
  permite_prorrateo: false,
  permite_extension: true,
  extension_automatica: false,
  permite_rollover: false,
  activo: true,
  precio_por_sede: false,
  precios_sede: [],
});

export function PlanModalidadesEditor({ modalidades = [], onChange, sedes = [], onAvisar }) {
  const [form, setForm] = useState(nuevaModalidad());
  const [indiceEdicion, setIndiceEdicion] = useState(null);
  const [vistaInterna, setVistaInterna] = useState('listado');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const [filtros, setFiltros] = useState({ nombre: [], frecuencia: [], duracion: [], precio: [], cobro: [], estado: [] });

  const valoresFila = (m) => ({
    nombre: String(m.nombre || ''),
    frecuencia: m.uso_ilimitado ? 'Ilimitado' : `${m.usos_por_semana || m.dias_por_semana || 0} uso(s)/sem.`,
    duracion: `${m.duracion} ${String(m.tipo_duracion || '').toLowerCase()}`,
    precio: `${Number(m.precio_base || 0).toFixed(2)}`,
    cobro: m.modelo_cobro === 'PRORRATEO_POR_SEMANAS_UTILIZADAS' ? 'Prorrateado' : 'Fijo',
    estado: m.activo ? 'ACTIVA' : 'INACTIVA',
  });
  const modalidadesFiltradas = modalidades
    .map((modalidad, index) => ({ modalidad, index, celdas: valoresFila(modalidad) }))
    .filter(({ modalidad, celdas }) => {
      const texto = [modalidad.codigo, ...Object.values(celdas)].join(' ').toLocaleLowerCase('es');
      return texto.includes(busqueda.trim().toLocaleLowerCase('es'))
        && Object.entries(filtros).every(([campo, seleccion]) => !seleccion.length || seleccion.includes(celdas[campo]));
    });
  const opcionesColumna = (campo) => [...new Set(modalidades.map((m) => valoresFila(m)[campo]))]
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map((valor) => ({ value: valor, label: valor }));
  const cambiarFiltro = (campo, valor) => {
    setFiltros((actual) => ({ ...actual, [campo]: valor }));
    setPagina(1);
  };


  const avisar = (mensaje, tipo = 'warning') => onAvisar?.(mensaje, tipo);

  const cambiar = (e) => {
    const { name, value, checked, type } = e.target;
    setForm((prev) => {
      const siguiente = { ...prev, [name]: type === 'checkbox' ? checked : value };

      if (name === 'uso_ilimitado' && checked) {
        siguiente.dias_por_semana = '';
        siguiente.usos_por_semana = '';
      }

      if (name === 'dias_por_semana' && !prev.uso_ilimitado) {
        siguiente.usos_por_semana = value;
      }

      if (name === 'modelo_cobro') {
        if (value === 'PRORRATEO_POR_SEMANAS_UTILIZADAS') {
          siguiente.permite_prorrateo = true;
          siguiente.momento_cobro = 'VENCIDO';
        } else {
          siguiente.permite_prorrateo = false;
        }
      }

      if (name === 'permite_extension' && !checked) {
        siguiente.extension_automatica = false;
      }

      if (name === 'precio_por_sede' && !checked) {
        siguiente.precios_sede = [];
      }

      return siguiente;
    });
  };

  // Solo se persisten excepciones de precio; las demás sedes usan precio_base.
  const fijarPrecioSede = (sedeId, habilitado) => {
    setForm((prev) => {
      const actuales = prev.precios_sede || [];
      const precios_sede = habilitado
        ? [...actuales.filter((p) => Number(p.sede_id) !== Number(sedeId)), {
            sede_id: Number(sedeId), precio: String(prev.precio_base ?? 0),
          }]
        : actuales.filter((p) => Number(p.sede_id) !== Number(sedeId));
      return { ...prev, precios_sede };
    });
  };

  const cambiarPrecioSede = (sedeId, precio) => setForm((prev) => ({
    ...prev,
    precios_sede: (prev.precios_sede || []).map((p) => Number(p.sede_id) === Number(sedeId)
      ? { ...p, precio } : p),
  }));

  const limpiar = () => {
    setForm(nuevaModalidad());
    setIndiceEdicion(null);
    setVistaInterna('listado');
  };

  const iniciarNueva = () => {
    setForm(nuevaModalidad());
    setIndiceEdicion(null);
    setVistaInterna('formulario');
  };

  const agregarOActualizar = () => {
    if (!String(form.nombre || '').trim()) {
      avisar('Ingresa el nombre de la modalidad.');
      return;
    }

    if (!form.uso_ilimitado && (!form.dias_por_semana || !form.usos_por_semana)) {
      avisar('Define los días y usos permitidos por semana.');
      return;
    }

    if (!Number(form.duracion) || Number(form.duracion) < 1) {
      avisar('La duración de la modalidad debe ser mayor a 0.');
      return;
    }

    if (form.precio_base === '' || !Number.isFinite(Number(form.precio_base)) || Number(form.precio_base) < 0) {
      avisar('El precio base de la modalidad no puede ser negativo.');
      return;
    }

    const precios = form.precio_por_sede ? (form.precios_sede || []) : [];
    if (precios.some((fila) => !fila.sede_id || fila.precio === '' || !Number.isFinite(Number(fila.precio)) || Number(fila.precio) < 0)) {
      avisar('Completa o elimina las filas incompletas de precios por sede.');
      return;
    }

    const sedesIds = precios.map((fila) => String(fila.sede_id));
    if (new Set(sedesIds).size !== sedesIds.length) {
      avisar('No puedes registrar dos precios para la misma sede.');
      return;
    }

    const modalidad = {
      ...form,
      dias_por_semana: form.uso_ilimitado ? null : Number(form.dias_por_semana),
      usos_por_semana: form.uso_ilimitado ? null : Number(form.usos_por_semana),
      duracion: Number(form.duracion),
      precio_base: Number(form.precio_base || 0),
      tarifa_inscripcion: Number(form.tarifa_inscripcion || 0),
      precios_sede: precios.map((fila) => ({
        ...fila,
        sede_id: Number(fila.sede_id),
        precio: Number(fila.precio),
      })),
    };

    const nuevas = [...modalidades];
    if (indiceEdicion === null) nuevas.push(modalidad);
    else nuevas[indiceEdicion] = modalidad;

    onChange(nuevas);
    limpiar();
  };

  const editar = (modalidad, index) => {
    setForm({
      ...nuevaModalidad(),
      ...modalidad,
      precio_por_sede: Boolean((modalidad.precios_sede || []).length),
      precios_sede: modalidad.precios_sede || [],
    });
    setIndiceEdicion(index);
    setVistaInterna('formulario');
  };

  const eliminar = (index) => {
    onChange(modalidades.filter((_, i) => i !== index));
    if (indiceEdicion === index) limpiar();
  };

  return (
    <Box sx={formStyles.seccion}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 2, gap: 2 }}>
        <Typography sx={formStyles.modalSeccionTitulo}>Modalidades del plan</Typography>
        {vistaInterna === 'formulario' && (
          <Box sx={{ ml: 'auto', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
            <BotonVolver onClick={limpiar} />
          </Box>
        )}
      </Box>

      {vistaInterna === 'formulario' ? (
        <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: 1, alignItems: 'start', mt: 1 }}>
        <TextField label="Nombre de modalidad" name="nombre" value={form.nombre} onChange={cambiar} required size="small" />
        <TextField label="Días/sem." name="dias_por_semana" type="number" value={form.dias_por_semana ?? ''} onChange={cambiar} disabled={form.uso_ilimitado} size="small" inputProps={{ min: 1, max: 7 }} />
        <TextField label="Usos/sem." name="usos_por_semana" type="number" value={form.usos_por_semana ?? ''} onChange={cambiar} disabled={form.uso_ilimitado} size="small" inputProps={{ min: 1, max: 30 }} />
        <TextField select label="Duración" name="tipo_duracion" value={form.tipo_duracion} onChange={cambiar} size="small">
          <MenuItem value="DIAS">Días</MenuItem>
          <MenuItem value="SEMANAS">Semanas</MenuItem>
          <MenuItem value="MESES">Meses</MenuItem>
          <MenuItem value="ANIOS">Años</MenuItem>
        </TextField>
        <TextField label="Cantidad" name="duracion" type="number" value={form.duracion} onChange={cambiar} size="small" inputProps={{ min: 1 }} />
        <TextField label="Precio ($)" name="precio_base" type="number" value={form.precio_base} onChange={cambiar} size="small" inputProps={{ min: 0, step: '0.01' }} />
        {/* Modelo y momento de cobro se conservan en los datos existentes; no son de uso habitual. */}
      </Box>

      <Box sx={{ mt: 1.5, border: '1px solid #dbe5f0', borderRadius: 2, p: 1.5, bgcolor: '#f8fafc' }}>
        <Stack spacing={1}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800}>Tarifas por sede</Typography>
              <Typography variant="caption" color="text.secondary">Opcional · Precios diferentes por sede</Typography>
            </Box>
            <FormControlLabel
              sx={{ m: 0 }}
              control={<Switch size="small" name="precio_por_sede" checked={Boolean(form.precio_por_sede)} onChange={cambiar} />}
              label="Personalizar"
            />
          </Stack>
          {form.precio_por_sede && (
            <Stack spacing={1}>
              {sedes.length === 0 && (
                <Typography color="text.secondary" variant="body2">No se encontraron sedes configuradas.</Typography>
              )}
              {sedes.map((sede) => {
                const especial = (form.precios_sede || []).find((p) => Number(p.sede_id) === Number(sede.id_sede));
                const habilitado = Boolean(especial);
                return (
                  <Box key={sede.id_sede} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(180px, 1fr) minmax(200px, 1fr)' }, alignItems: 'center', gap: 1.5, px: 1.5, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: '#fff' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{sede.nombre}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {habilitado ? 'Tarifa específica' : `Precio general: $${Number(form.precio_base || 0).toFixed(2)}`}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                      <FormControlLabel
                        sx={{ m: 0 }}
                        control={<Switch size="small" checked={habilitado} onChange={(e) => fijarPrecioSede(sede.id_sede, e.target.checked)} />}
                        label={<Typography variant="caption">Personalizar</Typography>}
                      />
                      {habilitado && (
                        <TextField
                          label="Precio especial ($)" size="small" type="number"
                          value={especial.precio}
                          onChange={(e) => cambiarPrecioSede(sede.id_sede, e.target.value)}
                          inputProps={{ min: 0, step: '0.01' }}
                          sx={{ maxWidth: 170 }}
                        />
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

        </Stack>
      </Box>

      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
        <FormControlLabel sx={{ m: 0 }} control={<Switch size="small" name="activo" checked={Boolean(form.activo)} onChange={cambiar} />} label="Activa" />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, ml: 'auto' }}>
          <BotonCancelar onClick={limpiar} />
          <BotonGuardar onClick={agregarOActualizar} texto={indiceEdicion !== null ? 'Guardar cambios' : 'Agregar'} />
        </Box>
      </Box>

        </Box>
      ) : (
        <Box>
      <Box sx={{ mt: 1 }}>
        <GestionToolbar total={modalidadesFiltradas.length} busqueda={busqueda}
          onBusqueda={(valor) => { setBusqueda(valor); setPagina(1); }}
          acciones={<Button startIcon={<AddOutlinedIcon />} onClick={iniciarNueva}>Añadir</Button>} />
        <TablaGestion total={modalidades.length} filtrados={modalidadesFiltradas.length}
          page={pagina} rowsPerPage={porPagina}
          onPageChange={setPagina}
          onRowsPerPageChange={(cantidad) => { setPorPagina(cantidad); setPagina(1); }}>
          <TableHead>
            <TableRow>
              {[
                ['nombre', 'Modalidad'], ['frecuencia', 'Frecuencia'], ['duracion', 'Duración'],
                ['precio', 'Precio'], ['cobro', 'Cobro'], ['estado', 'Estado'],
              ].map(([campo, titulo]) => (
                <FilterHeaderCell key={campo} value={filtros[campo]}
                  onChange={(valor) => cambiarFiltro(campo, valor)}
                  options={opcionesColumna(campo)}>{titulo}</FilterHeaderCell>
              ))}
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modalidadesFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina).map(({ modalidad, index, celdas }) => (
              <TableRow key={modalidad.id || 'draft-' + index} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={700}>{modalidad.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{modalidad.codigo || 'Se genera al guardar'}</Typography>
                </TableCell>
                <TableCell>{celdas.frecuencia}</TableCell>
                <TableCell>{celdas.duracion}</TableCell>
                <TableCell>
                  <Typography variant="body2">{celdas.precio}</Typography>
                  {(modalidad.precios_sede || []).length > 0 &&
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {modalidad.precios_sede.length} tarifa(s) por sede
                    </Typography>}
                </TableCell>
                <TableCell>{celdas.cobro}</TableCell>
                <TableCell><Chip size="small" label={celdas.estado} variant="outlined" sx={{ fontWeight: 800 }} /></TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="Editar modalidad">
                      <IconButton size="small" onClick={() => editar(modalidad, index)} sx={dbanuStyles.actionEdit}>
                        <EditOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Quitar modalidad">
                      <IconButton size="small" onClick={() => eliminar(index)} sx={dbanuStyles.actionDelete}>
                        <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {modalidadesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {modalidades.length === 0 ? 'No se encontraron modalidades.' : 'No se encontraron resultados.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TablaGestion>
      </Box>
        </Box>
      )}
    </Box>
  );
}
