import { Box, Typography } from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";

const tones = {
    default: { border: "#e5e7eb", iconBg: "#e8f1ff", color: "#0f4c81", Icon: AssignmentTurnedInOutlinedIcon },
    success: { border: "#e5e7eb", iconBg: "#e8f7ef", color: "#15803d", Icon: CheckCircleOutlineOutlinedIcon },
    danger: { border: "#e5e7eb", iconBg: "#fff1f2", color: "#dc2626", Icon: ReportProblemOutlinedIcon },
    mustard: { border: "#e5e7eb", iconBg: "#fff7ed", color: "#d97706", Icon: DescriptionOutlinedIcon },
};

export default function ReportMetricChip({ label, value, helper, tone = "default", compact = false }) {
    const palette = tones[tone] || tones.default;
    const Icon = palette.Icon;

    return (
        <Box
            sx={{
                minHeight: compact ? 34 : 50,
                minWidth: compact ? 112 : 180,
                maxWidth: compact ? 160 : 270,
                flex: compact ? "0 0 auto" : "1 1 190px",
                px: compact ? 0.75 : 1.4,
                py: compact ? 0.55 : 1,
                border: `1px solid ${compact ? palette.iconBg : palette.border}`,
                backgroundColor: compact ? "#fbfdff" : "#ffffff",
                color: "#1e293b",
                display: "flex",
                alignItems: "center",
                gap: compact ? 0.75 : 1.2,
                boxShadow: compact ? "none" : "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
        >
            <Box
                sx={{
                    width: compact ? 24 : 34,
                    height: compact ? 24 : 34,
                    display: "grid",
                    placeItems: "center",
                    backgroundColor: palette.iconBg,
                    color: palette.color,
                    flex: "0 0 auto",
                }}
            >
                <Icon sx={{ fontSize: compact ? 17 : 20 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: compact ? 9 : 10.5, fontWeight: 900, color: "#64748b", lineHeight: 1.1 }}>
                    {label}
                </Typography>
                <Typography sx={{ mt: 0.1, fontSize: compact ? 14 : 19, fontWeight: 950, lineHeight: 1, color: "#1e293b" }}>
                    {value}
                </Typography>
                {helper ? (
                    <Typography sx={{ mt: 0.2, fontSize: compact ? 8.5 : 10.5, fontWeight: 700, color: "#64748b", lineHeight: 1.05 }}>
                        {helper}
                    </Typography>
                ) : null}
            </Box>
        </Box>
    );
}
