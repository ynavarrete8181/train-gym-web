import { useEffect, useMemo, useState } from 'react';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import { Box, Chip, Paper, Stack, Tab, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { uiTokens } from '../../../styles/uiTokens.js';
import { reportesAuditoriaServicio } from '../services/reportesAuditoriaServicio.js';

const reportes = [
  { value: 'USUARIO', label: 'Actividad por usuario' },
  { value: 'MODULO', label: 'Actividad por módulo' },
  { value: 'CRITICOS', label: 'Cambios críticos' },
  { value: 'ACCESOS_FALLIDOS', label: 'Accesos fallidos' },
  { value: 'ERRORES_RECURRENTES', label: 'Errores recurrentes' },
];

const fecha = (valor) => (valor ? new Date(valor).toLocaleString('es-EC') : '—');
const numero = (valor) => Number(valor || 0).toLocaleString('es-EC');

const configuraciones = {
  USUARIO: {
    columnas: [
      ['Usuario', 'usuario', 'left'],
      ['Rol', 'rol', 'center'],
      ['Eventos', 'eventos', 'center', numero],
      ['Módulos', 'modulos', 'center', numero],
      ['Última actividad', 'ultima_actividad', 'center', fecha],
    ],
  },
  MODULO: {
    columnas: [
      ['Módulo', 'modulo', 'left'],
      ['Eventos', 'eventos', 'center', numero],
      ['Usuarios', 'usuarios', 'center', numero],
      ['Acciones', 'acciones', 'center', numero],
      ['Última actividad', 'ultima_actividad', 'center', fecha],
    ],
  },
  CRITICOS: {
    columnas: [
      ['Fecha', 'created_at', 'center', fecha],
      ['Usuario', 'usuario', 'left'],
      ['Rol', 'rol', 'center'],
      ['Módulo', 'modulo', 'center'],
      ['Tabla', 'tabla', 'left'],
      ['Registro', 'registro_id', 'center'],
      ['Acción', 'accion', 'center'],
      ['Descripción', 'descripcion', 'left'],
      ['IP', 'ip', 'center'],
    ],
  },
  ACCESOS_FALLIDOS: {
    columnas: [
      ['Usuario', 'usuario', 'left'],
      ['IP', 'ip', 'center'],
      ['Intentos', 'intentos', 'center', numero],
      ['Último intento', 'ultimo_intento', 'center', fecha],
      ['Último motivo', 'ultimo_motivo', 'left'],
    ],
  },
  ERRORES_RECURRENTES: {
    columnas: [
      ['Módulo', 'modulo', 'left'],
      ['Acción', 'accion', 'left'],
      ['Mensaje', 'mensaje', 'left'],
      ['Ocurrencias', 'ocurrencias', 'center', numero],
      ['Última ocurrencia', 'ultima_ocurrencia', 'center', fecha],
    ],
  },
};

export function ReportesAuditoriaPage() {
  const hoy = new Date();
  const [tipo, setTipo] = useState('USUARIO');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
    page: 1,
    per_page: 10,
  });

  const cargar = async (tipoActual = tipo, parametros = filtros) => {
    setCargando(true);
    try {
      const response = await reportesAuditoriaServicio.consultar({ ...parametros, tipo: tipoActual });
      setItems(response.datos || []);
      setMeta(response.meta || {});
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const cambiarTipo = (_, valor) => {
    setTipo(valor);
    const nuevos = { ...filtros, page: 1 };
    setFiltros(nuevos);
    cargar(valor, nuevos);
  };

  const aplicar = (cambios) => {
    const nuevos = { ...filtros, ...cambios, page: 1 };
    setFiltros(nuevos);
    cargar(tipo, nuevos);
  };

  const columnas = useMemo(() => configuraciones[tipo]?.columnas || [], [tipo]);
  const tituloActual = reportes.find((reporte) => reporte.value === tipo)?.label || 'Reporte';

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Reportes de auditoría"
        descripcion="Análisis detallado de actividad, cambios críticos, accesos y errores del sistema."
        icono={<AssessmentOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <Tabs
          value={tipo}
          onChange={cambiarTipo}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 36,
            mb: 1.5,
            borderBottom: `1px solid ${uiTokens.colores.borde}`,
            '& .MuiTab-root': { minHeight: 36, py: 0.5, fontSize: 11.5, fontWeight: 800, textTransform: 'none' },
          }}
        >
          {reportes.map((reporte) => <Tab key={reporte.value} value={reporte.value} label={reporte.label} />)}
        </Tabs>

        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicar({ busqueda: valor })}
          resumen={<Chip variant="outlined" label={tituloActual} sx={{ height: 38, borderRadius: 0.5, fontWeight: 900 }} />}
          acciones={(
            <Stack direction="row" spacing={1}>
              <TextField size="small" type="date" label="Desde" value={filtros.desde} onChange={(e) => aplicar({ desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label="Hasta" value={filtros.hasta} onChange={(e) => aplicar({ hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
          )}
        />

        <TablaGestion
          total={meta.total || 0}
          filtrados={meta.total || 0}
          page={meta.pagina_actual || 1}
          rowsPerPage={meta.por_pagina || 10}
          onPageChange={(page) => {
            const nuevos = { ...filtros, page };
            setFiltros(nuevos);
            cargar(tipo, nuevos);
          }}
          onRowsPerPageChange={(perPage) => {
            const nuevos = { ...filtros, page: 1, per_page: perPage };
            setFiltros(nuevos);
            cargar(tipo, nuevos);
          }}
          cargando={cargando}
        >
          <TableHead>
            <TableRow>
              {columnas.map(([label, key, align]) => <TableCell key={key} align={align || 'left'}>{label}</TableCell>)}
            </TableRow>
          </TableHead>

          <TableBody>
            {!cargando && items.length === 0 ? (
              <TablaEstadoFila colSpan={columnas.length} texto="No existen datos para el período seleccionado." />
            ) : null}

            {items.map((item, index) => (
              <TableRow hover key={item.id || `${tipo}-${index}`}>
                {columnas.map(([_, key, align, formatter]) => (
                  <TableCell key={key} align={align || 'left'}>
                    {key === 'accion' && tipo === 'CRITICOS'
                      ? <Chip label={item[key] || '—'} size="small" variant="outlined" color="warning" />
                      : key === 'mensaje'
                        ? <Typography sx={{ fontSize: 12, maxWidth: 520, whiteSpace: 'normal' }}>{item[key] || '—'}</Typography>
                        : formatter
                          ? formatter(item[key])
                          : (item[key] ?? '—')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </TablaGestion>
      </Paper>
    </Box>
  );
}
