import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import SportsOutlinedIcon from '@mui/icons-material/SportsOutlined';
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';

const hora = (valor) => String(valor || '').slice(0, 5);
const fecha = (valor) => String(valor || '').slice(0, 10);
const dias = (items = []) => items.map((d) => String(d).slice(0, 3)).join(' · ');

export function EntrenadorConfiguracion({ datos, cargando = false, onVolver, onEditar }) {
  if (cargando || !datos) {
    return (
      <Box className="page-wrapper">
        <PageHeader
          titulo="Configuración del entrenador"
          descripcion="Consultando configuración operativa..."
          icono={<AccountCircleOutlinedIcon />}
          acciones={<BotonVolver onClick={onVolver} />}
        />
        <Paper className="page-content-container" elevation={0} sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">Cargando información...</Typography>
        </Paper>
      </Box>
    );
  }

  const entrenador = datos.entrenador || {};
  const servicios = datos.servicios || [];
  const asignaciones = datos.asignaciones || [];
  const excepciones = datos.excepciones || [];
  const resumen = datos.resumen || {};
  const nombre = [entrenador.nombres, entrenador.apellidos].filter(Boolean).join(' ') || entrenador.name || 'Entrenador';

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo={nombre}
        descripcion="Configuración operativa del entrenador"
        icono={<AccountCircleOutlinedIcon />}
        acciones={
          <Stack direction="row" spacing={1}>
            <BotonVolver onClick={onVolver} />
            <Button
              startIcon={<EditOutlinedIcon />}
              onClick={onEditar}
              sx={dbanuStyles.addButtonRevive}
            >
              Editar
            </Button>
          </Stack>
        }
      />

      <Paper className="page-content-container" elevation={0}>
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.15fr .85fr' },
              gap: 1.5,
            }}
          >
            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 1.7 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="h6" fontWeight={950}>{nombre}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[entrenador.tipo || 'COACH', entrenador.especialidad || 'General'].join(' · ')}
                  </Typography>
                </Box>
                <StatusChip estado={String(entrenador.estado || '').toLowerCase()} />
              </Stack>

              <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' }, gap: 1.2 }}>
                <Dato label="Cédula" valor={entrenador.cedula || '—'} />
                <Dato label="Correo" valor={entrenador.email || '—'} />
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2,1fr)',
                gap: 1,
              }}
            >
              <ResumenCard icono={<SportsOutlinedIcon />} valor={resumen.servicios || 0} texto="Servicios" />
              <ResumenCard icono={<LocationOnOutlinedIcon />} valor={resumen.sedes || 0} texto="Sedes" />
              <ResumenCard icono={<CalendarMonthOutlinedIcon />} valor={resumen.asignaciones || 0} texto="Asignaciones" />
              <ResumenCard icono={<EventBusyOutlinedIcon />} valor={resumen.excepciones || 0} texto="Excepciones" />
            </Box>
          </Box>

          <Seccion titulo="Servicios habilitados" icono={<SportsOutlinedIcon />}>
            {servicios.length ? (
              <Stack direction="row" spacing={.8} useFlexGap flexWrap="wrap">
                {servicios.map((servicio) => (
                  <Chip
                    key={servicio.id}
                    label={`${servicio.nombre} · ${servicio.duracion_minutos} min`}
                    variant="outlined"
                    sx={{ fontWeight: 750, bgcolor: '#fff' }}
                  />
                ))}
              </Stack>
            ) : (
              <Vacio texto="No tiene servicios habilitados." />
            )}
          </Seccion>

          <Seccion titulo="Sedes y horarios asignados" icono={<CalendarMonthOutlinedIcon />}>
            {asignaciones.length ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: 'repeat(2,1fr)' }, gap: 1 }}>
                {asignaciones.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 1.5,
                      p: 1.35,
                      bgcolor: '#fff',
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      <Stack direction="row" spacing={.7} alignItems="center">
                        <LocationOnOutlinedIcon sx={{ fontSize: 18, color: '#9a7100' }} />
                        <Typography variant="body2" fontWeight={900}>{item.sede_nombre}</Typography>
                      </Stack>
                      <Chip size="small" label={item.jornada_nombre} sx={{ fontWeight: 800 }} />
                    </Stack>

                    <Box sx={{ mt: 1.1, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' }, gap: .9 }}>
                      <Dato
                        icono={<CalendarMonthOutlinedIcon />}
                        label="Días"
                        valor={dias(item.dias_semana) || '—'}
                      />
                      <Dato
                        icono={<AccessTimeOutlinedIcon />}
                        label="Horario"
                        valor={`${hora(item.hora_inicio)} - ${hora(item.hora_fin)}`}
                      />
                      <Dato
                        icono={<CoffeeOutlinedIcon />}
                        label="Receso"
                        valor={item.receso_nombre
                          ? `${item.receso_nombre} · ${hora(item.receso_hora_inicio)}-${hora(item.receso_hora_fin)}`
                          : 'Sin receso'}
                      />
                      <Dato
                        label="Vigencia"
                        valor={`${fecha(item.fecha_inicio)} - ${item.fecha_fin ? fecha(item.fecha_fin) : 'Sin fecha final'}`}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Vacio texto="No tiene horarios asignados." />
            )}
          </Seccion>

          <Seccion titulo="Próximas excepciones" icono={<EventBusyOutlinedIcon />}>
            {excepciones.length ? (
              <Box sx={{ display: 'grid', gap: .8 }}>
                {excepciones.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1.2fr' },
                      gap: 1,
                      alignItems: 'center',
                      border: '1px solid #e2e8f0',
                      borderRadius: 1.5,
                      p: 1.15,
                      bgcolor: '#fff',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={900}>{item.motivo}</Typography>
                      <Typography variant="caption" color="text.secondary">{String(item.tipo || '').replaceAll('_', ' ')}</Typography>
                    </Box>
                    <Dato label="Sede" valor={item.sede_nombre || '—'} />
                    <Dato
                      label="Fecha / horario"
                      valor={`${fecha(item.fecha_inicio)}${item.fecha_fin !== item.fecha_inicio ? ` - ${fecha(item.fecha_fin)}` : ''} · ${item.hora_inicio ? `${hora(item.hora_inicio)}-${hora(item.hora_fin)}` : 'Todo el día'}`}
                    />
                  </Box>
                ))}
              </Box>
            ) : (
              <Vacio texto="No tiene excepciones próximas." />
            )}
          </Seccion>
        </Box>
      </Paper>
    </Box>
  );
}

function Seccion({ titulo, icono, children }) {
  return (
    <Box sx={{ mt: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, p: 1.6, bgcolor: '#f8fafc' }}>
      <Stack direction="row" spacing={.8} alignItems="center" sx={{ mb: 1.2 }}>
        <Box sx={{ display: 'flex', color: '#9a7100', '& svg': { fontSize: 19 } }}>{icono}</Box>
        <Typography variant="subtitle2" fontWeight={950}>{titulo}</Typography>
      </Stack>
      {children}
    </Box>
  );
}

function Dato({ icono, label, valor }) {
  return (
    <Stack direction="row" spacing={.7} alignItems="flex-start">
      {icono ? <Box sx={{ display: 'flex', mt: .15, color: '#64748b', '& svg': { fontSize: 17 } }}>{icono}</Box> : null}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
        <Typography variant="body2" fontWeight={750} sx={{ overflowWrap: 'anywhere' }}>{valor}</Typography>
      </Box>
    </Stack>
  );
}

function ResumenCard({ icono, valor, texto }) {
  return (
    <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5, p: 1.2, bgcolor: '#fff' }}>
      <Stack direction="row" spacing={.8} alignItems="center">
        <Box sx={{ display: 'flex', color: '#9a7100', '& svg': { fontSize: 20 } }}>{icono}</Box>
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 950, lineHeight: 1 }}>{valor}</Typography>
          <Typography variant="caption" color="text.secondary">{texto}</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

function Vacio({ texto }) {
  return <Typography variant="body2" color="text.secondary">{texto}</Typography>;
}
