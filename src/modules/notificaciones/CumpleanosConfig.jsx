import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    FormControlLabel,
    Paper,
    Switch,
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
import {
    Cake as CakeIcon,
    Settings as SettingsIcon,
    Replay as ReplayIcon,
    Schedule as ScheduleIcon,
} from "@mui/icons-material";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import {
    modalFieldSx,
    semanticChipSx,
    semanticOutlineButtonSx,
    tableSx,
} from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";
import PremiumButton from "../../components/ui/PremiumButton";
import PremiumModal from "../../components/ui/PremiumModal";

const defaultConfig = {
    activo: true,
    hora_envio: "07:00",
    titulo: "Feliz cumpleanos de parte de Revive",
    mensaje: "Hola {nombre}, todo el equipo Revive te desea un feliz cumpleanos. Que tengas un excelente dia.",
};

const statusTone = {
    PENDIENTE: "mustard",
    ENVIADA: "success",
    LEIDA: "success",
    SIN_DISPOSITIVO: "danger",
    ERROR: "danger",
};

const vistaCopy = {
    cumpleanos: {
        title: "Cumpleaños",
        subtitle: "Gestiona la plantilla push y el historial de felicitaciones enviadas.",
        emptyTitle: "Sin historial",
        emptyText: "Cuando se envien felicitaciones de cumpleanos apareceran aqui.",
    },
    plantillas: {
        title: "Plantillas",
        subtitle: "Configura el mensaje, la hora y el estado de los envios de cumpleanos.",
        emptyTitle: "Sin historial de plantillas",
        emptyText: "Al guardar y usar la plantilla de cumpleanos, sus envios apareceran aqui.",
    },
    historial: {
        title: "Historial",
        subtitle: "Revisa las felicitaciones enviadas, leidas, pendientes o con error.",
        emptyTitle: "Sin historial",
        emptyText: "Cuando existan envios de cumpleanos, se listaran en esta tabla.",
    },
    reenvios: {
        title: "Reenvíos",
        subtitle: "Gestiona felicitaciones pendientes, fallidas o sin dispositivo registrado.",
        emptyTitle: "Sin reenvios pendientes",
        emptyText: "No hay felicitaciones pendientes, con error o sin dispositivo para reenviar.",
    },
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

export default function CumpleanosConfig({ vista = "cumpleanos" }) {
    const [form, setForm] = useState(defaultConfig);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resendingId, setResendingId] = useState(null);
    const [configOpen, setConfigOpen] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [page, setPage] = useState(0);
    const rowsPerPage = 5;

    const copy = vistaCopy[vista] || vistaCopy.cumpleanos;

    const filteredHistory = useMemo(() => {
        if (vista !== "reenvios") return history;

        return history.filter((item) => {
            const estado = String(item.estado || "").toUpperCase();
            return ["PENDIENTE", "ERROR", "SIN_DISPOSITIVO"].includes(estado) || Number(item.dispositivos_activos || 0) <= 0;
        });
    }, [history, vista]);

    const paginatedHistory = useMemo(
        () => filteredHistory.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filteredHistory, page],
    );

    useEffect(() => {
        setPage(0);
    }, [vista]);

    useEffect(() => {
        let mounted = true;

        Promise.all([
            apiClient.get("/gimnasio/notificaciones/cumpleanos-config"),
            apiClient.get("/gimnasio/notificaciones/cumpleanos-historial", { params: { limit: 100 } }),
        ])
            .then(([configResponse, historyResponse]) => {
                if (!mounted) return;
                setForm({ ...defaultConfig, ...(configResponse.data?.data || {}) });
                setHistory(Array.isArray(historyResponse.data?.data) ? historyResponse.data.data : []);
                setPage(0);
            })
            .catch((requestError) => {
                if (!mounted) return;
                setError(getApiErrorMessage(requestError, "No se pudo cargar la configuracion de cumpleanos."));
            })
            .finally(() => {
                if (!mounted) return;
                setLoading(false);
                setHistoryLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, []);

    const previewMessage = useMemo(
        () => String(form.mensaje || "").replaceAll("{nombre}", "Andrea"),
        [form.mensaje],
    );

    const updateField = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
        setError("");
        setSuccess("");
    };

    const saveConfig = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = {
                activo: Boolean(form.activo),
                hora_envio: form.hora_envio || "07:00",
                titulo: String(form.titulo || "").trim(),
                mensaje: String(form.mensaje || "").trim(),
            };
            const { data } = await apiClient.put("/gimnasio/notificaciones/cumpleanos-config", payload);
            setForm({ ...defaultConfig, ...(data?.data || payload) });
            setSuccess("Configuracion guardada correctamente.");
            setConfigOpen(false);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, "No se pudo guardar la configuracion."));
        } finally {
            setSaving(false);
        }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);

        try {
            const { data } = await apiClient.get("/gimnasio/notificaciones/cumpleanos-historial", { params: { limit: 100 } });
            setHistory(Array.isArray(data?.data) ? data.data : []);
            setPage(0);
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, "No se pudo cargar el historial de cumpleanos."));
        } finally {
            setHistoryLoading(false);
        }
    };

    const resendNotification = async (item) => {
        if (!item?.destinatario_id) return;

        setResendingId(item.destinatario_id);
        setError("");
        setSuccess("");

        try {
            await apiClient.post(`/gimnasio/notificaciones/cumpleanos-historial/${item.destinatario_id}/reenviar`);
            setSuccess("Notificacion reenviada a la cola push.");
            await fetchHistory();
        } catch (requestError) {
            setError(getApiErrorMessage(requestError, "No se pudo reenviar la notificacion."));
        } finally {
            setResendingId(null);
        }
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Paper
                className="tg-module-card"
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
                    <CakeIcon sx={{ color: "#0f172a" }} />
                    <Box>
                        <Typography sx={{ fontWeight: 950, color: "#0f172a", fontSize: 20 }}>
                            {copy.title}
                        </Typography>
                        <Typography sx={{ color: "#64748b", fontSize: 13 }}>
                            {copy.subtitle}
                        </Typography>
                    </Box>
                </Box>
            </Paper>

            <Paper className="tg-module-card" elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Box className="tg-module-toolbar" sx={{ p: "0 0 16px !important", justifyContent: "flex-end !important" }}>
                    <PremiumButton
                        variant="anadir"
                        startIcon={<SettingsIcon />}
                        onClick={() => setConfigOpen(true)}
                        sx={{ minHeight: 36, height: 36, px: 2 }}
                    >
                        Configurar plantilla
                    </PremiumButton>
                    <Button
                        onClick={fetchHistory}
                        sx={semanticOutlineButtonSx("neutral", { height: 36, px: 2 })}
                    >
                        Actualizar
                    </Button>
                    <Box component="span" sx={semanticChipSx(form.activo ? "success" : "neutral")}>
                        {form.activo ? "Activo" : "Pausado"}
                    </Box>
                    <Box component="span" sx={{ ...semanticChipSx("mustard"), display: "inline-flex", alignItems: "center", gap: 0.6, px: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 15 }} />
                        {form.hora_envio || "07:00"}
                    </Box>
                </Box>

                <TableContainer className="tg-table-wrap tg-table-wrap--scroll" sx={{ border: "1px solid #e5e7eb", overflow: "hidden" }}>
                    <Table size="small" sx={{ ...tableSx, minWidth: 980 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Socio</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Dispositivo</TableCell>
                                <TableCell>Mensaje</TableCell>
                                <TableCell>Error</TableCell>
                                <TableCell align="right">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                            {loading || historyLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                                        <CircularProgress size={26} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredHistory.length ? paginatedHistory.map((item) => (
                                <TableRow key={item.destinatario_id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 13 }}>
                                            {item.persona_nombre || "Socio"}
                                        </Typography>
                                        <Typography sx={{ color: "#64748b", fontSize: 12 }}>
                                            ID {item.persona_id || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography sx={{ fontSize: 12, color: "#1f2937" }}>
                                            {item.fecha_cumpleanos || "-"}
                                        </Typography>
                                        <Typography sx={{ color: "#64748b", fontSize: 12 }}>
                                            {formatDateTime(item.created_at)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", gap: 0.7, flexWrap: "wrap" }}>
                                            <Box component="span" sx={semanticChipSx(statusTone[item.estado] || "neutral")}>
                                                {item.estado || "PENDIENTE"}
                                            </Box>
                                            {item.entregada_at ? (
                                                <Box component="span" sx={semanticChipSx("success")}>
                                                    Push enviado
                                                </Box>
                                            ) : null}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box component="span" sx={semanticChipSx(item.dispositivos_activos > 0 ? "success" : "danger")}>
                                            {item.dispositivos_activos > 0 ? `${item.dispositivos_activos} activo(s)` : "Sin dispositivo"}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 260 }}>
                                        <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 12 }}>
                                            {item.titulo}
                                        </Typography>
                                        <Typography sx={{ color: "#64748b", fontSize: 12, mt: 0.35 }}>
                                            {item.mensaje}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 220 }}>
                                        <Typography sx={{ color: item.error ? "#dc2626" : "#64748b", fontSize: 12 }}>
                                            {item.error || "-"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            startIcon={<ReplayIcon />}
                                            onClick={() => resendNotification(item)}
                                            disabled={resendingId === item.destinatario_id}
                                            sx={semanticOutlineButtonSx("mustard", { height: 32, px: 1.5 })}
                                        >
                                            Reenviar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7}>
                                        <Box className="tg-empty-state">
                                            <Box>
                                                <Box className="tg-empty-state__icon">
                                                    <CakeIcon sx={{ fontSize: 34 }} />
                                                </Box>
                                                <p className="tg-empty-state__title">{copy.emptyTitle}</p>
                                                <p className="tg-empty-state__text">
                                                    {copy.emptyText}
                                                </p>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    className="tg-table-pagination"
                    component="div"
                    count={filteredHistory.length}
                    page={page}
                    onPageChange={(_event, nextPage) => setPage(nextPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={() => {}}
                    rowsPerPageOptions={[5]}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
            </Paper>

            <PremiumModal
                open={configOpen}
                onClose={() => setConfigOpen(false)}
                title="Plantilla de cumpleaños"
                subtitle="Configura la hora, el estado y el mensaje push para socios cumpleañeros."
                icon={<SettingsIcon sx={{ fontSize: 22, color: "#fff" }} />}
                maxWidth="md"
                actions={
                    <>
                        <PremiumButton
                            variant="cancelar"
                            onClick={() => setConfigOpen(false)}
                            disabled={saving}
                        >
                            Cancelar
                        </PremiumButton>
                        <PremiumButton
                            variant="guardar"
                            onClick={saveConfig}
                            loading={saving}
                        >
                            Guardar
                        </PremiumButton>
                    </>
                }
            >
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" }, gap: 2.25 }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {error ? <Alert severity="error">{error}</Alert> : null}
                        {success ? <Alert severity="success">{success}</Alert> : null}

                        <FormControlLabel
                            control={(
                                <Switch
                                    checked={Boolean(form.activo)}
                                    onChange={(event) => updateField("activo", event.target.checked)}
                                />
                            )}
                            label="Enviar felicitacion de cumpleanos"
                        />

                        <TextField
                            label="Hora de envio"
                            type="time"
                            value={form.hora_envio || "07:00"}
                            onChange={(event) => updateField("hora_envio", event.target.value)}
                            size="small"
                            sx={{ ...modalFieldSx, maxWidth: 220 }}
                            InputLabelProps={{ shrink: true }}
                        />

                        <TextField
                            label="Titulo"
                            value={form.titulo}
                            onChange={(event) => updateField("titulo", event.target.value)}
                            size="small"
                            sx={modalFieldSx}
                        />

                        <TextField
                            label="Mensaje"
                            value={form.mensaje}
                            onChange={(event) => updateField("mensaje", event.target.value)}
                            multiline
                            minRows={4}
                            sx={modalFieldSx}
                            helperText="Variable disponible: {nombre}. Ejemplo: Hola {nombre}, felicidades."
                        />
                    </Box>

                    <Paper
                        elevation={0}
                        sx={{
                            border: "1px solid #e2e8f0",
                            bgcolor: "#ffffff",
                            borderRadius: "6px",
                            p: 2,
                            minHeight: 220,
                        }}
                    >
                        <Typography sx={{ fontWeight: 950, color: "#0f172a", mb: 1 }}>
                            Vista previa
                        </Typography>
                        <Box
                            sx={{
                                border: "1px solid #e2e8f0",
                                bgcolor: "#fbfbfc",
                                p: 2,
                                display: "flex",
                                gap: 1.5,
                                alignItems: "flex-start",
                                borderRadius: "6px",
                            }}
                        >
                            <CakeIcon sx={{ color: "var(--tg-primary)", mt: 0.2 }} />
                            <Box>
                                <Typography sx={{ fontWeight: 950, color: "#0f172a", fontSize: 14 }}>
                                    {form.titulo || defaultConfig.titulo}
                                </Typography>
                                <Typography sx={{ color: "#64748b", fontSize: 13, mt: 0.6 }}>
                                    {previewMessage || defaultConfig.mensaje.replaceAll("{nombre}", "Andrea")}
                                </Typography>
                            </Box>
                        </Box>
                        <Typography sx={{ mt: 2, color: "#64748b", fontSize: 12 }}>
                            {"Si el socio se llama Andrea, {nombre} se reemplaza por Andrea al generar la notificacion."}
                        </Typography>
                    </Paper>
                </Box>
            </PremiumModal>
        </Box>
    );
}
