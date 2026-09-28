import { useEffect, useMemo, useState } from 'react';
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography, IconButton, Tooltip } from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';

const DIAS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];
const inicial = { id:null, fecha_inicio:new Date().toISOString().slice(0,10), fecha_fin:'', activo:true, observaciones:'', franjas:[], recesos:[] };

const hora = (v) => String(v || '').slice(0,5);

export function HorarioEntrenadorPersonalizado({ entrenador, onVolver }) {
  const [form, setForm] = useState(inicial);
  const [catalogos, setCatalogos] = useState({ sedes:[], tipos_receso:[] });
  const [diaActivo, setDiaActivo] = useState('LUNES');
  const [cargando, setCargando] = useState(true);
  const [notificacion, setNotificacion] = useState({ mensaje:'', tipo:'info' });

  const nombre = [entrenador?.nombres, entrenador?.apellidos].filter(Boolean).join(' ') || entrenador?.name || 'Entrenador';

  const cargar = async () => {
    setCargando(true);
    try {
      const [horariosRes, catalogosRes] = await Promise.all([
        gimnasioServicio.obtenerHorariosPersonalizadosEntrenador(entrenador.id),
        gimnasioServicio.obtenerCatalogosHorarioEntrenador(),
      ]);
      setCatalogos(catalogosRes.datos || { sedes:[], tipos_receso:[] });
      const actual = (horariosRes.datos || [])[0];
      if (actual) {
        setForm({
          ...inicial,
          ...actual,
          fecha_inicio: String(actual.fecha_inicio || '').slice(0,10),
          fecha_fin: actual.fecha_fin ? String(actual.fecha_fin).slice(0,10) : '',
          franjas: (actual.franjas || []).map((x) => ({ ...x, hora_inicio:hora(x.hora_inicio), hora_fin:hora(x.hora_fin) })),
          recesos: (actual.recesos || []).map((x) => ({ ...x, hora_inicio:hora(x.hora_inicio), hora_fin:hora(x.hora_fin) })),
        });
      }
    } catch (error) {
      setNotificacion({ mensaje:error.response?.data?.mensaje || 'No se pudo cargar el horario del entrenador.', tipo:'error' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [entrenador.id]);

  const franjasDia = useMemo(() => form.franjas.map((x,index)=>({...x,index})).filter((x)=>x.dia_semana===diaActivo), [form.franjas,diaActivo]);
  const recesosDia = useMemo(() => form.recesos.map((x,index)=>({...x,index})).filter((x)=>x.dia_semana===diaActivo), [form.recesos,diaActivo]);

  const agregarFranja = () => setForm((a)=>({ ...a, franjas:[...a.franjas,{ dia_semana:diaActivo, sede_id:'', hora_inicio:'', hora_fin:'' }] }));
  const editarFranja = (index,key,value) => setForm((a)=>({ ...a, franjas:a.franjas.map((x,i)=>i===index?{...x,[key]:value}:x) }));
  const eliminarFranja = (index) => setForm((a)=>({ ...a, franjas:a.franjas.filter((_,i)=>i!==index) }));

  const agregarReceso = () => setForm((a)=>({ ...a, recesos:[...a.recesos,{ dia_semana:diaActivo, tipo:'ALMUERZO', descripcion:'', hora_inicio:'', hora_fin:'' }] }));
  const editarReceso = (index,key,value) => setForm((a)=>({ ...a, recesos:a.recesos.map((x,i)=>i===index?{...x,[key]:value}:x) }));
  const eliminarReceso = (index) => setForm((a)=>({ ...a, recesos:a.recesos.filter((_,i)=>i!==index) }));

  const guardar = async () => {
    try {
      const payload = {
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin || null,
        activo: Boolean(form.activo),
        observaciones: form.observaciones || null,
        franjas: form.franjas.map(({dia_semana,sede_id,hora_inicio,hora_fin})=>({ dia_semana, sede_id:Number(sede_id), hora_inicio, hora_fin })),
        recesos: form.recesos.map(({dia_semana,tipo,descripcion,hora_inicio,hora_fin})=>({ dia_semana,tipo,descripcion:descripcion || null,hora_inicio,hora_fin })),
      };
      if (form.id) await gimnasioServicio.actualizarHorarioPersonalizadoEntrenador(entrenador.id, form.id, payload);
      else await gimnasioServicio.crearHorarioPersonalizadoEntrenador(entrenador.id, payload);
      setNotificacion({ mensaje:'Horario del entrenador guardado correctamente.', tipo:'success' });
      await cargar();
    } catch (error) {
      const errores = error.response?.data?.errores;
      const mensaje = errores ? Object.values(errores).flat().join(' ') : (error.response?.data?.mensaje || 'No se pudo guardar el horario.');
      setNotificacion({ mensaje, tipo:'error' });
    }
  };

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo={`Horario de ${nombre}`}
        descripcion="Configura la disponibilidad semanal del entrenador por sede, con múltiples franjas por día y recesos personalizados."
        icono={<ScheduleOutlinedIcon />}
        acciones={<BotonVolver onClick={onVolver} />}
      />

      <Paper className="page-content-container" elevation={0} sx={{ mt:2 }}>
        <Box sx={formStyles.seccion}>
          <Typography sx={formStyles.modalSeccionTitulo}>Vigencia del horario</Typography>
          <Box sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'1fr 1fr 2fr' }, gap:1.5 }}>
            <TextField label="Vigente desde" type="date" size="small" value={form.fecha_inicio} onChange={(e)=>setForm((a)=>({...a,fecha_inicio:e.target.value}))} slotProps={{ inputLabel:{ shrink:true } }} />
            <TextField label="Vigente hasta" type="date" size="small" value={form.fecha_fin} onChange={(e)=>setForm((a)=>({...a,fecha_fin:e.target.value}))} slotProps={{ inputLabel:{ shrink:true } }} helperText="Vacío = sin fecha final" />
            <TextField label="Observaciones" size="small" value={form.observaciones || ''} onChange={(e)=>setForm((a)=>({...a,observaciones:e.target.value}))} />
          </Box>
        </Box>

        <Box sx={{ ...formStyles.seccion, mt:2 }}>
          <Typography sx={formStyles.modalSeccionTitulo}>Horario semanal de disponibilidad</Typography>
          <Stack direction="row" spacing={.7} flexWrap="wrap" useFlexGap sx={{ mb:2 }}>
            {DIAS.map((dia) => {
              const cantidad = form.franjas.filter((x)=>x.dia_semana===dia).length;
              return <Button key={dia} size="small" variant={diaActivo===dia?'contained':'outlined'} onClick={()=>setDiaActivo(dia)} sx={diaActivo===dia?dbanuStyles.addButtonRevive:{ minWidth:76 }}>{dia.slice(0,3)}{cantidad ? ` · ${cantidad}` : ''}</Button>;
            })}
          </Stack>

          <Typography variant="subtitle2" fontWeight={900} sx={{ mb:1 }}>{diaActivo}</Typography>
          <Stack spacing={1}>
            {franjasDia.map((franja) => (
              <Box key={franja.index} sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'1.3fr 1fr 1fr auto' }, gap:1, alignItems:'start' }}>
                <TextField select size="small" label="Sede" value={franja.sede_id || ''} onChange={(e)=>editarFranja(franja.index,'sede_id',e.target.value)}>
                  {(catalogos.sedes || []).map((s)=><MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>)}
                </TextField>
                <TextField size="small" type="time" label="Desde" value={hora(franja.hora_inicio)} onChange={(e)=>editarFranja(franja.index,'hora_inicio',e.target.value)} slotProps={{ inputLabel:{ shrink:true } }} />
                <TextField size="small" type="time" label="Hasta" value={hora(franja.hora_fin)} onChange={(e)=>editarFranja(franja.index,'hora_fin',e.target.value)} slotProps={{ inputLabel:{ shrink:true } }} />
                <Tooltip title="Eliminar horario"><IconButton sx={dbanuStyles.actionDelete} onClick={()=>eliminarFranja(franja.index)}><DeleteOutlineOutlinedIcon /></IconButton></Tooltip>
              </Box>
            ))}
            <Box><Button startIcon={<AddOutlinedIcon />} onClick={agregarFranja} sx={dbanuStyles.addButtonRevive}>Horario</Button></Box>
          </Stack>
        </Box>

        <Box sx={{ ...formStyles.seccion, mt:2 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb:1 }}>
            <CoffeeOutlinedIcon fontSize="small" />
            <Typography sx={formStyles.modalSeccionTitulo}>Recesos / Lunch</Typography>
          </Stack>
          <Stack spacing={1}>
            {recesosDia.map((receso) => (
              <Box key={receso.index} sx={{ display:'grid', gridTemplateColumns:{ xs:'1fr', md:'1fr 1.2fr 1fr 1fr auto' }, gap:1, alignItems:'start' }}>
                <TextField select size="small" label="Tipo" value={receso.tipo || 'PAUSA'} onChange={(e)=>editarReceso(receso.index,'tipo',e.target.value)}>
                  {(catalogos.tipos_receso || ['ALMUERZO','PAUSA','OTRO']).map((t)=><MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField size="small" label="Descripción" value={receso.descripcion || ''} onChange={(e)=>editarReceso(receso.index,'descripcion',e.target.value)} />
                <TextField size="small" type="time" label="Desde" value={hora(receso.hora_inicio)} onChange={(e)=>editarReceso(receso.index,'hora_inicio',e.target.value)} slotProps={{ inputLabel:{ shrink:true } }} />
                <TextField size="small" type="time" label="Hasta" value={hora(receso.hora_fin)} onChange={(e)=>editarReceso(receso.index,'hora_fin',e.target.value)} slotProps={{ inputLabel:{ shrink:true } }} />
                <Tooltip title="Eliminar receso"><IconButton sx={dbanuStyles.actionDelete} onClick={()=>eliminarReceso(receso.index)}><DeleteOutlineOutlinedIcon /></IconButton></Tooltip>
              </Box>
            ))}
            <Box><Button startIcon={<AddOutlinedIcon />} onClick={agregarReceso} variant="outlined">Receso</Button></Box>
          </Stack>
        </Box>

        <AccionesFormulario onGuardar={guardar} onCancelar={onVolver} guardarDisabled={cargando} />
      </Paper>

      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={()=>setNotificacion((a)=>({...a,mensaje:''}))} />
    </Box>
  );
}
