import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined'
import FormatAlignCenterOutlinedIcon from '@mui/icons-material/FormatAlignCenterOutlined'
import FormatAlignJustifyOutlinedIcon from '@mui/icons-material/FormatAlignJustifyOutlined'
import FormatAlignLeftOutlinedIcon from '@mui/icons-material/FormatAlignLeftOutlined'
import FormatAlignRightOutlinedIcon from '@mui/icons-material/FormatAlignRightOutlined'
import FormatBoldOutlinedIcon from '@mui/icons-material/FormatBoldOutlined'
import FormatItalicOutlinedIcon from '@mui/icons-material/FormatItalicOutlined'
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined'
import FormatListNumberedOutlinedIcon from '@mui/icons-material/FormatListNumberedOutlined'
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined'
import TextFieldsOutlinedIcon from '@mui/icons-material/TextFieldsOutlined'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import { Box, Button, IconButton, MenuItem, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { PestanasEstandar } from '../../../../components/common/PestanasEstandar.jsx'

const herramientas = [
  ['Negrita', 'bold', FormatBoldOutlinedIcon],
  ['Cursiva', 'italic', FormatItalicOutlinedIcon],
  ['Alinear a la izquierda', 'justifyLeft', FormatAlignLeftOutlinedIcon],
  ['Centrar', 'justifyCenter', FormatAlignCenterOutlinedIcon],
  ['Alinear a la derecha', 'justifyRight', FormatAlignRightOutlinedIcon],
  ['Justificar', 'justifyFull', FormatAlignJustifyOutlinedIcon],
  ['Lista', 'insertUnorderedList', FormatListBulletedOutlinedIcon],
  ['Lista numerada', 'insertOrderedList', FormatListNumberedOutlinedIcon],
]

const textoDesdeHtml = (html) => {
  const contenedor = document.createElement('div')
  contenedor.innerHTML = html.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
  return (contenedor.textContent || '').replace(/\n{3,}/g, '\n\n').trim()
}

export function EditorContenidoCorreo({ html, texto, onHtmlChange, onTextoChange, variablesDisponibles = [], onAutogenerar }) {
  const [pestana, setPestana] = useState('visual')
  const editor = useRef(null)
  useEffect(() => { if (editor.current && document.activeElement !== editor.current && editor.current.innerHTML !== html) editor.current.innerHTML = html || '' }, [html, pestana])

  const comando = (nombre, valor = null) => {
    editor.current?.focus()
    document.execCommand(nombre, false, valor)
    onHtmlChange(editor.current?.innerHTML || '')
  }
  const crearEnlace = () => {
    const url = window.prompt('Escribe la dirección del enlace:')
    if (url) comando('createLink', url)
  }
  const insertarCaracter = (valor) => { if (valor) comando('insertText', valor) }

  return <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, bgcolor: '#f8fafc', pr: { sm: 1 } }}>
      <PestanasEstandar value={pestana} onChange={(_, valor) => setPestana(valor)} opciones={[
        { value: 'visual', label: 'Editor visual' },
        { value: 'html', label: 'HTML', icon: <CodeOutlinedIcon /> },
        { value: 'texto', label: 'Texto plano', icon: <TextFieldsOutlinedIcon /> },
      ]} sx={{ flex: 1 }} />
      <Button size="small" startIcon={<AutoAwesomeOutlinedIcon />} onClick={onAutogenerar} sx={{ m: { xs: 1, sm: 0 }, textTransform: 'none', whiteSpace: 'nowrap' }}>Generar contenido base</Button>
    </Stack>
    {pestana === 'visual' && <Box>
      <Stack direction="row" useFlexGap sx={{ px: 1.2, py: .7, gap: .35, flexWrap: 'wrap', borderBottom: '1px solid #dbe5f0' }}>
        {herramientas.map(([titulo, cmd, Icono]) => <Tooltip key={cmd} title={titulo}><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); comando(cmd) }}><Icono /></IconButton></Tooltip>)}
        <Tooltip title="Insertar enlace"><IconButton size="small" onMouseDown={(e) => { e.preventDefault(); crearEnlace() }}><LinkOutlinedIcon /></IconButton></Tooltip>
        <TextField select size="small" value="" onChange={(e) => insertarCaracter(e.target.value)} SelectProps={{ displayEmpty: true }} sx={{ ml: .5, minWidth: 145, '& .MuiInputBase-root': { height: 32, fontSize: 12 } }}><MenuItem value="" disabled>Carácter especial</MenuItem>{['¿','¡','á','é','í','ó','ú','ñ','ü','—','©','®','€'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField>
        <TextField select size="small" value="" onChange={(e) => insertarCaracter(`{{${e.target.value}}}`)} SelectProps={{ displayEmpty: true }} sx={{ minWidth: 175, '& .MuiInputBase-root': { height: 32, fontSize: 12 } }}><MenuItem value="" disabled>Insertar variable</MenuItem>{variablesDisponibles.map((variable) => <MenuItem key={variable} value={variable}>{`{{${variable}}}`}</MenuItem>)}</TextField>
      </Stack>
      <Box ref={editor} contentEditable suppressContentEditableWarning onInput={(e) => onHtmlChange(e.currentTarget.innerHTML)} sx={{ minHeight: 280, p: 2, outline: 'none', fontSize: 14, lineHeight: 1.6, '&:focus': { boxShadow: 'inset 0 0 0 2px #1976d2' } }} />
    </Box>}
    {pestana === 'html' && <TextField fullWidth multiline minRows={14} value={html} onChange={(e) => onHtmlChange(e.target.value)} placeholder="<p>Escribe el contenido HTML...</p>" sx={{ p: 1.5, '& textarea': { fontFamily: 'Consolas, monospace', fontSize: 12.5 } }} />}
    {pestana === 'texto' && <Box sx={{ p: 1.5 }}><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ mb: 1, gap: 1, justifyContent: 'space-between' }}><Box><Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>Versión sin formato</Typography><Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>Alternativa accesible para clientes que no muestran HTML.</Typography></Box><Button size="small" variant="outlined" onClick={() => onTextoChange(textoDesdeHtml(html))}>Generar desde HTML</Button></Stack><TextField fullWidth multiline minRows={12} value={texto || ''} onChange={(e) => onTextoChange(e.target.value)} /></Box>}
  </Paper>
}
