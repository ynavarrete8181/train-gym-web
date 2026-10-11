import { useEffect, useMemo, useState } from 'react';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { Box, Button, FormControlLabel, IconButton, MenuItem, Paper, Stack, Switch, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { formStyles } from '../../../styles/formStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const DIAS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];
const hora = (v) => String(v || '').slice(0,5);

const config = {
  jornadas: {
    titulo: 'Jornadas',
    descripcion: 'Administra plantillas reutilizables de días y horarios para los entrenadores.',
    icono: <ScheduleOutlinedIcon />,
    obtener: 'obtenerJornadas',
    crear: 'crearJornada',
    actualizar: 'actualizarJornada',
    inicial: { id:null, nombre:'', descripcion:'', dias_semana:['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES'], hora_inicio:'08:00', hora_fin:'13:00', activo:true },
  },
  recesos: {
    titulo: 'Recesos',
    descripcion: 'Configura pausas recurrentes como desayuno, almuerzo o merienda.',
    icono: <CoffeeOutlinedIcon />,
    obtener: 'obtenerRecesos',
    crear: 'crearReceso',
    actualizar: 'actualizarReceso',
    inicial: { id:null, nombre:'', tipo:'ALMUERZO', hora_inicio:'13:00', hora_fin:'14:00', descripcion:'', activo:true },
  },
};

export function AgendaConfiguracionCatalogo({ tipo }) {
  const cfg = config[tipo];
  const [vista,setVista]=useState('lista');
  const [items,setItems]=useState([]);
  const [meta,setMeta]=useState({});
  const [filtros,setFiltros]=useState({busqueda:'',page:1,per_page:5});
  const [form,setForm]=useState(cfg.inicial);
  const [cargando,setCargando]=useState(true);
  const [notificacion,setNotificacion]=useState({mensaje:'',tipo:'info'});

  const cargar=async(params=filtros)=>{
    setCargando(true);
    try{
      const r=await gimnasioServicio[cfg.obtener](params);
      setItems(r.datos||[]);
      setMeta(r.meta||{});
    }catch(e){
      setNotificacion({mensaje:`No se pudieron cargar ${cfg.titulo.toLowerCase()}.`,tipo:'error'});
    }finally{setCargando(false);}
  };

  useEffect(()=>{ setVista('lista'); setForm(cfg.inicial); cargar({busqueda:'',page:1,per_page:5}); },[tipo]);

  const guardar=async()=>{
    try{
      if(tipo==='jornadas'){
        if(!form.nombre || !form.dias_semana?.length || !form.hora_inicio || !form.hora_fin) return setNotificacion({mensaje:'Completa nombre, días y horario.',tipo:'warning'});
      }else if(!form.nombre || !form.hora_inicio || !form.hora_fin){
        return setNotificacion({mensaje:'Completa nombre y horario del receso.',tipo:'warning'});
      }
      const payload=tipo==='jornadas'
        ? {nombre:form.nombre,descripcion:form.descripcion||null,dias_semana:form.dias_semana,hora_inicio:form.hora_inicio,hora_fin:form.hora_fin,activo:Boolean(form.activo)}
        : {nombre:form.nombre,tipo:form.tipo,hora_inicio:form.hora_inicio,hora_fin:form.hora_fin,descripcion:form.descripcion||null,activo:Boolean(form.activo)};
      if(form.id) await gimnasioServicio[cfg.actualizar](form.id,payload); else await gimnasioServicio[cfg.crear](payload);
      setNotificacion({mensaje:`${tipo==='jornadas'?'Jornada':'Receso'} guardado correctamente.`,tipo:'success'});
      setVista('lista'); setForm(cfg.inicial); cargar({...filtros,page:1});
    }catch(e){
      const mensaje=e.response?.data?.errores ? Object.values(e.response.data.errores).flat().join(' ') : (e.response?.data?.mensaje||'No se pudo guardar.');
      setNotificacion({mensaje,tipo:'error'});
    }
  };

  const editar=(item)=>{
    setForm(tipo==='jornadas'
      ? {...cfg.inicial,...item,dias_semana:item.dias_semana||[],hora_inicio:hora(item.hora_inicio),hora_fin:hora(item.hora_fin)}
      : {...cfg.inicial,...item,hora_inicio:hora(item.hora_inicio),hora_fin:hora(item.hora_fin)}
    );
    setVista('formulario');
  };

  if(vista==='formulario'){
    return <Box className="page-wrapper">
      <PageHeader titulo={`${form.id?'Editar':'Nueva'} ${tipo==='jornadas'?'Jornada':'Receso'}`} descripcion={cfg.descripcion} icono={cfg.icono} acciones={<BotonVolver onClick={()=>setVista('lista')}/>}/>
      <Paper className="page-content-container" elevation={0} sx={{mt:2}}>
        <Box sx={formStyles.seccion}>
          <Typography sx={formStyles.modalSeccionTitulo}>Configuración</Typography>
          {tipo==='jornadas' ? <FormularioJornada form={form} setForm={setForm}/> : <FormularioReceso form={form} setForm={setForm}/>}
        </Box>
        <AccionesFormulario onGuardar={guardar} onCancelar={()=>setVista('lista')}/>
      </Paper>
      <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={()=>setNotificacion(a=>({...a,mensaje:''}))}/>
    </Box>;
  }

  return <Box className="page-wrapper">
    <PageHeader titulo={cfg.titulo} descripcion={cfg.descripcion} icono={cfg.icono}/>
    <Paper className="page-content-container" elevation={0}>
      <GestionToolbar total={meta.total||items.length} busqueda={filtros.busqueda} onBusqueda={(busqueda)=>{const n={...filtros,busqueda,page:1};setFiltros(n);cargar(n);}} acciones={<Button startIcon={<AddOutlinedIcon/>} onClick={()=>{setForm({...cfg.inicial});setVista('formulario');}} sx={dbanuStyles.addButtonRevive}>Añadir</Button>}/>
      <TablaGestion total={meta.total||0} filtrados={meta.total||0} page={meta.pagina_actual||1} rowsPerPage={meta.por_pagina||5} cargando={cargando}
        onPageChange={(page)=>{const n={...filtros,page};setFiltros(n);cargar(n);}}
        onRowsPerPageChange={(per_page)=>{const n={...filtros,page:1,per_page};setFiltros(n);cargar(n);}}>
        <TableHead><TableRow>
          <TableCell>{tipo==='jornadas'?'Jornada':'Receso'}</TableCell>
          {tipo==='jornadas'?<><TableCell>Días</TableCell><TableCell>Horario</TableCell></>:<><TableCell>Tipo</TableCell><TableCell>Horario</TableCell></>}
          <TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {items.map(item=><TableRow key={item.id} hover>
            <TableCell><Typography variant="body2" fontWeight={700}>{item.nombre}</Typography><Typography variant="caption" color="text.secondary">{item.descripcion||'Sin descripción'}</Typography></TableCell>
            {tipo==='jornadas'?<><TableCell>{(item.dias_semana||[]).map(d=>d.slice(0,3)).join(' · ')}</TableCell><TableCell>{hora(item.hora_inicio)} - {hora(item.hora_fin)}</TableCell></>:<><TableCell>{item.tipo}</TableCell><TableCell>{hora(item.hora_inicio)} - {hora(item.hora_fin)}</TableCell></>}
            <TableCell><StatusChip estado={item.activo?'activo':'inactivo'}/></TableCell>
            <TableCell align="right"><Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={()=>editar(item)}><EditOutlinedIcon sx={{fontSize:17}}/></IconButton></Tooltip></TableCell>
          </TableRow>)}
          {!items.length?<TablaEstadoFila colSpan={5} cargando={cargando} texto={`No existen ${cfg.titulo.toLowerCase()} configurados.`}/>:null}
        </TableBody>
      </TablaGestion>
    </Paper>
    <NotificacionSnackbar mensaje={notificacion.mensaje} tipo={notificacion.tipo} onClose={()=>setNotificacion(a=>({...a,mensaje:''}))}/>
  </Box>;
}

function FormularioJornada({form,setForm}){
  const toggleDia=(dia)=>setForm(a=>({...a,dias_semana:a.dias_semana.includes(dia)?a.dias_semana.filter(x=>x!==dia):[...a.dias_semana,dia]}));
  return <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(3,1fr)'},gap:1.5}}>
    <TextField label="Nombre" size="small" value={form.nombre} onChange={e=>setForm(a=>({...a,nombre:e.target.value}))} required/>
    <TextField label="Hora inicio" type="time" size="small" value={form.hora_inicio} onChange={e=>setForm(a=>({...a,hora_inicio:e.target.value}))} slotProps={{inputLabel:{shrink:true}}}/>
    <TextField label="Hora fin" type="time" size="small" value={form.hora_fin} onChange={e=>setForm(a=>({...a,hora_fin:e.target.value}))} slotProps={{inputLabel:{shrink:true}}}/>
    <Box sx={{gridColumn:{xs:'auto',md:'span 3'}}}>
      <Typography sx={{fontSize:11,fontWeight:800,color:'#64748b',mb:.7}}>Días de la jornada</Typography>
      <Stack direction="row" spacing={.7} flexWrap="wrap" useFlexGap>
        {DIAS.map(d=><Button key={d} variant={form.dias_semana.includes(d)?'contained':'outlined'} onClick={()=>toggleDia(d)} sx={{minWidth:48,height:32,textTransform:'none',fontWeight:850,...(form.dias_semana.includes(d)?dbanuStyles.addButtonRevive:{})}}>{d.slice(0,3)}</Button>)}
      </Stack>
    </Box>
    <TextField label="Descripción" size="small" value={form.descripcion||''} onChange={e=>setForm(a=>({...a,descripcion:e.target.value}))} multiline minRows={2} sx={{gridColumn:{xs:'auto',md:'span 2'}}}/>
    <FormControlLabel control={<Switch checked={Boolean(form.activo)} onChange={e=>setForm(a=>({...a,activo:e.target.checked}))}/>} label="Activa"/>
  </Box>;
}

function FormularioReceso({form,setForm}){
  return <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(3,1fr)'},gap:1.5}}>
    <TextField label="Nombre" size="small" value={form.nombre} onChange={e=>setForm(a=>({...a,nombre:e.target.value}))} required/>
    <TextField select label="Tipo" size="small" value={form.tipo} onChange={e=>setForm(a=>({...a,tipo:e.target.value}))}>
      {['DESAYUNO','ALMUERZO','MERIENDA','PAUSA','OTRO'].map(x=><MenuItem key={x} value={x}>{x.charAt(0)+x.slice(1).toLowerCase()}</MenuItem>)}
    </TextField>
    <FormControlLabel control={<Switch checked={Boolean(form.activo)} onChange={e=>setForm(a=>({...a,activo:e.target.checked}))}/>} label="Activo"/>
    <TextField label="Hora inicio" type="time" size="small" value={form.hora_inicio} onChange={e=>setForm(a=>({...a,hora_inicio:e.target.value}))} slotProps={{inputLabel:{shrink:true}}}/>
    <TextField label="Hora fin" type="time" size="small" value={form.hora_fin} onChange={e=>setForm(a=>({...a,hora_fin:e.target.value}))} slotProps={{inputLabel:{shrink:true}}}/>
    <TextField label="Descripción" size="small" value={form.descripcion||''} onChange={e=>setForm(a=>({...a,descripcion:e.target.value}))}/>
  </Box>;
}
