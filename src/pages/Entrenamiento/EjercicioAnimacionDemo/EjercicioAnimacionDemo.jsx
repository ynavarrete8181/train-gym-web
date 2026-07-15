import { useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";

const demoExercise = {
    nombre: "Sentadilla con barra",
    grupo_muscular: "PIERNAS",
    equipamiento: "BARRA",
    tipo_entrenamiento: "FUERZA",
    instrucciones: "Sentadilla con barra alta, abdomen contraido, espalda erguida y rodillas alineadas.",
};

const defaultMuscles = [
    { name: "Cuadriceps", role: "Principal", color: "#f2c300" },
    { name: "Gluteos", role: "Principal", color: "#ff8a00" },
    { name: "Pantorrillas", role: "Secundario", color: "#21c55d" },
    { name: "Core", role: "Estabilizador", color: "#38bdf8" },
];

const defaultTechnique = [
    "Abdomen contraido antes de bajar.",
    "Espalda erguida y pecho firme durante todo el recorrido.",
    "Rodillas alineadas con la punta de los pies.",
];

const muscleColors = ["#f2c300", "#ff8a00", "#21c55d", "#38bdf8", "#ef4444", "#a855f7"];

const mapAiMuscles = (analysis) => {
    const principal = (analysis?.musculos_principales || []).map((muscle, index) => ({
        name: muscle.nombre,
        role: `Principal ${muscle.intensidad ? `${muscle.intensidad}%` : ""}`.trim(),
        color: muscleColors[index % muscleColors.length],
    }));

    const secondary = (analysis?.musculos_secundarios || []).map((muscle, index) => ({
        name: muscle.nombre,
        role: `Secundario ${muscle.intensidad ? `${muscle.intensidad}%` : ""}`.trim(),
        color: muscleColors[(index + principal.length) % muscleColors.length],
    }));

    return [...principal, ...secondary].filter((muscle) => muscle.name);
};

function MuscleChip({ muscle }) {
    return (
        <Chip
            label={`${muscle.name} · ${muscle.role}`}
            size="small"
            sx={{
                borderRadius: "6px",
                bgcolor: `${muscle.color}22`,
                border: `1px solid ${muscle.color}66`,
                color: "#111827",
                fontWeight: 800,
            }}
        />
    );
}

function AnimatedBody({ playing }) {
    const [videoAvailable, setVideoAvailable] = useState(true);

    return (
        <Box
            sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
            }}
        >
            <Box
                sx={{
                    width: "min(100%, 390px)",
                    aspectRatio: "9 / 16",
                    minHeight: { xs: 620, md: 700 },
                    maxHeight: "calc(100vh - 190px)",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#080b10",
                    border: "1px solid #202734",
                    borderRadius: "22px",
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.35)",
                    "@keyframes squatBody": {
                        "0%, 100%": { transform: "translateY(2px)" },
                        "48%": { transform: "translateY(74px)" },
                    },
                    "@keyframes torsoTilt": {
                        "0%, 100%": { transform: "rotate(0deg)" },
                        "48%": { transform: "rotate(-5deg)" },
                    },
                    "@keyframes legDriveLeft": {
                        "0%, 100%": { transform: "rotate(4deg)" },
                        "48%": { transform: "rotate(-34deg)" },
                    },
                    "@keyframes legDriveRight": {
                        "0%, 100%": { transform: "rotate(-4deg)" },
                        "48%": { transform: "rotate(34deg)" },
                    },
                    "@keyframes armSwingLeft": {
                        "0%, 100%": { transform: "rotate(0deg)" },
                        "48%": { transform: "rotate(7deg)" },
                    },
                    "@keyframes armSwingRight": {
                        "0%, 100%": { transform: "rotate(0deg)" },
                        "48%": { transform: "rotate(-7deg)" },
                    },
                    "@keyframes musclePulse": {
                        "0%, 100%": { opacity: 0.72 },
                        "48%": { opacity: 1 },
                    },
                    "@keyframes floorPulse": {
                        "0%, 100%": { opacity: 0.28, transform: "scaleX(0.78)" },
                        "35%, 82%": { opacity: 0.7, transform: "scaleX(1)" },
                        "62%": { opacity: 0.12, transform: "scaleX(0.58)" },
                    },
                    "@keyframes frameTop": {
                        "0%, 8%": { opacity: 1, transform: "scale(1.02) translateY(-6px)" },
                        "18%, 76%": { opacity: 0, transform: "scale(1.06) translateY(18px)" },
                        "86%, 100%": { opacity: 1, transform: "scale(1.02) translateY(-6px)" },
                    },
                    "@keyframes frameMiddle": {
                        "0%, 9%": { opacity: 0, transform: "scale(1.04) translateY(4px)" },
                        "18%, 34%": { opacity: 1, transform: "scale(1.075) translateY(20px)" },
                        "44%, 56%": { opacity: 0.2, transform: "scale(1.1) translateY(34px)" },
                        "66%, 82%": { opacity: 1, transform: "scale(1.075) translateY(20px)" },
                        "92%, 100%": { opacity: 0, transform: "scale(1.04) translateY(4px)" },
                    },
                    "@keyframes frameBottom": {
                        "0%, 30%": { opacity: 0, transform: "scale(1.08) translateY(26px)" },
                        "42%, 58%": { opacity: 1, transform: "scale(1.13) translateY(42px)" },
                        "70%, 100%": { opacity: 0, transform: "scale(1.08) translateY(26px)" },
                    },
                    "@keyframes motionGhostDown": {
                        "0%, 10%": { opacity: 0, transform: "translateY(-34px) scale(0.98)" },
                        "20%, 40%": { opacity: 0.24, transform: "translateY(30px) scale(1.02)" },
                        "50%, 100%": { opacity: 0, transform: "translateY(46px) scale(1.04)" },
                    },
                    "@keyframes motionGhostUp": {
                        "0%, 54%": { opacity: 0, transform: "translateY(42px) scale(1.04)" },
                        "64%, 86%": { opacity: 0.22, transform: "translateY(-28px) scale(0.99)" },
                        "96%, 100%": { opacity: 0, transform: "translateY(-40px) scale(0.98)" },
                    },
                    "@keyframes videoProgress": {
                        "0%": { transform: "scaleX(0)" },
                        "100%": { transform: "scaleX(1)" },
                    },
                    "@keyframes cuePrep": {
                        "0%, 12%": { opacity: 1, transform: "translateY(0)" },
                        "20%, 82%": { opacity: 0, transform: "translateY(-8px)" },
                        "90%, 100%": { opacity: 1, transform: "translateY(0)" },
                    },
                    "@keyframes cueDown": {
                        "0%, 14%": { opacity: 0, transform: "translateY(8px)" },
                        "22%, 48%": { opacity: 1, transform: "translateY(0)" },
                        "56%, 100%": { opacity: 0, transform: "translateY(-8px)" },
                    },
                    "@keyframes cueUp": {
                        "0%, 54%": { opacity: 0, transform: "translateY(8px)" },
                        "62%, 88%": { opacity: 1, transform: "translateY(0)" },
                        "96%, 100%": { opacity: 0, transform: "translateY(-8px)" },
                    },
                    "@keyframes pulseRing": {
                        "0%, 100%": { opacity: 0.25, transform: "scale(0.94)" },
                        "48%": { opacity: 0.72, transform: "scale(1.08)" },
                    },
                    "@keyframes downArrow": {
                        "0%, 14%": { opacity: 0, transform: "translateY(-18px)" },
                        "24%, 48%": { opacity: 1, transform: "translateY(34px)" },
                        "58%, 100%": { opacity: 0, transform: "translateY(52px)" },
                    },
                    "@keyframes upArrow": {
                        "0%, 54%": { opacity: 0, transform: "translateY(38px)" },
                        "62%, 88%": { opacity: 1, transform: "translateY(-30px)" },
                        "96%, 100%": { opacity: 0, transform: "translateY(-42px)" },
                    },
                    "@keyframes phaseDot": {
                        "0%, 10%": { left: "8%" },
                        "46%, 56%": { left: "48%" },
                        "90%, 100%": { left: "88%" },
                    },
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "radial-gradient(circle at 50% 34%, rgba(242,195,0,0.12), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.06), transparent 34%, rgba(0,0,0,0.78))",
                    }}
                />
                {videoAvailable ? (
                    <Box
                        component="video"
                        src="/assets/ai-exercises/sentadilla-barra-real.mp4"
                        autoPlay={playing}
                        muted
                        loop
                        playsInline
                        onError={() => setVideoAvailable(false)}
                        sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center",
                            filter: "contrast(1.05) saturate(1.07)",
                        }}
                    />
                ) : (
                    <Box
                        component="img"
                        src={playing ? "/assets/ai-exercises/sentadilla-barra-loop.gif" : "/assets/ai-exercises/sentadilla-barra-frame-1.png"}
                        alt="Video animado realista de sentadilla con barra con musculos resaltados"
                        sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "center",
                            filter: "contrast(1.05) saturate(1.07)",
                        }}
                    />
                )}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(180deg, rgba(2,6,23,0.42) 0%, rgba(2,6,23,0.04) 28%, rgba(2,6,23,0.08) 58%, rgba(2,6,23,0.78) 100%)",
                    }}
                />
                <Stack
                    spacing={0.8}
                    sx={{
                        position: "absolute",
                        top: 18,
                        left: 18,
                        right: 18,
                        zIndex: 2,
                    }}
                >
                    <Typography sx={{ color: "#f2c300", fontSize: 12, fontWeight: 900, letterSpacing: 0 }}>
                        REVIVE AI MOTION
                    </Typography>
                    <Typography sx={{ color: "#f8fafc", fontSize: 30, fontWeight: 950, lineHeight: 1 }}>
                        Sentadilla perfecta
                    </Typography>
                    <Typography sx={{ color: "rgba(248,250,252,0.72)", fontSize: 13, fontWeight: 700 }}>
                        Abdomen contraido · Espalda erguida
                    </Typography>
                </Stack>
                <Box
                    sx={{
                        position: "absolute",
                        left: 18,
                        top: 122,
                        zIndex: 3,
                        width: 190,
                        minHeight: 74,
                    }}
                >
                    {[
                        { text: "1. PREPARA", sub: "abdomen firme", animation: "cuePrep" },
                        { text: "2. BAJA", sub: "rodillas alineadas", animation: "cueDown" },
                        { text: "3. SUBE", sub: "empuja el suelo", animation: "cueUp" },
                    ].map((cue) => (
                        <Box
                            key={cue.text}
                            sx={{
                                position: "absolute",
                                inset: 0,
                                p: 1.2,
                                borderRadius: "8px",
                                bgcolor: "rgba(15, 23, 42, 0.68)",
                                border: "1px solid rgba(242,195,0,0.38)",
                                backdropFilter: "blur(8px)",
                                animation: playing ? `${cue.animation} 4.45s ease-in-out infinite` : "none",
                                opacity: cue.text.startsWith("1.") ? 1 : 0,
                            }}
                        >
                            <Typography sx={{ color: "#f2c300", fontSize: 18, fontWeight: 950, lineHeight: 1 }}>
                                {cue.text}
                            </Typography>
                            <Typography sx={{ mt: 0.6, color: "#f8fafc", fontSize: 12, fontWeight: 800 }}>
                                {cue.sub}
                            </Typography>
                        </Box>
                    ))}
                </Box>
                <Stack
                    spacing={1}
                    sx={{
                        position: "absolute",
                        right: 14,
                        top: "38%",
                        zIndex: 2,
                        alignItems: "center",
                    }}
                >
                    {["CUADRICEPS", "GLUTEOS", "CORE"].map((label) => (
                        <Box
                            key={label}
                            sx={{
                                writingMode: "vertical-rl",
                                transform: "rotate(180deg)",
                                px: 0.65,
                                py: 1,
                                borderRadius: "999px",
                                bgcolor: "rgba(242,195,0,0.16)",
                                border: "1px solid rgba(242,195,0,0.42)",
                                color: "#f8fafc",
                                fontSize: 10,
                                fontWeight: 900,
                            }}
                        >
                            {label}
                        </Box>
                    ))}
                </Stack>
                <Box
                    sx={{
                        position: "absolute",
                        left: "50%",
                        top: "58%",
                        width: 210,
                        height: 210,
                        ml: "-105px",
                        mt: "-105px",
                        zIndex: 2,
                        borderRadius: "50%",
                        border: "2px solid rgba(239, 68, 68, 0.46)",
                        boxShadow: "0 0 38px rgba(239,68,68,0.28)",
                        animation: playing ? "pulseRing 4.45s ease-in-out infinite" : "none",
                        pointerEvents: "none",
                    }}
                />
                <Box
                    sx={{
                        position: "absolute",
                        left: 34,
                        top: "35%",
                        bottom: "24%",
                        width: 4,
                        zIndex: 3,
                        borderRadius: 999,
                        bgcolor: "rgba(248,250,252,0.22)",
                        overflow: "visible",
                    }}
                >
                    <Box
                        sx={{
                            position: "absolute",
                            left: -8,
                            top: "8%",
                            width: 20,
                            height: 72,
                            borderRadius: 999,
                            bgcolor: "rgba(239,68,68,0.26)",
                            border: "1px solid rgba(239,68,68,0.5)",
                            animation: playing ? "downArrow 4.45s ease-in-out infinite" : "none",
                            "&::after": {
                                content: '""',
                                position: "absolute",
                                left: 4,
                                bottom: -7,
                                width: 10,
                                height: 10,
                                borderRight: "3px solid #ef4444",
                                borderBottom: "3px solid #ef4444",
                                transform: "rotate(45deg)",
                            },
                        }}
                    />
                    <Box
                        sx={{
                            position: "absolute",
                            left: -8,
                            bottom: "8%",
                            width: 20,
                            height: 72,
                            borderRadius: 999,
                            bgcolor: "rgba(34,197,94,0.24)",
                            border: "1px solid rgba(34,197,94,0.48)",
                            animation: playing ? "upArrow 4.45s ease-in-out infinite" : "none",
                            "&::after": {
                                content: '""',
                                position: "absolute",
                                left: 4,
                                top: -7,
                                width: 10,
                                height: 10,
                                borderLeft: "3px solid #22c55e",
                                borderTop: "3px solid #22c55e",
                                transform: "rotate(45deg)",
                            },
                        }}
                    />
                </Box>
                <Box
                    sx={{
                        position: "absolute",
                        left: 18,
                        right: 18,
                        bottom: 18,
                        zIndex: 2,
                    }}
                >
                    <Typography sx={{ color: "#f8fafc", fontSize: 14, fontWeight: 900 }}>
                        Baja controlado, sube fuerte.
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.8 }}>
                        <Box
                            sx={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                bgcolor: playing ? "#ef4444" : "#94a3b8",
                                boxShadow: playing ? "0 0 12px rgba(239,68,68,0.9)" : "none",
                            }}
                        />
                        <Typography sx={{ color: "rgba(248,250,252,0.78)", fontSize: 11, fontWeight: 900 }}>
                            {videoAvailable ? "MP4 IA · MOTION REAL" : "LOOP GIF · 37 FRAMES · IA ANATOMY"}
                        </Typography>
                    </Stack>
                    <Box sx={{ mt: 1.4, height: 4, borderRadius: 999, bgcolor: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
                        <Box
                            sx={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 999,
                                bgcolor: "#f2c300",
                                transformOrigin: "left center",
                                animation: playing ? "videoProgress 4.45s linear infinite" : "none",
                                transform: playing ? undefined : "scaleX(0.36)",
                            }}
                        />
                    </Box>
                    <Box sx={{ mt: 1.3, position: "relative", height: 24 }}>
                        <Stack direction="row" justifyContent="space-between">
                            {["ARRIBA", "ABAJO", "ARRIBA"].map((label) => (
                                <Typography key={label} sx={{ color: "rgba(248,250,252,0.72)", fontSize: 10, fontWeight: 900 }}>
                                    {label}
                                </Typography>
                            ))}
                        </Stack>
                        <Box
                            sx={{
                                position: "absolute",
                                top: 16,
                                width: 9,
                                height: 9,
                                borderRadius: "50%",
                                bgcolor: "#f2c300",
                                boxShadow: "0 0 14px rgba(242,195,0,0.85)",
                                animation: playing ? "phaseDot 4.45s ease-in-out infinite" : "none",
                            }}
                        />
                    </Box>
                </Box>
                <Box
                    component="svg"
                    viewBox="0 0 520 520"
                    role="img"
                    aria-label="Animacion propia de squat jump con musculos resaltados"
                    sx={{
                        width: "min(118%, 520px)",
                        height: "auto",
                        mt: 8,
                        position: "relative",
                        zIndex: 1,
                        opacity: 0,
                        pointerEvents: "none",
                        "& .motion": {
                            transformOrigin: "260px 255px",
                            animation: playing ? "squatBody 2.8s ease-in-out infinite" : "none",
                        },
                        "& .torso": {
                            transformOrigin: "260px 214px",
                            animation: playing ? "torsoTilt 2.8s ease-in-out infinite" : "none",
                        },
                        "& .leftLeg": {
                            transformOrigin: "238px 310px",
                            animation: playing ? "legDriveLeft 2.8s ease-in-out infinite" : "none",
                        },
                        "& .rightLeg": {
                            transformOrigin: "282px 310px",
                            animation: playing ? "legDriveRight 2.8s ease-in-out infinite" : "none",
                        },
                        "& .leftArm": {
                            transformOrigin: "226px 204px",
                            animation: playing ? "armSwingLeft 2.8s ease-in-out infinite" : "none",
                        },
                        "& .rightArm": {
                            transformOrigin: "294px 204px",
                            animation: playing ? "armSwingRight 2.8s ease-in-out infinite" : "none",
                        },
                        "& .activeMuscle": {
                            animation: playing ? "musclePulse 2.8s ease-in-out infinite" : "none",
                        },
                        "& .floor": {
                            transformOrigin: "260px 446px",
                            animation: playing ? "floorPulse 2.8s ease-in-out infinite" : "none",
                        },
                    }}
                >
                    <defs>
                        <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="bodyLine" x1="0" x2="1">
                            <stop offset="0%" stopColor="#e5e7eb" />
                            <stop offset="100%" stopColor="#9ca3af" />
                        </linearGradient>
                    </defs>

                    <ellipse className="floor" cx="260" cy="446" rx="132" ry="16" fill="#f2c300" filter="url(#softGlow)" />
                    <line x1="108" y1="448" x2="412" y2="448" stroke="#303846" strokeWidth="5" strokeLinecap="round" />

                    <g className="motion">
                        <g>
                            <line x1="122" y1="169" x2="398" y2="169" stroke="#111827" strokeWidth="14" strokeLinecap="round" />
                            <line x1="122" y1="169" x2="398" y2="169" stroke="#6b7280" strokeWidth="5" strokeLinecap="round" />
                            <circle cx="111" cy="169" r="44" fill="#111827" stroke="#2b313d" strokeWidth="8" />
                            <circle cx="409" cy="169" r="44" fill="#111827" stroke="#2b313d" strokeWidth="8" />
                            <circle cx="111" cy="169" r="25" fill="#171d27" stroke="#020617" strokeWidth="5" />
                            <circle cx="409" cy="169" r="25" fill="#171d27" stroke="#020617" strokeWidth="5" />
                        </g>

                        <circle cx="260" cy="112" r="35" fill="#d7a27a" stroke="#7c4a2d" strokeWidth="4" />
                        <path d="M232 109 Q260 76 288 109 Q286 86 260 78 Q235 86 232 109 Z" fill="#1f2937" />
                        <circle cx="248" cy="111" r="3" fill="#111827" />
                        <circle cx="272" cy="111" r="3" fill="#111827" />
                        <path d="M249 128 Q260 135 272 128" fill="none" stroke="#7c4a2d" strokeWidth="3" strokeLinecap="round" />

                        <g className="torso">
                            <path d="M222 158 Q260 142 298 158 L316 270 Q260 306 204 270 Z" fill="#d7a27a" stroke="#7c4a2d" strokeWidth="5" strokeLinejoin="round" />
                            <path className="activeMuscle" d="M239 172 Q260 158 281 172 L286 244 Q260 258 234 244 Z" fill="#e53e3e" opacity="0.78" filter="url(#softGlow)" />
                            <path d="M246 176 L239 254 M260 166 L260 260 M274 176 L281 254" stroke="#8b3a2f" strokeWidth="3" strokeLinecap="round" />
                            <path d="M226 162 Q211 184 206 214" stroke="#b86a45" strokeWidth="8" strokeLinecap="round" />
                            <path d="M294 162 Q309 184 314 214" stroke="#b86a45" strokeWidth="8" strokeLinecap="round" />
                        </g>

                        <g className="leftArm">
                            <path d="M226 172 Q198 160 181 170 Q174 176 169 194" fill="none" stroke="#d7a27a" strokeWidth="18" strokeLinecap="round" />
                            <path d="M169 194 Q164 172 184 162" fill="none" stroke="#d7a27a" strokeWidth="16" strokeLinecap="round" />
                            <circle cx="184" cy="162" r="10" fill="#d7a27a" stroke="#7c4a2d" strokeWidth="3" />
                        </g>
                        <g className="rightArm">
                            <path d="M294 172 Q322 160 339 170 Q346 176 351 194" fill="none" stroke="#d7a27a" strokeWidth="18" strokeLinecap="round" />
                            <path d="M351 194 Q356 172 336 162" fill="none" stroke="#d7a27a" strokeWidth="16" strokeLinecap="round" />
                            <circle cx="336" cy="162" r="10" fill="#d7a27a" stroke="#7c4a2d" strokeWidth="3" />
                        </g>

                        <g className="leftLeg">
                            <path d="M230 276 Q206 334 198 414" fill="none" stroke="#d7a27a" strokeWidth="30" strokeLinecap="round" />
                            <path className="activeMuscle" d="M221 294 Q207 342 201 388" fill="none" stroke="#ef4444" strokeWidth="18" strokeLinecap="round" filter="url(#softGlow)" />
                            <path d="M224 302 Q214 342 207 382" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round" />
                            <path className="activeMuscle" d="M205 355 Q199 388 198 414" fill="none" stroke="#f97316" strokeWidth="11" strokeLinecap="round" filter="url(#softGlow)" />
                            <path d="M198 421 L164 428" stroke="#d7a27a" strokeWidth="18" strokeLinecap="round" />
                        </g>

                        <g className="rightLeg">
                            <path d="M290 276 Q314 334 322 414" fill="none" stroke="#d7a27a" strokeWidth="30" strokeLinecap="round" />
                            <path className="activeMuscle" d="M299 294 Q313 342 319 388" fill="none" stroke="#ef4444" strokeWidth="18" strokeLinecap="round" filter="url(#softGlow)" />
                            <path d="M296 302 Q306 342 313 382" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round" />
                            <path className="activeMuscle" d="M315 355 Q321 388 322 414" fill="none" stroke="#f97316" strokeWidth="11" strokeLinecap="round" filter="url(#softGlow)" />
                            <path d="M322 421 L356 428" stroke="#d7a27a" strokeWidth="18" strokeLinecap="round" />
                        </g>

                        <ellipse className="activeMuscle" cx="233" cy="285" rx="20" ry="30" fill="#ff8a00" opacity="0.72" filter="url(#softGlow)" />
                        <ellipse className="activeMuscle" cx="287" cy="285" rx="20" ry="30" fill="#ff8a00" opacity="0.72" filter="url(#softGlow)" />
                    </g>
                </Box>
            </Box>
        </Box>
    );
}

export default function EjercicioAnimacionDemo() {
    const [playing, setPlaying] = useState(true);
    const [analysis, setAnalysis] = useState(null);
    const [loadingAi, setLoadingAi] = useState(false);
    const [aiError, setAiError] = useState("");

    const visibleMuscles = analysis ? mapAiMuscles(analysis) : defaultMuscles;
    const visibleTechnique = analysis?.indicaciones_tecnicas?.length
        ? analysis.indicaciones_tecnicas
        : defaultTechnique;

    const handleAnalyze = async () => {
        setLoadingAi(true);
        setAiError("");

        try {
            const { data } = await apiClient.post("/gimnasio/ejercicios/ia-analisis", demoExercise);
            setAnalysis(data);
        } catch (error) {
            setAiError(getApiErrorMessage(error, "No se pudo analizar el ejercicio con IA."));
        } finally {
            setLoadingAi(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", p: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: 1440, mx: "auto" }}>
                <Stack spacing={3}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            border: "1px solid #d8dee8",
                            borderRadius: "8px",
                            bgcolor: "#ffffff",
                        }}
                    >
                        <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={2}
                            alignItems={{ xs: "flex-start", md: "center" }}
                            justifyContent="space-between"
                        >
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <FitnessCenterIcon sx={{ color: "#c99a00" }} />
                                    <Typography variant="h4" sx={{ fontWeight: 900, color: "#111827" }}>
                                        Squat Jump
                                    </Typography>
                                </Stack>
                                <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 14 }}>
                                    Prueba propia sin YouTube: muñeco animado, músculos activos y ficha técnica.
                                </Typography>
                            </Box>
                            <Stack direction="row" spacing={1}>
                                <Button
                                    variant="contained"
                                    startIcon={loadingAi ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                                    onClick={handleAnalyze}
                                    disabled={loadingAi}
                                    sx={{
                                        borderRadius: "8px",
                                        bgcolor: "#f2c300",
                                        color: "#111827",
                                        fontWeight: 900,
                                        "&:hover": { bgcolor: "#d8ae00" },
                                    }}
                                >
                                    Analizar con IA
                                </Button>
                                <IconButton
                                    aria-label={playing ? "Pausar animacion" : "Reproducir animacion"}
                                    onClick={() => setPlaying((value) => !value)}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "8px",
                                        bgcolor: "#111827",
                                        color: "#f2c300",
                                        "&:hover": { bgcolor: "#1f2937" },
                                    }}
                                >
                                    {playing ? <PauseIcon /> : <PlayArrowIcon />}
                                </IconButton>
                            </Stack>
                        </Stack>
                    </Paper>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.25fr) minmax(340px, 0.75fr)" },
                            gap: 3,
                            alignItems: "start",
                        }}
                    >
                        <AnimatedBody playing={playing} />

                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                border: "1px solid #d8dee8",
                                borderRadius: "8px",
                                bgcolor: "#ffffff",
                            }}
                        >
                            <Stack spacing={2.5}>
                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <AccessibilityNewIcon sx={{ color: "#c99a00" }} />
                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                            Músculos detectados
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                                        {visibleMuscles.map((muscle) => (
                                            <MuscleChip key={muscle.name} muscle={muscle} />
                                        ))}
                                    </Stack>
                                    {analysis?.source && (
                                        <Typography sx={{ mt: 1.2, fontSize: 12, color: "#64748b" }}>
                                            Fuente: {analysis.source === "openai" ? `OpenAI · ${analysis.model}` : analysis.message || analysis.source}
                                        </Typography>
                                    )}
                                    {aiError && (
                                        <Typography sx={{ mt: 1.2, fontSize: 12, color: "#dc2626" }}>
                                            {aiError}
                                        </Typography>
                                    )}
                                </Box>

                                <Divider />

                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <DirectionsRunIcon sx={{ color: "#c99a00" }} />
                                        <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                            Técnica clave
                                        </Typography>
                                    </Stack>
                                    <Stack component="ol" spacing={1.2} sx={{ mt: 1.5, pl: 2.5, color: "#334155" }}>
                                        {visibleTechnique.map((item) => (
                                            <Typography component="li" key={item} sx={{ fontSize: 14, lineHeight: 1.55 }}>
                                                {item}
                                            </Typography>
                                        ))}
                                    </Stack>
                                </Box>

                                {analysis?.patron_biomecanico && (
                                    <>
                                        <Divider />
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                                Patrón biomecánico
                                            </Typography>
                                            <Typography sx={{ mt: 1, fontSize: 14, color: "#475569", lineHeight: 1.55 }}>
                                                {analysis.patron_biomecanico}
                                            </Typography>
                                        </Box>
                                    </>
                                )}

                                <Divider />

                                <Box
                                    sx={{
                                        p: 2,
                                        borderRadius: "8px",
                                        bgcolor: "#f8fafc",
                                        border: "1px solid #e2e8f0",
                                    }}
                                >
                                    <Typography sx={{ fontSize: 13, color: "#475569", lineHeight: 1.55 }}>
                                        Esta demo es 100% generada en el sistema con SVG y CSS. Para producción,
                                        el mismo modelo puede guardarse como plantilla por ejercicio y luego
                                        exportarse a video propio.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Paper>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}
