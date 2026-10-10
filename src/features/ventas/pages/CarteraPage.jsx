import { useEffect, useState } from 'react';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import { Box, Paper } from '@mui/material';
import { NotificacionSnackbar } from '../../../components/common/NotificacionSnackbar.jsx';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { GestionToolbar } from '../../../components/tables/GestionToolbar.jsx';
import { CarteraResumen } from '../components/cartera/CarteraResumen.jsx';
import { CarteraTabla } from '../components/cartera/CarteraTabla.jsx';
import { GestionCarteraDialog } from '../components/cartera/GestionCarteraDialog.jsx';
import { VentaPosFormulario } from '../components/VentaPosFormulario.jsx';
import { carteraServicio } from '../services/carteraServicio.js';
import { ventaServicio } from '../services/ventaServicio.js';

const FORM_CUENTA_INICIAL = {
  fecha_vencimiento: '',
  prioridad: 'NORMAL',
  responsable_id: '',
  observaciones: '',
};

const FORM_GESTION_INICIAL = {
  tipo: 'LLAMADA',
  resultado: 'CONTACTADO',
  detalle: '',
  proxima_gestion_at: '',
};

const FORM_COMPROMISO_INICIAL = {
  monto: '',
  fecha_compromiso: '',
  observaciones: '',
};

export function CarteraPage() {
  const [vista, setVista] = useState('lista');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [filtros, setFiltros] = useState({ busqueda: '', page: 1, per_page: 10 });
  const [filtrosColumna, setFiltrosColumna] = useState({
    sede_id: [],
    venta_numero: '',
    cliente: '',
    vencimiento: '',
    total: '',
    pagado: '',
    saldo: '',
    responsable_id: [],
    prioridad: [],
    estado: [],
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [turnoActual, setTurnoActual] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [ventaInicial, setVentaInicial] = useState(null);
  const [formCuenta, setFormCuenta] = useState(FORM_CUENTA_INICIAL);
  const [formGestion, setFormGestion] = useState(FORM_GESTION_INICIAL);
  const [formCompromiso, setFormCompromiso] = useState(FORM_COMPROMISO_INICIAL);
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: 'info' });

  const resumen = meta.resumen || {};
  const catalogos = meta.catalogos || {};

  const notificar = (mensaje, tipo = 'info') => {
    setNotificacion({ mensaje, tipo });
  };

  const cargar = async (params = filtros) => {
    setCargando(true);
    try {
      const [response, turno] = await Promise.all([
        carteraServicio.listar(params),
        ventaServicio.obtenerTurnoCajaActual().catch(() => ({ datos: null })),
      ]);

      setItems(response.datos || []);
      setMeta(response.meta || {});
      setTurnoActual(turno?.datos || null);
    } catch (error) {
      notificar(error.response?.data?.mensaje || 'No se pudo cargar la cartera.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const aplicarBusqueda = (cambios) => {
    const nuevos = { ...filtros, ...cambios, page: 1 };
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const aplicarFiltroColumna = (columna, valor) => {
    const nuevosFiltrosColumna = { ...filtrosColumna, [columna]: valor };
    const nuevos = { ...filtros, ...nuevosFiltrosColumna, [columna]: valor, page: 1 };
    setFiltrosColumna(nuevosFiltrosColumna);
    setFiltros(nuevos);
    cargar(nuevos);
  };

  const cargarDetalle = async (id) => {
    const response = await carteraServicio.detalle(id);
    const datos = response.datos || response;
    setDetalle(datos);
    return datos;
  };

  const abrirGestion = async (item) => {
    try {
      const datos = await cargarDetalle(item.id);

      setFormCuenta({
        fecha_vencimiento: String(datos.fecha_vencimiento || '').slice(0, 10),
        prioridad: datos.prioridad || 'NORMAL',
        responsable_id: datos.responsable_id || '',
        observaciones: datos.observaciones || '',
      });
      setFormGestion(FORM_GESTION_INICIAL);
      setFormCompromiso(FORM_COMPROMISO_INICIAL);
      setDialogoAbierto(true);
    } catch (error) {
      notificar(error.response?.data?.mensaje || 'No se pudo cargar el detalle de cartera.', 'error');
    }
  };

  const refrescarDetalleYLista = async () => {
    if (detalle?.id) {
      await cargarDetalle(detalle.id);
    }
    await cargar();
  };

  const guardarSeguimiento = async () => {
    if (!detalle?.id) return;

    setGuardando(true);
    try {
      await carteraServicio.actualizar(detalle.id, {
        fecha_vencimiento: formCuenta.fecha_vencimiento,
        prioridad: formCuenta.prioridad,
        responsable_id: formCuenta.responsable_id ? Number(formCuenta.responsable_id) : null,
        observaciones: formCuenta.observaciones || null,
      });

      await refrescarDetalleYLista();
      notificar('Cuenta de cartera actualizada.', 'success');
    } catch (error) {
      notificar(error.response?.data?.mensaje || 'No se pudo actualizar la cuenta.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const registrarGestion = async () => {
    if (!detalle?.id) return;

    if (!formGestion.detalle.trim()) {
      notificar('Ingresa el detalle de la gestión.', 'warning');
      return;
    }

    setGuardando(true);
    try {
      await carteraServicio.registrarGestion(detalle.id, {
        tipo: formGestion.tipo,
        resultado: formGestion.resultado || null,
        detalle: formGestion.detalle,
        proxima_gestion_at: formGestion.proxima_gestion_at || null,
      });

      setFormGestion(FORM_GESTION_INICIAL);
      await refrescarDetalleYLista();
      notificar('Gestión registrada correctamente.', 'success');
    } catch (error) {
      notificar(error.response?.data?.mensaje || 'No se pudo registrar la gestión.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const registrarCompromiso = async () => {
    if (!detalle?.id) return;

    if (!formCompromiso.monto || !formCompromiso.fecha_compromiso) {
      notificar('Completa monto y fecha del compromiso.', 'warning');
      return;
    }

    setGuardando(true);
    try {
      await carteraServicio.registrarCompromiso(detalle.id, {
        monto: Number(formCompromiso.monto),
        fecha_compromiso: formCompromiso.fecha_compromiso,
        observaciones: formCompromiso.observaciones || null,
      });

      setFormCompromiso(FORM_COMPROMISO_INICIAL);
      await refrescarDetalleYLista();
      notificar('Compromiso de pago registrado.', 'success');
    } catch (error) {
      const errores = error.response?.data?.errors;
      const primero = errores ? Object.values(errores).flat()[0] : null;
      notificar(
        primero || error.response?.data?.mensaje || 'No se pudo registrar el compromiso.',
        'error',
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirCobro = async (item) => {
    if (!turnoActual?.id) {
      notificar('Para cobrar esta cuenta necesitas un turno de caja propio abierto.', 'warning');
      return;
    }

    try {
      const response = await ventaServicio.obtenerDetalleVenta(item.venta_id);
      setVentaInicial(response.datos || response);
      setDialogoAbierto(false);
      setVista('cobro');
    } catch (error) {
      notificar(error.response?.data?.mensaje || 'No se pudo abrir la venta para cobrar.', 'error');
    }
  };

  if (vista === 'cobro' && ventaInicial) {
    return (
      <VentaPosFormulario
        ventaInicial={ventaInicial}
        onVolver={() => {
          setVentaInicial(null);
          setVista('lista');
        }}
        onGuardado={() => {
          setVentaInicial(null);
          setVista('lista');
          cargar();
        }}
      />
    );
  }

  return (
    <Box className="page-wrapper">
      <PageHeader
        titulo="Cartera"
        descripcion="Seguimiento de cuentas por cobrar, vencimientos, gestiones y compromisos de pago."
        icono={<AccountBalanceWalletOutlinedIcon />}
      />

      <Paper className="page-content-container" elevation={0}>
        <GestionToolbar
          total={meta.total || 0}
          busqueda={filtros.busqueda}
          onBusqueda={(valor) => aplicarBusqueda({ busqueda: valor })}
          resumen={<CarteraResumen resumen={resumen} />}
        />

        <CarteraTabla
          items={items}
          meta={meta}
          cargando={cargando}
          turnoActual={turnoActual}
          filtrosColumna={filtrosColumna}
          onFiltroColumna={aplicarFiltroColumna}
          onGestionar={abrirGestion}
          onCobrar={abrirCobro}
          onPageChange={(page) => {
            const nuevos = { ...filtros, page };
            setFiltros(nuevos);
            cargar(nuevos);
          }}
          onRowsPerPageChange={(perPage) => {
            const nuevos = { ...filtros, page: 1, per_page: perPage };
            setFiltros(nuevos);
            cargar(nuevos);
          }}
        />
      </Paper>

      <GestionCarteraDialog
        open={dialogoAbierto}
        detalle={detalle}
        catalogos={catalogos}
        guardando={guardando}
        turnoActual={turnoActual}
        formCuenta={formCuenta}
        setFormCuenta={setFormCuenta}
        formGestion={formGestion}
        setFormGestion={setFormGestion}
        formCompromiso={formCompromiso}
        setFormCompromiso={setFormCompromiso}
        onCerrar={() => setDialogoAbierto(false)}
        onGuardarCuenta={guardarSeguimiento}
        onRegistrarGestion={registrarGestion}
        onRegistrarCompromiso={registrarCompromiso}
        onCobrar={abrirCobro}
      />

      <NotificacionSnackbar
        mensaje={notificacion.mensaje}
        tipo={notificacion.tipo}
        onClose={() => setNotificacion((actual) => ({ ...actual, mensaje: '' }))}
      />
    </Box>
  );
}
