import { useMemo, useState } from 'react';
import {
  Alert, Box, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputAdornment,
  MenuItem, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import { BotonAnadir } from '../../../components/common/BotonAnadir.jsx';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : 'Sin fin');
const textoValor = (d) => (d.tipo === 'PORCENTAJE' ? `${Number(d.valor)} %` : dinero(d.valor));
export const importeDescuento = (precio, d) => (!d ? 0 : d.tipo === 'PORCENTAJE'
  ? Math.round(precio * Math.min(100, Math.max(0, Number(d.valor))) / 100 * 100) / 100
  : Math.min(precio, Math.max(0, Number(d.valor))));

/** El descuento que rige en una sede: el de esa sede y, si no hay, el general. */
export const descuentoDeSede = (descuentos, sedeId) =>
  descuentos.find((d) => String(d.sede_id || '') === String(sedeId))
  || descuentos.find((d) => !d.sede_id) || null;

const seCruzan = (a, b) => (a.fecha_inicio <= (b.fecha_fin || '9999-12-31')) && (b.fecha_inicio <= (a.fecha_fin || '9999-12-31'));

/**
 * Descuentos de una membresía nueva: se agregan de uno en uno en un modal y se
 * listan en una tabla. Puede haber uno general y uno por sede autorizada.
 */
export function DescuentosNuevaMembresia({ descuentos, onChange, sedes, inicio, fin }) {
  const [form, setForm] = useState(null);
  const nombreSede = (id) => (id ? sedes.find((s) => String(s.id) === String(id))?.nombre || 'Sede' : 'Todas las sedes');
  const columnas = useMemo(() => ({
    sede: (d) => nombreSede(d.sede_id),
    descuento: (d) => textoValor(d),
    desde: (d) => fecha(d.fecha_inicio),
    hasta: (d) => fecha(d.fecha_fin),
  }), [sedes]);
  const filas = useMemo(() => descuentos.map((d, indice) => ({ ...d, indice })), [descuentos]);
  const tabla = useTablaLocal(filas, columnas, { sinOrdenar: ['desde', 'hasta'] });

  const abrirNuevo = () => setForm({
    indice: null, sede_id: '', tipo: 'PORCENTAJE', valor: '', motivo: '', fecha_inicio: inicio || '', fecha_fin: fin || '',
  });
  const abrirEdicion = (d) => setForm({ ...d, sede_id: d.sede_id ? String(d.sede_id) : '', valor: String(d.valor) });
  const cambiar = (campo, valor) => setForm((a) => ({ ...a, [campo]: valor }));

  // Validación del modal: valor, fechas dentro de la membresía y sin cruce en la misma sede.
  const sedesDelDescuento = form?.sede_id ? sedes.filter((s) => String(s.id) === String(form.sede_id)) : sedes;
  const topeFijo = sedesDelDescuento.length ? Math.min(...sedesDelDescuento.map((s) => s.precio)) : null;
  const valor = Number(form?.valor);
  const errores = !form ? {} : {
    valor: String(form.valor).trim() === '' ? '' : (!(valor > 0) ? 'Debe ser mayor que 0.'
      : form.tipo === 'PORCENTAJE' && valor > 100 ? 'Debe estar entre 1 y 100 %.'
        : form.tipo === 'FIJO' && topeFijo !== null && valor > topeFijo ? `No puede superar ${dinero(topeFijo)}.` : ''),
    motivo: form.motivo.trim() && form.motivo.trim().length < 8 ? 'Escribe al menos 8 caracteres.' : '',
    fechas: !form.fecha_inicio ? 'Indica desde cuándo rige.'
      : (inicio && form.fecha_inicio < inicio) || (fin && (!form.fecha_fin || form.fecha_fin > fin))
        ? 'Debe quedar dentro de la membresía.' : form.fecha_fin && form.fecha_fin < form.fecha_inicio ? 'La fecha fin no puede ser anterior.' : '',
    cruce: descuentos.some((d, i) => i !== form.indice && String(d.sede_id || '') === String(form.sede_id || '') && seCruzan(d, form))
      ? `Ya hay un descuento para ${nombreSede(form.sede_id).toLowerCase() === 'todas las sedes' ? 'todas las sedes' : nombreSede(form.sede_id)} en esas fechas.` : '',
  };
  const valido = form && valor > 0 && form.motivo.trim().length >= 8 && !Object.values(errores).some(Boolean);

  const guardar = () => {
    const limpio = {
      sede_id: form.sede_id ? Number(form.sede_id) : null, tipo: form.tipo, valor: Number(form.valor),
      motivo: form.motivo.trim(), fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin || null,
    };
    onChange(form.indice === null ? [...descuentos, limpio] : descuentos.map((d, i) => (i === form.indice ? limpio : d)));
    setForm(null);
  };

  return <Box>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
      <Box sx={{ minWidth: 0, flex: '1 1 240px' }}>
        <Typography variant="subtitle2" fontWeight={800}>Descuentos</Typography>
        <Typography variant="caption" color="text.secondary">
          Opcional. Uno para todas las sedes y, si hace falta, otro distinto por sede.
        </Typography>
      </Box>
      <BotonAnadir onClick={abrirNuevo} />
    </Box>

    <TablaGestion {...tabla.propsTabla}>
      <TableHead><TableRow>
        <FilterHeaderCell {...tabla.filtro('sede')}>Aplica en</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('descuento')}>Descuento</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('desde')}>Desde</FilterHeaderCell>
        <FilterHeaderCell {...tabla.filtro('hasta')}>Hasta</FilterHeaderCell>
        <TableCell align="center">Acciones</TableCell>
      </TableRow></TableHead>
      <TableBody>
        {tabla.visibles.map((d) => <TableRow key={d.indice} hover>
          <TableCell sx={{ fontWeight: 700 }}><Tooltip title={d.motivo}><span>{nombreSede(d.sede_id)}</span></Tooltip></TableCell>
          <TableCell>{textoValor(d)}</TableCell>
          <TableCell>{fecha(d.fecha_inicio)}</TableCell>
          <TableCell>{fecha(d.fecha_fin)}</TableCell>
          <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
            <Tooltip title="Editar descuento"><IconButton aria-label="Editar descuento" sx={dbanuStyles.actionEdit} onClick={() => abrirEdicion(d)}>
              <EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
            <Tooltip title="Quitar de la lista (aún no se ha guardado)"><IconButton aria-label="Quitar descuento" sx={dbanuStyles.actionDelete}
              onClick={() => onChange(descuentos.filter((_, i) => i !== d.indice))}>
              <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
          </TableCell>
        </TableRow>)}
        {tabla.sinResultados && <TablaEstadoFila colSpan={5} texto="Sin descuentos: se cobra la tarifa completa de cada sede." />}
      </TableBody>
    </TablaGestion>

    <Dialog open={Boolean(form)} onClose={() => setForm(null)} fullWidth maxWidth="sm" aria-labelledby="dialog-descuento-titulo"
      slotProps={{ paper: { sx: { borderRadius: 2, overflow: 'hidden', m: { xs: 1.5, sm: 3 }, width: { xs: 'calc(100% - 24px)', sm: undefined } } } }}>
      {form && <>
        <DialogTitle id="dialog-descuento-titulo" sx={{ ...formStyles.modalHeader, py: 1.25 }}>
          <Box sx={{ ...formStyles.modalIcono, bgcolor: uiTokens.colores.acentoSuave, color: uiTokens.colores.textoFuerte,
            boxShadow: 'none', border: `1px solid ${uiTokens.colores.acentoBorde}` }}>
            <LocalOfferOutlinedIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={850} sx={{ fontSize: { xs: 16, sm: 18 } }}>
              {form.indice === null ? 'Agregar descuento' : 'Editar descuento'}
            </Typography>
            <Typography variant="caption" color="text.secondary">Membresía del {fecha(inicio)} al {fecha(fin)}</Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ px: { xs: 1.5, sm: 2.5 }, py: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
          <TextField select size="small" label="Aplica en" value={form.sede_id} onChange={(e) => cambiar('sede_id', e.target.value)}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }} sx={{ gridColumn: '1 / -1', mt: 0.75 }}
            helperText={form.sede_id ? 'En las demás sedes se usa el descuento general, si lo hay.' : 'Se aplica sobre la tarifa de cada sede donde se cobre.'}>
            <MenuItem value="">Todas las sedes autorizadas</MenuItem>
            {sedes.map((s) => <MenuItem key={s.id} value={String(s.id)}>Solo {s.nombre}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Tipo" value={form.tipo} onChange={(e) => cambiar('tipo', e.target.value)}>
            <MenuItem value="PORCENTAJE">Porcentaje (%)</MenuItem>
            <MenuItem value="FIJO">Valor fijo ($)</MenuItem>
          </TextField>
          <TextField size="small" type="number" label={form.tipo === 'PORCENTAJE' ? 'Porcentaje' : 'Valor del descuento'} value={form.valor}
            onChange={(e) => cambiar('valor', e.target.value)} error={Boolean(errores.valor)}
            helperText={errores.valor || (form.tipo === 'PORCENTAJE' ? 'Entre 1 y 100 %.' : topeFijo !== null ? `Hasta ${dinero(topeFijo)}.` : '')}
            slotProps={{
              input: form.tipo === 'PORCENTAJE'
                ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                : { startAdornment: <InputAdornment position="start">$</InputAdornment> },
              htmlInput: { min: 0.01, step: 0.01 },
            }} />
          <TextField size="small" label="Motivo / autorización" value={form.motivo} onChange={(e) => cambiar('motivo', e.target.value)}
            placeholder="Ej. Beca deportiva, familiar" error={Boolean(errores.motivo)} helperText={errores.motivo || ' '}
            sx={{ gridColumn: '1 / -1' }} />
          <TextField size="small" type="date" label="Desde" value={form.fecha_inicio} onChange={(e) => cambiar('fecha_inicio', e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: inicio || undefined, max: fin || undefined } }}
            helperText={form.fecha_inicio === inicio ? 'Igual al inicio de la membresía.' : ' '} />
          <TextField size="small" type="date" label="Hasta" value={form.fecha_fin} onChange={(e) => cambiar('fecha_fin', e.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: form.fecha_inicio || undefined, max: fin || undefined } }}
            helperText={form.fecha_fin === fin ? 'Igual al fin de la membresía.' : 'Termina antes que la membresía.'} />
          {(errores.fechas || errores.cruce) && <Alert severity="warning" sx={{ gridColumn: '1 / -1' }}>{errores.fechas || errores.cruce}</Alert>}
          {valor > 0 && !errores.valor && <Box sx={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1 }}>
            {sedesDelDescuento.map((s) => <Box key={s.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, px: 1.5, py: 1, bgcolor: '#f8fafc' }}>
              <Typography variant="body2" fontWeight={800}>{s.nombre}</Typography>
              <Typography variant="caption" color="text.secondary">{dinero(s.precio)} − {dinero(importeDescuento(s.precio, form))}</Typography>
              <Typography sx={{ fontWeight: 900, color: 'success.dark' }}>Paga {dinero(s.precio - importeDescuento(s.precio, form))}</Typography>
            </Box>)}
          </Box>}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ ...dbanuStyles.dialogActions, flexWrap: 'wrap', gap: 1.5 }}>
          <BotonCancelar onClick={() => setForm(null)} />
          <BotonGuardar texto={form.indice === null ? 'Agregar a la lista' : 'Guardar cambios'} disabled={!valido} onClick={guardar} />
        </DialogActions>
      </>}
    </Dialog>
  </Box>;
}
