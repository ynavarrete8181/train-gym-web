import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import { ModalConfirmacion } from '../../../components/common/ModalConfirmacion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { uiTokens } from '../../../styles/uiTokens.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const nuevoTutorInicial = {
  tipo_identificacion: 'CEDULA', identificacion: '', nombres: '', apellidos: '', telefono: '', email: '', direccion: '',
};

const nombreTutor = (tutor) => tutor?.nombre_completo
  || `${tutor?.nombres || ''} ${tutor?.apellidos || ''}`.trim();

const errorServidor = (error, porDefecto) => {
  const errores = error.response?.data?.errors || error.response?.data?.errores;
  return (errores ? Object.values(errores).flat().join(' ') : '') || error.response?.data?.mensaje || porDefecto;
};

export function SelectorTutor({ tutor, excluirPersonaId, onSeleccionar, onCambiarVinculo, onQuitar }) {
  const [texto, setTexto] = useState('');
  const [opciones, setOpciones] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [dialogo, setDialogo] = useState(false);
  const [nuevo, setNuevo] = useState(nuevoTutorInicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const consulta = texto.trim();
    if (consulta.length < 2) { setOpciones([]); return undefined; }
    let activo = true;
    setBuscando(true);
    const temporizador = setTimeout(() => {
      gimnasioServicio.buscarTutores(consulta, excluirPersonaId)
        .then((respuesta) => { if (activo) setOpciones(respuesta.datos || []); })
        .catch(() => { if (activo) setOpciones([]); })
        .finally(() => { if (activo) setBuscando(false); });
    }, 300);
    return () => { activo = false; clearTimeout(temporizador); };
  }, [texto, excluirPersonaId]);

  const cambiarNuevo = (e) => setNuevo((actual) => ({ ...actual, [e.target.name]: e.target.value }));

  const registrar = async () => {
    if (!nuevo.identificacion.trim() || !nuevo.nombres.trim()) {
      setError('La identificación y los nombres son obligatorios.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const respuesta = await gimnasioServicio.crearTutor({ persona: nuevo, estado: 'ACTIVO' });
      onSeleccionar(respuesta.datos);
      setNuevo(nuevoTutorInicial);
      setDialogo(false);
    } catch (e) {
      setError(errorServidor(e, 'No se pudo registrar el tutor.'));
    } finally {
      setGuardando(false);
    }
  };

  const seleccionado = Boolean(tutor?.persona_id);

  return (
    <Stack spacing={1.5}>
      {seleccionado ? (
        <Box sx={{ p: 1.5, border: `1px solid ${uiTokens.colores.borde}`, borderRadius: 1.5, bgcolor: uiTokens.colores.acentoSuave }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={800}>{nombreTutor(tutor)}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {[tutor.identificacion || 'Sin identificación', tutor.telefono, tutor.email].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, flexShrink: 0 }}>
              <Button size="small" onClick={() => onSeleccionar(null)} sx={{ textTransform: 'none' }}>
                Cambiar tutor
              </Button>
              {onQuitar ? (
                <Button size="small" color="error" onClick={onQuitar} sx={{ textTransform: 'none' }}>
                  Quitar tutor
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'flex-start' } }}>
          <Autocomplete
            sx={{ flex: 1 }}
            options={opciones}
            loading={buscando}
            filterOptions={(items) => items}
            getOptionLabel={(item) => nombreTutor(item)}
            isOptionEqualToValue={(a, b) => a.persona_id === b.persona_id}
            onInputChange={(_e, valor, motivo) => { if (motivo === 'input') setTexto(valor); }}
            onChange={(_e, valor) => { if (valor) { onSeleccionar(valor); setTexto(''); } }}
            noOptionsText={texto.trim().length < 2 ? 'Escribe la cédula o el nombre' : 'No se encontró ningún tutor'}
            loadingText="Buscando..."
            renderOption={(props, item) => (
              <Box component="li" {...props} key={item.persona_id} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ minWidth: 150, flex: 1 }}>
                  <Typography variant="body2" fontWeight={700}>{nombreTutor(item)}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.identificacion || 'Sin identificación'}</Typography>
                </Box>
                {item.es_deportista ? <Chip size="small" variant="outlined" label="También es deportista" /> : null}
              </Box>
            )}
            renderInput={(params) => {
              // MUI 9 entrega los adornos en slotProps.input.
              const inputOriginal = params.slotProps?.input ?? params.InputProps ?? {};
              return (
                <TextField
                  {...params}
                  size="small"
                  required
                  label="Buscar tutor"
                  placeholder="Cédula o nombre"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...inputOriginal,
                      endAdornment: <>{buscando ? <CircularProgress size={16} /> : null}{inputOriginal.endAdornment}</>,
                    },
                  }}
                />
              );
            }}
          />
          <Button
            startIcon={<AddOutlinedIcon />}
            onClick={() => { setError(''); setDialogo(true); }}
            sx={{ ...dbanuStyles.addButtonRevive, whiteSpace: 'nowrap' }}
          >
            Agregar
          </Button>
          {onQuitar ? (
            <Button color="error" onClick={onQuitar} sx={{ textTransform: 'none', whiteSpace: 'nowrap', minHeight: 38 }}>
              Quitar tutor
            </Button>
          ) : null}
        </Stack>
      )}

      {seleccionado ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1.5, alignItems: 'center' }}>
          <TextField select label="Relación" name="tipo_relacion" size="small"
            value={tutor.tipo_relacion || 'TUTOR'} onChange={onCambiarVinculo}>
            <MenuItem value="PADRE">Padre</MenuItem>
            <MenuItem value="MADRE">Madre</MenuItem>
            <MenuItem value="TUTOR">Tutor</MenuItem>
            {tutor.tipo_relacion === 'REPRESENTANTE_LEGAL' ? <MenuItem value="REPRESENTANTE_LEGAL">Representante legal</MenuItem> : null}
            <MenuItem value="OTRO">Otro</MenuItem>
          </TextField>
          <FormControlLabel
            control={<Switch name="responsable_pago" checked={Boolean(tutor.responsable_pago)} onChange={onCambiarVinculo} />}
            label="Responsable de pago"
          />
        </Box>
      ) : null}

      <ModalConfirmacion
        open={dialogo}
        titulo="Registrar nuevo tutor"
        descripcion="Queda registrado una sola vez y se puede seleccionar en cada deportista a su cargo."
        icono={<PersonAddAltOutlinedIcon />}
        textoConfirmar="Registrar y seleccionar"
        cargando={guardando}
        onClose={() => setDialogo(false)}
        onConfirmar={registrar}
      >
        <TextField select label="Tipo de identificación" name="tipo_identificacion" size="small"
          value={nuevo.tipo_identificacion} onChange={cambiarNuevo}>
          <MenuItem value="CEDULA">Cédula</MenuItem>
          <MenuItem value="PASAPORTE">Pasaporte</MenuItem>
          <MenuItem value="RUC">RUC</MenuItem>
          <MenuItem value="OTRO">Otro</MenuItem>
        </TextField>
        <TextField label="Identificación" name="identificacion" required size="small" value={nuevo.identificacion} onChange={cambiarNuevo} />
        <TextField label="Nombres" name="nombres" required size="small" value={nuevo.nombres} onChange={cambiarNuevo} />
        <TextField label="Apellidos" name="apellidos" size="small" value={nuevo.apellidos} onChange={cambiarNuevo} />
        <TextField label="Teléfono" name="telefono" size="small" value={nuevo.telefono} onChange={cambiarNuevo} />
        <TextField label="Correo" name="email" type="email" size="small" value={nuevo.email} onChange={cambiarNuevo} />
        <TextField label="Dirección" name="direccion" size="small" value={nuevo.direccion} onChange={cambiarNuevo} />
        {error ? <Alert severity="error">{error}</Alert> : null}
      </ModalConfirmacion>
    </Stack>
  );
}
