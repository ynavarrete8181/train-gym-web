import { faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Stack } from '@mui/material';
import { useState } from 'react';
import reviveLogo from '../../../assets/brand/revive-logo.jpeg';
import { obtenerUsuarioActual } from '../../auth/services/authService.js';

function escapar(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function fechaHoraInstitucional(valor = new Date()) {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(valor);
}

function etiquetaFiltro(clave) {
  return clave
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function filtrosVisibles(filtros = {}) {
  const ignorar = new Set(['page', 'per_page']);
  return Object.entries(filtros)
    .filter(([clave, valor]) => !ignorar.has(clave) && valor !== '' && valor !== null && valor !== undefined && !(Array.isArray(valor) && valor.length === 0))
    .map(([clave, valor]) => [etiquetaFiltro(clave), Array.isArray(valor) ? valor.join(', ') : valor]);
}

export function ReporteExportaciones({
  titulo,
  descripcion,
  filtros,
  columnas,
  obtenerFilas,
  exportarExcel,
}) {
  const [procesando, setProcesando] = useState('');

  const generarPdf = async () => {
    setProcesando('pdf');
    try {
      const [filas, sesion] = await Promise.all([
        obtenerFilas(),
        obtenerUsuarioActual(),
      ]);

      const usuario = sesion?.usuario || {};
      const generadoEl = fechaHoraInstitucional(new Date());
      const logoUrl = new URL(reviveLogo, window.location.href).href;
      const filtrosHtml = filtrosVisibles(filtros)
        .map(([clave, valor]) => `<span><strong>${escapar(clave)}:</strong> ${escapar(valor)}</span>`)
        .join('');

      const thead = columnas.map((c) => `<th class="${c.align === 'left' ? 'izq' : 'centro'}">${escapar(c.label)}</th>`).join('');
      const tbody = filas.map((fila) => `<tr>${columnas.map((c) => {
        const valor = typeof c.value === 'function' ? c.value(fila) : fila?.[c.value];
        return `<td class="${c.align === 'left' ? 'izq' : 'centro'}">${escapar(valor)}</td>`;
      }).join('')}</tr>`).join('');

      const ventana = window.open('', '_blank');
      if (!ventana) return;
      ventana.opener = null;

      ventana.document.write(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${escapar(titulo)}</title>
<style>
  @page { size: landscape; margin: 16mm 16mm 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #202124;
    font-size: 9.5px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .documento {
    width: 100%;
    max-width: 100%;
  }
  .membrete {
    position: relative;
    min-height: 84px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 3px solid #f5c400;
    padding: 0 118px 11px;
    margin-bottom: 9px;
  }
  .logo {
    position: absolute;
    left: 0;
    top: 4px;
    width: 104px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }
  .logo img {
    max-width: 96px;
    max-height: 66px;
    object-fit: contain;
  }
  .encabezado-centro {
    width: 100%;
    text-align: center;
  }
  .marca {
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 1.2px;
    color: #5b4700;
    text-transform: uppercase;
  }
  .tipo-documento {
    margin-top: 1px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.4px;
    color: #6b7280;
    text-transform: uppercase;
  }
  .titulo {
    margin: 7px 0 3px;
    font-size: 18px;
    line-height: 1.15;
    font-weight: 900;
    color: #171717;
  }
  .descripcion {
    max-width: 720px;
    margin: 0 auto;
    font-size: 9.5px;
    line-height: 1.35;
    color: #5f6368;
  }
  .informacion-documento {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 22px;
    padding: 9px 10px;
    margin: 0 0 8px;
    background: #fafafa;
    border: 1px solid #e3e3e3;
    border-radius: 4px;
  }
  .dato {
    display: grid;
    grid-template-columns: 92px 1fr;
    gap: 7px;
    min-width: 0;
  }
  .dato-etiqueta {
    font-weight: 800;
    color: #3f3f3f;
  }
  .dato-valor {
    color: #5f6368;
    overflow-wrap: anywhere;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 16px;
    min-height: 26px;
    padding: 7px 9px;
    margin-bottom: 10px;
    border: 1px solid #ececec;
    border-left: 3px solid #f5c400;
    background: #fffdf5;
  }
  .meta span { white-space: normal; }
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
    margin-bottom: 16px;
  }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th {
    background: #2f2f2f;
    color: white;
    font-size: 8.5px;
    font-weight: 800;
    padding: 6px 5px;
    border: 1px solid #d2d2d2;
  }
  td {
    padding: 5px;
    border: 1px solid #e1e1e1;
    vertical-align: middle;
    line-height: 1.3;
  }
  tbody tr:nth-child(even) { background: #fafafa; }
  .izq { text-align: left; }
  .centro { text-align: center; }
  .pie {
    position: fixed;
    left: 0;
    right: 0;
    bottom: -10mm;
    padding-top: 5px;
    border-top: 1px solid #d8d8d8;
    font-size: 7.5px;
    color: #777;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  @media print {
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <main class="documento">
    <header class="membrete">
      <div class="logo"><img src="${logoUrl}" alt="Revive" /></div>
      <div class="encabezado-centro">
        <div class="marca">REVIVE</div>
        <div class="tipo-documento">REPORTE INSTITUCIONAL</div>
        <div class="titulo">${escapar(titulo)}</div>
        <div class="descripcion">${escapar(descripcion)}</div>
      </div>
    </header>

    <section class="informacion-documento">
      <div class="dato">
        <span class="dato-etiqueta">Generado por:</span>
        <span class="dato-valor">${escapar(usuario.name || 'Usuario')}</span>
      </div>
      <div class="dato">
        <span class="dato-etiqueta">Rol:</span>
        <span class="dato-valor">${escapar(usuario.rol_nombre || 'Sin rol')}</span>
      </div>
      <div class="dato">
        <span class="dato-etiqueta">Correo:</span>
        <span class="dato-valor">${escapar(usuario.email || '')}</span>
      </div>
      <div class="dato">
        <span class="dato-etiqueta">Generado el:</span>
        <span class="dato-valor">${escapar(generadoEl)}</span>
      </div>
    </section>

    <section class="meta">${filtrosHtml || '<span><strong>Filtros:</strong> Sin filtros adicionales</span>'}</section>

    <table>
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody || `<tr><td colspan="${columnas.length}" class="centro">Sin registros</td></tr>`}</tbody>
    </table>

    <footer class="pie">
      <span>Revive · Sistema de Gestión</span>
      <span>${escapar(titulo)} · ${escapar(generadoEl.split(' ')[0] || generadoEl)}</span>
    </footer>
  </main>
</body>
</html>`);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => ventana.print(), 350);
    } finally {
      setProcesando('');
    }
  };

  const generarExcel = async () => {
    setProcesando('excel');
    try {
      await exportarExcel();
    } finally {
      setProcesando('');
    }
  };

  return (
    <Stack direction="row" spacing={0.75}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<FontAwesomeIcon icon={faFileExcel} />}
        disabled={Boolean(procesando)}
        onClick={generarExcel}
        sx={{
          minHeight: 38,
          borderRadius: 1.2,
          textTransform: 'none',
          borderColor: '#2e7d32',
          color: '#2e7d32',
          fontWeight: 700,
          '&:hover': {
            borderColor: '#2e7d32',
            backgroundColor: 'rgba(46,125,50,0.08)',
          },
        }}
      >
        {procesando === 'excel' ? 'Generando...' : 'EXCEL'}
      </Button>

      <Button
        size="small"
        variant="outlined"
        startIcon={<FontAwesomeIcon icon={faFilePdf} />}
        disabled={Boolean(procesando)}
        onClick={generarPdf}
        sx={{
          minHeight: 38,
          borderRadius: 1.2,
          textTransform: 'none',
          borderColor: '#c62828',
          color: '#c62828',
          fontWeight: 700,
          '&:hover': {
            borderColor: '#c62828',
            backgroundColor: 'rgba(198,40,40,0.08)',
          },
        }}
      >
        {procesando === 'pdf' ? 'Generando...' : 'PDF'}
      </Button>
    </Stack>
  );
}
