import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    FormControl,
    InputAdornment,
    InputLabel,
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
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Swal from "sweetalert2";

import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";

const getTone = (adherencia, dolor) => {
    if (dolor >= 7 || adherencia < 60) return "danger";
    if (dolor >= 4 || adherencia < 80) return "mustard";
    return "success";
};

export default function ReportesEvolucion() {
    const [buscar, setBuscar] = useState("");
    const [personaId, setPersonaId] = useState("");
    const [personas, setPersonas] = useState([]);
    const [data, setData] = useState({
        resumen: { clientes: 0, sesiones: 0, adherencia_promedio: 0, rm_registros: 0, evaluaciones: 0 },
        clientes: [],
        ultimos_rm: [],
        ultimas_evaluaciones: [],
    });

    const fetchPersonas = async () => {
        const { data } = await apiClient.get("/gimnasio/personas");
        setPersonas(data || []);
    };

    const fetchData = async () => {
        const { data } = await apiClient.get("/gimnasio/reportes/evolucion", {
            params: {
                buscar: buscar || undefined,
                persona_id: personaId || undefined,
            },
        });
        setData(data || {
            resumen: { clientes: 0, sesiones: 0, adherencia_promedio: 0, rm_registros: 0, evaluaciones: 0 },
            clientes: [],
            ultimos_rm: [],
            ultimas_evaluaciones: [],
        });
    };

    useEffect(() => {
        fetchPersonas().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los clientes."), "error");
        });
    }, []);

    useEffect(() => {
        fetchData().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar Reportes / Evolución."), "error");
        });
    }, [buscar, personaId]);

    const topCliente = useMemo(() => data.clientes[0] || null, [data.clientes]);
    const topRm = useMemo(() => {
        if (!data.ultimos_rm.length) return null;
        return [...data.ultimos_rm].sort((a, b) => Number(b.rm_estimado || 0) - Number(a.rm_estimado || 0))[0];
    }, [data.ultimos_rm]);

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Reportes / Evolución</Typography>
                    <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                        Consolida adherencia, dolor, RPE, evaluaciones y fuerza máxima por cliente.
                    </Typography>
                </Box>

                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                    <TextField
                        size="small"
                        placeholder="Buscar cliente..."
                        value={buscar}
                        onChange={(e) => setBuscar(e.target.value)}
                        sx={{ ...filterInputSx, minWidth: 260 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl size="small" sx={{ ...filterInputSx, minWidth: 260 }}>
                        <InputLabel>Cliente</InputLabel>
                        <Select label="Cliente" value={personaId} onChange={(e) => setPersonaId(e.target.value)}>
                            <MenuItem value="">Todos</MenuItem>
                            {personas.map((persona) => (
                                <MenuItem key={persona.id} value={persona.id}>
                                    {persona.nombres} · {persona.cedula}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Clientes</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{data.resumen.clientes}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Sesiones</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{data.resumen.sesiones}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Adherencia promedio</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{data.resumen.adherencia_promedio}%</Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Registros RM</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{data.resumen.rm_registros}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Evaluaciones</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{data.resumen.evaluaciones}</Typography>
                </Paper>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Cliente más estable</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 900, color: "#0f172a", mt: 0.6 }}>
                        {topCliente ? topCliente.nombre_completo : "Sin datos"}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.4 }}>
                        {topCliente ? `${topCliente.adherencia_promedio}% adherencia · dolor ${topCliente.dolor_promedio}` : "Aún no hay datos suficientes."}
                    </Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>RM destacado</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 900, color: "#0f172a", mt: 0.6 }}>
                        {topRm ? `${topRm.rm_estimado} · ${topRm.ejercicio_nombre}` : "Sin datos"}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.4 }}>
                        {topRm ? `${topRm.nombre_completo} · ${topRm.fecha_registro}` : "Registra RM para comparar evolución."}
                    </Typography>
                </Paper>
            </Stack>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.5 }}>Resumen por cliente</Typography>
                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Sesiones</TableCell>
                                <TableCell>Adherencia</TableCell>
                                <TableCell>Dolor / RPE</TableCell>
                                <TableCell>Mejor RM</TableCell>
                                <TableCell>Última evaluación</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.clientes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        No hay datos de evolución con los filtros actuales.
                                    </TableCell>
                                </TableRow>
                            ) : data.clientes.map((item) => (
                                <TableRow key={item.persona_id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre_completo}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.cedula}</Typography>
                                    </TableCell>
                                    <TableCell>{item.sesiones}</TableCell>
                                    <TableCell>
                                        <Chip label={`${item.adherencia_promedio}%`} sx={semanticChipSx(getTone(item.adherencia_promedio, item.dolor_promedio))} />
                                    </TableCell>
                                    <TableCell>{item.dolor_promedio || 0} / {item.rpe_promedio || 0}</TableCell>
                                    <TableCell>
                                        {item.mejor_rm ? (
                                            <Box>
                                                <Typography sx={{ fontWeight: 800 }}>{item.mejor_rm.valor}</Typography>
                                                <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.mejor_rm.ejercicio_nombre}</Typography>
                                            </Box>
                                        ) : "Sin RM"}
                                    </TableCell>
                                    <TableCell>
                                        {item.ultima_evaluacion ? (
                                            <Box>
                                                <Typography sx={{ fontWeight: 800 }}>{item.ultima_evaluacion.tipo_evaluacion}</Typography>
                                                <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.ultima_evaluacion.fecha_evaluacion}</Typography>
                                            </Box>
                                        ) : "Sin evaluación"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, flex: 1 }}>
                    <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.5 }}>Últimos RM</Typography>
                    <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                        <Table size="small" sx={tableSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Ejercicio</TableCell>
                                    <TableCell>RM</TableCell>
                                    <TableCell>Fecha</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.ultimos_rm.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: "#64748b" }}>
                                            Sin registros RM.
                                        </TableCell>
                                    </TableRow>
                                ) : data.ultimos_rm.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.nombre_completo}</TableCell>
                                        <TableCell>{item.ejercicio_nombre}</TableCell>
                                        <TableCell>{item.rm_estimado}</TableCell>
                                        <TableCell>{item.fecha_registro}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>

                <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, flex: 1 }}>
                    <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.5 }}>Últimas evaluaciones</Typography>
                    <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                        <Table size="small" sx={tableSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Resumen</TableCell>
                                    <TableCell>Fecha</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.ultimas_evaluaciones.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: "#64748b" }}>
                                            Sin evaluaciones.
                                        </TableCell>
                                    </TableRow>
                                ) : data.ultimas_evaluaciones.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.nombre_completo}</TableCell>
                                        <TableCell>{item.tipo_evaluacion}</TableCell>
                                        <TableCell>{item.resultado_resumen || "Sin resumen"}</TableCell>
                                        <TableCell>{item.fecha_evaluacion}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Stack>
        </Stack>
    );
}
