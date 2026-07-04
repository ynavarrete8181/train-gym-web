import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import ModalDetalleAsignacion from "./ModalDetalleAsignacion";
import AsignacionesListas from "./AsignacionesListas";
import AsignacionesFormularios from "./AsignacionesFormularios";
import axiosClient from "../../../../../axios/axios_client";

const IndexAsignaciones = () => {
  const [loading, setLoading] = useState(true);
  const [prefetch, setPrefetch] = useState({});
  const [resumen, setResumen] = useState({ total: 0, medicamentos_insumos: 0, bienes_suministros: 0 });
  const [rows, setRows] = useState([]);
  const [modoVista, setModoVista] = useState("list");
  const [tipoFlujoModal, setTipoFlujoModal] = useState("medicamentos_insumos");
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [detalleAsignacion, setDetalleAsignacion] = useState(null);
  const [textoFiltro, setTextoFiltro] = useState("");
  const [flujoFiltro, setFlujoFiltro] = useState("todos");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const cargarBase = async () => {
    setLoading(true);
    try {
      const [prefetchRes, listadoRes] = await Promise.all([
        axiosClient.get("/inventario/asignaciones/prefetch").then((response) => response.data),
        axiosClient.get("/inventario/asignaciones").then((response) => response.data),
      ]);

      setPrefetch(prefetchRes || {});
      setRows(Array.isArray(listadoRes?.data) ? listadoRes.data : []);
      setResumen(listadoRes?.summary || { total: 0, medicamentos_insumos: 0, bienes_suministros: 0 });
    } catch (error) {
      Swal.fire("Error", "No se pudo cargar la base del módulo de asignaciones.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBase();
  }, []);

  const handleBuscarReceptor = useCallback(async (cedula) => {
    const value = String(cedula || "").trim();
    if (!value) {
      return { persona: null, asignaciones: [] };
    }

    const { data: response } = await axiosClient.get("/inventario/asignaciones/buscar-receptor", {
      params: { cedula: value },
    });
    return {
      persona: response?.persona || null,
      asignaciones: Array.isArray(response?.asignaciones) ? response.asignaciones : [],
    };
  }, []);

  const handleBuscarProductos = useCallback(async (params) => {
    setLoadingProductos(true);
    try {
      const { data: response } = await axiosClient.get("/inventario/asignaciones/buscar-productos", {
        params,
      });
      setProductosDisponibles(Array.isArray(response) ? response : []);
    } catch (error) {
      setProductosDisponibles([]);
      Swal.fire("Error", "No se pudieron consultar los productos disponibles.", "error");
    } finally {
      setLoadingProductos(false);
    }
  }, []);

  const handleGuardarAsignacion = useCallback(async ({ receptor, form, items }) => {
    const payload = {
      persona_destino_id: receptor?.id,
      tipo_flujo: form.tipo_flujo,
      tipo_destino: form.tipo_destino,
      sede_origen_id: Number(form.sede_origen_id),
      facultad_origen_id: Number(form.facultad_origen_id),
      bodega_origen_id: Number(form.bodega_origen_id),
      sede_destino_id: Number(form.sede_destino_id),
      facultad_destino_id: Number(form.facultad_destino_id),
      bodega_destino_id: Number(form.bodega_destino_id),
      observacion: form.observacion || null,
      items: items.map((item) => {
        const producto = productosDisponibles.find((row) => Number(row.id) === Number(item.producto_id));
        return {
          producto_id: item.producto_id,
          producto: item.producto,
          cantidad: item.cantidad,
          stock_total: Number(producto?.stock_bodega ?? 0),
          stock_util: Number(producto?.stock_util ?? producto?.stock_bodega ?? 0),
          proximo_vencimiento_vigente: producto?.proximo_vencimiento_vigente || null,
        };
      }),
    };

    const { data: response } = await axiosClient.post("/inventario/asignaciones", payload);
    await cargarBase();
    setModoVista("list");
    setProductosDisponibles([]);

    Swal.fire({
      icon: "success",
      title: "Asignación guardada",
      text: response?.message || "La asignación se registró correctamente."
    });
  }, [productosDisponibles]);

  const handleVerDetalle = useCallback(async (id) => {
    setLoadingDetalle(true);
    setOpenDetalle(true);

    try {
      const { data: response } = await axiosClient.get(`/inventario/asignaciones/${id}`);
      setDetalleAsignacion(response || null);
    } catch (error) {
      setOpenDetalle(false);
      setDetalleAsignacion(null);
      Swal.fire("Error", "No se pudo cargar el detalle de la asignación.", "error");
    } finally {
      setLoadingDetalle(false);
    }
  }, []);

  const chipsResumen = useMemo(
    () => [
      { label: `${resumen.total || 0} MOVIMIENTOS`, tone: "default" },
      { label: `${resumen.medicamentos_insumos || 0} MED./INSUMOS`, tone: "success" },
      { label: `${resumen.bienes_suministros || 0} BIENES/SUMINISTROS`, tone: "primary" },
    ],
    [resumen]
  );

  const rowsFiltradas = useMemo(() => {
    const term = String(textoFiltro || "").trim().toLowerCase();

    return (Array.isArray(rows) ? rows : []).filter((row) => {
      if (flujoFiltro !== "todos" && String(row?.tipo || "").toLowerCase() !== flujoFiltro) {
        return false;
      }

      if (!term) return true;

      return [
        row?.fecha,
        row?.tipo,
        row?.origen,
        row?.destino,
        row?.responsable,
        row?.detalle,
        row?.cedula,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ")
        .includes(term);
    });
  }, [rows, textoFiltro, flujoFiltro]);

  const rowsPaginadas = useMemo(() => {
    const inicio = page * rowsPerPage;
    return rowsFiltradas.slice(inicio, inicio + rowsPerPage);
  }, [rowsFiltradas, page, rowsPerPage]);

  if (modoVista === "create") {
    return (
      <>
        <AsignacionesFormularios
          onVolver={() => {
            setModoVista("list");
            setProductosDisponibles([]);
          }}
          onBuscarProductos={handleBuscarProductos}
          onBuscarReceptor={handleBuscarReceptor}
          onGuardar={handleGuardarAsignacion}
          loadingProductos={loadingProductos}
          productosBase={productosDisponibles}
          prefetch={prefetch}
          initialTipoFlujo={tipoFlujoModal}
        />
        <ModalDetalleAsignacion
          open={openDetalle}
          onClose={() => {
            setOpenDetalle(false);
            setDetalleAsignacion(null);
          }}
          data={detalleAsignacion}
          loading={loadingDetalle}
        />
      </>
    );
  }

  return (
    <>
      <AsignacionesListas
        chipsResumen={chipsResumen}
        loading={loading}
        textoFiltro={textoFiltro}
        onTextoFiltroChange={(e) => {
          setTextoFiltro(e.target.value);
          setPage(0);
        }}
        flujoFiltro={flujoFiltro}
        onFlujoFiltroChange={(e) => {
          setFlujoFiltro(e.target.value);
          setPage(0);
        }}
        onRecargar={cargarBase}
        onNuevaAsignacion={() => {
          setTipoFlujoModal("medicamentos_insumos");
          setModoVista("create");
        }}
        rowsFiltradas={rowsFiltradas}
        rowsPaginadas={rowsPaginadas}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        onVerDetalle={handleVerDetalle}
      />
      <ModalDetalleAsignacion
        open={openDetalle}
        onClose={() => {
          setOpenDetalle(false);
          setDetalleAsignacion(null);
        }}
        data={detalleAsignacion}
        loading={loadingDetalle}
      />
    </>
  );
};

export default IndexAsignaciones;
