import { Stack } from "@mui/material";
import PremiumButton from "../../components/ui/PremiumButton";
import { exportReportExcel, exportReportPdf } from "./reportesExport";

export default function ReportExportButtons({ title, rows, columns }) {
    const disabled = !rows?.length;

    return (
        <Stack direction="row" spacing={1} flexWrap="wrap">
            <PremiumButton
                variant="pdf"
                disabled={disabled}
                onClick={() => exportReportPdf({ title, rows, columns })}
                sx={{ minHeight: 36, px: 1.6 }}
            >
                PDF
            </PremiumButton>
            <PremiumButton
                variant="excel"
                disabled={disabled}
                onClick={() => exportReportExcel({ title, rows, columns })}
                sx={{ minHeight: 36, px: 1.6 }}
            >
                Excel
            </PremiumButton>
        </Stack>
    );
}
