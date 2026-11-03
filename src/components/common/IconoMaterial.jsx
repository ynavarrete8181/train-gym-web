import { Box } from '@mui/material'

// La navegación almacena nombres de Material Symbols, no componentes de
// @mui/icons-material. Un nombre incompatible puede renderizarse como texto.
const equivalencias = {
  CardMembership: 'settings',
  cardmembership: 'settings',
};
const normalizarIcono = (valor) => {
  const nombre = String(valor || 'widgets').trim();
  if (equivalencias[nombre]) return equivalencias[nombre];
  // Material Symbols admite iconos en minúsculas con guion bajo.
  return /^[a-z][a-z0-9_]*$/.test(nombre) ? nombre : 'widgets';
};

export function IconoMaterial({ nombre, size = 22, sx = {} }) {
  return (
    <Box
      component="span"
      className="material-symbols-outlined"
      aria-hidden="true"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: size,
        height: size,
        maxWidth: size,
        overflow: 'hidden',
        fontSize: size,
        lineHeight: 1,
        fontVariationSettings: '"FILL" 0, "wght" 500, "GRAD" 0, "opsz" 24',
        ...sx,
      }}
    >
      {normalizarIcono(nombre)}
    </Box>
  )
}
