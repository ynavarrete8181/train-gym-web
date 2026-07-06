import { useEffect, useMemo, useState } from "react";
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
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import Swal from "sweetalert2";

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
    const [saving, setSaving] = useState(false);

    const [filters, setFilters] = useState({
        sede_id: "",
        membresia_id: "",
    });
    const [addOpen, setAddOpen] = useState(false);
    const [buscarSocio, setBuscarSocio] = useState("");
    const [selectedSocios, setSelectedSocios] = useState([]);
    const [assignForm, setAssignForm] = useState({
        fecha_inicio: today(),
        modo_conflicto: "RENOVAR",
    });

    const selectedPlan = useMemo(
        () => catalogo.find((plan) => String(plan.id) === String(filters.membresia_id)),
        [catalogo, filters.membresia_id]
    );

    const fechaFin = useMemo(() => {
        if (!selectedPlan || !assignForm.fecha_inicio) return "";
        return addDays(assignForm.fecha_inicio, Number(selectedPlan.duracion_dias || 1) - 1);
    }, [selectedPlan, assignForm.fecha_inicio]);

    const selectedTotal = Number(selectedPlan?.precio || 0) * selectedSocios.length;
    const hasConflicts = selectedSocios.some((socio) => isActiveMembership(socio.membresia_actual));

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

    const fetchHistory = async () => {
        if (!filters.sede_id || !filters.membresia_id) {
            Swal.fire("Atención", "Selecciona sede y membresía antes de buscar.", "warning");
            return;
        }

        setLoadingHistory(true);
        try {
            const { data } = await apiClient.get("/gimnasio/membresias/asignaciones", {
                params: {
                    sede_id: filters.sede_id,
                    membresia_id: filters.membresia_id,
                },
            });
            setAsignaciones(Array.isArray(data) ? data : []);
            setHasSearched(true);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el historial de asignaciones."), "error");
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const sedesData = await fetchSedes();
                setSedes(sedesData);
                setFilters((prev) => ({
                    ...prev,
                    sede_id: prev.sede_id || (sedesData[0]?.id ? String(sedesData[0].id) : ""),
                }));
                await fetchSocios();
            } catch (error) {
                Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el módulo de asignaciones."), "error");
            }
        })();
    }, []);

    useEffect(() => {
        if (!filters.sede_id) return;
        fetchCatalogo(filters.sede_id).catch((error) => {
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
        setHasSearched(false);
        setAsignaciones([]);
    };

    const handleOpenAdd = () => {
        if (!filters.sede_id || !filters.membresia_id || !selectedPlan) {
            Swal.fire("Atención", "Primero selecciona sede y membresía.", "warning");
            return;
        }
        setSelectedSocios([]);
        setBuscarSocio("");
        setAssignForm({ fecha_inicio: today(), modo_conflicto: "RENOVAR" });
        setAddOpen(true);
    };

    const handleAddSocio = (socio) => {
        setSelectedSocios((prev) => {
            if (prev.some((item) => Number(item.persona_id) === Number(socio.persona_id))) return prev;
            return [...prev, socio];
        });
    };

    const handleRemoveSocio = (personaId) => {
        setSelectedSocios((prev) => prev.filter((item) => Number(item.persona_id) !== Number(personaId)));
    };

    const handleSaveBatch = async () => {
        if (!selectedSocios.length) {
            Swal.fire("Atención", "Agrega al menos un usuario a la asignación.", "warning");
            return;
        }

        setSaving(true);
        try {
            await apiClient.post("/gimnasio/membresias/asignaciones/lote", {
                persona_ids: selectedSocios.map((socio) => socio.persona_id),
                membresia_id: Number(filters.membresia_id),
                sede_id: Number(filters.sede_id),
                fecha_inicio: assignForm.fecha_inicio,
                fecha_fin: fechaFin,
                precio_aplicado: Number(selectedPlan.precio || 0),
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
            <Paper
                elevation={0}
                sx={{
                    ...pagePaperSx,
                    p: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <AssignmentTurnedInIcon sx={{ color: "#0f172a" }} />
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                            Asignación de Membresías
                        </Typography>
                        <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                            Consulta historial por sede y membresía; luego agrega usuarios a ese plan.
                        </Typography>
                    </Box>
                </Box>

                {hasSearched && (
                    <Chip label={`${asignaciones.length} REGISTROS`} sx={{ fontWeight: 900, bgcolor: "#f1f5f9", color: "#64748b" }} />
                )}
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.5 }}>Consulta de asignaciones</Typography>
                <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1.2fr auto" }, alignItems: "center" }}>
                    <FormControl size="small" sx={modalFieldSx}>
                        <Select value={filters.sede_id} onChange={(e) => handleFilterChange("sede_id", e.target.value)} displayEmpty>
                            <MenuItem value="">Selecciona sede</MenuItem>
                            {sedes.map((sede) => (
                                <MenuItem key={sede.id} value={String(sede.id)}>{sede.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={modalFieldSx}>
                        <Select value={filters.membresia_id} onChange={(e) => handleFilterChange("membresia_id", e.target.value)} displayEmpty>
                            <MenuItem value="">Selecciona membresía</MenuItem>
                            {catalogo.filter((plan) => plan.activa).map((plan) => (
                                <MenuItem key={plan.id} value={String(plan.id)}>
                                    {plan.nombre} - {money(plan.precio)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <PremiumButton variant="outline" onClick={fetchHistory} loading={loadingHistory} startIcon={<SearchOutlinedIcon />}>
                        Buscar
                    </PremiumButton>
                </Box>
            </Paper>

            {hasSearched && (
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2, flexWrap: "wrap" }}>
                        <Box>
                            <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Historial de asignaciones</Typography>
                            <Typography sx={{ color: "#64748b", fontSize: 12 }}>
                                Resultado de la sede y membresía seleccionadas.
                            </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                            {selectedPlan && (
                                <>
                                    <Chip label={`Plan: ${selectedPlan.nombre}`} sx={semanticChipSx("inventory")} />
                                    <Chip label={`Precio actual: ${money(selectedPlan.precio)}`} sx={semanticChipSx("mustard")} />
                                </>
                            )}
                            <PremiumButton variant="anadir" onClick={handleOpenAdd}>
                                Añadir
                            </PremiumButton>
                        </Stack>
                    </Box>

                    <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                        <Table size="small" sx={tableSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Usuario</TableCell>
                                    <TableCell>Cédula</TableCell>
                                    <TableCell>Vigencia</TableCell>
                                    <TableCell>Precio aplicado</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {asignaciones.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                                            No hay asignaciones registradas para esta sede y membresía.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    asignaciones.map((item) => {
                                        const status = getMembershipStatus(item.fecha_fin);

                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Typography sx={{ fontWeight: 800 }}>{item.nombre_completo}</Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.codigo_socio}</Typography>
                                                </TableCell>
                                                <TableCell>{item.cedula}</TableCell>
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
                                                        <IconButton onClick={() => handleRenewFromAssignment(item)} sx={semanticIconButtonSx("inventory")} title="Renovar">
                                                            <AutorenewIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                        <IconButton onClick={() => handleDeleteAsignacion(item.id)} sx={semanticIconButtonSx("danger")} title="Eliminar">
                                                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Stack>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <PremiumModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                title="Añadir usuarios"
                subtitle={selectedPlan ? `${selectedPlan.nombre} · ${money(selectedPlan.precio)}` : "Asignación de membresía"}
                icon={<PersonAddAltIcon sx={{ fontSize: 22, color: "#fff" }} />}
                maxWidth="lg"
                actions={
                    <>
                        <PremiumButton variant="cancelar" onClick={() => setAddOpen(false)}>
                            Cancelar
                        </PremiumButton>
                        <PremiumButton variant="guardar" onClick={handleSaveBatch} loading={saving}>
                            Guardar asignación
                        </PremiumButton>
                    </>
                }
            >
                <Stack spacing={2.25}>
                    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "0.8fr 1.2fr 1fr" }, alignItems: "center" }}>
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
                            <Chip icon={<EventAvailableIcon />} label={`Fin: ${fechaFin || "-"}`} sx={semanticChipSx("inventory")} />
                            <Chip label={`Total: ${money(selectedTotal)}`} sx={semanticChipSx("mustard")} />
                        </Stack>
                    </Box>

                    {hasConflicts && (
                        <Box sx={{ p: 1.25, border: "1px solid #f59e0b", color: "#92400e", bgcolor: "rgba(245,158,11,0.08)", fontSize: 12, fontWeight: 800 }}>
                            Hay usuarios seleccionados con membresía activa. Se aplicará la opción elegida arriba.
                        </Box>
                    )}

                    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1.25fr 0.75fr" } }}>
                        <Box>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1.25 }}>
                                <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Buscar usuario</Typography>
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
                                            <TableCell>Usuario</TableCell>
                                            <TableCell>Membresía actual</TableCell>
                                            <TableCell align="center">Añadir</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sociosFiltered.map((socio) => {
                                            const active = isActiveMembership(socio.membresia_actual);
                                            const isSelected = selectedSocios.some((s) => Number(s.persona_id) === Number(socio.persona_id));

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
                                                        <IconButton disabled={isSelected} onClick={() => handleAddSocio(socio)} sx={semanticIconButtonSx(isSelected ? "neutral" : "success")}>
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
                            <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.25 }}>Usuarios a asignar</Typography>
                            <Stack spacing={1.1} sx={{ maxHeight: 405, overflowY: "auto", pr: 0.5 }}>
                                {selectedSocios.length === 0 ? (
                                    <Box sx={{ border: "1px dashed #cbd5e1", p: 3, textAlign: "center", color: "#64748b" }}>
                                        Añade usuarios desde la tabla.
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
