import { useEffect, useMemo, useState } from "react";
import {
    Box,
    FormControl,
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
import Swal from "sweetalert2";

import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";

const opTone = {
    I: "success",
    U: "mustard",
    D: "danger",
};

export default function Auditoria() {
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({ total: 0, por_operacion: [], por_modulo: [], por_usuario: [] });
    const [modulo, setModulo] = useState("");
    const [operacion, setOperacion] = useState("");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    const params = useMemo(() => ({
        modulo: modulo || undefined,
        operacion: operacion || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        limit: 100,
    }), [modulo, operacion, fechaDesde, fechaHasta]);

    const fetchData = async () => {
        const [detailRes, summaryRes] = await Promise.all([
            apiClient.get("/gimnasio/auditoria", { params }),
            apiClient.get("/gimnasio/auditoria/resumen", { params }),
        ]);

        setItems(detailRes.data || []);
        setSummary(summaryRes.data || { total: 0, por_operacion: [], por_modulo: [], por_usuario: [] });
    };

    useEffect(() => {
        fetchData().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar la auditoría."), "error");
        });
    }, [params]);

    const topModulo = summary.por_modulo?.[0] ?? null;
    const topUsuario = summary.por_usuario?.[0] ?? null;
    const topOperacion = summary.por_operacion?.[0] ?? null;

    return (
        <Stack spacing={3}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Seguridad / Auditoría</Typography>
                <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                    Revisa actividad, cambios de datos y trazabilidad operativa del sistema.
                </Typography>
            </Paper>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Eventos</Typography>
                    <Typography sx={{ fontSize: 28, fontWeight: 950, color: "#0f172a" }}>{summary.total || 0}</Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Módulo más activo</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>{topModulo?.clave || "Sin datos"}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.5 }}>{topModulo?.total || 0} movimientos</Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Usuario más activo</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>{topUsuario?.clave || "Sin datos"}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.5 }}>{topUsuario?.total || 0} eventos</Typography>
                </Paper>
                <Paper elevation={0} sx={{ ...pagePaperSx, p: 2.5, flex: 1 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#64748b", textTransform: "uppercase" }}>Operación dominante</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 900, color: "#0f172a" }}>{topOperacion?.clave || "Sin datos"}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748b", mt: 0.5 }}>{topOperacion?.total || 0} eventos</Typography>
                </Paper>
            </Stack>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5}>
                    <FormControl size="small" sx={{ ...filterInputSx, minWidth: 220 }}>
                        <InputLabel>Módulo</InputLabel>
                        <Select label="Módulo" value={modulo} onChange={(e) => setModulo(e.target.value)}>
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="seguridad">Seguridad</MenuItem>
                            <MenuItem value="inventarios">Inventarios</MenuItem>
                            <MenuItem value="servicios">Servicios</MenuItem>
                            <MenuItem value="horarios">Horarios</MenuItem>
                            <MenuItem value="auth">Auth</MenuItem>
                            <MenuItem value="general">General</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ ...filterInputSx, minWidth: 180 }}>
                        <InputLabel>Operación</InputLabel>
                        <Select label="Operación" value={operacion} onChange={(e) => setOperacion(e.target.value)}>
                            <MenuItem value="">Todas</MenuItem>
                            <MenuItem value="I">Insert</MenuItem>
                            <MenuItem value="U">Update</MenuItem>
                            <MenuItem value="D">Delete</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        type="date"
                        label="Desde"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        sx={{ ...filterInputSx, minWidth: 180 }}
                        InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                        size="small"
                        type="date"
                        label="Hasta"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        sx={{ ...filterInputSx, minWidth: 180 }}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Usuario</TableCell>
                                <TableCell>Rol</TableCell>
                                <TableCell>Módulo</TableCell>
                                <TableCell>Tabla</TableCell>
                                <TableCell>Acción</TableCell>
                                <TableCell>Operación</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748b" }}>
                                        No hay eventos de auditoría para esos filtros.
                                    </TableCell>
                                </TableRow>
                            ) : items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{String(item.created_at || "").slice(0, 16).replace("T", " ")}</TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.actor_nombre || item.actor_email || "Sistema"}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.actor_email || "Sin correo"}</Typography>
                                    </TableCell>
                                    <TableCell>{item.actor_rol_nombre || "Sin rol"}</TableCell>
                                    <TableCell>{item.modulo || "general"}</TableCell>
                                    <TableCell>{item.tabla || "sistema"}</TableCell>
                                    <TableCell>{item.accion || "sin acción"}</TableCell>
                                    <TableCell>
                                        <Chip label={item.operacion || "?"} sx={semanticChipSx(opTone[item.operacion] || "neutral")} />
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
