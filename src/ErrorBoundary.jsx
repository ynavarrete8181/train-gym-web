import React from 'react';
import { esErrorDeVersion, recargarPorVersionNueva } from './recargaVersionNueva.js';
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Versión nueva publicada mientras la pestaña seguía abierta: recargar en vez de mostrar el error.
    if (esErrorDeVersion(error) && recargarPorVersionNueva()) return;
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      if (esErrorDeVersion(this.state.error)) {
        return (
          <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
            <p>Hay una versión nueva de Revive. Actualizando…</p>
            <button type="button" onClick={() => window.location.reload()}>Recargar ahora</button>
          </div>
        );
      }
      return (
        <div style={{ padding: 20, background: 'red', color: 'white', minHeight: '100vh', zIndex: 9999, position: 'relative' }}>
          <h1>Algo salió mal en React.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}
