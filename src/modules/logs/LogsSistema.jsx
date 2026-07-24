import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Autocomplete,
    Box,
    Chip,
    FormControl,
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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import TerminalIcon from "@mui/icons-material/Terminal";
import Swal from "sweetalert2";

import PageHeader from "../../components/ui/PageHeader";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";

const levelTone = {
    DEBUG: "neutral",
    INFO: "neutral",
    WARNING: "mustard",
    ERROR: "danger",
    CRITICAL: "danger",
};

const filterGridSx = {
    display: "grid",
    gridTemplateColumns: {
        xs: "1fr",
        md: "repeat(2, minmax(0, 1fr))",
        xl: "1.45fr 0.85fr 0.9fr 1fr 1fr 1.2fr",
    },
    gap: 1.5,
};

const compactInputSx = {
    ...filterInputSx,
    width: "100%",
    "& .MuiSelect-select, & .MuiInputBase-input": {
        fontSize: 13,
    },
};

export default function LogsSistema() {
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({ total: 0 });
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioId, setUsuarioId] = useState("");
    const [usuarioTexto, setUsuarioTexto] = useState("");
    const [cedula, setCedula] = useState("");
    const [nivel, setNivel] = useState("");
    const [canal, setCanal] = useState("");
    const [modulo, setModulo] = useState("");
    const [accion, setAccion] = useState("");
    const [requestId, setRequestId] = useState("");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const params = useMemo(() => ({
        nivel: nivel || undefined,
        canal: canal || undefined,
        modulo: modulo || undefined,
        accion: accion || undefined,
        usuario_id: usuarioId || undefined,
        cedula: cedula.trim() || undefined,
        request_id: requestId || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        limit: 150,
    }), [nivel, canal, modulo, accion, usuarioId, cedula, requestId, fechaDesde, fechaHasta]);

    const fetchCatalogos = useCallback(async () => {
        const { data } = await apiClient.get("/gimnasio/seguridad/usuarios", { params: { estado: "ACTIVO" } });
        setUsuarios(Array.isArray(data) ? data : []);
    }, []);

    const fetchData = useCallback(async () => {
        const [detailRes, summaryRes] = await Promise.all([
            apiClient.get("/gimnasio/logs/eventos", { params }),
            apiClient.get("/gimnasio/logs/resumen", { params }),
        ]);

        setItems(detailRes.data || []);
        setSummary(summaryRes.data || { total: 0 });
        setPage(0);
    }, [params]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchCatalogos().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los usuarios para filtros."), "error");
        });
    }, [fetchCatalogos]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los logs."), "error");
        });
    }, [fetchData]);

    const selectedUsuario = useMemo(
        () => usuarios.find((usuario) => String(usuario.id) === String(usuarioId)) || null,
        [usuarios, usuarioId]
    );

    const visibleItems = useMemo(() => {
        if (usuarioId || !usuarioTexto.trim()) return items;

        const term = usuarioTexto.trim().toLowerCase();
        return items.filter((item) => (
            `${item.usuario_email || ""} ${item.persona_nombre || ""} ${item.usuario_cedula || ""} ${item.persona_cedula || ""}`.toLowerCase().includes(term)
        ));
    }, [items, usuarioId, usuarioTexto]);

    const paginatedItems = useMemo(() => {
        const start = page * rowsPerPage;
        return visibleItems.slice(start, start + rowsPerPage);
    }, [visibleItems, page, rowsPerPage]);

    const handleChangePage = (_event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Stack spacing={3}>
            <PageHeader
                title="Logs del Sistema"
                icon={<TerminalIcon sx={{ fontSize: 24 }} />}
                rightContent={
                    <Box sx={{ px: 2, py: 0.8, borderRadius: "6px", bgcolor: "rgba(15, 23, 42, 0.05)", color: "#0f172a", fontSize: "11px", fontWeight: 900 }}>
                        {visibleItems.length || summary.total || items.length} REGISTROS
                    </Box>
                }
            />

            <Paper elevation={0} sx={{ ...pagePaperSx, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                <Box sx={{ px: 4, py: 2.5 }}>
                    <Box sx={filterGridSx}>
                        <Autocomplete
                            size="small"
                            options={usuarios}
                            value={selectedUsuario}
                            inputValue={usuarioTexto}
                            onChange={(_event, value) => {
                                setUsuarioId(value?.id || "");
                                setUsuarioTexto(value ? (value.nombre_completo || value.email || "") : "");
                                setPage(0);
                            }}
                            onInputChange={(_event, value) => {
                                setUsuarioTexto(value);
                                if (!value) setUsuarioId("");
                                setPage(0);
                            }}
                            getOptionLabel={(option) => option?.nombre_completo || option?.email || ""}
                            isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                            renderInput={(paramsInput) => (
                                <TextField
                                    {...paramsInput}
                                    placeholder="Buscar o seleccionar usuario..."
                                    sx={compactInputSx}
                                    InputProps={{
                                        ...paramsInput.InputProps,
                                        startAdornment: (
                                            <>
                                                <InputAdornment position="start">
                                                    <PersonSearchIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                                </InputAdornment>
                                                {paramsInput.InputProps.startAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />

                        <FormControl size="small" sx={compactInputSx}>
                            <Select displayEmpty value={nivel} onChange={(e) => setNivel(e.target.value)}>
                                <MenuItem value="">Nivel</MenuItem>
                                <MenuItem value="INFO">Info</MenuItem>
                                <MenuItem value="WARNING">Warning</MenuItem>
                                <MenuItem value="ERROR">Error</MenuItem>
                                <MenuItem value="CRITICAL">Critical</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            size="small"
                            placeholder="Cédula..."
                            value={cedula}
                            onChange={(e) => {
                                setCedula(e.target.value);
                                setPage(0);
                            }}
                            sx={compactInputSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonSearchIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <FormControl size="small" sx={compactInputSx}>
                            <Select displayEmpty value={canal} onChange={(e) => setCanal(e.target.value)}>
                                <MenuItem value="">Canal</MenuItem>
                                <MenuItem value="BACKEND">Backend</MenuItem>
                                <MenuItem value="WEB">Web</MenuItem>
                                <MenuItem value="APP">App</MenuItem>
                                <MenuItem value="JOB">Job</MenuItem>
                                <MenuItem value="TORNIQUETE">Torniquete</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            size="small"
                            placeholder="Buscar acción..."
                            value={accion}
                            onChange={(e) => setAccion(e.target.value)}
                            sx={compactInputSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonSearchIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            size="small"
                            placeholder="Módulo..."
                            value={modulo}
                            onChange={(e) => setModulo(e.target.value)}
                            sx={compactInputSx}
                        />

                        <TextField
                            size="small"
                            placeholder="Request ID..."
                            value={requestId}
                            onChange={(e) => setRequestId(e.target.value)}
                            sx={compactInputSx}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <ManageSearchIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            size="small"
                            type="date"
                            label="Desde"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            sx={compactInputSx}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarMonthIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <TextField
                            size="small"
                            type="date"
                            label="Hasta"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            sx={compactInputSx}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </Box>

                <Box sx={{ px: 4, pb: 3 }}>
                    <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none", borderRadius: "6px", overflow: "hidden" }}>
                        <Table size="small" sx={tableSx}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Nivel</TableCell>
                                    <TableCell>Canal</TableCell>
                                    <TableCell>Módulo</TableCell>
                                    <TableCell>Acción</TableCell>
                                    <TableCell>Mensaje</TableCell>
                                    <TableCell>Request ID</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748b" }}>
                                            No hay logs para esos filtros.
                                        </TableCell>
                                    </TableRow>
                                ) : paginatedItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{String(item.created_at || "").slice(0, 16).replace("T", " ")}</TableCell>
                                        <TableCell>
                                            <Chip label={item.nivel || "INFO"} sx={semanticChipSx(levelTone[item.nivel] || "neutral")} />
                                        </TableCell>
                                        <TableCell>{item.canal || "BACKEND"}</TableCell>
                                        <TableCell>{item.modulo || "general"}</TableCell>
                                        <TableCell>{item.accion || "sin acción"}</TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 800 }}>{item.mensaje}</Typography>
                                            <Typography sx={{ fontSize: 11, color: "#64748b" }}>
                                                {item.persona_cedula || item.usuario_cedula || "Sin cédula"} · {item.usuario_email || item.persona_nombre || "Sistema"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>
                                                {item.request_id || "-"}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={visibleItems.length}
                        page={page}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                        rowsPerPageOptions={[5, 10, 25]}
                        labelRowsPerPage="Filas por página:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    />
                </Box>
            </Paper>
        </Stack>
    );
}
