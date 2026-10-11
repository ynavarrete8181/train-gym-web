import { Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';

export function FormGestionCartera({
  catalogos,
  form,
  setForm,
  guardando,
  onGuardar,
}) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
        Registrar gestión
      </Typography>
      <Stack spacing={1}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
          <TextField
            select
            size="small"
            label="Tipo"
            value={form.tipo}
            onChange={(e) => setForm((actual) => ({ ...actual, tipo: e.target.value }))}
          >
            {(catalogos.tipos_gestion || []).map((tipo) => (
              <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Resultado"
            value={form.resultado}
            onChange={(e) => setForm((actual) => ({ ...actual, resultado: e.target.value }))}
          >
            {(catalogos.resultados_gestion || []).map((resultado) => (
              <MenuItem key={resultado} value={resultado}>{resultado}</MenuItem>
            ))}
          </TextField>
        </Box>
        <TextField
          multiline
          minRows={2}
          size="small"
          label="Detalle *"
          value={form.detalle}
          onChange={(e) => setForm((actual) => ({ ...actual, detalle: e.target.value }))}
        />
        <TextField
          type="datetime-local"
          size="small"
          label="Próxima gestión"
          InputLabelProps={{ shrink: true }}
          value={form.proxima_gestion_at}
          onChange={(e) => setForm((actual) => ({ ...actual, proxima_gestion_at: e.target.value }))}
        />
        <Button variant="outlined" disabled={guardando} onClick={onGuardar}>
          Registrar gestión
        </Button>
      </Stack>
    </Box>
  );
}
