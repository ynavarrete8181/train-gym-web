# Actividad 1 - AWS Academy, Consola Cloud y Despliegue Web en EC2

Este proyecto (`train-gym-web`) puede usarse como evidencia del front-end del proyecto transversal para la actividad de maestria. La app compila correctamente con Vite y puede desplegarse como sitio estatico en una instancia EC2 Linux con `Nginx` o en una instancia EC2 Windows con `IIS`.

## 1. Objetivo

Documentar y ejecutar una practica basica de nube publica en AWS Academy:

- exploracion de la consola de AWS;
- lanzamiento de una instancia EC2 Linux;
- despliegue del front-end en Linux con `Nginx`;
- lanzamiento de una instancia EC2 Windows;
- despliegue del mismo front-end en Windows con `IIS`.

## 2. Archivos preparados en este proyecto

- `docs/aws/actividad-1-aws-ec2.md`: guia operativa completa.
- `docs/aws/plantilla-informe-actividad-1.html`: base editable para exportar a PDF.
- `deploy/aws/linux/nginx/revive-sport.conf`: configuracion de `Nginx` para SPA.
- `deploy/aws/linux/nginx/install-nginx-amazon-linux.sh`: instalacion base en Amazon Linux.
- `deploy/aws/windows/iis/web.config`: regla de publicacion para IIS.
- `deploy/aws/windows/iis/install-iis.ps1`: instalacion base de IIS en Windows Server.
- `.env.production.example`: ejemplo de variable para apuntar al backend.
- `scripts/package-aws-static.sh`: genera un `.zip` listo para copiar a EC2.

## 3. Preparacion local

Desde la raiz del proyecto:

```bash
npm install
cp .env.production.example .env.production
npm run package:aws
```

Notas:

- En `.env.production` reemplaza `PUBLIC_IP_OR_DOMAIN` por la IP publica o dominio del backend si ya lo tienes.
- El comando `npm run package:aws` compila el proyecto y genera `deploy-output/train-gym-web-ec2.zip`.
- Ese `.zip` contiene el `dist/` del frontend y el `web.config` para IIS.

## 4. Tarea 1 - AWS Academy y consola de AWS

Lo que conviene demostrar en el informe:

1. Ingreso a AWS Academy con el correo institucional.
2. Inicio del laboratorio o entorno asignado.
3. Apertura de la consola de AWS.
4. Identificacion de servicios clave:
   `EC2`, `VPC`, `Security Groups`, `IAM`, `CloudWatch`, `S3`.
5. Revision de la region activa.
6. Revision del panel de EC2, especialmente:
   instancias, pares de claves, grupos de seguridad, IP publica y estado de la VM.

Capturas sugeridas:

- pantalla inicial de AWS Academy;
- consola principal de AWS;
- panel de `EC2`;
- detalle de la instancia Linux;
- detalle de la instancia Windows;
- reglas de seguridad usadas.

## 5. Tarea 2 - Despliegue en EC2 Linux con Nginx

### 5.1 Crear la instancia

Configuracion recomendada para la practica:

- AMI: `Amazon Linux 2023`.
- Asignar IP publica: habilitada.
- Security Group de entrada:
  - `SSH` puerto `22` desde tu IP.
  - `HTTP` puerto `80` desde `0.0.0.0/0`.
  - `HTTPS` puerto `443` opcional.

### 5.2 Conectarse por SSH

```bash
ssh -i /ruta/a/tu-clave.pem ec2-user@EC2_PUBLIC_IP
```

### 5.3 Instalar Nginx

Puedes usar el script preparado en este proyecto o ejecutar los comandos manualmente.

Manual:

```bash
sudo dnf update -y
sudo dnf install -y nginx unzip
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5.4 Subir el frontend compilado

Desde tu equipo local:

```bash
scp -i /ruta/a/tu-clave.pem deploy-output/train-gym-web-ec2.zip ec2-user@EC2_PUBLIC_IP:/home/ec2-user/
scp -i /ruta/a/tu-clave.pem deploy/aws/linux/nginx/revive-sport.conf ec2-user@EC2_PUBLIC_IP:/home/ec2-user/
```

### 5.5 Publicar la aplicacion

En la instancia Linux:

```bash
sudo mkdir -p /var/www/revive-sport
sudo unzip -o /home/ec2-user/train-gym-web-ec2.zip -d /var/www/revive-sport
sudo cp /home/ec2-user/revive-sport.conf /etc/nginx/conf.d/revive-sport.conf
sudo nginx -t
sudo systemctl restart nginx
```

### 5.6 Verificar

Abre en el navegador:

```text
http://EC2_PUBLIC_IP
```

Si la app carga correctamente, toma capturas de:

- pagina web visible;
- consola EC2 con la instancia en estado `Running`;
- resultado de `sudo systemctl status nginx`;
- prueba del sitio desde el navegador.

## 6. Tarea 3 - Despliegue en EC2 Windows con IIS

### 6.1 Crear la instancia

Configuracion sugerida:

- AMI: `Windows Server 2022 Base`.
- Asignar IP publica: habilitada.
- Security Group de entrada:
  - `RDP` puerto `3389` desde tu IP.
  - `HTTP` puerto `80` desde `0.0.0.0/0`.

### 6.2 Obtener la contrasena y conectarse

1. En la consola EC2 selecciona la instancia.
2. Pulsa `Connect`.
3. Ve a la pestana `RDP client`.
4. Descarga el archivo `.rdp`.
5. Usa `Get password`, sube la clave `.pem` y descifra la contrasena.
6. Conectate por Escritorio Remoto.

### 6.3 Instalar IIS

En PowerShell como administrador:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
.\install-iis.ps1
```

O manualmente:

```powershell
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
```

### 6.4 Copiar el frontend a IIS

1. Transfiere `deploy-output/train-gym-web-ec2.zip` a la instancia Windows.
2. Descomprime el contenido en `C:\inetpub\wwwroot`.
3. Asegurate de que el archivo `web.config` quede en esa misma carpeta.

### 6.5 Reiniciar y verificar

En PowerShell:

```powershell
iisreset
```

Luego abre en el navegador:

```text
http://EC2_PUBLIC_IP
```

Capturas recomendadas:

- panel de EC2 Windows en `Running`;
- recuperacion de la contrasena;
- sesion RDP abierta;
- `IIS Manager`;
- navegador mostrando la aplicacion.

## 7. Nota importante sobre rutas SPA

Este frontend usa `react-router-dom`, por lo que al refrescar rutas internas como `/gimnasio/horario` se necesita reescritura a `index.html`.

- En Linux ya queda resuelto con `deploy/aws/linux/nginx/revive-sport.conf`.
- En Windows se resuelve con `deploy/aws/windows/iis/web.config`.
- En IIS la regla de reescritura requiere el modulo `URL Rewrite` si deseas soportar recarga directa de rutas internas.

## 8. Estructura sugerida del informe PDF

Limita el informe a un maximo de 15 paginas. Una estructura clara puede ser:

1. Portada.
2. Objetivo de la actividad.
3. Breve introduccion a AWS Academy y la consola de AWS.
4. Descripcion del proyecto usado como front-end.
5. Despliegue en EC2 Linux:
   creacion de instancia, seguridad, conexion, instalacion de `Nginx`, publicacion y pruebas.
6. Despliegue en EC2 Windows:
   creacion de instancia, recuperacion de credenciales, instalacion de `IIS`, publicacion y pruebas.
7. Evidencias fotograficas.
8. Conclusiones.

## 9. Checklist de evidencias

Antes de cerrar la actividad, confirma que tienes:

- captura de AWS Academy;
- captura de la consola AWS;
- captura de la instancia Linux creada;
- captura del grupo de seguridad Linux;
- captura del sitio funcionando en Linux;
- captura de la instancia Windows creada;
- captura del grupo de seguridad Windows;
- captura de la conexion RDP;
- captura del sitio funcionando en Windows;
- breve conclusion personal sobre ventajas y dificultades del despliegue.
