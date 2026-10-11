import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { CampoSelectIcono } from '../../../components/common/CampoSelectIcono.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';

const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export function MetaComercialFormulario({
  formulario,
  catalogos,
  guardando,
  onChange,
  onCambiarSede,
  onAgregarResponsable,
  onActualizarResponsable,
  onQuitarResponsable,
  onGuardar,
  onCancelar,
}) {
  const responsablesDisponibles = (catalogos.responsables || []).filter(
    (u) => !(formulario.responsables || []).some((r) => Number(r.usuario_id) === Number(u.id)),
  );

  return (
    <Paper elevation={0} sx={{ overflow: 'hidden', mt: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2.5 }}>
        <Stack spacing={2}>
          <Box sx={formStyles.seccion}>
            <Typography sx={formStyles.modalSeccionTitulo}>Configuración mensual</Typography>

            <Box sx={{ mb: 1.5, p: 1.3, border: '1px solid #dbe3f0', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 900, mb: 0.4 }}>
                ¿Cómo se configura?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Seleccione la sede y el período. Luego ingrese el objetivo total del mes para ventas, cobros,
                membresías nuevas y renovaciones. Las metas por responsable son opcionales y sirven para distribuir
                el objetivo de la sede entre personas específicas.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
              <CampoSelectIcono
                icono={<BusinessOutlinedIcon />}
                label="Sede"
                value={formulario.sede_id}
                onChange={(e) => onCambiarSede(e.target.value)}
                required
                options={(catalogos.sedes || []).map((s) => ({
                  value: s.id,
                  label: s.nombre,
                  description: 'Sede operativa',
                  icono: <BusinessOutlinedIcon />,
                }))}
              />

              <CampoSelectIcono
                icono={<EventOutlinedIcon />}
                label="Año"
                value={formulario.anio}
                onChange={(e) => onChange('anio', e.target.value)}
                required
                options={[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((anio) => ({
                  value: anio,
                  label: String(anio),
                  description: 'Año de cumplimiento',
                  icono: <EventOutlinedIcon />,
                }))}
              />

              <CampoSelectIcono
                icono={<CalendarMonthOutlinedIcon />}
                label="Mes"
                value={formulario.mes}
                onChange={(e) => onChange('mes', e.target.value)}
                required
                options={meses.map((m, i) => ({
                  value: i + 1,
                  label: m,
                  description: 'Período mensual',
                  icono: <CalendarMonthOutlinedIcon />,
                }))}
              />

              <TextField
                size="small"
                type="number"
                label="Meta ventas ($)"
                value={formulario.meta_ventas}
                onChange={(e) => onChange('meta_ventas', e.target.value)}
                helperText="Total facturado que la sede debe alcanzar en el mes."
                slotProps={{ htmlInput: { min: 0, step: '0.01' }, input: { startAdornment: <TrendingUpOutlinedIcon sx={{ mr: 1, fontSize: 18, color: '#144985' }} /> } }}
              />

              <TextField
                size="small"
                type="number"
                label="Meta cobros ($)"
                value={formulario.meta_cobros}
                onChange={(e) => onChange('meta_cobros', e.target.value)}
                helperText="Dinero efectivamente cobrado durante el mes."
                slotProps={{ htmlInput: { min: 0, step: '0.01' }, input: { startAdornment: <PaymentsOutlinedIcon sx={{ mr: 1, fontSize: 18, color: '#144985' }} /> } }}
              />

              <TextField
                size="small"
                type="number"
                label="Membresías nuevas"
                value={formulario.meta_membresias_nuevas}
                onChange={(e) => onChange('meta_membresias_nuevas', e.target.value)}
                helperText="Cantidad de membresías que inician su primer período."
                slotProps={{ htmlInput: { min: 0, step: 1 }, input: { startAdornment: <CardMembershipOutlinedIcon sx={{ mr: 1, fontSize: 18, color: '#144985' }} /> } }}
              />

              <TextField
                size="small"
                type="number"
                label="Renovaciones"
                value={formulario.meta_renovaciones}
                onChange={(e) => onChange('meta_renovaciones', e.target.value)}
                helperText="Cantidad de membresías que renuevan un período posterior."
                slotProps={{ htmlInput: { min: 0, step: 1 }, input: { startAdornment: <AutorenewOutlinedIcon sx={{ mr: 1, fontSize: 18, color: '#144985' }} /> } }}
              />

              <CampoSelectIcono
                icono={<FlagOutlinedIcon />}
                label="Estado"
                value={formulario.estado}
                onChange={(e) => onChange('estado', e.target.value)}
                options={[
                  {
                    value: 'ACTIVA',
                    label: 'Activa',
                    description: 'Participa en seguimiento y alertas',
                    icono: <FlagOutlinedIcon />,
                  },
                  {
                    value: 'INACTIVA',
                    label: 'Inactiva',
                    description: 'Se conserva sin seguimiento operativo',
                    icono: <FlagOutlinedIcon />,
                  },
                ]}
              />
              <TextField
                size="small"
                label="Observaciones"
                value={formulario.observaciones}
                onChange={(e) => onChange('observaciones', e.target.value)}
                sx={{ gridColumn: { xs: 'auto', md: 'span 3' } }}
                multiline
                minRows={2}
              />
            </Box>
          </Box>

          <Box sx={formStyles.seccion}>
            <Typography sx={formStyles.modalSeccionTitulo}>Metas por responsable</Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.4 }}>
              Opcional. Distribuya objetivos individuales entre responsables habilitados en la sede seleccionada.
            </Typography>

            <CampoSelectIcono
              icono={<PersonOutlineOutlinedIcon />}
              label="Responsable"
              value=""
              onChange={(e) => onAgregarResponsable(e.target.value)}
              disabled={!formulario.sede_id || responsablesDisponibles.length === 0}
              sx={{ minWidth: { xs: '100%', sm: 340 }, mb: 1.5 }}
              options={responsablesDisponibles.map((r) => ({
                value: r.id,
                label: r.nombre,
                description: r.rol,
                icono: <PersonOutlineOutlinedIcon />,
              }))}
            />

            <Stack spacing={1}>
              {(formulario.responsables || []).map((r) => {
                const usuario = (catalogos.responsables || []).find((u) => Number(u.id) === Number(r.usuario_id));
                return (
                  <Box
                    key={r.usuario_id}
                    sx={{
                      p: 1.3,
                      border: '1px solid #e2e8f0',
                      borderRadius: 1.5,
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', lg: 'minmax(180px,1.2fr) repeat(4,1fr) auto' },
                      gap: 1,
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={900}>{usuario?.nombre || 'Responsable'}</Typography>
                      <Typography variant="caption" color="text.secondary">{usuario?.rol || ''}</Typography>
                    </Box>
                    <TextField size="small" type="number" label="Ventas $" value={r.meta_ventas} onChange={(e) => onActualizarResponsable(r.usuario_id, 'meta_ventas', e.target.value)} />
                    <TextField size="small" type="number" label="Cobros $" value={r.meta_cobros} onChange={(e) => onActualizarResponsable(r.usuario_id, 'meta_cobros', e.target.value)} />
                    <TextField size="small" type="number" label="Nuevas" value={r.meta_membresias_nuevas} onChange={(e) => onActualizarResponsable(r.usuario_id, 'meta_membresias_nuevas', e.target.value)} />
                    <TextField size="small" type="number" label="Renovaciones" value={r.meta_renovaciones} onChange={(e) => onActualizarResponsable(r.usuario_id, 'meta_renovaciones', e.target.value)} />
                    <Button size="small" color="error" onClick={() => onQuitarResponsable(r.usuario_id)}>Quitar</Button>
                  </Box>
                );
              })}
              {(formulario.responsables || []).length === 0 ? (
                <Box sx={{ py: 2, textAlign: 'center', border: '1px dashed #dbe3f0', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">Sin metas individuales configuradas.</Typography>
                </Box>
              ) : null}
            </Stack>
          </Box>
        </Stack>
      </Box>

      <AccionesFormulario
        onCancelar={onCancelar}
        onGuardar={onGuardar}
        guardando={guardando}
        disabled={!formulario.sede_id}
      />
    </Paper>
  );
}
