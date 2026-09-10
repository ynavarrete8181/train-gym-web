import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined'
import { Alert, Box, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material'
import { AccionesFormulario } from '../../../components/common/AccionesFormulario.jsx'
import { BotonVolver } from '../../../components/common/BotonVolver.jsx'
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx'
import { PageHeader } from '../../../components/common/PageHeader.jsx'

const tipos = [
  ['OAUTH2_CLIENT_CREDENTIALS', 'OAuth 2.0 · Aplicación'],
  ['OAUTH2_AUTHORIZATION_CODE_PKCE', 'OAuth 2.0 · Usuario (PKCE)'],
  ['API_KEY', 'API Key'],
  ['BEARER_TOKEN', 'Token Bearer'],
  ['BASIC', 'Usuario y contraseña'],
  ['NINGUNA', 'Sin autenticación'],
]

function CamposCredencial({ form, setForm, dato }) {
  const tipo = form.tipo_autenticacion || 'OAUTH2_CLIENT_CREDENTIALS'
  const configuracion = form.configuracion || {}
  const configurar = (campo, valor) => setForm({ ...form, configuracion: { ...configuracion, [campo]: valor } })
  const cambiarTipo = (nuevoTipo) => {
    const esMicrosoftPkce = nuevoTipo === 'OAUTH2_AUTHORIZATION_CODE_PKCE'
    setForm({
      ...form,
      tipo_autenticacion: nuevoTipo,
      codigo: esMicrosoftPkce ? 'MICROSOFT_ENTRA_LOGIN_APP' : form.codigo,
      datos: esMicrosoftPkce
        ? { tenant_id: '', client_id: '', scope: 'openid profile email User.Read' }
        : {},
      configuracion: esMicrosoftPkce
        ? { dominios_permitidos: [], graph_me_endpoint: 'https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName' }
        : {},
      token_url: '',
    })
  }

  return <>
    <TextField select label="Método de autenticación" value={tipo} onChange={(e) => cambiarTipo(e.target.value)}>
      {tipos.map(([valor, label]) => <MenuItem key={valor} value={valor}>{label}</MenuItem>)}
    </TextField>

    {tipo === 'OAUTH2_CLIENT_CREDENTIALS' && <>
      <TextField label="URL para obtener el token" value={form.token_url || ''} onChange={(e) => setForm({ ...form, token_url: e.target.value })} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField fullWidth label="Identificador del tenant (opcional)" value={form.datos?.tenant_id || ''} onChange={(e) => dato('tenant_id', e.target.value)} />
        <TextField fullWidth label="Identificador de la aplicación" value={form.datos?.client_id || ''} onChange={(e) => dato('client_id', e.target.value)} />
      </Stack>
      <TextField type="password" label="Secreto de la aplicación" value={form.datos?.client_secret || ''} onChange={(e) => dato('client_secret', e.target.value)} />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField fullWidth label="Alcance (scope)" value={form.datos?.scope || ''} onChange={(e) => dato('scope', e.target.value)} />
        <TextField fullWidth label="Cuenta remitente (opcional)" value={form.datos?.sender || ''} onChange={(e) => dato('sender', e.target.value)} />
      </Stack>
    </>}

    {tipo === 'OAUTH2_AUTHORIZATION_CODE_PKCE' && <>
      <Alert severity="info">
        Este perfil se usa para el inicio de sesión de la app móvil. Es un cliente público con PKCE y no utiliza secreto de aplicación.
      </Alert>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
        <TextField fullWidth required label="Tenant ID" value={form.datos?.tenant_id || ''} onChange={(e) => dato('tenant_id', e.target.value)} />
        <TextField fullWidth required label="Client ID de la app móvil" value={form.datos?.client_id || ''} onChange={(e) => dato('client_id', e.target.value)} />
      </Stack>
      <TextField
        label="Scopes"
        value={form.datos?.scope || ''}
        onChange={(e) => dato('scope', e.target.value)}
        helperText="Ejemplo: openid profile email User.Read"
      />
      <TextField
        label="Dominios permitidos"
        value={(configuracion.dominios_permitidos || []).join(', ')}
        onChange={(e) => configurar('dominios_permitidos', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
        placeholder="revive.local"
        helperText="Separa varios dominios con comas. Déjalo vacío si el tenant será la única restricción."
      />
      <TextField
        label="Endpoint Microsoft Graph /me"
        value={configuracion.graph_me_endpoint || ''}
        onChange={(e) => configurar('graph_me_endpoint', e.target.value)}
      />
    </>}

    {tipo === 'API_KEY' && <>
      <TextField type="password" label="API Key" value={form.datos?.api_key || ''} onChange={(e) => dato('api_key', e.target.value)} />
      <TextField label="Nombre del encabezado" value={form.datos?.header_name || ''} onChange={(e) => dato('header_name', e.target.value)} />
    </>}
    {tipo === 'BEARER_TOKEN' && <TextField type="password" label="Token" value={form.datos?.token || ''} onChange={(e) => dato('token', e.target.value)} />}
    {tipo === 'BASIC' && <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
      <TextField fullWidth label="Usuario" value={form.datos?.username || ''} onChange={(e) => dato('username', e.target.value)} />
      <TextField fullWidth type="password" label="Contraseña" value={form.datos?.password || ''} onChange={(e) => dato('password', e.target.value)} />
    </Stack>}
  </>
}

export function FormularioIntegracion({ tipo, esEdicion, form, setForm, data, cargando, onGuardar, onVolver, aviso, setAviso }) {
  const esProveedor = tipo === 'proveedor'; const esServicio = tipo === 'servicio'; const esCredencial = tipo === 'credencial'
  const esServicioCorreo = esServicio && form.codigo === 'CORREO_ENVIAR'
  const esMicrosoftPkce = esCredencial && form.tipo_autenticacion === 'OAUTH2_AUTHORIZATION_CODE_PKCE'
  const nombreTipo = esProveedor ? 'proveedor' : esServicio ? 'servicio externo' : 'perfil de autenticación'
  const perfiles = data.credenciales.filter((item) => Number(item.proveedor_id) === Number(form.proveedor_id))
  const dato = (campo, valor) => setForm({ ...form, datos: { ...(form.datos || {}), [campo]: valor } })

  return <Box className="page-wrapper">
    <PageHeader titulo={`${esEdicion ? 'Editar' : 'Nuevo'} ${nombreTipo}`} descripcion="Completa la configuración reutilizable de la integración." icono={esCredencial ? <KeyOutlinedIcon /> : <HubOutlinedIcon />} acciones={<BotonVolver onClick={onVolver} />} />
    <Paper className="page-content-container" elevation={0} sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <Paper variant="outlined" sx={{ maxWidth: 1050, mx: 'auto', p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Stack spacing={1.7}>
          {!esProveedor && <TextField select label="Proveedor" value={form.proveedor_id || ''} onChange={(e) => setForm({ ...form, proveedor_id: e.target.value, credencial_id: '' })}>{data.proveedores.map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField>}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField fullWidth label="Nombre" value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <TextField fullWidth label="Código interno" value={form.codigo || ''} disabled={esMicrosoftPkce} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase().replace(/\s+/g, '_') })} helperText={esMicrosoftPkce ? 'Código reservado para el login de la app.' : undefined} />
          </Stack>
          {esProveedor && <>
            <TextField label="URL base HTTPS" value={form.url_base || ''} onChange={(e) => setForm({ ...form, url_base: e.target.value })} />
            <TextField label="Descripción" multiline minRows={3} value={form.descripcion || ''} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            <Paper variant="outlined" sx={{ p: 1.5 }}><Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}><Switch checked={form.verificar_ssl !== false} onChange={(e) => setForm({ ...form, verificar_ssl: e.target.checked })} /><Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>Verificar certificados SSL</Typography></Stack></Paper>
          </>}
          {esServicio && <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}><TextField select label="Método" value={form.metodo || 'POST'} onChange={(e) => setForm({ ...form, metodo: e.target.value })}>{['GET','POST','PUT','PATCH','DELETE'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}</TextField><TextField fullWidth label="Endpoint relativo" value={form.endpoint || ''} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} /></Stack>
            <TextField select label="Perfil de autenticación" value={form.credencial_id || ''} onChange={(e) => setForm({ ...form, credencial_id: e.target.value })}><MenuItem value="">Sin autenticación</MenuItem>{perfiles.map((item) => <MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}><TextField fullWidth type="number" label="Tiempo máximo (segundos)" value={form.timeout_segundos || 25} onChange={(e) => setForm({ ...form, timeout_segundos: e.target.value })} /><TextField fullWidth type="number" label="Reintentos" value={form.reintentos ?? 3} onChange={(e) => setForm({ ...form, reintentos: e.target.value })} />{esServicioCorreo && <TextField fullWidth type="number" label="Correos por minuto" value={form.correos_por_minuto ?? 10} inputProps={{ min: 1, max: 1000 }} onChange={(e) => setForm({ ...form, correos_por_minuto: e.target.value })} />}</Stack>
            <TextField label="Encabezados adicionales (JSON)" multiline minRows={4} value={form.headers || '{}'} onChange={(e) => setForm({ ...form, headers: e.target.value })} />
          </>}
          {esCredencial && <CamposCredencial form={form} setForm={setForm} dato={dato} />}
          <Paper variant="outlined" sx={{ p: 1.5 }}><Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}><Switch checked={Boolean(form.activo)} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /><Typography sx={{ fontSize: 12.5, fontWeight: 850 }}>Registro activo</Typography></Stack></Paper>
          <AccionesFormulario onCancelar={onVolver} onGuardar={onGuardar} guardando={cargando} />
        </Stack>
      </Paper>
    </Paper>
    <NotificacionSnackbar mensaje={aviso?.mensaje} tipo={aviso?.tipo} onClose={() => setAviso(null)} />
  </Box>
}
