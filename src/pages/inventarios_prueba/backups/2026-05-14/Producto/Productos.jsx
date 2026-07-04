import { Box, FormControlLabel, Switch, FormControl, MenuItem, InputLabel, Select, Grid, Paper, List, ListItem, ListItemText, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Pagination } from '@mui/material';
import { useEffect, useState } from 'react';
import {
    consultarEstados,
} from '../../../../axios/axios_client';
import axiosClient from '../../../../axios/axios_client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus, faSquare } from '@fortawesome/free-solid-svg-icons';
import SchoolIcon from '@mui/icons-material/School';
import Swal from 'sweetalert2';


const Productos = () => {
    const [dataProductos, setDataProducto] = useState([]);
    const [dataFilteredProductos, setFilteredProductos] = useState([]);
    const [openDialogProducto, setOpenDialogProducto] = useState(false);
    const [formDataAgregarProductos, setFormDataAgregarProductos] = useState([]);
    const [selectedProducto, setSelectedProducto] = useState(null);
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(5);

    const [dataCategoriaActivo, setDataCategoriaActivo] = useState([]);
    const [dataEstado, setDataEstado] = useState([]);

    // Cargar datos en la tabla de productos en la pagina inicio
    const fetchDataProductos = async () => {
        try {
            const response = await axiosClient.get("/inventario/productos");
            const data = Array.isArray(response?.data) ? response.data : response?.data?.data || [];
            setDataProducto(data);
            setFilteredProductos(data);
        } catch (error) {
            // console.error("Error al cargar las SecretariaMatriculas:", error);
        }
    };

    useEffect(() => {
        fetchDataProductos();
    }, []);

    const handleSearchChange = (event) => {
        //setSearchText(event.targalue)et.v;
        //filterInsumos(event.target.value);
    };

    const paginatedData = dataFilteredProductos.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    //

    // Dar Click en btn añadir para abrir modal Agregar Nuevo Producto
    const handleAgregarNuevo = () => {
        setOpenDialogProducto(true);
        //fetchDataCategoriaActivo();
    };
    //

    // Dar Click en btn cancelar para cerrar modal Agregar Nuevo Producto
    const handleCloseDialog = () => {
        //setSelectedFacultad(null);
        //setFacultadAEliminar(null);
        setFormDataAgregarProductos(false)
        setOpenDialogProducto(false);
    };
    //

    //Agregar Productos
    const handleGuardarProductos = async () => {
        console.log('Enviar datos:', formDataAgregarProductos);
        try {
            const { data: response } = await axiosClient.post("/inventario/productos", formDataAgregarProductos);
            if (response.success) {
                Swal.fire('¡Éxito!', 'Producto se agregó correctamente.', 'success');
                fetchDataProductos();
                setOpenDialogProducto(false);
            }/* else {
                Swal.fire('Error', 'Hubo un problema al agregar el producto.', 'error');
            }*/
        } catch (error) {
            Swal.fire("Error", `Hubo un problema: ${error.message}`, "error");
            console.error(error);
        }
    };
    //

    //Click al boton editar y cargar los datos al formulario
    const handleEditarProducto = (data) => {
        console.log(data);
        setSelectedProducto(data);
        setFormDataAgregarProductos(prev => ({
            ...prev,
            'select-tipo': data.pro_tipo,
            'txt-codigo': data.pro_codigo,
            'select-unidad-medida': data.pro_unidad_medida,
            'select-estado': data.pro_estado,
            'txt-descripcion': data.pro_descripcion,
        }))
        setOpenDialogProducto(true);
    };
    //

    //Modificar los datos del producto
    const handleModificar = async () => {
        if (selectedProducto) {
            try {
                await axiosClient.put(`/inventario/productos/${selectedProducto.pro_id}`, formDataAgregarProductos);
                Swal.fire('¡Éxito!', 'El producto se actualizó correctamente.', 'success');
                fetchDataProductos();
            } catch (error) {
                Swal.fire('¡Error!', 'Error al actualizar la producto.', 'error');
            }
            setFormDataAgregarProductos(false)
            setOpenDialogProducto(false);
        }
    };
    //

    //Consultar Categoria Activos para anadir en el select de tipo de producto    
    const fetchDataCategoriaActivo = async () => {
        try {
            const response = await axiosClient.get("/inventario/categorias");
            const data = Array.isArray(response?.data) ? response.data : response?.data?.data || [];
            console.log("Datos AX:", data);
            const mapData = data.map(item => ({
                value: item.ca_id,
                label: item.ca_descripcion
            }));

            console.log("Datos mapeados:", mapData);
            setDataCategoriaActivo(mapData);
            //setFilteredCategoriaActivos(data);
        } catch (error) {
            console.error("Error al cargar las Categorias de Activos:", error);
        }
    };


    useEffect(() => {
        fetchDataCategoriaActivo();
    }, []);
    //

    //Consultar Estados para anadir en el select de Estado de producto    
    const fetchDataEstado = async () => {
        try {
            const data = await consultarEstados();
            console.log("Datos AX estado:", data);
            const mapData = data.map(item => ({
                value: item.id,
                label: item.estado
            }));

            console.log("Datos mapeados es tados:", mapData);
            setDataEstado(mapData);
            //setFilteredEstados(data);
        } catch (error) {
            console.error("Error al cargar las Categorias de Activos:", error);
        }
    };


    useEffect(() => {
        fetchDataEstado();
    }, []);
    //


    return (
        <Box sx={{ maxWidth: '100%', margin: 'auto', p: 2 }}>
            <Typography variant="h4" gutterBottom>
                Productos
            </Typography>
            <Paper sx={{ mb: 4, p: 2, bgcolor: 'white', color: 'black' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">
                        Permite agregar, modificar y eliminar Productos
                    </Typography>
                </Box>
                <Divider />
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField
                        label="Buscar"
                        onChange={handleSearchChange}
                        variant="outlined"
                        sx={{ mr: 2 }}
                    />
                    <Button variant="contained" color="primary" startIcon={<FontAwesomeIcon icon={faPlus} />} onClick={handleAgregarNuevo}>
                        Añadir
                    </Button>
                </Box>
                <Divider />
                <TableContainer component={Paper} sx={{ mt: 3 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Id</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Codigo</TableCell>
                                <TableCell>Descripción</TableCell>
                                <TableCell>U. Medida</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {dataProductos.map((data) => (
                                <TableRow key={data.pro_id}>
                                    <TableCell>{data.pro_id}</TableCell>
                                    <TableCell>{data.descripcion}</TableCell>
                                    <TableCell>{data.pro_codigo}</TableCell>
                                    <TableCell>{data.pro_descripcion}</TableCell>
                                    <TableCell>{data.pro_unidad_medida}</TableCell>
                                    <TableCell>{data.estado}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEditarProducto(data)} color="primary" title="Editar">
                                            <FontAwesomeIcon icon={faEdit} />
                                        </IconButton>
                                        <IconButton onClick={() => handleEliminarProducto(data.id)} color="secondary" title="Eliminar">
                                            <FontAwesomeIcon icon={faTrashAlt} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Pagination
                    count={Math.ceil(paginatedData.length / rowsPerPage)}
                    page={page}
                    onChange={''}
                    color="primary"
                    showFirstButton
                    showLastButton
                    sx={{
                        marginTop: 2,
                        display: 'flex',
                        justifyContent: 'center'
                    }}
                />
            </Paper>

            <Dialog open={openDialogProducto} onClose={handleCloseDialog}>
                <DialogTitle>{selectedProducto ? "Editar Facultad" : "Agregar"}</DialogTitle>
                <Divider />
                <DialogContent>

                    <Grid container spacing={0}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12}>
                                <FormControl
                                    fullWidth
                                >
                                    <InputLabel>Tipos</InputLabel>
                                    <Select
                                        id="select-tipo"
                                        label="Estado"
                                        value={formDataAgregarProductos['select-tipo']}
                                        onChange={(e) =>
                                            setFormDataAgregarProductos(prev => ({ ...prev, 'select-tipo': e.target.value }))
                                        }
                                        sx={{ mb: 2 }}
                                    >
                                        <MenuItem value="0">Seleccione Tipo de Insumo</MenuItem>
                                        {dataCategoriaActivo.length === 0 ? (
                                            <MenuItem disabled value="">
                                                Cargando categorías...
                                            </MenuItem>
                                        ) : (
                                            dataCategoriaActivo.map((item) => (
                                                <MenuItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>

                                </FormControl>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    id="txt-codigo"
                                    label="Código"
                                    variant="outlined"
                                    fullWidth
                                    value={formDataAgregarProductos['txt-codigo']}
                                    onChange={(e) =>
                                        setFormDataAgregarProductos(prev => ({ ...prev, 'txt-codigo': e.target.value }))
                                    }
                                    sx={{ mb: 2 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <FormControl
                                    fullWidth
                                >
                                    <InputLabel>U. Medida</InputLabel>
                                    <Select
                                        id="select-unidad-medida"
                                        label="Unidad de Medida"
                                        value={formDataAgregarProductos['select-unidad-medida']}
                                        onChange={(e) =>
                                            setFormDataAgregarProductos(prev => ({ ...prev, 'select-unidad-medida': e.target.value }))
                                        }
                                    >
                                        <MenuItem value="0">Seleccione Unidad</MenuItem>
                                        <MenuItem value="UNIDAD">Unidad</MenuItem>
                                        <MenuItem value="CAJAS">Cajas</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={4}>
                                <FormControl
                                    fullWidth
                                >
                                    <InputLabel>Estado</InputLabel>
                                    <Select
                                        id="select-estado"
                                        label="Estado"
                                        value={formDataAgregarProductos['select-estado']}
                                        onChange={(e) =>
                                            setFormDataAgregarProductos(prev => ({ ...prev, 'select-estado': e.target.value }))
                                        }
                                    >

                                        <MenuItem value="0">Seleccione Estado</MenuItem>
                                        {dataEstado.length === 0 ? (
                                            <MenuItem disabled value="">
                                                Cargando estados...
                                            </MenuItem>
                                        ) : (
                                            dataEstado.map((item) => (
                                                <MenuItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12}>
                                <TextField
                                    id="txt-descripcion"
                                    label="Descripciòn"
                                    variant="outlined"
                                    fullWidth
                                    value={formDataAgregarProductos['txt-descripcion']}
                                    onChange={(e) =>
                                        setFormDataAgregarProductos(prev => ({ ...prev, 'txt-descripcion': e.target.value }))
                                    }
                                    sx={{ mb: 2 }}
                                />
                            </Grid>
                        </Grid>

                    </Grid>
                </DialogContent>

                <DialogActions sx={{ justifyContent: 'flex-end' }}>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    {selectedProducto ? (
                        <Button onClick={handleModificar} variant="contained" color="primary">
                            Modificar
                        </Button>
                    ) : (
                        <Button onClick={handleGuardarProductos} variant="contained" color="primary">
                            Guardar
                        </Button>
                    )}

                </DialogActions>
            </Dialog>
        </Box>

    );
}

export default Productos;
