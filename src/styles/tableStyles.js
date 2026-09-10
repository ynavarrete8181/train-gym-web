import { uiTokens } from './uiTokens.js'

export const tableStyles = {
  contenedor: {
    borderRadius: 0,
    overflow: 'hidden',
    minHeight: 320,
    bgcolor: 'background.paper',
  },
  contenedorCompacto: {
    borderRadius: 0,
    overflow: 'hidden',
    bgcolor: 'background.paper',
  },
  cabecera: {
    fontWeight: 900,
    color: 'text.primary',
    bgcolor: (theme) => theme.palette.mode === 'dark' ? '#273449' : uiTokens.colores.cabeceraTabla,
    borderBottom: `1px solid ${uiTokens.colores.bordeSuave}`,
    py: 0.9,
    whiteSpace: 'nowrap',
  },
  tabla: {
    '& th': {
      fontSize: uiTokens.tipografia.tablaCabecera,
      fontWeight: 900,
      color: 'text.primary',
      bgcolor: (theme) => theme.palette.mode === 'dark' ? '#273449' : uiTokens.colores.cabeceraTabla,
      borderBottom: `1px solid ${uiTokens.colores.bordeSuave}`,
      py: 0.9,
      whiteSpace: 'nowrap',
    },
    '& td': {
      fontSize: uiTokens.tipografia.tabla,
      borderBottom: `1px solid ${uiTokens.colores.bordeSuave}`,
      py: 0.8,
      verticalAlign: 'middle',
    },
  },
  panel: {
    border: `1px solid ${uiTokens.colores.borde}`,
    borderRadius: '16px',
    overflow: 'hidden',
    bgcolor: 'background.paper',
  },
  panelHeader: {
    p: 1.5,
    borderBottom: `1px solid ${uiTokens.colores.bordeSuave}`,
  },
  vacio: {
    py: 7,
    color: uiTokens.colores.textoMedio,
    fontSize: 13,
    fontWeight: 700,
  },
}
