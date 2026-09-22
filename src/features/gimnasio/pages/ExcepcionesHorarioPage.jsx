import { useEffect, useState } from 'react';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Autocomplete, Box, Button, FormControlLabel, IconButton, MenuItem, Paper, Switch, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { BotonVolver } from '../../../components/common/BotonVolver.jsx';
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const hoy=new Date().toISOString().slice(0,10);
const ini={id:null,entrenador_id:'',sede_id:'',fecha_inicio:hoy,fecha_fin:hoy,hora_inicio:'',hora_fin:'',tipo:'NO_DISPONIBLE',motivo:'',observaciones:'',activo:true};
const f=v=>String(v||'').slice(0,10), h=v=>String(v||'').slice(0,5);

export function ExcepcionesHorarioPage(){
  const [vista,setVista]=useState('lista'),[items,setItems]=useState([]),[meta,setMeta]=useState({}),[filtros,setFiltros]=useState({busqueda:'',page:1,per_page:5}),[form,setForm]=useState(ini);
  const [catalogos,setCatalogos]=useState({sedes:[]}),[ops,setOps]=useState([]),[q,setQ]=useState(''),[cargando,setCargando]=useState(true),[nota,setNota]=useState({mensaje:'',tipo:'info'});
  const cargar=async(p=filtros)=>{setCargando(true);try{const r=await gimnasioServicio.obtenerExcepcionesAgenda(p);setItems(r.datos||[]);setMeta(r.meta||{});}finally{setCargando(false);}};
  useEffect(()=>{cargar();gimnasioServicio.obtenerCatalogosAgenda().then(r=>setCatalogos(r.datos||{}));},[]);
  useEffect(()=>{if(vista!=='formulario'||q.trim().length<2)return;const t=setTimeout(async()=>{const r=await gimnasioServicio.buscarEntrenadoresAgenda({q});setOps(r.datos||[]);},300);return()=>clearTimeout(t);},[q,vista]);
  const editar=x=>{setForm({...ini,...x,fecha_inicio:f(x.fecha_inicio),fecha_fin:f(x.fecha_fin),hora_inicio:h(x.hora_inicio),hora_fin:h(x.hora_fin)});setOps([{id:x.entrenador_id,name:x.entrenador_nombre}]);setVista('formulario');};
  const guardar=async()=>{try{
    const p={...form,entrenador_id:Number(form.entrenador_id),sede_id:Number(form.sede_id),hora_inicio:form.hora_inicio||null,hora_fin:form.hora_fin||null};
    if(form.id)await gimnasioServicio.actualizarExcepcionAgenda(form.id,p);else await gimnasioServicio.crearExcepcionAgenda(p);
    setNota({mensaje:'Excepción guardada correctamente.',tipo:'success'});setVista('lista');setForm(ini);cargar({...filtros,page:1});
  }catch(e){const m=e.response?.data?.errores?Object.values(e.response.data.errores).flat().join(' '):(e.response?.data?.mensaje||'No se pudo guardar la excepción.');setNota({mensaje:m,tipo:'error'});}};
  if(vista==='formulario')return <Box className="page-wrapper">
    <PageHeader titulo={form.id?'Editar excepción':'Nueva excepción de horario'} descripcion="Bloquea disponibilidad por capacitación, vacaciones, cierre o ausencia." icono={<EventBusyOutlinedIcon/>} acciones={<BotonVolver onClick={()=>setVista('lista')}/>}/>
    <Paper className="page-content-container" elevation={0} sx={{p:2}}>
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr',md:'repeat(3,1fr)'},gap:1.4}}>
        <Autocomplete options={ops} value={ops.find(x=>String(x.id)===String(form.entrenador_id))||null} onInputChange={(_,v)=>setQ(v)} onChange={(_,v)=>setForm(a=>({...a,entrenador_id:v?.id||''}))} getOptionLabel={x=>x.name||[x.nombres,x.apellidos].filter(Boolean).join(' ')} isOptionEqualToValue={(a,b)=>String(a.id)===String(b.id)} renderInput={p=><TextField {...p} label="Entrenador" size="small" required/>}/>
        <TextField select label="Sede" size="small" value={form.sede_id} onChange={e=>setForm(a=>({...a,sede_id:e.target.value}))}>{(catalogos.sedes||[]).map(x=><MenuItem key={x.id} value={x.id}>{x.nombre}</MenuItem>)}</TextField>
        <TextField select label="Tipo" size="small" value={form.tipo} onChange={e=>setForm(a=>({...a,tipo:e.target.value}))}>{['NO_DISPONIBLE','HORARIO_ESPECIAL','CIERRE_SEDE','VACACIONES','CAPACITACION','OTRO'].map(x=><MenuItem key={x} value={x}>{x.replaceAll('_',' ')}</MenuItem>)}</TextField>
        <TextField type="date" label="Desde" size="small" value={form.fecha_inicio} onChange={e=>setForm(a=>({...a,fecha_inicio:e.target.value}))} slotProps={{inputLabel:{shrink:true}}}/>
        <TextField type="date" label="Hasta" size="small" value={form.fecha_fin} onChange={e=>setForm(a=>({...a,fecha_fin:e.target.value}))} slotProps={{inputLabel:{shrink:true}}}/>
        <Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1}}><TextField type="time" label="Hora inicio" size="small" value={form.hora_inicio} onChange={e=>setForm(a=>({...a,hora_inicio:e.target.value}))} slotProps={{inputLabel:{shrink:true}}}/><TextField type="time" label="Hora fin" size="small" value={form.hora_fin} onChange={e=>setForm(a=>({...a,hora_fin:e.target.value}))} slotProps={{inputLabel:{shrink:true}}}/></Box>
        <TextField label="Motivo" size="small" value={form.motivo} onChange={e=>setForm(a=>({...a,motivo:e.target.value}))} required sx={{gridColumn:{md:'span 2'}}}/>
        <FormControlLabel control={<Switch checked={Boolean(form.activo)} onChange={e=>setForm(a=>({...a,activo:e.target.checked}))}/>} label="Activo"/>
        <TextField label="Observaciones" size="small" value={form.observaciones||''} onChange={e=>setForm(a=>({...a,observaciones:e.target.value}))} multiline minRows={2} sx={{gridColumn:{md:'span 3'}}}/>
      </Box>
      <AccionesFormulario onGuardar={guardar} onCancelar={()=>setVista('lista')}/>
    </Paper>
    <NotificacionSnackbar mensaje={nota.mensaje} tipo={nota.tipo} onClose={()=>setNota(a=>({...a,mensaje:''}))}/>
  </Box>;
  return <Box className="page-wrapper">
    <PageHeader titulo="Excepciones de horario" descripcion="Gestiona bloqueos temporales que afectan la disponibilidad." icono={<EventBusyOutlinedIcon/>}/>
    <Paper className="page-content-container" elevation={0}>
      <GestionToolbar total={meta.total||0} busqueda={filtros.busqueda} onBusqueda={busqueda=>{const n={...filtros,busqueda,page:1};setFiltros(n);cargar(n);}} acciones={<Button startIcon={<AddOutlinedIcon/>} onClick={()=>{setForm(ini);setOps([]);setVista('formulario');}} sx={dbanuStyles.addButtonRevive}>Añadir</Button>}/>
      <TablaGestion total={meta.total||0} filtrados={meta.total||0} page={meta.pagina_actual||1} rowsPerPage={meta.por_pagina||5} cargando={cargando} onPageChange={page=>{const n={...filtros,page};setFiltros(n);cargar(n);}} onRowsPerPageChange={per_page=>{const n={...filtros,per_page,page:1};setFiltros(n);cargar(n);}}>
        <TableHead><TableRow><TableCell>Entrenador</TableCell><TableCell>Sede</TableCell><TableCell>Tipo / motivo</TableCell><TableCell>Fecha</TableCell><TableCell>Horario</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead>
        <TableBody>
          {items.map(x=><TableRow key={x.id} hover><TableCell>{x.entrenador_nombre}</TableCell><TableCell>{x.sede_nombre}</TableCell><TableCell><Typography variant="body2" fontWeight={700}>{x.tipo.replaceAll('_',' ')}</Typography><Typography variant="caption" color="text.secondary">{x.motivo}</Typography></TableCell><TableCell>{f(x.fecha_inicio)}{x.fecha_fin!==x.fecha_inicio?` - ${f(x.fecha_fin)}`:''}</TableCell><TableCell>{x.hora_inicio?`${h(x.hora_inicio)} - ${h(x.hora_fin)}`:'Todo el día'}</TableCell><TableCell><StatusChip estado={x.activo?'activo':'inactivo'}/></TableCell><TableCell align="right"><Tooltip title="Editar"><IconButton sx={dbanuStyles.actionEdit} onClick={()=>editar(x)}><EditOutlinedIcon sx={{fontSize:17}}/></IconButton></Tooltip></TableCell></TableRow>)}
          {!items.length?<TablaEstadoFila colSpan={7} cargando={cargando} texto="No existen excepciones configuradas."/>:null}
        </TableBody>
      </TablaGestion>
    </Paper>
    <NotificacionSnackbar mensaje={nota.mensaje} tipo={nota.tipo} onClose={()=>setNota(a=>({...a,mensaje:''}))}/>
  </Box>;
}
