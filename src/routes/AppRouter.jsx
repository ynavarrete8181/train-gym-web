import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import Horarios from "../pages/Horarios/Horarios";
import CategoriaServicio from "../pages/Servicios/CategoriaServicioGym";
import Servicio from "../pages/Servicios/ServicioGym";
import Producto from "../pages/Inventarios/Productos/Productos";
import MovimientosInventario from "../pages/Inventarios/Movimientos/Movimientos";
import EntradasInventario from "../pages/Inventarios/Entradas/Entradas";
import SalidasInventario from "../pages/Inventarios/Salidas/Salidas";
import AjustesBajasInventario from "../pages/Inventarios/AjustesBajas/AjustesBajas";
import TransferenciasInventario from "../pages/Inventarios/Transferencias/Transferencias";
import PreciosProductos from "../pages/Inventarios/Precios/Precios";
import ProveedoresInventario from "../pages/Inventarios/Proveedores/Proveedores";
import ComprasInventario from "../pages/Inventarios/Compras/Compras";
import PuntoVenta from "../pages/Ventas/PuntoVenta";
import VentasRealizadas from "../pages/Ventas/VentasRealizadas";
import CierreCaja from "../pages/Ventas/CierreCaja";
import DevolucionesVentas from "../pages/Ventas/Devoluciones";
import Personas from "../modules/personas/Personas";
import MembresiasPanel from "../modules/personas/components/MembresiasPanel";
import AsignacionMembresiasPanel from "../modules/personas/components/AsignacionMembresiasPanel";
import Ejercicios from "../modules/ejercicios/Ejercicios";
import PlanesEntrenamiento from "../pages/Entrenamiento/PlanesEntrenamiento/PlanesEntrenamiento";
import AsignacionesPlanEntrenamiento from "../pages/Entrenamiento/PlanesEntrenamiento/AsignacionesPlanEntrenamiento";
import Ejecucion from "../modules/ejecucion/Ejecucion";
import ReportesEvolucion from "../modules/reportes/ReportesEvolucion";
import ReportesAdherencia from "../modules/reportes/ReportesAdherencia";
import ReportesAlertas from "../modules/reportes/ReportesAlertas";
import ReportesPremium from "../modules/reportes/ReportesPremium";
import ReportesOperativos from "../modules/reportes/ReportesOperativos";
import Usuarios from "../modules/usuarios/Usuarios";
import Auditoria from "../modules/auditoria/Auditoria";
import LogsSistema from "../modules/logs/LogsSistema";
import Notificaciones from "../modules/notificaciones/Notificaciones";
import CumpleanosConfig from "../modules/notificaciones/CumpleanosConfig";
import CheckIn from "../pages/Acceso/CheckIn";
import Staff from "../modules/staff/Staff";
import ReservasDiarias from "../modules/reservas/ReservasDiarias";
import RegistroRm from "../modules/entrenamiento/rm/RegistroRm";
import FichasGenerales from "../modules/entrenamiento/fichas/FichasGenerales";
import EvaluacionesFuncionales from "../modules/entrenamiento/evaluaciones/EvaluacionesFuncionales";
import ConfiguracionPlanEntrenamiento from "../pages/Entrenamiento/ConfiguracionPlanEntrenamiento/ConfiguracionPlanEntrenamiento";
import PizarraPlanEntrenamiento from "../pages/Entrenamiento/PizarraPlanEntrenamiento/PizarraPlanEntrenamiento";
import AccesoPizarraPlanEntrenamiento from "../pages/Entrenamiento/PizarraPlanEntrenamiento/AccesoPizarraPlanEntrenamiento";
import EjercicioAnimacionDemo from "../pages/Entrenamiento/EjercicioAnimacionDemo/EjercicioAnimacionDemo";
export default function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route
                path="/entrenamiento/planes/:id/pizarra/acceso"
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<AccesoPizarraPlanEntrenamiento />} />
            </Route>

            <Route
                path="/entrenamiento/planes/:id/pizarra"
                element={
                    <ProtectedRoute>
                        <PizarraPlanEntrenamiento />
                    </ProtectedRoute>
                }
            />

            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Dashboard />} />
                <Route path="/notificaciones" element={<Notificaciones />} />
                <Route path="/gimnasio/notificaciones" element={<Navigate to="/notificaciones" replace />} />
                <Route path="/comunicaciones" element={<Navigate to="/comunicaciones/cumpleanos" replace />} />
                <Route path="/comunicaciones/notificaciones" element={<Notificaciones />} />
                <Route path="/comunicaciones/cumpleanos" element={<CumpleanosConfig />} />
                <Route path="/comunicaciones/plantillas" element={<CumpleanosConfig vista="plantillas" />} />
                <Route path="/comunicaciones/historial" element={<CumpleanosConfig vista="historial" />} />
                <Route path="/comunicaciones/reenvios" element={<CumpleanosConfig vista="reenvios" />} />
                <Route path="/gimnasio/horario" element={<Horarios />} />
                <Route path="/gimnasio/categoria-servicio" element={<CategoriaServicio />} />
                <Route path="/gimnasio/servicio" element={<Servicio />} />
                <Route path="/gimnasio/reservas" element={<ReservasDiarias />} />
                <Route path="/staff/equipo" element={<Staff vista="perfiles" />} />
                <Route path="/staff/turnos" element={<Staff vista="turnos" />} />
                <Route path="/staff/clientes" element={<Staff vista="clientes" />} />
                <Route path="/staff/mis-clientes" element={<Staff vista="seguimiento" />} />
                <Route path="/inventario/producto" element={<Producto />} />
                <Route path="/inventario/entradas" element={<EntradasInventario />} />
                <Route path="/inventario/salidas" element={<SalidasInventario />} />
                <Route path="/inventario/ajustes-bajas" element={<AjustesBajasInventario />} />
                <Route path="/inventario/kardex" element={<MovimientosInventario />} />
                <Route path="/inventario/movimientos" element={<MovimientosInventario />} />
                <Route path="/inventario/transferencias" element={<TransferenciasInventario />} />
                <Route path="/inventario/proveedores" element={<ProveedoresInventario />} />
                <Route path="/inventario/compras" element={<ComprasInventario />} />
                <Route path="/inventario/precios" element={<PreciosProductos />} />

                <Route path="/gimnasio/producto" element={<Navigate to="/inventario/producto" replace />} />
                <Route path="/gimnasio/inventario-entradas" element={<Navigate to="/inventario/entradas" replace />} />
                <Route path="/gimnasio/inventario-salidas" element={<Navigate to="/inventario/salidas" replace />} />
                <Route path="/gimnasio/inventario-ajustes-bajas" element={<Navigate to="/inventario/ajustes-bajas" replace />} />
                <Route path="/gimnasio/inventario-kardex" element={<Navigate to="/inventario/kardex" replace />} />
                <Route path="/gimnasio/inventario-movimientos" element={<Navigate to="/inventario/movimientos" replace />} />
                <Route path="/gimnasio/inventario-transferencias" element={<Navigate to="/inventario/transferencias" replace />} />
                <Route path="/gimnasio/inventario-proveedores" element={<Navigate to="/inventario/proveedores" replace />} />
                <Route path="/gimnasio/inventario-compras" element={<Navigate to="/inventario/compras" replace />} />
                <Route path="/gimnasio/inventario-precios" element={<Navigate to="/inventario/precios" replace />} />
                <Route path="/gimnasio/ventas-punto-venta" element={<PuntoVenta />} />
                <Route path="/gimnasio/ventas-realizadas" element={<VentasRealizadas />} />
                <Route path="/gimnasio/ventas-cierre-caja" element={<CierreCaja />} />
                <Route path="/gimnasio/ventas-devoluciones" element={<DevolucionesVentas />} />
                <Route path="/gimnasio/clientes" element={<Personas />} />
                <Route path="/gimnasio/personas" element={<Navigate to="/gimnasio/clientes" replace />} />
                <Route path="/gimnasio/clientes/directorio" element={<Navigate to="/gimnasio/clientes" replace />} />
                <Route path="/gimnasio/clientes/socios" element={<Navigate to="/gimnasio/clientes" replace />} />
                <Route path="/gimnasio/clientes/ficha-fisica" element={<Navigate to="/gimnasio/clientes" replace />} />
                <Route path="/gimnasio/membresias" element={<MembresiasPanel />} />
                <Route path="/gimnasio/asignacion-membresias" element={<AsignacionMembresiasPanel />} />
                <Route path="/gimnasio/clientes/cumpleanos" element={<Navigate to="/comunicaciones/cumpleanos" replace />} />
                <Route path="/gimnasio/check-in" element={<CheckIn />} />
                <Route path="/gimnasio/clientes/membresias" element={<Navigate to="/gimnasio/membresias" replace />} />
                <Route path="/entrenamiento/ejercicios" element={<Ejercicios />} />
                <Route path="/entrenamiento/ejercicios/demo-animacion" element={<EjercicioAnimacionDemo />} />
                <Route path="/entrenamiento/evaluaciones" element={<EvaluacionesFuncionales />} />
                <Route path="/entrenamiento/fichas" element={<FichasGenerales />} />
                <Route path="/entrenamiento/rm" element={<RegistroRm />} />
                <Route path="/entrenamiento/planes" element={<PlanesEntrenamiento />} />
                <Route path="/entrenamiento/planes/:id/asignaciones" element={<AsignacionesPlanEntrenamiento />} />
                <Route path="/entrenamiento/planes/:id/configuracion" element={<ConfiguracionPlanEntrenamiento />} />
                <Route path="/entrenamiento/ejecucion" element={<Ejecucion />} />
                <Route path="/entrenamiento/reportes" element={<Navigate to="/reportes/evolucion" replace />} />
                <Route path="/reportes/evolucion" element={<ReportesEvolucion />} />
                <Route path="/reportes/adherencia" element={<ReportesAdherencia />} />
                <Route path="/reportes/alertas" element={<ReportesAlertas />} />
                <Route path="/reportes/premium" element={<ReportesPremium />} />
                <Route path="/reportes/asistencias" element={<ReportesOperativos tipo="asistencias" />} />
                <Route path="/reportes/membresias" element={<ReportesOperativos tipo="membresias" />} />
                <Route path="/reportes/reservas" element={<ReportesOperativos tipo="reservas" />} />
                <Route path="/reportes/coaches" element={<ReportesOperativos tipo="coaches" />} />
                <Route path="/reportes/ventas" element={<ReportesOperativos tipo="ventas" />} />
                <Route path="/reportes/auditoria" element={<ReportesOperativos tipo="auditoria" />} />
                <Route path="/reportes/logs" element={<ReportesOperativos tipo="logs" />} />
                <Route path="/seguridad/usuarios" element={<Usuarios />} />
                <Route path="/auditoria/eventos" element={<Auditoria />} />
                <Route path="/auditoria/logs" element={<LogsSistema />} />
                <Route path="/seguridad/auditoria" element={<Navigate to="/auditoria/eventos" replace />} />
                <Route path="/seguridad/logs" element={<Navigate to="/auditoria/logs" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
