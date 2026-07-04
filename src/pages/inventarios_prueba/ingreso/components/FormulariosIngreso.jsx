import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  FormControl,
  MenuItem,
  InputLabel,
  Select,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  Divider,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Chip,
  Stack,
} from "@mui/material";
import axiosClient from "../../../../../axios/axios_client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faList, faTimes } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SearchIcon from "@mui/icons-material/Search";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import "dayjs/locale/es";
import dayjs from "dayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const ui = {
  bg: "#f6f8fc",
  paper: "#ffffff",
  ink: "#0f172a",
  muted: "#475569",
  border: "#dbe3f0",
  borderSoft: "#e8eef7",
  primary: "#144985",
  success: "#177d3f",
  danger: "#b42318",
  head: "#0b1f3a",
  warning: "#b7791f",
  softBlue: "#f5f8ff",
  softYellow: "#fffaf0",
};

const baseFontSx = {
  fontFamily: `"Inter","Roboto","Helvetica","Arial",sans-serif`,
  letterSpacing: 0,
  fontStyle: "normal",
};

const textFieldSx = {
  "& .MuiInputBase-root": {
    ...baseFontSx,
    fontSize: 12,
    minHeight: 34,
    borderRadius: 1.5,
  },
  "& .MuiInputBase-input": {
    ...baseFontSx,
    fontSize: 12,
    py: 0.75,
  },
  "& .MuiInputLabel-root": {
    ...baseFontSx,
    fontSize: 12,
  },
  "& .MuiFormHelperText-root": {
    ...baseFontSx,
    fontSize: 11,
    mt: 0.4,
  },
};

const selectSx = {
  ...baseFontSx,
  "& .MuiOutlinedInput-root": {
    ...baseFontSx,
    fontSize: 12,
    borderRadius: 1.5,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: ui.border,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: ui.primary,
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: ui.primary,
  },
  "& .MuiSelect-select": {
    ...baseFontSx,
    fontSize: 12,
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingLeft: "12px",
    paddingRight: "32px",
    display: "flex",
    alignItems: "center",
    minHeight: "unset",
  },
  "& .MuiSvgIcon-root": {
    fontSize: 20,
  },
  "& em": {
    fontStyle: "normal",
  },
  "& .MuiFormHelperText-root": {
    ...baseFontSx,
    fontSize: 11,
    mt: 0.4,
  },
};

const tableSx = {
  "& th": {
    ...baseFontSx,
    fontSize: 11,
    fontWeight: 800,
    color: ui.head,
    bgcolor: "#f3f6fb",
    borderBottom: `1px solid ${ui.borderSoft}`,
    py: 0.9,
    whiteSpace: "nowrap",
  },
  "& td": {
    ...baseFontSx,
    fontSize: 12,
    borderBottom: `1px solid ${ui.borderSoft}`,
    py: 0.75,
    verticalAlign: "top",
  },
};

const sectionTitleSx = {
  ...baseFontSx,
  fontSize: 11,
  fontWeight: 900,
  color: ui.primary,
  letterSpacing: 0.6,
  textTransform: "uppercase",
};

const EmptyState = ({ label = "SIN REGISTROS" }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      textAlign: "center",
      borderRadius: 2,
      border: `1px dashed ${ui.border}`,
      bgcolor: "#fbfcfe",
    }}
  >
    <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 12 }}>
      {label}
    </Typography>
    <Typography sx={{ ...baseFontSx, color: ui.muted, mt: 0.4, fontSize: 11 }}>
      Cuando existan registros, aparecerán aquí.
    </Typography>
  </Paper>
);

const safeBool = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const str = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "t", "si", "sí"].includes(str);
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

const createEmptyLote = () => ({
  codigo_lote: "",
  fecha_elaboracion: "",
  fecha_vencimiento: "",
  cantidad: "",
});

const calculateRowTotal = (row) => {
  const requiresControl = safeBool(row?.requiere_lote) || safeBool(row?.requiere_vencimiento);

  if (!requiresControl) {
    return toNumber(row?.cantidad);
  }

  if (!Array.isArray(row?.lotes)) return 0;
  return row.lotes.reduce((acc, lote) => acc + toNumber(lote?.cantidad), 0);
};

const normalizeDetalleProducto = (row = {}) => {
  const requiere_lote = safeBool(row?.requiere_lote);
  const requiere_vencimiento = safeBool(row?.requiere_vencimiento);

  return {
    idInsumo: row?.idInsumo ?? row?.id ?? "",
    nombre: row?.nombre ?? row?.ins_descripcion ?? "",
    codigo: row?.codigo ?? "",
    cantidad: row?.cantidad ?? "",
    requiere_lote,
    requiere_vencimiento,
    lotes: Array.isArray(row?.lotes)
      ? row.lotes.map((l) => ({
        codigo_lote: l?.codigo_lote ?? "",
        fecha_elaboracion: l?.fecha_elaboracion ?? "",
        fecha_vencimiento: l?.fecha_vencimiento ?? "",
        cantidad: l?.cantidad ?? "",
      }))
      : [],
  };
};

const cleanDetalleProductosPayload = (rows = []) => {
  return rows.map((row) => {
    const requiresControl = safeBool(row?.requiere_lote) || safeBool(row?.requiere_vencimiento);

    const payload = {
      idInsumo: row.idInsumo,
      nombre: row.nombre,
      codigo: row.codigo ?? "",
      cantidad: calculateRowTotal(row),
      requiere_lote: safeBool(row?.requiere_lote),
      requiere_vencimiento: safeBool(row?.requiere_vencimiento),
    };

    if (requiresControl) {
      payload.lotes = (row.lotes || []).map((l) => ({
        codigo_lote: l.codigo_lote ?? "",
        fecha_elaboracion: l.fecha_elaboracion ?? "",
        fecha_vencimiento: l.fecha_vencimiento ?? "",
        cantidad: toNumber(l.cantidad),
      }));
    }

    return payload;
  });
};

const FormularioIngreso = ({ onCancelar, usr_id, data }) => {
  const [dataProveedores, setDataProveedor] = useState([]);
  const [formDataProveedor, setFormDataProveedor] = useState({});
  const [dataFilteredProveedores, setFilteredProveedores] = useState([]);
  const [searchProveedores, setSearchProveedor] = useState("");
  const [showProvResults, setShowProvResults] = useState(false);

  const [dataInsumos, setDataInsumos] = useState([]);
  const [dataFilteredInsumos, setDataFilteredInsumos] = useState([]);
  const [searchTermInsumo, setSearchTermInsumo] = useState("");

  const [idNroIngreso, setIdNroIngreso] = useState("");

  const [filePreview, setFilePreview] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const [dataSede, setDataSede] = useState([]);
  const [dataFacultad, setDataFacultad] = useState([]);
  const [dataBodega, setDataBodega] = useState([]);
  const [loadingFacultades, setLoadingFacultades] = useState(false);
  const [loadingBodega, setLoadingBodega] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [dataEstado, setDataEstado] = useState(false);
  const [N_comprobante_anterior, setN_comprobante_anterior] = useState("");

  const [formDataAgregarIngresos, setFormDataIngreso] = useState({
    encabezado: {
      id_usuario: usr_id,
      n_ingreso: "",
      n_comprobante: "",
      tipo_adquisicion: "",
      fecha_emision: "",
      fecha_vencimiento: "",
      id_proveedor: "",
      archivo_comprobante: null,
      select_sede: "",
      select_facultad: "",
      select_bodega: "",
    },
    detalleProductos: [],
  });

  const isDonacionLaboratorios = useMemo(
    () => String(formDataAgregarIngresos.encabezado.tipo_adquisicion) === "3",
    [formDataAgregarIngresos.encabezado.tipo_adquisicion]
  );

  useEffect(() => {
    const go = async () => {
      try {
        const response = await axiosClient.get("/inventario/ingresos/numero");
        const nro = response?.data;
        setIdNroIngreso(nro);
        setFormDataIngreso((prev) => ({
          ...prev,
          encabezado: { ...prev.encabezado, n_ingreso: nro },
        }));
      } catch (error) { }
    };
    go();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axiosClient.get("/inventario/proveedores");
        const provs = Array.isArray(response?.data) ? response.data : response?.data?.data || [];
        setDataProveedor(Array.isArray(provs) ? provs : []);
      } catch (error) { }
    };
    setFilteredProveedores([]);
    load();
  }, []);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFormDataIngreso({
        encabezado: {
          id_ingreso: data.ei_id,
          id_usuario: data.id_usuario || usr_id,
          n_ingreso: data.ei_numero_ingreso || "",
          n_comprobante: data.ei_numero_comprobante || "",
          tipo_adquisicion: String(data.ei_tipo_adquisicion || ""),
          fecha_emision: data.ei_fecha_emision || "",
          fecha_vencimiento: data.ei_fecha_vencimiento || "",
          id_proveedor: data.ei_id_proveedor || "",
          archivo_comprobante: null,
          select_sede: String(data.id_sede ?? data.ei_id_sede ?? ""),
          select_facultad: String(data.id_facultad ?? data.ei_id_facultad ?? ""),
          select_bodega: String(data.id_bodega ?? data.ei_id_bodega ?? ""),
        },
        detalleProductos: (() => {
          try {
            const parsed = JSON.parse(data.ei_detalle_producto || "[]");
            return Array.isArray(parsed) ? parsed.map(normalizeDetalleProducto) : [];
          } catch {
            return [];
          }
        })(),
      });

      const idIngreso = data.ei_numero_ingreso || data.ei_id || "";
      setDataEstado(Boolean(idIngreso));
      setN_comprobante_anterior(idIngreso ? idIngreso : "");
    }
  }, [data, usr_id]);

  useEffect(() => {
    const fetchDataSede = async () => {
      try {
        const response = await axiosClient.get("/consultar-sedes");
        const sedes = Array.isArray(response?.data) ? response.data : [];
        const mapData = (sedes || []).map((item) => ({
          value: Number(item.id),
          label: item.nombre_sede,
        }));
        setDataSede(mapData);
      } catch (error) {
        Swal.fire("¡Error!", "Error al cargar las Sedes", error.message);
      }
    };
    fetchDataSede();
  }, []);

  useEffect(() => {
    if (!data) return;

    const sede = String(data.id_sede || data.ei_id_sede || "");
    const fac = String(data.id_facultad || data.ei_id_facultad || "");
    const bod = String(data.id_bodega || data.ei_id_bodega || "");
    const provId = data.ei_id_proveedor || data.id_proveedor;

    setFormDataIngreso((p) => ({
      ...p,
      encabezado: {
        ...p.encabezado,
        id_proveedor: provId || "",
        select_sede: sede,
        select_facultad: fac,
        select_bodega: bod,
        n_comprobante: data.ei_numero_comprobante || p.encabezado.n_comprobante,
        tipo_adquisicion: String(data.ei_tipo_adquisicion || p.encabezado.tipo_adquisicion || ""),
        fecha_emision: data.ei_fecha_emision || "",
        fecha_vencimiento: data.ei_fecha_vencimiento || "",
      },
    }));

    if (provId && Array.isArray(dataProveedores) && dataProveedores.length) {
      const prov = dataProveedores.find((pr) => String(pr.prov_id) === String(provId));
      if (prov) {
        setFormDataProveedor({
          ruc: prov.prov_ruc,
          nombre: prov.prov_nombre,
          direccion: prov.prov_direccion,
          telefono: prov.prov_telefono,
          correo: prov.prov_correo,
        });
        setSearchProveedor(prov.prov_nombre);
      }
    }

    if (sede) buscarFacultadSede(Number(sede));
    if (sede && fac) buscarBodega(Number(sede), Number(fac));
  }, [data, dataProveedores]);

  useEffect(() => {
    if (!isDonacionLaboratorios) return;

    setFormDataIngreso((prev) => ({
      ...prev,
      encabezado: {
        ...prev.encabezado,
        n_comprobante: "",
        fecha_emision: "",
        fecha_vencimiento: "",
        archivo_comprobante: null,
      },
    }));

    setFile(null);
    setFilePreview(null);

    if (fileInputRef.current) fileInputRef.current.value = null;

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.n_comprobante;
      delete copy.fecha_emision;
      delete copy.fecha_vencimiento;
      delete copy.archivo_comprobante;
      return copy;
    });
  }, [isDonacionLaboratorios]);

  const buscarFacultadSede = async (id_sede) => {
    setLoadingFacultades(true);
    try {
      const response = await axiosClient.get(
        `/consultar-facultades-sede/${Number(id_sede)}`
      );
      const facs = Array.isArray(response?.data) ? response.data : [];
      setDataFacultad(Array.isArray(facs) ? facs : []);
    } catch (error) {
      Swal.fire("¡Error!", "Error al cargar las Facultades", error.message);
    } finally {
      setLoadingFacultades(false);
    }
  };

  const buscarBodega = async (id_sede, id_facultad) => {
    setLoadingBodega(true);
    try {
      const response = await axiosClient.get(`/inventario/bodegas/${Number(id_sede)}/${Number(id_facultad)}`);
      const resp = response?.data;
      const bodegas = Array.isArray(resp) ? resp : resp?.data ?? [];
      setDataBodega(bodegas);
    } finally {
      setLoadingBodega(false);
    }
  };

  const consultarInsumosPorBodega = async (id_sede, id_facultad, id_bodega) => {
    try {
      const response = await axiosClient.get(`/inventario/bodegas/${id_sede}/${id_facultad}/${id_bodega}`);
      const list = response?.data;
      const arr = Array.isArray(list) ? list : [];
      setDataInsumos(arr);
      setDataFilteredInsumos(arr);
    } catch (error) {
      setDataInsumos([]);
      setDataFilteredInsumos([]);
    }
  };

  const handleSearchInsumoChange = (event) => {
    const value = (event.target.value || "").toLowerCase();
    setSearchTermInsumo(value);

    if (!value) {
      setDataFilteredInsumos([]);
      return;
    }

    const filtered = dataInsumos.filter((d) =>
      [d?.codigo, d?.ins_descripcion, d?.nombre_sede, d?.nombre_bodega]
        .map((x) => String(x || "").toLowerCase())
        .join(" ")
        .includes(value)
    );

    setDataFilteredInsumos(filtered);
  };

  const clearErrorsByPrefix = (prefixes = []) => {
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (prefixes.some((prefix) => key.startsWith(prefix))) {
          delete next[key];
        }
      });
      return next;
    });
  };

  const handleAgregarInsumoTabla = (row) => {
    const idInsumo = row.idInsumo ?? row.id;
    const requiere_lote = safeBool(row?.requiere_lote);
    const requiere_vencimiento = safeBool(row?.requiere_vencimiento);
    const requiereControl = requiere_lote || requiere_vencimiento;

    setFormDataIngreso((prev) => {
      if (prev.detalleProductos.some((x) => String(x.idInsumo) === String(idInsumo))) {
        return prev;
      }

      return {
        ...prev,
        detalleProductos: [
          ...prev.detalleProductos,
          {
            idInsumo,
            nombre: row.ins_descripcion,
            codigo: row.codigo ?? "",
            cantidad: requiereControl ? "" : 1,
            requiere_lote,
            requiere_vencimiento,
            lotes: requiereControl ? [createEmptyLote()] : [],
          },
        ],
      };
    });

    setSearchTermInsumo("");
    setDataFilteredInsumos([]);
    clearErrorsByPrefix([`cantidad_${idInsumo}`, `lotes_${idInsumo}`, `l_${idInsumo}_`, "detalleProductos"]);
  };

  const handleRowInsumoChange = (idInsumo, value) => {
    setFormDataIngreso((prev) => ({
      ...prev,
      detalleProductos: prev.detalleProductos.map((r) =>
        String(r.idInsumo) === String(idInsumo) ? { ...r, cantidad: value } : r
      ),
    }));

    if (value === "" || isNaN(value) || Number(value) <= 0) {
      setErrors((prev) => ({ ...prev, [`cantidad_${idInsumo}`]: "Cantidad inválida" }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[`cantidad_${idInsumo}`];
        return copy;
      });
    }
  };

  const handleDeleteFilaInsumo = (idInsumo) => {
    setFormDataIngreso((prev) => ({
      ...prev,
      detalleProductos: prev.detalleProductos.filter((p) => String(p.idInsumo) !== String(idInsumo)),
    }));
    clearErrorsByPrefix([`cantidad_${idInsumo}`, `lotes_${idInsumo}`, `l_${idInsumo}_`]);
  };

  const handleAgregarLoteProducto = (idInsumo) => {
    setFormDataIngreso((prev) => ({
      ...prev,
      detalleProductos: prev.detalleProductos.map((p) =>
        String(p.idInsumo) === String(idInsumo)
          ? { ...p, lotes: [...(p.lotes || []), createEmptyLote()] }
          : p
      ),
    }));
    clearErrorsByPrefix([`lotes_${idInsumo}`]);
  };

  const handleDeleteLoteProducto = (idInsumo, loteIndex) => {
    setFormDataIngreso((prev) => ({
      ...prev,
      detalleProductos: prev.detalleProductos.map((p) =>
        String(p.idInsumo) === String(idInsumo)
          ? { ...p, lotes: (p.lotes || []).filter((_, idx) => idx !== loteIndex) }
          : p
      ),
    }));
    clearErrorsByPrefix([`l_${idInsumo}_${loteIndex}_`, `lotes_${idInsumo}`]);
  };

  const handleLoteChange = (idInsumo, loteIndex, field, value) => {
    setFormDataIngreso((prev) => ({
      ...prev,
      detalleProductos: prev.detalleProductos.map((p) =>
        String(p.idInsumo) === String(idInsumo)
          ? {
            ...p,
            lotes: (p.lotes || []).map((l, idx) =>
              idx === loteIndex ? { ...l, [field]: value } : l
            ),
          }
          : p
      ),
    }));

    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`l_${idInsumo}_${loteIndex}_${field}`];
      delete copy[`lotes_${idInsumo}`];
      delete copy[`cantidad_${idInsumo}`];
      return copy;
    });
  };

  const handleSearchProveeedorChange = (event) => {
    const value = (event.target.value || "").toLowerCase();
    setSearchProveedor(event.target.value);
    setShowProvResults(Boolean(value));

    if (!value) {
      setFilteredProveedores([]);
      return;
    }

    const filtered = dataProveedores.filter((d) =>
      String(d.prov_nombre || "").toLowerCase().includes(value)
    );
    setFilteredProveedores(filtered);
  };

  const handleAgregarProveedorTabla = (prov) => {
    setFormDataProveedor({
      ruc: prov.prov_ruc,
      nombre: prov.prov_nombre,
      direccion: prov.prov_direccion,
      telefono: prov.prov_telefono,
      correo: prov.prov_correo,
    });

    setFormDataIngreso((prev) => ({
      ...prev,
      encabezado: { ...prev.encabezado, id_proveedor: prov.prov_id },
    }));

    setFilteredProveedores([]);
    setShowProvResults(false);
    setSearchProveedor(prov.prov_nombre);
  };

  const handleFileEvidenciaChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      Swal.fire({
        icon: "warning",
        title: "Archivo no válido",
        text: "Por favor, selecciona un archivo PDF.",
      });
      return;
    }

    setFile(selectedFile);
    setFormDataIngreso((prev) => ({
      ...prev,
      encabezado: { ...prev.encabezado, archivo_comprobante: selectedFile },
    }));
    setFilePreview(URL.createObjectURL(selectedFile));
  };

  const handleGuardarIngresos = async () => {
    setLoading(true);

    const {
      encabezado: {
        n_comprobante,
        tipo_adquisicion,
        fecha_emision,
        fecha_vencimiento,
        archivo_comprobante,
        select_sede,
        select_facultad,
        select_bodega,
        id_proveedor,
        n_ingreso,
        id_usuario,
      },
      detalleProductos,
    } = formDataAgregarIngresos;

    const isLab = String(tipo_adquisicion) === "3";
    let newErrors = {};

    if (!id_proveedor) newErrors.proveedor = "Debe seleccionar un proveedor";
    if (!tipo_adquisicion) newErrors.tipo_adquisicion = "Debe seleccionar el tipo de adquisición";
    if (!select_sede) newErrors.select_sede = "Debe seleccionar una sede";
    if (!select_facultad) newErrors.select_facultad = "Debe seleccionar una facultad / dirección";
    if (!select_bodega) newErrors.select_bodega = "Debe seleccionar una bodega";

    if (!detalleProductos || detalleProductos.length === 0) {
      newErrors.detalleProductos = "Debe agregar al menos un insumo al comprobante";
    }

    detalleProductos.forEach((row) => {
      const requiereLote = safeBool(row?.requiere_lote);
      const requiereVencimiento = safeBool(row?.requiere_vencimiento);
      const requiresControl = requiereLote || requiereVencimiento;

      if (!requiresControl) {
        if (row.cantidad === "" || isNaN(row.cantidad) || Number(row.cantidad) <= 0) {
          newErrors[`cantidad_${row.idInsumo}`] = "Cantidad inválida";
        }
        return;
      }

      if (!Array.isArray(row.lotes) || row.lotes.length === 0) {
        newErrors[`lotes_${row.idInsumo}`] = "Debe agregar al menos un lote";
      } else {
        const combos = new Set();

        row.lotes.forEach((lote, index) => {
          const codigo = String(lote.codigo_lote || "").trim();
          const fechaElab = String(lote.fecha_elaboracion || "").trim();
          const fechaVenc = String(lote.fecha_vencimiento || "").trim();
          const cantidad = Number(lote.cantidad);

          if (requiereLote && !codigo) {
            newErrors[`l_${row.idInsumo}_${index}_codigo_lote`] = "Ingrese el código de lote";
          }

          if (requiereVencimiento && !fechaVenc) {
            newErrors[`l_${row.idInsumo}_${index}_fecha_vencimiento`] = "Ingrese la fecha de vencimiento";
          }

          if (lote.cantidad === "" || isNaN(lote.cantidad) || cantidad <= 0) {
            newErrors[`l_${row.idInsumo}_${index}_cantidad`] = "Cantidad inválida";
          }

          if (fechaElab && fechaVenc && fechaElab > fechaVenc) {
            newErrors[`l_${row.idInsumo}_${index}_fecha_elaboracion`] =
              "La fecha de elaboración no puede ser mayor a la de vencimiento";
          }

          const comboKey = `${codigo}__${fechaVenc}`;
          if ((codigo || fechaVenc) && combos.has(comboKey)) {
            newErrors[`l_${row.idInsumo}_${index}_codigo_lote`] =
              "Este lote está repetido en la misma fila. Unifica la cantidad.";
          } else {
            combos.add(comboKey);
          }
        });
      }

      if (calculateRowTotal(row) <= 0) {
        newErrors[`cantidad_${row.idInsumo}`] = "La suma de lotes debe ser mayor a 0";
      }
    });

    if (!isLab) {
      if (!n_comprobante || String(n_comprobante).trim() === "") {
        newErrors.n_comprobante = "Debe ingresar el número de comprobante";
      }

      if (!fecha_emision) newErrors.fecha_emision = "Debe seleccionar la fecha de emisión";

      if (!fecha_vencimiento) {
        newErrors.fecha_vencimiento = "Debe seleccionar la fecha de vencimiento";
      } else if (fecha_emision && fecha_vencimiento < fecha_emision) {
        newErrors.fecha_vencimiento = "La fecha de vencimiento no puede ser menor a la emisión";
      }

      if (!archivo_comprobante) {
        newErrors.archivo_comprobante = "Debe subir el comprobante en PDF";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const encabezadoToSend = {
      ...formDataAgregarIngresos.encabezado,
      id_usuario: id_usuario ?? usr_id,
      n_ingreso: n_ingreso ?? idNroIngreso ?? "",
      n_comprobante: isLab ? null : (n_comprobante || "").trim(),
      fecha_emision: isLab ? null : fecha_emision || "",
      fecha_vencimiento: isLab ? null : fecha_vencimiento || "",
      archivo_comprobante: isLab ? null : archivo_comprobante ?? null,
    };

    const detalleProductosPayload = cleanDetalleProductosPayload(detalleProductos);

    const fd = new FormData();
    fd.append("encabezado", JSON.stringify(encabezadoToSend));
    fd.append("detalleProductos", JSON.stringify(detalleProductosPayload));
    if (!isLab && archivo_comprobante) {
      fd.append("archivo_comprobante", archivo_comprobante);
    }

    try {
      const response = await axiosClient.post("/inventario/ingresos", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const resp = response?.data;
      Swal.fire("Éxito", resp.message || "Ingreso guardado correctamente.", "success").then(() => {
        if (onCancelar) onCancelar();
      });
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "No se pudo guardar el ingreso.";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const totalItems = useMemo(() => {
    return formDataAgregarIngresos.detalleProductos.reduce(
      (acc, row) => acc + calculateRowTotal(row),
      0
    );
  }, [formDataAgregarIngresos.detalleProductos]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
      <Box sx={{ ...baseFontSx, minHeight: "100%", bgcolor: ui.bg, p: 1.5 }}>
        <Box sx={{ maxWidth: 1180, mx: "auto" }}>
          <Paper
            elevation={0}
            sx={{
              ...baseFontSx,
              bgcolor: ui.paper,
              border: `1px solid ${ui.border}`,
              borderRadius: 2,
              px: 2,
              py: 1.25,
              mb: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1.5,
                  border: `1px solid ${ui.border}`,
                  bgcolor: "#f1f5ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MenuBookIcon sx={{ color: ui.primary, fontSize: 18 }} />
              </Box>

              <Box sx={{ minWidth: 220 }}>
                <Typography sx={{ ...baseFontSx, fontWeight: 900, color: ui.head, fontSize: 13 }}>
                  {dataEstado ? "Modificar Comprobante de Ingreso" : "Registrar Comprobante de Ingreso"}
                </Typography>
                <Typography sx={{ ...baseFontSx, color: ui.muted, fontSize: 11 }}>
                  Nro: {dataEstado ? N_comprobante_anterior || "—" : idNroIngreso ? `${idNroIngreso}` : "—"}
                </Typography>
              </Box>

              <Chip
                label={`${formDataAgregarIngresos.detalleProductos.length} PRODUCTOS`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 800 }}
              />
              <Chip
                label={`${totalItems} UNIDADES TOTALES`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontWeight: 800 }}
              />

              <Button
                variant="contained"
                sx={{
                  ...baseFontSx,
                  ml: "auto",
                  backgroundColor: ui.primary,
                  "&:hover": { backgroundColor: "#0f3e73" },
                  color: "white",
                  px: 2,
                  fontSize: 12,
                  borderRadius: 1.5,
                  height: 34,
                  textTransform: "none",
                  boxShadow: "none",
                }}
                startIcon={<FontAwesomeIcon icon={faList} />}
                onClick={onCancelar}
              >
                Listar
              </Button>
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              ...baseFontSx,
              bgcolor: ui.paper,
              border: `1px solid ${ui.border}`,
              borderRadius: 2,
              p: 2,
            }}
          >
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 2, p: 1.5, bgcolor: "#fff" }}>
                  <Typography sx={sectionTitleSx}>Proveedor</Typography>

                  <FormControl fullWidth sx={{ mt: 1 }}>
                    <TextField
                      id="txt-buscar-proveedor"
                      size="small"
                      fullWidth
                      placeholder="Buscar proveedor"
                      value={searchProveedores}
                      onChange={(e) => {
                        handleSearchProveeedorChange(e);
                        if (errors.proveedor && formDataProveedor && Object.keys(formDataProveedor).length > 0) {
                          setErrors((prev) => {
                            const ne = { ...prev };
                            delete ne.proveedor;
                            return ne;
                          });
                        }
                      }}
                      onFocus={() => setShowProvResults(Boolean(searchProveedores.trim()))}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      error={!formDataProveedor || Object.keys(formDataProveedor).length === 0}
                      helperText={
                        !formDataProveedor || Object.keys(formDataProveedor).length === 0
                          ? "Seleccione un proveedor"
                          : ""
                      }
                      sx={textFieldSx}
                    />
                  </FormControl>

                  {showProvResults && searchProveedores.trim() && (
                    <Box sx={{ maxHeight: 200, overflowY: "auto", mt: 1 }}>
                      {dataFilteredProveedores.length === 0 ? (
                        <EmptyState label="SIN RESULTADOS" />
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                          <Table size="small" stickyHeader sx={tableSx}>
                            <TableHead>
                              <TableRow>
                                <TableCell>NOMBRE</TableCell>
                                <TableCell sx={{ width: 60 }} />
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {dataFilteredProveedores.map((row) => (
                                <TableRow key={row.prov_id} hover>
                                  <TableCell>{row.prov_nombre}</TableCell>
                                  <TableCell align="right">
                                    <Tooltip title="Agregar">
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          handleAgregarProveedorTabla(row);
                                          if (errors.proveedor) {
                                            setErrors((prev) => {
                                              const ne = { ...prev };
                                              delete ne.proveedor;
                                              return ne;
                                            });
                                          }
                                        }}
                                        sx={{ color: ui.primary }}
                                      >
                                        <FontAwesomeIcon icon={faPlus} />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )}

                  <Box sx={{ mt: 1.25 }}>
                    {formDataProveedor && Object.keys(formDataProveedor).length > 0 ? (
                      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                        <Table size="small" sx={tableSx}>
                          <TableBody>
                            {[
                              ["RUC", formDataProveedor.ruc],
                              ["NOMBRE", formDataProveedor.nombre],
                              ["DIRECCIÓN", formDataProveedor.direccion],
                              ["TELÉFONO", formDataProveedor.telefono],
                              ["EMAIL", formDataProveedor.correo],
                            ].map(([k, v]) => (
                              <TableRow key={k}>
                                <TableCell sx={{ width: 110, fontWeight: 800 }}>{k}</TableCell>
                                <TableCell
                                  title={String(v || "—")}
                                  sx={{
                                    maxWidth: 420,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {v || "—"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <EmptyState label="SELECCIONE UN PROVEEDOR" />
                    )}
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 2, p: 1.5, bgcolor: "#fff" }}>
                  <Typography sx={sectionTitleSx}>Datos del comprobante</Typography>

                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <FormControl size="small" fullWidth variant="outlined" error={Boolean(errors.tipo_adquisicion)}>
                        <InputLabel id="tipo-adq-label" shrink sx={{ ...baseFontSx, fontSize: 12 }}>
                          Tipo adquisición
                        </InputLabel>
                        <Select
                          labelId="tipo-adq-label"
                          label="Tipo adquisición"
                          value={formDataAgregarIngresos.encabezado.tipo_adquisicion || ""}
                          displayEmpty
                          renderValue={(v) => {
                            if (!v) return "SELECCIONE";
                            if (String(v) === "1") return "Factura";
                            if (String(v) === "2") return "Donación";
                            if (String(v) === "3") return "Donación Laboratorios";
                            return v;
                          }}
                          sx={selectSx}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormDataIngreso((p) => ({
                              ...p,
                              encabezado: { ...p.encabezado, tipo_adquisicion: val },
                            }));
                            if (errors.tipo_adquisicion) {
                              setErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.tipo_adquisicion;
                                return copy;
                              });
                            }
                          }}
                        >
                          <MenuItem value="">
                            <Box component="span" sx={baseFontSx}>SELECCIONE</Box>
                          </MenuItem>
                          <MenuItem value="1">Factura</MenuItem>
                          <MenuItem value="2">Donación</MenuItem>
                          <MenuItem value="3">Donación Laboratorios</MenuItem>
                        </Select>
                        {errors.tipo_adquisicion && (
                          <FormHelperText sx={{ ...baseFontSx, fontSize: 11 }}>{errors.tipo_adquisicion}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        id="txt-nro-comprobante"
                        size="small"
                        label="N° comprobante"
                        fullWidth
                        value={formDataAgregarIngresos.encabezado.n_comprobante}
                        onChange={(e) => {
                          setFormDataIngreso((prev) => ({
                            ...prev,
                            encabezado: { ...prev.encabezado, n_comprobante: e.target.value },
                          }));
                          if (errors.n_comprobante) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.n_comprobante;
                              return copy;
                            });
                          }
                        }}
                        error={Boolean(errors.n_comprobante)}
                        helperText={errors.n_comprobante || ""}
                        disabled={isDonacionLaboratorios}
                        sx={textFieldSx}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="Fecha emisión"
                        value={
                          formDataAgregarIngresos.encabezado.fecha_emision
                            ? dayjs(formDataAgregarIngresos.encabezado.fecha_emision)
                            : null
                        }
                        onChange={(v) => {
                          setFormDataIngreso((prev) => ({
                            ...prev,
                            encabezado: {
                              ...prev.encabezado,
                              fecha_emision: v ? dayjs(v).format("YYYY-MM-DD") : "",
                            },
                          }));
                          if (errors.fecha_emision) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.fecha_emision;
                              return copy;
                            });
                          }
                        }}
                        disabled={isDonacionLaboratorios}
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            error: Boolean(errors.fecha_emision),
                            helperText: errors.fecha_emision || "",
                            sx: textFieldSx,
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="Fecha vencimiento"
                        value={
                          formDataAgregarIngresos.encabezado.fecha_vencimiento
                            ? dayjs(formDataAgregarIngresos.encabezado.fecha_vencimiento)
                            : null
                        }
                        onChange={(v) => {
                          setFormDataIngreso((prev) => ({
                            ...prev,
                            encabezado: {
                              ...prev.encabezado,
                              fecha_vencimiento: v ? dayjs(v).format("YYYY-MM-DD") : "",
                            },
                          }));
                          if (errors.fecha_vencimiento) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.fecha_vencimiento;
                              return copy;
                            });
                          }
                        }}
                        disabled={isDonacionLaboratorios}
                        slotProps={{
                          textField: {
                            size: "small",
                            fullWidth: true,
                            error: Boolean(errors.fecha_vencimiento),
                            helperText: errors.fecha_vencimiento || "",
                            sx: textFieldSx,
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography sx={{ ...baseFontSx, fontSize: 11, fontWeight: 900, color: ui.head }}>
                        Evidencia (PDF)
                      </Typography>

                      <Grid container spacing={1} sx={{ mt: 0.75 }}>
                        <Grid item>
                          <input
                            ref={fileInputRef}
                            accept="application/pdf"
                            style={{ display: "none" }}
                            id="upload-evidencia"
                            type="file"
                            onChange={(e) => {
                              handleFileEvidenciaChange(e);
                              if (errors.archivo_comprobante) {
                                setErrors((prev) => {
                                  const copy = { ...prev };
                                  delete copy.archivo_comprobante;
                                  return copy;
                                });
                              }
                            }}
                            disabled={isDonacionLaboratorios}
                          />
                          <label htmlFor="upload-evidencia">
                            <Button
                              size="small"
                              variant="contained"
                              component="span"
                              startIcon={<CloudUploadIcon sx={{ fontSize: 16 }} />}
                              sx={{
                                ...baseFontSx,
                                textTransform: "none",
                                backgroundColor: ui.primary,
                                "&:hover": { backgroundColor: "#0f3e73" },
                                borderRadius: 1.5,
                                height: 34,
                                boxShadow: "none",
                                fontSize: 12,
                                px: 1.75,
                              }}
                              disabled={isDonacionLaboratorios}
                            >
                              Subir
                            </Button>
                          </label>
                        </Grid>

                        <Grid item>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PictureAsPdfIcon sx={{ fontSize: 16 }} />}
                            onClick={() => setModalOpen(true)}
                            disabled={!filePreview}
                            sx={{
                              ...baseFontSx,
                              textTransform: "none",
                              borderRadius: 1.5,
                              height: 34,
                              fontSize: 12,
                              px: 1.75,
                              borderColor: ui.border,
                              color: ui.head,
                              "&:hover": { borderColor: ui.primary, bgcolor: "#f3f6ff" },
                            }}
                          >
                            Ver
                          </Button>
                        </Grid>

                        <Grid item>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                            onClick={() => {
                              setFile(null);
                              setFilePreview(null);
                              setFormDataIngreso((p) => ({
                                ...p,
                                encabezado: { ...p.encabezado, archivo_comprobante: null },
                              }));
                              if (fileInputRef.current) fileInputRef.current.value = null;
                              if (errors.archivo_comprobante) {
                                setErrors((prev) => {
                                  const copy = { ...prev };
                                  delete copy.archivo_comprobante;
                                  return copy;
                                });
                              }
                            }}
                            disabled={!file || isDonacionLaboratorios}
                            sx={{
                              ...baseFontSx,
                              textTransform: "none",
                              borderRadius: 1.5,
                              height: 34,
                              fontSize: 12,
                              px: 1.75,
                              borderColor: "#f2c6c2",
                              color: ui.danger,
                              "&:hover": { bgcolor: "#fff5f5", borderColor: ui.danger },
                            }}
                          >
                            Eliminar
                          </Button>
                        </Grid>
                      </Grid>

                      {isDonacionLaboratorios && (
                        <Typography sx={{ ...baseFontSx, mt: 0.8, fontSize: 11, color: ui.muted }}>
                          Para Donación Laboratorios no se requiere comprobante, fechas ni evidencia.
                        </Typography>
                      )}

                      {file && !isDonacionLaboratorios && (
                        <Typography sx={{ ...baseFontSx, mt: 0.6, fontSize: 11, color: ui.muted }}>
                          Archivo: <Box component="span" sx={{ fontWeight: 800 }}>{file.name}</Box>
                        </Typography>
                      )}

                      {errors.archivo_comprobante && (
                        <Typography sx={{ ...baseFontSx, mt: 0.4, fontSize: 11, color: ui.danger }}>
                          {errors.archivo_comprobante}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 2, p: 1.5, bgcolor: "#fff" }}>
                  <Typography sx={sectionTitleSx}>Ubicación del ingreso</Typography>

                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={4}>
                      <FormControl size="small" fullWidth variant="outlined" error={Boolean(errors.select_sede)}>
                        <InputLabel id="ub-sede-label" shrink sx={{ ...baseFontSx, fontSize: 12 }}>
                          Sede
                        </InputLabel>
                        <Select
                          labelId="ub-sede-label"
                          label="Sede"
                          value={formDataAgregarIngresos.encabezado.select_sede}
                          displayEmpty
                          renderValue={(v) =>
                            v ? (dataSede.find((s) => String(s.value) === String(v))?.label ?? v) : "SELECCIONE"
                          }
                          sx={selectSx}
                          onChange={(e) => {
                            const id_sede = e.target.value;

                            setFormDataIngreso((prev) => ({
                              ...prev,
                              encabezado: {
                                ...prev.encabezado,
                                select_sede: id_sede,
                                select_facultad: "",
                                select_bodega: "",
                              },
                              detalleProductos: [],
                            }));

                            setDataFacultad([]);
                            setDataBodega([]);
                            setDataInsumos([]);
                            setDataFilteredInsumos([]);
                            setSearchTermInsumo("");
                            if (id_sede) buscarFacultadSede(Number(id_sede));

                            if (errors.select_sede) {
                              setErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.select_sede;
                                return copy;
                              });
                            }
                          }}
                        >
                          <MenuItem value="">
                            <Box component="span" sx={baseFontSx}>SELECCIONE</Box>
                          </MenuItem>
                          {dataSede.map((s) => (
                            <MenuItem key={s.value} value={String(s.value)}>
                              {s.label}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.select_sede && (
                          <FormHelperText sx={{ ...baseFontSx, fontSize: 11 }}>{errors.select_sede}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl
                        size="small"
                        fullWidth
                        variant="outlined"
                        disabled={!formDataAgregarIngresos.encabezado.select_sede || loadingFacultades}
                        error={Boolean(errors.select_facultad)}
                      >
                        <InputLabel id="ub-fac-label" shrink sx={{ ...baseFontSx, fontSize: 12 }}>
                          Facultad / Dirección
                        </InputLabel>
                        <Select
                          labelId="ub-fac-label"
                          label="Facultad / Dirección"
                          value={formDataAgregarIngresos.encabezado.select_facultad}
                          displayEmpty
                          renderValue={(v) =>
                            v
                              ? dataFacultad.find((f) => String(f.id) === String(v))?.fac_nombre ?? v
                              : loadingFacultades
                                ? "CARGANDO…"
                                : "SELECCIONE"
                          }
                          sx={selectSx}
                          onChange={(e) => {
                            const id_fac = e.target.value;

                            setFormDataIngreso((prev) => ({
                              ...prev,
                              encabezado: {
                                ...prev.encabezado,
                                select_facultad: id_fac,
                                select_bodega: "",
                              },
                              detalleProductos: [],
                            }));

                            setDataBodega([]);
                            setDataInsumos([]);
                            setDataFilteredInsumos([]);
                            setSearchTermInsumo("");

                            const sede = formDataAgregarIngresos.encabezado.select_sede;
                            if (id_fac && sede) buscarBodega(Number(sede), Number(id_fac));

                            if (errors.select_facultad) {
                              setErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.select_facultad;
                                return copy;
                              });
                            }
                          }}
                        >
                          <MenuItem value="">
                            <Box component="span" sx={baseFontSx}>SELECCIONE</Box>
                          </MenuItem>
                          {dataFacultad.map((f) => (
                            <MenuItem key={f.id} value={String(f.id)}>
                              {f.fac_nombre}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.select_facultad && (
                          <FormHelperText sx={{ ...baseFontSx, fontSize: 11 }}>{errors.select_facultad}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl
                        size="small"
                        fullWidth
                        variant="outlined"
                        disabled={!formDataAgregarIngresos.encabezado.select_facultad || loadingBodega}
                        error={Boolean(errors.select_bodega)}
                      >
                        <InputLabel id="ub-bod-label" shrink sx={{ ...baseFontSx, fontSize: 12 }}>
                          Bodega
                        </InputLabel>
                        <Select
                          labelId="ub-bod-label"
                          label="Bodega"
                          value={formDataAgregarIngresos.encabezado.select_bodega}
                          displayEmpty
                          renderValue={(v) => {
                            if (!v) {
                              if (loadingBodega) return "CARGANDO…";
                              if ((dataBodega?.length ?? 0) === 0) return "SIN BODEGAS";
                              return "SELECCIONE";
                            }
                            return dataBodega.find((b) => String(b.bod_id) === String(v))?.bod_nombre ?? v;
                          }}
                          sx={selectSx}
                          onChange={(e) => {
                            const bod = e.target.value;

                            setFormDataIngreso((p) => ({
                              ...p,
                              encabezado: { ...p.encabezado, select_bodega: bod },
                              detalleProductos: [],
                            }));

                            const sede = formDataAgregarIngresos.encabezado.select_sede;
                            const fac = formDataAgregarIngresos.encabezado.select_facultad;
                            setSearchTermInsumo("");
                            setDataFilteredInsumos([]);

                            if (bod && sede && fac) consultarInsumosPorBodega(sede, fac, bod);

                            if (errors.select_bodega) {
                              setErrors((prev) => {
                                const copy = { ...prev };
                                delete copy.select_bodega;
                                return copy;
                              });
                            }
                          }}
                        >
                          {dataBodega.length === 0 ? (
                            <MenuItem value="">
                              <Box component="span" sx={baseFontSx}>SIN BODEGAS</Box>
                            </MenuItem>
                          ) : (
                            [
                              <MenuItem key="sel" value="">
                                <Box component="span" sx={baseFontSx}>SELECCIONE</Box>
                              </MenuItem>,
                              ...dataBodega.map((b) => (
                                <MenuItem key={b.bod_id} value={String(b.bod_id)}>
                                  {b.bod_nombre}
                                </MenuItem>
                              )),
                            ]
                          )}
                        </Select>
                        {errors.select_bodega && (
                          <FormHelperText sx={{ ...baseFontSx, fontSize: 11 }}>{errors.select_bodega}</FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 2, p: 1.5, bgcolor: "#fff" }}>
                  <Typography sx={sectionTitleSx}>Insumos</Typography>

                  <TextField
                    id="txt-buscar-producto"
                    size="small"
                    placeholder="Buscar insumo"
                    value={searchTermInsumo}
                    onChange={(e) => {
                      setSearchTermInsumo(e.target.value);
                      handleSearchInsumoChange(e);
                    }}
                    fullWidth
                    disabled={!formDataAgregarIngresos.encabezado.select_bodega}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={textFieldSx}
                  />

                  {!formDataAgregarIngresos.encabezado.select_bodega && (
                    <Typography sx={{ ...baseFontSx, mt: 0.5, fontSize: 11, color: ui.danger }}>
                      Seleccione una bodega primero
                    </Typography>
                  )}

                  {searchTermInsumo && (
                    <Box sx={{ maxHeight: 240, overflowY: "auto", mt: 1 }}>
                      {dataFilteredInsumos.length === 0 ? (
                        <EmptyState label="SIN RESULTADOS" />
                      ) : (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                          <Table size="small" stickyHeader sx={tableSx}>
                            <TableHead>
                              <TableRow>
                                <TableCell>Id</TableCell>
                                <TableCell>Código</TableCell>
                                <TableCell>Detalle</TableCell>
                                <TableCell>Stock</TableCell>
                                <TableCell>Control</TableCell>
                                <TableCell>Sede</TableCell>
                                <TableCell>Bodega</TableCell>
                                <TableCell sx={{ width: 60 }} />
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {dataFilteredInsumos.map((d) => {
                                const requiereLote = safeBool(d?.requiere_lote);
                                const requiereVencimiento = safeBool(d?.requiere_vencimiento);

                                return (
                                  <TableRow key={d.idInsumo ?? d.id} hover>
                                    <TableCell>{d.idInsumo}</TableCell>
                                    <TableCell>{d.codigo}</TableCell>
                                    <TableCell>{d.ins_descripcion}</TableCell>
                                    <TableCell>{d.stock_bodega}</TableCell>
                                    <TableCell>
                                      <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap>
                                        {requiereLote && (
                                          <Chip size="small" label="Lote" color="warning" variant="outlined" />
                                        )}
                                        {requiereVencimiento && (
                                          <Chip size="small" label="Vencimiento" color="info" variant="outlined" />
                                        )}
                                        {!requiereLote && !requiereVencimiento && (
                                          <Chip size="small" label="Simple" variant="outlined" />
                                        )}
                                      </Stack>
                                    </TableCell>
                                    <TableCell>{d.nombre_sede}</TableCell>
                                    <TableCell>{d.nombre_bodega ?? d.bodega ?? ""}</TableCell>
                                    <TableCell align="center">
                                      <IconButton
                                        onClick={() => handleAgregarInsumoTabla(d)}
                                        size="small"
                                        sx={{ color: ui.primary }}
                                        title="Agregar"
                                      >
                                        <FontAwesomeIcon icon={faPlus} />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </Box>
                  )}

                  <Divider sx={{ my: 1.25 }} />

                  {formDataAgregarIngresos.detalleProductos.length === 0 ? (
                    <EmptyState label="AÚN NO HAY INSUMOS AGREGADOS" />
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                      <Table stickyHeader size="small" sx={tableSx}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ width: 170, textAlign: "center" }}>Cantidad total</TableCell>
                            <TableCell>Insumo</TableCell>
                            <TableCell sx={{ width: 230 }}>Control</TableCell>
                            <TableCell sx={{ width: 230 }}>Lotes</TableCell>
                            <TableCell sx={{ width: 90, textAlign: "center" }}>Acciones</TableCell>
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {formDataAgregarIngresos.detalleProductos.map((row) => {
                            const requiereLote = safeBool(row?.requiere_lote);
                            const requiereVencimiento = safeBool(row?.requiere_vencimiento);
                            const requiereControl = requiereLote || requiereVencimiento;
                            const totalFila = calculateRowTotal(row);

                            return (
                              <React.Fragment key={row.idInsumo}>
                                <TableRow hover>
                                  <TableCell>
                                    {!requiereControl ? (
                                      <TextField
                                        type="number"
                                        size="small"
                                        fullWidth
                                        value={row.cantidad}
                                        onChange={(e) => handleRowInsumoChange(row.idInsumo, e.target.value)}
                                        error={Boolean(errors[`cantidad_${row.idInsumo}`])}
                                        helperText={errors[`cantidad_${row.idInsumo}`] || ""}
                                        sx={textFieldSx}
                                      />
                                    ) : (
                                      <TextField
                                        size="small"
                                        fullWidth
                                        value={totalFila}
                                        disabled
                                        helperText={
                                          errors[`cantidad_${row.idInsumo}`] || "Cantidad calculada por lotes"
                                        }
                                        error={Boolean(errors[`cantidad_${row.idInsumo}`])}
                                        sx={textFieldSx}
                                      />
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    <Typography sx={{ ...baseFontSx, fontWeight: 800, fontSize: 12, color: ui.head }}>
                                      {row.codigo ? `${row.codigo} - ` : ""}
                                      {row.nombre}
                                    </Typography>
                                    <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted, mt: 0.3 }}>
                                      ID insumo: {row.idInsumo}
                                    </Typography>
                                  </TableCell>

                                  <TableCell>
                                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                                      {requiereLote && (
                                        <Chip size="small" label="Requiere lote" color="warning" variant="outlined" />
                                      )}
                                      {requiereVencimiento && (
                                        <Chip size="small" label="Requiere vencimiento" color="info" variant="outlined" />
                                      )}
                                      {!requiereControl && (
                                        <Chip size="small" label="Sin control por lote" variant="outlined" />
                                      )}
                                    </Stack>

                                    {requiereControl && (
                                      <Typography sx={{ ...baseFontSx, mt: 0.8, fontSize: 10.5, color: ui.muted }}>
                                        Si el lote ya existe, escribe el mismo código y la misma fecha de vencimiento.
                                        El sistema sumará stock a ese lote.
                                      </Typography>
                                    )}

                                    {errors[`lotes_${row.idInsumo}`] && (
                                      <Typography sx={{ ...baseFontSx, mt: 0.7, fontSize: 11, color: ui.danger }}>
                                        {errors[`lotes_${row.idInsumo}`]}
                                      </Typography>
                                    )}
                                  </TableCell>

                                  <TableCell>
                                    {requiereControl ? (
                                      <Box>
                                        <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted, mb: 0.8 }}>
                                          {row.lotes?.length || 0} lote(s) agregado(s)
                                        </Typography>

                                        <Button
                                          size="small"
                                          variant="outlined"
                                          startIcon={<FontAwesomeIcon icon={faPlus} />}
                                          onClick={() => handleAgregarLoteProducto(row.idInsumo)}
                                          sx={{
                                            ...baseFontSx,
                                            textTransform: "none",
                                            fontSize: 11,
                                            borderRadius: 1.5,
                                          }}
                                        >
                                          Agregar lote
                                        </Button>
                                      </Box>
                                    ) : (
                                      <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                        Este producto no requiere desglose por lote.
                                      </Typography>
                                    )}
                                  </TableCell>

                                  <TableCell align="center">
                                    <IconButton
                                      onClick={() => handleDeleteFilaInsumo(row.idInsumo)}
                                      sx={{ color: ui.danger }}
                                      title="Eliminar"
                                      size="small"
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>

                                {requiereControl && (
                                  <TableRow>
                                    <TableCell colSpan={5} sx={{ bgcolor: ui.softBlue, py: 1.25 }}>
                                      <Box
                                        sx={{
                                          border: `1px solid ${ui.border}`,
                                          borderRadius: 2,
                                          overflow: "hidden",
                                          bgcolor: "#fff",
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            px: 1.25,
                                            py: 1,
                                            bgcolor: requiereLote ? ui.softYellow : ui.softBlue,
                                            borderBottom: `1px solid ${ui.borderSoft}`,
                                          }}
                                        >
                                          <Typography sx={{ ...baseFontSx, fontWeight: 900, fontSize: 11, color: ui.head }}>
                                            Detalle de lotes para {row.nombre}
                                          </Typography>
                                          <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted, mt: 0.25 }}>
                                            La cantidad total del producto se calcula con la suma de los lotes.
                                          </Typography>
                                        </Box>

                                        {(row.lotes || []).length === 0 ? (
                                          <Box sx={{ p: 1.5 }}>
                                            <EmptyState label="SIN LOTES AGREGADOS" />
                                          </Box>
                                        ) : (
                                          <TableContainer>
                                            <Table size="small" sx={tableSx}>
                                              <TableHead>
                                                <TableRow>
                                                  <TableCell sx={{ width: 220 }}>Código lote</TableCell>
                                                  <TableCell sx={{ width: 180 }}>F. elaboración</TableCell>
                                                  <TableCell sx={{ width: 180 }}>F. vencimiento</TableCell>
                                                  <TableCell sx={{ width: 160 }}>Cantidad</TableCell>
                                                  <TableCell sx={{ width: 90, textAlign: "center" }}>Acción</TableCell>
                                                </TableRow>
                                              </TableHead>
                                              <TableBody>
                                                {row.lotes.map((lote, index) => (
                                                  <TableRow key={`${row.idInsumo}-${index}`} hover>
                                                    <TableCell>
                                                      <TextField
                                                        size="small"
                                                        fullWidth
                                                        value={lote.codigo_lote}
                                                        onChange={(e) =>
                                                          handleLoteChange(
                                                            row.idInsumo,
                                                            index,
                                                            "codigo_lote",
                                                            e.target.value
                                                          )
                                                        }
                                                        disabled={!requiereLote}
                                                        error={Boolean(errors[`l_${row.idInsumo}_${index}_codigo_lote`])}
                                                        helperText={errors[`l_${row.idInsumo}_${index}_codigo_lote`] || ""}
                                                        sx={textFieldSx}
                                                      />
                                                    </TableCell>

                                                    <TableCell>
                                                      <TextField
                                                        size="small"
                                                        type="date"
                                                        fullWidth
                                                        value={lote.fecha_elaboracion}
                                                        onChange={(e) =>
                                                          handleLoteChange(
                                                            row.idInsumo,
                                                            index,
                                                            "fecha_elaboracion",
                                                            e.target.value
                                                          )
                                                        }
                                                        error={Boolean(errors[`l_${row.idInsumo}_${index}_fecha_elaboracion`])}
                                                        helperText={errors[`l_${row.idInsumo}_${index}_fecha_elaboracion`] || ""}
                                                        InputLabelProps={{ shrink: true }}
                                                        sx={textFieldSx}
                                                      />
                                                    </TableCell>

                                                    <TableCell>
                                                      <TextField
                                                        size="small"
                                                        type="date"
                                                        fullWidth
                                                        value={lote.fecha_vencimiento}
                                                        onChange={(e) =>
                                                          handleLoteChange(
                                                            row.idInsumo,
                                                            index,
                                                            "fecha_vencimiento",
                                                            e.target.value
                                                          )
                                                        }
                                                        disabled={!requiereVencimiento}
                                                        error={Boolean(errors[`l_${row.idInsumo}_${index}_fecha_vencimiento`])}
                                                        helperText={errors[`l_${row.idInsumo}_${index}_fecha_vencimiento`] || ""}
                                                        InputLabelProps={{ shrink: true }}
                                                        sx={textFieldSx}
                                                      />
                                                    </TableCell>

                                                    <TableCell>
                                                      <TextField
                                                        type="number"
                                                        size="small"
                                                        fullWidth
                                                        value={lote.cantidad}
                                                        onChange={(e) =>
                                                          handleLoteChange(
                                                            row.idInsumo,
                                                            index,
                                                            "cantidad",
                                                            e.target.value
                                                          )
                                                        }
                                                        error={Boolean(errors[`l_${row.idInsumo}_${index}_cantidad`])}
                                                        helperText={errors[`l_${row.idInsumo}_${index}_cantidad`] || ""}
                                                        sx={textFieldSx}
                                                      />
                                                    </TableCell>

                                                    <TableCell align="center">
                                                      <IconButton
                                                        onClick={() => handleDeleteLoteProducto(row.idInsumo, index)}
                                                        sx={{ color: ui.danger }}
                                                        title="Eliminar lote"
                                                        size="small"
                                                      >
                                                        <DeleteIcon fontSize="small" />
                                                      </IconButton>
                                                    </TableCell>
                                                  </TableRow>
                                                ))}
                                              </TableBody>
                                            </Table>
                                          </TableContainer>
                                        )}
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={onCancelar}
                    sx={{
                      ...baseFontSx,
                      height: 34,
                      borderRadius: 1.5,
                      fontSize: 12,
                      px: 2,
                      textTransform: "none",
                      borderColor: "#f2c6c2",
                      color: ui.danger,
                      "&:hover": { bgcolor: "#fff5f5", borderColor: ui.danger },
                    }}
                  >
                    Cancelar
                  </Button>

                  <Button
                    disabled={loading}
                    onClick={handleGuardarIngresos}
                    startIcon={<SaveIcon sx={{ fontSize: 18 }} />}
                    variant="contained"
                    sx={{
                      ...baseFontSx,
                      height: 34,
                      borderRadius: 1.5,
                      fontSize: 12,
                      px: 2.4,
                      textTransform: "none",
                      backgroundColor: ui.success,
                      "&:hover": { backgroundColor: "#126534" },
                      boxShadow: "none",
                      minWidth: 140,
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={16} color="inherit" />
                        Guardando...
                      </Box>
                    ) : (
                      "Guardar"
                    )}
                  </Button>
                </Box>

                {errors.detalleProductos && (
                  <Typography sx={{ ...baseFontSx, mt: 0.8, fontSize: 11, color: ui.danger, textAlign: "right" }}>
                    {errors.detalleProductos}
                  </Typography>
                )}
                {errors.proveedor && (
                  <Typography sx={{ ...baseFontSx, mt: 0.25, fontSize: 11, color: ui.danger, textAlign: "right" }}>
                    {errors.proveedor}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>

          <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="md">
            <DialogTitle sx={{ ...baseFontSx, fontSize: 13, fontWeight: 900 }}>
              <PictureAsPdfIcon sx={{ mr: 1, verticalAlign: "middle", fontSize: 18 }} />
              Vista previa del comprobante
            </DialogTitle>
            <DialogContent dividers sx={{ p: 1.5 }}>
              {filePreview ? (
                <iframe
                  src={filePreview}
                  title="Vista previa del archivo"
                  width="100%"
                  height="520px"
                  style={{ border: "none", borderRadius: 8 }}
                />
              ) : (
                <Typography sx={{ ...baseFontSx, fontSize: 12 }}>No hay archivo para mostrar.</Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 1.5 }}>
              <Button
                onClick={() => setModalOpen(false)}
                variant="outlined"
                startIcon={<CloseIcon sx={{ fontSize: 18 }} />}
                sx={{
                  ...baseFontSx,
                  height: 34,
                  borderRadius: 1.5,
                  fontSize: 12,
                  px: 2,
                  textTransform: "none",
                  borderColor: "#f2c6c2",
                  color: ui.danger,
                  "&:hover": { bgcolor: "#fff5f5", borderColor: ui.danger },
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default FormularioIngreso;
