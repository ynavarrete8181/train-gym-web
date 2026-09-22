import { useEffect, useMemo, useState } from 'react';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { Autocomplete, Box, Button, Chip, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const hoy = new Date().toISOString().slice(0,10);

const agruparBloqueos = (slots = []) => {
  const resultado = [];

  for (const slot of slots) {
    const anterior = resultado[resultado.length - 1];
    const esBloqueo = ['RECESO', 'EXCEPCION'].includes(slot.estado);
    const puedeAgrupar = esBloqueo
      && anterior
      && anterior.estado === slot.estado
      && anterior.motivo === slot.motivo
      && anterior.hora_fin === slot.hora_inicio;

    if (puedeAgrupar) {
      anterior.hora_fin = slot.hora_fin;
      continue;
    }

    resultado.push({ ...slot });
  }

  return resultado;
};

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

  const slotsVisuales = useMemo(() => agruparBloqueos(slots), [slots]);

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
      <Box
        sx={{
          p: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(5,1fr)' },
          gap: 1.2,
          alignItems: 'start',
        }}
      >
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
        <Button
          startIcon={<SearchOutlinedIcon />}
          onClick={consultar}
          disabled={cargando}
          sx={{
            ...dbanuStyles.addButtonRevive,
            height: 40,
            alignSelf: 'start',
          }}
        >
          Consultar
        </Button>
      </Box>

      <Box sx={{px:2,pb:2}}>
        {resumen ? <Typography variant="body2" color="text.secondary" sx={{mb:1.2}}>
          {resumen.dia} · {resumen.servicio?.nombre} · {resumen.servicio?.duracion_minutos} min
        </Typography>:null}

        {slotsVisuales.length > 0 ? (
          <Box
            sx={{
              border: '1px solid #e2e8f0',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: '#fff',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                px: 1.6,
                py: 1.05,
                borderBottom: '1px solid #e2e8f0',
                bgcolor: '#f8fafc',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={900}>
                  Jornada del día
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Los bloques se muestran según la duración real del servicio y de cada pausa.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.2} sx={{ display: { xs: 'none', md: 'flex' } }}>
                <Leyenda color="#16a34a" texto="Disponible" />
                <Leyenda color="#d97706" texto="Receso" />
                <Leyenda color="#dc2626" texto="Reservado" />
                <Leyenda color="#64748b" texto="Excepción" />
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: .75,
                p: 1.25,
                overflowX: 'auto',
                alignItems: 'stretch',
                '&::-webkit-scrollbar': { height: 7 },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 10 },
              }}
            >
              {slotsVisuales.map((slot, i) => {
                const estilo = estadoSx(slot.estado);
                const [hi, mi] = String(slot.hora_inicio).split(':').map(Number);
                const [hf, mf] = String(slot.hora_fin).split(':').map(Number);
                const minutos = Math.max(15, ((hf * 60 + mf) - (hi * 60 + mi)));
                const base = Math.max(30, Number(resumen?.servicio?.duracion_minutos || 30));
                const ancho = Math.max(118, Math.round((minutos / base) * 138));

                const etiqueta = slot.estado === 'DISPONIBLE'
                  ? 'Disponible'
                  : slot.estado === 'RECESO'
                    ? 'Receso'
                    : slot.estado === 'RESERVADO'
                      ? 'Reservado'
                      : 'Excepción';

                return (
                  <Box
                    key={`${slot.hora_inicio}-${slot.hora_fin}-${i}`}
                    sx={{
                      flex: `0 0 ${ancho}px`,
                      minHeight: 92,
                      border: '1px solid',
                      borderColor: estilo.bd,
                      bgcolor: estilo.bg,
                      borderRadius: 1.5,
                      px: 1.15,
                      py: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 950, color: '#0f172a', lineHeight: 1.15 }}>
                        {slot.hora_inicio} - {slot.hora_fin}
                      </Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 850, color: estilo.fg, mt: .55 }}>
                        {etiqueta}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: .8 }}>
                      {slot.estado === 'DISPONIBLE' ? (
                        <Typography variant="caption" color="text.secondary">
                          {slot.cupos_disponibles} {Number(slot.cupos_disponibles) === 1 ? 'cupo' : 'cupos'}
                        </Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', lineHeight: 1.2 }}
                        >
                          {slot.motivo || 'Bloque no disponible'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ) : null}

        {!cargando && resumen && slots.length===0 ? <Typography variant="body2" color="text.secondary" sx={{py:4,textAlign:'center'}}>No existe jornada activa para los filtros seleccionados.</Typography>:null}
      </Box>
    </Paper>
    <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={()=>setNotificacion(a=>({...a,mensaje:''}))}/>
  </Box>;
}

function Leyenda({ color, texto }) {
  return (
    <Stack direction="row" spacing={.55} alignItems="center">
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {texto}
      </Typography>
    </Stack>
  );
}
