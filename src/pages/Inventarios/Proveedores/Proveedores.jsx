import React, { useState, useEffect, useMemo } from "react";
import {
    Box,
    Paper,
    Typography,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Pagination,
    InputAdornment,
    OutlinedInput,
    Fade,
    IconButton,
    Tooltip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Swal from "sweetalert2";

import PageHeader from "../../../components/ui/PageHeader";
import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient } from "../../../services/apiClient";
import {
    tgAccent,
    tgSemantic,
    tableSx,
    semanticIconButtonSx,
    semanticChipSx,
    filterInputSx,
} from "../../../Styles/muiTheme";
import ModalProveedorInventario from "./components/ModalProveedorInventario";

const ui = {
    black: "#0f172a",
    bg: "#f8fafc",
    border: "#e2e8f0",
    text: "#0f172a",
    muted: "#64748b",
    danger: tgSemantic.danger.color,
    success: tgSemantic.success.color,
    mustard: tgAccent.mustard,
};
const globalInputSx = filterInputSx;

export default function ProveedoresInventario() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [dataEdit, setDataEdit] = useState(null);

    // Filters and Pagination
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const fetchProveedores = async () => {
        setLoading(true);
        try {
            const { data: resData } = await apiClient.get("/inventario/proveedores");
            setData(Array.isArray(resData) ? resData : []);
        } catch (error) {
            Swal.fire({
                title: "Error",
                text: "No se pudo cargar la lista de proveedores.",
                icon: "error",
                confirmButtonColor: ui.black,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProveedores();
    }, []);

    // Handlers
    const handleAdd = () => {
        setDataEdit(null);
        setModalOpen(true);
    };

    const handleEdit = (prov) => {
        setDataEdit(prov);
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "¿Desactivar proveedor?",
            text: "No se borrará el historial, pero ya no podrás elegirlo en nuevos ingresos.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: ui.danger,
            cancelButtonColor: ui.muted,
            confirmButtonText: "Sí, desactivar",
            cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/inventario/proveedores/${id}`);
                Swal.fire({
                    title: "Desactivado",
                    text: "Proveedor desactivado correctamente.",
                    icon: "success",
                    confirmButtonColor: ui.success,
                });
                fetchProveedores();
            } catch (error) {
                Swal.fire({
                    title: "Error",
                    text: "Hubo un problema al desactivar.",
                    icon: "error",
                    confirmButtonColor: ui.black,
                });
            }
        }
    };

    // Filter Logic
    const filteredData = useMemo(() => {
        return data.filter((prov) => {
            const term = search.toLowerCase();
            return (
                (prov.nombre || "").toLowerCase().includes(term) ||
                (prov.ruc || "").toLowerCase().includes(term)
            );
        });
    }, [data, search]);

    // Pagination Logic
    const pageCount = Math.ceil(filteredData.length / itemsPerPage);
    const currentData = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, page]);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", p: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: 1600, mx: "auto" }}>
                <Fade in timeout={400}>
                    <Stack spacing={3}>
                        <PageHeader
                            title="Proveedores"
                            rightContent={
                                <Box
                                    sx={{
                                        px: 2,
                                        py: 0.8,
                                        borderRadius: "6px",
                                        bgcolor: "rgba(15, 23, 42, 0.05)",
                                        color: "#0f172a",
                                        fontSize: "11px",
                                        fontWeight: 900,
                                    }}
                                >
                                    {filteredData.length} REGISTROS
                                </Box>
                            }
                        />

                        <Paper elevation={0} sx={{ borderRadius: "8px", border: `1px solid ${ui.border}`, overflow: "hidden", bgcolor: "#fff" }}>
                            {/* Toolbar */}
                            <Box
                                sx={{
                                    px: 4,
                                    py: 2.5,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 2,
                                }}
                            >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <OutlinedInput
                            size="small"
                            placeholder="Buscar proveedor o RUC..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            sx={{ ...globalInputSx, width: 280 }}
                            startAdornment={
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: ui.muted, fontSize: 20 }} />
                                </InputAdornment>
                            }
                        />
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        <PremiumButton variant="anadir" onClick={handleAdd}>
                            Añadir
                        </PremiumButton>
                    </Stack>
                </Box>

                {/* Tabla */}
                <TableContainer>
                    <Table sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>RUC</TableCell>
                                <TableCell>NOMBRE</TableCell>
                                <TableCell>TELÉFONO</TableCell>
                                <TableCell>CORREO</TableCell>
                                <TableCell align="center">ESTADO</TableCell>
                                <TableCell align="center">ACCIONES</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography sx={{ color: ui.muted, fontSize: "13px" }}>
                                            Cargando proveedores...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : currentData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                        <Typography sx={{ color: ui.muted, fontSize: "13px" }}>
                                            No se encontraron proveedores.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentData.map((prov) => (
                                    <TableRow key={prov.id}>
                                        <TableCell>
                                            <Typography sx={{ fontSize: "13px", color: ui.text, fontWeight: 500 }}>
                                                {prov.ruc || "-"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontSize: "13px", color: ui.black, fontWeight: 600 }}>
                                                {prov.nombre}
                                            </Typography>
                                            {prov.direccion && (
                                                <Typography sx={{ fontSize: "11px", color: ui.muted, mt: 0.5 }}>
                                                    {prov.direccion}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontSize: "13px", color: ui.text }}>
                                                {prov.telefono || "-"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography sx={{ fontSize: "13px", color: ui.text }}>
                                                {prov.correo || "-"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box
                                                sx={
                                                    prov.estado === 1
                                                        ? semanticChipSx("success")
                                                        : semanticChipSx("danger")
                                                }
                                            >
                                                {prov.estado === 1 ? "Activo" : "Inactivo"}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={0.8} justifyContent="center">
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEdit(prov)}
                                                        sx={semanticIconButtonSx("mustard")}
                                                    >
                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                {prov.estado === 1 && (
                                                    <Tooltip title="Eliminar">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDelete(prov.id)}
                                                            sx={semanticIconButtonSx("danger")}
                                                        >
                                                            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {pageCount > 1 && (
                    <Box
                        sx={{
                            p: 2,
                            display: "flex",
                            justifyContent: "flex-end",
                            borderTop: `1px solid ${ui.border}`,
                            bgcolor: "#fff",
                        }}
                    >
                        <Pagination
                            count={pageCount}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                            size="small"
                        />
                    </Box>
                )}
            </Paper>

            {/* Modal Crear/Editar */}
            <ModalProveedorInventario
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                dataEdit={dataEdit}
                onSubmit={fetchProveedores}
            />
                    </Stack>
                </Fade>
            </Box>
        </Box>
    );
}
