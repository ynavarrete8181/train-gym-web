import { useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import MyLocationOutlinedIcon from '@mui/icons-material/MyLocationOutlined';
import { Box, Button, IconButton, Stack, Tooltip, Typography } from '@mui/material';

// OpenStreetMap Web Mercator tiles. No geolocation or third-party tracking API is requested.
const SIZE = 256;
const limitar = (value, min, max) => Math.min(max, Math.max(min, value));
const proyectar = (lat, lon, zoom) => {
  const escala = SIZE * 2 ** zoom;
  const rad = limitar(lat, -85, 85) * Math.PI / 180;
  return {
    x: (lon + 180) / 360 * escala,
    y: (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * escala,
  };
};
const desproyectar = (x, y, zoom) => {
  const escala = SIZE * 2 ** zoom;
  const n = Math.PI - 2 * Math.PI * y / escala;
  return {
    latitud: (180 / Math.PI * Math.atan(Math.sinh(n))).toFixed(7),
    longitud: ((x / escala * 360) - 180).toFixed(7),
  };
};
const coordenadaValida = (lat, lng) =>
  lat !== '' && lng !== '' && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));

export function MapaUbicacionPersona({ latitud, longitud, onChange, disabled = false }) {
  const tienePunto = coordenadaValida(latitud, longitud);
  const [zoom, setZoom] = useState(tienePunto ? 14 : 7);
  const [centro, setCentro] = useState(null);
  const [ancho, setAncho] = useState(600);
  const [alto] = useState(310);
  const latCentro = centro?.latitud ?? (tienePunto ? Number(latitud) : -1.6);
  const lngCentro = centro?.longitud ?? (tienePunto ? Number(longitud) : -78.5);

  const mosaicos = useMemo(() => {
    const punto = proyectar(latCentro, lngCentro, zoom);
    const startX = Math.floor((punto.x - ancho / 2) / SIZE);
    const endX = Math.ceil((punto.x + ancho / 2) / SIZE);
    const startY = Math.floor((punto.y - alto / 2) / SIZE);
    const endY = Math.ceil((punto.y + alto / 2) / SIZE);
    const n = 2 ** zoom;
    const resultado = [];
    for (let tx = startX; tx <= endX; tx++) {
      for (let ty = startY; ty <= endY; ty++) {
        if (ty < 0 || ty >= n) continue;
        resultado.push({
          key: `${zoom}-${tx}-${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${((tx % n) + n) % n}/${ty}.png`,
          left: tx * SIZE - punto.x + ancho / 2,
          top: ty * SIZE - punto.y + alto / 2,
        });
      }
    }
    return resultado;
  }, [latCentro, lngCentro, zoom, ancho, alto]);

  const seleccionar = (e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centroPx = proyectar(latCentro, lngCentro, zoom);
    const ubicacion = desproyectar(
      centroPx.x + (e.clientX - rect.left) - rect.width / 2,
      centroPx.y + (e.clientY - rect.top) - rect.height / 2,
      zoom
    );
    if (Number(ubicacion.latitud) < -5.1 || Number(ubicacion.latitud) > 2 ||
        Number(ubicacion.longitud) < -92.1 || Number(ubicacion.longitud) > -74) return;
    onChange(ubicacion);
    setCentro({ latitud: Number(ubicacion.latitud), longitud: Number(ubicacion.longitud) });
  };

  const mover = (dx, dy) => {
    const pixel = proyectar(latCentro, lngCentro, zoom);
    const destino = desproyectar(pixel.x + dx, pixel.y + dy, zoom);
    setCentro({ latitud: Number(destino.latitud), longitud: Number(destino.longitud) });
  };

  return (
    <Stack spacing={1}>
      <Box sx={{ position: 'relative', height: alto, overflow: 'hidden', borderRadius: 2,
        border: '1px solid #dce4eb', bgcolor: '#e6edf1' }}
        ref={(node) => { if (node && node.clientWidth && Math.abs(node.clientWidth - ancho) > 1) setAncho(node.clientWidth); }}
      >
        <Box onClick={seleccionar} role="button" tabIndex={disabled ? -1 : 0}
          aria-label="Seleccionar ubicación en el mapa"
          sx={{ position: 'absolute', inset: 0, cursor: disabled ? 'default' : 'crosshair' }}>
          {mosaicos.map((tile) => <Box component="img" key={tile.key} src={tile.url} alt=""
            draggable={false} sx={{ position: 'absolute', width: SIZE, height: SIZE,
              left: tile.left, top: tile.top, userSelect: 'none', pointerEvents: 'none' }} />)}
          {tienePunto && (() => {
            const punto = proyectar(Number(latitud), Number(longitud), zoom);
            const central = proyectar(latCentro, lngCentro, zoom);
            return <Box sx={{ position: 'absolute', left: ancho / 2 + punto.x - central.x,
              top: alto / 2 + punto.y - central.y, transform: 'translate(-50%, -100%)',
              color: '#b45309', fontSize: 32, textShadow: '0 1px 5px white', pointerEvents: 'none' }}>●</Box>;
          })()}
        </Box>
        <Stack spacing={0.5} sx={{ position: 'absolute', right: 10, top: 10 }}>
          <Tooltip title="Acercar"><IconButton size="small" onClick={() => setZoom(z => Math.min(z + 1, 18))}
            sx={{ bgcolor: '#fff', boxShadow: 1 }}><AddOutlinedIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Alejar"><IconButton size="small" onClick={() => setZoom(z => Math.max(z - 1, 4))}
            sx={{ bgcolor: '#fff', boxShadow: 1 }}><RemoveOutlinedIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Centrar en el punto"><IconButton size="small" disabled={!tienePunto}
            onClick={() => { setCentro({ latitud: Number(latitud), longitud: Number(longitud) }); setZoom(15); }}
            sx={{ bgcolor: '#fff', boxShadow: 1 }}><MyLocationOutlinedIcon fontSize="small" /></IconButton></Tooltip>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', left: 10, top: 10 }}>
          {[['←', -140, 0], ['↑', 0, -140], ['↓', 0, 140], ['→', 140, 0]].map(([label, dx, dy]) =>
            <Button key={label} size="small" onClick={() => mover(dx, dy)} sx={{ minWidth: 28,
              p: 0.4, bgcolor: '#fff', color: '#344054', '&:hover': { bgcolor: '#f8fafc' } }}>{label}</Button>)}
        </Stack>
        <Box sx={{ position: 'absolute', bottom: 3, right: 5, bgcolor: 'rgba(255,255,255,.88)',
          px: 0.5, borderRadius: 0.5 }}>
          <Typography component="a" href="https://www.openstreetmap.org/copyright" target="_blank"
            rel="noopener noreferrer" sx={{ fontSize: 10, color: '#334155' }}>© OpenStreetMap contributors</Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Haz clic en el mapa para marcar la ubicación, usa +/− para acercar y las flechas para desplazarte.
        El punto es opcional y puede corregirse antes de guardar.
      </Typography>
    </Stack>
  );
}
