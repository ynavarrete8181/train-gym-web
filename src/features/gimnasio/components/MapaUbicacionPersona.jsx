import { Box, Link, Stack, Typography } from '@mui/material';

// Se utiliza la vista incrustada oficial de OpenStreetMap, no solicitudes
// directas a tile.openstreetmap.org desde la aplicación (bloqueadas con 403).
// La selección del punto sigue siendo voluntaria; las coordenadas se editan
// en el formulario y se guardan únicamente al enviar la ficha.
export function MapaUbicacionPersona({ latitud, longitud }) {
  const lat = Number(latitud);
  const lon = Number(longitud);
  const marcado = latitud !== '' && longitud !== ''
    && Number.isFinite(lat) && Number.isFinite(lon)
    && lat >= -5.1 && lat <= 2 && lon >= -92.1 && lon <= -74;
  const latCentro = marcado ? lat : -1.6;
  const lonCentro = marcado ? lon : -78.5;
  const margen = marcado ? 0.015 : 3;
  const bbox = [lonCentro - margen, latCentro - margen, lonCentro + margen, latCentro + margen].join(',');
  const params = new URLSearchParams({ bbox, layer: 'mapnik' });
  if (marcado) params.set('marker', `${lat},${lon}`);
  const url = `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
  return (
    <Stack spacing={1}>
      <Box component="iframe" title="Mapa de ubicación opcional"
        src={url} loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
        sx={{ display: 'block', height: 300, width: '100%', border: '1px solid #d8e4ec', borderRadius: 2 }}
      />
      <Typography variant="caption" color="text.secondary">
        Mueve y amplía el mapa para explorar la zona. Para guardar un punto exacto, introduce
        sus coordenadas en los campos superiores. El mapa es completamente opcional.
      </Typography>
      <Link href={`https://www.openstreetmap.org/?mlat=${latCentro}&mlon=${lonCentro}#map=14/${latCentro}/${lonCentro}`}
        target="_blank" rel="noopener noreferrer" underline="hover" sx={{ fontSize: 12 }}>
        Abrir esta ubicación en OpenStreetMap
      </Link>
    </Stack>
  );
}
