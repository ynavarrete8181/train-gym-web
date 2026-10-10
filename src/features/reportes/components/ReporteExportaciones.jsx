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

function periodoReporte(filtros = {}) {
  const desde = filtros.desde || filtros.vence_desde || '';
  const hasta = filtros.hasta || filtros.vence_hasta || '';
  if (desde && hasta) return `${desde} - ${hasta}`;
  return desde || hasta || 'Sin período definido';
}

function sedesReporte(filas = []) {
  const sedes = [...new Set(
    filas
      .map((fila) => fila?.sede)
      .filter((sede) => typeof sede === 'string' && sede.trim())
      .map((sede) => sede.trim()),
  )];

  if (sedes.length === 0) return 'Todas las sedes';
  if (sedes.length <= 3) return sedes.join(', ');
  return `${sedes.slice(0, 3).join(', ')} y ${sedes.length - 3} más`;
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
      const periodo = periodoReporte(filtros);
      const sedes = sedesReporte(filas);
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
  html, body { margin: 0; padding: 0; min-height: 100%; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #202124;
    font-size: 9.5px;
    background: #e9ecef;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .barra-preview {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: rgba(255,255,255,.96);
    border-bottom: 1px solid #d9d9d9;
    box-shadow: 0 1px 5px rgba(0,0,0,.08);
  }
  .btn-imprimir {
    border: 1px solid #c62828;
    background: #fff;
    color: #c62828;
    border-radius: 5px;
    padding: 8px 13px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }
  .btn-imprimir:hover { background: rgba(198,40,40,.07); }
  .documento {
    width: 297mm;
    min-height: 210mm;
    margin: 18px auto 28px;
    padding: 16mm 16mm 18mm;
    background: #fff;
    box-shadow: 0 4px 22px rgba(0,0,0,.14);
  }
  .membrete {
    position: relative;
    min-height: 82px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 3px solid #f5c400;
    padding: 2px 118px 9px;
    margin-bottom: 8px;
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
  .institucion {
    font-size: 13px;
    line-height: 1.2;
    font-weight: 900;
    color: #171717;
    letter-spacing: .2px;
  }
  .titulo {
    margin: 4px 0 0;
    font-size: 17px;
    line-height: 1.15;
    font-weight: 900;
    color: #5b4700;
  }
  .informacion-documento {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 2px 14px;
    margin-top: 5px;
    padding: 0;
    font-size: 8.8px;
    line-height: 1.3;
  }
  .dato {
    display: inline-flex;
    gap: 4px;
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
    gap: 4px 14px;
    min-height: 22px;
    padding: 5px 7px;
    margin-bottom: 9px;
    border-left: 3px solid #f5c400;
    background: #fffdf5;
    color: #555;
    font-size: 8.5px;
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
    margin-top: 10px;
    padding-top: 5px;
    border-top: 1px solid #d8d8d8;
    font-size: 7.5px;
    color: #777;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
    .documento {
      width: auto;
      min-height: 0;
      margin: 0;
      padding: 0;
      box-shadow: none;
    }
    .pie {
      position: fixed;
      left: 0;
      right: 0;
      bottom: -10mm;
    }
  }
</style>
</head>
<body>
  <div class="barra-preview no-print">
    <button class="btn-imprimir" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>

  <main class="documento">
    <header class="membrete">
      <div class="logo"><img src="${logoUrl}" alt="Revive" /></div>
      <div class="encabezado-centro">
        <div class="institucion">Centro de Entrenamiento Físico Revive</div>
        <div class="titulo">Reporte de ${escapar(titulo)}</div>
        <div class="informacion-documento">
          <div class="dato">
            <span class="dato-etiqueta">Generado por:</span>
            <span class="dato-valor">${escapar(usuario.name || 'Usuario')}</span>
          </div>
          <div class="dato">
            <span class="dato-etiqueta">Rol:</span>
            <span class="dato-valor">${escapar(usuario.rol_nombre || 'Sin rol')}</span>
          </div>
          <div class="dato">
            <span class="dato-etiqueta">Período:</span>
            <span class="dato-valor">${escapar(periodo)}</span>
          </div>
          <div class="dato">
            <span class="dato-etiqueta">Sedes:</span>
            <span class="dato-valor">${escapar(sedes)}</span>
          </div>
        </div>
      </div>
    </header>

    <section class="meta">${filtrosHtml || '<span><strong>Filtros:</strong> Sin filtros adicionales</span>'}</section>

    <table>
      <thead><tr>${thead}</tr></thead>
      <tbody>${tbody || `<tr><td colspan="${columnas.length}" class="centro">Sin registros</td></tr>`}</tbody>
    </table>

    <footer class="pie">
      <span>Revive · Sistema de Gestión</span>
      <span>Generado: ${escapar(generadoEl)}</span>
    </footer>
  </main>
</body>
</html>`);
      ventana.document.close();
      ventana.focus();
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
