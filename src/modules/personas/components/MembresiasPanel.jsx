import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CardMembershipIcon from "@mui/icons-material/CardMembership";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import Swal from "sweetalert2";

import PremiumButton from "../../../components/ui/PremiumButton";
import { apiClient, getApiErrorMessage } from "../../../services/apiClient";
import { semanticChipSx, semanticIconButtonSx, tableSx } from "../../../Styles/muiTheme";
import { pagePaperSx } from "../personas.utils";
import ModalMembresiaPlan from "./ModalMembresiaPlan";
import ModalPreciosMembresia from "./ModalPreciosMembresia";

const money = (value) =>
    new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));

export default function MembresiasPanel() {
    const [catalogo, setCatalogo] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [planModalOpen, setPlanModalOpen] = useState(false);
    const [planEdit, setPlanEdit] = useState(null);
    const [preciosModalOpen, setPreciosModalOpen] = useState(false);
    const [planPrecios, setPlanPrecios] = useState(null);

    const fetchData = async () => {
        try {
            const [catalogoResult, sedesResult] = await Promise.allSettled([
                apiClient.get("/gimnasio/membresias"),
                apiClient.get("/inventario/sedes"),
            ]);

            if (catalogoResult.status === "rejected") {
                throw catalogoResult.reason;
            }

            let sedesData = sedesResult.status === "fulfilled" && Array.isArray(sedesResult.value.data)
                ? sedesResult.value.data
                : [];

            if (!sedesData.length) {
                const catalogosRes = await apiClient.get("/gimnasio/seguridad/usuarios/catalogos");
                sedesData = Array.isArray(catalogosRes.data?.sedes) ? catalogosRes.data.sedes : [];
            }

            setCatalogo(catalogoResult.value.data || []);
            setSedes(sedesData);
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cargar el catálogo de membresías."), "error");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSavePlan = async (payload) => {
        try {
            if (planEdit?.id) {
                await apiClient.put(`/gimnasio/membresias/${planEdit.id}`, payload);
            } else {
                await apiClient.post("/gimnasio/membresias", payload);
            }

            setPlanModalOpen(false);
            setPlanEdit(null);
            await fetchData();
            Swal.fire("Éxito", "Plan de membresía guardado correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar el plan de membresía."), "error");
        }
    };

    return (
        <Stack spacing={3}>
            <Paper
                elevation={0}
                sx={{
                    ...pagePaperSx,
                    p: 3,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    flexWrap: "wrap",
                    alignItems: "center",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CardMembershipIcon sx={{ color: "#0f172a" }} />
                    <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>
                            Planes de Membresía
                        </Typography>
                        <Typography sx={{ mt: 0.5, color: "#64748b", fontSize: 13 }}>
                            Configura los precios, nombres y duraciones de los planes que ofrece el gimnasio.
                        </Typography>
                    </Box>
                </Box>

                <Chip label={`${catalogo.length} REGISTROS`} sx={{ fontWeight: 900, bgcolor: "#f1f5f9", color: "#64748b" }} />
            </Paper>

            <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, mb: 2 }}>
                    <PremiumButton variant="anadir" onClick={() => { setPlanEdit(null); setPlanModalOpen(true); }}>
                        Añadir
                    </PremiumButton>
                </Box>

                <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
                    <Table size="small" sx={tableSx}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Plan</TableCell>
                                <TableCell>Duración</TableCell>
                                <TableCell>Precio</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell align="center">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {catalogo.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Typography sx={{ fontWeight: 800 }}>{item.nombre}</Typography>
                                        <Typography sx={{ fontSize: 11, color: "#64748b" }}>{item.descripcion || "Sin descripción"}</Typography>
                                        {item.precios_sede?.length > 0 && (
                                            <Typography sx={{ mt: 0.5, fontSize: 11, color: "#b45309", fontWeight: 800 }}>
                                                {item.precios_sede.length} precio(s) por sede
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{item.duracion_dias} días</TableCell>
                                    <TableCell>{money(item.precio)}</TableCell>
                                    <TableCell>
                                        <Chip label={item.activa ? "Activa" : "Inactiva"} sx={semanticChipSx(item.activa ? "success" : "neutral")} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            onClick={() => { setPlanPrecios(item); setPreciosModalOpen(true); }}
                                            sx={{ ...semanticIconButtonSx("inventory"), mr: 1 }}
                                            title="Gestionar precios"
                                        >
                                            <PaymentsOutlinedIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => { setPlanEdit(item); setPlanModalOpen(true); }}
                                            sx={semanticIconButtonSx("mustard")}
                                            title="Editar"
                                        >
                                            <EditIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <ModalMembresiaPlan
                open={planModalOpen}
                onClose={() => { setPlanModalOpen(false); setPlanEdit(null); }}
                onSave={handleSavePlan}
                isEditMode={Boolean(planEdit)}
                dataEdit={planEdit}
            />

            <ModalPreciosMembresia
                open={preciosModalOpen}
                onClose={() => { setPreciosModalOpen(false); setPlanPrecios(null); }}
                membresia={planPrecios}
                sedes={sedes}
                onSaved={fetchData}
            />
        </Stack>
    );
}
