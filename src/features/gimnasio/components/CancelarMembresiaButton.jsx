import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { IconButton, Tooltip } from '@mui/material';
import { confirmarAccion } from '../../../utils/confirmacion.js';
import { dbanuStyles } from '../../../styles/dbanuStyles.js';
import { gimnasioServicio } from '../services/gimnasioServicio.js';

export function CancelarMembresiaButton({ membresia, onCancelada }) {
  const handleCancelar = async () => {
    const confirmado = await confirmarAccion({
      titulo: 'Cancelar membresía',
      texto: `¿Deseas cancelar la membresía ${membresia.codigo_contrato} de ${membresia.deportista_nombre || 'este cliente'}? El registro se conservará en el historial.`,
      textoConfirmar: 'Sí, cancelar',
      icono: 'warning',
    });

    if (!confirmado) return;

    await gimnasioServicio.actualizarMembresia(membresia.id, {
      fecha_inicio: String(membresia.fecha_inicio).slice(0, 10),
      fecha_fin: String(membresia.fecha_fin).slice(0, 10),
      estado: 'CANCELADA',
      dias_gracia: Number(membresia.dias_gracia || 0),
      renovacion_automatica: false,
      ...(membresia.fecha_congelacion_inicio
        ? { fecha_congelacion_inicio: String(membresia.fecha_congelacion_inicio).slice(0, 10) }
        : {}),
      ...(membresia.fecha_congelacion_fin
        ? { fecha_congelacion_fin: String(membresia.fecha_congelacion_fin).slice(0, 10) }
        : {}),
    });

    if (onCancelada) {
      onCancelada(membresia.id);
      return;
    }

    window.location.reload();
  };

  if (String(membresia.estado || '').toUpperCase() === 'CANCELADA') return null;

  return (
    <Tooltip title="Cancelar membresía">
      <IconButton sx={dbanuStyles.actionDelete} onClick={handleCancelar}>
        <BlockOutlinedIcon sx={{ fontSize: 17 }} />
      </IconButton>
    </Tooltip>
  );
}
