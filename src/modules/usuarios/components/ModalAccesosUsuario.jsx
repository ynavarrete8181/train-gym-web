import { Box, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";

import PremiumModal from "../../../components/ui/PremiumModal";
import PremiumButton from "../../../components/ui/PremiumButton";
import { globalInputSx, globalMenuProps, globalUi } from "../../../components/ui/GlobalUiTheme";

const toNumberIds = (values) => (values || []).map((value) => Number(value)).filter((value) => Number.isFinite(value));

export default function ModalAccesosUsuario({
    open,
    onClose,
    onSubmit,
    loading,
    formData,
    setFormData,
    roles,
    sedes,
}) {
    const inputLabelSx = {
        mb: 0.65,
        fontSize: "12px",
        fontWeight: 900,
        color: globalUi.black,
        lineHeight: 1.1,
    };

    const selectSx = {
        ...globalInputSx,
        minHeight: 38,
        backgroundColor: "#fff",
        borderRadius: "6px",
        "& .MuiSelect-select": {
            minHeight: 38,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            fontSize: "12px",
            pr: "32px !important",
        },
    };

    const renderSelected = (selected, source, placeholder) => {
        if (!selected?.length) return placeholder;
        return source
            .filter((item) => selected.map(String).includes(String(item.id)))
            .map((item) => item.nombre)
            .join(", ");
    };

    return (
        <PremiumModal
            open={open}
            onClose={onClose}
            title="Accesos del usuario"
            subtitle={formData.nombre || "Configura roles y sedes de operación."}
            icon={<AdminPanelSettingsOutlinedIcon sx={{ fontSize: 22, color: "#fff" }} />}
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
            <Stack spacing={2.2} sx={{ py: 0.5 }}>
                <Box>
                    <InputLabel sx={inputLabelSx}>Roles asignados</InputLabel>
                    <Select
                        multiple
                        fullWidth
                        displayEmpty
                        value={formData.roles || []}
                        onChange={(e) => setFormData((prev) => ({ ...prev, roles: toNumberIds(e.target.value) }))}
                        sx={selectSx}
                        MenuProps={globalMenuProps}
                        renderValue={(selected) => renderSelected(selected, roles, "Seleccionar roles...")}
                    >
                        {roles.map((rol) => (
                            <MenuItem key={rol.id} value={rol.id}>
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
                        onChange={(e) => setFormData((prev) => ({ ...prev, sedes: toNumberIds(e.target.value) }))}
                        sx={selectSx}
                        MenuProps={globalMenuProps}
                        renderValue={(selected) => renderSelected(selected, sedes, "Seleccionar sedes...")}
                    >
                        {sedes.map((sede) => (
                            <MenuItem key={sede.id} value={sede.id}>
                                {sede.nombre}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>

                <Typography sx={{ fontSize: "12px", color: globalUi.muted }}>
                    Si no seleccionas sedes, el usuario no podrá operar cajas o módulos filtrados por sede hasta que se le asignen.
                </Typography>
            </Stack>
        </PremiumModal>
    );
}
