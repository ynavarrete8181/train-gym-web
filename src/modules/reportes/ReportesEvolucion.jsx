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
import ReportExportButtons from "./ReportExportButtons";
import ReportMetricChip from "./ReportMetricChip";

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

    const clientesColumns = [
        { key: "nombre_completo", label: "Cliente" },
        { key: "sesiones", label: "Sesiones" },
        { key: "adherencia_promedio", label: "Adherencia", exportValue: (row) => `${row.adherencia_promedio}%` },
        { key: "dolor_promedio", label: "Dolor / RPE", exportValue: (row) => `${row.dolor_promedio || 0} / ${row.rpe_promedio || 0}` },
        { key: "mejor_rm", label: "Mejor RM", exportValue: (row) => row.mejor_rm ? `${row.mejor_rm.valor} - ${row.mejor_rm.ejercicio_nombre}` : "Sin RM" },
        { key: "ultima_evaluacion", label: "Última evaluación", exportValue: (row) => row.ultima_evaluacion ? `${row.ultima_evaluacion.tipo_evaluacion} - ${row.ultima_evaluacion.fecha_evaluacion}` : "Sin evaluación" },
    ];
    const rmColumns = [
        { key: "nombre_completo", label: "Cliente" },
        { key: "ejercicio_nombre", label: "Ejercicio" },
        { key: "rm_estimado", label: "RM" },
        { key: "fecha_registro", label: "Fecha" },
    ];
    const evaluacionColumns = [
        { key: "nombre_completo", label: "Cliente" },
        { key: "tipo_evaluacion", label: "Tipo" },
        { key: "resultado_resumen", label: "Resumen", exportValue: (row) => row.resultado_resumen || "Sin resumen" },
        { key: "fecha_evaluacion", label: "Fecha" },
    ];

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

            <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
                <ReportMetricChip label="Clientes" value={data.resumen.clientes} />
                <ReportMetricChip label="Sesiones" value={data.resumen.sesiones} />
                <ReportMetricChip label="Adherencia promedio" value={`${data.resumen.adherencia_promedio}%`} tone="success" />
                <ReportMetricChip label="Registros RM" value={data.resumen.rm_registros} tone="mustard" />
                <ReportMetricChip label="Evaluaciones" value={data.resumen.evaluaciones} tone="mustard" />
            </Stack>

            <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
                <ReportMetricChip
                    label="Cliente más estable"
                    value={topCliente ? topCliente.nombre_completo : "Sin datos"}
                    helper={topCliente ? `${topCliente.adherencia_promedio}% adherencia · dolor ${topCliente.dolor_promedio}` : "Aún no hay datos suficientes."}
                    tone="success"
                />
                <ReportMetricChip
                    label="RM destacado"
                    value={topRm ? `${topRm.rm_estimado}` : "Sin datos"}
                    helper={topRm ? `${topRm.ejercicio_nombre} · ${topRm.nombre_completo}` : "Registra RM para comparar evolución."}
                    tone="mustard"
                />
            </Stack>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 0, overflow: "hidden" }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}
                >
                    <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>Resumen por cliente</Typography>
                    <ReportExportButtons title="Resumen por cliente" rows={data.clientes} columns={clientesColumns} />
                </Stack>
                <TableContainer sx={{ boxShadow: "none" }}>
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
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 0, flex: 1, overflow: "hidden" }}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                        sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}
                    >
                        <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>Últimos RM</Typography>
                        <ReportExportButtons title="Últimos RM" rows={data.ultimos_rm} columns={rmColumns} />
                    </Stack>
                    <TableContainer sx={{ boxShadow: "none" }}>
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

                <Paper elevation={0} sx={{ ...pagePaperSx, p: 0, flex: 1, overflow: "hidden" }}>
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        alignItems={{ xs: "stretch", sm: "center" }}
                        justifyContent="space-between"
                        sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}
                    >
                        <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>Últimas evaluaciones</Typography>
                        <ReportExportButtons title="Últimas evaluaciones" rows={data.ultimas_evaluaciones} columns={evaluacionColumns} />
                    </Stack>
                    <TableContainer sx={{ boxShadow: "none" }}>
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
