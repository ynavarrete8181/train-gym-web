import { useEffect, useState } from 'react';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import { Box, Paper, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { TablaGestion } from '../../../components/tables/TablaGestion.jsx';
import { TablaEstadoFila } from '../../../components/tables/TablaEstadoFila.jsx';
import { StatusChip } from '../../../components/common/StatusChip.jsx';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

const f=v=>String(v||'').slice(0,10);
const h=v=>String(v||'').slice(0,5);

export function ReservasPage(){
  const [items,setItems]=useState([]),[meta,setMeta]=useState({}),[cargando,setCargando]=useState(true);
  const [filtros,setFiltros]=useState({busqueda:'',page:1,per_page:5});
  const cargar=async(p=filtros)=>{setCargando(true);try{const r=await gimnasioServicio.obtenerReservasAgenda(p);setItems(r.datos||[]);setMeta(r.meta||{});}finally{setCargando(false);}};
  useEffect(()=>{cargar();},[]);
  return <Box className="page-wrapper">
    <PageHeader titulo="Reservas" descripcion="Reservas reales confirmadas en la agenda." icono={<EventNoteOutlinedIcon/>}/>
    <Paper className="page-content-container" elevation={0}>
      <GestionToolbar total={meta.total||0} busqueda={filtros.busqueda} onBusqueda={busqueda=>{const n={...filtros,busqueda,page:1};setFiltros(n);cargar(n);}}/>
      <TablaGestion total={meta.total||0} filtrados={meta.total||0} page={meta.pagina_actual||1} rowsPerPage={meta.por_pagina||5} cargando={cargando}
        onPageChange={page=>{const n={...filtros,page};setFiltros(n);cargar(n);}}
        onRowsPerPageChange={per_page=>{const n={...filtros,per_page,page:1};setFiltros(n);cargar(n);}}>
        <TableHead><TableRow><TableCell>Cliente</TableCell><TableCell>Servicio</TableCell><TableCell>Entrenador</TableCell><TableCell>Sede</TableCell><TableCell>Fecha / horario</TableCell><TableCell>Estado</TableCell></TableRow></TableHead>
        <TableBody>
          {items.map(x=><TableRow key={x.id} hover>
            <TableCell><Typography variant="body2" fontWeight={700}>{x.cliente_nombre}</Typography><Typography variant="caption" color="text.secondary">{x.codigo_deportista}</Typography></TableCell>
            <TableCell>{x.servicio_nombre}</TableCell><TableCell>{x.entrenador_nombre||'Sin entrenador'}</TableCell><TableCell>{x.sede_nombre||'—'}</TableCell>
            <TableCell><Typography variant="body2">{f(x.fecha)}</Typography><Typography variant="caption" color="text.secondary">{h(x.hora_inicio)} - {h(x.hora_fin)}</Typography></TableCell>
            <TableCell><StatusChip estado={String(x.estado||'').toLowerCase()}/></TableCell>
          </TableRow>)}
          {!items.length?<TablaEstadoFila colSpan={6} cargando={cargando} texto="No existen reservas registradas."/>:null}
        </TableBody>
      </TablaGestion>
    </Paper>
  </Box>;
}
