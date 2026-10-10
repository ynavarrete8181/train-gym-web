import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { StatusChip } from '../../../../components/common/StatusChip.jsx';
import { dbanuStyles } from '../../../../styles/dbanuStyles.js';
import {
  cuentaCerrada,
  dinero,
  estadoVisualCartera,
  fecha,
  fechaHora,
} from '../../config/carteraConfig.js';
import { FormCompromisoPago } from './FormCompromisoPago.jsx';
import { FormGestionCartera } from './FormGestionCartera.jsx';

function DatoResumen({ label, value, secondary }) {
  return (
    <Paper elevation={0} sx={{ p: 1.2, border: 1, borderColor: 'divider', borderRadius: 0.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body1" fontWeight={900}>{value}</Typography>
      {secondary ? <Typography variant="caption" color="text.secondary">{secondary}</Typography> : null}
    </Paper>
  );
}

export function GestionCarteraDialog({
  open,
  detalle,
  catalogos,
  guardando,
  turnoActual,
  formCuenta,
  setFormCuenta,
  formGestion,
  setFormGestion,
  formCompromiso,
  setFormCompromiso,
  onCerrar,
  onGuardarCuenta,
  onRegistrarGestion,
  onRegistrarCompromiso,
  onCobrar,
}) {
  return (
    <Dialog open={open} onClose={() => !guardando && onCerrar()} fullWidth maxWidth="lg">
      <DialogTitle sx={{ fontWeight: 900 }}>Gestión de cartera</DialogTitle>
      <DialogContent dividers>
        {detalle ? (
          <Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1 }}>
              <DatoResumen
                label="Cliente"
                value={detalle.cliente_nombre}
                secondary={detalle.cliente_identificacion}
              />
              <DatoResumen
                label="Venta"
                value={detalle.venta_numero}
                secondary={detalle.plan_nombre || detalle.concepto}
              />
              <DatoResumen
                label="Saldo pendiente"
                value={dinero(detalle.saldo_pendiente)}
                secondary={`Pagado ${dinero(detalle.total_pagado)}`}
              />
              <DatoResumen
                label="Estado"
                value={detalle.estado_cartera}
                secondary={Number(detalle.dias_vencidos || 0) > 0
                  ? `${detalle.dias_vencidos} días vencida`
                  : 'Al día'}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                Datos de seguimiento
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 1 }}>
                <TextField
                  type="date"
                  size="small"
                  label="Vencimiento"
                  InputLabelProps={{ shrink: true }}
                  value={formCuenta.fecha_vencimiento}
                  onChange={(e) => setFormCuenta((actual) => ({ ...actual, fecha_vencimiento: e.target.value }))}
                />
                <TextField
                  select
                  size="small"
                  label="Prioridad"
                  value={formCuenta.prioridad}
                  onChange={(e) => setFormCuenta((actual) => ({ ...actual, prioridad: e.target.value }))}
                >
                  {(catalogos.prioridades || []).map((prioridad) => (
                    <MenuItem key={prioridad} value={prioridad}>{prioridad}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Responsable"
                  value={formCuenta.responsable_id}
                  onChange={(e) => setFormCuenta((actual) => ({ ...actual, responsable_id: e.target.value }))}
                >
                  <MenuItem value="">Sin asignar</MenuItem>
                  {(catalogos.responsables || []).map((responsable) => (
                    <MenuItem key={responsable.id} value={responsable.id}>{responsable.name}</MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="outlined"
                  disabled={guardando}
                  onClick={onGuardarCuenta}
                  sx={dbanuStyles.secondaryButtonRevive}
                >
                  Guardar seguimiento
                </Button>
                <TextField
                  size="small"
                  label="Observaciones"
                  value={formCuenta.observaciones}
                  onChange={(e) => setFormCuenta((actual) => ({ ...actual, observaciones: e.target.value }))}
                  sx={{ gridColumn: { xs: 'auto', md: 'span 4' } }}
                />
              </Box>
            </Box>

            <Divider />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
              <FormGestionCartera
                catalogos={catalogos}
                form={formGestion}
                setForm={setFormGestion}
                guardando={guardando}
                onGuardar={onRegistrarGestion}
              />
              <FormCompromisoPago
                form={formCompromiso}
                setForm={setFormCompromiso}
                guardando={guardando}
                onGuardar={onRegistrarCompromiso}
              />
            </Box>

            <Divider />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={900}>Historial de gestiones</Typography>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {(detalle.gestiones || []).length ? detalle.gestiones.map((gestion) => (
                    <Box key={gestion.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 0.5, p: 1 }}>
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Typography variant="body2" fontWeight={800}>
                          {gestion.tipo} · {gestion.resultado || 'Sin resultado'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fechaHora(gestion.gestion_at)}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{gestion.detalle}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {gestion.usuario_nombre || 'Sistema'}
                      </Typography>
                    </Box>
                  )) : (
                    <Typography variant="caption" color="text.secondary">
                      Sin gestiones registradas.
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={900}>Compromisos</Typography>
                <Stack spacing={0.75} sx={{ mt: 1 }}>
                  {(detalle.compromisos || []).length ? detalle.compromisos.map((compromiso) => (
                    <Box key={compromiso.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 0.5, p: 1 }}>
                      <Stack direction="row" justifyContent="space-between" gap={1}>
                        <Typography variant="body2" fontWeight={800}>
                          {dinero(compromiso.monto)} · {fecha(compromiso.fecha_compromiso)}
                        </Typography>
                        <StatusChip
                          estado={compromiso.estado === 'CUMPLIDO' ? 'activo' : compromiso.estado === 'INCUMPLIDO' ? 'bloqueado' : 'pendiente'}
                          label={compromiso.estado}
                        />
                      </Stack>
                      {compromiso.observaciones ? (
                        <Typography variant="body2" color="text.secondary">
                          {compromiso.observaciones}
                        </Typography>
                      ) : null}
                    </Box>
                  )) : (
                    <Typography variant="caption" color="text.secondary">
                      Sin compromisos registrados.
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Box>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={dbanuStyles.dialogActions}>
        <Button onClick={onCerrar} disabled={guardando}>Cerrar</Button>
        <Button
          variant="contained"
          startIcon={<PaymentsOutlinedIcon />}
          disabled={!turnoActual?.id || !detalle || cuentaCerrada(detalle?.estado_cartera)}
          onClick={() => onCobrar(detalle)}
          sx={dbanuStyles.addButtonRevive}
        >
          Cobrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
