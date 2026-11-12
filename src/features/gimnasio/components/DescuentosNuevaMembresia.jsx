import { useMemo, useState } from 'react';
import { Alert, Box, IconButton, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { BotonAnadir } from '../../../components/common/BotonAnadir.jsx';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { useTablaLocal } from '../../../components/tables/useTablaLocal.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { DialogDescuento, importeDescuento } from './DialogDescuento.jsx';

const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;
const fecha = (valor) => (valor ? String(valor).slice(0, 10).split('-').reverse().join('/') : 'Sin fin');
const textoValor = (d) => (d.tipo === 'PORCENTAJE' ? `${Number(d.valor)} %` : dinero(d.valor));
export { importeDescuento };

/** El descuento que rige en una sede: el de esa sede y, si no hay, el general. */
export const descuentoDeSede = (descuentos, sedeId) =>
  descuentos.find((d) => String(d.sede_id || '') === String(sedeId))
  || descuentos.find((d) => !d.sede_id) || null;


/**
 * Descuentos de una membresía nueva: se agregan de uno en uno en un modal y se
 * listan en una tabla. Puede haber uno general y uno por sede autorizada.
 */
export function DescuentosNuevaMembresia({ descuentos, onChange, sedes, todasLasSedes = [], inicio, fin }) {
  const [form, setForm] = useState(null);
  const nombreSede = (id) => (id
    ? (sedes.find((s) => String(s.id) === String(id)) || todasLasSedes.find((s) => String(s.id) === String(id)))?.nombre || 'Sede'
    : 'Todas las sedes');
  // Un descuento de una sede que luego se quitó de las autorizadas no se puede guardar.
  const noAutorizada = (d) => Boolean(d.sede_id) && !sedes.some((s) => String(s.id) === String(d.sede_id));
  const hayNoAutorizadas = descuentos.some(noAutorizada);
  const columnas = useMemo(() => ({
    sede: (d) => nombreSede(d.sede_id),
    descuento: (d) => textoValor(d),
    desde: (d) => fecha(d.fecha_inicio),
    hasta: (d) => fecha(d.fecha_fin),
  }), [sedes]);
  const filas = useMemo(() => descuentos.map((d, indice) => ({ ...d, indice })), [descuentos]);
  const tabla = useTablaLocal(filas, columnas, { sinOrdenar: ['desde', 'hasta'] });

  // form: null cerrado; { indice: null } nuevo; { indice, ...descuento } edición.
  const guardar = (limpio) => {
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
      <BotonAnadir onClick={() => setForm({ indice: null })} />
    </Box>

    {hayNoAutorizadas && <Alert severity="warning" sx={{ mb: 1 }}>
      Hay descuentos de sedes que ya no están autorizadas: edítalos o quítalos antes de guardar.
    </Alert>}
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
          <TableCell sx={{ fontWeight: 700, color: noAutorizada(d) ? '#996515' : undefined }}>
            <Tooltip title={d.motivo}><span>{nombreSede(d.sede_id)}{noAutorizada(d) ? ' · no autorizada' : ''}</span></Tooltip>
          </TableCell>
          <TableCell>{textoValor(d)}</TableCell>
          <TableCell>{fecha(d.fecha_inicio)}</TableCell>
          <TableCell>{fecha(d.fecha_fin)}</TableCell>
          <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
            <Tooltip title="Editar descuento"><IconButton aria-label="Editar descuento" sx={dbanuStyles.actionEdit} onClick={() => setForm(d)}>
              <EditOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
            <Tooltip title="Quitar de la lista (aún no se ha guardado)"><IconButton aria-label="Quitar descuento" sx={dbanuStyles.actionDelete}
              onClick={() => onChange(descuentos.filter((_, i) => i !== d.indice))}>
              <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} /></IconButton></Tooltip>
          </TableCell>
        </TableRow>)}
        {tabla.sinResultados && <TablaEstadoFila colSpan={5} texto="Sin descuentos: se cobra la tarifa completa de cada sede." />}
      </TableBody>
    </TablaGestion>

    <DialogDescuento
      abierto={Boolean(form)}
      inicial={form && form.indice !== null ? form : null}
      sedes={sedes}
      inicio={inicio}
      fin={fin}
      otros={form ? descuentos.filter((_, i) => i !== form.indice) : []}
      textoGuardar={form && form.indice !== null ? 'Guardar cambios' : 'Agregar a la lista'}
      onCerrar={() => setForm(null)}
      onGuardar={guardar}
    />
  </Box>;
}
