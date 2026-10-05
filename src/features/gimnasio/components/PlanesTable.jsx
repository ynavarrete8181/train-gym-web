import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { IconButton, TableBody, TableCell, TableHead, TableRow, Typography, Stack, Tooltip } from '@mui/material';
import { FilterHeaderCell } from '../../../components/tables/FilterHeaderCell.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { EstadoToggleCell } from '../../../components/tables/EstadoToggleCell.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

export function PlanesTable({ planes, meta, cargando, filtrosColumna = {}, onFiltroColumna, onEditar, onModalidades, onEliminar, onCambiarEstado, onPageChange, onRowsPerPageChange }) {
  const opciones = (valores = []) => valores.map((valor) => ({ value: String(valor), label: String(valor) }));
  
  return (
    <TablaGestion
      total={meta.total || 0}
      filtrados={meta.total || 0}
      page={meta.pagina_actual || 1}
      rowsPerPage={meta.por_pagina || 5}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      cargando={cargando}
    >
      <TableHead>
        <TableRow>
          <FilterHeaderCell value={filtrosColumna.codigo} onChange={(v) => onFiltroColumna('codigo', v)} options={opciones(meta.opciones_filtro?.codigo)}>Código</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.nombre} onChange={(v) => onFiltroColumna('nombre', v)} options={opciones(meta.opciones_filtro?.nombre)}>Plan</FilterHeaderCell>
          <FilterHeaderCell value={filtrosColumna.estado} onChange={(v) => onFiltroColumna('estado', v)} options={[{ value: '1', label: 'Activo' }, { value: '0', label: 'Inactivo' }]}>Estado</FilterHeaderCell>
          <TableCell>Modalidades</TableCell>
          <TableCell align="right">Acciones</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {planes.map((plan) => (
          <TableRow key={plan.id} hover>
            <TableCell>
              <Typography variant="body2" fontWeight="600">{plan.codigo}</Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{plan.nombre}</Typography>
              <Typography variant="caption" color="text.secondary">{plan.descripcion}</Typography>
            </TableCell>
            <TableCell>
              <EstadoToggleCell
                activo={Number(plan.activo) === 1}
                onToggle={() => onCambiarEstado && onCambiarEstado(plan)}
                confirmacion={{
                  titulo: Number(plan.activo) === 1 ? 'Inactivar plan' : 'Activar plan',
                  texto: Number(plan.activo) === 1
                    ? `Los nuevos deportistas no podrán adquirir el plan ${plan.nombre}.`
                    : `El plan ${plan.nombre} estará disponible nuevamente.`,
                  textoConfirmar: Number(plan.activo) === 1 ? 'Sí, inactivar' : 'Sí, activar',
                  icono: Number(plan.activo) === 1 ? 'warning' : 'question',
                }}
              />
            </TableCell>
            <TableCell>
              {plan.requiere_modalidades ? (
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Typography variant="body2" fontWeight={800}>
                    {(plan.modalidades || []).length} configurada(s)
                  </Typography>
                  {onModalidades ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onModalidades(plan)}
                      sx={{ minWidth: 'auto', px: 1.1, py: .35, fontSize: 12, fontWeight: 800 }}
                    >
                      Configurar
                    </Button>
                  ) : null}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No aplica</Typography>
              )}
            </TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={0.4} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                <Tooltip title="Editar plan">
                  <IconButton sx={dbanuStyles.actionEdit} onClick={() => onEditar(plan)}>
                    <EditOutlinedIcon sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
                {onEliminar && (
                  <Tooltip title="Eliminar plan">
                    <IconButton sx={dbanuStyles.actionDelete} onClick={() => onEliminar(plan)}>
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 17, color: 'error.main' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </TableCell>
          </TableRow>
        ))}
        {planes.length === 0 ? (
          <TablaEstadoFila colSpan={5} cargando={cargando} texto="No hay planes registrados." />
        ) : null}
      </TableBody>
    </TablaGestion>
  );
}
