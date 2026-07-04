import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    CircularProgress,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Paper,
} from "@mui/material";

import MenuBookIcon from "@mui/icons-material/MenuBook";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import EditIcon from "@mui/icons-material/Edit";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

import ModalHorariosGym from "./components/ModalHorariosGym";
import { getHorario, listHorarios } from "../../modules/horarios/api";
import PremiumButton from "../../components/ui/PremiumButton";
import { filterInputSx, semanticChipSx, semanticIconButtonSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../../modules/personas/personas.utils";

const DIA_LABEL = {
    1: "Lun",
    2: "Mar",
    3: "Mié",
    4: "Jue",
    5: "Vie",
    6: "Sáb",
    7: "Dom",
};

const DIA_FULL = {
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
    7: "Domingo",
};

const parseDias = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map((n) => Number(n)).filter((n) => Number.isFinite(n));
    if (typeof raw === "string") {
        const s = raw.trim();
        try {
            const j = JSON.parse(s);
            if (Array.isArray(j)) return j.map((n) => Number(n)).filter((n) => Number.isFinite(n));
        } catch {
            return s
                .replace(/[\[\]\s]/g, "")
                .split(",")
                .map((x) => Number(x))
                .filter((n) => Number.isFinite(n));
        }
    }
    return [];
};

const formatDias = (rawDias) => {
    const dias = parseDias(rawDias);
    if (!Array.isArray(dias) || dias.length === 0) return "—";
    return dias
        .slice()
        .sort((a, b) => a - b)
        .map((n) => DIA_LABEL[n] || String(n))
        .join(", ");
};

export default function Horarios({ usr_id }) {
    const [search, setSearch] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState(
        parseInt(localStorage.getItem("rowsPerPageHorarios") || "10", 10)
    );
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [totalRows, setTotalRows] = useState(0);

    const [openModal, setOpenModal] = useState(false);
    const [selectedHorario, setSelectedHorario] = useState(null);
    const [loadingEdit, setLoadingEdit] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const arr = await listHorarios();
            setData(arr);
        } catch (e) {
            setData([]);
            Swal.fire("Error", "Hubo un problema al consultar horarios.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const lower = search.trim().toLowerCase();
        const f = (data || []).filter((x) => {
            if (!lower) return true;

            const id = x?.horario_id ?? x?.id ?? "";
            const diasRaw = x?.dias ?? x?.dias_laborables ?? [];
            const t = `${id} ${x.tipo_usuario_nombre || ""} ${x.categoria_nombre || ""} ${x.tipo_servicio_nombre || ""
                } ${(x.activo ? "ACTIVO" : "INACTIVO") || ""} ${formatDias(diasRaw)}`.toLowerCase();

            return t.includes(lower);
        });

        setFiltered(f);
        setTotalRows(f.length);
        setPage(1);
    }, [search, data]);

    const paginated = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        return (filtered || []).slice(start, start + rowsPerPage);
    }, [filtered, page, rowsPerPage]);

    const handleRowsPerPageChange = (e) => {
        const v = parseInt(e.target.value, 10);
        setRowsPerPage(v);
        localStorage.setItem("rowsPerPageHorarios", String(v));
        setPage(1);
    };

    const openCreate = () => {
        setSelectedHorario(null);
        setOpenModal(true);
    };

    const closeModal = () => {
        setOpenModal(false);
        setSelectedHorario(null);
        fetchData();
    };

    const showDiasSwal = (d) => {
        const id = d?.horario_id ?? d?.id ?? "—";
        const diasRaw = d?.dias ?? d?.dias_laborables ?? [];
        const dias = parseDias(diasRaw).slice().sort((a, b) => a - b);
        const nombres = dias.map((n) => DIA_FULL[n] || `Día ${n}`);

        const html = `
      <div style="text-align:left">
        <div><b>Horario:</b> #${id}</div>
        <div><b>Servicio:</b> ${d?.tipo_servicio_nombre || "—"}</div>
        <div><b>Categoría:</b> ${d?.categoria_nombre || "—"}</div>
        <div><b>Rango:</b> ${d?.hora_apertura || "—"} - ${d?.hora_cierre || "—"}</div>
        <hr style="margin:10px 0"/>
        <div><b>Días laborables:</b></div>
        ${nombres.length
                ? `<ul style="margin:8px 0 0 18px;">${nombres.map((x) => `<li>${x}</li>`).join("")}</ul>`
                : `<div style="margin-top:6px;">—</div>`
            }
      </div>
    `;

        Swal.fire({
            title: "Días del horario",
            html,
            icon: "info",
            confirmButtonText: "Cerrar",
        });
    };

    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(
            (data || []).map((d) => {
                const id = d?.horario_id ?? d?.id ?? "";
                const diasRaw = d?.dias ?? d?.dias_laborables ?? [];
                return {
                    ID: id,
                    Tipo: d.tipo_usuario_nombre || d.tipo_usuario,
                    "Hora Apertura": d.hora_apertura,
                    "Hora Cierre": d.hora_cierre,
                    Categoria: d.categoria_descripcion || d.categoria_nombre,
                    Servicio: d.tipo_servicio_nombre,
                    "Capacidad Max.": d.capacidad_maxima,
                    "Tiempo Turno (min)": d.tiempo_turno_min,
                    Días: formatDias(diasRaw),
                    Estado: d.activo ? "ACTIVO" : "INACTIVO",
                    Creado: d.created_at,
                    Actualizado: d.updated_at,
                };
            })
        );

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Horarios");
        XLSX.writeFile(wb, `Horarios_${Date.now()}.xlsx`);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Reporte de Horarios", 14, 18);
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 24);

        const head = [
            [
                "Id",
                "Tipo",
                "Apertura",
                "Cierre",
                "Categoria",
                "Servicio",
                "Capacidad",
                "Tiempo (min)",
                "Días",
                "Estado",
            ],
        ];

        const body = (data || []).map((d) => {
            const id = d?.horario_id ?? d?.id ?? "";
            const diasRaw = d?.dias ?? d?.dias_laborables ?? [];
            return [
                id,
                d.tipo_usuario_nombre || d.tipo_usuario,
                d.hora_apertura,
                d.hora_cierre,
                d.categoria_nombre,
                d.tipo_servicio_nombre,
                d.capacidad_maxima,
                d.tiempo_turno_min,
                formatDias(diasRaw),
                d.activo ? "ACTIVO" : "INACTIVO",
            ];
        });

        autoTable(doc, { head, body, startY: 30 });
        doc.save(`Horarios_${Date.now()}.pdf`);
    };

    const handleFetchHorarioId = async (id) => {
        setLoadingEdit(id);
        try {
            const payload = await getHorario(id);
            if (!payload) {
                Swal.fire("Aviso", "No se encontró el horario solicitado.", "warning");
                return;
            }
            setSelectedHorario(payload);
            setOpenModal(true);
        } catch (e) {
            Swal.fire("Error", "Ocurrió un error al consultar el horario.", "error");
        } finally {
            setLoadingEdit(null);
        }
    };

    return (
        <Box sx={{ display: "grid", gap: 2 }}>
            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                    <Stack direction="row" alignItems="center" spacing={1.2}>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: "rgba(242,177,0,0.14)",
                                border: "1px solid rgba(242,177,0,0.22)",
                                color: "var(--tg-text-dark)",
                            }}
                        >
                            <MenuBookIcon />
                        </Box>

                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900 }}>
                                Horarios
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Configuración de horarios para reservas
                            </Typography>
                        </Box>
                    </Stack>

                    <Chip label={`${totalRows} RESULTADOS`} sx={semanticChipSx("mustard")} />
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                        <TextField
                            size="small"
                            label="Buscar"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            sx={{ ...filterInputSx, maxWidth: 320 }}
                        />

                        <FormControl size="small" sx={{ ...filterInputSx, width: 140 }}>
                            <InputLabel>Mostrar</InputLabel>
                            <Select label="Mostrar" value={rowsPerPage} onChange={handleRowsPerPageChange}>
                                {[5, 10, 25, 50].map((n) => (
                                    <MenuItem key={n} value={n}>
                                        {n}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Box sx={{ flex: 1 }} />

                        <Stack direction="row" spacing={1}>
                            <PremiumButton variant="excel" onClick={handleExportExcel}>
                                Excel
                            </PremiumButton>
                            <PremiumButton variant="pdf" onClick={handleExportPDF}>
                                PDF
                            </PremiumButton>
                            <PremiumButton variant="anadir" onClick={openCreate}>
                                Añadir
                            </PremiumButton>
                        </Stack>
                    </Stack>

                    <Box sx={{ mt: 2 }}>
                        <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                            <Table size="small" sx={tableSx}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center">Id</TableCell>
                                        <TableCell align="center">Tipo</TableCell>
                                        <TableCell align="center">Apertura</TableCell>
                                        <TableCell align="center">Cierre</TableCell>
                                        <TableCell align="center">Categoría</TableCell>
                                        <TableCell align="center">Servicio</TableCell>
                                        <TableCell align="center">Capacidad</TableCell>
                                        <TableCell align="center">Tiempo</TableCell>
                                        <TableCell align="center">Días</TableCell>
                                        <TableCell align="center">Estado</TableCell>
                                        <TableCell align="center">Acciones</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={11} align="center">
                                                <CircularProgress />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginated.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={11} align="center">
                                                No se encontraron registros.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginated.map((d) => {
                                            const id = d?.horario_id ?? d?.id;
                                            const diasRaw = d?.dias ?? d?.dias_laborables ?? [];
                                            return (
                                                <TableRow key={id} hover>
                                                    <TableCell align="center">{id}</TableCell>
                                                    <TableCell align="center">{d.tipo_usuario_nombre || d.tipo_usuario}</TableCell>
                                                    <TableCell align="center">{d.hora_apertura}</TableCell>
                                                    <TableCell align="center">{d.hora_cierre}</TableCell>
                                                    <TableCell align="center">{d.categoria_nombre}</TableCell>
                                                    <TableCell align="center">{d.tipo_servicio_nombre}</TableCell>
                                                    <TableCell align="center">{d.capacidad_maxima}</TableCell>
                                                    <TableCell align="center">{d.tiempo_turno_min}</TableCell>

                                                    <TableCell align="center">
                                                        <PremiumButton
                                                            variant="outline"
                                                            onClick={() => showDiasSwal(d)}
                                                            sx={{ height: 30, px: 1.5 }}
                                                        >
                                                            {formatDias(diasRaw)}
                                                        </PremiumButton>
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <Chip
                                                            size="small"
                                                            label={d.activo ? "ACTIVO" : "INACTIVO"}
                                                            sx={semanticChipSx(d.activo ? "success" : "danger")}
                                                        />
                                                    </TableCell>

                                                    <TableCell align="center">
                                                        <Tooltip title="Editar">
                                                            <span>
                                                                <IconButton
                                                                    onClick={() => handleFetchHorarioId(id)}
                                                                    disabled={loadingEdit === id}
                                                                    sx={semanticIconButtonSx("mustard")}
                                                                >
                                                                    {loadingEdit === id ? (
                                                                        <CircularProgress size={18} />
                                                                    ) : (
                                                                        <EditIcon fontSize="small" />
                                                                    )}
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Pagination
                            count={Math.max(1, Math.ceil(totalRows / rowsPerPage))}
                            page={page}
                            onChange={(e, v) => setPage(v)}
                            sx={{ mt: 2, display: "flex", justifyContent: "center" }}
                        />
                    </Box>
            </Paper>

            {openModal ? (
                <ModalHorariosGym
                    open={openModal}
                    onClose={closeModal}
                    usr_id={usr_id}
                    dataEdit={selectedHorario}
                />
            ) : null}
        </Box>
    );
}
