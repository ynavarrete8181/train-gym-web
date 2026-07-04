import {
  Box,
  Chip,
  CircularProgress,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Pagination,
  Typography,
  Tooltip,
  Badge,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../../../../axios/axios_client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlusSquare,
  faEdit,
  faTrashAlt,
  faLayerGroup,
  faWarehouse,
} from "@fortawesome/free-solid-svg-icons";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Swal from "sweetalert2";
import CompInventarioInicial from "../../stock/indexInventariosIniciales";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

const ui = {
  primary: "#144985",
  primaryDark: "#0F3A6B",
  primarySoft: "#EEF4FB",
  primaryHeader: "#DCE8F7",
  primaryHeaderBorder: "#C7D8EE",
  success: "#2E7D32",
  successSoft: "#EAF7EE",
  successBorder: "#CFE7D4",
  successText: "#1F3B2D",
  border: "#D9E2F1",
  borderSoft: "#E8EEF7",
  muted: "#64748B",
};

const createInitialForm = (usr_id) => ({
  id_usuario: usr_id,
  "select-tipo": "",
  "txt-descripcion": "",
  "txt-codigo": "",
  "select-unidad-medida": "",
  "select-estado": 8,
  "txt-marca": "",
  "txt-modelo": "",
  "txt-serie": "",
  requiere_lote: false,
  requiere_vencimiento: false,
});

const Productos = ({ usr_id }) => {
  const [dataInsumos, setDataInsumos] = useState([]);
  const [filteredInsumos, setFilteredInsumos] = useState([]);

  const [openDialogInsumo, setOpenDialogInsumos] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState(null);
  const [page, setPage] = useState(1);

  const [dataCategoriaActivo, setDataCategoriaActivo] = useState([]);
  const [dataEstado, setDataEstado] = useState([]);

  const [rowsPerPage, setRowsPerPage] = useState(
    parseInt(localStorage.getItem("rowsPerPageKardex") || "10", 10)
  );

  const [formDataAgregarInsumos, setFormDataAgregarInsumos] = useState(
    createInitialForm(usr_id)
  );
  const [errors, setErrors] = useState({});

  const [loadingTable, setLoadingTable] = useState(false);
  const [savingInsumo, setSavingInsumo] = useState(false);

  const [openModalInventarioInicial, setOpenModalInventarioInicial] =
    useState(false);
  const [selectedInsumoId, setSelectedInsumoId] = useState(null);
  const [selectedInsumoData, setSelectedInsumoData] = useState(null);
  const [selectedIdTipo, setSelectedIdTipo] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("0");
  const [filterEstado, setFilterEstado] = useState("0");
  const [isActivo, setIsActivo] = useState(true);

  const escapeHtml = (s = "") =>
    String(s).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m]));

  const parseLotes = (raw) => {
    try {
      if (Array.isArray(raw)) return raw;
      if (typeof raw === "string" && raw.trim() !== "") return JSON.parse(raw);
      return [];
    } catch {
      return [];
    }
  };

  const toNumber = (value) => {
    const n = Number(value || 0);
    return Number.isNaN(n) ? 0 : n;
  };

  const formatQty = (value) =>
    toNumber(value).toLocaleString("es-EC", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("es-EC");
  };

  const fetchDataInsumos = () => {
    setLoadingTable(true);
    return axiosClient
      .get("/inventario/productos/catalogo")
      .then((response) => {
        const data = Array.isArray(response?.data)
          ? response.data
          : response?.data?.data || [];
        setDataInsumos(data);
        setFilteredInsumos(data);
      })
      .catch((error) => {
        setDataInsumos([]);
        setFilteredInsumos([]);
        Swal.fire("Error", `Hubo un problema: ${error.message}`, "error");
      })
      .finally(() => setLoadingTable(false));
  };

  useEffect(() => {
    fetchDataInsumos();
  }, []);

  const fetchDataCategoriaActivo = async () => {
    try {
      const response = await axiosClient.get("/inventario/categorias");
      const rows = Array.isArray(response?.data) ? response.data : response?.data?.data || [];
      const mapData = rows.map((item) => ({
        value: item.ca_id,
        label: item.ca_descripcion,
      }));
      setDataCategoriaActivo(mapData);
    } catch (error) {
      Swal.fire(
        "¡Error!",
        "Error al cargar las Categorias de Activos",
        error.message
      );
    }
  };

  useEffect(() => {
    fetchDataCategoriaActivo();
  }, []);

  const fetchDataEstado = async () => {
    try {
      const response = await axiosClient.get("/consultar-estados");
      const data = Array.isArray(response?.data) ? response.data : [];
      const mapData = (data || []).map((item) => ({
        value: item.id,
        label: item.estado,
      }));
      setDataEstado(mapData);
    } catch (error) {
      Swal.fire("¡Error!", "Error al cargar los Estados", error.message);
    }
  };

  useEffect(() => {
    fetchDataEstado();
  }, []);

  useEffect(() => {
    let result = Array.isArray(dataInsumos) ? [...dataInsumos] : [];

    if (searchText.trim() !== "") {
      const value = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          (item.ins_descripcion || "").toLowerCase().includes(value) ||
          (item.codigo || "").toLowerCase().includes(value) ||
          (item.tipo_insumo || "").toLowerCase().includes(value) ||
          (item.nombre_estado || "").toLowerCase().includes(value)
      );
    }

    if (filterCategoria !== "0") {
      result = result.filter(
        (item) => String(item.id_tipo_insumo) === String(filterCategoria)
      );
    }

    if (filterEstado !== "0") {
      result = result.filter(
        (item) => String(item.id_estado) === String(filterEstado)
      );
    }

    setFilteredInsumos(result);
    setPage(1);
  }, [dataInsumos, searchText, filterCategoria, filterEstado]);

  const clearError = (key) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleAgregarNuevo = () => {
    setOpenDialogInsumos(true);
    setSelectedInsumo(null);
    setErrors({});
    setSelectedIdTipo(null);
    setIsActivo(true);
    setFormDataAgregarInsumos(createInitialForm(usr_id));
  };

  const handleCloseDialog = () => {
    setFormDataAgregarInsumos(createInitialForm(usr_id));
    setOpenDialogInsumos(false);
    setErrors({});
    setSelectedInsumo(null);
    setSelectedIdTipo(null);
    setIsActivo(true);
  };

  const validateFormInsumo = () => {
    const {
      "select-tipo": tipo,
      "txt-descripcion": descripcion,
      "txt-codigo": codigo,
      "select-unidad-medida": unidad,
      "select-estado": estado,
      "txt-marca": marca,
      "txt-modelo": modelo,
      "txt-serie": serie,
    } = formDataAgregarInsumos;

    let newErrors = {};

    if (!tipo || tipo === "0") {
      newErrors["select-tipo"] = "Debe seleccionar un tipo de insumo";
    }

    if (!descripcion || descripcion.trim() === "") {
      newErrors["txt-descripcion"] = "Debe ingresar la descripción";
    }

    if (!codigo || codigo.trim() === "") {
      newErrors["txt-codigo"] = "Debe ingresar el código";
    }

    if (!unidad || unidad === "0") {
      newErrors["select-unidad-medida"] =
        "Debe seleccionar una unidad de medida";
    }

    if (!estado || estado === "0") {
      newErrors["select-estado"] = "Debe seleccionar un estado";
    }

    if (Number(tipo) === 1) {
      if (!marca || marca.trim() === "") {
        newErrors["txt-marca"] = "Debe ingresar la marca";
      }
      if (!modelo || modelo.trim() === "") {
        newErrors["txt-modelo"] = "Debe ingresar el modelo";
      }
      if (!serie || serie.trim() === "") {
        newErrors["txt-serie"] = "Debe ingresar la serie";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuardarInsumos = async () => {
    if (!validateFormInsumo()) return;

    setSavingInsumo(true);
    try {
      const { data: response } = await axiosClient.post(
        "/inventario/productos/catalogo",
        formDataAgregarInsumos
      );

      if (response?.success) {
        Swal.fire({
          title: "¡Éxito!",
          text: response.message,
          icon: "success",
          backdrop: true,
          allowOutsideClick: false,
        });
        fetchDataInsumos();
        handleCloseDialog();
      } else if (response?.message?.includes("ya está registrado")) {
        setErrors((prev) => ({
          ...prev,
          "txt-codigo": response.message,
        }));
      } else {
        Swal.fire({
          title: "Atención",
          text: response?.message || "No se pudo guardar el producto.",
          icon: "warning",
          backdrop: true,
          allowOutsideClick: false,
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Hubo un problema: ${error.message}`,
        icon: "error",
        backdrop: true,
        allowOutsideClick: false,
      });
    } finally {
      setSavingInsumo(false);
    }
  };

  const handleEditarInsumo = (data) => {
    setErrors({});
    setSelectedInsumo(data);
    setIsActivo(Number(data.id_estado) === 8);
    setSelectedIdTipo(data.id_tipo_insumo);

    setFormDataAgregarInsumos({
      "select-tipo": data.id_tipo_insumo ?? "",
      "txt-codigo": data.codigo ?? "",
      "select-unidad-medida": data.unidad_medida ?? "",
      "select-estado": data.id_estado ?? 8,
      "txt-descripcion": data.ins_descripcion ?? "",
      id_usuario: usr_id,
      "txt-marca": data.marca ?? "",
      "txt-modelo": data.modelo ?? "",
      "txt-serie": data.serie ?? "",
      requiere_lote: Boolean(data.requiere_lote),
      requiere_vencimiento: Boolean(data.requiere_vencimiento),
    });

    setOpenDialogInsumos(true);
  };

  const handleModificarInsumo = async () => {
    if (!selectedInsumo) return;
    if (!validateFormInsumo()) return;

    setSavingInsumo(true);
    try {
      const { data: response } = await axiosClient.put(
        `/inventario/productos/catalogo/${selectedInsumo.id}`,
        formDataAgregarInsumos
      );

      if (response?.success) {
        Swal.fire({
          title: "¡Éxito!",
          text: response.message || "El producto se actualizó correctamente.",
          icon: "success",
          backdrop: true,
          allowOutsideClick: false,
        });
        fetchDataInsumos();
        handleCloseDialog();
      } else {
        Swal.fire({
          title: "Atención",
          text: response?.message || "No se pudo actualizar el producto.",
          icon: "warning",
          backdrop: true,
          allowOutsideClick: false,
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: `Hubo un problema: ${error.message}`,
        icon: "error",
        backdrop: true,
        allowOutsideClick: false,
      });
    } finally {
      setSavingInsumo(false);
    }
  };

  const paginatedData = useMemo(
    () =>
      Array.isArray(filteredInsumos)
        ? filteredInsumos.slice((page - 1) * rowsPerPage, page * rowsPerPage)
        : [],
    [filteredInsumos, page, rowsPerPage]
  );

  const handleChangeRowsPerPage = (event) => {
    const value = parseInt(event.target.value, 10);
    setRowsPerPage(value);
    localStorage.setItem("rowsPerPageKardex", value);
    setPage(1);
  };

  const handleOpenModalInventarioInicial = (insumo) => {
    setSelectedInsumoId(insumo.id);
    setSelectedInsumoData(insumo);
    setOpenModalInventarioInicial(true);
  };

  const handleCloseModalInventarioInicial = () => {
    setOpenModalInventarioInicial(false);
    setSelectedInsumoId(null);
    setSelectedInsumoData(null);
  };

  const handleEliminarProducto = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar producto?",
      text: "Esta acción quitará el producto del catálogo si no tiene movimientos ni stock relacionado.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#b91c1c",
    });

    if (!result.isConfirmed) return;

    try {
      const { data: response } = await axiosClient.delete(
        `/inventario/productos/catalogo/${id}`
      );

      if (response?.success) {
        Swal.fire("¡Éxito!", response.message || "Producto eliminado correctamente.", "success");
        fetchDataInsumos();
      } else {
        Swal.fire("Atención", response?.message || "No se pudo eliminar el producto.", "warning");
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error?.response?.data?.message || error?.message || "No se pudo eliminar el producto.",
        "error"
      );
    }
  };

  const handleExportExcel = () => {
    if (!Array.isArray(filteredInsumos) || filteredInsumos.length === 0) {
      Swal.fire("Sin datos", "No hay datos para exportar.", "info");
      return;
    }

    const dataToExport = filteredInsumos.map((item) => ({
      Id: item.id,
      Categoria: item.tipo_insumo,
      Código: item.codigo,
      Descripción: item.ins_descripcion,
      Marca: item.marca,
      Modelo: item.modelo,
      Serie: item.serie,
      "Requiere lote": item.requiere_lote ? "Sí" : "No",
      "Requiere vencimiento": item.requiere_vencimiento ? "Sí" : "No",
      "Stock total": item.stock_total ?? 0,
      "Total bodegas": item.total_bodegas ?? 0,
      "Total lotes": item.total_lotes ?? 0,
      "Próx. vencimiento": item.proximo_vencimiento ?? "-",
      Estado: item.nombre_estado,
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Insumos");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(blob, "catalogo_productos.xlsx");
  };

  const handleExportPDF = () => {
    if (!Array.isArray(filteredInsumos) || filteredInsumos.length === 0) {
      Swal.fire("Sin datos", "No hay datos para exportar.", "info");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    doc.setFontSize(14);
    doc.text("Catalogo de productos", 14, 12);

    const columns = [
      "Id",
      "Categoría",
      "Código",
      "Descripción",
      "Marca",
      "Modelo",
      "Serie",
      "Req. lote",
      "Req. venc.",
      "Stock total",
      "Bodegas",
      "Lotes",
      "Próx. venc.",
      "Estado",
    ];

    const rows = filteredInsumos.map((item) => [
      item.id,
      item.tipo_insumo,
      item.codigo,
      item.ins_descripcion,
      item.marca,
      item.modelo,
      item.serie,
      item.requiere_lote ? "Sí" : "No",
      item.requiere_vencimiento ? "Sí" : "No",
      item.stock_total ?? 0,
      item.total_bodegas ?? 0,
      item.total_lotes ?? 0,
      item.proximo_vencimiento ?? "-",
      item.nombre_estado,
    ]);

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 18,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [20, 73, 133] },
    });

    doc.save("catalogo_productos.pdf");
  };

  const handleViewLotesSwal = async (insumo) => {
    Swal.fire({
      title: "Cargando lotes...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const response = await axiosClient.get(
        `/inventario/stock/bodega-insumo/${insumo.id}`
      );
      const rows = Array.isArray(response?.data)
        ? response.data
        : response?.data?.data || [];

      if (rows.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Lotes",
          text: "Este insumo no tiene registros de stock por bodega.",
          confirmButtonText: "Cerrar",
        });
        return;
      }

      const totalStockGeneral = rows.reduce(
        (acc, row) => acc + toNumber(row.stock_bodega),
        0
      );

      const totalLotesGeneral = rows.reduce(
        (acc, row) => acc + toNumber(row.total_lotes),
        0
      );

      const stockEnLotesGeneral = rows.reduce(
        (acc, row) => acc + toNumber(row.stock_lotes),
        0
      );

      const lotesDetallados = rows.flatMap((row) => {
        const lotesRow = parseLotes(row.lotes);
        return lotesRow.map((lote) => ({
          ...lote,
          nombre_bodega: row.nombre_bodega,
          nombre_sede: row.nombre_sede,
          fac_nombre: row.fac_nombre,
        }));
      });

      const resumenBodegasHtml = rows
        .map(
          (row, index) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #eee;">${index + 1}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(
            row.nombre_sede ?? "-"
          )}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(
            row.fac_nombre ?? "-"
          )}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(
            row.nombre_bodega ?? "-"
          )}</td>
              <td style="padding:8px;border-bottom:1px solid #eee; text-align:right;">${formatQty(
            row.stock_bodega
          )}</td>
              <td style="padding:8px;border-bottom:1px solid #eee; text-align:right;">${formatQty(
            row.total_lotes
          )}</td>
              <td style="padding:8px;border-bottom:1px solid #eee; text-align:right;">${formatQty(
            row.stock_lotes
          )}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;">${formatDate(
            row.proximo_vencimiento
          )}</td>
            </tr>`
        )
        .join("");

      const detalleLotesHtml =
        lotesDetallados.length > 0
          ? lotesDetallados
            .map(
              (l, i) => `
                  <tr>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${i + 1}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(
                l.nombre_sede ?? "-"
              )}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(
                l.fac_nombre ?? "-"
              )}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(
                l.nombre_bodega ?? "-"
              )}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(
                l.codigo_lote ?? "-"
              )}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${formatDate(
                l.fecha_elaboracion
              )}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee;">${formatDate(
                l.fecha_vencimiento
              )}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee; text-align:right;">${formatQty(
                l.cantidad_inicial
              )}</td>
                    <td style="padding:8px;border-bottom:1px solid #eee; text-align:right;">${formatQty(
                l.cantidad_actual
              )}</td>
                  </tr>`
            )
            .join("")
          : `
            <tr>
              <td colspan="9" style="padding:10px;text-align:center;color:#666;">
                No se recibieron lotes detallados en este endpoint. 
                El detalle exacto por bodega se visualiza desde Inventario Inicial → botón "Ver lotes".
              </td>
            </tr>
          `;

      const html = `
        <div style="text-align:left">
          <div style="margin-bottom:12px;font-size:12px;color:#444;line-height:1.6;">
            <b>Insumo:</b> ${escapeHtml(insumo.ins_descripcion ?? "")}<br/>
            <b>Código:</b> ${escapeHtml(insumo.codigo ?? "")}<br/>
            <b>Control por lote:</b> ${insumo.requiere_lote ? "Sí" : "No"}<br/>
            <b>Control de vencimiento:</b> ${insumo.requiere_vencimiento ? "Sí" : "No"
        }<br/>
            <b>Total stock general:</b> ${formatQty(totalStockGeneral)}<br/>
            <b>Total lotes:</b> ${formatQty(totalLotesGeneral)}<br/>
            <b>Stock acumulado desde lotes:</b> ${formatQty(stockEnLotesGeneral)}<br/>
            <b>Total bodegas con stock:</b> ${rows.length}
          </div>

          <div style="margin-bottom:14px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
            <div style="padding:10px 12px;background:#f8fafc;font-weight:700;font-size:12px;">
              Resumen por bodega
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead style="background:#f3f4f6;">
                <tr>
                  <th style="padding:8px;text-align:left;">#</th>
                  <th style="padding:8px;text-align:left;">Sede</th>
                  <th style="padding:8px;text-align:left;">Facultad</th>
                  <th style="padding:8px;text-align:left;">Bodega</th>
                  <th style="padding:8px;text-align:right;">Stock</th>
                  <th style="padding:8px;text-align:right;">Lotes</th>
                  <th style="padding:8px;text-align:right;">Stock lotes</th>
                  <th style="padding:8px;text-align:left;">Próx. venc.</th>
                </tr>
              </thead>
              <tbody>
                ${resumenBodegasHtml}
              </tbody>
            </table>
          </div>

          <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
            <div style="padding:10px 12px;background:#f8fafc;font-weight:700;font-size:12px;">
              Detalle de lotes
            </div>
            <div style="max-height:280px;overflow:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead style="background:#f3f4f6;position:sticky;top:0;">
                  <tr>
                    <th style="padding:8px;text-align:left;">#</th>
                    <th style="padding:8px;text-align:left;">Sede</th>
                    <th style="padding:8px;text-align:left;">Facultad</th>
                    <th style="padding:8px;text-align:left;">Bodega</th>
                    <th style="padding:8px;text-align:left;">Código lote</th>
                    <th style="padding:8px;text-align:left;">Elaboración</th>
                    <th style="padding:8px;text-align:left;">Vencimiento</th>
                    <th style="padding:8px;text-align:right;">Cant. inicial</th>
                    <th style="padding:8px;text-align:right;">Cant. actual</th>
                  </tr>
                </thead>
                <tbody>
                  ${detalleLotesHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      Swal.fire({
        title: "Detalle general de lotes",
        html,
        width: 1200,
        confirmButtonText: "Cerrar",
        showCloseButton: true,
      });
    } catch (error) {
      Swal.fire("Error", "No se pudo obtener el detalle de lotes.", "error");
    }
  };

  return (
    <Box sx={{ maxWidth: "100%", margin: "auto", p: 2 }}>
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          bgcolor: "white",
          borderRadius: "16px",
          border: `1px solid ${ui.border}`,
          boxShadow: "0 12px 30px rgba(15,58,107,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              mr: 1.5,
              border: `1px solid rgba(20,73,133,.18)`,
              bgcolor: ui.primarySoft,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingCartIcon sx={{ color: ui.primary }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: ui.primaryDark }}>
              Catalogo de productos
            </Typography>
            <Typography sx={{ fontSize: 12, color: ui.muted }}>
              Gestión de productos, lotes y estado de inventario.
            </Typography>
          </Box>
          <Chip
            label={`${filteredInsumos.length} RESULTADOS`}
            size="small"
            sx={{
              ml: "auto",
              fontWeight: 800,
              color: ui.successText,
              bgcolor: ui.successSoft,
              border: `1px solid ${ui.successBorder}`,
            }}
            color="default"
            variant="outlined"
          />
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 3,
          bgcolor: "white",
          borderRadius: "16px",
          border: `1px solid ${ui.border}`,
          boxShadow: "0 12px 30px rgba(15,58,107,0.08)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            "& .MuiTextField-root": {
              "& label": { fontSize: "12px" },
              "& input": { fontSize: "12px" },
            },
            "& .MuiButton-root": {
              fontSize: "12px",
              minHeight: "28px",
              padding: "4px 12px",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <TextField
              label="Buscar"
              variant="outlined"
              size="small"
              sx={{ width: "200px", "& input": { fontSize: "12px" } }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon sx={{ fontSize: 16, color: ui.muted }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl sx={{ minWidth: 160 }} size="small">
              <InputLabel id="filter-categoria-label">Categoría</InputLabel>
              <Select
                labelId="filter-categoria-label"
                value={filterCategoria}
                label="Categoría"
                onChange={(e) => setFilterCategoria(e.target.value)}
                sx={{ fontSize: "12px" }}
              >
                <MenuItem value="0" sx={{ fontSize: "12px" }}>
                  Todas
                </MenuItem>
                {dataCategoriaActivo.map((item) => (
                  <MenuItem
                    key={item.value}
                    value={item.value}
                    sx={{ fontSize: "12px" }}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 140 }} size="small">
              <InputLabel id="filter-estado-label">Estado</InputLabel>
              <Select
                labelId="filter-estado-label"
                value={filterEstado}
                label="Estado"
                onChange={(e) => setFilterEstado(e.target.value)}
                sx={{ fontSize: "12px" }}
              >
                <MenuItem value="0" sx={{ fontSize: "12px" }}>
                  Todos
                </MenuItem>
                {dataEstado
                  .filter((item) => item.value === 8 || item.value === 9)
                  .map((item) => (
                    <MenuItem
                      key={item.value}
                      value={item.value}
                      sx={{ fontSize: "12px" }}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 90 }} size="small">
              <InputLabel id="rows-per-page-label">Mostrar</InputLabel>
              <Select
                labelId="rows-per-page-label"
                id="rows-per-page"
                value={rowsPerPage}
                label="Mostrar"
                onChange={handleChangeRowsPerPage}
                sx={{ fontSize: "12px" }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={handleExportExcel}
              startIcon={<FaFileExcel size={18} />}
              sx={{
                textTransform: "uppercase",
                borderRadius: "8px",
                borderColor: "#2e7d32",
                color: "#2e7d32",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#1b5e20",
                  backgroundColor: ui.successSoft,
                },
              }}
            >
              EXCEL
            </Button>

            <Button
              variant="outlined"
              onClick={handleExportPDF}
              startIcon={<FaFilePdf size={18} />}
              sx={{
                textTransform: "uppercase",
                borderRadius: "8px",
                borderColor: "#c62828",
                color: "#c62828",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#8e0000",
                  backgroundColor: "rgba(198,40,40,0.08)",
                },
              }}
            >
              PDF
            </Button>

            <Button
              variant="contained"
              onClick={handleAgregarNuevo}
              sx={{
                backgroundColor: ui.primary,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: "bold",
                boxShadow: "0 10px 20px rgba(20,73,133,0.18)",
                "&:hover": { backgroundColor: ui.primaryDark },
              }}
              startIcon={
                <FontAwesomeIcon
                  icon={faPlusSquare}
                  style={{ color: "white", fontSize: "12px" }}
                />
              }
            >
              Añadir
            </Button>
          </Box>
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            border: `1px solid ${ui.border}`,
            background: "#fff",
            overflow: "hidden",
          }}
        >
          <Table
            stickyHeader
            size="small"
            sx={{
              "& th, & td": {
                fontSize: "12px",
                padding: "4px 6px",
              },
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    bgcolor: ui.primaryHeader,
                    color: ui.primaryDark,
                    fontWeight: 800,
                    borderBottom: `1px solid ${ui.primaryHeaderBorder}`,
                    py: 1,
                  },
                }}
              >
                <TableCell align="center">Id</TableCell>
                <TableCell align="center">Categoría</TableCell>
                <TableCell align="center">Código</TableCell>
                <TableCell align="center">Descripción</TableCell>
                <TableCell align="center">Marca</TableCell>
                <TableCell align="center">Modelo</TableCell>
                <TableCell align="center">Serie</TableCell>
                <TableCell align="center">Req. lote</TableCell>
                <TableCell align="center">Req. venc.</TableCell>
                <TableCell align="center">Stock total</TableCell>
                <TableCell align="center">Bodegas</TableCell>
                <TableCell align="center">Próx. venc.</TableCell>
                <TableCell align="center">Lotes</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Inv. Inicial</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loadingTable ? (
                <TableRow>
                  <TableCell colSpan={16} align="center" sx={{ height: 50 }}>
                    <CircularProgress size={30} color="primary" />
                  </TableCell>
                </TableRow>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((data) => {
                  const lotesCount = Number(data.total_lotes ?? 0);
                  const canViewLots =
                    Boolean(data.requiere_lote) ||
                    lotesCount > 0 ||
                    Number(data.total_bodegas ?? 0) > 0;

                  return (
                    <TableRow key={data.id} hover>
                      <TableCell align="center">{data.id}</TableCell>
                      <TableCell align="center">{data.tipo_insumo}</TableCell>
                      <TableCell align="center">{data.codigo}</TableCell>
                      <TableCell>{data.ins_descripcion}</TableCell>
                      <TableCell align="center">{data.marca}</TableCell>
                      <TableCell align="center">{data.modelo}</TableCell>
                      <TableCell align="center">{data.serie}</TableCell>

                      <TableCell align="center">
                        <Chip
                          label={data.requiere_lote ? "Sí" : "No"}
                          size="small"
                          color={data.requiere_lote ? "primary" : "default"}
                          variant={data.requiere_lote ? "filled" : "outlined"}
                          sx={{ fontSize: "11px", height: 22 }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={data.requiere_vencimiento ? "Sí" : "No"}
                          size="small"
                          color={data.requiere_vencimiento ? "warning" : "default"}
                          variant={
                            data.requiere_vencimiento ? "filled" : "outlined"
                          }
                          sx={{ fontSize: "11px", height: 22 }}
                        />
                      </TableCell>

                      <TableCell align="center">
                        {formatQty(data.stock_total)}
                      </TableCell>

                      <TableCell align="center">
                        {formatQty(data.total_bodegas)}
                      </TableCell>

                      <TableCell align="center">
                        {formatDate(data.proximo_vencimiento)}
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip
                          title={
                            canViewLots
                              ? "Ver resumen y detalle de lotes"
                              : "Sin lotes"
                          }
                        >
                          <span>
                            <Badge
                              badgeContent={lotesCount}
                              color="primary"
                              overlap="circular"
                              invisible={lotesCount === 0}
                              sx={{
                                "& .MuiBadge-badge": {
                                  fontSize: "10px",
                                  height: "16px",
                                  minWidth: "16px",
                                  borderRadius: "8px",
                                },
                              }}
                            >
                              <IconButton
                                disabled={!canViewLots}
                                onClick={() => handleViewLotesSwal(data)}
                                size="small"
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "6px",
                                  border: "1px solid #cfd8e3",
                                  backgroundColor: "#fff",
                                  color: "#144985",
                                  "&:hover": {
                                    backgroundColor: "rgba(20,73,133,0.08)",
                                    borderColor: "#144985",
                                  },
                                  "&.Mui-disabled": {
                                    opacity: 0.45,
                                    borderColor: "#e5e7eb",
                                    color: "#9ca3af",
                                  },
                                }}
                              >
                                <FontAwesomeIcon
                                  icon={faLayerGroup}
                                  style={{ fontSize: "12px" }}
                                />
                              </IconButton>
                            </Badge>
                          </span>
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center">{data.nombre_estado}</TableCell>

                      <TableCell align="center">
                        <Tooltip title="Inventario inicial">
                          <IconButton
                            onClick={() => handleOpenModalInventarioInicial(data)}
                            size="small"
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: "6px",
                              border: "1px solid #cfd8e3",
                              backgroundColor: "#fff",
                              color: "#144985",
                              "&:hover": {
                                backgroundColor: "rgba(20,73,133,0.08)",
                                borderColor: "#144985",
                              },
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faWarehouse}
                              style={{ fontSize: "12px" }}
                            />
                          </IconButton>
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton
                            onClick={() => handleEditarInsumo(data)}
                            color="warning"
                            size="small"
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: "6px",
                              border: "1px solid",
                              borderColor: "warning.light",
                              backgroundColor: "#fff",
                              "&:hover": {
                                backgroundColor: "rgba(237,108,2,0.08)",
                                borderColor: "warning.main",
                              },
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faEdit}
                              style={{ fontSize: "12px" }}
                            />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Eliminar">
                          <IconButton
                            onClick={() => handleEliminarProducto(data.id)}
                            size="small"
                            sx={{
                              ml: 0.5,
                              width: 28,
                              height: 28,
                              borderRadius: "6px",
                              border: "1px solid #f4b4b4",
                              backgroundColor: "#fff",
                              color: "#b91c1c",
                              "&:hover": {
                                backgroundColor: "rgba(185,28,28,0.08)",
                                borderColor: "#b91c1c",
                              },
                            }}
                          >
                            <FontAwesomeIcon
                              icon={faTrashAlt}
                              style={{ fontSize: "12px" }}
                            />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={16}
                    align="center"
                    sx={{ fontSize: "12px", border: "1px solid #ccc" }}
                  >
                    No se encontraron productos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {openModalInventarioInicial && (
            <CompInventarioInicial
              open={openModalInventarioInicial}
              onClose={handleCloseModalInventarioInicial}
              idInsumo={selectedInsumoId}
              insumoData={selectedInsumoData}
            />
          )}
        </TableContainer>

        <Pagination
          count={Math.ceil(filteredInsumos.length / rowsPerPage) || 1}
          page={page}
          onChange={(event, value) => setPage(value)}
          showFirstButton
          showLastButton
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "center",
            "& .MuiPaginationItem-root": {
              color: "#000",
              borderRadius: "6px",
              backgroundColor: "#dedede",
              fontSize: "12px",
              minWidth: "24px",
              height: "24px",
              padding: "0 4px",
            },
            "& .Mui-selected": {
              backgroundColor: "#bdbdbd !important",
              color: "#000",
              fontWeight: "bold",
              fontSize: "12px",
            },
            "& .MuiPaginationItem-root:hover": {
              backgroundColor: "#cfcfcf",
            },
          }}
        />

        <Dialog
          open={openDialogInsumo}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: 6,
              minHeight: "8vh",
            },
          }}
        >
          <DialogTitle
            sx={{
              backgroundColor: "rgba(20, 73, 133, 1)",
              color: "white",
              py: 2,
              px: 3,
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {selectedInsumo ? "Editar producto" : "Agregar producto"}
          </DialogTitle>
          <Divider />

          <DialogContent
            sx={{
              p: 2.25,
              "& .MuiInputBase-root": { fontSize: "12px" },
              "& .MuiInputLabel-root": { fontSize: "12px" },
              "& .MuiMenuItem-root": { fontSize: "12px" },
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl
                  fullWidth
                  size="small"
                  error={!!errors["select-tipo"]}
                >
                  <InputLabel>Tipos</InputLabel>
                  <Select
                    value={formDataAgregarInsumos["select-tipo"] ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormDataAgregarInsumos((prev) => ({
                        ...prev,
                        "select-tipo": value,
                      }));
                      setSelectedIdTipo(Number(value));
                      if (errors["select-tipo"] && value && value !== "0") {
                        clearError("select-tipo");
                      }
                    }}
                    sx={{ background: "#fff" }}
                  >
                    <MenuItem value="0">Seleccione categoria</MenuItem>
                    {dataCategoriaActivo.length === 0 ? (
                      <MenuItem disabled value="">
                        Cargando categorías...
                      </MenuItem>
                    ) : (
                      dataCategoriaActivo.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors["select-tipo"] && (
                    <FormHelperText>{errors["select-tipo"]}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Descripción"
                  variant="outlined"
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  value={formDataAgregarInsumos["txt-descripcion"] ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormDataAgregarInsumos((prev) => ({
                      ...prev,
                      "txt-descripcion": value,
                    }));
                    if (errors["txt-descripcion"] && value.trim() !== "") {
                      clearError("txt-descripcion");
                    }
                  }}
                  error={!!errors["txt-descripcion"]}
                  helperText={errors["txt-descripcion"] || ""}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Código"
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={formDataAgregarInsumos["txt-codigo"] ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormDataAgregarInsumos((prev) => ({
                      ...prev,
                      "txt-codigo": value,
                    }));
                    if (errors["txt-codigo"] && value.trim() !== "") {
                      clearError("txt-codigo");
                    }
                  }}
                  error={!!errors["txt-codigo"]}
                  helperText={errors["txt-codigo"] || ""}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: errors["txt-codigo"]
                          ? "#b91c1c"
                          : "rgba(0,0,0,0.23)",
                      },
                      "&:hover fieldset": {
                        borderColor: errors["txt-codigo"]
                          ? "#b91c1c"
                          : "rgba(0,0,0,0.87)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: errors["txt-codigo"]
                          ? "#b91c1c"
                          : "rgba(0,0,0,0.87)",
                      },
                    },
                    "& .MuiFormHelperText-root": {
                      color: "#b91c1c",
                      fontSize: "12px",
                      marginLeft: 0,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl
                  fullWidth
                  size="small"
                  error={!!errors["select-unidad-medida"]}
                >
                  <InputLabel>U. Medida</InputLabel>
                  <Select
                    value={formDataAgregarInsumos["select-unidad-medida"] ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormDataAgregarInsumos((prev) => ({
                        ...prev,
                        "select-unidad-medida": value,
                      }));
                      if (
                        errors["select-unidad-medida"] &&
                        value &&
                        value !== "0"
                      ) {
                        clearError("select-unidad-medida");
                      }
                    }}
                    sx={{ background: "#fff" }}
                  >
                    <MenuItem value="0">Seleccione Unidad</MenuItem>
                    <MenuItem value="Unidad">Unidad</MenuItem>
                  </Select>
                  {errors["select-unidad-medida"] && (
                    <FormHelperText>
                      {errors["select-unidad-medida"]}
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl
                  fullWidth
                  size="small"
                  error={!!errors["select-estado"]}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isActivo}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsActivo(checked);

                          const value = checked ? 8 : 9;
                          setFormDataAgregarInsumos((prev) => ({
                            ...prev,
                            "select-estado": value,
                          }));

                          if (errors["select-estado"]) clearError("select-estado");
                        }}
                        sx={{
                          "&.Mui-checked": {
                            color: "#2e7d32",
                          },
                        }}
                      />
                    }
                    label={isActivo ? "Activo" : "Inactivo"}
                    sx={{
                      "& .MuiFormControlLabel-label": { fontSize: "12px" },
                    }}
                  />
                  {errors["select-estado"] && (
                    <FormHelperText>{errors["select-estado"]}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {Number(selectedIdTipo) === 1 && (
                <>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Marca"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={formDataAgregarInsumos["txt-marca"] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormDataAgregarInsumos((prev) => ({
                          ...prev,
                          "txt-marca": value,
                        }));
                        if (errors["txt-marca"] && value.trim() !== "") {
                          clearError("txt-marca");
                        }
                      }}
                      error={!!errors["txt-marca"]}
                      helperText={errors["txt-marca"] || ""}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Modelo"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={formDataAgregarInsumos["txt-modelo"] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormDataAgregarInsumos((prev) => ({
                          ...prev,
                          "txt-modelo": value,
                        }));
                        if (errors["txt-modelo"] && value.trim() !== "") {
                          clearError("txt-modelo");
                        }
                      }}
                      error={!!errors["txt-modelo"]}
                      helperText={errors["txt-modelo"] || ""}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Serie"
                      variant="outlined"
                      fullWidth
                      size="small"
                      value={formDataAgregarInsumos["txt-serie"] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormDataAgregarInsumos((prev) => ({
                          ...prev,
                          "txt-serie": value,
                        }));
                        if (errors["txt-serie"] && value.trim() !== "") {
                          clearError("txt-serie");
                        }
                      }}
                      error={!!errors["txt-serie"]}
                      helperText={errors["txt-serie"] || ""}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#1f3a5f",
                    mb: 1,
                  }}
                >
                  Configuración para el control de inventario
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(formDataAgregarInsumos.requiere_lote)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormDataAgregarInsumos((prev) => ({
                          ...prev,
                          requiere_lote: checked,
                          requiere_vencimiento: checked
                            ? prev.requiere_vencimiento
                            : false,
                        }));
                      }}
                      sx={{
                        "&.Mui-checked": {
                          color: "#144985",
                        },
                      }}
                    />
                  }
                  label="Requiere lote"
                  sx={{
                    "& .MuiFormControlLabel-label": { fontSize: "12px" },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={Boolean(
                        formDataAgregarInsumos.requiere_vencimiento
                      )}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormDataAgregarInsumos((prev) => ({
                          ...prev,
                          requiere_vencimiento: checked,
                          requiere_lote: checked ? true : prev.requiere_lote,
                        }));
                      }}
                      sx={{
                        "&.Mui-checked": {
                          color: "#ed6c02",
                        },
                      }}
                    />
                  }
                  label="Requiere vencimiento"
                  sx={{
                    "& .MuiFormControlLabel-label": { fontSize: "12px" },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "#fafbfd",
                    borderColor: "#e6ebf2",
                  }}
                >
                  <Typography sx={{ fontSize: "11px", color: "#475467" }}>
                    {formDataAgregarInsumos.requiere_lote
                      ? formDataAgregarInsumos.requiere_vencimiento
                        ? "Este producto se controlará por bodega, lote y fecha de vencimiento."
                        : "Este producto se controlará por bodega y lote."
                      : "Este producto se controlará únicamente por bodega."}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions
            sx={{ p: 2, borderTop: "1px solid #e9eef5", background: "#fff" }}
          >
            <Button
              onClick={handleCloseDialog}
              startIcon={<CloseIcon />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                minWidth: 120,
                backgroundColor: "#fff",
                color: "#b91c1c",
                border: "1px solid #b91c1c",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "rgba(185, 28, 28, 0.08)",
                  boxShadow: "0 2px 6px rgba(185, 28, 28, 0.2)",
                },
                fontSize: "12px",
              }}
            >
              Cancelar
            </Button>

            {selectedInsumo ? (
              <Button
                onClick={handleModificarInsumo}
                startIcon={!savingInsumo && <SaveIcon />}
                disabled={savingInsumo}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  minWidth: 120,
                  backgroundColor: "#fff",
                  color: "#2e7d32",
                  border: "1px solid #2e7d32",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "rgba(46, 125, 50, 0.08)",
                    boxShadow: "0 2px 6px rgba(46, 125, 50, 0.2)",
                  },
                  fontSize: "12px",
                }}
              >
                {savingInsumo ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} color="inherit" />
                    Modificando...
                  </Box>
                ) : (
                  "Modificar"
                )}
              </Button>
            ) : (
              <Button
                onClick={handleGuardarInsumos}
                variant="contained"
                disabled={savingInsumo}
                startIcon={!savingInsumo && <SaveIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  minWidth: 140,
                  backgroundColor: "#fff",
                  color: "#2e7d32",
                  border: "1px solid #2e7d32",
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: "rgba(46, 125, 50, 0.08)",
                    boxShadow: "0 2px 6px rgba(46, 125, 50, 0.2)",
                  },
                  fontSize: "12px",
                }}
              >
                {savingInsumo ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CircularProgress size={16} color="inherit" />
                    Guardando...
                  </Box>
                ) : (
                  "Guardar"
                )}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Productos;
