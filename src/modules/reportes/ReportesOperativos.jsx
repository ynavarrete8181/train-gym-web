import { useEffect, useMemo, useState } from "react";
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    IconButton,
    InputAdornment,
    Paper,
    Popover,
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
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import Swal from "sweetalert2";

import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import {
    filterInputSx,
    reportEmptyStateSx,
    reportBodyCardSx,
    reportResultsSx,
    reportTableBlockSx,
    reportTitleCardSx,
    semanticChipSx,
    tableSx,
} from "../../Styles/muiTheme";
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

function buildAsistenciaRows(data) {
    return [
        ...data.asistencia_por_sede.map((row) => ({
            ...row,
            categoria: "Sede",
            detalle: row.sede_nombre,
            reservas: row.con_reserva,
        })),
        ...data.asistencia_por_membresia.map((row) => ({
            ...row,
            categoria: "Membresía",
            detalle: row.membresia_nombre,
            reservas: row.con_reserva,
        })),
    ];
}

function ReportEmptyState({ text = "Los resultados aparecerán en esta sección." }) {
    return (
        <Box sx={{ ...reportEmptyStateSx, border: "1px solid #e5e7eb", backgroundColor: "#ffffff" }}>
            <Box>
                <Box
                    sx={{
                        width: 86,
                        height: 86,
                        mx: "auto",
                        mb: 2,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        backgroundColor: "#eef2ff",
                        color: "#2563eb",
                    }}
                >
                    <ManageSearchOutlinedIcon sx={{ fontSize: 48 }} />
                </Box>
                <Typography sx={{ fontSize: 18, fontWeight: 950, color: "#0f172a" }}>
                    Realice una consulta
                </Typography>
                <Typography sx={{ mt: 0.8, fontSize: 13, color: "#64748b" }}>
                    Seleccione los filtros de búsqueda para visualizar el reporte.
                </Typography>
                <Typography sx={{ mt: 0.8, fontSize: 12, color: "#94a3b8" }}>
                    {text}
                </Typography>
            </Box>
        </Box>
    );
}

function ReportTable({ title, rows, columns, emptyText, metrics = [], contextLabel = "" }) {
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [activeColumn, setActiveColumn] = useState(null);
    const [columnFilters, setColumnFilters] = useState({});

    const activeColumnConfig = columns.find((column) => column.key === activeColumn);
    const filteredRows = useMemo(() => rows.filter((row) => Object.entries(columnFilters).every(([key, value]) => {
        if (!value) return true;
        const column = columns.find((item) => item.key === key);
        const rawValue = column?.render ? column.render(row) : row[key];
        return String(rawValue ?? "").toLowerCase().includes(String(value).toLowerCase());
    })), [columnFilters, columns, rows]);

    const openColumnFilter = (event, columnKey) => {
        setActiveColumn(columnKey);
        setFilterAnchor(event.currentTarget);
    };

    const closeColumnFilter = () => {
        setFilterAnchor(null);
    };

    const clearActiveFilter = () => {
        if (!activeColumn) return;
        setColumnFilters((current) => {
            const next = { ...current };
            delete next[activeColumn];
            return next;
        });
    };

    return (
        <Box sx={{ ...reportTableBlockSx, flex: 1 }}>
            <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                sx={{ px: 2, py: 1.25, backgroundColor: "#ffffff" }}
            >
                <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap justifyContent="flex-start">
                    {metrics.map((metric) => (
                        <ReportMetricChip key={metric.label} {...metric} compact />
                    ))}
                </Stack>
                <Stack direction="row" spacing={1} justifyContent={{ xs: "flex-start", sm: "flex-end" }}>
                    <ReportExportButtons title={title} rows={filteredRows} columns={columns} />
                </Stack>
            </Stack>
            {contextLabel ? (
                <Stack
                    direction={{ xs: "column", lg: "row" }}
                    spacing={1.5}
                    alignItems={{ xs: "stretch", lg: "center" }}
                    justifyContent="space-between"
                    sx={{ px: 2, py: 1.5, backgroundColor: "#ffffff" }}
                >
                    <Typography sx={{ color: "#64748b", fontSize: 12, fontWeight: 900 }}>
                        {contextLabel}
                    </Typography>
                </Stack>
            ) : null}
            {rows.length === 0 ? (
                <ReportEmptyState text={emptyText} />
            ) : (
                <TableContainer sx={{ boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                {columns.map((column) => (
                                    <TableCell key={column.key} align={column.align || "left"}>
                                        <Stack
                                            direction="row"
                                            spacing={0.4}
                                            alignItems="center"
                                            justifyContent={column.align === "right" ? "flex-end" : "flex-start"}
                                        >
                                            <Box component="span">{column.label}</Box>
                                            {column.filterable !== false ? (
                                                <IconButton
                                                    size="small"
                                                    onClick={(event) => openColumnFilter(event, column.key)}
                                                    sx={{
                                                        width: 18,
                                                        height: 18,
                                                        color: columnFilters[column.key] ? "#0f4c81" : "#64748b",
                                                        "&:hover": { backgroundColor: "rgba(15, 76, 129, 0.08)" },
                                                    }}
                                                >
                                                    <FilterListOutlinedIcon sx={{ fontSize: 13 }} />
                                                </IconButton>
                                            ) : null}
                                        </Stack>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRows.map((row, index) => (
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
                    {filteredRows.length === 0 ? (
                        <ReportEmptyState text="No hay resultados para el filtro aplicado." />
                    ) : null}
                </TableContainer>
            )}
            <Popover
                open={Boolean(filterAnchor)}
                anchorEl={filterAnchor}
                onClose={closeColumnFilter}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                PaperProps={{
                    sx: {
                        width: 280,
                        p: 1.5,
                        borderRadius: "6px",
                        border: "1px solid #dbe3ee",
                        boxShadow: "0 14px 32px rgba(15, 23, 42, 0.18)",
                    },
                }}
            >
                <Stack spacing={1.4}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography sx={{ fontSize: 12, fontWeight: 900, color: "#0f172a" }}>
                            Filtrar: {activeColumnConfig?.label}
                        </Typography>
                        <IconButton size="small" onClick={closeColumnFilter} sx={{ width: 24, height: 24 }}>
                            <CloseOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Stack>
                    <TextField
                        size="small"
                        label={activeColumnConfig?.label}
                        value={columnFilters[activeColumn] || ""}
                        onChange={(event) => setColumnFilters((current) => ({
                            ...current,
                            [activeColumn]: event.target.value,
                        }))}
                        sx={filterInputSx}
                        autoFocus
                    />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Button
                            size="small"
                            startIcon={<FilterListOutlinedIcon />}
                            onClick={clearActiveFilter}
                            sx={{ color: "#64748b", fontWeight: 800, textTransform: "none" }}
                        >
                            Limpiar
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={closeColumnFilter}
                            sx={{
                                minWidth: 76,
                                backgroundColor: "#0f4c81",
                                color: "#ffffff",
                                "&:hover": { backgroundColor: "#0b3a63" },
                            }}
                        >
                            Aplicar
                        </Button>
                    </Stack>
                </Stack>
            </Popover>
        </Box>
    );
}

const reportConfigs = {
    asistencias: {
        title: "Reportes / Asistencias",
        subtitle: "Control por sede, membresía, clientes y registros con reserva.",
        metrics: (data) => [
            { label: "Asistencias", value: data.resumen.asistencias, helper: "Registros del periodo" },
            { label: "Con reserva", value: data.asistencia_por_sede.reduce((total, row) => total + Number(row.con_reserva || 0), 0), helper: "Check-in vinculado a reserva", tone: "success" },
            { label: "No asistieron", value: data.resumen.reservas_no_usadas, helper: "Reservas vencidas", tone: "danger" },
        ],
        tables: (data) => [
            {
                title: "Reporte de asistencias",
                rows: buildAsistenciaRows(data),
                emptyText: "Sin asistencias con los filtros actuales.",
                columns: [
                    { key: "categoria", label: "Categoría" },
                    { key: "detalle", label: "Detalle" },
                    { key: "total", label: "Asistencias", align: "right" },
                    { key: "clientes", label: "Clientes", align: "right" },
                    { key: "reservas", label: "Con reserva", align: "right" },
                ],
            },
        ],
    },
    membresias: {
        title: "Reportes / Membresías",
        subtitle: "Uso, asistencia e ingresos por cada plan de membresía.",
        metrics: (data) => [
            { label: "Ingresos", value: money(data.resumen.ingresos_membresias), helper: "Ventas de membresías", tone: "success" },
            { label: "Asistencias", value: data.resumen.asistencias, helper: "Uso de planes" },
            { label: "Planes con ventas", value: data.ingresos_por_membresia.length, helper: "Membresías movidas" },
        ],
        tables: (data) => [
            {
                title: "Ingresos por membresía",
                rows: data.ingresos_por_membresia,
                emptyText: "Sin ingresos por membresía.",
                columns: [
                    { key: "membresia_nombre", label: "Membresía" },
                    { key: "ventas", label: "Ventas", align: "right" },
                    { key: "ingresos", label: "Ingresos", align: "right", render: (row) => money(row.ingresos) },
                    { key: "ticket_promedio", label: "Ticket", align: "right", render: (row) => money(row.ticket_promedio) },
                ],
            },
            {
                title: "Asistencia por membresía",
                rows: data.asistencia_por_membresia,
                emptyText: "Sin asistencia por membresía.",
                columns: [
                    { key: "membresia_nombre", label: "Membresía" },
                    { key: "total", label: "Asistencias", align: "right" },
                    { key: "clientes", label: "Clientes", align: "right" },
                    { key: "con_reserva", label: "Reservas", align: "right" },
                ],
            },
        ],
    },
    reservas: {
        title: "Reportes / Reservas",
        subtitle: "Reservas usadas, canceladas y vencidas sin asistencia.",
        metrics: (data) => [
            { label: "Reservas", value: data.resumen.reservas_total, helper: "Total del periodo" },
            { label: "Usadas", value: data.resumen.reservas_usadas, helper: "Marcadas con check-in", tone: "success" },
            { label: "No usadas", value: data.resumen.reservas_no_usadas, helper: "Reservadas y vencidas", tone: "danger" },
        ],
        tables: (data) => [
            {
                title: "Reservas usadas vs no usadas",
                rows: data.reservas_uso,
                emptyText: "Sin reservas en el periodo.",
                columns: [
                    { key: "sede_nombre", label: "Sede" },
                    { key: "servicio_nombre", label: "Servicio" },
                    { key: "total", label: "Reservadas", align: "right" },
                    { key: "asistieron", label: "Asistieron", align: "right" },
                    { key: "no_asistieron", label: "No asistieron", align: "right" },
                    { key: "canceladas", label: "Canceladas", align: "right" },
                ],
            },
        ],
    },
    coaches: {
        title: "Reportes / Coaches",
        subtitle: "Carga de clientes, seguimiento personalizado y turnos asignados.",
        metrics: (data) => [
            { label: "Clientes", value: data.resumen.clientes_con_coach, helper: "Asignados a coach", tone: "success" },
            { label: "Coaches", value: data.clientes_por_coach.length, helper: "Con cartera activa" },
            { label: "Con turno", value: data.clientes_por_coach.reduce((total, row) => total + Number(row.con_turno || 0), 0), helper: "Asignaciones con horario" },
        ],
        tables: (data) => [
            {
                title: "Clientes por coach",
                rows: data.clientes_por_coach,
                emptyText: "Sin clientes asignados a coach.",
                columns: [
                    { key: "coach_nombre", label: "Coach" },
                    { key: "sede_nombre", label: "Sede" },
                    { key: "clientes", label: "Clientes", align: "right" },
                    { key: "personalizados", label: "Personalizados", align: "right" },
                    { key: "con_turno", label: "Con turno", align: "right" },
                ],
            },
        ],
    },
    ventas: {
        title: "Reportes / Ventas",
        subtitle: "Ingresos por membresía, ticket promedio y movimiento de planes.",
        metrics: (data) => [
            { label: "Ingresos", value: money(data.resumen.ingresos_membresias), helper: "Membresías vendidas", tone: "success" },
            { label: "Ventas", value: data.ingresos_por_membresia.reduce((total, row) => total + Number(row.ventas || 0), 0), helper: "Transacciones" },
            { label: "Ticket prom.", value: money(data.ingresos_por_membresia.reduce((total, row) => total + Number(row.ticket_promedio || 0), 0) / Math.max(data.ingresos_por_membresia.length, 1)), helper: "Promedio por plan" },
        ],
        tables: (data) => [
            {
                title: "Ingresos por membresía",
                rows: data.ingresos_por_membresia,
                emptyText: "Sin ingresos por membresía.",
                columns: [
                    { key: "membresia_nombre", label: "Membresía" },
                    { key: "ventas", label: "Ventas", align: "right" },
                    { key: "ingresos", label: "Ingresos", align: "right", render: (row) => money(row.ingresos) },
                    { key: "ticket_promedio", label: "Ticket", align: "right", render: (row) => money(row.ticket_promedio) },
                ],
            },
        ],
    },
    auditoria: {
        title: "Reportes / Auditoría",
        subtitle: "Eventos por usuario, rol, acción, módulo y fecha.",
        metrics: (data) => [
            { label: "Auditorías", value: data.resumen.auditorias, helper: "Eventos del periodo" },
            { label: "Usuarios", value: data.auditoria.por_usuario.length, helper: "Con actividad" },
            { label: "Módulos", value: data.auditoria.por_modulo.length, helper: "Impactados" },
        ],
        tables: (data) => [
            {
                title: "Auditoría por usuario",
                rows: data.auditoria.por_usuario,
                emptyText: "Sin auditoría por usuario.",
                columns: [
                    { key: "clave", label: "Usuario" },
                    { key: "cedula", label: "Cédula" },
                    { key: "total", label: "Acciones", align: "right" },
                ],
            },
            {
                title: "Auditoría por rol",
                rows: data.auditoria.por_rol,
                emptyText: "Sin auditoría por rol.",
                columns: [
                    { key: "clave", label: "Rol" },
                    { key: "total", label: "Eventos", align: "right" },
                ],
            },
            {
                title: "Auditoría por acción y módulo",
                rows: [...data.auditoria.por_accion, ...data.auditoria.por_modulo, ...data.auditoria.por_fecha],
                emptyText: "Sin auditoría por acción o módulo.",
                columns: [
                    { key: "clave", label: "Acción / Módulo / Fecha" },
                    { key: "total", label: "Eventos", align: "right" },
                ],
            },
        ],
    },
    logs: {
        title: "Reportes / Logs Técnicos",
        subtitle: "Errores, rutas, severidad y usuarios relacionados.",
        metrics: (data) => [
            { label: "Errores", value: data.resumen.errores_tecnicos, helper: "Excepciones agrupadas", tone: "danger" },
            { label: "Severidades", value: data.logs.por_severidad.length, helper: "Niveles registrados" },
            { label: "Rutas", value: data.logs.por_ruta.length, helper: "Con actividad técnica" },
        ],
        tables: (data) => [
            {
                title: "Logs por severidad",
                rows: data.logs.por_severidad,
                emptyText: "Sin logs por severidad.",
                columns: [
                    { key: "clave", label: "Severidad" },
                    { key: "total", label: "Eventos", align: "right" },
                ],
            },
            {
                title: "Logs por ruta y usuario",
                rows: [...data.logs.por_ruta, ...data.logs.por_usuario],
                emptyText: "Sin logs por ruta o usuario.",
                columns: [
                    { key: "clave", label: "Ruta / Usuario" },
                    { key: "cedula", label: "Cédula" },
                    { key: "total", label: "Eventos", align: "right" },
                ],
            },
            {
                title: "Errores técnicos",
                rows: data.logs.por_error,
                emptyText: "Sin errores técnicos.",
                columns: [
                    { key: "clave", label: "Error" },
                    { key: "detalle", label: "Detalle" },
                    { key: "total", label: "Total", align: "right" },
                ],
            },
        ],
    },
};

export default function ReportesOperativos({ tipo }) {
    const config = reportConfigs[tipo] || reportConfigs.asistencias;
    const [filters, setFilters] = useState({
        buscar: "",
        sede_id: "",
        fecha_desde: thirtyDaysAgo,
        fecha_hasta: today,
        limit: 12,
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
                Swal.fire("Error", getApiErrorMessage(error, `No se pudo cargar ${config.title}.`), "error");
            });

        return () => {
            active = false;
        };
    }, [config.title, params]);

    const tables = config.tables(data);
    const hasResults = tables.some((table) => table.rows.length > 0);
    const sedes = data.filtros.sedes || [];
    const selectedSede = sedes.find((sede) => String(sede.id) === String(filters.sede_id)) || null;
    const contextLabel = `${selectedSede?.nombre || "Todas las sedes"} · ${filters.fecha_desde} al ${filters.fecha_hasta}`;
    const filterControls = (
        <Stack spacing={1.2}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "minmax(260px, 1fr) minmax(220px, 0.65fr) minmax(145px, 0.42fr) minmax(145px, 0.42fr)",
                    },
                    gap: 1,
                    alignItems: "center",
                }}
            >
                <TextField
                    size="small"
                    placeholder="Buscar cédula, cliente, sede, módulo..."
                    value={filters.buscar}
                    onChange={(e) => setFilters((current) => ({ ...current, buscar: e.target.value }))}
                    sx={filterInputSx}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <Autocomplete
                    size="small"
                    options={sedes}
                    value={selectedSede}
                    onChange={(_, value) => setFilters((current) => ({ ...current, sede_id: value?.id || "" }))}
                    getOptionLabel={(option) => option?.nombre || ""}
                    isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                    clearText="Limpiar"
                    noOptionsText="Sin sedes"
                    renderInput={(paramsAutocomplete) => (
                        <TextField
                            {...paramsAutocomplete}
                            label="Sede"
                            placeholder="Escribir para seleccionar..."
                            sx={filterInputSx}
                        />
                    )}
                />
                <TextField
                    type="date"
                    size="small"
                    label="Desde"
                    value={filters.fecha_desde}
                    onChange={(e) => setFilters((current) => ({ ...current, fecha_desde: e.target.value }))}
                    sx={filterInputSx}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    type="date"
                    size="small"
                    label="Hasta"
                    value={filters.fecha_hasta}
                    onChange={(e) => setFilters((current) => ({ ...current, fecha_hasta: e.target.value }))}
                    sx={filterInputSx}
                    InputLabelProps={{ shrink: true }}
                />
            </Box>
            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                <Chip
                    label="Todas"
                    onClick={() => setFilters((current) => ({ ...current, sede_id: "" }))}
                    sx={{
                        height: 26,
                        borderRadius: "6px",
                        fontWeight: 900,
                        color: filters.sede_id ? "#111827" : "#ffffff",
                        backgroundColor: filters.sede_id ? "#e5e7eb" : "#f97316",
                        "&:hover": { backgroundColor: filters.sede_id ? "#d1d5db" : "#ea580c" },
                    }}
                />
                {sedes.map((sede) => {
                    const active = String(filters.sede_id) === String(sede.id);
                    return (
                        <Chip
                            key={sede.id}
                            label={sede.nombre}
                            onClick={() => setFilters((current) => ({ ...current, sede_id: sede.id }))}
                            sx={{
                                height: 26,
                                borderRadius: "6px",
                                fontWeight: 900,
                                color: active ? "#ffffff" : "#111827",
                                backgroundColor: active ? "#f97316" : "#e5e7eb",
                                "&:hover": { backgroundColor: active ? "#ea580c" : "#d1d5db" },
                            }}
                        />
                    );
                })}
            </Stack>
        </Stack>
    );
    const filterPanel = (
        <Box
            sx={{
                px: 2,
                py: 1.7,
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
            }}
        >
            {filterControls}
        </Box>
    );

    return (
        <Stack spacing={2}>
            <Paper elevation={0} sx={reportTitleCardSx}>
                <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "center" }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <SummarizeOutlinedIcon sx={{ color: "#0f172a" }} />
                        <Box>
                            <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>{config.title}</Typography>
                            <Typography sx={{ mt: 0.4, color: "#64748b", fontSize: 13 }}>{config.subtitle}</Typography>
                        </Box>
                    </Stack>
                    <Chip label={`${data.filtros.fecha_desde} al ${data.filtros.fecha_hasta}`} sx={semanticChipSx("mustard")} />
                </Stack>
            </Paper>

            <Paper elevation={0} sx={reportBodyCardSx}>
                {filterPanel}
                <Stack spacing={2} sx={reportResultsSx}>
                    {hasResults ? tables.map((table, index) => (
                        <ReportTable
                            key={table.title}
                            {...table}
                            metrics={index === 0 ? config.metrics(data) : []}
                            contextLabel={index === 0 ? contextLabel : ""}
                        />
                    )) : (
                        <ReportTable
                            title={config.title}
                            rows={[]}
                            columns={tables[0]?.columns || []}
                            emptyText="Los resultados aparecerán en esta sección."
                            metrics={config.metrics(data)}
                            contextLabel={contextLabel}
                        />
                    )}
                </Stack>
            </Paper>
        </Stack>
    );
}
