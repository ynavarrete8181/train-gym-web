import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Fade,
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
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import Swal from "sweetalert2";

import PremiumButton from "../../components/ui/PremiumButton";
import PageHeader from "../../components/ui/PageHeader";
import ModalUsuario from "./components/ModalUsuario";
import ModalAccesosUsuario from "./components/ModalAccesosUsuario";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { filterInputSx, semanticChipSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../personas/personas.utils";

const ROWS_PER_PAGE = 5;

const createEmptyForm = () => ({
    id: null,
    persona_id: "",
    email: "",
    cedula: "",
    email_credenciales: "",
    password: "",
    estado: "ACTIVO",
    enviar_credenciales: true,
});

const createAccessForm = () => ({
    id: null,
    nombre: "",
    roles: [],
    sedes: [],
});

const estadoTone = {
    ACTIVO: "success",
    INACTIVO: "mustard",
    BLOQUEADO: "danger",
};

const credentialTone = (usuario) => {
    if (usuario.requiere_cambio_password) return "mustard";
    if (usuario.email_credenciales || usuario.persona_email) return "success";
    return "danger";
};

const credentialLabel = (usuario) => {
    if (usuario.requiere_cambio_password) return "Clave temporal";
    if (usuario.email_credenciales || usuario.persona_email) return "Correo listo";
    return "Sin correo";
};

const normalizeIds = (items) => (items || []).map((value) => Number(value)).filter((value) => Number.isFinite(value));

const ActionButton = ({ title, tone = "mustard", onClick, children }) => (
    <Tooltip title={title}>
        <Button
            type="button"
            aria-label={title}
            onClick={onClick}
            className={[
                "btn-icon-action",
                tone === "danger" ? "btn-icon-action-danger btn-icon-action--danger" : `btn-icon-action--${tone}`,
            ].filter(Boolean).join(" ")}
        >
            {children}
        </Button>
    </Tooltip>
);

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [sedes, setSedes] = useState([]);
    const [personas, setPersonas] = useState([]);
    const [buscar, setBuscar] = useState("");
    const [estado, setEstado] = useState("");
    const [rolId, setRolId] = useState("");
    const [page, setPage] = useState(0);
    const [modalCuentaOpen, setModalCuentaOpen] = useState(false);
    const [modalAccesosOpen, setModalAccesosOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState(createEmptyForm());
    const [accessData, setAccessData] = useState(createAccessForm());

    const fetchCatalogos = async () => {
        const { data } = await apiClient.get("/gimnasio/seguridad/usuarios/catalogos");
        setRoles(data?.roles || []);
        setPersonas(data?.personas || []);
        setSedes(data?.sedes || []);
    };

    const fetchUsuarios = useCallback(async () => {
        const { data } = await apiClient.get("/gimnasio/seguridad/usuarios", {
            params: {
                buscar: buscar || undefined,
                estado: estado || undefined,
                rol_id: rolId || undefined,
            },
        });
        setUsuarios(data || []);
    }, [buscar, estado, rolId]);

    useEffect(() => {
        fetchCatalogos().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los catálogos de usuarios."), "error");
        });
    }, []);

    useEffect(() => {
        setPage(0);
    }, [buscar, estado, rolId]);

    useEffect(() => {
        fetchUsuarios().catch((error) => {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron cargar los usuarios."), "error");
        });
    }, [fetchUsuarios]);

    const visibleUsuarios = useMemo(
        () => usuarios.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
        [usuarios, page],
    );

    const resetCuenta = () => {
        setFormData(createEmptyForm());
        setModalCuentaOpen(false);
    };

    const resetAccesos = () => {
        setAccessData(createAccessForm());
        setModalAccesosOpen(false);
    };

    const openCreate = () => {
        setFormData(createEmptyForm());
        setModalCuentaOpen(true);
    };

    const openEdit = (usuario) => {
        setFormData({
            id: usuario.id,
            persona_id: usuario.persona_id || "",
            email: usuario.email || usuario.cedula || "",
            cedula: usuario.cedula || "",
            email_credenciales: usuario.email_credenciales || usuario.persona_email || "",
            password: "",
            estado: usuario.estado || "ACTIVO",
            enviar_credenciales: false,
        });
        setModalCuentaOpen(true);
    };

    const openAccess = (usuario) => {
        setAccessData({
            id: usuario.id,
            nombre: usuario.nombre_completo || usuario.email || `Usuario #${usuario.id}`,
            roles: normalizeIds(usuario.roles_ids),
            sedes: normalizeIds(usuario.sedes_ids),
        });
        setModalAccesosOpen(true);
    };

    const submitForm = async () => {
        const username = String(formData.email || formData.cedula || "").trim();

        if (!username) {
            Swal.fire("Usuario requerido", "Ingrese o seleccione la cédula que usará para iniciar sesión.", "warning");
            return;
        }

        if (!formData.id && !String(formData.email_credenciales || "").trim()) {
            Swal.fire("Correo requerido", "Ingrese el correo donde se enviarán las credenciales temporales.", "warning");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                persona_id: formData.persona_id || null,
                email: username,
                cedula: username,
                estado: formData.estado,
                email_credenciales: String(formData.email_credenciales || "").trim() || null,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            if (!formData.id) {
                payload.enviar_credenciales = Boolean(formData.enviar_credenciales);
            }

            if (formData.id) {
                await apiClient.put(`/gimnasio/seguridad/usuarios/${formData.id}`, payload);
            } else {
                await apiClient.post("/gimnasio/seguridad/usuarios", payload);
            }

            await Promise.all([fetchUsuarios(), fetchCatalogos()]);
            resetCuenta();
            Swal.fire("Listo", formData.id ? "Usuario actualizado." : "Usuario creado con clave temporal.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo guardar el usuario."), "error");
        } finally {
            setLoading(false);
        }
    };

    const submitAccess = async () => {
        if (!accessData.id) return;

        setLoading(true);
        try {
            await apiClient.put(`/gimnasio/seguridad/usuarios/${accessData.id}/accesos`, {
                roles: normalizeIds(accessData.roles),
                sedes: normalizeIds(accessData.sedes),
            });
            await fetchUsuarios();
            resetAccesos();
            Swal.fire("Listo", "Accesos actualizados.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron guardar los accesos."), "error");
        } finally {
            setLoading(false);
        }
    };

    const resendCredentials = async (usuario) => {
        const result = await Swal.fire({
            title: "Reenviar credenciales",
            text: `Se generará una nueva clave temporal para ${usuario.nombre_completo || usuario.email}.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Reenviar",
            cancelButtonText: "Cancelar",
            reverseButtons: true,
            buttonsStyling: false,
            customClass: {
                popup: "tg-swal-popup",
                title: "tg-swal-title",
                htmlContainer: "tg-swal-text",
                actions: "tg-swal-actions",
                confirmButton: "btn-save tg-swal-confirm",
                cancelButton: "btn-cancel tg-swal-cancel",
            },
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.post(`/gimnasio/seguridad/usuarios/${usuario.id}/reenviar-credenciales`);
            await fetchUsuarios();
            Swal.fire("Enviado", "Se enviaron las credenciales temporales.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudieron reenviar las credenciales."), "error");
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
                            title="Cuentas del sistema"
                            icon={<VpnKeyOutlinedIcon />}
                            rightContent={<Chip label={`${usuarios.length} REGISTROS`} sx={semanticChipSx("neutral")} />}
                        />

                        <Paper elevation={0} sx={{ ...pagePaperSx, bgcolor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                            <Box className="tg-module-toolbar">
                                <Box className="tg-module-toolbar__filters">
                                    <TextField
                                        size="small"
                                        placeholder="Buscar por usuario, cédula o persona..."
                                        value={buscar}
                                        onChange={(e) => setBuscar(e.target.value)}
                                        sx={{ ...filterInputSx, width: { xs: "100%", md: 300 } }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchOutlinedIcon sx={{ fontSize: 18, color: "#64748b" }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <FormControl size="small" sx={{ ...filterInputSx, width: { xs: "100%", md: 180 } }}>
                                        <Select value={estado} onChange={(e) => setEstado(e.target.value)} displayEmpty sx={{ fontSize: "13px" }}>
                                            <MenuItem value="">Cualquier estado</MenuItem>
                                            <MenuItem value="ACTIVO">Activo</MenuItem>
                                            <MenuItem value="INACTIVO">Inactivo</MenuItem>
                                            <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>
                                        </Select>
                                    </FormControl>

                                    <FormControl size="small" sx={{ ...filterInputSx, width: { xs: "100%", md: 180 } }}>
                                        <Select value={rolId} onChange={(e) => setRolId(e.target.value)} displayEmpty sx={{ fontSize: "13px" }}>
                                            <MenuItem value="">Cualquier rol</MenuItem>
                                            {roles.map((rol) => (
                                                <MenuItem key={rol.id} value={rol.id}>
                                                    {rol.nombre}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box className="tg-module-toolbar__actions">
                                    <PremiumButton variant="anadir" onClick={openCreate}>
                                        Añadir
                                    </PremiumButton>
                                </Box>
                            </Box>

                            <Box sx={{ px: { xs: 2, md: 4 }, pb: 2 }}>
                                <TableContainer>
                                    <Table sx={{ ...tableSx, minWidth: 980 }}>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Usuario</TableCell>
                                                <TableCell>Persona</TableCell>
                                                <TableCell>Accesos</TableCell>
                                                <TableCell>Estado</TableCell>
                                                <TableCell>Credenciales</TableCell>
                                                <TableCell>Actualizado</TableCell>
                                                <TableCell align="right">Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {visibleUsuarios.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: "#64748b" }}>
                                                        No hay usuarios con los filtros actuales.
                                                    </TableCell>
                                                </TableRow>
                                            ) : visibleUsuarios.map((usuario) => (
                                                <TableRow key={usuario.id} hover>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 900, fontSize: "13px", color: "#0f172a" }}>{usuario.email}</Typography>
                                                        <Typography sx={{ fontSize: "12px", color: "#64748b", mt: 0.5 }}>ID {usuario.id}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography sx={{ fontWeight: 900, fontSize: "13px", color: "#0f172a" }}>{usuario.nombre_completo || "Sin persona"}</Typography>
                                                        <Typography sx={{ fontSize: "12px", color: "#64748b", mt: 0.5 }}>{usuario.cedula || "Sin cédula"}</Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={0.7} useFlexGap flexWrap="wrap">
                                                            {(usuario.roles || []).length === 0 ? (
                                                                <Chip label="Sin roles" size="small" sx={semanticChipSx("mustard")} />
                                                            ) : usuario.roles.slice(0, 2).map((rol) => (
                                                                <Chip key={rol.id} label={rol.nombre} size="small" sx={semanticChipSx("neutral")} />
                                                            ))}
                                                            {(usuario.sedes || []).length > 0 && (
                                                                <Chip label={`${usuario.sedes.length} sedes`} size="small" sx={semanticChipSx("inventory")} />
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={usuario.estado} size="small" sx={semanticChipSx(estadoTone[usuario.estado] || "neutral")} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={credentialLabel(usuario)} size="small" sx={semanticChipSx(credentialTone(usuario))} />
                                                        <Typography sx={{ fontSize: "11px", color: "#64748b", mt: 0.6 }}>
                                                            {usuario.email_credenciales || usuario.persona_email || "Configure un correo"}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ fontSize: "13px", color: "#64748b" }}>
                                                        {usuario.updated_at ? String(usuario.updated_at).slice(0, 16).replace("T", " ") : "Sin fecha"}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                            <ActionButton title="Editar cuenta" tone="mustard" onClick={() => openEdit(usuario)}>
                                                                <EditOutlinedIcon />
                                                            </ActionButton>
                                                            <ActionButton title="Roles y sedes" tone="inventory" onClick={() => openAccess(usuario)}>
                                                                <AdminPanelSettingsOutlinedIcon />
                                                            </ActionButton>
                                                            <ActionButton title="Reenviar credenciales" tone="success" onClick={() => resendCredentials(usuario)}>
                                                                <MarkEmailReadOutlinedIcon />
                                                            </ActionButton>
                                                            {usuario.estado === "ACTIVO" ? (
                                                                <ActionButton title="Bloquear" tone="danger" onClick={() => changeStatus(usuario, "BLOQUEADO")}>
                                                                    <LockOutlinedIcon />
                                                                </ActionButton>
                                                            ) : (
                                                                <ActionButton title="Activar" tone="success" onClick={() => changeStatus(usuario, "ACTIVO")}>
                                                                    <CheckCircleOutlineOutlinedIcon />
                                                                </ActionButton>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <TablePagination
                                    className="tg-table-pagination"
                                    component="div"
                                    count={usuarios.length}
                                    page={page}
                                    onPageChange={(_, nextPage) => setPage(nextPage)}
                                    rowsPerPage={ROWS_PER_PAGE}
                                    onRowsPerPageChange={() => {}}
                                    rowsPerPageOptions={[ROWS_PER_PAGE]}
                                    labelRowsPerPage="Filas por página:"
                                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                                />
                            </Box>
                        </Paper>
                    </Stack>
                </Fade>
            </Box>

            <ModalUsuario
                open={modalCuentaOpen}
                onClose={resetCuenta}
                onSubmit={submitForm}
                loading={loading}
                formData={formData}
                setFormData={setFormData}
                personas={personas}
                editing={Boolean(formData.id)}
            />

            <ModalAccesosUsuario
                open={modalAccesosOpen}
                onClose={resetAccesos}
                onSubmit={submitAccess}
                loading={loading}
                formData={accessData}
                setFormData={setAccessData}
                roles={roles}
                sedes={sedes}
            />
        </Box>
    );
}
