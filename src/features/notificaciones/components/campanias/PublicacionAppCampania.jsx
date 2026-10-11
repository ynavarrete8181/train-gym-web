import SmartphoneOutlinedIcon from '@mui/icons-material/SmartphoneOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import InsertPhotoOutlinedIcon from '@mui/icons-material/InsertPhotoOutlined'
import { Box, Button, CircularProgress, IconButton, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useRef, useState } from 'react'
import { subirImagenPublicacionApp } from '../../services/campaniaService.js'

export function PublicacionAppCampania({ value, titulo, descripcion, onChange }) {
  const inputRef = useRef(null)
  const [cargandoImagen, setCargandoImagen] = useState(false)
  const [errorImagen, setErrorImagen] = useState('')
  const actualizar = (cambios) => onChange({ ...value, ...cambios })
  const imagenVistaPrevia = value?.imagen_preview || value?.imagen_url || ''

  const cargarImagen = async (event) => {
    const archivo = event.target.files?.[0]
    event.target.value = ''
    if (!archivo) return
    setCargandoImagen(true)
    setErrorImagen('')
    try {
      const imagen = await subirImagenPublicacionApp(archivo)
      actualizar({ imagen_archivo: imagen.ruta, imagen_nombre: imagen.nombre, imagen_preview: imagen.url, imagen_url: '' })
    } catch (error) {
      setErrorImagen(error?.response?.data?.mensaje || 'No se pudo cargar la imagen.')
    } finally {
      setCargandoImagen(false)
    }
  }

  return <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: { lg: 'stretch' } }}>
    <Paper variant="outlined" sx={{ flex: 1, p: 2, bgcolor: '#f8fafc' }}>
    <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
      <Box sx={{ width: 34, height: 34, borderRadius: 1.5, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: 'rgba(20,73,133,.08)' }}>
        <SmartphoneOutlinedIcon fontSize="small" />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>Publicación en el inicio de la app</Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Destaca este comunicado en el carrusel de los destinatarios.</Typography>
      </Box>
    </Stack>

      {value?.visible && <Stack spacing={1.3} sx={{ mt: 1.7 }}>
      <TextField size="small" required label="Título en la app" value={value.titulo || ''} onChange={(e) => actualizar({ titulo: e.target.value })} inputProps={{ maxLength: 255 }} />
      <TextField size="small" required multiline minRows={2} label="Descripción en la app" value={value.descripcion || ''} onChange={(e) => actualizar({ descripcion: e.target.value })} inputProps={{ maxLength: 1000 }} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' } }}>
        <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={cargarImagen} />
        {!value.imagen_archivo && <Button variant="outlined" startIcon={cargandoImagen ? <CircularProgress size={16} /> : <UploadFileOutlinedIcon />} disabled={cargandoImagen} onClick={() => inputRef.current?.click()}>
          Subir imagen
        </Button>}
        {value.imagen_archivo && <Box sx={{ minWidth: 0, maxWidth: 360, display: 'flex', alignItems: 'center', gap: .8, px: 1, py: .45, border: '1px solid #cdd8e5', borderRadius: 1.5, bgcolor: '#fff' }}>
          <InsertPhotoOutlinedIcon sx={{ flex: '0 0 auto', fontSize: 19, color: 'primary.main' }} />
          <Tooltip title={value.imagen_nombre || value.imagen_archivo}>
            <Typography noWrap sx={{ minWidth: 0, flex: 1, fontSize: 11.5 }}>{value.imagen_nombre || value.imagen_archivo.split('/').pop()}</Typography>
          </Tooltip>
          <IconButton size="small" aria-label="Eliminar imagen" onClick={() => actualizar({ imagen_archivo: '', imagen_nombre: '', imagen_preview: '' })}><CloseRoundedIcon sx={{ fontSize: 17 }} /></IconButton>
        </Box>}
        <Typography sx={{ fontSize: 10.5, color: errorImagen ? 'error.main' : 'text.secondary' }}>{errorImagen || 'JPG, PNG o WebP · máximo 2 MB'}</Typography>
      </Stack>
      <TextField
        size="small"
        label="O usar URL HTTPS"
        value={value.imagen_url || ''}
        onChange={(e) => actualizar({ imagen_url: e.target.value, imagen_archivo: '', imagen_preview: '' })}
        helperText="Si no se indica una imagen, la app utiliza la tarjeta principal de Revive."
      />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.3}>
        <TextField
          fullWidth
          size="small"
          label="URL HTTPS de acción (opcional)"
          value={value.accion_url || ''}
          onChange={(e) => actualizar({ accion_url: e.target.value })}
        />
        <TextField
          size="small"
          label="Texto del botón"
          value={value.accion_etiqueta || ''}
          onChange={(e) => actualizar({ accion_etiqueta: e.target.value })}
          disabled={!value.accion_url}
          sx={{ minWidth: { md: 210 } }}
        />
      </Stack>
      </Stack>}
    </Paper>

    <Paper variant="outlined" sx={{ width: { xs: '100%', lg: 370 }, p: 2, bgcolor: '#f4f7fb' }}>
      <Typography sx={{ mb: 1.2, fontSize: 11.5, fontWeight: 850, color: 'text.secondary' }}>Vista previa en Inicio</Typography>
      {value?.visible ? <Box sx={{ mx: 'auto', maxWidth: 330 }}>
        <Box sx={{
          position: 'relative', height: 184, overflow: 'hidden', borderRadius: 3, p: 2,
          color: '#fff', bgcolor: '#144985',
          backgroundImage: imagenVistaPrevia ? `linear-gradient(rgba(8,32,66,.62), rgba(8,32,66,.62)), url("${String(imagenVistaPrevia).replaceAll('"', '%22')}")` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 10px 24px rgba(16,42,86,.18)',
        }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 30, height: 30, borderRadius: 1.3, display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,.15)' }}><SmartphoneOutlinedIcon sx={{ fontSize: 18 }} /></Box>
            <Typography sx={{ flex: 1, fontSize: 9, fontWeight: 850, letterSpacing: .8, color: 'rgba(255,255,255,.72)' }}>COMUNICACIÓN INSTITUCIONAL</Typography>
            <Box sx={{ width: 8, height: 8, borderRadius: 99, bgcolor: '#9fe6b8' }} />
          </Stack>
          <Typography sx={{ mt: 1.4, fontSize: 17, lineHeight: 1.25, fontWeight: 900 }} noWrap>{value.titulo || titulo || 'Comunicado Revive'}</Typography>
          <Typography sx={{ mt: .5, fontSize: 11, lineHeight: 1.45, color: 'rgba(255,255,255,.78)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{value.descripcion || descripcion || 'Consulta las novedades publicadas para tu cuenta.'}</Typography>
          {value.accion_url && <Box sx={{ position: 'absolute', right: 16, bottom: 14, px: 1.3, py: .7, borderRadius: 99, color: '#144985', bgcolor: '#fff', fontSize: 10.5, fontWeight: 900 }}>{value.accion_etiqueta || 'Ver más'} →</Box>}
        </Box>
        <Typography sx={{ mt: 1.2, textAlign: 'center', fontSize: 10.5, color: 'text.secondary' }}>Representación aproximada; el ancho se adapta al dispositivo.</Typography>
      </Box> : <Box sx={{ minHeight: 184, display: 'grid', placeItems: 'center', px: 3, border: '1px dashed #bdc9d8', borderRadius: 3, bgcolor: '#fff' }}>
        <Box sx={{ textAlign: 'center' }}><SmartphoneOutlinedIcon sx={{ color: 'text.disabled' }} /><Typography sx={{ mt: .7, fontSize: 12, color: 'text.secondary' }}>Este comunicado no aparecerá en el carrusel.</Typography></Box>
      </Box>}
    </Paper>
  </Stack>
}
