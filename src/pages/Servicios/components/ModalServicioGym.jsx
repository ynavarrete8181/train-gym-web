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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Stack,
} from "@mui/material";
import Swal from "sweetalert2";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

import {
  createServicio,
  listCategoriasServicio,
  updateServicio,
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

const ModalServicioGym = ({ open, onClose, dataEdit, usr_id }) => {
  const [formServicio, setFormServicio] = useState({
    select_id_categoria: "",
    txt_nombre: "",
    txt_descripcion: "",
    select_id_estado: 8,
  });

  const [errors, setErrors] = useState({});
  const [loadingSave, setLoadingSave] = useState(false);
  const [dataCategoriaServicio, setDataCategoriaServicio] = useState([]);

  const nombreRef = useRef(null);

  // Carga inicial de datos
  useEffect(() => {
    if (dataEdit) {
      setFormServicio({
        select_id_categoria: dataEdit.categoria_id || dataEdit.ts_id_categoria || "",
        txt_nombre: dataEdit.nombre || dataEdit.ts_nombre || "",
        txt_descripcion: dataEdit.descripcion || dataEdit.ts_descripcion || "",
        select_id_estado:
          dataEdit.estado_id === 0 ? 9 : (dataEdit.estado_id || dataEdit.ts_id_estado || 8),
      });
    } else {
      setFormServicio({
        select_id_categoria: "",
        txt_nombre: "",
        txt_descripcion: "",
        select_id_estado: 8,
      });
    }

    fetchCategorias();
    setErrors({});

    setTimeout(() => {
      if (nombreRef.current) nombreRef.current.focus();
    }, 100);
  }, [dataEdit, open]);

  // Obtener categorías
  const fetchCategorias = async () => {
    try {
      const categories = await listCategoriasServicio();
      setDataCategoriaServicio(categories);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudieron cargar las categorías", "error");
    }
  };

  // Validación de formulario
  const validateForm = () => {
    const newErrors = {};
    if (!formServicio.select_id_categoria) newErrors.select_id_categoria = "Seleccione una categoría";
    if (!formServicio.txt_nombre.trim()) newErrors.txt_nombre = "Ingrese el nombre";
    if (!formServicio.txt_descripcion.trim()) newErrors.txt_descripcion = "Ingrese la descripción";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar servicio
  const handleGuardarCategoriaServicio = async () => {
    if (!validateForm()) return;

    setLoadingSave(true);

    try {
      const payload = {
        categoria_id: formServicio.select_id_categoria,
        select_id_categoria: formServicio.select_id_categoria,
        nombre: formServicio.txt_nombre,
        txt_nombre: formServicio.txt_nombre,
        descripcion: formServicio.txt_descripcion,
        txt_descripcion: formServicio.txt_descripcion,
        estado_id: formServicio.select_id_estado === 8 ? 1 : 0,
        select_id_estado: formServicio.select_id_estado,
      };

      if (dataEdit?.id || dataEdit?.ts_id) {
        await updateServicio(dataEdit.id ?? dataEdit.ts_id, payload);
      } else {
        await createServicio(payload);
      }
      Swal.fire(
        "Éxito",
        dataEdit ? "Servicio actualizado" : "Servicio creado",
        "success"
      );

      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo guardar", "error");
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: modalPaperSx }}>
      <DialogTitle sx={modalTitleSx}>
        {dataEdit ? "Editar servicio" : "Registrar servicio"}
      </DialogTitle>

      <DialogContent sx={modalContentSx}>
        <Stack spacing={2.25} sx={{ mt: 0.5 }}>
          <FormControl fullWidth size="small" error={!!errors.select_id_categoria} sx={modalFieldSx}>
            <InputLabel id="categoria-label">Categoría</InputLabel>
            <Select
              labelId="categoria-label"
              label="Categoría"
              value={formServicio.select_id_categoria}
              onChange={(e) => setFormServicio({ ...formServicio, select_id_categoria: e.target.value })}
            >
              <MenuItem value="">
                <em>Seleccione Categoría</em>
              </MenuItem>
              {dataCategoriaServicio.length > 0 ? (
                dataCategoriaServicio.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>Sin categorías disponibles</MenuItem>
              )}
            </Select>
            {errors.select_id_categoria && <FormHelperText>{errors.select_id_categoria}</FormHelperText>}
          </FormControl>

          <TextField
            label="Nombre del Servicio"
            size="small"
            fullWidth
            inputRef={nombreRef}
            value={formServicio.txt_nombre}
            onChange={(e) => setFormServicio({ ...formServicio, txt_nombre: e.target.value })}
            error={!!errors.txt_nombre}
            helperText={errors.txt_nombre}
            sx={modalFieldSx}
          />

          <TextField
            label="Descripción"
            size="small"
            fullWidth
            multiline
            minRows={3}
            value={formServicio.txt_descripcion}
            onChange={(e) => setFormServicio({ ...formServicio, txt_descripcion: e.target.value })}
            error={!!errors.txt_descripcion}
            helperText={errors.txt_descripcion}
            sx={modalFieldSx}
          />

          <FormControlLabel
            sx={{ ml: 0.2 }}
            control={
              <Checkbox
                checked={formServicio.select_id_estado === 8}
                onChange={(e) =>
                  setFormServicio({ ...formServicio, select_id_estado: e.target.checked ? 8 : 9 })
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
          startIcon={loadingSave ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          variant="outlined"
          sx={modalPrimaryButtonSx}
        >
          {loadingSave ? (dataEdit ? "Actualizando..." : "Guardando...") : dataEdit ? "Actualizar" : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalServicioGym;
