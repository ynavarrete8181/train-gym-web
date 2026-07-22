import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    FormControl,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Swal from "sweetalert2";

import PageHeader from "../../../components/ui/PageHeader";
import PremiumButton from "../../../components/ui/PremiumButton";
import PremiumModal from "../../../components/ui/PremiumModal";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { filterInputSx, modalFieldSx, semanticChipSx, semanticIconButtonSx, tableSx } from "../../../Styles/muiTheme";
import { pagePaperSx } from "../personas.utils";

const money = (value) =>
    new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (date, days) => {
    const next = new Date(`${date}T00:00:00`);
    next.setDate(next.getDate() + Number(days || 0));
    return next.toISOString().slice(0, 10);
};

const getMembershipStatus = (fechaFin) => {
    if (!fechaFin) return { code: "SIN_FECHA", label: "Sin fecha", tone: "neutral" };

    const current = new Date();
    current.setHours(0, 0, 0, 0);
    const finish = new Date(`${fechaFin}T00:00:00`);
    const diffDays = Math.ceil((finish.getTime() - current.getTime()) / 86400000);

    if (diffDays < 0) return { code: "VENCIDA", label: "Vencida", tone: "danger" };
    if (diffDays <= 5) return { code: "POR_VENCER", label: "Por vencer", tone: "mustard" };
    return { code: "VIGENTE", label: "Vigente", tone: "success" };
};

const isActiveMembership = (membership) => {
    if (!membership?.fecha_fin) return false;
    return new Date(`${membership.fecha_fin}T00:00:00`) >= new Date(`${today()}T00:00:00`);
};

export default function AsignacionMembresiasPanel() {
    const [sedes, setSedes] = useState([]);
    const [catalogo, setCatalogo] = useState([]);
    const [asignaciones, setAsignaciones] = useState([]);
    const [socios, setSocios] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [filtersReady, setFiltersReady] = useState(false);
    const [saving, setSaving] = useState(false);
    const [page, setPage] = useState(0);
    const rowsPerPage = 5;

    const [filters, setFilters] = useState({
        buscar: "",
        sede_id: "",
        membresia_id: "",
    });
    const [addOpen, setAddOpen] = useState(false);
    const [buscarSocio, setBuscarSocio] = useState("");
    const [selectedSocios, setSelectedSocios] = useState([]);
    const [detalleClienteKey, setDetalleClienteKey] = useState(null);
    const [assignForm, setAssignForm] = useState({
        sede_id: "",
        membresia_id: "",
        fecha_inicio: today(),
        modo_conflicto: "RENOVAR",
    });

    const selectedHistoryPlan = useMemo(
        () => catalogo.find((plan) => String(plan.id) === String(filters.membresia_id)),
        [catalogo, filters.membresia_id]
    );

    const selectedAssignPlan = useMemo(
        () => catalogo.find((plan) => String(plan.id) === String(assignForm.membresia_id)),
        [catalogo, assignForm.membresia_id]
    );

    const fechaFin = useMemo(() => {
        if (!selectedAssignPlan || !assignForm.fecha_inicio) return "";
        return addDays(assignForm.fecha_inicio, Number(selectedAssignPlan.duracion_dias || 1) - 1);
    }, [selectedAssignPlan, assignForm.fecha_inicio]);

    const selectedTotal = selectedSocios.length ? Number(selectedAssignPlan?.precio || 0) : 0;
    const hasConflicts = selectedSocios.some((socio) => isActiveMembership(socio.membresia_actual));
    const canSaveAssignment = Boolean(selectedSocios.length && assignForm.sede_id && assignForm.membresia_id && selectedAssignPlan);
    const clientesAsignacion = useMemo(() => {
        const grouped = new Map();

        asignaciones.forEach((item) => {
            const key = String(item.socio_id || item.cedula || item.codigo_socio || item.id);
            const current = grouped.get(key) || {
                key,
                socio_id: item.socio_id,
                nombre_completo: item.nombre_completo,
                codigo_socio: item.codigo_socio,
                cedula: item.cedula,
                membresias: [],
            };

            current.membresias.push(item);
            grouped.set(key, current);
        });

        return Array.from(grouped.values()).map((cliente) => {
            const membresias = [...cliente.membresias].sort((a, b) => String(b.fecha_fin || "").localeCompare(String(a.fecha_fin || "")));
            const vigente = membresias.find((item) => getMembershipStatus(item.fecha_fin).code !== "VENCIDA");
            const actual = vigente || membresias[0] || null;

            return {
                ...cliente,
                membresias,
                actual,
                total_membresias: membresias.length,
            };
        });
    }, [asignaciones]);

    const paginatedClientes = useMemo(
        () => clientesAsignacion.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [clientesAsignacion, page]
    );

    const detalleCliente = useMemo(
        () => clientesAsignacion.find((cliente) => cliente.key === detalleClienteKey) || null,
        [clientesAsignacion, detalleClienteKey]
    );

    const fetchSedes = async () => {
        const [inventarioResult, seguridadResult] = await Promise.allSettled([
            apiClient.get("/inventario/sedes"),
            apiClient.get("/gimnasio/seguridad/usuarios/catalogos"),
        ]);

        const inventarioSedes = inventarioResult.status === "fulfilled" && Array.isArray(inventarioResult.value.data)
            ? inventarioResult.value.data
            : [];
        const seguridadSedes = seguridadResult.status === "fulfilled" && Array.isArray(seguridadResult.value.data?.sedes)
            ? seguridadResult.value.data.sedes
            : [];

        return inventarioSedes.length ? inventarioSedes : seguridadSedes;
    };

    const fetchCatalogo = async (sedeId) => {
        const { data } = await apiClient.get("/gimnasio/membresias", {
            params: sedeId ? { sede_id: sedeId } : {},
        });
        setCatalogo(Array.isArray(data) ? data : []);
    };

    const fetchSocios = async () => {
        const { data } = await apiClient.get("/gimnasio/membresias/socios");
        setSocios(Array.isArray(data) ? data : []);
    };

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const { data } = await apiClient.get("/gimnasio/membresias/asignaciones", {
                params: {
                    buscar: filters.buscar || undefined,
                    sede_id: filters.sede_id || undefined,
                    membresia_id: filters.membresia_id || undefined,
                },
            });
            setAsignaciones(Array.isArray(data) ? data : []);
            setHasSearched(true);
            setPage(0);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el historial de asignaciones."), "error");
        } finally {
            setLoadingHistory(false);
        }
    }, [filters.buscar, filters.membresia_id, filters.sede_id]);

    useEffect(() => {
        (async () => {
            try {
                const sedesData = await fetchSedes();
                setSedes(sedesData);
                setFilters((prev) => ({
                    ...prev,
                    sede_id: prev.sede_id || "",
                }));
                await fetchCatalogo(null);
                await fetchSocios();
                setFiltersReady(true);
            } catch (error) {
                Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el módulo de asignaciones."), "error");
            }
        })();
    }, []);

    useEffect(() => {
        if (!filtersReady) return undefined;

        const timer = setTimeout(() => {
            fetchHistory();
        }, filters.buscar ? 350 : 0);

        return () => clearTimeout(timer);
    }, [fetchHistory, filters.buscar, filtersReady]);

    useEffect(() => {
        fetchCatalogo(filters.sede_id || null).catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el catálogo de membresías por sede."), "error");
        });
    }, [filters.sede_id]);

    const sociosFiltered = useMemo(() => {
        const search = buscarSocio.trim().toLowerCase();
        return socios.filter((socio) => {
            if (!search) return true;
            return [
                socio.nombre_completo,
                socio.codigo_socio,
                socio.cedula,
                socio.membresia_actual?.nombre,
            ].some((value) => String(value || "").toLowerCase().includes(search));
        });
    }, [socios, buscarSocio]);

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
            ...(key === "sede_id" ? { membresia_id: "" } : {}),
        }));
        setPage(0);
    };

    const handleOpenAdd = async () => {
        const sedeId = filters.sede_id || "";
        if (!sedes.length) {
            Swal.fire("Atención", "Primero registra una sede activa.", "warning");
            return;
        }

        await fetchCatalogo(sedeId || null);
        setSelectedSocios([]);
        setBuscarSocio("");
        setAssignForm({
            sede_id: sedeId,
            membresia_id: filters.membresia_id || "",
            fecha_inicio: today(),
            modo_conflicto: "RENOVAR",
        });
        setAddOpen(true);
    };

    const handleAddSocio = (socio) => {
        const active = isActiveMembership(socio.membresia_actual);
        const isSamePlanAndSede = active
            && socio.membresia_actual.membresia_id === Number(assignForm.membresia_id)
            && socio.membresia_actual.sede_id === Number(assignForm.sede_id);

        if (isSamePlanAndSede) {
            Swal.fire("Atención", "El cliente ya tiene esta membresía activa en esta sede.", "warning");
            return;
        }

        setSelectedSocios([socio]);
    };

    const handleRemoveSocio = (personaId) => {
        setSelectedSocios((prev) => prev.filter((item) => Number(item.persona_id) !== Number(personaId)));
    };

    const handleSaveBatch = async () => {
        if (!selectedSocios.length) {
            Swal.fire("Atención", "Selecciona un cliente para la asignación.", "warning");
            return;
        }
        if (!assignForm.sede_id || !assignForm.membresia_id || !selectedAssignPlan) {
            Swal.fire("Atención", "Selecciona sede y membresía para continuar.", "warning");
            return;
        }

        const autoFactura = selectedAssignPlan?.facturacion_automatica;
        const textMessage = autoFactura
            ? `Se asignará la membresía a ${selectedSocios[0]?.nombre_completo || "el cliente"} y se generará una deuda PENDIENTE de $${Number(selectedAssignPlan.precio || 0).toFixed(2)}.`
            : `Se asignará la membresía a ${selectedSocios[0]?.nombre_completo || "el cliente"} sin generar deuda automática.`;

        const confirmText = autoFactura ? "Sí, asignar y facturar" : "Sí, asignar membresía";
        
        const saveIconSvg = `<span class="MuiButton-startIcon"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"></path></svg></span>`;
        const cancelIconSvg = `<span class="MuiButton-startIcon"><svg focusable="false" aria-hidden="true" viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg></span>`;

        const confirmResult = await Swal.fire({
            title: "¿Estás seguro?",
            text: textMessage,
            icon: "warning",
            showCancelButton: true,
            buttonsStyling: false,
            customClass: {
                confirmButton: "btn-save",
                cancelButton: "btn-cancel"
            },
            confirmButtonText: `<div style="display: flex; align-items: center;">${saveIconSvg} ${confirmText}</div>`,
            cancelButtonText: `<div style="display: flex; align-items: center;">${cancelIconSvg} Cancelar</div>`
        });

        if (!confirmResult.isConfirmed) {
            return;
        }

        setSaving(true);
        try {
            await apiClient.post("/gimnasio/membresias/asignaciones/lote", {
                persona_ids: selectedSocios.map((socio) => socio.persona_id),
                membresia_id: Number(assignForm.membresia_id),
                sede_id: Number(assignForm.sede_id),
                fecha_inicio: assignForm.fecha_inicio,
                fecha_fin: fechaFin,
                precio_aplicado: Number(selectedAssignPlan.precio || 0),
                modo_conflicto: assignForm.modo_conflicto,
            });

            setAddOpen(false);
            setSelectedSocios([]);
            await fetchSocios();
            await fetchHistory();
            Swal.fire("Éxito", "Membresías asignadas correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo asignar la membresía."), "error");
        } finally {
            setSaving(false);
        }
    };

    const handleRenewFromAssignment = (item) => {
        setFilters((prev) => ({
            ...prev,
            sede_id: item.sede_id ? String(item.sede_id) : prev.sede_id,
            membresia_id: String(item.membresia_id),
        }));
        const socio = socios.find((row) => Number(row.socio_id) === Number(item.socio_id));
        setSelectedSocios(socio ? [socio] : []);
        setAssignForm({
            fecha_inicio: item.fecha_fin ? addDays(item.fecha_fin, 1) : today(),
            modo_conflicto: "RENOVAR",
        });
        setAddOpen(true);
    };

    const handleDeleteAsignacion = async (id) => {
        const result = await Swal.fire({
            title: "¿Eliminar asignación?",
            text: "Se retirará esta membresía del historial activo del socio.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.delete(`/gimnasio/membresias/asignaciones/${id}`);
            await fetchHistory();
            await fetchSocios();
            Swal.fire("Eliminado", "Asignación eliminada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo eliminar la asignación."), "error");
        }
    };

    return (
        <Stack spacing={3}>
            <PageHeader
                title="Asignación de Membresías"
                icon={<AssignmentTurnedInIcon sx={{ fontSize: 24 }} />}
                rightContent={
                    hasSearched ? (
                        <>
                            {loadingHistory && (
                                <Chip label="ACTUALIZANDO" sx={{ fontWeight: 900, bgcolor: "#fff7ed", color: "#b45309" }} />
                            )}
                            <Box sx={{ px: 2, py: 0.8, borderRadius: "6px", bgcolor: "rgba(15, 23, 42, 0.05)", color: "#0f172a", fontSize: "11px", fontWeight: 900 }}>
                                {clientesAsignacion.length} CLIENTES
                            </Box>
                        </>
                    ) : null
                }
            />

            <Paper
                className="tg-module-card"
                elevation={0}
                sx={{
                    ...pagePaperSx,
                    bgcolor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                }}
            >
                <Box className="tg-module-toolbar">
                    <Stack className="tg-module-toolbar__filters" direction="row" spacing={1.5} alignItems="center">
                        <TextField
                            size="small"
                            placeholder="Buscar por cédula, cliente o código..."
                            value={filters.buscar}
                            onChange={(e) => handleFilterChange("buscar", e.target.value)}
                            sx={{ ...filterInputSx, width: 300 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <FormControl size="small" sx={{ ...filterInputSx, width: 200 }}>
                            <Select
                                value={filters.sede_id}
                                onChange={(e) => handleFilterChange("sede_id", e.target.value)}
                                displayEmpty
                                sx={{ fontSize: 13 }}
                            >
                                <MenuItem value="">Todas las sedes</MenuItem>
                                {sedes.map((sede) => (
                                    <MenuItem key={sede.id} value={String(sede.id)}>{sede.nombre}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ ...filterInputSx, width: 240 }}>
                            <Select
                                value={filters.membresia_id}
                                onChange={(e) => handleFilterChange("membresia_id", e.target.value)}
                                displayEmpty
                                sx={{ fontSize: 13 }}
                            >
                                <MenuItem value="">Todas las membresías</MenuItem>
                                {catalogo.filter((plan) => plan.activa).map((plan) => (
                                    <MenuItem key={plan.id} value={String(plan.id)}>
                                        {plan.nombre} - {money(plan.precio)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>

                    <Stack className="tg-module-toolbar__actions" direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                        {selectedHistoryPlan && (
                            <Chip label={`Plan: ${selectedHistoryPlan.nombre}`} sx={semanticChipSx("inventory")} />
                        )}
                        <PremiumButton variant="anadir" onClick={handleOpenAdd}>
                            Añadir
                        </PremiumButton>
                    </Stack>
                </Box>

                <Box className="tg-module-table-area">
                    <TableContainer className="tg-table-wrap tg-table-wrap--scroll" component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "6px", overflow: "hidden" }}>
                        <Table size="small" sx={tableSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Cédula</TableCell>
                                    <TableCell>Membresía actual</TableCell>
                                    <TableCell>Sede</TableCell>
                                    <TableCell>Vigencia</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {clientesAsignacion.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <Box className="tg-empty-state">
                                                <Box>
                                                    <Box className="tg-empty-state__icon">
                                                        <SearchOutlinedIcon sx={{ fontSize: 34 }} />
                                                    </Box>
                                                    <p className="tg-empty-state__title">Sin asignaciones</p>
                                                    <p className="tg-empty-state__text">
                                                        No hay asignaciones registradas para estos filtros.
                                                    </p>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedClientes.map((cliente) => {
                                        const actual = cliente.actual;
                                        const status = getMembershipStatus(actual?.fecha_fin);

                                        return (
                                            <TableRow key={cliente.key}>
                                                <TableCell>
                                                    <Typography sx={{ fontWeight: 800 }}>{cliente.nombre_completo}</Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>{cliente.codigo_socio}</Typography>
                                                </TableCell>
                                                <TableCell>{cliente.cedula}</TableCell>
                                                <TableCell>
                                                    <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{actual?.membresia_nombre || "-"}</Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                                                        {cliente.total_membresias} membresía{cliente.total_membresias === 1 ? "" : "s"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{actual?.sede_nombre || "-"}</TableCell>
                                                <TableCell>
                                                    <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{actual?.fecha_inicio || "-"}</Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>hasta {actual?.fecha_fin || "-"}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={status.label} sx={semanticChipSx(status.tone)} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Stack direction="row" spacing={1} justifyContent="center">
                                                        <IconButton onClick={() => setDetalleClienteKey(cliente.key)} sx={semanticIconButtonSx("inventory")} title="Ver membresías">
                                                            <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                        {actual && (
                                                            <IconButton onClick={() => handleRenewFromAssignment(actual)} sx={semanticIconButtonSx("mustard")} title="Editar membresía actual">
                                                                <EditIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        )}
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        className="tg-table-pagination"
                        component="div"
                        count={clientesAsignacion.length}
                        page={page}
                        onPageChange={(_event, nextPage) => setPage(nextPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={() => {}}
                        rowsPerPageOptions={[5]}
                        labelRowsPerPage="Filas por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    />
                </Box>
            </Paper>

            <PremiumModal
                open={Boolean(detalleCliente)}
                onClose={() => setDetalleClienteKey(null)}
                title={detalleCliente?.nombre_completo || "Membresías del cliente"}
                subtitle={detalleCliente ? `${detalleCliente.codigo_socio || "Sin código"} · ${detalleCliente.cedula || "Sin cédula"}` : ""}
                icon={<VisibilityOutlinedIcon sx={{ fontSize: 22, color: "#fff" }} />}
                maxWidth="md"
                actions={
                    <PremiumButton variant="cancelar" onClick={() => setDetalleClienteKey(null)}>
                        Cerrar
                    </PremiumButton>
                }
            >
                <Stack spacing={2}>
                    <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "6px", overflow: "hidden" }}>
                        <Table size="small" sx={tableSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Membresía</TableCell>
                                    <TableCell>Sede</TableCell>
                                    <TableCell>Vigencia</TableCell>
                                    <TableCell>Precio</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(detalleCliente?.membresias || []).map((item) => {
                                    const status = getMembershipStatus(item.fecha_fin);

                                    return (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Typography sx={{ fontWeight: 800 }}>{item.membresia_nombre}</Typography>
                                                <Typography sx={{ fontSize: 11, color: "#64748b" }}>#{item.id}</Typography>
                                            </TableCell>
                                            <TableCell>{item.sede_nombre || "-"}</TableCell>
                                            <TableCell>
                                                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>{item.fecha_inicio}</Typography>
                                                <Typography sx={{ fontSize: 11, color: "#64748b" }}>hasta {item.fecha_fin}</Typography>
                                            </TableCell>
                                            <TableCell>{money(item.precio)}</TableCell>
                                            <TableCell>
                                                <Chip label={status.label} sx={semanticChipSx(status.tone)} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Stack direction="row" spacing={1} justifyContent="center">
                                                    <IconButton onClick={() => handleRenewFromAssignment(item)} sx={semanticIconButtonSx("mustard")} title="Editar membresía">
                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                    <IconButton onClick={() => handleDeleteAsignacion(item.id)} sx={semanticIconButtonSx("danger")} title="Eliminar">
                                                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Stack>
            </PremiumModal>

            <PremiumModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                title="Asignar membresía"
                subtitle={selectedAssignPlan ? `${selectedAssignPlan.nombre} · ${money(selectedAssignPlan.precio)}` : "Busca un cliente, selecciona membresía y guarda"}
                icon={<PersonAddAltIcon sx={{ fontSize: 22, color: "#fff" }} />}
                maxWidth="lg"
                actions={
                    <>
                        <PremiumButton variant="cancelar" onClick={() => setAddOpen(false)}>
                            Cancelar
                        </PremiumButton>
                        <PremiumButton variant="guardar" onClick={handleSaveBatch} loading={saving} disabled={!canSaveAssignment}>
                            Guardar
                        </PremiumButton>
                    </>
                }
            >
                <Stack spacing={2.25}>
                    {hasConflicts && selectedAssignPlan && (
                        <Box sx={{ p: 1.25, border: "1px solid #f59e0b", color: "#92400e", bgcolor: "rgba(245,158,11,0.08)", fontSize: 12, fontWeight: 800 }}>
                            El cliente seleccionado tiene una membresía activa. Se aplicará la opción elegida arriba.
                        </Box>
                    )}

                    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1.25fr 0.75fr" } }}>
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.25 }}>
                                <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Buscar cliente</Typography>
                                <TextField
                                    size="small"
                                    placeholder="Nombre, cédula o código..."
                                    value={buscarSocio}
                                    onChange={(e) => setBuscarSocio(e.target.value)}
                                    sx={{ ...filterInputSx, width: 280 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>
                            <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none", maxHeight: 360 }}>
                                <Table size="small" sx={tableSx} stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Cliente</TableCell>
                                            <TableCell>Membresía actual</TableCell>
                                            <TableCell align="center">Añadir</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sociosFiltered.map((socio) => {
                                            const active = isActiveMembership(socio.membresia_actual);
                                            const isSelected = selectedSocios.some((s) => Number(s.persona_id) === Number(socio.persona_id));
                                            const hasOtherSelected = selectedSocios.length > 0 && !isSelected;

                                            return (
                                                <TableRow key={socio.persona_id} hover>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 800 }}>{socio.nombre_completo}</Typography>
                                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{socio.codigo_socio} · {socio.cedula}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {socio.membresia_actual ? (
                                                            <>
                                                                <Typography sx={{ fontWeight: 800, fontSize: 12 }}>{socio.membresia_actual.nombre}</Typography>
                                                                <Chip
                                                                    size="small"
                                                                    label={`${active ? "Activa" : "Vencida"} hasta ${socio.membresia_actual.fecha_fin}`}
                                                                    sx={semanticChipSx(active ? "mustard" : "neutral")}
                                                                />
                                                            </>
                                                        ) : (
                                                            <Chip size="small" label="Sin membresía" sx={semanticChipSx("neutral")} />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <IconButton
                                                            disabled={isSelected}
                                                            onClick={() => handleAddSocio(socio)}
                                                            sx={semanticIconButtonSx(isSelected ? "neutral" : hasOtherSelected ? "mustard" : "success")}
                                                            title={hasOtherSelected ? "Reemplazar cliente seleccionado" : "Seleccionar cliente"}
                                                        >
                                                            <AddIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>

                        <Box>
                            <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.25 }}>Membresía a asignar</Typography>
                            <Stack spacing={1.25} sx={{ mb: 2 }}>
                                <FormControl size="small" sx={modalFieldSx}>
                                    <Select
                                        value={assignForm.sede_id}
                                        onChange={async (e) => {
                                            const sedeId = e.target.value;
                                            setAssignForm((prev) => ({ ...prev, sede_id: sedeId, membresia_id: "" }));
                                            await fetchCatalogo(sedeId);
                                        }}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Sede</MenuItem>
                                        {sedes.map((sede) => (
                                            <MenuItem key={sede.id} value={String(sede.id)}>{sede.nombre}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={modalFieldSx}>
                                    <Select
                                        value={assignForm.membresia_id}
                                        onChange={(e) => {
                                            setAssignForm((prev) => ({ ...prev, membresia_id: e.target.value }));
                                        }}
                                        displayEmpty
                                    >
                                        <MenuItem value="">Membresía</MenuItem>
                                        {catalogo.filter((plan) => plan.activa).map((plan) => (
                                            <MenuItem key={plan.id} value={String(plan.id)}>
                                                {plan.nombre} - {money(plan.precio)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    size="small"
                                    type="date"
                                    value={assignForm.fecha_inicio}
                                    onChange={(e) => setAssignForm((prev) => ({ ...prev, fecha_inicio: e.target.value }))}
                                    sx={modalFieldSx}
                                />

                                <FormControl size="small" sx={modalFieldSx}>
                                    <Select
                                        value={assignForm.modo_conflicto}
                                        onChange={(e) => setAssignForm((prev) => ({ ...prev, modo_conflicto: e.target.value }))}
                                    >
                                        <MenuItem value="RENOVAR">Si tiene activa: renovar al finalizar</MenuItem>
                                        <MenuItem value="REEMPLAZAR">Si tiene activa: reemplazar desde la fecha</MenuItem>
                                    </Select>
                                </FormControl>

                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip icon={<EventAvailableIcon />} label={fechaFin ? `Fin: ${fechaFin}` : "Fin pendiente"} sx={semanticChipSx(fechaFin ? "inventory" : "neutral")} />
                                    <Chip label={selectedAssignPlan ? `Total: ${money(selectedTotal)}` : "Total pendiente"} sx={semanticChipSx(selectedAssignPlan ? "mustard" : "neutral")} />
                                </Stack>
                                {!canSaveAssignment && (
                                    <Typography sx={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                                        Selecciona un cliente, una sede y una membresía para guardar.
                                    </Typography>
                                )}
                            </Stack>

                            <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.25 }}>Cliente seleccionado</Typography>
                            <Stack spacing={1.1} sx={{ maxHeight: 405, overflowY: "auto", pr: 0.5 }}>
                                {selectedSocios.length === 0 ? (
                                    <Box sx={{ border: "1px dashed #cbd5e1", p: 3, textAlign: "center", color: "#64748b" }}>
                                        Selecciona un cliente desde la tabla.
                                    </Box>
                                ) : (
                                    selectedSocios.map((socio) => {
                                        const active = isActiveMembership(socio.membresia_actual);
                                        return (
                                            <Box key={socio.persona_id} sx={{ p: 1.25, border: "1px solid #e2e8f0", bgcolor: "#fff", display: "flex", justifyContent: "space-between", gap: 1 }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 13 }}>{socio.nombre_completo}</Typography>
                                                    <Typography sx={{ color: "#64748b", fontSize: 11 }}>{socio.cedula}</Typography>
                                                    {socio.membresia_actual && (
                                                        <Typography sx={{ mt: 0.5, color: active ? "#92400e" : "#64748b", fontSize: 11, fontWeight: 800 }}>
                                                            {socio.membresia_actual.nombre} hasta {socio.membresia_actual.fecha_fin}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <IconButton size="small" onClick={() => handleRemoveSocio(socio.persona_id)} sx={semanticIconButtonSx("danger")}>
                                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Box>
                                        );
                                    })
                                )}
                            </Stack>
                        </Box>
                    </Box>
                </Stack>
            </PremiumModal>
        </Stack>
    );
}
