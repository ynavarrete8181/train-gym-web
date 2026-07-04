import React, { useState, useEffect, useRef } from "react";
import {
    TextField,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    Stack,
} from "@mui/material";
import Swal from "sweetalert2";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import {
    createCategoriaServicio,
    updateCategoriaServicio,
} from "../../../modules/servicios/api";
import {
    modalActionsSx,
    modalCancelButtonSx,
    modalContentSx,
    modalFieldSx,
    modalPaperSx,
    modalPrimaryButtonSx,
    modalTitleSx,
} from "../../../Styles/muiTheme";

const ModalCategoriaServicioGym = ({ onClose, open, dataEdit }) => {
    const [FormCategoriaServicio, setFormCategoriaServicio] = useState({
        txt_nombre: "",
        txt_descripcion: "",
        select_id_estado: 8,
    });

    const [errors, setErrors] = useState({});
    const [loadingSave, setLoadingSave] = useState(false);

    const nombreRef = useRef(null);

    useEffect(() => {
        if (dataEdit) {
            setFormCategoriaServicio({
                txt_nombre: dataEdit.cat_nombre || "",
                txt_descripcion: dataEdit.cat_descripcion || "",
                select_id_estado: dataEdit.cat_id_estado || 8,
            });
        } else {
            setFormCategoriaServicio({
                txt_nombre: "",
                txt_descripcion: "",
                select_id_estado: 8,
            });
        }
        setErrors({});

        setTimeout(() => {
            if (nombreRef.current) nombreRef.current.focus();
        }, 100);
    }, [dataEdit, open]);

    const validateForm = () => {
        let newErrors = {};
        if (!FormCategoriaServicio.txt_nombre?.trim())
            newErrors.txt_nombre = "Ingrese el nombre de la categoría";
        if (!FormCategoriaServicio.txt_descripcion?.trim())
            newErrors.txt_descripcion = "Ingrese la descripción";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGuardarCategoriaServicio = async () => {
        if (!validateForm()) return;

        setLoadingSave(true);
        try {
            if (dataEdit) {
                await updateCategoriaServicio(dataEdit.id ?? dataEdit.cat_id, {
                    ...FormCategoriaServicio,
                });
                Swal.fire("Éxito", "Categoría actualizada correctamente", "success");
            } else {
                await createCategoriaServicio({
                    ...FormCategoriaServicio,
                });
                Swal.fire("Éxito", "Categoría creada correctamente", "success");
            }
            onClose();
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "No se pudo guardar la categoría", "error");
        } finally {
            setLoadingSave(false);
        }
    };

    const swalStyle = `
        <style>
            .swal-popup-front {
                z-index: 20000 !important;
            }
        </style>
    `;

    return (
        <>
            <div dangerouslySetInnerHTML={{ __html: swalStyle }} />

            <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: modalPaperSx }}>
                <DialogTitle sx={modalTitleSx}>
                    {dataEdit ? "Editar categoría de servicio" : "Registrar categoría de servicio"}
                </DialogTitle>

                <DialogContent sx={modalContentSx}>
                    <Stack spacing={2.25} sx={{ mt: 0.5 }}>
                        <TextField
                            label="Nombre de la Categoría"
                            size="small"
                            fullWidth
                            inputRef={nombreRef}
                            value={FormCategoriaServicio.txt_nombre}
                            onChange={(e) =>
                                setFormCategoriaServicio((prev) => ({
                                    ...prev,
                                    txt_nombre: e.target.value,
                                }))
                            }
                            error={!!errors.txt_nombre}
                            helperText={errors.txt_nombre}
                            sx={{
                                ...modalFieldSx,
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: "#ffffff",
                                    "&.Mui-error fieldset": {
                                        borderColor: "#d32f2f",
                                    },
                                },
                            }}
                        />

                        <TextField
                            label="Descripción"
                            size="small"
                            fullWidth
                            multiline
                            minRows={3}
                            value={FormCategoriaServicio.txt_descripcion}
                            onChange={(e) =>
                                setFormCategoriaServicio((prev) => ({
                                    ...prev,
                                    txt_descripcion: e.target.value,
                                }))
                            }
                            error={!!errors.txt_descripcion}
                            helperText={errors.txt_descripcion}
                            sx={{
                                ...modalFieldSx,
                                "& .MuiOutlinedInput-root": {
                                    backgroundColor: "#ffffff",
                                    "&.Mui-error fieldset": {
                                        borderColor: "#d32f2f",
                                    },
                                },
                            }}
                        />

                        <FormControlLabel
                            sx={{ ml: 0.2 }}
                            control={
                                <Checkbox
                                    checked={FormCategoriaServicio.select_id_estado === 8}
                                    onChange={(e) =>
                                        setFormCategoriaServicio((prev) => ({
                                            ...prev,
                                            select_id_estado: e.target.checked ? 8 : 9,
                                        }))
                                    }
                                    color="success"
                                />
                            }
                            label="Activo"
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={modalActionsSx}>
                    <Button
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        onClick={onClose}
                        sx={modalCancelButtonSx}
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={handleGuardarCategoriaServicio}
                        disabled={loadingSave}
                        startIcon={
                            loadingSave ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />
                        }
                        variant="outlined"
                        sx={modalPrimaryButtonSx}
                    >
                        {loadingSave
                            ? dataEdit
                                ? "Actualizando..."
                                : "Guardando..."
                            : dataEdit
                                ? "Actualizar"
                                : "Guardar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ModalCategoriaServicioGym;
