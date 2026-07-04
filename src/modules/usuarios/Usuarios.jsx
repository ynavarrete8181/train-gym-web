import { useEffect, useState } from "react";
import {
    Box,
    Chip,
    FormControl,
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
    Typography,
    IconButton,
    Tooltip,
    Fade
} from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import Swal from "sweetalert2";

import PremiumButton from "../../components/ui/PremiumButton";
import PageHeader from "../../components/ui/PageHeader";
import ModalUsuario from "./components/ModalUsuario";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, semanticIconButtonSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";

const emptyForm = {
    id: null,
    persona_id: "",
    email: "",
    password: "",
    estado: "ACTIVO",
    roles: [],
    sedes: [],
};

const estadoTone = {
    ACTIVO: "success",
    INACTIVO: "mustard",
    BLOQUEADO: "danger",
};

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [personas, setPersonas] = useState([]);
    const [buscar, setBuscar] = useState("");
    const [estado, setEstado] = useState("");
    const [rolId, setRolId] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(emptyForm);

    const fetchCatalogos = async () => {
        const { data } = await apiClient.get("/gimnasio/seguridad/usuarios/catalogos");
        setRoles(data?.roles || []);
        setPersonas(data?.personas || []);
        setSedes(data?.sedes || []);
    };

    const fetchUsuarios = async () => {
        const { data } = await apiClient.get("/gimnasio/seguridad/usuarios", {
            params: {
                buscar: buscar || undefined,
                estado: estado || undefined,
                rol_id: rolId || undefined,
            },
        });
        setUsuarios(data || []);
    };

    useEffect(() => {
        fetchCatalogos().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los catálogos de usuarios."), "error");
        });
    }, []);

    useEffect(() => {
        fetchUsuarios().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los usuarios."), "error");
        });
    }, [buscar, estado, rolId]);

    const resetForm = () => {
        setFormData(emptyForm);
        setModalOpen(false);
    };

    const openCreate = () => {
        setFormData(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (usuario) => {
        setFormData({
            id: usuario.id,
            persona_id: usuario.persona_id || "",
            email: usuario.email || "",
            password: "",
            estado: usuario.estado || "ACTIVO",
            roles: usuario.roles_ids || [],
            sedes: usuario.sedes_ids || [],
        });
        setModalOpen(true);
    };

    const submitForm = async () => {
        setLoading(true);
        try {
            const payload = {
                persona_id: formData.persona_id || null,
                email: formData.email,
                estado: formData.estado,
                roles: formData.roles,
                sedes: formData.sedes,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            if (formData.id) {
                await apiClient.put(`/gimnasio/seguridad/usuarios/${formData.id}`, payload);
            } else {
                await apiClient.post("/gimnasio/seguridad/usuarios", payload);
            }

            await Promise.all([fetchUsuarios(), fetchCatalogos()]);
            resetForm();
            Swal.fire("Listo", formData.id ? "Usuario actualizado." : "Usuario creado.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar el usuario."), "error");
        } finally {
            setLoading(false);
        }
    };

    const changeStatus = async (usuario, nuevoEstado) => {
        try {
            await apiClient.post(`/gimnasio/seguridad/usuarios/${usuario.id}/estado`, { estado: nuevoEstado });
            await fetchUsuarios();
            Swal.fire("Actualizado", `Estado cambiado a ${nuevoEstado}.`, "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cambiar el estado."), "error");
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8", p: { xs: 2, md: 3 } }}>
            <Box sx={{ maxWidth: 1600, mx: "auto" }}>
                <Fade in timeout={400}>
                    <Stack spacing={3}>
                        <PageHeader
                            title="Catálogo de Usuarios"
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
                                    {usuarios.length} REGISTROS
                                </Box>
                            }
                        />

                        <Paper
                            elevation={0}
                            sx={{
                                ...pagePaperSx,
                                bgcolor: "#ffffff",
                                borderRadius: "8px",
                                border: "1px solid #e2e8f0",
                                overflow: "hidden",
                            }}
                        >
                            <Box sx={{ px: 4, py: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexGrow: 1 }}>
                                    <TextField
                                        size="small"
                                        placeholder="Buscar por correo, cédula o persona..."
                                        value={buscar}
                                        onChange={(e) => setBuscar(e.target.value)}
                                        sx={{ ...filterInputSx, width: 280 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <FormControl size="small" sx={{ ...filterInputSx, width: 180 }}>
                                        <Select
                                            value={estado}
                                            onChange={(e) => setEstado(e.target.value)}
                                            displayEmpty
                                            sx={{ fontSize: "13px" }}
                                        >
                                            <MenuItem value="">Cualquier estado</MenuItem>
                                            <MenuItem value="ACTIVO">Activo</MenuItem>
                                            <MenuItem value="INACTIVO">Inactivo</MenuItem>
                                            <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{ ...filterInputSx, width: 180 }}>
                                        <Select
                                            value={rolId}
                                            onChange={(e) => setRolId(e.target.value)}
                                            displayEmpty
                                            sx={{ fontSize: "13px" }}
                                        >
                                            <MenuItem value="">Cualquier rol</MenuItem>
                                            {roles.map((rol) => (
                                                <MenuItem key={rol.id} value={rol.id}>
                                                    {rol.nombre}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Stack>

                                <PremiumButton
                                    variant="anadir"
                                    onClick={openCreate}
                                >
                                    Añadir
                                </PremiumButton>
                            </Box>

                            <Box sx={{ px: 4, pb: 4 }}>
                                <TableContainer>
                                    <Table sx={{ ...tableSx, minWidth: 800 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Usuario</TableCell>
                                                <TableCell>Persona</TableCell>
                                                <TableCell>Roles</TableCell>
                                                <TableCell>Estado</TableCell>
                                                <TableCell>Actualizado</TableCell>
                                                <TableCell align="right">Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {usuarios.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: "#64748b" }}>
                                                        No hay usuarios con los filtros actuales.
                                                    </TableCell>
                                                </TableRow>
                                            ) : usuarios.map((usuario) => (
                                                <TableRow key={usuario.id} hover>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 800, fontSize: "13px", color: "#0f172a" }}>{usuario.email}</Typography>
                                                        <Typography sx={{ fontSize: "12px", color: "#64748b", mt: 0.5 }}>#{usuario.id}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 800, fontSize: "13px", color: "#0f172a" }}>{usuario.nombre_completo || "Sin persona"}</Typography>
                                                        <Typography sx={{ fontSize: "12px", color: "#64748b", mt: 0.5 }}>{usuario.cedula || "Sin cédula"}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap">
                                                            {(usuario.roles || []).length === 0 ? (
                                                                <Chip label="Sin roles" size="small" sx={{ ...semanticChipSx("mustard"), fontWeight: 800 }} />
                                                            ) : usuario.roles.map((rol) => (
                                                                <Chip key={rol.id} label={rol.nombre} size="small" sx={{ ...semanticChipSx("neutral"), fontWeight: 800 }} />
                                                            ))}
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={usuario.estado} size="small" sx={{ ...semanticChipSx(estadoTone[usuario.estado] || "neutral"), fontWeight: 800 }} />
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: "13px", color: "#64748b" }}>
                                                        {usuario.updated_at ? String(usuario.updated_at).slice(0, 16).replace("T", " ") : "Sin fecha"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                            <Tooltip title="Editar">
                                                                <IconButton onClick={() => openEdit(usuario)} sx={semanticIconButtonSx("mustard")}>
                                                                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Tooltip>

                                                            {usuario.estado === "ACTIVO" ? (
                                                                <Tooltip title="Bloquear">
                                                                    <IconButton onClick={() => changeStatus(usuario, "BLOQUEADO")} sx={semanticIconButtonSx("danger")}>
                                                                        <LockOutlinedIcon sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            ) : (
                                                                <Tooltip title="Activar">
                                                                    <IconButton onClick={() => changeStatus(usuario, "ACTIVO")} sx={semanticIconButtonSx("success")}>
                                                                        <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Paper>
                    </Stack>
                </Fade>
            </Box>

            <ModalUsuario
                open={modalOpen}
                onClose={resetForm}
                onSubmit={submitForm}
                loading={loading}
                formData={formData}
                setFormData={setFormData}
                roles={roles}
                personas={personas}
                sedes={sedes}
                editing={Boolean(formData.id)}
            />
        </Box>
    );
}
