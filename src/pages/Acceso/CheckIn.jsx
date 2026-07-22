import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";
import ReportProblemRoundedIcon from "@mui/icons-material/ReportProblemRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import PageHeader from "../../components/ui/PageHeader";
import { getApiErrorMessage } from "../../services/apiClient";
import { listarSedesAcceso, validarQrAcceso } from "../../modules/acceso/api";

const SCAN_COOLDOWN_MS = 2200;
const isReviveQr = (value) => String(value || "").trim().startsWith("REVIVE|");
const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function CheckIn() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const scanningRef = useRef(false);
    const lastCodeRef = useRef("");
    const lastScanAtRef = useRef(0);
    const detectorRef = useRef(null);

    const [sedes, setSedes] = useState([]);
    const [sedeId, setSedeId] = useState("");
    const [manualCode, setManualCode] = useState("");
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const noQrFramesRef = useRef(0);

    const browserSupportsQr = useMemo(() => Boolean(window.BarcodeDetector), []);

    useEffect(() => {
        let mounted = true;

        listarSedesAcceso()
            .then((items) => {
                if (!mounted) return;
                setSedes(items);
                if (items[0]?.id) setSedeId(items[0].id);
            })
            .catch(() => {
                if (mounted) setSedes([]);
            });

        return () => {
            mounted = false;
            stopCamera();
        };
    }, []);

    const validateCode = useCallback(async (codigoQr) => {
        const code = String(codigoQr || "").trim();
        if (!code || !sedeId || processing) return;

        if (!isReviveQr(code)) {
            setResult({
                type: "info",
                permitido: null,
                mensaje: "Esperando un QR generado por Revive.",
            });
            return;
        }

        const now = Date.now();
        if (lastCodeRef.current === code && now - lastScanAtRef.current < SCAN_COOLDOWN_MS) {
            return;
        }

        lastCodeRef.current = code;
        lastScanAtRef.current = now;
        setProcessing(true);

        try {
            const response = await validarQrAcceso({ codigoQr: code, sedeId: Number(sedeId) });
            setResult({ type: "success", ...response });
            setManualCode("");
        } catch (error) {
            const backendMessage = error?.response?.data?.data?.mensaje;
            setResult({
                type: "error",
                permitido: false,
                mensaje: backendMessage || getApiErrorMessage(error, "Acceso denegado."),
            });
        } finally {
            setProcessing(false);
        }
    }, [processing, sedeId]);

    const scanFrame = useCallback(async () => {
        if (!scanningRef.current || !videoRef.current || !detectorRef.current) return;

        try {
            if (videoRef.current.readyState >= 2) {
                const codes = await detectorRef.current.detect(videoRef.current);
                const firstCode = codes?.[0]?.rawValue;
                if (firstCode) {
                    noQrFramesRef.current = 0;
                    await validateCode(firstCode);
                } else {
                    noQrFramesRef.current += 1;
                    if (noQrFramesRef.current > 45) {
                        setResult((current) => (current?.permitido === false ? null : current));
                    }
                }
            }
        } catch {
            // El frame puede fallar si la cámara aún está estabilizando.
        }

        if (scanningRef.current) {
            window.requestAnimationFrame(scanFrame);
        }
    }, [validateCode]);

    const startCamera = async () => {
        setCameraError("");

        if (!browserSupportsQr) {
            setCameraError("Este navegador no soporta escaneo QR nativo. Usa el campo manual o un lector USB.");
            return;
        }

        try {
            detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });

            streamRef.current = stream;
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            scanningRef.current = true;
            setCameraActive(true);
            window.requestAnimationFrame(scanFrame);
        } catch (error) {
            setCameraError(error?.message || "No se pudo activar la cámara.");
            stopCamera();
        }
    };

    const stopCamera = () => {
        scanningRef.current = false;
        streamRef.current?.getTracks?.().forEach((track) => track.stop());
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    };

    const handleManualSubmit = (event) => {
        event.preventDefault();
        validateCode(manualCode);
    };

    return (
        <Box sx={{ display: "grid", gap: 2.5 }}>
            <PageHeader
                title="Control de acceso"
                icon={<QrCodeScannerRoundedIcon sx={{ fontSize: 24 }} />}
                rightContent={
                    <Chip
                        icon={cameraActive ? <CameraAltRoundedIcon /> : <StopCircleRoundedIcon />}
                        label={cameraActive ? "Cámara activa" : "Modo recepción"}
                        color={cameraActive ? "success" : "default"}
                        variant={cameraActive ? "filled" : "outlined"}
                    />
                }
            />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.25fr 0.75fr" }, gap: 2.5 }}>
                <Paper elevation={0} sx={{ border: "1px solid var(--tg-card-border)", borderRadius: "var(--tg-radius)", p: 2.5 }}>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Sede</InputLabel>
                                <Select label="Sede" value={sedeId} onChange={(event) => setSedeId(event.target.value)}>
                                    {sedes.map((sede) => (
                                        <MenuItem key={sede.id} value={sede.id}>
                                            {sede.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {cameraActive ? (
                                <Button variant="outlined" color="error" startIcon={<StopCircleRoundedIcon />} onClick={stopCamera}>
                                    Detener
                                </Button>
                            ) : (
                                <Button variant="contained" startIcon={<CameraAltRoundedIcon />} onClick={startCamera} disabled={!sedeId}>
                                    Escanear
                                </Button>
                            )}
                        </Stack>

                        {cameraError ? <Alert severity="warning">{cameraError}</Alert> : null}

                        <Box
                            sx={{
                                minHeight: 430,
                                borderRadius: "var(--tg-radius)",
                                border: "1px solid rgba(15,23,42,0.14)",
                                overflow: "hidden",
                                backgroundColor: "#0F172A",
                                position: "relative",
                                display: "grid",
                                placeItems: "center",
                            }}
                        >
                            <video
                                ref={videoRef}
                                muted
                                playsInline
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: cameraActive ? "block" : "none",
                                }}
                            />

                            {!cameraActive ? (
                                <Stack spacing={1.5} alignItems="center" sx={{ color: "white", px: 3, textAlign: "center" }}>
                                    <QrCodeScannerRoundedIcon sx={{ fontSize: 72, color: "#F2B100" }} />
                                    <Typography sx={{ fontWeight: 900, fontSize: 24 }}>Puerta Revive</Typography>
                                    <Typography sx={{ maxWidth: 420, color: "rgba(255,255,255,0.72)" }}>
                                        Activa la cámara para escanear como aeropuerto o usa el campo manual con un lector USB.
                                    </Typography>
                                </Stack>
                            ) : (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        width: 280,
                                        height: 280,
                                        border: "3px solid #F2B100",
                                        borderRadius: 2,
                                        boxShadow: "0 0 0 999px rgba(15,23,42,0.34)",
                                    }}
                                />
                            )}
                        </Box>

                        <Box component="form" onSubmit={handleManualSubmit} sx={{ display: "flex", gap: 1.5 }}>
                            <TextField
                                fullWidth
                                size="small"
                                label="Código QR manual o lector USB"
                                value={manualCode}
                                onChange={(event) => setManualCode(event.target.value)}
                                disabled={!sedeId}
                            />
                            <Button type="submit" variant="contained" disabled={!manualCode.trim() || !sedeId || processing}>
                                Validar
                            </Button>
                        </Box>
                    </Stack>
                </Paper>

                <Paper elevation={0} sx={{ border: "1px solid var(--tg-card-border)", borderRadius: "var(--tg-radius)", p: 2.5 }}>
                    <Stack spacing={2}>
                        <Typography sx={{ fontWeight: 950, fontSize: 20 }}>Resultado</Typography>

                        {result ? (
                            <Alert
                                severity={result.permitido === null ? "info" : result.permitido ? "success" : "error"}
                                icon={result.permitido ? <CheckCircleRoundedIcon /> : <ReportProblemRoundedIcon />}
                            >
                                <Typography sx={{ fontWeight: 900 }}>
                                    {result.permitido === null ? "Escáner listo" : result.permitido ? "Acceso permitido" : "Acceso denegado"}
                                </Typography>
                                <Typography>{result.mensaje}</Typography>
                            </Alert>
                        ) : (
                            <Alert severity="info">Esperando escaneo.</Alert>
                        )}

                        {result?.permitido ? (
                            <Stack spacing={1.2}>
                                <InfoLine label="Persona" value={result.persona_id ? `#${result.persona_id}` : "-"} />
                                <InfoLine label="Membresía" value={result.membresia?.nombre || "-"} />
                                <InfoLine label="Sede membresía" value={result.membresia?.sede_nombre || "-"} />
                                <InfoLine label="Vence" value={result.membresia?.fecha_fin || "-"} />
                                <InfoLine label="Asistencia" value={result.asistencia?.id ? `Registrada #${result.asistencia.id}` : "Validada"} />
                                <InfoLine label="Flujo" value={result.tipo_checkin === "RESERVA" ? "Reserva marcada como asistida" : "Asistencia general"} />
                                {result.reserva ? (
                                    <InfoLine
                                        label="Reserva"
                                        value={`${result.reserva.servicio_nombre || "Servicio"} · ${String(result.reserva.hora_inicio || "").slice(0, 5)} - ${String(result.reserva.hora_fin || "").slice(0, 5)}`}
                                    />
                                ) : null}
                                <InfoLine
                                    label="Seguimiento"
                                    value={result.membresia?.es_pase_diario ? "Pase diario · sin seguimiento personalizado" : result.seguimiento_personalizado ? "Personalizado" : "General"}
                                />
                                <InfoLine label="Coach" value={result.coach_asignado?.coach_nombre || "Sin coach asignado"} />
                                {result.coach_asignado?.turno_recurrente_id ? (
                                    <InfoLine
                                        label="Turno coach"
                                        value={`${DIAS[result.coach_asignado.dia_semana] || "-"} ${String(result.coach_asignado.hora_inicio || "").slice(0, 5)} - ${String(result.coach_asignado.hora_fin || "").slice(0, 5)}`}
                                    />
                                ) : null}
                                {result.coach_asignado?.objetivo ? (
                                    <InfoLine label="Objetivo" value={result.coach_asignado.objetivo} />
                                ) : null}
                            </Stack>
                        ) : null}
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}

function InfoLine({ label, value }) {
    return (
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, borderBottom: "1px solid rgba(15,23,42,0.08)", pb: 1 }}>
            <Typography sx={{ color: "text.secondary", fontWeight: 800 }}>{label}</Typography>
            <Typography sx={{ fontWeight: 900, textAlign: "right" }}>{value}</Typography>
        </Box>
    );
}
