import {
    Autocomplete,
    Box,
    Checkbox,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import { globalInputSx, globalMenuProps, globalUi } from "../../../components/ui/GlobalUiTheme";

const ESTADOS = ["ACTIVO", "INACTIVO", "BLOQUEADO"];

export default function ModalUsuario({
    open,
    onClose,
    onSubmit,
    loading,
    formData,
    setFormData,
    personas,
    editing,
}) {
    const selectedPersona = personas.find((persona) => String(persona.id) === String(formData.persona_id)) || null;
    const personaTieneOtroUsuario = (persona) => (
        Boolean(persona?.usuario_id) && String(persona.usuario_id) !== String(formData.id || "")
    );

    const inputLabelSx = {
        mb: 0.65,
        fontSize: "12px",
        fontWeight: 900,
        color: globalUi.black,
        lineHeight: 1.1,
    };

    const inputSx = {
        ...globalInputSx,
        "& .MuiInputBase-root": {
            minHeight: 38,
            fontSize: "12px",
            backgroundColor: "#fff",
            borderRadius: "6px",
        },
        "& .MuiInputBase-input": {
            boxSizing: "border-box",
            fontSize: "12px",
        },
    };

    const selectSx = {
        ...globalInputSx,
        height: 38,
        minHeight: 38,
        backgroundColor: "#fff",
        borderRadius: "6px",
        "& .MuiSelect-select": {
            height: 38,
            minHeight: 38,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            fontSize: "12px",
            pr: "32px !important",
        },
    };

    const handlePersonaChange = (_, persona) => {
        const cedula = String(persona?.cedula || "").trim();
        const email = String(persona?.email || "").trim();

        setFormData((prev) => ({
            ...prev,
            persona_id: persona?.id || "",
            email: cedula || prev.email,
            cedula: cedula || prev.cedula,
            email_credenciales: email || prev.email_credenciales,
        }));
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={editing ? "Editar cuenta" : "Nuevo usuario"}
            subtitle="Datos de acceso y credenciales temporales."
            icon={<AccountCircleIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="sm"
            actions={
                <>
                    <PremiumButton variant="cancelar" onClick={onClose} disabled={loading}>
                        Cancelar
                    </PremiumButton>

                    <PremiumButton variant="guardar" onClick={onSubmit} loading={loading}>
                        Guardar
                    </PremiumButton>
                </>
            }
        >
            <Stack spacing={2.1} sx={{ py: 0.5 }}>
                <Box>
                    <InputLabel sx={inputLabelSx}>Persona asociada</InputLabel>
                    <Autocomplete
                        options={personas}
                        value={selectedPersona}
                        onChange={handlePersonaChange}
                        getOptionDisabled={personaTieneOtroUsuario}
                        getOptionLabel={(option) => option ? `${option.nombre_completo || "Sin nombre"} · ${option.cedula || "Sin cédula"}` : ""}
                        isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                        noOptionsText="No hay personas registradas"
                        renderOption={(props, option) => {
                            const { key, ...optionProps } = props;
                            const bloqueada = personaTieneOtroUsuario(option);

                            return (
                                <Box
                                    key={key}
                                    component="li"
                                    {...optionProps}
                                    sx={{
                                        display: "block !important",
                                        py: "7px !important",
                                        opacity: bloqueada ? 0.58 : 1,
                                    }}
                                >
                                    <Typography sx={{ fontSize: "12px", fontWeight: 900, color: globalUi.black }}>
                                        {option.nombre_completo || "Sin nombre"}
                                    </Typography>
                                    <Typography sx={{ fontSize: "11px", color: globalUi.muted, mt: 0.2 }}>
                                        {option.cedula || "Sin cédula"}
                                        {bloqueada ? ` · Ya tiene usuario: ${option.usuario_email || `ID ${option.usuario_id}`}` : ""}
                                    </Typography>
                                </Box>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Buscar persona por nombre o cédula..."
                                size="small"
                                sx={inputSx}
                            />
                        )}
                    />
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    <Box>
                        <InputLabel sx={inputLabelSx}>Usuario / Cédula *</InputLabel>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Ingrese la cédula"
                            value={formData.email}
                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value.trim(), cedula: e.target.value.trim() }))}
                            sx={inputSx}
                        />
                    </Box>

                    <Box>
                        <InputLabel sx={inputLabelSx}>Estado de la cuenta *</InputLabel>
                        <Select
                            fullWidth
                            value={formData.estado}
                            onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.value }))}
                            sx={selectSx}
                            MenuProps={globalMenuProps}
                        >
                            {ESTADOS.map((estado) => (
                                <MenuItem key={estado} value={estado}>
                                    {estado}
                                </MenuItem>
                            ))}
                        </Select>
                    </Box>
                </Box>

                <Box>
                    <InputLabel sx={inputLabelSx}>Correo para credenciales *</InputLabel>
                    <TextField
                        fullWidth
                        size="small"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        value={formData.email_credenciales}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email_credenciales: e.target.value.trim() }))}
                        sx={inputSx}
                    />
                </Box>

                <Box>
                    <InputLabel sx={inputLabelSx}>{editing ? "Nueva clave temporal opcional" : "Clave temporal opcional"}</InputLabel>
                    <TextField
                        fullWidth
                        size="small"
                        type="password"
                        placeholder={editing ? "Dejar vacío para no cambiar" : "Se genera automáticamente si se deja vacío"}
                        value={formData.password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                        sx={inputSx}
                    />
                </Box>

                {!editing && (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={Boolean(formData.enviar_credenciales)}
                                onChange={(e) => setFormData((prev) => ({ ...prev, enviar_credenciales: e.target.checked }))}
                                sx={{
                                    color: globalUi.mustard,
                                    "&.Mui-checked": { color: globalUi.mustard },
                                }}
                            />
                        }
                        label={
                            <Typography sx={{ fontSize: "13px", fontWeight: 800, color: globalUi.black }}>
                                Enviar usuario y clave temporal por correo
                            </Typography>
                        }
                    />
                )}

                <Typography sx={{ fontSize: "12px", color: globalUi.muted }}>
                    La primera vez que ingrese, el usuario deberá cambiar la clave temporal.
                </Typography>
            </Stack>
        </PremiumModal>
    );
}
