import { useState } from 'react';
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
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5, gap: 1 }}>
        <Typography sx={formStyles.modalSeccionTitulo}>Modalidades del plan</Typography>
        {vistaInterna === 'listado' && (
          <Button startIcon={<AddOutlinedIcon />} onClick={iniciarNueva} sx={dbanuStyles.addButtonRevive}>Añadir</Button>
        )}
      </Stack>

      {vistaInterna === 'formulario' ? (
        <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>{indiceEdicion !== null ? 'Editar modalidad' : 'Nueva modalidad'}</Typography>
          <Typography variant="caption" color="text.secondary">Configura frecuencia, duración y precio.</Typography>
        </Box>
        <Button size="small" onClick={limpiar} sx={dbanuStyles.secondaryButtonRevive}>Volver</Button>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.5fr .8fr .8fr 1fr .7fr 1fr' }, gap: 1, alignItems: 'start', mt: 1 }}>
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

      <Box sx={{ mt: 1, border: '1px solid #dbe5f0', borderRadius: 2, p: 1.5, bgcolor: '#f8fafc' }}>
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

      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="flex-end" spacing={1} sx={{ mt: 1.25 }}>
        <FormControlLabel sx={{ mr: { sm: 'auto' }, ml: 0 }} control={<Switch size="small" name="activo" checked={Boolean(form.activo)} onChange={cambiar} />} label="Activa" />
        <Button onClick={limpiar} sx={dbanuStyles.secondaryButtonRevive}>Cancelar</Button>
        <Button onClick={agregarOActualizar} startIcon={<AddOutlinedIcon />} sx={{ ...dbanuStyles.addButtonRevive, bgcolor: "transparent", color: "success.main", border: "1px solid", borderColor: "success.main", "&:hover": { bgcolor: "action.hover" } }}>
          {indiceEdicion !== null ? 'Guardar cambios' : 'Agregar modalidad'}
        </Button>
      </Stack>

        </Box>
      ) : (
        <Box>
      <Box sx={{ mt: 1 }}>
        <TablaGestion total={modalidades.length} filtrados={modalidades.length} textoResumen={modalidades.length + ' modalidad(es)'}>
          <TableHead>
            <TableRow>
              <TableCell>Modalidad</TableCell>
              <TableCell>Frecuencia</TableCell>
              <TableCell>Duración</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Cobro</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modalidades.map((modalidad, index) => (
              <TableRow key={modalidad.id || 'draft-' + index} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={800}>{modalidad.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{modalidad.codigo || 'Se genera al guardar'}</Typography>
                </TableCell>
                <TableCell>{modalidad.uso_ilimitado ? 'Ilimitado' : (modalidad.usos_por_semana || modalidad.dias_por_semana || 0) + ' uso(s)/sem.'}</TableCell>
                <TableCell>{modalidad.duracion} {String(modalidad.tipo_duracion || '').toLowerCase()}</TableCell>
                <TableCell>
                  <Typography variant="body2">{String.fromCharCode(36) + Number(modalidad.precio_base || 0).toFixed(2)}</Typography>
                  {(modalidad.precios_sede || []).length > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {modalidad.precios_sede.length} tarifa(s) por sede
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{modalidad.modelo_cobro === 'PRORRATEO_POR_SEMANAS_UTILIZADAS' ? 'Prorrateado' : 'Fijo'}</TableCell>
                <TableCell><Chip size="small" label={modalidad.activo ? 'ACTIVA' : 'INACTIVA'} variant="outlined" sx={{ fontWeight: 800 }} /></TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={.5} justifyContent="center">
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
            {modalidades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No hay modalidades agregadas.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </TablaGestion>
      </Box>
        </Box>
      )}
    </Box>
  );
}
