export const dinero = (valor) => `$${Number(valor || 0).toFixed(2)}`;

export const fecha = (valor) => (
  valor
    ? new Date(`${String(valor).slice(0, 10)}T00:00:00`).toLocaleDateString('es-EC')
    : '—'
);

export const fechaHora = (valor) => (
  valor ? new Date(valor).toLocaleString('es-EC') : '—'
);

export const estadoVisualCartera = (estado) => {
  const valor = String(estado || '').toUpperCase();

  if (valor === 'VENCIDA') return 'bloqueado';
  if (valor === 'PARCIAL') return 'riesgo';
  if (valor === 'PAGADA') return 'activo';
  if (valor === 'ANULADA') return 'cerrado';
  return 'pendiente';
};

export const cuentaCerrada = (estado) => ['PAGADA', 'ANULADA'].includes(
  String(estado || '').toUpperCase(),
);
