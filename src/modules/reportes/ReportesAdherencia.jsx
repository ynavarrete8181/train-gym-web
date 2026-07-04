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

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Clientes</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{resumen.total}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Adherencia alta</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{resumen.alto}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Seguimiento medio</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{resumen.medio}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Riesgo bajo</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{resumen.bajo}</Typography>
                </Paper>
            </Stack>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Typography sx={{ fontWeight: 900, color: "#0f172a", mb: 1.5 }}>Ranking de adherencia</Typography>
                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
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
