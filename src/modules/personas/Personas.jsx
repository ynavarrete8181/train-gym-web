import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Fade,
    Paper,
    Stack,
    Typography,
    CircularProgress,
} from "@mui/material";
import Swal from "sweetalert2";
import { useLocation } from "react-router-dom";

import PageHeader from "../../components/ui/PageHeader";
import PremiumButton from "../../components/ui/PremiumButton";
import ModalPersona from "./components/ModalPersona";
import ModalFichaTecnica from "./components/ModalFichaTecnica";
import PeopleIcon from "@mui/icons-material/People";
import PersonasDirectory from "./components/PersonasDirectory";
import PersonaProfile from "./components/PersonaProfile";
import MembresiasPanel from "./components/MembresiasPanel";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";
import { pagePaperSx } from "./personas.utils";

const VALID_PERSONA_TYPES = ["CLIENTE", "SOCIO", "FUNCIONARIO", "ENTRENADOR"];

const normalizePersonaType = (value) => {
    const normalized = String(value || "").trim().toUpperCase();
    return VALID_PERSONA_TYPES.includes(normalized) ? normalized : "CLIENTE";
};

const buildPersonaRequest = (payload, method = "post") => {
    const normalizedPayload = {
        ...payload,
        tipo_persona: normalizePersonaType(payload?.tipo_persona),
    };

    if (!normalizedPayload?.foto_file) return normalizedPayload;

    const formData = new FormData();
    if (method !== "post") formData.append("_method", method.toUpperCase());

    Object.entries(normalizedPayload).forEach(([key, value]) => {
        if (key === "foto_file") return;
        if (key === "remove_foto") {
            formData.append(key, value ? "1" : "0");
            return;
        }
        if (value !== undefined && value !== null) formData.append(key, value);
    });

    formData.append("foto", normalizedPayload.foto_file);
    return formData;
};

export default function Personas() {
    const location = useLocation();
    const [personas, setPersonas] = useState([]);
    const [filtroBuscar, setFiltroBuscar] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");
    const [filtroEstadoMembresia, setFiltroEstadoMembresia] = useState("");
    const [filtroSede, setFiltroSede] = useState("");
    const [loading, setLoading] = useState(false);

    // Profile Details
    const [selectedPersonaId, setSelectedPersonaId] = useState(null);
    const [profileData, setProfileData] = useState(null);

    // Modals open states
    const [personaModalOpen, setPersonaModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [dataEdit, setDataEdit] = useState(null);

    const [evalModalOpen, setEvalModalOpen] = useState(false);
    const [isEditEvalMode, setIsEditEvalMode] = useState(false);
    const [dataEditEval, setDataEditEval] = useState(null);

    const directoryTitle = "Clientes";

    const fetchPersonas = async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get("/gimnasio/personas", {
                params: {
                    buscar: filtroBuscar,
                    tipo_persona: filtroTipo,
                    estado_membresia: filtroEstadoMembresia,
                    sede_id: filtroSede,
                },
            });
            setPersonas(data);
        } catch (error) {
            console.error("Error al cargar personas:", error);
            Swal.fire({
                title: "Error",
                text: getApiErrorMessage(error, "No se pudieron obtener los registros de personas."),
                icon: "error",
                confirmButtonColor: "#0f172a",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPersonas();
    }, [filtroBuscar, filtroTipo, filtroEstadoMembresia, filtroSede]);

    const handleSelectPersona = async (id) => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/gimnasio/personas/${id}`);
            setProfileData(data);
            setSelectedPersonaId(id);
        } catch (error) {
            console.error("Error al obtener detalle de persona:", error);
            Swal.fire({
                title: "Error",
                text: getApiErrorMessage(error, "No se pudo obtener la información de perfil."),
                icon: "error",
                confirmButtonColor: "#0f172a",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setIsEditMode(false);
        setDataEdit(null);
        setPersonaModalOpen(true);
    };

    const handleOpenEditModal = async (p) => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(`/gimnasio/personas/${p.id}`);
            setIsEditMode(true);
            setDataEdit(data);
            setPersonaModalOpen(true);
        } catch (error) {
            console.error("Error al obtener persona para editar:", error);
            Swal.fire({
                title: "Error",
                text: getApiErrorMessage(error, "No se pudo cargar la persona para editar."),
                icon: "error",
                confirmButtonColor: "#0f172a",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSavePersona = async (formData) => {
        try {
            if (isEditMode) {
                const payload = buildPersonaRequest(formData, "put");
                if (formData.foto_file) {
                    await apiClient.post(`/gimnasio/personas/${formData.id}`, payload, {
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                } else {
                    await apiClient.put(`/gimnasio/personas/${formData.id}`, payload);
                }
                Swal.fire({
                    title: "Completado",
                    text: "Datos actualizados exitosamente.",
                    icon: "success",
                    confirmButtonColor: "#0f172a",
                });
            } else {
                const payload = buildPersonaRequest(formData);
                await apiClient.post("/gimnasio/personas", payload, formData.foto_file ? {
                    headers: { "Content-Type": "multipart/form-data" },
                } : undefined);
                Swal.fire({
                    title: "Completado",
                    text: "Persona registrada exitosamente.",
                    icon: "success",
                    confirmButtonColor: "#0f172a",
                });
            }
            setPersonaModalOpen(false);
            fetchPersonas();
            if (selectedPersonaId) {
                handleSelectPersona(selectedPersonaId);
            }
        } catch (error) {
            console.error("Error guardando persona:", error);
            Swal.fire({
                title: "Error de validación",
                text: getApiErrorMessage(error, "Ocurrió un error al procesar el registro."),
                icon: "error",
                confirmButtonColor: "#0f172a",
            });
        }
    };

    const handleOpenEvalModal = () => {
        setIsEditEvalMode(false);
        setDataEditEval(null);
        setEvalModalOpen(true);
    };

    const handleOpenEditEvalModal = (ficha) => {
        setIsEditEvalMode(true);
        setDataEditEval(ficha);
        setEvalModalOpen(true);
    };

    const handleSaveEval = async (evalData) => {
        try {
            if (isEditEvalMode && evalData.id) {
                await apiClient.put(`/gimnasio/fichas-tecnicas/${evalData.id}`, evalData);
                Swal.fire({
                    title: "Ficha actualizada",
                    text: "La evaluación física ha sido modificada con éxito.",
                    icon: "success",
                    confirmButtonColor: "#0f172a",
                });
            } else {
                await apiClient.post("/gimnasio/fichas-tecnicas", evalData);
                Swal.fire({
                    title: "Ficha registrada",
                    text: "La evaluación física ha sido guardada exitosamente.",
                    icon: "success",
                    confirmButtonColor: "#0f172a",
                });
            }
            setEvalModalOpen(false);
            handleSelectPersona(selectedPersonaId);
        } catch (error) {
            console.error("Error guardando evaluación:", error);
            Swal.fire({
                title: "Error",
                text: getApiErrorMessage(error, "Ocurrió un error al guardar la evaluación física."),
                icon: "error",
                confirmButtonColor: "#0f172a",
            });
        }
    };

    const handleDeleteEval = async (fichaId) => {
        const result = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción no se puede deshacer. Se eliminará esta ficha de evaluación física y todas sus mediciones asociadas.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#0f172a",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar"
        });

        if (result.isConfirmed) {
            try {
                await apiClient.delete(`/gimnasio/fichas-tecnicas/${fichaId}`);
                Swal.fire({
                    title: "Eliminado",
                    text: "La ficha de evaluación ha sido eliminada exitosamente.",
                    icon: "success",
                    confirmButtonColor: "#0f172a",
                });
                handleSelectPersona(selectedPersonaId);
            } catch (error) {
                console.error("Error eliminando evaluación:", error);
                Swal.fire({
                    title: "Error",
                    text: getApiErrorMessage(error, "No se pudo eliminar la ficha de evaluación física."),
                    icon: "error",
                    confirmButtonColor: "#0f172a",
                });
            }
        }
    };

    const handleChangeEstado = async (personaId, nuevoEstado) => {
        const labels = { ACTIVO: "Activo", SUSPENDIDO: "Suspendido", INACTIVO: "Inactivo" };
        const result = await Swal.fire({
            title: `¿Cambiar estado a ${labels[nuevoEstado]}?`,
            text: "Se actualizará el estado del registro de esta persona.",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#0f172a",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sí, cambiar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        try {
            await apiClient.post(`/gimnasio/personas/${personaId}/estado`, { estado: nuevoEstado });
            Swal.fire({
                title: "Estado actualizado",
                text: `La persona ahora está en estado ${labels[nuevoEstado]}.`,
                icon: "success",
                confirmButtonColor: "#0f172a",
                timer: 2000,
                showConfirmButton: false,
            });
            handleSelectPersona(personaId);
            fetchPersonas();
        } catch (error) {
            console.error("Error cambiando estado:", error);
            Swal.fire({
                title: "Error",
                text: getApiErrorMessage(error, "No se pudo actualizar el estado."),
                icon: "error",
                confirmButtonColor: "#0f172a",
            });
        }
    };

    return (
        <Box sx={{ minHeight: "100vh" }}>
            <Box sx={{ maxWidth: 1600, mx: "auto" }}>
                <Fade in timeout={400}>
                    <Stack spacing={1.5}>
                        {/* Page Header */}
                        <PageHeader
                            title={selectedPersonaId ? "Perfil de Cliente" : directoryTitle}
                            icon={selectedPersonaId ? <PeopleIcon sx={{ fontSize: 24 }} /> : <PeopleIcon sx={{ fontSize: 24 }} />}
                            rightContent={
                                selectedPersonaId ? (
                                    <PremiumButton
                                        variant="cancelar"
                                        onClick={() => {
                                            setSelectedPersonaId(null);
                                            setProfileData(null);
                                            fetchPersonas();
                                        }}
                                    >
                                        Volver al Listado
                                    </PremiumButton>
                                ) : (
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
                                        {personas.length} REGISTROS
                                    </Box>
                                )
                            }
                        />

                        {!selectedPersonaId ? (
                            <PersonasDirectory
                                personas={personas}
                                loading={loading}
                                filtroBuscar={filtroBuscar}
                                filtroTipo={filtroTipo}
                                filtroEstadoMembresia={filtroEstadoMembresia}
                                filtroSede={filtroSede}
                                onFiltroBuscarChange={setFiltroBuscar}
                                onFiltroTipoChange={setFiltroTipo}
                                onFiltroEstadoMembresiaChange={setFiltroEstadoMembresia}
                                onFiltroSedeChange={setFiltroSede}
                                onCreate={handleOpenCreateModal}
                                onSelectPersona={handleSelectPersona}
                                onEditPersona={handleOpenEditModal}
                            />
                        ) : loading && !profileData ? (
                            <Paper
                                elevation={0}
                                sx={{
                                    ...pagePaperSx,
                                    p: 6,
                                    bgcolor: "#ffffff",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    minHeight: 450,
                                }}
                            >
                                <CircularProgress color="primary" sx={{ mb: 2 }} />
                                <Typography sx={{ color: "#64748b", fontWeight: 800 }}>
                                    Cargando perfil de la persona...
                                </Typography>
                            </Paper>
                        ) : (
                            <PersonaProfile
                                profileData={profileData}
                                onOpenEvalModal={handleOpenEvalModal}
                                onOpenEditModal={handleOpenEditModal}
                                onOpenEditEvalModal={handleOpenEditEvalModal}
                                onDeleteEval={handleDeleteEval}
                                onChangeEstado={handleChangeEstado}
                            />
                        )}
                    </Stack>
                </Fade>
            </Box>

            {/* Dialogs */}
            <ModalPersona
                open={personaModalOpen}
                onClose={() => setPersonaModalOpen(false)}
                onSave={handleSavePersona}
                isEditMode={isEditMode}
                dataEdit={dataEdit}
            />

            <ModalFichaTecnica
                open={evalModalOpen}
                onClose={() => setEvalModalOpen(false)}
                onSave={handleSaveEval}
                personaId={selectedPersonaId}
                isEditMode={isEditEvalMode}
                dataEdit={dataEditEval}
                personas={personas}
            />
        </Box>
    );
}
