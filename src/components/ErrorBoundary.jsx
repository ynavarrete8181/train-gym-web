import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("Error no controlado en la aplicacion:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error, errorInfo } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <main className="app-error-boundary">
        <section className="app-error-boundary__panel">
          <p className="app-error-boundary__eyebrow">Error de la aplicacion</p>
          <h1>La pantalla no pudo continuar</h1>
          <p>
            Ocurrio un error al ejecutar esta accion. Recarga la pantalla y revisa la consola del
            navegador o el log de Android para ver el detalle.
          </p>
          <pre>{String(error?.message || error)}</pre>
          {errorInfo?.componentStack ? <pre>{errorInfo.componentStack}</pre> : null}
          <button type="button" onClick={this.handleReload}>
            Recargar
          </button>
        </section>
      </main>
    );
  }
}
