import { useEffect, useState } from 'react';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { Autocomplete, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const hoy = new Date().toISOString().slice(0,10);

export function DisponibilidadAgendaPage() {
  const [catalogos,setCatalogos]=useState({sedes:[]});
  const [serviciosDisponibles,setServiciosDisponibles]=useState([]);
  const [cargandoServicios,setCargandoServicios]=useState(false);
  const [form,setForm]=useState({sede_id:'',entrenador_id:'',servicio_id:'',fecha:hoy});
  const [slots,setSlots]=useState([]);
  const [resumen,setResumen]=useState(null);
  const [opcionesEntrenador,setOpcionesEntrenador]=useState([]);
  const [busquedaEntrenador,setBusquedaEntrenador]=useState('');
  const [buscando,setBuscando]=useState(false);
  const [cargando,setCargando]=useState(false);
  const [notificacion,setNotificacion]=useState({mensaje:'',tipo:'info'});

  useEffect(()=>{ gimnasioServicio.obtenerCatalogosAgenda().then(r=>setCatalogos(r.datos||{})).catch(()=>{}); },[]);

  useEffect(()=>{
    const q=busquedaEntrenador.trim();
    if(q.length<2) return undefined;
    const t=window.setTimeout(async()=>{
      setBuscando(true);
      try{
        const r=await gimnasioServicio.buscarEntrenadoresAgenda({q});
        setOpcionesEntrenador(r.datos||[]);
      }finally{setBuscando(false);}
    },300);
    return ()=>window.clearTimeout(t);
  },[busquedaEntrenador]);

  useEffect(()=>{
    setForm((a)=>({...a,servicio_id:''}));
    setServiciosDisponibles([]);

    if(!form.sede_id || !form.entrenador_id) return undefined;

    let activo=true;
    setCargandoServicios(true);
    gimnasioServicio.obtenerServiciosDisponiblesAgenda({
      sede_id: form.sede_id,
      entrenador_id: form.entrenador_id,
    }).then((r)=>{
      if(activo) setServiciosDisponibles(r.datos||[]);
    }).catch(()=>{
      if(activo) setServiciosDisponibles([]);
    }).finally(()=>{
      if(activo) setCargandoServicios(false);
    });

    return ()=>{activo=false;};
  },[form.sede_id,form.entrenador_id]);

  const consultar=async()=>{
    if(!form.sede_id||!form.entrenador_id||!form.servicio_id||!form.fecha){
      setNotificacion({mensaje:'Selecciona sede, entrenador, servicio y fecha.',tipo:'warning'}); return;
    }
    setCargando(true);
    try{
      const r=await gimnasioServicio.obtenerDisponibilidadAgenda(form);
      setResumen(r.datos||null);
      setSlots(r.datos?.slots||[]);
    }catch(e){
      setSlots([]); setResumen(null);
      setNotificacion({mensaje:e.response?.data?.mensaje||'No se pudo calcular la disponibilidad.',tipo:'error'});
    }finally{setCargando(false);}
  };

  const estadoSx=(estado)=>({
    DISPONIBLE:{bg:'#ecfdf3',fg:'#067647',bd:'#abefc6'},
    RESERVADO:{bg:'#fef3f2',fg:'#b42318',bd:'#fecdca'},
    RECESO:{bg:'#fff7e8',fg:'#9a6700',bd:'#fedf89'},
    EXCEPCION:{bg:'#f2f4f7',fg:'#344054',bd:'#d0d5dd'},
  }[estado]||{bg:'#f8fafc',fg:'#475467',bd:'#e4e7ec'});

  return <Box className="page-wrapper">
    <PageHeader titulo="Disponibilidad de Agenda" descripcion="Simula los horarios disponibles sin generar turnos previamente." icono={<EventAvailableOutlinedIcon/>}/>
    <Paper className="page-content-container" elevation={0}>
      <Box sx={{p:2,display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(5,1fr)'},gap:1.2}}>
        <TextField select size="small" label="Sede" value={form.sede_id} onChange={e=>setForm(a=>({...a,sede_id:e.target.value,servicio_id:''}))}>
          {(catalogos.sedes||[]).map(x=><MenuItem key={x.id} value={x.id}>{x.nombre}</MenuItem>)}
        </TextField>
        <Autocomplete
          options={opcionesEntrenador}
          loading={buscando}
          value={opcionesEntrenador.find(x=>String(x.id)===String(form.entrenador_id))||null}
          onInputChange={(_,v)=>setBusquedaEntrenador(v)}
          onChange={(_,v)=>setForm(a=>({...a,entrenador_id:v?.id||'',servicio_id:''}))}
          getOptionLabel={x=>[x.nombres,x.apellidos].filter(Boolean).join(' ')||x.name||''}
          isOptionEqualToValue={(a,b)=>String(a.id)===String(b.id)}
          noOptionsText={busquedaEntrenador.trim().length<2?'Escribe al menos 2 caracteres':'Sin resultados'}
          renderInput={params=><TextField {...params} size="small" label="Entrenador"/>}
        />
        <TextField
          select
          size="small"
          label="Servicio"
          value={form.servicio_id}
          onChange={e=>setForm(a=>({...a,servicio_id:e.target.value}))}
          disabled={!form.sede_id || !form.entrenador_id || cargandoServicios}
          helperText={
            !form.sede_id || !form.entrenador_id
              ? 'Selecciona sede y entrenador'
              : serviciosDisponibles.length === 0 && !cargandoServicios
                ? 'El entrenador no tiene servicios habilitados'
                : ''
          }
        >
          {serviciosDisponibles.map(x=><MenuItem key={x.id} value={x.id}>{x.nombre} · {x.duracion_minutos} min</MenuItem>)}
        </TextField>
        <TextField size="small" type="date" label="Fecha" value={form.fecha} onChange={e=>setForm(a=>({...a,fecha:e.target.value}))} slotProps={{inputLabel:{shrink:true}}}/>
        <Button startIcon={<SearchOutlinedIcon/>} onClick={consultar} disabled={cargando} sx={dbanuStyles.addButtonRevive}>Consultar</Button>
      </Box>

      <Box sx={{px:2,pb:2}}>
        {resumen ? <Typography variant="body2" color="text.secondary" sx={{mb:1.2}}>
          {resumen.dia} · {resumen.servicio?.nombre} · {resumen.servicio?.duracion_minutos} min
        </Typography>:null}

        <Box sx={{display:'grid',gridTemplateColumns:{xs:'repeat(2,1fr)',sm:'repeat(3,1fr)',md:'repeat(5,1fr)',lg:'repeat(6,1fr)'},gap:1}}>
          {slots.map((slot,i)=>{
            const c=estadoSx(slot.estado);
            return <Box key={i} sx={{border:'1px solid',borderColor:c.bd,bgcolor:c.bg,borderRadius:1.5,p:1.2}}>
              <Typography variant="subtitle2" fontWeight={900}>{slot.hora_inicio} - {slot.hora_fin}</Typography>
              <Chip size="small" label={slot.estado} sx={{mt:.7,height:24,fontWeight:800,bgcolor:'#fff',color:c.fg,border:'1px solid',borderColor:c.bd}}/>
              <Typography variant="caption" color="text.secondary" display="block" sx={{mt:.65}}>
                {slot.estado==='DISPONIBLE' ? `${slot.cupos_disponibles} cupo(s) disponible(s)` : (slot.motivo||'')}
              </Typography>
            </Box>;
          })}
        </Box>

        {!cargando && resumen && slots.length===0 ? <Typography variant="body2" color="text.secondary" sx={{py:4,textAlign:'center'}}>No existe jornada activa para los filtros seleccionados.</Typography>:null}
      </Box>
    </Paper>
    <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={()=>setNotificacion(a=>({...a,mensaje:''}))}/>
  </Box>;
}
