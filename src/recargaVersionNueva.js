// Tras un despliegue, una pestaña abierta con la versión anterior pide archivos que ya
// no existen y la importación falla. En ese caso se recarga una sola vez para tomar
// la versión nueva; la marca evita un ciclo si el problema fuera otro.
const CLAVE = 'revive_recarga_version';
const ESPERA_MS = 30_000;

export function esErrorDeVersion(error) {
  const texto = String(error?.message || error || '');
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i.test(texto);
}

export function recargarPorVersionNueva() {
  let ultima = 0;
  try { ultima = Number(sessionStorage.getItem(CLAVE) || 0); } catch { /* sin almacenamiento */ }
  if (Date.now() - ultima < ESPERA_MS) return false;
  try { sessionStorage.setItem(CLAVE, String(Date.now())); } catch { /* sin almacenamiento */ }
  window.location.reload();
  return true;
}

export function escucharVersionNueva() {
  window.addEventListener('vite:preloadError', (evento) => {
    if (recargarPorVersionNueva()) evento.preventDefault();
  });
}
