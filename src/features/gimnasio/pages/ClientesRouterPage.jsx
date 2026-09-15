import { DeportistasPage } from './DeportistasPage.jsx';
import { ClientesSupervisorPage } from './ClientesSupervisorPage.jsx';

const obtenerRolActual = () => {
  try {
    const usuario = JSON.parse(localStorage.getItem('base_usuario') || 'null');
    return usuario?.rol_nombre || '';
  } catch {
    return '';
  }
};

export function ClientesRouterPage() {
  const rol = obtenerRolActual();

  if (rol === 'SUPERVISOR DE VENTAS') {
    return <ClientesSupervisorPage />;
  }

  return <DeportistasPage />;
}
