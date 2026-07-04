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
import Usuarios from "../modules/usuarios/Usuarios";
import Auditoria from "../modules/auditoria/Auditoria";
import RegistroRm from "../modules/entrenamiento/rm/RegistroRm";
import FichasGenerales from "../modules/entrenamiento/fichas/FichasGenerales";
import EvaluacionesFuncionales from "../modules/entrenamiento/evaluaciones/EvaluacionesFuncionales";
import ConfiguracionPlanEntrenamiento from "../pages/Entrenamiento/ConfiguracionPlanEntrenamiento/ConfiguracionPlanEntrenamiento";
import PizarraPlanEntrenamiento from "../pages/Entrenamiento/PizarraPlanEntrenamiento/PizarraPlanEntrenamiento";
import AccesoPizarraPlanEntrenamiento from "../pages/Entrenamiento/PizarraPlanEntrenamiento/AccesoPizarraPlanEntrenamiento";
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
                <Route path="/gimnasio/horario" element={<Horarios />} />
                <Route path="/gimnasio/categoria-servicio" element={<CategoriaServicio />} />
                <Route path="/gimnasio/servicio" element={<Servicio />} />
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
                <Route path="/gimnasio/clientes/membresias" element={<Navigate to="/gimnasio/membresias" replace />} />
                <Route path="/entrenamiento/ejercicios" element={<Ejercicios />} />
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
                <Route path="/seguridad/usuarios" element={<Usuarios />} />
                <Route path="/seguridad/auditoria" element={<Auditoria />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
