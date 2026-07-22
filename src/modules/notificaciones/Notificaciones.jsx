import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    DoneAll as DoneAllIcon,
    MarkEmailRead as MarkEmailReadIcon,
    NotificationsActive as NotificationsActiveIcon,
    OpenInNew as OpenInNewIcon,
    Refresh as RefreshIcon,
    Search as SearchIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, semanticOutlineButtonSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";

const priorityTone = {
    ALTA: "danger",
    MEDIA: "mustard",
    NORMAL: "neutral",
    BAJA: "success",
};

const typeTone = {
    ASISTENCIA_REGISTRADA: "success",
    VENTA_REGISTRADA: "mustard",
    VENTA_ACTUALIZADA: "mustard",
    DEVOLUCION_REGISTRADA: "danger",
    VENTA_ANULADA: "danger",
    RESERVA_CREADA: "inventory",
    RESERVA_CONFIRMADA: "inventory",
    RESERVA_CANCELADA: "danger",
    RESERVA_ADMIN_CONFIRMADA: "inventory",
    RESERVA_ADMIN_CANCELADA: "danger",
};

const formatDateTime = (value) => {
    if (!value) return "-";

    try {
        return new Intl.DateTimeFormat("es-EC", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    } catch {
        return String(value);
    }
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const notifyLayout = (payload) => {
    window.dispatchEvent(new CustomEvent("train-gym:notifications-updated", { detail: payload }));
};

export default function Notificaciones() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [estado, setEstado] = useState("todas");
    const [tipo, setTipo] = useState("todos");

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const { data } = await apiClient.get("/gimnasio/notificaciones", { params: { limit: 100 } });
            const nextItems = Array.isArray(data?.data) ? data.data : [];
            const nextUnreadCount = Number(data?.no_leidas || 0);
            setItems(nextItems);
            setUnreadCount(nextUnreadCount);
            notifyLayout({ items: nextItems, no_leidas: nextUnreadCount });
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, "No se pudieron cargar las notificaciones."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const notificationTypes = useMemo(() => {
        const values = new Set(items.map((item) => item.tipo).filter(Boolean));
        return Array.from(values).sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        const term = normalizeText(search);

        return items.filter((item) => {
            if (estado === "no_leidas" && item.leida) return false;
            if (estado === "leidas" && !item.leida) return false;
            if (tipo !== "todos" && item.tipo !== tipo) return false;

            if (!term) return true;

            return [
                item.titulo,
                item.mensaje,
                item.tipo,
                item.prioridad,
            ].some((value) => normalizeText(value).includes(term));
        });
    }, [estado, items, search, tipo]);

    const markAsRead = async (item) => {
        if (!item?.destinatario_id || item.leida) return;

        const nextUnreadCount = Math.max(0, unreadCount - 1);
        setItems((current) => current.map((notification) => (
            notification.destinatario_id === item.destinatario_id
                ? { ...notification, leida: true, estado: "LEIDA", leida_at: new Date().toISOString() }
                : notification
        )));
        setUnreadCount(nextUnreadCount);
        notifyLayout({ no_leidas: nextUnreadCount });

        try {
            await apiClient.post(`/gimnasio/notificaciones/${item.destinatario_id}/leer`);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, "No se pudo marcar la notificacion como leida."));
            setItems((current) => current.map((notification) => (
                notification.destinatario_id === item.destinatario_id
                    ? { ...notification, leida: false, estado: item.estado, leida_at: item.leida_at }
                    : notification
            )));
            setUnreadCount((current) => current + 1);
            notifyLayout({ no_leidas: nextUnreadCount + 1 });
        }
    };

    const markAllAsRead = async () => {
        if (!unreadCount) return;

        const previous = items;
        const previousUnreadCount = unreadCount;
        const readAt = new Date().toISOString();

        setItems((current) => current.map((item) => ({
            ...item,
            leida: true,
            estado: "LEIDA",
            leida_at: item.leida_at || readAt,
        })));
        setUnreadCount(0);
        notifyLayout({ no_leidas: 0, items: previous.map((item) => ({
            ...item,
            leida: true,
            estado: "LEIDA",
            leida_at: item.leida_at || readAt,
        })) });

        try {
            await apiClient.post("/gimnasio/notificaciones/leer-todas");
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, "No se pudieron marcar las notificaciones."));
            setItems(previous);
            setUnreadCount(previousUnreadCount);
            notifyLayout({ no_leidas: previousUnreadCount, items: previous });
        }
    };

    const openTarget = async (item) => {
        await markAsRead(item);
        if (item?.data?.ruta_web) {
            navigate(item.data.ruta_web);
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Paper
                elevation={0}
                sx={{
                    ...pagePaperSx,
                    px: 3,
                    py: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <NotificationsActiveIcon sx={{ color: "#0f172a" }} />
                    <Box>
                        <Typography sx={{ fontWeight: 950, color: "#0f172a", fontSize: 20 }}>
                            Notificaciones
                        </Typography>
                        <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                            Alertas operativas para el administrador.
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                    <Chip label={`${unreadCount} nuevas`} sx={semanticChipSx(unreadCount ? "mustard" : "neutral")} />
                    <Button
                        startIcon={<RefreshIcon />}
                        onClick={fetchNotifications}
                        sx={semanticOutlineButtonSx("neutral", { height: 36, px: 2 })}
                    >
                        Actualizar
                    </Button>
                    <Button
                        startIcon={<DoneAllIcon />}
                        onClick={markAllAsRead}
                        disabled={!unreadCount}
                        sx={semanticOutlineButtonSx("success", { height: 36, px: 2 })}
                    >
                        Marcar todas
                    </Button>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mb: 2 }}>
                    <TextField
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar titulo, mensaje o tipo..."
                        size="small"
                        sx={{ ...filterInputSx, width: { xs: "100%", md: 360 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: "#64748b" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl size="small" sx={{ ...filterInputSx, width: { xs: "100%", sm: 180 } }}>
                        <InputLabel>Estado</InputLabel>
                        <Select label="Estado" value={estado} onChange={(event) => setEstado(event.target.value)}>
                            <MenuItem value="todas">Todas</MenuItem>
                            <MenuItem value="no_leidas">No leidas</MenuItem>
                            <MenuItem value="leidas">Leidas</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ ...filterInputSx, width: { xs: "100%", sm: 260 } }}>
                        <InputLabel>Tipo</InputLabel>
                        <Select label="Tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
                            <MenuItem value="todos">Todos los tipos</MenuItem>
                            {notificationTypes.map((value) => (
                                <MenuItem key={value} value={value}>{value}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

                <TableContainer sx={{ border: "1px solid #e5e7eb", overflow: "hidden" }}>
                    <Table size="small" sx={{ ...tableSx, minWidth: 900 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Estado</TableCell>
                                <TableCell>Notificacion</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Prioridad</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={26} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredItems.length ? filteredItems.map((item) => (
                                <TableRow key={`${item.destinatario_id || item.id}-${item.created_at}`}>
                                    <TableCell>
                                        <Chip
                                            label={item.leida ? "Leida" : "Nueva"}
                                            sx={semanticChipSx(item.leida ? "neutral" : "mustard")}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 420 }}>
                                        <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 13 }}>
                                            {item.titulo || "Notificacion"}
                                        </Typography>
                                        <Typography sx={{ color: "#64748b", fontSize: 12, mt: 0.35 }}>
                                            {item.mensaje || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.tipo || "GENERAL"}
                                            sx={semanticChipSx(typeTone[item.tipo] || "inventory")}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.prioridad || "NORMAL"}
                                            sx={semanticChipSx(priorityTone[item.prioridad] || "neutral")}
                                        />
                                    </TableCell>
                                    <TableCell>{formatDateTime(item.created_at)}</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                                            {!item.leida ? (
                                                <Tooltip title="Marcar como leida">
                                                    <Button
                                                        startIcon={<MarkEmailReadIcon />}
                                                        onClick={() => markAsRead(item)}
                                                        sx={semanticOutlineButtonSx("success", { height: 32, px: 1.5 })}
                                                    >
                                                        Leida
                                                    </Button>
                                                </Tooltip>
                                            ) : null}
                                            {item?.data?.ruta_web ? (
                                                <Tooltip title="Abrir modulo relacionado">
                                                    <Button
                                                        startIcon={<OpenInNewIcon />}
                                                        onClick={() => openTarget(item)}
                                                        sx={semanticOutlineButtonSx("mustard", { height: 32, px: 1.5 })}
                                                    >
                                                        Abrir
                                                    </Button>
                                                </Tooltip>
                                            ) : null}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                                        <Box sx={{ display: "grid", placeItems: "center", gap: 1 }}>
                                            <NotificationsActiveIcon sx={{ fontSize: 58, color: "rgba(37,99,235,0.28)" }} />
                                            <Typography sx={{ fontWeight: 950, color: "#0f172a" }}>
                                                Sin notificaciones
                                            </Typography>
                                            <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                                                Cuando ocurra una venta, asistencia, reserva o alerta, aparecera aqui.
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
