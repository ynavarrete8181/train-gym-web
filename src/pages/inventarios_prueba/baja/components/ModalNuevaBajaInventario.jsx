import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import ScaleOutlinedIcon from "@mui/icons-material/ScaleOutlined";

import Swal from "sweetalert2";
import axiosClient from "../../../../../axios/axios_client";

const ui = {
    bg: "#f6f8fc",
    paper: "#ffffff",
    head: "#0b1f3a",
    muted: "#475569",
    border: "#dbe3f0",
    borderSoft: "#e8eef7",
    primary: "#144985",
    primaryDark: "#0F3A6B",
    primarySoft: "#EEF4FB",
    primaryHeader: "#DCE8F7",
    primaryHeaderBorder: "#C7D8EE",
    warning: "#b7791f",
    success: "#177d3f",
    successSoft: "#EAF7EE",
    successBorder: "#CFE7D4",
    successText: "#1F3B2D",
    danger: "#b42318",
};

const baseFontSx = {
    fontFamily: `"Inter","Roboto","Helvetica","Arial",sans-serif`,
};

const fieldSx = {
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

const tableSx = {
    "& th": {
        ...baseFontSx,
        fontSize: 11,
        fontWeight: 800,
        color: ui.primaryDark,
        bgcolor: ui.primaryHeader,
        borderBottom: `1px solid ${ui.primaryHeaderBorder}`,
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

const toNumber = (value) => {
    const n = Number(value);
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

const motivoOptions = [
    "VENCIDO",
    "DAÑADO",
    "MERMA",
    "AJUSTE",
    "CONTAMINACIÓN",
    "PÉRDIDA",
    "CADUCADO",
    "OTRO",
];

const usaSoloVencidos = (motivo) =>
    ["VENCIDO", "CADUCADO"].includes(String(motivo || "").toUpperCase());

const ModalNuevaBajaInventario = ({ open, onClose, onSaved }) => {
    const [dataSede, setDataSede] = useState([]);
    const [dataFacultad, setDataFacultad] = useState([]);
    const [dataBodega, setDataBodega] = useState([]);

    const [loadingFacultades, setLoadingFacultades] = useState(false);
    const [loadingBodega, setLoadingBodega] = useState(false);
    const [loadingInsumos, setLoadingInsumos] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);

    const [errors, setErrors] = useState({});

    const [searchInsumo, setSearchInsumo] = useState("");
    const [searchDetalle, setSearchDetalle] = useState("");

    const [insumosVencidos, setInsumosVencidos] = useState([]);
    const [detalleProductos, setDetalleProductos] = useState([]);

    const [formData, setFormData] = useState({
        encabezado: {
            select_sede: "",
            select_facultad: "",
            select_bodega: "",
            motivo: "VENCIDO",
            observacion: "",
            documento_referencia: "",
        },
    });

    const openSwalOverDialog = (titleOrOptions, text, icon) => {
        const options =
            typeof titleOrOptions === "object"
                ? titleOrOptions
                : { title: titleOrOptions, text, icon };

        return Swal.fire({
            ...options,
            heightAuto: false,
            didOpen: (popup) => {
                const container = Swal.getContainer();
                if (container) {
                    container.style.zIndex = "2500";
                }

                const backdrop = Swal.getBackdrop();
                if (backdrop) {
                    backdrop.style.zIndex = "2499";
                }

                if (typeof options.didOpen === "function") {
                    options.didOpen(popup);
                }
            },
        });
    };

    useEffect(() => {
        if (!open) return;

        setErrors({});
        setSearchInsumo("");
        setSearchDetalle("");
        setInsumosVencidos([]);
        setDetalleProductos([]);
        setDataFacultad([]);
        setDataBodega([]);
        setFormData({
            encabezado: {
                select_sede: "",
                select_facultad: "",
                select_bodega: "",
                motivo: "VENCIDO",
                observacion: "",
                documento_referencia: "",
            },
        });

        fetchDataSede();
    }, [open]);

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
            openSwalOverDialog("¡Error!", "Error al cargar las sedes", "error");
        }
    };

    const buscarFacultadSede = async (idSede) => {
        setLoadingFacultades(true);
        try {
            const response = await axiosClient.get(
                `/consultar-facultades-sede/${Number(idSede)}`
            );
            const facs = Array.isArray(response?.data) ? response.data : [];
            setDataFacultad(Array.isArray(facs) ? facs : []);
        } catch (error) {
            openSwalOverDialog("¡Error!", "Error al cargar las facultades", "error");
        } finally {
            setLoadingFacultades(false);
        }
    };

    const buscarBodega = async (idSede, idFacultad) => {
        setLoadingBodega(true);
        try {
            const { data: resp } = await axiosClient.get(
                `/inventario/bodegas/${Number(idSede)}/${Number(idFacultad)}`
            );
            const bodegas = Array.isArray(resp) ? resp : resp?.data ?? [];
            setDataBodega(bodegas);
        } catch (error) {
            setDataBodega([]);
            openSwalOverDialog("¡Error!", "Error al cargar las bodegas", "error");
        } finally {
            setLoadingBodega(false);
        }
    };

    const consultarProductosBaja = async (
        idBodega,
        motivoActual = formData.encabezado.motivo,
        termino = searchInsumo
    ) => {
        setLoadingInsumos(true);
        try {
            const { data: resp } = await axiosClient.get(
                usaSoloVencidos(motivoActual)
                    ? "/inventario/bajas/insumos-vencidos"
                    : "/inventario/bajas/insumos-disponibles",
                {
                    params: {
                        bodega_id: idBodega,
                        q: termino,
                        per_page: 100,
                    },
                }
            );
            const list = resp?.data ?? [];
            const arr = Array.isArray(list) ? list : [];
            setInsumosVencidos(arr);
        } catch (error) {
            setInsumosVencidos([]);
            openSwalOverDialog("¡Error!", "Error al consultar productos de la bodega", "error");
        } finally {
            setLoadingInsumos(false);
        }
    };

    const insumosFiltrados = useMemo(() => {
        const term = searchInsumo.trim().toLowerCase();
        if (!term) return insumosVencidos;

        return insumosVencidos.filter((row) =>
            [row.codigo, row.ins_descripcion, row.categoria_nombre, row.bodega_nombre]
                .map((x) => String(x || "").toLowerCase())
                .join(" ")
                .includes(term)
        );
    }, [insumosVencidos, searchInsumo]);

    const detalleFiltrado = useMemo(() => {
        const term = searchDetalle.trim().toLowerCase();
        if (!term) return detalleProductos;

        return detalleProductos.filter((row) =>
            [row.codigo, row.nombre, row.categoria_nombre]
                .map((x) => String(x || "").toLowerCase())
                .join(" ")
                .includes(term)
        );
    }, [detalleProductos, searchDetalle]);

    const resumen = useMemo(() => {
        const productos = detalleProductos.length;
        const lotesSeleccionados = detalleProductos.reduce((acc, row) => {
            return acc + (row.lotes || []).filter((l) => l.seleccionado).length;
        }, 0);

        const totalBaja = detalleProductos.reduce((acc, row) => {
            const suma = (row.lotes || [])
                .filter((l) => l.seleccionado)
                .reduce((s, l) => s + toNumber(l.cantidad_baja), 0);
            return acc + suma;
        }, 0);

        return { productos, lotesSeleccionados, totalBaja };
    }, [detalleProductos]);

    const clearError = (key) => {
        setErrors((prev) => {
            const copy = { ...prev };
            delete copy[key];
            return copy;
        });
    };

    const handleAgregarProducto = async (producto) => {
        const motivoActual = formData.encabezado.motivo;
        const idInsumo = producto.insumo_id ?? producto.id;
        const existe = detalleProductos.some(
            (x) => String(x.idInsumo) === String(idInsumo)
        );

        if (existe) {
            openSwalOverDialog("Atención", "Ese insumo ya fue agregado.", "info");
            return;
        }

        try {
            const { data: resp } = await axiosClient.get(
                usaSoloVencidos(motivoActual)
                    ? "/inventario/bajas/lotes-vencidos"
                    : "/inventario/bajas/lotes-disponibles",
                {
                    params: {
                        bodega_id: formData.encabezado.select_bodega,
                        insumo_id: idInsumo,
                    },
                }
            );
            const lotes = resp?.data ?? [];

            setDetalleProductos((prev) => [
                ...prev,
                {
                    idInsumo,
                    codigo: producto.codigo,
                    nombre: producto.ins_descripcion,
                    categoria_nombre: producto.categoria_nombre,
                    total_lotes_vencidos:
                        producto.total_lotes_vencidos ?? producto.total_lotes ?? 0,
                    stock_vencido:
                        producto.stock_vencido ?? producto.stock_disponible ?? 0,
                    lotes: (Array.isArray(lotes) ? lotes : []).map((l) => ({
                        ...l,
                        seleccionado: false,
                        cantidad_baja: l.cantidad_actual ?? 0,
                        observacion_linea: "",
                    })),
                },
            ]);

            clearError("detalleProductos");
        } catch (error) {
            openSwalOverDialog("Error", "No se pudieron cargar los lotes del producto.", "error");
        }
    };

    const handleEliminarProducto = (idInsumo) => {
        setDetalleProductos((prev) =>
            prev.filter((p) => String(p.idInsumo) !== String(idInsumo))
        );
    };

    const handleToggleLote = (idInsumo, loteId, checked) => {
        setDetalleProductos((prev) =>
            prev.map((row) =>
                String(row.idInsumo) === String(idInsumo)
                    ? {
                        ...row,
                        lotes: row.lotes.map((l) =>
                            Number(l.lote_id) === Number(loteId)
                                ? {
                                    ...l,
                                    seleccionado: checked,
                                    cantidad_baja:
                                        checked && (!l.cantidad_baja || Number(l.cantidad_baja) <= 0)
                                            ? l.cantidad_actual
                                            : l.cantidad_baja,
                                }
                                : l
                        ),
                    }
                    : row
            )
        );

        clearError(`lote_${idInsumo}_${loteId}`);
    };

    const handleCantidadLote = (idInsumo, loteId, value) => {
        setDetalleProductos((prev) =>
            prev.map((row) =>
                String(row.idInsumo) === String(idInsumo)
                    ? {
                        ...row,
                        lotes: row.lotes.map((l) =>
                            Number(l.lote_id) === Number(loteId)
                                ? { ...l, cantidad_baja: value }
                                : l
                        ),
                    }
                    : row
            )
        );

        clearError(`lote_${idInsumo}_${loteId}`);
    };

    const handleObservacionLote = (idInsumo, loteId, value) => {
        setDetalleProductos((prev) =>
            prev.map((row) =>
                String(row.idInsumo) === String(idInsumo)
                    ? {
                        ...row,
                        lotes: row.lotes.map((l) =>
                            Number(l.lote_id) === Number(loteId)
                                ? { ...l, observacion_linea: value }
                                : l
                        ),
                    }
                    : row
            )
        );
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.encabezado.select_sede) {
            newErrors.select_sede = "Debe seleccionar una sede";
        }

        if (!formData.encabezado.select_facultad) {
            newErrors.select_facultad = "Debe seleccionar una facultad / dirección";
        }

        if (!formData.encabezado.select_bodega) {
            newErrors.select_bodega = "Debe seleccionar una bodega";
        }

        if (!detalleProductos.length) {
            newErrors.detalleProductos = "Debe agregar al menos un insumo";
        }

        detalleProductos.forEach((producto) => {
            const lotesSeleccionados = (producto.lotes || []).filter((l) => l.seleccionado);

            if (!lotesSeleccionados.length) {
                newErrors[`producto_${producto.idInsumo}`] =
                    "Debe seleccionar al menos un lote vencido";
            }

            lotesSeleccionados.forEach((lote) => {
                const cantidad = Number(lote.cantidad_baja || 0);
                const stock = Number(lote.cantidad_actual || 0);

                if (Number.isNaN(cantidad) || cantidad <= 0) {
                    newErrors[`lote_${producto.idInsumo}_${lote.lote_id}`] = "Cantidad inválida";
                } else if (cantidad > stock) {
                    newErrors[`lote_${producto.idInsumo}_${lote.lote_id}`] =
                        "La cantidad supera el stock del lote";
                }
            });
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGuardar = async () => {
        if (!validateForm()) return;

        const confirm = await openSwalOverDialog({
            title: "Confirmar baja de inventario",
            html: `
                <div style="font-size:14px; line-height:1.55; color:#475569;">
                    Está a punto de registrar una <b>baja definitiva de inventario</b>.
                    <br/><br/>
                    Esta acción descontará el stock de los lotes seleccionados y dejará trazabilidad en el sistema.
                    <br/><br/>
                    <b>¿Desea continuar con el registro de la baja?</b>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, registrar baja",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
            confirmButtonColor: "#177d3f",
            cancelButtonColor: "#d32f2f",
        });

        if (!confirm.isConfirmed) return;

        const items = detalleProductos
            .map((producto) => {
                const lotes = (producto.lotes || [])
                    .filter((l) => l.seleccionado)
                    .map((l) => ({
                        lote_id: Number(l.lote_id),
                        cantidad: toNumber(l.cantidad_baja),
                    }));

                return {
                    insumo_id: Number(producto.idInsumo),
                    cantidad: lotes.reduce((acc, l) => acc + toNumber(l.cantidad), 0),
                    observacion: "",
                    lotes,
                };
            })
            .filter((item) => item.lotes.length > 0);

        const payload = {
            bodega_id: Number(formData.encabezado.select_bodega),
            motivo: formData.encabezado.motivo,
            observacion: formData.encabezado.observacion,
            documento_referencia: formData.encabezado.documento_referencia,
            items,
        };

        setLoadingSave(true);
        try {
            const { data: resp } = await axiosClient.post("/inventario/bajas", payload);

            openSwalOverDialog({
                title: "Éxito",
                text: resp?.message || "Baja de inventario registrada correctamente.",
                icon: "success",
                confirmButtonColor: "#177d3f",
            }).then(() => {
                onSaved?.();
                onClose?.();
            });
        } catch (error) {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "No se pudo registrar la baja.";

            openSwalOverDialog("Error", msg, "error");
        } finally {
            setLoadingSave(false);
        }
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
                    backgroundColor: ui.primaryDark,
                    color: "#ffffff",
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.14)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Inventory2OutlinedIcon sx={{ fontSize: 18, color: "#fff" }} />
                    </Box>
                    <Box>
                        <Typography
                            sx={{
                                ...baseFontSx,
                                fontWeight: 800,
                                fontSize: 13,
                                lineHeight: 1.2,
                                color: "#ffffff",
                            }}
                        >
                            Nueva baja de inventario
                        </Typography>

                        <Typography
                            sx={{
                                ...baseFontSx,
                                fontSize: 11,
                                color: "rgba(255,255,255,0.72)",
                                mt: 0.3,
                            }}
                        >
                            {usaSoloVencidos(formData.encabezado.motivo)
                                ? "Registro de productos con lotes vencidos para salida definitiva"
                                : "Registro de productos disponibles para salida definitiva"}
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ bgcolor: "#fafbfd" }}>
                <Grid container spacing={1.5}>
                    <Grid item xs={12}>
                        <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 2, p: 1.5, bgcolor: "#fff" }}>
                            <Typography sx={sectionTitleSx}>Ubicación de la baja</Typography>

                            <Grid container spacing={1} sx={{ mt: 1 }}>
                                <Grid item xs={12} md={4}>
                                    <FormControl size="small" fullWidth error={Boolean(errors.select_sede)}>
                                        <InputLabel>Sede</InputLabel>
                                        <Select
                                            label="Sede"
                                            value={formData.encabezado.select_sede}
                                            onChange={(e) => {
                                                const idSede = e.target.value;

                                                setFormData((prev) => ({
                                                    ...prev,
                                                    encabezado: {
                                                        ...prev.encabezado,
                                                        select_sede: idSede,
                                                        select_facultad: "",
                                                        select_bodega: "",
                                                    },
                                                }));

                                                setDataFacultad([]);
                                                setDataBodega([]);
                                                setInsumosVencidos([]);
                                                setDetalleProductos([]);
                                                setSearchInsumo("");
                                                setSearchDetalle("");

                                                if (idSede) buscarFacultadSede(Number(idSede));
                                                clearError("select_sede");
                                            }}
                                            sx={fieldSx}
                                        >
                                            <MenuItem value="">
                                                <em>Seleccione</em>
                                            </MenuItem>
                                            {dataSede.map((s) => (
                                                <MenuItem key={s.value} value={String(s.value)}>
                                                    {s.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.select_sede && <FormHelperText>{errors.select_sede}</FormHelperText>}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <FormControl
                                        size="small"
                                        fullWidth
                                        disabled={!formData.encabezado.select_sede || loadingFacultades}
                                        error={Boolean(errors.select_facultad)}
                                    >
                                        <InputLabel>Facultad / Dirección</InputLabel>
                                        <Select
                                            label="Facultad / Dirección"
                                            value={formData.encabezado.select_facultad}
                                            onChange={(e) => {
                                                const idFac = e.target.value;

                                                setFormData((prev) => ({
                                                    ...prev,
                                                    encabezado: {
                                                        ...prev.encabezado,
                                                        select_facultad: idFac,
                                                        select_bodega: "",
                                                    },
                                                }));

                                                setDataBodega([]);
                                                setInsumosVencidos([]);
                                                setDetalleProductos([]);
                                                setSearchInsumo("");
                                                setSearchDetalle("");

                                                const sede = formData.encabezado.select_sede;
                                                if (idFac && sede) buscarBodega(Number(sede), Number(idFac));
                                                clearError("select_facultad");
                                            }}
                                            sx={fieldSx}
                                        >
                                            <MenuItem value="">
                                                <em>{loadingFacultades ? "Cargando..." : "Seleccione"}</em>
                                            </MenuItem>
                                            {dataFacultad.map((f) => (
                                                <MenuItem key={f.id} value={String(f.id)}>
                                                    {f.fac_nombre}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.select_facultad && <FormHelperText>{errors.select_facultad}</FormHelperText>}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={4}>
                                    <FormControl
                                        size="small"
                                        fullWidth
                                        disabled={!formData.encabezado.select_facultad || loadingBodega}
                                        error={Boolean(errors.select_bodega)}
                                    >
                                        <InputLabel>Bodega</InputLabel>
                                        <Select
                                            label="Bodega"
                                            value={formData.encabezado.select_bodega}
                                            onChange={(e) => {
                                                const idBodega = e.target.value;

                                                setFormData((prev) => ({
                                                    ...prev,
                                                    encabezado: {
                                                        ...prev.encabezado,
                                                        select_bodega: idBodega,
                                                    },
                                                }));

                                                setInsumosVencidos([]);
                                                setDetalleProductos([]);
                                                setSearchInsumo("");
                                                setSearchDetalle("");

                                                if (idBodega) {
                                                    consultarProductosBaja(
                                                        idBodega,
                                                        formData.encabezado.motivo,
                                                        ""
                                                    );
                                                }
                                                clearError("select_bodega");
                                            }}
                                            sx={fieldSx}
                                        >
                                            <MenuItem value="">
                                                <em>
                                                    {loadingBodega
                                                        ? "Cargando..."
                                                        : dataBodega.length === 0
                                                            ? "Sin bodegas"
                                                            : "Seleccione"}
                                                </em>
                                            </MenuItem>
                                            {dataBodega.map((b) => (
                                                <MenuItem key={b.bod_id} value={String(b.bod_id)}>
                                                    {b.bod_nombre}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.select_bodega && <FormHelperText>{errors.select_bodega}</FormHelperText>}
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 2, p: 1.5, bgcolor: "#fff", height: "100%" }}>
                            <Typography sx={sectionTitleSx}>Datos de la baja</Typography>

                            <Grid container spacing={1} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <FormControl size="small" fullWidth>
                                        <InputLabel>Motivo</InputLabel>
                                        <Select
                                            label="Motivo"
                                            value={formData.encabezado.motivo}
                                            onChange={(e) => {
                                                const nuevoMotivo = e.target.value;

                                                setFormData((prev) => ({
                                                    ...prev,
                                                    encabezado: { ...prev.encabezado, motivo: nuevoMotivo },
                                                }));

                                                setInsumosVencidos([]);
                                                setDetalleProductos([]);
                                                setSearchInsumo("");
                                                setSearchDetalle("");

                                                if (formData.encabezado.select_bodega) {
                                                    consultarProductosBaja(
                                                        formData.encabezado.select_bodega,
                                                        nuevoMotivo,
                                                        ""
                                                    );
                                                }
                                            }}
                                            sx={fieldSx}
                                        >
                                            {motivoOptions.map((m) => (
                                                <MenuItem key={m} value={m}>
                                                    {m}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        size="small"
                                        label="Documento de referencia"
                                        fullWidth
                                        value={formData.encabezado.documento_referencia}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                encabezado: { ...prev.encabezado, documento_referencia: e.target.value },
                                            }))
                                        }
                                        sx={fieldSx}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        size="small"
                                        label="Observación general"
                                        multiline
                                        minRows={4}
                                        fullWidth
                                        value={formData.encabezado.observacion}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                encabezado: { ...prev.encabezado, observacion: e.target.value },
                                            }))
                                        }
                                        sx={fieldSx}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.25,
                                            borderRadius: 2,
                                            borderColor: ui.border,
                                            bgcolor: "#fff",
                                            boxShadow: "0 6px 18px rgba(15,58,107,0.04)",
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Inventory2OutlinedIcon sx={{ fontSize: 16, color: ui.primary }} />
                                            <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                Productos agregados
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ ...baseFontSx, fontSize: 18, fontWeight: 900, color: ui.head }}>
                                            {resumen.productos}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.25,
                                            borderRadius: 2,
                                            borderColor: ui.border,
                                            bgcolor: "#fff",
                                            boxShadow: "0 6px 18px rgba(15,58,107,0.04)",
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <LayersOutlinedIcon sx={{ fontSize: 16, color: ui.warning }} />
                                            <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                Lotes seleccionados
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ ...baseFontSx, fontSize: 18, fontWeight: 900, color: ui.warning }}>
                                            {resumen.lotesSeleccionados}
                                        </Typography>
                                    </Paper>
                                </Grid>

                                <Grid item xs={12}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.25,
                                            borderRadius: 2,
                                            borderColor: ui.border,
                                            bgcolor: "#fff",
                                            boxShadow: "0 6px 18px rgba(15,58,107,0.04)",
                                        }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <ScaleOutlinedIcon sx={{ fontSize: 16, color: ui.danger }} />
                                            <Typography sx={{ ...baseFontSx, fontSize: 11, color: ui.muted }}>
                                                Cantidad total a dar de baja
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ ...baseFontSx, fontSize: 18, fontWeight: 900, color: ui.danger }}>
                                            {formatQty(resumen.totalBaja)}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 2, p: 1.5, bgcolor: "#fff", height: "100%" }}>
                            <Typography sx={sectionTitleSx}>
                                {usaSoloVencidos(formData.encabezado.motivo)
                                    ? "Insumos con lotes vencidos"
                                    : "Productos disponibles en bodega"}
                            </Typography>

                            <TextField
                                size="small"
                                placeholder={
                                    usaSoloVencidos(formData.encabezado.motivo)
                                        ? "Buscar insumo vencido"
                                        : "Buscar producto disponible"
                                }
                                value={searchInsumo}
                                onChange={(e) => setSearchInsumo(e.target.value)}
                                fullWidth
                                disabled={!formData.encabezado.select_bodega}
                                sx={{ ...fieldSx, mt: 1 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Box sx={{ mt: 1 }}>
                                {loadingInsumos ? (
                                    <Paper elevation={0} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
                                        <CircularProgress size={24} />
                                        <Typography sx={{ ...baseFontSx, mt: 1, fontSize: 12, color: ui.muted }}>
                                            {usaSoloVencidos(formData.encabezado.motivo)
                                                ? "Cargando insumos vencidos..."
                                                : "Cargando productos disponibles..."}
                                        </Typography>
                                    </Paper>
                                ) : !formData.encabezado.select_bodega ? (
                                    <EmptyState label="SELECCIONE UNA BODEGA" />
                                ) : insumosFiltrados.length === 0 ? (
                                    <EmptyState
                                        label={
                                            usaSoloVencidos(formData.encabezado.motivo)
                                                ? "SIN INSUMOS VENCIDOS"
                                                : "SIN PRODUCTOS DISPONIBLES"
                                        }
                                    />
                                ) : (
                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                                        <Table stickyHeader size="small" sx={tableSx}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Código</TableCell>
                                                    <TableCell>Producto</TableCell>
                                                    <TableCell>Categoría</TableCell>
                                                    <TableCell align="center">
                                                        {usaSoloVencidos(formData.encabezado.motivo)
                                                            ? "Lotes vencidos"
                                                            : "Lotes disponibles"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {usaSoloVencidos(formData.encabezado.motivo)
                                                            ? "Stock vencido"
                                                            : "Stock disponible"}
                                                    </TableCell>
                                                    <TableCell align="center">Agregar</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {insumosFiltrados.map((row) => (
                                                    <TableRow key={row.insumo_id ?? row.id} hover>
                                                        <TableCell>{row.codigo || "-"}</TableCell>
                                                        <TableCell>
                                                            <Typography sx={{ ...baseFontSx, fontWeight: 800, fontSize: 12, color: ui.head }}>
                                                                {row.ins_descripcion}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>{row.categoria_nombre || "-"}</TableCell>
                                                        <TableCell align="center">
                                                            {row.total_lotes_vencidos ?? row.total_lotes ?? 0}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {formatQty(row.stock_vencido ?? row.stock_disponible)}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Tooltip title="Agregar insumo" arrow>
                                                                <IconButton
                                                                    onClick={() => handleAgregarProducto(row)}
                                                                    size="small"
                                                                    sx={{
                                                                        color: ui.primary,
                                                                        border: `1px solid ${ui.border}`,
                                                                        borderRadius: 1.5,
                                                                        bgcolor: "#fff",
                                                                        "&:hover": {
                                                                            bgcolor: ui.primarySoft,
                                                                            borderColor: ui.primary,
                                                                        },
                                                                    }}
                                                                >
                                                                    <AddCircleOutlineIcon />
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
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ border: `1px solid ${ui.borderSoft}`, borderRadius: 2, p: 1.5, bgcolor: "#fff" }}>
                            <Typography sx={sectionTitleSx}>Detalle seleccionado para la baja</Typography>

                            <TextField
                                size="small"
                                placeholder="Buscar producto agregado"
                                value={searchDetalle}
                                onChange={(e) => setSearchDetalle(e.target.value)}
                                fullWidth
                                disabled={!detalleProductos.length}
                                sx={{ ...fieldSx, mt: 1 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {errors.detalleProductos && (
                                <Typography sx={{ ...baseFontSx, mt: 0.8, fontSize: 11, color: ui.danger }}>
                                    {errors.detalleProductos}
                                </Typography>
                            )}

                            <Box sx={{ mt: 1 }}>
                                {detalleFiltrado.length === 0 ? (
                                    <EmptyState label="AÚN NO HAY INSUMOS AGREGADOS" />
                                ) : (
                                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                                        <Table stickyHeader size="small" sx={tableSx}>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Producto</TableCell>
                                                    <TableCell>Categoría</TableCell>
                                                    <TableCell align="center">
                                                        {usaSoloVencidos(formData.encabezado.motivo)
                                                            ? "Lotes vencidos"
                                                            : "Lotes disponibles"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {usaSoloVencidos(formData.encabezado.motivo)
                                                            ? "Stock vencido"
                                                            : "Stock disponible"}
                                                    </TableCell>
                                                    <TableCell align="center">Acción</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {detalleFiltrado.map((row) => (
                                                    <React.Fragment key={row.idInsumo}>
                                                        <TableRow hover>
                                                            <TableCell>
                                                                <Typography sx={{ ...baseFontSx, fontWeight: 800, fontSize: 12, color: ui.head }}>
                                                                    {row.codigo ? `${row.codigo} - ` : ""}
                                                                    {row.nombre}
                                                                </Typography>
                                                                {errors[`producto_${row.idInsumo}`] && (
                                                                    <Typography sx={{ ...baseFontSx, mt: 0.4, fontSize: 11, color: ui.danger }}>
                                                                        {errors[`producto_${row.idInsumo}`]}
                                                                    </Typography>
                                                                )}
                                                            </TableCell>

                                                            <TableCell>{row.categoria_nombre || "-"}</TableCell>
                                                            <TableCell align="center">{row.total_lotes_vencidos || 0}</TableCell>
                                                            <TableCell align="right">{formatQty(row.stock_vencido)}</TableCell>

                                                            <TableCell align="center">
                                                                <Tooltip title="Quitar insumo" arrow>
                                                                    <IconButton
                                                                        onClick={() => handleEliminarProducto(row.idInsumo)}
                                                                        size="small"
                                                                        sx={{
                                                                            color: ui.danger,
                                                                            border: `1px solid rgba(180,35,24,0.18)`,
                                                                            borderRadius: 1.5,
                                                                            bgcolor: "#fff",
                                                                            "&:hover": {
                                                                                bgcolor: "rgba(180,35,24,0.06)",
                                                                                borderColor: ui.danger,
                                                                            },
                                                                        }}
                                                                    >
                                                                        <DeleteOutlineIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>

                                                        <TableRow>
                                                            <TableCell colSpan={5} sx={{ bgcolor: "#fcfdff" }}>
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
                                                                            bgcolor: "#fffaf0",
                                                                            borderBottom: `1px solid ${ui.borderSoft}`,
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: 1,
                                                                        }}
                                                                    >
                                                                        <WarningAmberIcon sx={{ fontSize: 16, color: ui.warning }} />
                                                                        <Typography sx={{ ...baseFontSx, fontWeight: 900, fontSize: 11, color: ui.head }}>
                                                                            {usaSoloVencidos(formData.encabezado.motivo)
                                                                                ? `Lotes vencidos de ${row.nombre}`
                                                                                : `Lotes disponibles de ${row.nombre}`}
                                                                        </Typography>
                                                                    </Box>

                                                                    {(row.lotes || []).length === 0 ? (
                                                                        <Box sx={{ p: 1.5 }}>
                                                                            <EmptyState
                                                                                label={
                                                                                    usaSoloVencidos(formData.encabezado.motivo)
                                                                                        ? "SIN LOTES VENCIDOS"
                                                                                        : "SIN LOTES DISPONIBLES"
                                                                                }
                                                                            />
                                                                        </Box>
                                                                    ) : (
                                                                        <TableContainer>
                                                                            <Table size="small" sx={tableSx}>
                                                                                <TableHead>
                                                                                    <TableRow>
                                                                                        <TableCell align="center">Sel.</TableCell>
                                                                                        <TableCell>Lote</TableCell>
                                                                                        <TableCell>Elaboración</TableCell>
                                                                                        <TableCell>Vencimiento</TableCell>
                                                                                        <TableCell align="right">
                                                                                            {usaSoloVencidos(formData.encabezado.motivo)
                                                                                                ? "Días vencido"
                                                                                                : "Días a vencimiento"}
                                                                                        </TableCell>
                                                                                        <TableCell align="right">Stock lote</TableCell>
                                                                                        <TableCell align="right">Cant. baja</TableCell>
                                                                                        <TableCell>Observación</TableCell>
                                                                                    </TableRow>
                                                                                </TableHead>
                                                                                <TableBody>
                                                                                    {row.lotes.map((lote) => (
                                                                                        <TableRow key={lote.lote_id} hover>
                                                                                            <TableCell align="center">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={Boolean(lote.seleccionado)}
                                                                                                    onChange={(e) =>
                                                                                                        handleToggleLote(
                                                                                                            row.idInsumo,
                                                                                                            lote.lote_id,
                                                                                                            e.target.checked
                                                                                                        )
                                                                                                    }
                                                                                                />
                                                                                            </TableCell>

                                                                                            <TableCell>{lote.codigo_lote || "-"}</TableCell>
                                                                                            <TableCell>{formatDate(lote.fecha_elaboracion)}</TableCell>
                                                                                            <TableCell>{formatDate(lote.fecha_vencimiento)}</TableCell>
                                                                                            <TableCell align="right">
                                                                                                {usaSoloVencidos(formData.encabezado.motivo)
                                                                                                    ? (lote.dias_vencido || 0)
                                                                                                    : "-"}
                                                                                            </TableCell>
                                                                                            <TableCell align="right">{formatQty(lote.cantidad_actual)}</TableCell>

                                                                                            <TableCell align="right" sx={{ minWidth: 150 }}>
                                                                                                <TextField
                                                                                                    size="small"
                                                                                                    type="number"
                                                                                                    value={lote.cantidad_baja}
                                                                                                    disabled={!lote.seleccionado}
                                                                                                    onChange={(e) =>
                                                                                                        handleCantidadLote(
                                                                                                            row.idInsumo,
                                                                                                            lote.lote_id,
                                                                                                            e.target.value
                                                                                                        )
                                                                                                    }
                                                                                                    inputProps={{ min: 0, step: "0.01" }}
                                                                                                    error={Boolean(errors[`lote_${row.idInsumo}_${lote.lote_id}`])}
                                                                                                    helperText={errors[`lote_${row.idInsumo}_${lote.lote_id}`] || ""}
                                                                                                    sx={fieldSx}
                                                                                                />
                                                                                            </TableCell>

                                                                                            <TableCell sx={{ minWidth: 220 }}>
                                                                                                <TextField
                                                                                                    size="small"
                                                                                                    value={lote.observacion_linea || ""}
                                                                                                    disabled={!lote.seleccionado}
                                                                                                    onChange={(e) =>
                                                                                                        handleObservacionLote(
                                                                                                            row.idInsumo,
                                                                                                            lote.lote_id,
                                                                                                            e.target.value
                                                                                                        )
                                                                                                    }
                                                                                                    placeholder="Observación opcional"
                                                                                                    fullWidth
                                                                                                    sx={fieldSx}
                                                                                                />
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
                                                    </React.Fragment>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 2, py: 1.25, gap: 1 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    sx={{
                        ...baseFontSx,
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 1.5,
                        borderColor: "#d32f2f",
                        color: "#d32f2f",
                        "& .MuiButton-startIcon": {
                            color: "#d32f2f",
                        },
                        "&:hover": {
                            borderColor: "#b71c1c",
                            backgroundColor: "rgba(211,47,47,0.08)",
                        },
                        "&.Mui-disabled": {
                            borderColor: "#d1d5db",
                            color: "#9ca3af",
                        },
                    }}
                >
                    Cancelar
                </Button>

                <Button
                    onClick={handleGuardar}
                    variant="outlined"
                    startIcon={loadingSave ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
                    disabled={loadingSave}
                    sx={{
                        ...baseFontSx,
                        textTransform: "none",
                        fontWeight: 800,
                        borderRadius: 2,
                        minWidth: 140,
                        px: 2,
                        bgcolor: "#fff",
                        color: ui.success,
                        border: `1px solid ${ui.success}`,
                        boxShadow: "none",
                        "& .MuiButton-startIcon": {
                            color: ui.success,
                        },
                        "&:hover": {
                            bgcolor: "rgba(23, 125, 63, 0.08)",
                            border: `1px solid ${ui.success}`,
                            boxShadow: "0 2px 6px rgba(46, 125, 50, 0.2)",
                        },
                        "&.Mui-disabled": {
                            borderColor: "#d1d5db",
                            bgcolor: "#fff",
                            color: "#9ca3af",
                        },
                    }}
                >
                    {loadingSave ? "Guardando..." : "Guardar"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalNuevaBajaInventario;
