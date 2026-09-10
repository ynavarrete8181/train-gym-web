import { createTheme } from '@mui/material/styles'
import { colores } from './colors.js'
import { uiTokens } from './uiTokens.js'

export function crearTema(modo = 'light') {
  return createTheme({
    palette: {
      mode: modo,
      primary: { main: colores.primario },
      secondary: { main: colores.secundario },
      success: { main: colores.exito },
      background: {
        default: modo === 'dark' ? colores.fondoOscuro : colores.fondoClaro,
        paper: modo === 'dark' ? colores.superficieOscura : colores.superficieClara,
      },
      text: {
        primary: modo === 'dark' ? '#f8fafc' : '#1f2937',
        secondary: modo === 'dark' ? '#cbd5e1' : colores.neutro,
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: uiTokens.tipografia.familia,
      button: {
        letterSpacing: 0,
      },
      allVariants: {
        letterSpacing: 0,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': { colorScheme: modo },
          body: { backgroundColor: modo === 'dark' ? colores.fondoOscuro : colores.fondoClaro },
          '.page-header-container, .page-content-container': {
            backgroundColor: modo === 'dark' ? colores.superficieOscura : colores.superficieClara,
            borderColor: modo === 'dark' ? '#334155' : '#dbe3f0',
          },
          '.page-header-title': { color: modo === 'dark' ? '#f8fafc' : '#0b1f3a' },
          '.page-header-subtitle': { color: modo === 'dark' ? '#cbd5e1' : '#64748b' },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
          fullWidth: true,
        },
      },
      MuiFormControl: {
        defaultProps: {
          size: 'small',
          fullWidth: true,
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: uiTokens.tipografia.campo,
            fontWeight: 550,
            color: modo === 'dark' ? '#94a3b8' : '#64748b',
            '&.MuiInputLabel-shrink': {
              fontWeight: 700,
              color: modo === 'dark' ? '#cbd5e1' : '#334155',
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            minHeight: uiTokens.alturas.campo,
            borderRadius: 12,
            backgroundColor: modo === 'dark' ? '#111827' : '#fff',
            fontSize: uiTokens.tipografia.campo,
          },
          input: {
            paddingTop: 8,
            paddingBottom: 8,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: uiTokens.colores.borde,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: uiTokens.colores.primario,
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            minHeight: 34,
            fontSize: uiTokens.tipografia.campo,
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
          size: 'small',
        },
        styleOverrides: {
          root: {
            minHeight: uiTokens.alturas.boton,
            borderRadius: 8,
            fontSize: uiTokens.tipografia.boton,
            fontWeight: 800,
            textTransform: 'none',
            paddingInline: 14,
            whiteSpace: 'nowrap',
          },
          sizeLarge: {
            minHeight: uiTokens.alturas.botonGrande,
            paddingInline: 20,
          },
          containedPrimary: {
            backgroundColor: uiTokens.colores.primario,
            '&:hover': {
              backgroundColor: uiTokens.colores.primarioOscuro,
            },
          },
          containedSecondary: {
            backgroundColor: uiTokens.colores.secundario,
            '&:hover': {
              backgroundColor: uiTokens.colores.secundarioOscuro,
            },
          },
          outlined: {
            borderColor: uiTokens.colores.borde,
          },
        },
      },
      MuiIconButton: {
        defaultProps: {
          size: 'small',
        },
        styleOverrides: {
          root: {
            width: uiTokens.alturas.icono,
            height: uiTokens.alturas.icono,
            borderRadius: 8,
            '.MuiTableCell-root &': {
              width: 28,
              height: 28,
              borderRadius: 4,
              border: `1px solid ${uiTokens.colores.primario}`,
              color: uiTokens.colores.primario,
              backgroundColor: modo === 'dark' ? '#111827' : '#fff',
              '&:hover': {
                backgroundColor: modo === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(20, 73, 133, 0.06)',
              },
              '&:has([data-testid="EditOutlinedIcon"])': {
                color: uiTokens.colores.acento,
                borderColor: uiTokens.colores.acento,
                '&:hover': { backgroundColor: 'rgba(212, 160, 23, 0.08)' },
              },
              '&:has([data-testid="DeleteOutlineOutlinedIcon"]), &:has([data-testid="DeleteOutlinedIcon"])': {
                color: uiTokens.colores.secundario,
                borderColor: uiTokens.colores.secundario,
                '&:hover': { backgroundColor: uiTokens.colores.secundarioSuave },
              },
              '&:has([data-testid="VisibilityOutlinedIcon"]), &:has([data-testid="HistoryOutlinedIcon"]), &:has([data-testid="ReplayOutlinedIcon"]), &:has([data-testid="SendOutlinedIcon"]), &:has([data-testid="LockResetOutlinedIcon"]), &:has([data-testid="ContentCopyOutlinedIcon"])': {
                color: uiTokens.colores.primario,
                borderColor: uiTokens.colores.primario,
              },
              '&.Mui-disabled': {
                borderColor: uiTokens.colores.bordeSuave,
                color: modo === 'dark' ? '#64748b' : '#a8b3c2',
              },
              '& .MuiSvgIcon-root': {
                fontSize: 17,
              },
            },
          },
        },
      },
      MuiTable: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontSize: uiTokens.tipografia.tablaCabecera,
            fontWeight: 900,
            color: modo === 'dark' ? '#f8fafc' : uiTokens.colores.textoFuerte,
            backgroundColor: modo === 'dark' ? '#1e293b' : uiTokens.colores.cabeceraTabla,
            borderBottom: `1px solid ${modo === 'dark' ? '#334155' : uiTokens.colores.bordeSuave}`,
            paddingTop: 7,
            paddingBottom: 7,
            whiteSpace: 'nowrap',
          },
          body: {
            fontSize: uiTokens.tipografia.tabla,
            borderBottom: `1px solid ${modo === 'dark' ? '#334155' : uiTokens.colores.bordeSuave}`,
            paddingTop: 6,
            paddingBottom: 6,
            verticalAlign: 'middle',
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&.MuiTableRow-hover:hover': {
              backgroundColor: modo === 'dark' ? 'rgba(255,255,255,0.04)' : '#f8fbff',
            },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${uiTokens.colores.bordeSuave}`,
          },
          toolbar: {
            minHeight: 44,
            fontSize: 12,
          },
          selectLabel: {
            fontSize: 12,
          },
          displayedRows: {
            fontSize: 12,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            height: 24,
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 800,
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            padding: 5,
            color: uiTokens.colores.primario,
            '&.Mui-checked': {
              color: uiTokens.colores.primario,
            },
          },
        },
      },
      MuiFormControlLabel: {
        styleOverrides: {
          root: {
            marginLeft: -6,
            marginRight: 0,
          },
          label: {
            fontSize: 12,
            color: modo === 'dark' ? '#f8fafc' : uiTokens.colores.textoFuerte,
            fontWeight: 650,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: 18,
            fontWeight: 900,
            color: modo === 'dark' ? '#f8fafc' : uiTokens.colores.textoFuerte,
            borderBottom: `1px solid ${uiTokens.colores.bordeSuave}`,
            background: modo === 'dark' ? '#111827' : `linear-gradient(135deg, ${uiTokens.colores.primarioSuave}, #ffffff)`,
            padding: 0,
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${uiTokens.colores.bordeSuave}`,
            padding: '12px 22px',
            gap: 10,
            background: modo === 'dark' ? '#111827' : '#fff',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.active': {
              backgroundColor: 'rgba(21, 94, 117, 0.12)',
            },
          },
        },
      },
    },
  })
}
