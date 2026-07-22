import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    FormControl,
    InputAdornment,
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
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import Swal from "sweetalert2";

import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";
import ReportExportButtons from "./ReportExportButtons";
import ReportMetricChip from "./ReportMetricChip";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const today = new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

const emptyReportData = {
    filtros: { sedes: [], fecha_desde: thirtyDaysAgo, fecha_hasta: today },
    resumen: {
        asistencias: 0,
        clientes_con_coach: 0,
        ingresos_membresias: 0,
        reservas_total: 0,
        reservas_usadas: 0,
        reservas_no_usadas: 0,
        auditorias: 0,
        errores_tecnicos: 0,
    },
    asistencia_por_sede: [],
    asistencia_por_membresia: [],
    clientes_por_coach: [],
    ingresos_por_membresia: [],
    reservas_uso: [],
    auditoria: { por_usuario: [], por_rol: [], por_accion: [], por_modulo: [], por_fecha: [] },
    logs: { por_severidad: [], por_ruta: [], por_usuario: [], por_error: [] },
};

function MetricCard(props) {
    return <ReportMetricChip {...props} />;
}

function ReportTable({ title, rows, columns, emptyText }) {
    return (
        <Box sx={{ border: "1px solid #e5e7eb", flex: 1, minWidth: 0, overflow: "hidden", backgroundColor: "#ffffff" }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}
            >
                <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: 16 }}>{title}</Typography>
                <ReportExportButtons title={title} rows={rows} columns={columns} />
            </Stack>
            <TableContainer sx={{ boxShadow: "none" }}>
                <Table size="small" sx={tableSx}>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell key={column.key} align={column.align || "left"}>{column.label}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 4, color: "#64748b" }}>
                                    {emptyText}
                                </TableCell>
                            </TableRow>
                        ) : rows.map((row, index) => (
                            <TableRow key={`${title}-${index}`}>
                                {columns.map((column) => (
                                    <TableCell key={column.key} align={column.align || "left"}>
                                        {column.render ? column.render(row) : row[column.key]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default function ReportesPremium() {
    const [filters, setFilters] = useState({
        buscar: "",
        sede_id: "",
        fecha_desde: thirtyDaysAgo,
        fecha_hasta: today,
        limit: 8,
    });
    const [data, setData] = useState(emptyReportData);

    const params = useMemo(() => ({
        buscar: filters.buscar || undefined,
        sede_id: filters.sede_id || undefined,
        fecha_desde: filters.fecha_desde || undefined,
        fecha_hasta: filters.fecha_hasta || undefined,
        limit: filters.limit,
    }), [filters]);

    useEffect(() => {
        let active = true;

        apiClient.get("/gimnasio/reportes/premium", { params })
            .then(({ data: response }) => {
                if (!active) return;
                setData({
                    ...emptyReportData,
                    ...response,
                    auditoria: { ...emptyReportData.auditoria, ...(response?.auditoria || {}) },
                    logs: { ...emptyReportData.logs, ...(response?.logs || {}) },
                });
            })
            .catch((error) => {
                if (!active) return;
                Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los reportes premium."), "error");
            });

        return () => {
            active = false;
        };
    }, [params]);

    const usoReservas = data.resumen.reservas_total
        ? Math.round((data.resumen.reservas_usadas / data.resumen.reservas_total) * 100)
        : 0;

    return (
        <Paper elevation={0} sx={{ ...pagePaperSx, p: 0, overflow: "hidden" }}>
            <Box sx={{ px: 3, py: 2.4, borderBottom: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "center" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <AssessmentOutlinedIcon sx={{ color: "#0f172a" }} />
                        <Box>
                            <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>Reportes / Premium</Typography>
                            <Typography sx={{ mt: 0.4, color: "#64748b", fontSize: 13 }}>
                                Visión gerencial de asistencia, membresías, reservas, ingresos, auditoría y logs.
                            </Typography>
                        </Box>
                    </Stack>

                    <Chip label={`${data.filtros.fecha_desde} al ${data.filtros.fecha_hasta}`} sx={semanticChipSx("mustard")} />
                </Stack>

                <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} sx={{ mt: 2.5 }}>
                    <TextField
                        size="small"
                        placeholder="Buscar cédula, cliente, módulo, ruta o error..."
                        value={filters.buscar}
                        onChange={(e) => setFilters((current) => ({ ...current, buscar: e.target.value }))}
                        sx={{ ...filterInputSx, minWidth: { xs: "100%", lg: 360 } }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <FormControl size="small" sx={{ ...filterInputSx, minWidth: { xs: "100%", lg: 220 } }}>
                        <InputLabel>Sede</InputLabel>
                        <Select
                            label="Sede"
                            value={filters.sede_id}
                            onChange={(e) => setFilters((current) => ({ ...current, sede_id: e.target.value }))}
                        >
                            <MenuItem value="">Todas las sedes</MenuItem>
                            {(data.filtros.sedes || []).map((sede) => (
                                <MenuItem key={sede.id} value={sede.id}>{sede.nombre}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        type="date"
                        size="small"
                        label="Desde"
                        value={filters.fecha_desde}
                        onChange={(e) => setFilters((current) => ({ ...current, fecha_desde: e.target.value }))}
                        sx={{ ...filterInputSx, minWidth: { xs: "100%", lg: 170 } }}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        type="date"
                        size="small"
                        label="Hasta"
                        value={filters.fecha_hasta}
                        onChange={(e) => setFilters((current) => ({ ...current, fecha_hasta: e.target.value }))}
                        sx={{ ...filterInputSx, minWidth: { xs: "100%", lg: 170 } }}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>
            </Box>

            <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap sx={{ px: 3, py: 2, borderBottom: "1px solid #e5e7eb", backgroundColor: "#fbfbfc" }}>
                <MetricCard label="Asistencias" value={data.resumen.asistencias} helper="Registros del periodo" />
                <MetricCard label="Clientes por coach" value={data.resumen.clientes_con_coach} helper="Asignaciones activas" tone="success" />
                <MetricCard label="Ingresos membresías" value={money(data.resumen.ingresos_membresias)} helper="Ventas pagadas/abonadas" tone="success" />
                <MetricCard label="Uso reservas" value={`${usoReservas}%`} helper={`${data.resumen.reservas_usadas}/${data.resumen.reservas_total} usadas`} />
                <MetricCard label="No asistieron" value={data.resumen.reservas_no_usadas} helper="Reservas vencidas sin check-in" tone="danger" />
                <MetricCard label="Errores técnicos" value={data.resumen.errores_tecnicos} helper="Excepciones agrupadas" tone="danger" />
            </Stack>

            <Stack spacing={2} sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
                <ReportTable
                    title="Asistencia por sede"
                    rows={data.asistencia_por_sede}
                    emptyText="Sin asistencias con los filtros actuales."
                    columns={[
                        { key: "sede_nombre", label: "Sede" },
                        { key: "total", label: "Asistencias", align: "right" },
                        { key: "clientes", label: "Clientes", align: "right" },
                        { key: "con_reserva", label: "Con reserva", align: "right" },
                    ]}
                />
                <ReportTable
                    title="Asistencia por membresía"
                    rows={data.asistencia_por_membresia}
                    emptyText="Sin asistencia por membresía."
                    columns={[
                        { key: "membresia_nombre", label: "Membresía" },
                        { key: "total", label: "Asistencias", align: "right" },
                        { key: "clientes", label: "Clientes", align: "right" },
                        { key: "con_reserva", label: "Reservas", align: "right" },
                    ]}
                />
            </Stack>

            <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
                <ReportTable
                    title="Clientes por coach"
                    rows={data.clientes_por_coach}
                    emptyText="Sin clientes asignados a coach."
                    columns={[
                        { key: "coach_nombre", label: "Coach" },
                        { key: "sede_nombre", label: "Sede" },
                        { key: "clientes", label: "Clientes", align: "right" },
                        { key: "con_turno", label: "Con turno", align: "right" },
                    ]}
                />
                <ReportTable
                    title="Ingresos por membresía"
                    rows={data.ingresos_por_membresia}
                    emptyText="Sin ingresos por membresía."
                    columns={[
                        { key: "membresia_nombre", label: "Membresía" },
                        { key: "ventas", label: "Ventas", align: "right" },
                        { key: "ingresos", label: "Ingresos", align: "right", render: (row) => money(row.ingresos) },
                        { key: "ticket_promedio", label: "Ticket", align: "right", render: (row) => money(row.ticket_promedio) },
                    ]}
                />
            </Stack>

            <ReportTable
                title="Reservas usadas vs no usadas"
                rows={data.reservas_uso}
                emptyText="Sin reservas en el periodo."
                columns={[
                    { key: "sede_nombre", label: "Sede" },
                    { key: "servicio_nombre", label: "Servicio" },
                    { key: "total", label: "Reservadas", align: "right" },
                    { key: "asistieron", label: "Asistieron", align: "right" },
                    { key: "no_asistieron", label: "No asistieron", align: "right" },
                    { key: "canceladas", label: "Canceladas", align: "right" },
                ]}
            />

            <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
                <ReportTable
                    title="Auditoría por usuario"
                    rows={data.auditoria.por_usuario}
                    emptyText="Sin auditoría por usuario."
                    columns={[
                        { key: "clave", label: "Usuario" },
                        { key: "cedula", label: "Cédula" },
                        { key: "total", label: "Acciones", align: "right" },
                    ]}
                />
                <ReportTable
                    title="Auditoría por rol / acción / módulo"
                    rows={[...data.auditoria.por_rol, ...data.auditoria.por_accion, ...data.auditoria.por_modulo]}
                    emptyText="Sin datos de auditoría."
                    columns={[
                        { key: "clave", label: "Clasificación" },
                        { key: "total", label: "Eventos", align: "right" },
                    ]}
                />
            </Stack>

            <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
                <ReportTable
                    title="Logs por severidad y ruta"
                    rows={[...data.logs.por_severidad, ...data.logs.por_ruta]}
                    emptyText="Sin logs del sistema."
                    columns={[
                        { key: "clave", label: "Severidad / Ruta" },
                        { key: "total", label: "Eventos", align: "right" },
                    ]}
                />
                <ReportTable
                    title="Errores técnicos"
                    rows={data.logs.por_error}
                    emptyText="Sin errores técnicos."
                    columns={[
                        { key: "clave", label: "Error" },
                        { key: "detalle", label: "Detalle" },
                        { key: "total", label: "Total", align: "right" },
                    ]}
                />
            </Stack>
            </Stack>
        </Paper>
    );
}
