import { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined';
import { BotonCancelar } from '../../../components/common/BotonCancelar.jsx';
import { BotonGuardar } from '../../../components/common/BotonGuardar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { esPaseDiario } from './estadoMembresia.js';

const mensajeError = (e) => {
  const errores = e?.response?.data?.errors;
  return (errores ? Object.values(errores).flat()[0] : null) || e?.response?.data?.mensaje || 'No se pudo guardar.';
};

/** Sedes donde la membresía se vende y se usa. Cada cambio queda en el historial con su motivo. */
export function SedesMembresia({ membresia, sedes = [], onActualizado }) {
  const [actuales, setActuales] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [principal, setPrincipal] = useState(null);
  const [motivoTexto, setMotivo] = useState('');
  const [motivoAuto, setMotivoAuto] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const esPase = esPaseDiario(membresia);

  const cargar = async () => {
    setCargando(true);
    try {
      const respuesta = await gimnasioServicio.obtenerMembresia(membresia.id);
      const datos = respuesta?.datos || respuesta || {};
      const ids = (datos.sedes_habilitadas || []).map((s) => Number(s.sede_id ?? s));
      setActuales(ids);
      setSeleccion(ids);
      setPrincipal(Number(datos.sede_id || membresia.sede_id));
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [membresia?.id]);

  const cambiado = [...seleccion].sort().join(',') !== [...actuales].sort().join(',');
  const alternar = (id) => {
    setExito('');
    setSeleccion((actual) => (actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]));
  };

  // Motivo sugerido con las sedes que se agregan o quitan; el usuario puede editarlo.
  const nombreSedeId = (id) => sedes.find((s) => Number(s.id) === Number(id))?.nombre || `sede ${id}`;
  const agregadas = seleccion.filter((id) => !actuales.includes(id)).map(nombreSedeId);
  const quitadas = actuales.filter((id) => !seleccion.includes(id)).map(nombreSedeId);
  const motivoSugerido = `Actualización de sedes de la membresía ${membresia?.codigo || ''}:${agregadas.length ? ` se habilita ${agregadas.join(', ')}.` : ''}${quitadas.length ? ` se quita ${quitadas.join(', ')}.` : ''}${!agregadas.length && !quitadas.length ? ' sin cambios.' : ''} Quedan: ${seleccion.map(nombreSedeId).join(', ') || 'ninguna'}.`;
  const motivo = motivoAuto ? motivoSugerido : motivoTexto;

  const guardar = async () => {
    if (!seleccion.length) { setError('Habilita al menos una sede.'); return; }
    setGuardando(true); setError('');
    try {
      await gimnasioServicio.actualizarSedesMembresia(membresia.id, { sedes_habilitadas: seleccion, motivo: motivo.trim() });
      setExito('Sedes actualizadas. El cambio quedó en el historial.');
      setMotivo(''); setMotivoAuto(true);
      await cargar();
      await onActualizado?.();
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <CircularProgress size={23} />;

  return <Stack spacing={2}>
    <Typography variant="body2" color="text.secondary">
      {esPase
        ? 'El pase se vende en las sedes marcadas, con la tarifa de cada sede, y da acceso en la sede donde se vendió ese día.'
        : 'La membresía da acceso en las sedes marcadas. La sede principal no se puede quitar.'}
    </Typography>
    {error && <Alert severity="error">{error}</Alert>}
    {exito && <Alert severity="success">{exito}</Alert>}
    <Stack direction="row" spacing={1.2} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {sedes.map((sede) => {
        const id = Number(sede.id_sede);
        const marcada = seleccion.includes(id);
        return <Button key={id} type="button" aria-pressed={marcada} onClick={() => alternar(id)}
          startIcon={marcada ? <CheckRoundedIcon sx={{ fontSize: 19 }} /> : <LocationCityOutlinedIcon sx={{ fontSize: 19 }} />}
          sx={{
            textTransform: 'none', fontSize: 13, fontWeight: 800, minHeight: 42, minWidth: 145, px: 2, borderRadius: 1.7,
            border: '1px solid', borderColor: marcada ? uiTokens.colores.acentoOscuro : 'divider',
            bgcolor: marcada ? uiTokens.colores.acento : 'background.paper',
            color: marcada ? uiTokens.colores.textoFuerte : 'text.secondary',
            '&:hover': { bgcolor: marcada ? uiTokens.colores.acentoOscuro : uiTokens.colores.acentoSuave },
          }}>
          <Box sx={{ textAlign: 'left' }}>
            {sede.nombre}
            {id === principal && actuales.includes(id) && <Typography component="span" sx={{ display: 'block', fontSize: 10.5, fontWeight: 600 }}>
              {esPase ? 'Sede de la última venta' : 'Sede principal'}
            </Typography>}
          </Box>
        </Button>;
      })}
    </Stack>
    {cambiado && <>
      <TextField multiline minRows={2} size="small" fullWidth required label="Motivo" value={motivo}
        helperText="Escribe al menos 8 caracteres." onChange={(e) => { setMotivo(e.target.value); setMotivoAuto(false); }} />
      <Box sx={{ ...dbanuStyles.formActions, px: 0, pb: 0 }}>
        <BotonCancelar disabled={guardando} onClick={() => { setSeleccion(actuales); setMotivo(''); setError(''); }} />
        <BotonGuardar texto="Guardar sedes" guardando={guardando} disabled={motivo.trim().length < 8} onClick={guardar} />
      </Box>
    </>}
  </Stack>;
}
