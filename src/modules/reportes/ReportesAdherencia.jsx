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

const getTone = (value) => {
    if (value < 60) return "danger";
    if (value < 80) return "mustard";
    return "success";
};

export default function ReportesAdherencia() {
    const [buscar, setBuscar] = useState("");
    const [data, setData] = useState({ resumen: {}, clientes: [] });

    useEffect(() => {
        apiClient.get("/gimnasio/reportes/evolucion", { params: { buscar: buscar || undefined } })
            .then(({ data }) => setData(data || { resumen: {}, clientes: [] }))
            .catch((error) => {
                Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el reporte de adherencia."), "error");
            });
    }, [buscar]);

    const resumen = useMemo(() => {
        const clientes = data.clientes || [];
        return {
            total: clientes.length,
            alto: clientes.filter((item) => Number(item.adherencia_promedio || 0) >= 80).length,
            medio: clientes.filter((item) => Number(item.adherencia_promedio || 0) >= 60 && Number(item.adherencia_promedio || 0) < 80).length,
            bajo: clientes.filter((item) => Number(item.adherencia_promedio || 0) < 60).length,
        };
    }, [data.clientes]);

    const rankingColumns = [
        { key: "nombre_completo", label: "Cliente" },
        { key: "sesiones", label: "Sesiones" },
        { key: "adherencia_promedio", label: "Adherencia", exportValue: (row) => `${row.adherencia_promedio}%` },
        { key: "ultima_sesion", label: "Última sesión", exportValue: (row) => row.ultima_sesion || "Sin datos" },
        {
            key: "estado",
            label: "Estado",
            exportValue: (row) => Number(row.adherencia_promedio || 0) < 60 ? "Riesgo" : Number(row.adherencia_promedio || 0) < 80 ? "Seguimiento" : "Estable",
        },
    ];

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                    <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Reportes / Adherencia</Typography>
                    <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                        Analiza el cumplimiento de sesiones por cliente y detecta caídas de seguimiento.
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
                <ReportMetricChip label="Clientes" value={resumen.total} />
                <ReportMetricChip label="Adherencia alta" value={resumen.alto} tone="success" />
                <ReportMetricChip label="Seguimiento medio" value={resumen.medio} tone="mustard" />
                <ReportMetricChip label="Riesgo bajo" value={resumen.bajo} tone="danger" />
            </Stack>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 0, overflow: "hidden" }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}
                >
                    <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>Ranking de adherencia</Typography>
                    <ReportExportButtons title="Ranking de adherencia" rows={data.clientes || []} columns={rankingColumns} />
                </Stack>
                <TableContainer sx={{ boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Sesiones</TableCell>
                                <TableCell>Adherencia</TableCell>
                                <TableCell>Última sesión</TableCell>
                                <TableCell>Estado</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(data.clientes || []).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        No hay datos de adherencia con los filtros actuales.
                                    </TableCell>
                                </TableRow>
                            ) : (data.clientes || []).map((item) => (
                                <TableRow key={item.persona_id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre_completo}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.cedula}</Typography>
                                    </TableCell>
                                    <TableCell>{item.sesiones}</TableCell>
                                    <TableCell>
                                        <Chip label={`${item.adherencia_promedio}%`} sx={semanticChipSx(getTone(Number(item.adherencia_promedio || 0)))} />
                                    </TableCell>
                                    <TableCell>{item.ultima_sesion || "Sin datos"}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={Number(item.adherencia_promedio || 0) < 60 ? "Riesgo" : Number(item.adherencia_promedio || 0) < 80 ? "Seguimiento" : "Estable"}
                                            sx={semanticChipSx(getTone(Number(item.adherencia_promedio || 0)))}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Stack>
    );
}
