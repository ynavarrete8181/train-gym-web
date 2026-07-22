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
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Swal from "sweetalert2";
import PageHeader from "../../components/ui/PageHeader";
import PremiumButton from "../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";

const today = () => new Date().toISOString().slice(0, 10);

export default function ReservasDiarias() {
    const [fecha, setFecha] = useState(today());
    const [sedeId, setSedeId] = useState("");
    const [estado, setEstado] = useState("");
    const [membresiaId, setMembresiaId] = useState("");
    const [buscar, setBuscar] = useState("");
    const [sedes, setSedes] = useState([]);
    const [membresias, setMembresias] = useState([]);
    const [cupos, setCupos] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [reporte, setReporte] = useState({ resumen: {}, por_membresia: [] });
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [cupoPage, setCupoPage] = useState(0);

    const reservasFiltradas = useMemo(() => {
        const term = buscar.trim().toLowerCase();
        if (!term) return reservas;
        return reservas.filter((item) => [
            item.persona_nombre,
            item.persona_cedula,
            item.membresia_nombre,
            item.servicio_nombre,
            item.sede_nombre,
        ].some((value) => String(value || "").toLowerCase().includes(term)));
    }, [buscar, reservas]);

    const resumen = reporte.resumen || {};

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [cuposRes, reservasRes, reporteRes] = await Promise.all([
                apiClient.get("/gimnasio/reservas/disponibilidad", {
                    params: {
                        fecha,
                        sede_id: sedeId || undefined,
                        membresia_id: membresiaId || undefined,
                    },
                }),
                apiClient.get("/gimnasio/reservas", {
                    params: {
                        fecha,
                        sede_id: sedeId || undefined,
                        estado: estado || undefined,
                        membresia_id: membresiaId || undefined,
                        buscar: buscar.trim() || undefined,
                    },
                }),
                apiClient.get("/gimnasio/reservas/reporte-diario", {
                    params: {
                        fecha,
                        sede_id: sedeId || undefined,
                        membresia_id: membresiaId || undefined,
                    },
                }),
            ]);

            setCupos(Array.isArray(cuposRes.data) ? cuposRes.data : []);
            setReservas(Array.isArray(reservasRes.data) ? reservasRes.data : []);
            setReporte(reporteRes.data || { resumen: {}, por_membresia: [] });
            setPage(0);
            setCupoPage(0);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar reservas del día."), "error");
        } finally {
            setLoading(false);
        }
    }, [buscar, estado, fecha, membresiaId, sedeId]);

    useEffect(() => {
        Promise.all([
            apiClient.get("/inventario/sedes"),
            apiClient.get("/gimnasio/membresias"),
        ])
            .then(([sedesRes, membresiasRes]) => {
                setSedes(Array.isArray(sedesRes.data) ? sedesRes.data : []);
                setMembresias(Array.isArray(membresiasRes.data) ? membresiasRes.data : []);
            })
            .catch(() => {
                setSedes([]);
                setMembresias([]);
            });
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const generarCupos = async () => {
        setLoading(true);
        try {
            await apiClient.post("/gimnasio/reservas/generar-cupos", {
                fecha_desde: fecha,
                dias: 7,
                sede_id: sedeId || undefined,
            });
            await fetchData();
            Swal.fire("Listo", "Cupos generados para los próximos 7 días.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron generar los cupos."), "error");
        } finally {
            setLoading(false);
        }
    };

    const paginated = reservasFiltradas.slice(page * 5, page * 5 + 5);
    const cuposPaginated = cupos.slice(cupoPage * 5, cupoPage * 5 + 5);

    const cancelarReserva = async (reserva) => {
        const result = await Swal.fire({
            title: "Cancelar reserva",
            text: `¿Deseas cancelar la reserva de ${reserva.persona_nombre}?`,
            input: "text",
            inputPlaceholder: "Motivo opcional",
            showCancelButton: true,
            confirmButtonText: "Cancelar reserva",
            cancelButtonText: "Cerrar",
            confirmButtonColor: "#ef4444",
        });

        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            await apiClient.post(`/gimnasio/reservas/${reserva.id}/cancelar`, {
                motivo: result.value || "Cancelación administrativa",
            });
            await fetchData();
            Swal.fire("Listo", "Reserva cancelada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cancelar la reserva."), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", p: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: 1600, mx: "auto" }}>
                <Stack spacing={3}>
                    <PageHeader
                        title="Reservas del Día"
                        icon={<EventAvailableIcon sx={{ fontSize: 24 }} />}
                        rightContent={
                            <Box sx={{ px: 2, py: 0.8, borderRadius: "6px", bgcolor: "rgba(15, 23, 42, 0.05)", color: "#0f172a", fontSize: "11px", fontWeight: 900 }}>
                                {reservas.length} RESERVAS
                            </Box>
                        }
                    />

                    <Paper elevation={0} sx={{ ...pagePaperSx, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <Box sx={{ px: 4, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1, flexWrap: "wrap" }}>
                                <TextField
                                    size="small"
                                    type="date"
                                    label="Fecha"
                                    value={fecha}
                                    onChange={(event) => setFecha(event.target.value)}
                                    sx={{ ...filterInputSx, width: 180 }}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <FormControl size="small" sx={{ ...filterInputSx, width: 220 }}>
                                    <Select value={sedeId} onChange={(event) => setSedeId(event.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Todas las sedes</MenuItem>
                                        {sedes.map((sede) => (
                                            <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ ...filterInputSx, width: 180 }}>
                                    <Select value={estado} onChange={(event) => setEstado(event.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Cualquier estado</MenuItem>
                                        <MenuItem value="RESERVADA">Reservada</MenuItem>
                                        <MenuItem value="ASISTIO">Asistió</MenuItem>
                                        <MenuItem value="CANCELADA">Cancelada</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small" sx={{ ...filterInputSx, width: 240 }}>
                                    <Select value={membresiaId} onChange={(event) => setMembresiaId(event.target.value)} displayEmpty sx={{ fontSize: 13 }}>
                                        <MenuItem value="">Todas las membresías</MenuItem>
                                        {membresias.map((membresia) => (
                                            <MenuItem key={membresia.id} value={membresia.id}>{membresia.nombre}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <TextField
                                    size="small"
                                    placeholder="Buscar por cédula, cliente, membresía..."
                                    value={buscar}
                                    onChange={(event) => setBuscar(event.target.value)}
                                    sx={{ ...filterInputSx, width: 320 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Stack>

                            <PremiumButton variant="anadir" onClick={generarCupos} loading={loading}>
                                Generar cupos
                            </PremiumButton>
                        </Box>

                        <Box sx={{ px: 4, pb: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(6, 1fr)" }, gap: 1.5 }}>
                            <Metric label="Capacidad" value={resumen.capacidad || 0} />
                            <Metric label="Disponibles" value={resumen.disponibles || 0} />
                            <Metric label="Reservados" value={resumen.reservados || 0} />
                            <Metric label="Asistieron" value={resumen.asistieron || 0} />
                            <Metric label="No asistieron" value={resumen.no_asistieron || 0} />
                            <Metric label="Cancelados" value={resumen.cancelados || 0} />
                        </Box>

                        <Box sx={{ px: 4, pb: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                                <Box>
                                    <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Cupos diarios</Typography>
                                    <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                                        Capacidad por sede, hora, servicio y membresías que están usando cada cupo.
                                    </Typography>
                                </Box>
                                <Chip label={`${cupos.length} cupos`} sx={semanticChipSx("neutral")} />
                            </Stack>
                            <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "6px", overflow: "hidden", mb: 3 }}>
                                <Table size="small" sx={tableSx}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Hora</TableCell>
                                            <TableCell>Sede</TableCell>
                                            <TableCell>Servicio</TableCell>
                                            <TableCell>Membresías</TableCell>
                                            <TableCell align="center">Cap.</TableCell>
                                            <TableCell align="center">Res.</TableCell>
                                            <TableCell align="center">Asist.</TableCell>
                                            <TableCell align="center">No asist.</TableCell>
                                            <TableCell align="center">Disp.</TableCell>
                                            <TableCell>Estado</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {cuposPaginated.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={10} align="center" sx={{ py: 5, color: "#64748b" }}>
                                                    No hay cupos generados para esos filtros.
                                                </TableCell>
                                            </TableRow>
                                        ) : cuposPaginated.map((cupo) => (
                                            <TableRow key={cupo.id}>
                                                <TableCell>
                                                    <Typography sx={{ fontWeight: 900 }}>{cupo.hora_inicio}</Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>{cupo.hora_fin}</Typography>
                                                </TableCell>
                                                <TableCell>{cupo.sede_nombre}</TableCell>
                                                <TableCell>{cupo.servicio_nombre}</TableCell>
                                                <TableCell>{cupo.membresias_uso || "Sin reservas"}</TableCell>
                                                <TableCell align="center">{cupo.capacidad}</TableCell>
                                                <TableCell align="center">{cupo.reservados}</TableCell>
                                                <TableCell align="center">{cupo.asistieron}</TableCell>
                                                <TableCell align="center">{cupo.no_asistieron}</TableCell>
                                                <TableCell align="center">{cupo.disponibles}</TableCell>
                                                <TableCell>
                                                    <Chip label={cupo.estado} sx={semanticChipSx(cupo.estado === "DISPONIBLE" ? "success" : "mustard")} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={cupos.length}
                                page={cupoPage}
                                onPageChange={(_event, nextPage) => setCupoPage(nextPage)}
                                rowsPerPage={5}
                                rowsPerPageOptions={[5]}
                                labelRowsPerPage="Filas por página:"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                            />

                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5, mt: 2 }}>
                                <Box>
                                    <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>Reservas registradas</Typography>
                                    <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                                        Clientes reservados, membresía aplicada, estado y cancelación administrativa.
                                    </Typography>
                                </Box>
                                <Chip label={`${reservasFiltradas.length} reservas`} sx={semanticChipSx("mustard")} />
                            </Stack>
                            <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "6px", overflow: "hidden" }}>
                                <Table size="small" sx={tableSx}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Hora</TableCell>
                                            <TableCell>Cliente</TableCell>
                                            <TableCell>Membresía</TableCell>
                                            <TableCell>Sede</TableCell>
                                            <TableCell>Servicio</TableCell>
                                            <TableCell>Estado</TableCell>
                                            <TableCell align="center">Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginated.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748b" }}>
                                                    No hay reservas para esos filtros.
                                                </TableCell>
                                            </TableRow>
                                        ) : paginated.map((reserva) => (
                                            <TableRow key={reserva.id}>
                                                <TableCell>
                                                    <Typography sx={{ fontWeight: 900 }}>{String(reserva.hora_inicio || "").slice(0, 5)}</Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>{String(reserva.hora_fin || "").slice(0, 5)}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography sx={{ fontWeight: 900 }}>{reserva.persona_nombre}</Typography>
                                                    <Typography sx={{ fontSize: 11, color: "#64748b" }}>{reserva.persona_cedula || "Sin cédula"}</Typography>
                                                </TableCell>
                                                <TableCell>{reserva.membresia_nombre || "-"}</TableCell>
                                                <TableCell>{reserva.sede_nombre}</TableCell>
                                                <TableCell>{reserva.servicio_nombre || "-"}</TableCell>
                                                <TableCell>
                                                    <Chip label={reserva.estado} sx={semanticChipSx(reserva.estado === "RESERVADA" ? "success" : reserva.estado === "ASISTIO" ? "primary" : "neutral")} />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton
                                                        size="small"
                                                        disabled={reserva.estado !== "RESERVADA" || loading}
                                                        onClick={() => cancelarReserva(reserva)}
                                                        sx={{ border: "1px solid #fecaca", borderRadius: "6px", color: "#ef4444" }}
                                                    >
                                                        <CancelOutlinedIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <TablePagination
                                component="div"
                                count={reservasFiltradas.length}
                                page={page}
                                onPageChange={(_event, nextPage) => setPage(nextPage)}
                                rowsPerPage={5}
                                rowsPerPageOptions={[5]}
                                labelRowsPerPage="Filas por página:"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                            />

                            {Array.isArray(reporte.por_membresia) && reporte.por_membresia.length > 0 ? (
                                <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }, gap: 1.5 }}>
                                    {reporte.por_membresia.map((item) => (
                                        <Box key={item.membresia} sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", p: 1.6, bgcolor: "#f8fafc" }}>
                                            <Typography sx={{ fontWeight: 900, color: "#0f172a" }}>{item.membresia}</Typography>
                                            <Typography sx={{ mt: 0.5, fontSize: 12, color: "#64748b" }}>
                                                Reservados: {item.reservados} · Asistieron: {item.asistieron} · No asistieron: {item.no_asistieron}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            ) : null}
                        </Box>
                    </Paper>
                </Stack>
            </Box>
        </Box>
    );
}

function Metric({ label, value }) {
    return (
        <Box sx={{ border: "1px solid #e2e8f0", borderRadius: "6px", p: 1.6, bgcolor: "#f8fafc" }}>
            <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 900, textTransform: "uppercase" }}>{label}</Typography>
            <Typography sx={{ fontSize: 24, color: "#0f172a", fontWeight: 950 }}>{value}</Typography>
        </Box>
    );
}
