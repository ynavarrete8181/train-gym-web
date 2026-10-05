import { useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
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

  const agregarPrecio = () => setForm((prev) => ({
    ...prev,
    precios_sede: [...(prev.precios_sede || []), { sede_id: '', precio: '' }],
  }));

  const cambiarPrecio = (index, field, value) => {
    setForm((prev) => {
      const precios = [...(prev.precios_sede || [])];
      precios[index] = { ...precios[index], [field]: value };
      return { ...prev, precios_sede: precios };
    });
  };

  const quitarPrecio = (index) => setForm((prev) => ({
    ...prev,
    precios_sede: (prev.precios_sede || []).filter((_, i) => i !== index),
  }));

  const limpiar = () => {
    setForm(nuevaModalidad());
    setIndiceEdicion(null);
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

    if (Number(form.precio_base) < 0) {
      avisar('El precio base de la modalidad no puede ser negativo.');
      return;
    }

    const precios = form.precio_por_sede ? (form.precios_sede || []) : [];
    if (precios.some((fila) => !fila.sede_id || fila.precio === '')) {
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
  };

  const eliminar = (index) => {
    onChange(modalidades.filter((_, i) => i !== index));
    if (indiceEdicion === index) limpiar();
  };

  return (
    <Box sx={formStyles.seccion}>
      <Typography sx={formStyles.modalSeccionTitulo}>Modalidades del plan</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr .72fr .72fr .78fr .68fr .8fr .9fr .9fr' }, gap: 1, alignItems: 'start', mt: 1 }}>
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
        <TextField select label="Modelo de cobro" name="modelo_cobro" value={form.modelo_cobro} onChange={cambiar} size="small">
          <MenuItem value="FIJO_POR_PERIODO">Fijo</MenuItem>
          <MenuItem value="PRORRATEO_POR_SEMANAS_UTILIZADAS">Prorrateado</MenuItem>
        </TextField>
        <TextField select label="Momento" name="momento_cobro" value={form.momento_cobro} onChange={cambiar} size="small" disabled={form.modelo_cobro === 'PRORRATEO_POR_SEMANAS_UTILIZADAS'}>
          <MenuItem value="ANTICIPADO">Anticipado</MenuItem>
          <MenuItem value="VENCIDO">Vencido</MenuItem>
        </TextField>
      </Box>

      <Box
        sx={{
          mt: .75,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
          alignItems: 'center',
          width: '100%',
          columnGap: 1.5,
          rowGap: 1,
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, minmax(0, 1fr))' },
            alignItems: 'center',
            gap: .5,
            minWidth: 0,
          }}
        >
          <FormControlLabel sx={{ m: 0 }} control={<Switch size="small" name="uso_ilimitado" checked={Boolean(form.uso_ilimitado)} onChange={cambiar} />} label="Uso ilimitado" />
          <FormControlLabel sx={{ m: 0 }} control={<Switch size="small" name="permite_extension" checked={Boolean(form.permite_extension)} onChange={cambiar} />} label="Permite extensión" />
          <FormControlLabel sx={{ m: 0 }} control={<Switch size="small" name="extension_automatica" checked={Boolean(form.extension_automatica)} onChange={cambiar} disabled={!form.permite_extension} />} label="Extensión automática" />
          <FormControlLabel sx={{ m: 0 }} control={<Switch size="small" name="permite_rollover" checked={Boolean(form.permite_rollover)} onChange={cambiar} />} label="Rollover" />
          <FormControlLabel sx={{ m: 0 }} control={<Switch size="small" name="activo" checked={Boolean(form.activo)} onChange={cambiar} />} label="Activa" />
        </Box>

        <Button
          onClick={agregarOActualizar}
          startIcon={indiceEdicion !== null ? <SaveOutlinedIcon /> : <AddOutlinedIcon />}
          sx={indiceEdicion !== null ? dbanuStyles.saveButton : dbanuStyles.addButtonRevive}
        >
          {indiceEdicion !== null ? 'Modificar' : 'Añadir'}
        </Button>
      </Box>

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
                <TableCell>{'$' + Number(modalidad.precio_base || 0).toFixed(2)}</TableCell>
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

      <Box sx={{ mt: 1, borderTop: '1px solid #edf2f7', pt: 1 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={1}>
          <Box sx={{ flex: 1 }}>
            <FormControlLabel
              control={<Switch size="small" name="precio_por_sede" checked={Boolean(form.precio_por_sede)} onChange={cambiar} />}
              label="Precio diferente por sede"
              sx={{ m: 0, '& .MuiFormControlLabel-label': { fontWeight: 800, fontSize: 13 } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: .25 }}>
              Si está apagado, todas las sedes usan el precio base de la modalidad.
            </Typography>
          </Box>

          {form.precio_por_sede ? (
            <Button startIcon={<AddOutlinedIcon />} onClick={agregarPrecio} sx={dbanuStyles.addButtonRevive}>
              Añadir
            </Button>
          ) : null}
        </Stack>

        {form.precio_por_sede && (form.precios_sede || []).length ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 1, mt: 1 }}>
            {(form.precios_sede || []).map((fila, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                <TextField select label="Sede" size="small" value={fila.sede_id || ''} onChange={(e) => cambiarPrecio(index, 'sede_id', e.target.value)} sx={{ flex: 1 }}>
                  {sedes.map((sede) => <MenuItem key={sede.id_sede} value={sede.id_sede}>{sede.nombre}</MenuItem>)}
                </TextField>
                <TextField label="Precio ($)" type="number" size="small" value={fila.precio ?? ''} onChange={(e) => cambiarPrecio(index, 'precio', e.target.value)} sx={{ width: 130 }} />
                <Tooltip title="Quitar">
                  <IconButton size="small" onClick={() => quitarPrecio(index)} sx={dbanuStyles.actionDelete}>
                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}
          </Box>
        ) : null}

        {indiceEdicion !== null ? (
          <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1.25 }}>
            <Button onClick={limpiar} sx={dbanuStyles.secondaryButtonRevive}>Cancelar edición</Button>
          </Stack>
        ) : null}
      </Box>

    </Box>
  );
}
