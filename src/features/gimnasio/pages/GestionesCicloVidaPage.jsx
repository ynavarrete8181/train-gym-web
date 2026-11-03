import { useCallback, useEffect, useState } from 'react';
import PauseCircleOutlineOutlinedIcon from '@mui/icons-material/PauseCircleOutlineOutlined';
import { Alert, Box, Button, Chip, Stack, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { formStyles } from '../../../styles/formStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { GestionCicloVidaMembresia } from '../components/GestionCicloVidaMembresia.jsx';

const errorTexto = e => Object.values(e?.response?.data?.errors || e?.response?.data?.errores || {})
  .flat().find(Boolean) || e?.response?.data?.mensaje || 'No se pudieron consultar los contratos.';

export function GestionesCicloVidaPage() {
  const [membresias, setMembresias] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(5);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async (pg = pagina, cantidad = porPagina, texto = busqueda) => {
    setCargando(true);
    try {
      const r = await gimnasioServicio.obtenerMembresias({
        page: pg, per_page: cantidad, busqueda: texto,
      });
      setMembresias(r.datos || []);
      setTotal(Number(r.meta?.total || 0));
      setError('');
      return r.datos || [];
    } catch (e) {
      setError(errorTexto(e));
      return [];
    } finally { setCargando(false); }
  }, [pagina, porPagina, busqueda]);

  useEffect(() => { cargar(); }, [cargar]);
  const cambiarBusqueda = texto => { setBusqueda(texto); setPagina(1); };

  return <Box sx={{ pb: 3 }}>
    <PageHeader titulo="Congelaciones y reactivaciones"
      descripcion="Selecciona el contrato para gestionar suspensiones y movimientos auditados."/>
    <Box sx={{ ...formStyles.seccion, mt: 2 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {seleccionada ? <>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800}>Contrato {seleccionada.codigo_contrato}</Typography>
            <Typography variant="caption" color="text.secondary">
              {seleccionada.deportista_nombre || 'Deportista'} · {seleccionada.plan_nombre || 'Plan'}
            </Typography>
          </Box>
          <BotonVolver onClick={() => setSeleccionada(null)}/>
        </Stack>
        <GestionCicloVidaMembresia membresia={seleccionada}
          onVolver={() => setSeleccionada(null)}
          onActualizado={async () => {
            const items = await cargar();
            const actual = items.find(item => Number(item.id) === Number(seleccionada.id));
            if (actual) setSeleccionada(actual);
          }}/>
      </> : <>
        <GestionToolbar total={total} busqueda={busqueda} onBusqueda={cambiarBusqueda}
          mostrarTotal etiqueta="CONTRATOS"/>
        <TablaGestion total={total} filtrados={total}
          page={pagina} onPageChange={setPagina}
          rowsPerPage={porPagina} onRowsPerPageChange={v => { setPorPagina(v); setPagina(1); }}
          cargando={cargando}>
          <TableHead><TableRow>
            <TableCell>Contrato</TableCell><TableCell>Deportista</TableCell>
            <TableCell>Plan</TableCell><TableCell>Sede</TableCell>
            <TableCell>Estado</TableCell><TableCell align="center">Acciones</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {membresias.map(m => <TableRow hover key={m.id}>
              <TableCell>{m.codigo_contrato}</TableCell>
              <TableCell>{m.deportista_nombre || '—'}</TableCell>
              <TableCell>{m.plan_nombre || '—'}</TableCell>
              <TableCell>{m.sede_nombre || '—'}</TableCell>
              <TableCell><Chip size="small" variant="outlined" label={m.estado || '—'}/></TableCell>
              <TableCell align="center">
                <Button variant="outlined" size="small" startIcon={<PauseCircleOutlineOutlinedIcon/>}
                  onClick={() => setSeleccionada(m)}>Gestionar</Button>
              </TableCell>
            </TableRow>)}
            {!membresias.length && <TableRow><TableCell align="center" colSpan={6}>
              No se encontraron contratos.
            </TableCell></TableRow>}
          </TableBody>
        </TablaGestion>
      </>}
    </Box>
  </Box>;
}
