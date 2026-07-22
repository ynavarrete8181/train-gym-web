import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    InputAdornment,
    Paper,
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
import { buildClientRecommendations } from "./recomendaciones";

export default function ReportesAlertas() {
    const [buscar, setBuscar] = useState("");
    const [clientes, setClientes] = useState([]);

    useEffect(() => {
        apiClient.get("/gimnasio/reportes/evolucion", { params: { buscar: buscar || undefined } })
            .then(({ data }) => setClientes(data?.clientes || []))
            .catch((error) => {
                Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el reporte de alertas."), "error");
            });
    }, [buscar]);

    const clientesConAlertas = useMemo(() => {
        return clientes
            .map((cliente) => ({ ...cliente, alerts: buildClientRecommendations(cliente) }))
            .filter((cliente) => cliente.alerts.length > 0)
            .sort((a, b) => {
                const weight = (item) => item.alerts.some((alert) => alert.tone === "danger") ? 2 : 1;
                return weight(b) - weight(a);
            });
    }, [clientes]);

    const alertaColumns = [
        { key: "nombre_completo", label: "Cliente" },
        { key: "adherencia_promedio", label: "Adherencia", exportValue: (row) => `${row.adherencia_promedio}%` },
        { key: "dolor_promedio", label: "Dolor / RPE", exportValue: (row) => `${row.dolor_promedio || 0} / ${row.rpe_promedio || 0}` },
        { key: "ultima_sesion", label: "Última sesión", exportValue: (row) => row.ultima_sesion || "Sin datos" },
        { key: "alerts", label: "Alertas", exportValue: (row) => row.alerts.map((alert) => alert.label).join(", ") },
    ];

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Reportes / Alertas</Typography>
                    <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                        Detecta clientes con dolor alto, baja adherencia o señales de fatiga para actuar a tiempo.
                    </Typography>
                </Box>
                <TextField
                    size="small"
                    placeholder="Buscar cliente..."
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    sx={{ ...filterInputSx, minWidth: 280 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
                <ReportMetricChip label="Clientes con alertas" value={clientesConAlertas.length} tone="mustard" />
                <ReportMetricChip
                    label="Alertas críticas"
                    value={clientesConAlertas.filter((item) => item.alerts.some((alert) => alert.tone === "danger")).length}
                    tone="danger"
                />
                <ReportMetricChip
                    label="Seguimiento"
                    value={clientesConAlertas.filter((item) => item.alerts.every((alert) => alert.tone !== "danger")).length}
                    tone="success"
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
                    <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>Panel de alertas</Typography>
                    <ReportExportButtons title="Panel de alertas" rows={clientesConAlertas} columns={alertaColumns} />
                </Stack>
                <TableContainer sx={{ boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Adherencia</TableCell>
                                <TableCell>Dolor / RPE</TableCell>
                                <TableCell>Última sesión</TableCell>
                                <TableCell>Alertas</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {clientesConAlertas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        No hay alertas activas con los filtros actuales.
                                    </TableCell>
                                </TableRow>
                            ) : clientesConAlertas.map((item) => (
                                <TableRow key={item.persona_id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre_completo}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.cedula}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={`${item.adherencia_promedio}%`} sx={semanticChipSx(Number(item.adherencia_promedio || 0) < 60 ? "danger" : "mustard")} />
                                    </TableCell>
                                    <TableCell>{item.dolor_promedio || 0} / {item.rpe_promedio || 0}</TableCell>
                                    <TableCell>{item.ultima_sesion || "Sin datos"}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.8} flexWrap="wrap">
                                            {item.alerts.map((alert, index) => (
                                                <Chip key={`${item.persona_id}-${index}`} label={alert.label} sx={semanticChipSx(alert.tone)} />
                                            ))}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.5 }}>Acciones sugeridas</Typography>
                <Stack spacing={1.2}>
                    {clientesConAlertas.length === 0 ? (
                        <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                            No hay acciones sugeridas en este momento.
                        </Typography>
                    ) : clientesConAlertas.slice(0, 6).map((item) => (
                        <Paper
                            key={`recommend-${item.persona_id}`}
                            elevation={0}
                            sx={{
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0",
                                px: 2,
                                py: 1.8,
                            }}
                        >
                            <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>
                                {item.nombre_completo}
                            </Typography>
                            <Stack direction="row" spacing={0.8} sx={{ mt: 0.8, mb: 0.8 }} flexWrap="wrap">
                                {item.alerts.map((alert, index) => (
                                    <Chip key={`recommend-chip-${item.persona_id}-${index}`} label={alert.label} sx={semanticChipSx(alert.tone)} />
                                ))}
                            </Stack>
                            <Typography sx={{ fontSize: 12, color: "#64748b" }}>
                                {item.alerts[0]?.action}
                            </Typography>
                        </Paper>
                    ))}
                </Stack>
            </Paper>
        </Stack>
    );
}
