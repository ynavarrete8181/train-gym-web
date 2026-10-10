import { faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button, Stack } from '@mui/material';
import { useState } from 'react';
import reviveLogo from '../../../assets/brand/revive-logo.jpeg';
import { obtenerUsuarioActual } from '../../auth/services/authService.js';
import { generarPdfReporte } from '../services/generarPdfReporte.js';

function fechaHoraInstitucional(valor = new Date()) {
  const fecha = new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(valor);

  const hora = new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(valor);

  return `${fecha}, ${hora}`;
}

function fechaInstitucional(valor = '') {
  if (!valor) return '';
  const [anio, mes, dia] = String(valor).split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : valor;
}

function etiquetaFiltro(clave) {
  return clave
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function periodoReporte(filtros = {}) {
  const desde = filtros.desde || filtros.vence_desde || '';
  const hasta = filtros.hasta || filtros.vence_hasta || '';

  if (desde && hasta) {
    return `${fechaInstitucional(desde)} - ${fechaInstitucional(hasta)}`;
  }

  return fechaInstitucional(desde || hasta) || 'Sin período definido';
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
  const ignorar = new Set([
    'page',
    'per_page',
    'desde',
    'hasta',
    'vence_desde',
    'vence_hasta',
    'sede_id',
  ]);

  return Object.entries(filtros)
    .filter(([clave, valor]) => (
      !ignorar.has(clave)
      && valor !== ''
      && valor !== null
      && valor !== undefined
      && !(Array.isArray(valor) && valor.length === 0)
    ))
    .map(([clave, valor]) => [
      etiquetaFiltro(clave),
      Array.isArray(valor) ? valor.join(', ') : valor,
    ]);
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
    const visor = window.open('', '_blank');

    if (visor) {
      visor.document.title = `Revive · ${titulo}`;
      visor.document.body.innerHTML = '<div style="font-family:Arial,sans-serif;padding:24px;color:#444">Generando PDF...</div>';
    }

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

      const resultado = await generarPdfReporte({
        titulo,
        descripcion,
        filtros,
        columnas,
        filas,
        usuario,
        generadoEl,
        periodo,
        sedes,
        logoUrl,
        filtrosAdicionales: filtrosVisibles(filtros),
      });

      const archivo = new File(
        [resultado.bytes],
        resultado.nombre,
        { type: 'application/pdf' },
      );
      const url = URL.createObjectURL(archivo);

      if (visor && !visor.closed) {
        visor.location.replace(url);
      } else {
        window.open(url, '_blank');
      }

      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = resultado.nombre;
      enlace.style.display = 'none';
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (error) {
      if (visor && !visor.closed) {
        visor.document.body.innerHTML = '<div style="font-family:Arial,sans-serif;padding:24px;color:#c62828">No se pudo generar el PDF.</div>';
      }
      throw error;
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
