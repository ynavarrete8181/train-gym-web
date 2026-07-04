import { Box, FormControlLabel, Switch, FormControl, MenuItem, InputLabel, Select, Grid, Paper, List, ListItem, ListItemText, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Divider, Pagination } from '@mui/material';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrashAlt, faPlus, faSquare } from '@fortawesome/free-solid-svg-icons';
import SchoolIcon from '@mui/icons-material/School';
import Swal from 'sweetalert2';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { faPlusSquare } from '@fortawesome/free-solid-svg-icons';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CompListarIngreso from './ListasIngresos';
import CompFormularioIngreso from './FormulariosIngreso';


function Ingresos({ usr_id }) {
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [DataIngresoId, setDataIngresoId] = useState(null);

    const handleAgregarNuevo = (data = null) => {
        setMostrarFormulario(true);
        setDataIngresoId(data);
    };

    const handleVolverALista = () => {
        setMostrarFormulario(false);
    };

    return (
        <Box sx={{ maxWidth: '100%', margin: 'auto', p: 2 }}>
            {mostrarFormulario ? (
                // Mostrar el formulario
                <CompFormularioIngreso
                    onCancelar={handleVolverALista}
                    usr_id={usr_id}
                    data={DataIngresoId} />
            ) : (
                // Mostrar la lista
                <CompListarIngreso 
                onAgregar={handleAgregarNuevo} 
                usr_id={usr_id} 
                />
            )}
        </Box>
    );
}
export default Ingresos;
