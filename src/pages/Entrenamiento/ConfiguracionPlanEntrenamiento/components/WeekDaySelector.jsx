import { Chip, Stack } from "@mui/material";

const dayTone = (active, hasContent) => {
    if (active) return { bg: "#111827", color: "#ffffff", border: "#111827" };
    if (hasContent) return { bg: "rgba(245, 158, 11, 0.14)", color: "#92400e", border: "rgba(245, 158, 11, 0.32)" };
    return { bg: "#ffffff", color: "#475569", border: "#dbe2ea" };
};

export default function WeekDaySelector({ days, selectedDay, onSelect, savedDaysMap }) {
    return (
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} useFlexGap flexWrap="wrap">
            {days.map((day) => {
                const active = day.value === selectedDay;
                const hasContent = !!savedDaysMap[day.value];
                const tone = dayTone(active, hasContent);

                return (
                    <Chip
                        key={day.value}
                        label={hasContent ? `${day.label} · Configurado` : day.label}
                        onClick={() => onSelect(day.value)}
                        clickable
                        sx={{
                            px: 1,
                            height: 42,
                            borderRadius: "14px",
                            fontWeight: 800,
                            bgcolor: tone.bg,
                            color: tone.color,
                            border: `1px solid ${tone.border}`,
                            "& .MuiChip-label": {
                                px: 1.5,
                                fontSize: 12,
                            },
                        }}
                    />
                );
            })}
        </Stack>
    );
}
