export function generarPlantillaBase(tipo) {
  if (tipo === 'ACCESO') return {
    asunto: 'Activa tu acceso a {{nombre_sistema}}',
    cuerpo_html: `<p>Estimado(a) <strong>{{nombre_usuario}}</strong>:</p>
<p>Se informa que se ha creado su cuenta para acceder a <strong>{{nombre_sistema}}</strong>.</p>
<h3>Datos de la cuenta</h3>
<ul>
  <li>📧 <strong>Correo:</strong> {{email_usuario}}</li>
  <li>🪪 <strong>Cédula:</strong> {{cedula_usuario}}</li>
  <li>👤 <strong>Rol:</strong> {{roles_usuario}}</li>
  <li>📍 <strong>Sede:</strong> {{sede_usuario}}</li>
  <li><strong>Área operativa:</strong> {{facultad_direccion_usuario}}</li>
  <li><strong>Línea de servicio:</strong> {{carrera_area_usuario}}</li>
</ul>
<h3>Activación de la cuenta</h3>
<p>Para completar la activación y establecer su contraseña, acceda al siguiente enlace:</p>
<p><a href="{{url_activacion}}"><strong>🔐 Activar mi cuenta</strong></a></p>
<p>Código de verificación: <strong style="font-size:14px;letter-spacing:.5px">{{codigo_activacion}}</strong></p>
<p>Este enlace estará disponible hasta el <strong>{{fecha_expiracion}}</strong>.</p>
<p>Fecha de creación: {{fecha_creacion}}</p>
<p>Atentamente,<br><strong>Universidad Laica Eloy Alfaro de Manabí</strong></p>`,
    cuerpo_texto: `Estimado(a) {{nombre_usuario}}:

Se ha creado su cuenta para acceder a {{nombre_sistema}}.

Correo: {{email_usuario}}
Cédula: {{cedula_usuario}}
Rol: {{roles_usuario}}
Sede: {{sede_usuario}}
Área operativa: {{facultad_direccion_usuario}}
Línea de servicio: {{carrera_area_usuario}}

Active su cuenta y establezca su contraseña en: {{url_activacion}}
Código de verificación: {{codigo_activacion}}
Este enlace estará disponible hasta {{fecha_expiracion}}.

Atentamente,
Universidad Laica Eloy Alfaro de Manabí`,
  }
  return {
    asunto: 'Comunicado de {{nombre_sistema}}',
    cuerpo_html: `<p>Estimado(a) <strong>{{nombre_destinatario}}</strong>:</p>
<h2>Comunicado Revive</h2>
<p>Escriba aquí el contenido principal del comunicado.</p>
<p>Incluya fechas, instrucciones o enlaces relevantes para los destinatarios.</p>
<p>Atentamente,<br><strong>{{nombre_sistema}}</strong></p>`,
    cuerpo_texto: `Estimado(a) {{nombre_destinatario}}:

COMUNICADO INSTITUCIONAL

Escriba aquí el contenido principal del comunicado.
Incluya fechas, instrucciones o enlaces relevantes para los destinatarios.

Atentamente,
{{nombre_sistema}}`,
  }
}
