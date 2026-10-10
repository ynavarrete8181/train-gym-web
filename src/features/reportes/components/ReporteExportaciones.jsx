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
      const generadoEl = new Date().toLocaleString('es-EC');
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
  @page { size: landscape; margin: 12mm 10mm 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #202124; font-size: 10px; }
  .membrete { display: grid; grid-template-columns: 105px 1fr 210px; gap: 14px; align-items: center; border-bottom: 4px solid #f5c400; padding: 0 0 10px; }
  .logo img { max-width: 92px; max-height: 68px; object-fit: contain; }
  .institucion { font-size: 12px; font-weight: 900; color: #5b4700; letter-spacing: .8px; }
  .titulo { font-size: 20px; font-weight: 900; color: #171717; margin: 3px 0; }
  .descripcion { font-size: 10px; color: #5f6368; line-height: 1.35; }
  .generacion { text-align: right; font-size: 9px; line-height: 1.5; }
  .generacion strong { color: #171717; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 9px 0 8px; border-bottom: 1px solid #dedede; margin-bottom: 10px; }
  .meta span { white-space: nowrap; }
  table { width: 100%; border-collapse: collapse; table-layout: auto; }
  thead { display: table-header-group; }
  th { background: #4f3c0a; color: white; font-size: 9px; font-weight: 800; padding: 6px 5px; border: 1px solid #d8d8d8; }
  td { padding: 5px; border: 1px solid #e1e1e1; vertical-align: middle; }
  tbody tr:nth-child(even) { background: #fafafa; }
  .izq { text-align: left; }
  .centro { text-align: center; }
  .pie { margin-top: 10px; padding-top: 6px; border-top: 1px solid #ddd; font-size: 8px; color: #777; display: flex; justify-content: space-between; }
  @media print {
    .no-print { display: none; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <header class="membrete">
    <div class="logo"><img src="${logoUrl}" alt="Revive" /></div>
    <div>
      <div class="institucion">REVIVE · REPORTE INSTITUCIONAL</div>
      <div class="titulo">${escapar(titulo)}</div>
      <div class="descripcion">${escapar(descripcion)}</div>
    </div>
    <div class="generacion">
      <div><strong>Generado por:</strong> ${escapar(usuario.name || 'Usuario')}</div>
      <div><strong>Rol:</strong> ${escapar(usuario.rol_nombre || 'Sin rol')}</div>
      <div><strong>Correo:</strong> ${escapar(usuario.email || '')}</div>
      <div><strong>Fecha:</strong> ${escapar(generadoEl)}</div>
    </div>
  </header>
  <section class="meta">${filtrosHtml || '<span><strong>Filtros:</strong> Sin filtros adicionales</span>'}</section>
  <table>
    <thead><tr>${thead}</tr></thead>
    <tbody>${tbody || `<tr><td colspan="${columnas.length}" class="centro">Sin registros</td></tr>`}</tbody>
  </table>
  <footer class="pie">
    <span>Revive · Documento generado desde el sistema</span>
    <span>${escapar(titulo)}</span>
  </footer>
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
