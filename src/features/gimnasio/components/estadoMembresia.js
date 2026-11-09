import { hoyEcuador } from '../../../utils/fechaLocal.js';

const ETIQUETAS = {
  PENDIENTE_PAGO: 'Pendiente de pago',
  ACTIVA: 'Activa',
  CONGELADA: 'Congelada',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
};

const CHIP = {
  PENDIENTE_PAGO: 'pendiente',
  ACTIVA: 'activo',
  CONGELADA: 'congelada',
  VENCIDA: 'cerrado',
  CANCELADA: 'cancelada',
};

export const esPaseDiario = (membresia) => String(membresia?.tipo_producto || '').toUpperCase() === 'PASE_DIARIO';

/**
 * Lo que ve el usuario. El Pase Diario se vende cada día, por lo que al terminar
 * una fecha de uso se presenta como disponible; su estado interno no cambia.
 */
export function presentarEstadoMembresia(membresia) {
  const estado = String(membresia?.estado || '').toUpperCase();
  const normal = { chip: CHIP[estado] || 'cerrado', label: ETIQUETAS[estado] || estado };
  if (!esPaseDiario(membresia) || ['CANCELADA', 'CONGELADA'].includes(estado)) return normal;

  const hoy = hoyEcuador();
  if (membresia.vigencia_fin && String(membresia.vigencia_fin).slice(0, 10) < hoy) return { chip: 'cerrado', label: 'Vigencia terminada' };
  const inicio = String(membresia.fecha_inicio || '').slice(0, 10);
  const fin = String(membresia.fecha_fin || '').slice(0, 10);
  if (estado === 'ACTIVA' && inicio <= hoy && fin >= hoy) return { chip: 'activo', label: 'Vigente hoy' };
  if (estado === 'PENDIENTE_PAGO' && fin >= hoy) return normal;
  return { chip: 'pendiente', label: 'Disponible' };
}

/** Vigencia del pase; los pases asignados antes de existir este dato no tienen límite. */
export function textoVigenciaPase(membresia, formato) {
  if (!membresia?.vigencia_fin) return 'Sin límite';
  const inicio = membresia.vigencia_inicio ? formato(String(membresia.vigencia_inicio).slice(0, 10)) : null;
  return [inicio, formato(String(membresia.vigencia_fin).slice(0, 10))].filter(Boolean).join(' – ');
}

/** Un contrato cerrado no se edita; el pase sigue editable mientras no esté cancelado. */
export function membresiaEditable(membresia) {
  const estado = String(membresia?.estado || '').toUpperCase();
  if (estado === 'CANCELADA') return false;
  return estado !== 'VENCIDA' || esPaseDiario(membresia);
}
