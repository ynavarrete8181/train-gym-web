import {
    FormControl,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    Stack,
    TextField,
    Box,
    Typography,
} from "@mui/material";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import { globalUi, globalInputSx } from "../../../components/ui/GlobalUiTheme";

const ESTADOS = ["ACTIVO", "INACTIVO", "BLOQUEADO"];

export default function ModalUsuario({
    open,
    onClose,
    onSubmit,
    loading,
    formData,
    setFormData,
    roles,
    personas,
    sedes,
    editing,
}) {
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
            height: 38,
            minHeight: 38,
            fontSize: "12px",
            backgroundColor: "#fff",
            borderRadius: "10px",
        },
        "& .MuiInputBase-input": {
            height: 38,
            boxSizing: "border-box",
            fontSize: "12px",
        },
    };

    const selectSx = {
        ...globalInputSx,
        height: 38,
        minHeight: 38,
        backgroundColor: "#fff",
        borderRadius: "10px",
        "& .MuiSelect-select": {
            height: 38,
            minHeight: 38,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            fontSize: "12px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            pr: "32px !important",
        },
    };

    const panelSx = {
        minWidth: 0,
        border: `1px solid ${globalUi.borderSoft}`,
        borderRadius: "18px",
        background: "#FFFFFF",
        p: 2.25,
    };

    const sectionHeader = (number, title, subtitle) => (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2, mb: 2 }}>
            <Box
                sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "12px",
                    fontWeight: 900,
                    color: globalUi.black,
                    background: globalUi.mustardSoft,
                    border: `1px solid ${globalUi.mustardBorder}`,
                }}
            >
                {number}
            </Box>

            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "14px", fontWeight: 950, color: globalUi.black, lineHeight: 1.15 }}>
                    {title}
                </Typography>
                <Typography sx={{ mt: 0.35, fontSize: "12px", color: globalUi.muted, lineHeight: 1.35 }}>
                    {subtitle}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title={editing ? "Editar Usuario" : "Nuevo Usuario"}
            subtitle="Configura el acceso y los roles del usuario del sistema"
            icon={<AccountCircleIcon sx={{ fontSize: 22, color: "#fff" }} />}
            maxWidth="md"
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
            <Box sx={{ py: 0.5 }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                        gap: 2.5,
                        alignItems: "stretch",
                    }}
                >
                    <Box sx={panelSx}>
                        {sectionHeader("1", "Información del usuario", "Datos de acceso principales.")}

                        <Stack spacing={2}>
                            <Box>
                                <InputLabel sx={inputLabelSx}>Persona asociada *</InputLabel>
                                <Select
                                    fullWidth
                                    displayEmpty
                                    value={formData.persona_id}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, persona_id: e.target.value }))}
                                    sx={selectSx}
                                >
                                    <MenuItem value="" sx={{ fontSize: "12px" }}>Sin asociar</MenuItem>
                                    {personas.map((persona) => (
                                        <MenuItem
                                            key={persona.id}
                                            value={persona.id}
                                            disabled={Boolean(persona.usuario_id && persona.usuario_id !== formData.id)}
                                            sx={{ fontSize: "12px" }}
                                        >
                                            {persona.nombre_completo} · {persona.cedula}
                                            {persona.usuario_id ? ` · ${persona.usuario_email || "Ya vinculado"}` : ""}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>

                            <Box>
                                <InputLabel sx={inputLabelSx}>Correo electrónico *</InputLabel>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                    sx={inputSx}
                                />
                            </Box>

                            <Box>
                                <InputLabel sx={inputLabelSx}>{editing ? "Nueva contraseña (opcional)" : "Contraseña *"}</InputLabel>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    type="password"
                                    placeholder={editing ? "Dejar en blanco para no cambiar" : "Ingrese contraseña"}
                                    value={formData.password}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                                    sx={inputSx}
                                />
                            </Box>
                        </Stack>
                    </Box>

                    <Box sx={panelSx}>
                        {sectionHeader("2", "Acceso y Roles", "Configuración de permisos en el sistema.")}

                        <Stack spacing={2}>
                            <Box>
                                <InputLabel sx={inputLabelSx}>Estado de la cuenta *</InputLabel>
                                <Select
                                    fullWidth
                                    displayEmpty
                                    value={formData.estado}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, estado: e.target.value }))}
                                    sx={selectSx}
                                >
                                    {ESTADOS.map((estado) => (
                                        <MenuItem key={estado} value={estado} sx={{ fontSize: "12px" }}>
                                            {estado}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>

                            <Box>
                                <InputLabel sx={inputLabelSx}>Roles asignados</InputLabel>
                                <Select
                                    multiple
                                    fullWidth
                                    displayEmpty
                                    value={formData.roles || []}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, roles: e.target.value }))}
                                    sx={selectSx}
                                    renderValue={(selected) => selected.length === 0 ? "Seleccionar roles..." : roles
                                        .filter((rol) => selected.includes(rol.id))
                                        .map((rol) => rol.nombre)
                                        .join(", ")}
                                >
                                    {roles.map((rol) => (
                                        <MenuItem key={rol.id} value={rol.id} sx={{ fontSize: "12px" }}>
                                            {rol.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>

                            <Box>
                                <InputLabel sx={inputLabelSx}>Sedes donde puede operar</InputLabel>
                                <Select
                                    multiple
                                    fullWidth
                                    displayEmpty
                                    value={formData.sedes || []}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, sedes: e.target.value }))}
                                    sx={selectSx}
                                    renderValue={(selected) => selected.length === 0 ? "Seleccionar sedes..." : sedes
                                        .filter((sede) => selected.includes(sede.id))
                                        .map((sede) => sede.nombre)
                                        .join(", ")}
                                >
                                    {sedes.map((sede) => (
                                        <MenuItem key={sede.id} value={sede.id} sx={{ fontSize: "12px" }}>
                                            {sede.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Box>
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </PremiumModal>
    );
}
