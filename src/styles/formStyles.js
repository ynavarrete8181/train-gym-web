import { uiTokens } from './uiTokens.js'

export const formStyles = {
  seccion: {
    p: 2,
    borderRadius: 2,
    border: `1px solid ${uiTokens.colores.borde}`,
    bgcolor: '#fff',
  },
  filtros: {
    p: 2,
    mb: 2,
    border: `1px solid ${uiTokens.colores.borde}`,
    borderRadius: 2,
    bgcolor: '#fff',
  },
  campoCompacto: {
    '& .MuiInputBase-root': {
      fontSize: uiTokens.tipografia.campo,
      minHeight: uiTokens.alturas.campo,
      borderRadius: 1.5,
      bgcolor: '#fff',
    },
    '& .MuiInputLabel-root': {
      fontSize: uiTokens.tipografia.campo,
      fontWeight: 650,
    },
  },
  botonAccion: {
    minHeight: uiTokens.alturas.boton,
    px: 1.6,
    borderRadius: 1,
    fontSize: uiTokens.tipografia.boton,
    fontWeight: 850,
    textTransform: 'none',
  },
  botonModal: {
    minWidth: 128,
    minHeight: uiTokens.alturas.botonModal,
    px: 2.2,
    borderRadius: 1,
    fontSize: 12,
    fontWeight: 900,
    textTransform: 'none',
  },
  modalHeader: {
    px: 2.5,
    py: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
  },
  modalIcono: {
    width: 42,
    height: 42,
    borderRadius: 1,
    display: 'grid',
    placeItems: 'center',
    bgcolor: uiTokens.colores.primario,
    color: '#fff',
    flex: '0 0 auto',
    boxShadow: '0 10px 24px rgba(0, 73, 135, 0.22)',
  },
  modalSeccionTitulo: {
    fontSize: 13,
    fontWeight: 900,
    color: uiTokens.colores.textoFuerte,
    mb: 1.4,
  },
}
