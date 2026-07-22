import { useState } from "react";
import { Alert, Box, Stack, TextField, Typography } from "@mui/material";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import Swal from "sweetalert2";

import PremiumModal from "../ui/PremiumModal";
import PremiumButton from "../ui/PremiumButton";
import { globalInputSx } from "../ui/GlobalUiTheme";
import { apiClient, getApiErrorMessage } from "../../services/apiClient";

const emptyForm = {
    password_actual: "",
    password: "",
    password_confirmation: "",
};

export default function CambioPasswordObligatorio({ user, refreshUser }) {
    const [formData, setFormData] = useState(emptyForm);
    const [loading, setLoading] = useState(false);

    const mustChange = Boolean(user?.requiere_cambio_password);

    const setField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.password_actual || !formData.password || !formData.password_confirmation) {
            Swal.fire("Datos incompletos", "Ingrese la clave temporal, la nueva clave y la confirmación.", "warning");
            return;
        }

        if (formData.password !== formData.password_confirmation) {
            Swal.fire("Confirmación inválida", "La nueva contraseña y la confirmación no coinciden.", "warning");
            return;
        }

        setLoading(true);
        try {
            await apiClient.post("/auth/cambiar-password-temporal", formData);
            await refreshUser();
            setFormData(emptyForm);
            Swal.fire("Listo", "Contraseña actualizada correctamente.", "success");
        } catch (error) {
            Swal.fire("Error", getApiErrorMessage(error, "No se pudo cambiar la contraseña."), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PremiumModal
            open={mustChange}
            onClose={() => {}}
            title="Cambio de contraseña requerido"
            subtitle="Por seguridad, actualiza la clave temporal antes de continuar."
            icon={<VpnKeyOutlinedIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="sm"
            actions={
                <PremiumButton variant="guardar" onClick={handleSubmit} loading={loading}>
                    Cambiar contraseña
                </PremiumButton>
            }
        >
            <Stack spacing={2}>
                <Alert severity="warning" sx={{ borderRadius: "6px", fontSize: "12px" }}>
                    Esta cuenta fue creada con una contraseña temporal. El sistema se habilita cuando definas una nueva.
                </Alert>

                <Box>
                    <Typography sx={{ fontSize: "12px", fontWeight: 900, mb: 0.7 }}>
                        Contraseña temporal
                    </Typography>
                    <TextField
                        fullWidth
                        type="password"
                        value={formData.password_actual}
                        onChange={(event) => setField("password_actual", event.target.value)}
                        autoComplete="current-password"
                        sx={globalInputSx}
                    />
                </Box>

                <Box>
                    <Typography sx={{ fontSize: "12px", fontWeight: 900, mb: 0.7 }}>
                        Nueva contraseña
                    </Typography>
                    <TextField
                        fullWidth
                        type="password"
                        value={formData.password}
                        onChange={(event) => setField("password", event.target.value)}
                        autoComplete="new-password"
                        sx={globalInputSx}
                    />
                </Box>

                <Box>
                    <Typography sx={{ fontSize: "12px", fontWeight: 900, mb: 0.7 }}>
                        Confirmar nueva contraseña
                    </Typography>
                    <TextField
                        fullWidth
                        type="password"
                        value={formData.password_confirmation}
                        onChange={(event) => setField("password_confirmation", event.target.value)}
                        autoComplete="new-password"
                        sx={globalInputSx}
                    />
                </Box>
            </Stack>
        </PremiumModal>
    );
}
