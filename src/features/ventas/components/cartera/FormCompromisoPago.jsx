import { Box, Button, Stack, TextField, Typography } from '@mui/material';

export function FormCompromisoPago({
  form,
  setForm,
  guardando,
  onGuardar,
}) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
        Compromiso de pago
      </Typography>
      <Stack spacing={1}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <TextField
            type="number"
            size="small"
            label="Monto *"
            value={form.monto}
            onChange={(e) => setForm((actual) => ({ ...actual, monto: e.target.value }))}
            inputProps={{ min: 0.01, step: 0.01 }}
          />
          <TextField
            type="date"
            size="small"
            label="Fecha *"
            InputLabelProps={{ shrink: true }}
            value={form.fecha_compromiso}
            onChange={(e) => setForm((actual) => ({ ...actual, fecha_compromiso: e.target.value }))}
          />
        </Box>
        <TextField
          multiline
          minRows={2}
          size="small"
          label="Observaciones"
          value={form.observaciones}
          onChange={(e) => setForm((actual) => ({ ...actual, observaciones: e.target.value }))}
        />
        <Button variant="outlined" disabled={guardando} onClick={onGuardar}>
          Registrar compromiso
        </Button>
      </Stack>
    </Box>
  );
}
