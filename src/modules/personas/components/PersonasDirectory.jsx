import { useState } from "react";
import {
    Avatar,
    Box,
    Chip,
    FormControl,
    IconButton,
    InputAdornment,
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
    TablePagination,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Swal from "sweetalert2";

import PremiumButton from "../../../components/ui/PremiumButton";
import { filterInputSx, semanticIconButtonSx, semanticChipSx, tableSx } from "../../../Styles/muiTheme";
import { pagePaperSx } from "../personas.utils";
import { normalizeAssetUrl } from "../../../services/apiClient";

export default function PersonasDirectory({
    personas,
    loading,
    filtroBuscar,
    filtroTipo,
    filtroEstadoMembresia,
    filtroSede,
    onFiltroBuscarChange,
    onFiltroTipoChange,
    onFiltroEstadoMembresiaChange,
    onFiltroSedeChange,
    onCreate,
    onSelectPersona,
    onEditPersona,
}) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const paginatedPersonas = personas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Paper
            elevation={0}
            sx={{
                ...pagePaperSx,
                bgcolor: "var(--tg-card-bg)",
                borderRadius: "var(--tg-radius)",
                border: "1px solid var(--tg-card-border)",
                overflow: "hidden",
            }}
        >
            <Box sx={{ px: 4, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
                    <TextField
                        size="small"
                        placeholder="Buscar por cédula o nombre..."
                        value={filtroBuscar}
                        onChange={(e) => onFiltroBuscarChange(e.target.value)}
                        sx={{ ...filterInputSx, width: 280 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                </InputAdornment>
                            ),
                        }}
                    />



                    <FormControl size="small" sx={{ ...filterInputSx, width: 170 }}>
                        <Select
                            value={filtroEstadoMembresia}
                            onChange={(e) => onFiltroEstadoMembresiaChange(e.target.value)}
                            displayEmpty
                            sx={{ fontSize: "13px" }}
                        >
                            <MenuItem value="">Todos los Planes</MenuItem>
                            <MenuItem value="ACTIVO">Plan Activo</MenuItem>
                            <MenuItem value="POR_VENCER">Por Vencer (7 días)</MenuItem>
                            <MenuItem value="VENCIDO">Plan Vencido</MenuItem>
                            <MenuItem value="SIN_MEMBRESIA">Sin Membresía</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <PremiumButton variant="anadir" onClick={onCreate}>
                    Añadir
                </PremiumButton>
            </Box>

            <Box sx={{ px: 4, pb: 4 }}>
                <TableContainer
                    component={Paper}
                    sx={{
                        overflowX: "auto",
                        maxHeight: "calc(100vh - 380px)",
                        minHeight: 320,
                        bgcolor: "var(--tg-card-bg)",
                        borderRadius: "var(--tg-radius-sm)",
                        border: "1px solid var(--tg-card-border)",
                        boxShadow: "none",
                    }}
                >
                    <Table stickyHeader size="small" sx={{ ...tableSx, minWidth: 650 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell width={48}></TableCell>
                                <TableCell>Identificación</TableCell>
                                <TableCell>Nombres y Apellidos</TableCell>
                                <TableCell>Plan / Membresía</TableCell>
                                <TableCell>Contacto</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                        Cargando listado...
                                    </TableCell>
                                </TableRow>
                            ) : personas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: "#64748b" }}>
                                        No se encontraron personas registradas en el gimnasio.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedPersonas.map((persona) => (
                                    <TableRow key={persona.id}>
                                        <TableCell>
                                            <Avatar 
                                                src={normalizeAssetUrl(persona.foto_url || "")} 
                                                alt={persona.nombres}
                                                onClick={() => {
                                                    if (persona.foto_url) {
                                                        Swal.fire({
                                                            imageUrl: normalizeAssetUrl(persona.foto_url),
                                                            imageAlt: persona.nombres,
                                                            showConfirmButton: false,
                                                            showCloseButton: true,
                                                            width: 'auto',
                                                            background: 'transparent',
                                                            backdrop: 'rgba(0,0,0,0.85)'
                                                        });
                                                    }
                                                }}
                                                sx={{ 
                                                    width: 44, 
                                                    height: 44, 
                                                    bgcolor: "var(--tg-primary-main)", 
                                                    color: "#000", 
                                                    fontWeight: 'bold',
                                                    cursor: persona.foto_url ? "pointer" : "default",
                                                    transition: "transform 0.2s",
                                                    "&:hover": persona.foto_url ? { transform: "scale(1.05)" } : {},
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                                                }}
                                            >
                                                {persona.nombres?.charAt(0)?.toUpperCase()}
                                            </Avatar>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 800 }}>{persona.cedula}</TableCell>
                                        <TableCell>
                                            <div style={{ fontWeight: 600, color: "#0f172a" }}>
                                                {persona.nombres} {persona.apellidos || ""}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {persona.es_socio ? (
                                                <Stack spacing={0.5}>
                                                    <span style={{ fontWeight: 600, fontSize: "12px", color: "#334155" }}>
                                                        {persona.codigo_socio || "Sin Código"}
                                                    </span>
                                                    <Chip
                                                        size="small"
                                                        label={
                                                            persona.estado_membresia === "POR_VENCER" 
                                                                ? "Por Vencer" 
                                                                : persona.estado_membresia === "VENCIDO"
                                                                    ? "Vencido"
                                                                    : persona.estado_membresia === "ACTIVO"
                                                                        ? "Activo"
                                                                        : "Inactivo"
                                                        }
                                                        sx={semanticChipSx(
                                                            persona.estado_membresia === "POR_VENCER" 
                                                                ? "mustard" 
                                                                : persona.estado_membresia === "ACTIVO"
                                                                    ? "success"
                                                                    : "neutral"
                                                        )}
                                                    />
                                                </Stack>
                                            ) : (
                                                <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div style={{ fontWeight: 600 }}>{persona.telefono || "Sin teléfono"}</div>
                                            <div style={{ color: "#64748b", fontSize: 11 }}>{persona.email || ""}</div>
                                            {!persona.es_socio && (
                                                <Box mt={0.5}>
                                                    <Chip
                                                        size="small"
                                                        label={persona.estado}
                                                        sx={{ ...semanticChipSx(persona.estado_codigo === "ACTIVO" ? "success" : "danger"), transform: 'scale(0.85)', transformOrigin: 'left center' }}
                                                    />
                                                </Box>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                <IconButton
                                                    onClick={() => onSelectPersona(persona.id)}
                                                    sx={semanticIconButtonSx("inventory")}
                                                    title="Ver Ficha / Perfil"
                                                >
                                                    <VisibilityIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => onEditPersona(persona)}
                                                    sx={semanticIconButtonSx("mustard")}
                                                    title="Editar"
                                                >
                                                    <EditIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                
                <TablePagination
                    component="div"
                    count={personas.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    labelRowsPerPage="Filas por página:"
                    labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`}
                />
            </Box>
        </Paper>
    );
}
