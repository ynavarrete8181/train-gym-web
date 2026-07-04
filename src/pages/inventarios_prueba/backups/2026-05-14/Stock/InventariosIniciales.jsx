import React, { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Grid,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    Box,
    FormControl,
    Select,
    MenuItem,
    TextField,
    Tooltip,
    IconButton,
    Divider,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    faEdit,
    faTrashAlt,
    faListAlt,
} from "@fortawesome/free-solid-svg-icons";
import {
    AxGetStockBodegaInsumo,
    AxGetStockBodegaInsumoID,
    consultarSedes,
    consultarFacultades,
    AxGetBodegas,
    AxGuardarInventarioInicial,
} from "../../../../axios/axios_client";
import Swal from "sweetalert2";

const createInitialForm = (idInsumo) => ({
    id_insumo: idInsumo || "",
    select_sede: "",
    select_facultad: "",
    select_bodega: "",
    "txt-stock-inicial": "",
    "txt-stock-minimo": "",
    lotes: [],
});

const createEmptyLote = () => ({
    codigo_lote: "",
    fecha_elaboracion: "",
    fecha_vencimiento: "",
    cantidad_inicial: "",
});

const InventarioInicial = ({ open, onClose, idInsumo, insumoData = null }) => {
    const [dataStockBodegaInsumo, setDataStockBodegaInsumo] = useState([]);
    const [dataSede, setDataSede] = useState([]);
    const [dataFacultad, setDataFacultad] = useState([]);
    const [dataBodega, setDataBodega] = useState([]);

    const [loadingFacultades, setLoadingFacultades] = useState(false);
    const [loadingBodega, setLoadingBodega] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);

    const [errors, setErrors] = useState({});
    const [editingStockId, setEditingStockId] = useState(null);

    const [formDataInventarioInicialInsumo, setFormDataInventarioInicialInsumo] =
        useState(createInitialForm(idInsumo));

    const requiereLote = Boolean(insumoData?.requiere_lote);
    const requiereVencimiento = Boolean(insumoData?.requiere_vencimiento);

    const openSwalOverDialog = (options = {}) =>
        Swal.fire({
            ...options,
            heightAuto: false,
            didOpen: (popup) => {
                const container = Swal.getContainer();
                if (container) {
                    container.style.zIndex = "2500";
                }
                if (typeof options.didOpen === "function") {
                    options.didOpen(popup);
                }
            },
        });

    const escapeHtml = (value = "") =>
        String(value).replace(/[&<>"']/g, (m) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        }[m]));

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

    const totalLotesFormulario = useMemo(() => {
        if (!requiereLote) return 0;
        return (formDataInventarioInicialInsumo.lotes || []).reduce((acc, lote) => {
            const cantidad = Number(lote?.cantidad_inicial || 0);
            return acc + (Number.isNaN(cantidad) ? 0 : cantidad);
        }, 0);
    }, [formDataInventarioInicialInsumo.lotes, requiereLote]);

    const resumenGeneral = useMemo(() => {
        const totalStock = dataStockBodegaInsumo.reduce(
            (acc, row) => acc + toNumber(row.stock_bodega),
            0
        );

        const totalLotes = dataStockBodegaInsumo.reduce(
            (acc, row) => acc + toNumber(row.total_lotes),
            0
        );

        const totalStockLotes = dataStockBodegaInsumo.reduce(
            (acc, row) => acc + toNumber(row.stock_lotes),
            0
        );

        const proximasFechas = dataStockBodegaInsumo
            .map((row) => row.proximo_vencimiento)
            .filter(Boolean)
            .sort();

        return {
            totalStock,
            totalLotes,
            totalStockLotes,
            totalBodegas: dataStockBodegaInsumo.length,
            proximoVencimiento: proximasFechas[0] || null,
        };
    }, [dataStockBodegaInsumo]);

    useEffect(() => {
        if (!open) return;

        setFormDataInventarioInicialInsumo(createInitialForm(idInsumo));
        setErrors({});
        setEditingStockId(null);
        setDataFacultad([]);
        setDataBodega([]);
        fetchDataSede();
        fetchDataStockBodegaInsumo();
    }, [open, idInsumo]);

    const fetchDataStockBodegaInsumo = async () => {
        if (!idInsumo) return;
        setLoading(true);
        try {
            const response = await AxGetStockBodegaInsumo(idInsumo);
            setDataStockBodegaInsumo(Array.isArray(response) ? response : []);
        } catch {
            setDataStockBodegaInsumo([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchDataSede = async () => {
        try {
            const data = await consultarSedes();
            const mapData = (data || []).map((item) => ({
                value: Number(item.id),
                label: item.nombre_sede,
            }));
            setDataSede(mapData);
        } catch (error) {
            openSwalOverDialog({
                title: "¡Error!",
                text: "Error al cargar las Sedes",
                icon: "error",
            });
        }
    };

    const buscarFacultadSede = async (id_sede) => {
        setLoadingFacultades(true);
        try {
            const data = await consultarFacultades(Number(id_sede));
            setDataFacultad(Array.isArray(data) ? data : []);
        } catch (error) {
            openSwalOverDialog({
                title: "¡Error!",
                text: "Error al cargar las Facultades",
                icon: "error",
            });
        } finally {
            setLoadingFacultades(false);
        }
    };

    const buscarBodega = async (id_sede, id_facultad) => {
        setLoadingBodega(true);
        try {
            const resp = await AxGetBodegas(Number(id_sede), Number(id_facultad));
            const bodegas = Array.isArray(resp) ? resp : resp?.data ?? [];
            setDataBodega(bodegas);
        } catch (error) {
            setDataBodega([]);
            openSwalOverDialog({
                title: "¡Error!",
                text: "Error al cargar las Bodegas",
                icon: "error",
            });
        } finally {
            setLoadingBodega(false);
        }
    };

    const clearError = (key) => {
        setErrors((prev) => {
            const copy = { ...prev };
            delete copy[key];
            return copy;
        });
    };

    const handleChangeField = (key, value) => {
        setFormDataInventarioInicialInsumo((prev) => ({
            ...prev,
            [key]: value,
        }));

        if (errors[key]) clearError(key);
    };

    const handleAddLote = () => {
        setFormDataInventarioInicialInsumo((prev) => ({
            ...prev,
            lotes: [...(prev.lotes || []), createEmptyLote()],
        }));
    };

    const handleRemoveLote = (index) => {
        setFormDataInventarioInicialInsumo((prev) => {
            const nuevosLotes = [...(prev.lotes || [])];
            nuevosLotes.splice(index, 1);
            return {
                ...prev,
                lotes: nuevosLotes,
            };
        });

        setErrors((prev) => {
            const copy = { ...prev };
            delete copy[`lote_${index}`];
            delete copy["lotes"];
            return copy;
        });
    };

    const handleChangeLote = (index, field, value) => {
        setFormDataInventarioInicialInsumo((prev) => {
            const nuevosLotes = [...(prev.lotes || [])];
            nuevosLotes[index] = {
                ...(nuevosLotes[index] || createEmptyLote()),
                [field]: value,
            };
            return {
                ...prev,
                lotes: nuevosLotes,
            };
        });

        if (errors[`lote_${index}`] || errors["lotes"]) {
            setErrors((prev) => {
                const copy = { ...prev };
                delete copy[`lote_${index}`];
                delete copy["lotes"];
                return copy;
            });
        }
    };

    const resetFormAfterSave = () => {
        setFormDataInventarioInicialInsumo(createInitialForm(idInsumo));
        setDataFacultad([]);
        setDataBodega([]);
        setErrors({});
        setEditingStockId(null);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formDataInventarioInicialInsumo.select_sede) {
            newErrors["select_sede"] = "Debe seleccionar una sede.";
        }

        if (!formDataInventarioInicialInsumo.select_facultad) {
            newErrors["select_facultad"] =
                "Debe seleccionar una facultad / dirección.";
        }

        if (!formDataInventarioInicialInsumo.select_bodega) {
            newErrors["select_bodega"] = "Debe seleccionar una bodega.";
        }

        const stockMinimo = Number(
            formDataInventarioInicialInsumo["txt-stock-minimo"] || 0
        );

        if (
            formDataInventarioInicialInsumo["txt-stock-minimo"] === "" ||
            Number.isNaN(stockMinimo) ||
            stockMinimo < 0
        ) {
            newErrors["txt-stock-minimo"] =
                "El stock mínimo no puede ser negativo.";
        }

        if (!requiereLote) {
            const stockInicial = Number(
                formDataInventarioInicialInsumo["txt-stock-inicial"] || 0
            );

            if (
                formDataInventarioInicialInsumo["txt-stock-inicial"] === "" ||
                Number.isNaN(stockInicial) ||
                stockInicial <= 0
            ) {
                newErrors["txt-stock-inicial"] =
                    "El stock inicial debe ser mayor a 0.";
            }
        } else {
            const lotes = formDataInventarioInicialInsumo.lotes || [];

            if (lotes.length === 0) {
                newErrors["lotes"] = "Debe agregar al menos un lote.";
            }

            lotes.forEach((lote, index) => {
                const mensajes = [];

                if (!lote.codigo_lote?.trim()) mensajes.push("Ingrese código de lote");
                if (!lote.fecha_elaboracion)
                    mensajes.push("Ingrese fecha de elaboración");

                if (requiereVencimiento && !lote.fecha_vencimiento) {
                    mensajes.push("Ingrese fecha de vencimiento");
                }

                if (
                    lote.fecha_elaboracion &&
                    lote.fecha_vencimiento &&
                    lote.fecha_vencimiento < lote.fecha_elaboracion
                ) {
                    mensajes.push(
                        "La fecha de vencimiento no puede ser menor a elaboración"
                    );
                }

                const cantidad = Number(lote.cantidad_inicial || 0);
                if (!lote.cantidad_inicial || Number.isNaN(cantidad) || cantidad <= 0) {
                    mensajes.push("La cantidad debe ser mayor a 0");
                }

                if (mensajes.length > 0) {
                    newErrors[`lote_${index}`] = mensajes.join(" · ");
                }
            });

            if (totalLotesFormulario <= 0) {
                newErrors["lotes"] = "El total de lotes debe ser mayor a 0.";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGuardarInventarioInicial = async () => {
        if (!validateForm()) return;

        const payload = {
            id_insumo: idInsumo,
            id_stock_bodega: editingStockId,
            select_sede: formDataInventarioInicialInsumo.select_sede,
            select_facultad: formDataInventarioInicialInsumo.select_facultad,
            select_bodega: formDataInventarioInicialInsumo.select_bodega,
            "txt-stock-minimo": formDataInventarioInicialInsumo["txt-stock-minimo"],
            requiere_lote: requiereLote,
            requiere_vencimiento: requiereVencimiento,
        };

        if (!requiereLote) {
            payload["txt-stock-inicial"] =
                formDataInventarioInicialInsumo["txt-stock-inicial"];
        } else {
            payload["txt-stock-inicial"] = totalLotesFormulario;
            payload.lotes = (formDataInventarioInicialInsumo.lotes || []).map((l) => ({
                codigo_lote: l.codigo_lote,
                fecha_elaboracion: l.fecha_elaboracion,
                fecha_vencimiento: l.fecha_vencimiento || null,
                cantidad_inicial: Number(l.cantidad_inicial),
            }));
        }

        setLoadingSave(true);
        try {
            const data = await AxGuardarInventarioInicial(payload);

            openSwalOverDialog({
                title: data?.success ? "Éxito" : "Atención",
                text: data?.message || "Proceso finalizado.",
                icon: data?.success ? "success" : "warning",
                confirmButtonColor: "#144985",
            }).then(() => {
                if (data?.success) {
                    resetFormAfterSave();
                    fetchDataStockBodegaInsumo();
                }
            });
        } catch (error) {
            openSwalOverDialog({
                title: "Error",
                text: error?.message || "No se pudo guardar el ingreso.",
                icon: "error",
                confirmButtonColor: "#d33",
            });
        } finally {
            setLoadingSave(false);
        }
    };

    const handleFetchDataStockBodegaInsumoId = async (id) => {
        if (!id) return;
        setLoading(true);

        try {
            const response = await AxGetStockBodegaInsumoID(id);
            const row = Array.isArray(response) ? response[0] : response;

            if (!row) return;

            if (dataSede.length === 0) {
                await fetchDataSede();
            }

            setEditingStockId(row.sb_id || row.id || null);

            setFormDataInventarioInicialInsumo((prev) => ({
                ...prev,
                id_insumo: String(idInsumo),
                select_sede: row.bod_id_sede ? String(row.bod_id_sede) : "",
                select_facultad: row.bod_id_facultad
                    ? String(row.bod_id_facultad)
                    : "",
                select_bodega: row.sb_id_bodega ? String(row.sb_id_bodega) : "",
                "txt-stock-inicial": row.stock_bodega ?? row.sb_cantidad_inicial ?? "",
                "txt-stock-minimo": row.sb_stock_minimo ?? "",
                lotes: Array.isArray(row.lotes)
                    ? row.lotes.map((l) => ({
                        codigo_lote: l.codigo_lote || "",
                        fecha_elaboracion: l.fecha_elaboracion || "",
                        fecha_vencimiento: l.fecha_vencimiento || "",
                        cantidad_inicial: l.cantidad_inicial ?? l.cantidad_actual ?? "",
                    }))
                    : [],
            }));

            if (row.bod_id_sede) {
                await buscarFacultadSede(row.bod_id_sede);
            }

            if (row.bod_id_sede && row.bod_id_facultad) {
                await buscarBodega(row.bod_id_sede, row.bod_id_facultad);
            }

            setErrors({});
        } catch (error) {
            openSwalOverDialog({
                title: "Error",
                text: "No se pudo cargar el registro a editar.",
                icon: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerLotesBodega = async (sbId) => {
        openSwalOverDialog({
            title: "Cargando lotes...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        try {
            const response = await AxGetStockBodegaInsumoID(sbId);
            const row = Array.isArray(response) ? response[0] : response;
            const lotes = Array.isArray(row?.lotes) ? row.lotes : [];

            if (!row) {
                openSwalOverDialog({
                    title: "Atención",
                    text: "No se encontró el detalle del registro.",
                    icon: "warning",
                });
                return;
            }

            const totalInicial = lotes.reduce(
                (acc, lote) => acc + toNumber(lote.cantidad_inicial),
                0
            );

            const totalActual = lotes.reduce(
                (acc, lote) => acc + toNumber(lote.cantidad_actual),
                0
            );

            const rowsHtml =
                lotes.length > 0
                    ? lotes
                        .map(
                            (l, i) => `
                  <tr>
                    <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:center;">${i + 1
                                }</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;font-weight:600;color:#1f3a5f;">
                      ${escapeHtml(l.codigo_lote || "-")}
                    </td>
                    <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;">
                      ${formatDate(l.fecha_elaboracion)}
                    </td>
                    <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;">
                      ${formatDate(l.fecha_vencimiento)}
                    </td>
                    <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;font-variant-numeric:tabular-nums;">
                      ${formatQty(l.cantidad_inicial)}
                    </td>
                    <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:right;font-variant-numeric:tabular-nums;">
                      ${formatQty(l.cantidad_actual)}
                    </td>
                    <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;">
                      <span style="
                        display:inline-block;
                        padding:4px 10px;
                        border-radius:999px;
                        background:#eef4ff;
                        color:#144985;
                        font-size:11px;
                        font-weight:700;
                        border:1px solid #d7e3f8;
                      ">
                        ${escapeHtml(l.nombre_estado_lote || "-")}
                      </span>
                    </td>
                  </tr>
                `
                        )
                        .join("")
                    : `
            <tr>
              <td colspan="7" style="padding:18px;text-align:center;color:#667085;">
                No hay lotes registrados para esta bodega.
              </td>
            </tr>
          `;

            const html = `
        <div style="font-family:Arial, sans-serif;text-align:left;color:#344054;">

          <div style="
            border:1px solid #e6ebf2;
            border-radius:16px;
            overflow:hidden;
            background:#ffffff;
            box-shadow:0 6px 18px rgba(16,24,40,0.06);
            margin-bottom:16px;
          ">
            <div style="padding:18px 20px 8px 20px;">
              <div style="
                display:grid;
                grid-template-columns:1fr 220px;
                gap:16px;
                align-items:end;
                border-bottom:1px solid #eef2f7;
                padding-bottom:14px;
                margin-bottom:14px;
              ">
                <div>
                  <div style="
                    font-size:11px;
                    color:#667085;
                    text-transform:uppercase;
                    font-weight:700;
                    margin-bottom:4px;
                  ">
                    Producto
                  </div>
                  <div style="
                    font-size:22px;
                    font-weight:800;
                    color:#101828;
                    line-height:1.2;
                  ">
                    ${escapeHtml(row.ins_descripcion || "-")}
                  </div>
                </div>

                <div>
                  <div style="
                    font-size:11px;
                    color:#667085;
                    text-transform:uppercase;
                    font-weight:700;
                    margin-bottom:4px;
                  ">
                    Código
                  </div>
                  <div style="
                    font-size:18px;
                    font-weight:700;
                    color:#1f3a5f;
                    line-height:1.2;
                  ">
                    ${escapeHtml(row.codigo || "-")}
                  </div>
                </div>
              </div>

              <div style="
                display:grid;
                grid-template-columns:repeat(3, minmax(180px, 1fr));
                gap:18px;
              ">
                <div>
                  <div style="
                    font-size:11px;
                    color:#667085;
                    text-transform:uppercase;
                    font-weight:700;
                    margin-bottom:4px;
                  ">
                    Sede
                  </div>
                  <div style="
                    font-size:15px;
                    font-weight:600;
                    color:#101828;
                    line-height:1.35;
                  ">
                    ${escapeHtml(row.nombre_sede || "-")}
                  </div>
                </div>

                <div>
                  <div style="
                    font-size:11px;
                    color:#667085;
                    text-transform:uppercase;
                    font-weight:700;
                    margin-bottom:4px;
                  ">
                    Facultad
                  </div>
                  <div style="
                    font-size:15px;
                    font-weight:600;
                    color:#101828;
                    line-height:1.35;
                  ">
                    ${escapeHtml(row.fac_nombre || "-")}
                  </div>
                </div>

                <div>
                  <div style="
                    font-size:11px;
                    color:#667085;
                    text-transform:uppercase;
                    font-weight:700;
                    margin-bottom:4px;
                  ">
                    Bodega
                  </div>
                  <div style="
                    font-size:15px;
                    font-weight:600;
                    color:#101828;
                    line-height:1.35;
                  ">
                    ${escapeHtml(row.nombre_bodega || "-")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style="
            display:grid;
            grid-template-columns:repeat(4, minmax(180px, 1fr));
            gap:14px;
            margin-bottom:18px;
          ">
            <div style="
              border:1px solid #e6ebf2;
              border-radius:16px;
              padding:14px 16px;
              background:#fff;
              box-shadow:0 4px 12px rgba(16,24,40,0.04);
            ">
              <div style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:10px;
              ">
                <div style="
                  width:34px;
                  height:34px;
                  border-radius:10px;
                  background:#eef4ff;
                  color:#144985;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:16px;
                  font-weight:700;
                ">
                  📦
                </div>
                <div style="
                  font-size:11px;
                  color:#667085;
                  text-transform:uppercase;
                  font-weight:700;
                  letter-spacing:.4px;
                ">
                  Total lotes
                </div>
              </div>
              <div style="
                font-size:26px;
                font-weight:800;
                color:#1f3a5f;
                line-height:1.1;
              ">
                ${lotes.length}
              </div>
            </div>

            <div style="
              border:1px solid #e6ebf2;
              border-radius:16px;
              padding:14px 16px;
              background:#fff;
              box-shadow:0 4px 12px rgba(16,24,40,0.04);
            ">
              <div style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:10px;
              ">
                <div style="
                  width:34px;
                  height:34px;
                  border-radius:10px;
                  background:#f5f3ff;
                  color:#6941c6;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:16px;
                  font-weight:700;
                ">
                  ⇡
                </div>
                <div style="
                  font-size:11px;
                  color:#667085;
                  text-transform:uppercase;
                  font-weight:700;
                  letter-spacing:.4px;
                ">
                  Cant. inicial
                </div>
              </div>
              <div style="
                font-size:26px;
                font-weight:800;
                color:#101828;
                line-height:1.1;
                font-variant-numeric:tabular-nums;
              ">
                ${formatQty(totalInicial)}
              </div>
            </div>

            <div style="
              border:1px solid #e6ebf2;
              border-radius:16px;
              padding:14px 16px;
              background:#fff;
              box-shadow:0 4px 12px rgba(16,24,40,0.04);
            ">
              <div style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:10px;
              ">
                <div style="
                  width:34px;
                  height:34px;
                  border-radius:10px;
                  background:#ecfdf3;
                  color:#039855;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:16px;
                  font-weight:700;
                ">
                  ✓
                </div>
                <div style="
                  font-size:11px;
                  color:#667085;
                  text-transform:uppercase;
                  font-weight:700;
                  letter-spacing:.4px;
                ">
                  Stock actual
                </div>
              </div>
              <div style="
                font-size:26px;
                font-weight:800;
                color:#16a34a;
                line-height:1.1;
                font-variant-numeric:tabular-nums;
              ">
                ${formatQty(totalActual)}
              </div>
            </div>

            <div style="
              border:1px solid #e6ebf2;
              border-radius:16px;
              padding:14px 16px;
              background:#fff;
              box-shadow:0 4px 12px rgba(16,24,40,0.04);
            ">
              <div style="
                display:flex;
                align-items:center;
                gap:10px;
                margin-bottom:10px;
              ">
                <div style="
                  width:34px;
                  height:34px;
                  border-radius:10px;
                  background:#fff7ed;
                  color:#c2410c;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:16px;
                  font-weight:700;
                ">
                  🗓
                </div>
                <div style="
                  font-size:11px;
                  color:#667085;
                  text-transform:uppercase;
                  font-weight:700;
                  letter-spacing:.4px;
                ">
                  Próx. vencimiento
                </div>
              </div>
              <div style="
                font-size:20px;
                font-weight:800;
                color:#b54708;
                line-height:1.2;
              ">
                ${formatDate(row.proximo_vencimiento)}
              </div>
            </div>
          </div>

          <div style="
            border:1px solid #e6ebf2;
            border-radius:16px;
            overflow:hidden;
            background:#fff;
            box-shadow:0 4px 14px rgba(16,24,40,0.05);
          ">
            <div style="
              padding:12px 16px;
              background:#f8fafc;
              border-bottom:1px solid #e6ebf2;
              font-size:13px;
              font-weight:800;
              color:#1f3a5f;
            ">
              Detalle de lotes
            </div>

            <div style="max-height:360px;overflow:auto;">
              <table style="
                width:100%;
                border-collapse:separate;
                border-spacing:0;
                font-size:12px;
              ">
                <thead style="position:sticky;top:0;background:#f3f6fb;z-index:2;">
                  <tr>
                    <th style="padding:10px 12px;text-align:center;color:#1f3a5f;border-bottom:1px solid #dbe4f0;">#</th>
                    <th style="padding:10px 12px;text-align:left;color:#1f3a5f;border-bottom:1px solid #dbe4f0;">Código lote</th>
                    <th style="padding:10px 12px;text-align:left;color:#1f3a5f;border-bottom:1px solid #dbe4f0;">Elaboración</th>
                    <th style="padding:10px 12px;text-align:left;color:#1f3a5f;border-bottom:1px solid #dbe4f0;">Vencimiento</th>
                    <th style="padding:10px 12px;text-align:right;color:#1f3a5f;border-bottom:1px solid #dbe4f0;">Cant. inicial</th>
                    <th style="padding:10px 12px;text-align:right;color:#1f3a5f;border-bottom:1px solid #dbe4f0;">Cant. actual</th>
                    <th style="padding:10px 12px;text-align:left;color:#1f3a5f;border-bottom:1px solid #dbe4f0;">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

            openSwalOverDialog({
                title: "",
                html,
                width: 1180,
                confirmButtonText: "Cerrar",
                showCloseButton: true,
                customClass: {
                    popup: "swal-lotes-profesional",
                },
            });
        } catch (error) {
            openSwalOverDialog({
                title: "Error",
                text: "No se pudo obtener el detalle de lotes.",
                icon: "error",
            });
        }
    };

    const handleEliminarIngresos = async (id) => {
        openSwalOverDialog({
            title: "Pendiente",
            text: `Falta implementar la eliminación del stock inicial (id ${id}).`,
            icon: "info",
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="xl"
            PaperProps={{
                sx: {
                    overflow: "visible",
                },
            }}
        >
            <DialogTitle
                sx={{
                    backgroundColor: "#0a2442",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: 12,
                }}
            >
                Detalle del Stock Inicial del Insumo
            </DialogTitle>

            <DialogContent sx={{ backgroundColor: "#fafbfd", minHeight: "200px" }}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: 12, color: "#1f3a5f", fontWeight: 700 }}>
                            Tipo de control:
                            <Box component="span" sx={{ ml: 1, fontWeight: 500 }}>
                                {requiereLote
                                    ? requiereVencimiento
                                        ? "Por bodega y por lote con vencimiento"
                                        : "Por bodega y por lote"
                                    : "Solo por bodega"}
                            </Box>
                        </Typography>
                    </Box>

                    <Grid container spacing={1.5} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                variant="outlined"
                                sx={{ p: 1.5, borderRadius: 2, borderColor: "#e6ebf2" }}
                            >
                                <Typography sx={{ fontSize: 11, color: "#667085" }}>
                                    Stock total general
                                </Typography>
                                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1f3a5f" }}>
                                    {formatQty(resumenGeneral.totalStock)}
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                variant="outlined"
                                sx={{ p: 1.5, borderRadius: 2, borderColor: "#e6ebf2" }}
                            >
                                <Typography sx={{ fontSize: 11, color: "#667085" }}>
                                    Total lotes
                                </Typography>
                                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1f3a5f" }}>
                                    {formatQty(resumenGeneral.totalLotes)}
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                variant="outlined"
                                sx={{ p: 1.5, borderRadius: 2, borderColor: "#e6ebf2" }}
                            >
                                <Typography sx={{ fontSize: 11, color: "#667085" }}>
                                    Bodegas con stock
                                </Typography>
                                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1f3a5f" }}>
                                    {resumenGeneral.totalBodegas}
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Paper
                                variant="outlined"
                                sx={{ p: 1.5, borderRadius: 2, borderColor: "#e6ebf2" }}
                            >
                                <Typography sx={{ fontSize: 11, color: "#667085" }}>
                                    Próximo vencimiento
                                </Typography>
                                <Typography sx={{ fontSize: 16, fontWeight: 800, color: "#1f3a5f" }}>
                                    {formatDate(resumenGeneral.proximoVencimiento)}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Box sx={{ overflowX: "auto" }}>
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    border: "1px solid #e6ebf2",
                                    borderRadius: 2,
                                    backgroundColor: "#fff",
                                    position: "relative",
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        position: "absolute",
                                        top: -12,
                                        left: 20,
                                        bgcolor: "#fff",
                                        px: 1.5,
                                        fontWeight: "bold",
                                        color: "#144985",
                                        fontSize: 12,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    Ubicación del Ingreso
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={4}>
                                        <FormControl
                                            size="small"
                                            fullWidth
                                            error={Boolean(errors["select_sede"])}
                                        >
                                            <Select
                                                value={formDataInventarioInicialInsumo.select_sede}
                                                onChange={(e) => {
                                                    const id_sede = e.target.value;
                                                    setFormDataInventarioInicialInsumo((prev) => ({
                                                        ...prev,
                                                        select_sede: id_sede,
                                                        select_facultad: "",
                                                        select_bodega: "",
                                                    }));
                                                    setDataFacultad([]);
                                                    setDataBodega([]);
                                                    if (id_sede) buscarFacultadSede(Number(id_sede));
                                                    clearError("select_sede");
                                                }}
                                                displayEmpty
                                                renderValue={(v) =>
                                                    !v ? (
                                                        <em>Seleccione Sede</em>
                                                    ) : (
                                                        dataSede.find((s) => String(s.value) === String(v))
                                                            ?.label ?? v
                                                    )
                                                }
                                                sx={{
                                                    fontSize: "12px",
                                                    "& .MuiSelect-select": {
                                                        fontSize: "12px",
                                                    },
                                                }}
                                            >
                                                <MenuItem value="">
                                                    <em>Seleccione Sede</em>
                                                </MenuItem>
                                                {dataSede.map((s) => (
                                                    <MenuItem key={s.value} value={String(s.value)}>
                                                        {s.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {errors["select_sede"] && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                                    {errors["select_sede"]}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <FormControl
                                            size="small"
                                            fullWidth
                                            disabled={
                                                !formDataInventarioInicialInsumo.select_sede ||
                                                loadingFacultades
                                            }
                                            error={Boolean(errors["select_facultad"])}
                                        >
                                            <Select
                                                value={formDataInventarioInicialInsumo.select_facultad}
                                                onChange={(e) => {
                                                    const id_fac = e.target.value;
                                                    setFormDataInventarioInicialInsumo((prev) => ({
                                                        ...prev,
                                                        select_facultad: id_fac,
                                                        select_bodega: "",
                                                    }));
                                                    setDataBodega([]);
                                                    const sede = formDataInventarioInicialInsumo.select_sede;
                                                    if (id_fac && sede) {
                                                        buscarBodega(Number(sede), Number(id_fac));
                                                    }
                                                    clearError("select_facultad");
                                                }}
                                                displayEmpty
                                                renderValue={(v) =>
                                                    !v ? (
                                                        <em>
                                                            {loadingFacultades
                                                                ? "Cargando..."
                                                                : "Seleccione Facultad"}
                                                        </em>
                                                    ) : (
                                                        dataFacultad.find((f) => String(f.id) === String(v))
                                                            ?.fac_nombre ?? v
                                                    )
                                                }
                                                sx={{
                                                    fontSize: "12px",
                                                    "& .MuiSelect-select": {
                                                        fontSize: "12px",
                                                    },
                                                }}
                                            >
                                                <MenuItem value="">
                                                    <em>Seleccione Facultad</em>
                                                </MenuItem>
                                                {dataFacultad.map((f) => (
                                                    <MenuItem key={f.id} value={String(f.id)}>
                                                        {f.fac_nombre}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {errors["select_facultad"] && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                                    {errors["select_facultad"]}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} md={4}>
                                        <FormControl
                                            size="small"
                                            fullWidth
                                            disabled={
                                                !formDataInventarioInicialInsumo.select_facultad ||
                                                loadingBodega
                                            }
                                            error={Boolean(errors["select_bodega"])}
                                        >
                                            <Select
                                                value={formDataInventarioInicialInsumo.select_bodega}
                                                onChange={(e) => {
                                                    handleChangeField("select_bodega", e.target.value);
                                                }}
                                                displayEmpty
                                                renderValue={(v) => {
                                                    if (!v) {
                                                        if (loadingBodega) return <em>Cargando...</em>;
                                                        if ((dataBodega?.length ?? 0) === 0) {
                                                            return <em>Sin bodegas disponibles</em>;
                                                        }
                                                        return <em>Seleccione Bodega</em>;
                                                    }
                                                    return (
                                                        dataBodega.find((b) => String(b.bod_id) === String(v))
                                                            ?.bod_nombre ?? v
                                                    );
                                                }}
                                                sx={{
                                                    fontSize: "12px",
                                                    "& .MuiSelect-select": {
                                                        fontSize: "12px",
                                                    },
                                                }}
                                            >
                                                {dataBodega.length === 0 ? (
                                                    <MenuItem value="">
                                                        <em>Sin bodegas disponibles</em>
                                                    </MenuItem>
                                                ) : (
                                                    [
                                                        <MenuItem key="sel" value="">
                                                            <em>Seleccione Bodega</em>
                                                        </MenuItem>,
                                                        ...dataBodega.map((b) => (
                                                            <MenuItem key={b.bod_id} value={String(b.bod_id)}>
                                                                {b.bod_nombre}
                                                            </MenuItem>
                                                        )),
                                                    ]
                                                )}
                                            </Select>
                                            {errors["select_bodega"] && (
                                                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                                                    {errors["select_bodega"]}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Box>

                    <Box sx={{ overflowX: "auto" }}>
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    border: "1px solid #e6ebf2",
                                    borderRadius: 2,
                                    backgroundColor: "#fff",
                                    position: "relative",
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        position: "absolute",
                                        top: -12,
                                        left: 20,
                                        bgcolor: "#fff",
                                        px: 1.5,
                                        fontWeight: "bold",
                                        color: "#144985",
                                        fontSize: 12,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    Stock en inventario
                                </Typography>

                                <Grid container spacing={2}>
                                    {!requiereLote ? (
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                label="Stock Inicial"
                                                variant="outlined"
                                                fullWidth
                                                size="small"
                                                value={
                                                    formDataInventarioInicialInsumo["txt-stock-inicial"] ?? ""
                                                }
                                                onChange={(e) =>
                                                    handleChangeField("txt-stock-inicial", e.target.value)
                                                }
                                                error={!!errors["txt-stock-inicial"]}
                                                helperText={errors["txt-stock-inicial"] || ""}
                                                sx={{
                                                    "& .MuiInputBase-input": { fontSize: "12px" },
                                                    "& .MuiInputLabel-root": { fontSize: "12px" },
                                                    "& .MuiFormHelperText-root": { fontSize: "11px" },
                                                }}
                                            />
                                        </Grid>
                                    ) : (
                                        <Grid item xs={12} sm={4}>
                                            <TextField
                                                label="Total por lotes"
                                                variant="outlined"
                                                fullWidth
                                                size="small"
                                                value={totalLotesFormulario}
                                                InputProps={{ readOnly: true }}
                                                sx={{
                                                    "& .MuiInputBase-input": { fontSize: "12px" },
                                                    "& .MuiInputLabel-root": { fontSize: "12px" },
                                                }}
                                            />
                                        </Grid>
                                    )}

                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Stock Mínimo"
                                            variant="outlined"
                                            fullWidth
                                            size="small"
                                            value={
                                                formDataInventarioInicialInsumo["txt-stock-minimo"] ?? ""
                                            }
                                            onChange={(e) =>
                                                handleChangeField("txt-stock-minimo", e.target.value)
                                            }
                                            error={!!errors["txt-stock-minimo"]}
                                            helperText={errors["txt-stock-minimo"] || ""}
                                            sx={{
                                                "& .MuiInputBase-input": { fontSize: "12px" },
                                                "& .MuiInputLabel-root": { fontSize: "12px" },
                                                "& .MuiFormHelperText-root": { fontSize: "11px" },
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                                {requiereLote && (
                                    <>
                                        <Divider sx={{ my: 2 }} />

                                        <Box
                                            sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                mb: 1.5,
                                            }}
                                        >
                                            <Typography
                                                sx={{ fontSize: "12px", fontWeight: 700, color: "#1f3a5f" }}
                                            >
                                                Detalle de lotes
                                            </Typography>

                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<AddIcon />}
                                                onClick={handleAddLote}
                                                sx={{ fontSize: "12px", textTransform: "none" }}
                                            >
                                                Agregar lote
                                            </Button>
                                        </Box>

                                        {errors["lotes"] && (
                                            <Typography sx={{ fontSize: 11, color: "#d32f2f", mb: 1 }}>
                                                {errors["lotes"]}
                                            </Typography>
                                        )}

                                        <Table
                                            size="small"
                                            sx={{
                                                "& th, & td": {
                                                    fontSize: "12px",
                                                    p: "6px",
                                                },
                                            }}
                                        >
                                            <TableHead>
                                                <TableRow
                                                    sx={{
                                                        "& th": {
                                                            bgcolor: "#f0f4f9",
                                                            fontWeight: 800,
                                                            color: "#1f3a5f",
                                                        },
                                                    }}
                                                >
                                                    <TableCell>Código lote</TableCell>
                                                    <TableCell>Elaboración</TableCell>
                                                    <TableCell>Vencimiento</TableCell>
                                                    <TableCell>Cantidad</TableCell>
                                                    <TableCell align="center">Acción</TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {(formDataInventarioInicialInsumo.lotes || []).length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} align="center">
                                                            No hay lotes agregados.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    (formDataInventarioInicialInsumo.lotes || []).map(
                                                        (lote, idx) => (
                                                            <React.Fragment key={idx}>
                                                                <TableRow>
                                                                    <TableCell>
                                                                        <TextField
                                                                            size="small"
                                                                            fullWidth
                                                                            value={lote.codigo_lote || ""}
                                                                            onChange={(e) =>
                                                                                handleChangeLote(
                                                                                    idx,
                                                                                    "codigo_lote",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            placeholder="Ej: LOTE-001"
                                                                        />
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        <TextField
                                                                            size="small"
                                                                            type="date"
                                                                            fullWidth
                                                                            value={lote.fecha_elaboracion || ""}
                                                                            onChange={(e) =>
                                                                                handleChangeLote(
                                                                                    idx,
                                                                                    "fecha_elaboracion",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            InputLabelProps={{ shrink: true }}
                                                                        />
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        <TextField
                                                                            size="small"
                                                                            type="date"
                                                                            fullWidth
                                                                            value={lote.fecha_vencimiento || ""}
                                                                            onChange={(e) =>
                                                                                handleChangeLote(
                                                                                    idx,
                                                                                    "fecha_vencimiento",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            InputLabelProps={{ shrink: true }}
                                                                            disabled={!requiereVencimiento}
                                                                        />
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        <TextField
                                                                            size="small"
                                                                            type="number"
                                                                            fullWidth
                                                                            value={lote.cantidad_inicial || ""}
                                                                            onChange={(e) =>
                                                                                handleChangeLote(
                                                                                    idx,
                                                                                    "cantidad_inicial",
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            inputProps={{ min: 0, step: 1 }}
                                                                        />
                                                                    </TableCell>

                                                                    <TableCell align="center">
                                                                        <IconButton
                                                                            color="error"
                                                                            size="small"
                                                                            onClick={() => handleRemoveLote(idx)}
                                                                        >
                                                                            <DeleteIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </TableCell>
                                                                </TableRow>

                                                                {errors[`lote_${idx}`] && (
                                                                    <TableRow>
                                                                        <TableCell colSpan={5} sx={{ py: 0.5 }}>
                                                                            <Typography
                                                                                sx={{ fontSize: 11, color: "#d32f2f" }}
                                                                            >
                                                                                {errors[`lote_${idx}`]}
                                                                            </Typography>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </React.Fragment>
                                                        )
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </>
                                )}
                            </Paper>
                        </Grid>

                        <Grid
                            item
                            xs={12}
                            sm={4}
                            sx={{ display: "flex", mt: 2, justifyContent: "right" }}
                        >
                            <Button
                                disabled={loadingSave}
                                onClick={handleGuardarInventarioInicial}
                                startIcon={<SaveIcon />}
                                variant="contained"
                                sx={{
                                    borderRadius: 2,
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
                                {loadingSave ? (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <CircularProgress size={16} color="inherit" />
                                        Guardando...
                                    </Box>
                                ) : editingStockId ? (
                                    "Actualizar"
                                ) : (
                                    "Guardar"
                                )}
                            </Button>
                        </Grid>
                    </Box>

                    <Box sx={{ overflowX: "auto" }}>
                        <Grid item xs={12} sx={{ mt: 2 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    border: "1px solid #e6ebf2",
                                    borderRadius: 2,
                                    backgroundColor: "#fff",
                                    position: "relative",
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        position: "absolute",
                                        top: -12,
                                        left: 20,
                                        bgcolor: "#fff",
                                        px: 1.5,
                                        fontWeight: "bold",
                                        color: "#144985",
                                        fontSize: 12,
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    Detalle de stock por bodega
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Table
                                            size="small"
                                            sx={{
                                                "& th, & td": {
                                                    fontSize: "12px",
                                                },
                                            }}
                                        >
                                            <TableHead>
                                                <TableRow
                                                    sx={{
                                                        "& th": {
                                                            bgcolor: "#d5deecff",
                                                            color: "#1f3a5f",
                                                            fontWeight: 800,
                                                            borderBottom: "1px solid #e6ebf2",
                                                            py: 1,
                                                        },
                                                    }}
                                                >
                                                    <TableCell align="center">Sede</TableCell>
                                                    <TableCell align="center">Facultad</TableCell>
                                                    <TableCell align="center">Bodega</TableCell>
                                                    <TableCell align="center">Stock Inicial</TableCell>
                                                    <TableCell align="center">Stock Actual</TableCell>
                                                    <TableCell align="center">Stock Mínimo</TableCell>
                                                    <TableCell align="center">Total Lotes</TableCell>
                                                    <TableCell align="center">Stock Lotes</TableCell>
                                                    <TableCell align="center">Próx. venc.</TableCell>
                                                    <TableCell align="center">Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>

                                            <TableBody>
                                                {loading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={10} align="center" sx={{ height: 100 }}>
                                                            <CircularProgress size={30} color="primary" />
                                                        </TableCell>
                                                    </TableRow>
                                                ) : dataStockBodegaInsumo.length > 0 ? (
                                                    dataStockBodegaInsumo.map((data, index) => (
                                                        <TableRow key={index} hover>
                                                            <TableCell align="center">{data.nombre_sede}</TableCell>
                                                            <TableCell>{data.fac_nombre}</TableCell>
                                                            <TableCell align="center">{data.nombre_bodega}</TableCell>
                                                            <TableCell align="center">
                                                                {formatQty(data.sb_cantidad_inicial)}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                {formatQty(data.stock_bodega)}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                {formatQty(data.sb_stock_minimo)}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                {formatQty(data.total_lotes)}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                {formatQty(data.stock_lotes)}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                {formatDate(data.proximo_vencimiento)}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Tooltip title="Editar" arrow>
                                                                    <IconButton
                                                                        onClick={() =>
                                                                            handleFetchDataStockBodegaInsumoId(data.sb_id)
                                                                        }
                                                                        color="warning"
                                                                        size="small"
                                                                        sx={{
                                                                            mx: 0.5,
                                                                            width: 28,
                                                                            height: 28,
                                                                            p: 0,
                                                                            borderRadius: 1,
                                                                        }}
                                                                    >
                                                                        <FontAwesomeIcon icon={faEdit} />
                                                                    </IconButton>
                                                                </Tooltip>

                                                                <Tooltip title="Eliminar" arrow>
                                                                    <IconButton
                                                                        onClick={() => handleEliminarIngresos(data.sb_id)}
                                                                        color="error"
                                                                        size="small"
                                                                        sx={{
                                                                            mx: 0.5,
                                                                            width: 28,
                                                                            height: 28,
                                                                            p: 0,
                                                                            borderRadius: 1,
                                                                        }}
                                                                    >
                                                                        <FontAwesomeIcon icon={faTrashAlt} />
                                                                    </IconButton>
                                                                </Tooltip>

                                                                {requiereLote && (
                                                                    <Tooltip title="Ver lotes" arrow>
                                                                        <IconButton
                                                                            onClick={() => handleVerLotesBodega(data.sb_id)}
                                                                            color="primary"
                                                                            size="small"
                                                                            sx={{
                                                                                mx: 0.5,
                                                                                width: 28,
                                                                                height: 28,
                                                                                p: 0,
                                                                                borderRadius: 1,
                                                                            }}
                                                                        >
                                                                            <FontAwesomeIcon icon={faListAlt} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={10} align="center">
                                                            No se encontraron registros.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    </Box>
                </Paper>
            </DialogContent>

            <DialogActions sx={{ backgroundColor: "#f5f5f5" }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="error"
                    sx={{ fontSize: "12px" }}
                    startIcon={<CloseIcon />}
                >
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InventarioInicial;
