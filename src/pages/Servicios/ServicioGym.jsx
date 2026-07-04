import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Paper,
} from "@mui/material";

import MenuBookIcon from "@mui/icons-material/MenuBook";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import GridOnIcon from "@mui/icons-material/GridOn";
import EditIcon from "@mui/icons-material/Edit";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import dayjs from "dayjs";

import CompModalServicioGym from "./components/ModalServicioGym";
import {
  getServicio,
  listServicios,
} from "../../modules/servicios/api";
import PremiumButton from "../../components/ui/PremiumButton";
import { filterInputSx, semanticChipSx, semanticIconButtonSx, tableSx } from "../../Styles/muiTheme";
import { pagePaperSx } from "../../modules/personas/personas.utils";

export default function ServiciosGym({ usr_id }) {
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(
    parseInt(localStorage.getItem("rowsPerPageServiciosGym") || "10", 10)
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [totalRows, setTotalRows] = useState(0);

  const [openModal, setOpenModal] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const arr = await listServicios();
      setData(arr);
    } catch (e) {
      setData([]);
      Swal.fire("Error", "Hubo un problema al consultar servicios.", "error");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const lower = search.trim().toLowerCase();

    const f = (data || []).filter((x) => {
      if (!lower) return true;

      const usuario =
        `${x?.usuario_nombres ?? ""} ${x?.usuario_apellidos ?? ""}`.trim() ||
        x?.usuario_nombre ||
        x?.usuario_email ||
        "";

      const estado = x?.estado_nombre || x?.estado_codigo || x?.estado || "";

      const id = x?.id ?? x?.ts_id ?? "";
      const nombre = x?.nombre ?? x?.ts_nombre ?? "";
      const descripcion = x?.descripcion ?? x?.ts_descripcion ?? "";
      const categoria = x?.categoria_nombre ?? x?.cat_nombre ?? "";

      const t = `${id} ${categoria} ${nombre} ${descripcion} ${usuario} ${estado}`.toLowerCase();
      return t.includes(lower);
    });

    setFiltered(f);
    setTotalRows(f.length);
    setPage(1);
  }, [search, data]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return (filtered || []).slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const handleRowsPerPageChange = (e) => {
    const v = parseInt(e.target.value, 10);
    setRowsPerPage(v);
    localStorage.setItem("rowsPerPageServiciosGym", String(v));
    setPage(1);
  };

  const openCreate = () => {
    setSelectedServicio(null);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setSelectedServicio(null);
    fetchData();
  };

  const handleFetchServicioId = async (id) => {
    setLoadingEdit(id);
    try {
      const item = await getServicio(id);

      if (!item) {
        Swal.fire("Aviso", "No se encontró el servicio solicitado.", "warning");
        return;
      }

      setSelectedServicio(item);
      setOpenModal(true);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "Ocurrió un error al consultar el servicio.", "error");
    } finally {
      setLoadingEdit(null);
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      (filtered || []).map((d) => {
        const usuario =
          `${d?.usuario_nombres ?? ""} ${d?.usuario_apellidos ?? ""}`.trim() ||
          d?.usuario_nombre ||
          d?.usuario_email ||
          "";

        const estado = d?.estado_nombre || d?.estado_codigo || d?.estado || "";

        return {
          ID: d?.id ?? d?.ts_id,
          Categoria: d?.categoria_nombre ?? d?.cat_nombre,
          Nombre: d?.nombre ?? d?.ts_nombre,
          Descripción: d?.descripcion ?? d?.ts_descripcion,
          Estado: estado,
          Usuario: usuario,
          Creado: d?.created_at ?? d?.ts_created_at,
          Actualizado: d?.updated_at ?? d?.ts_updated_at,
        };
      })
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ServiciosGym");
    XLSX.writeFile(wb, `ServiciosGym_${Date.now()}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Reporte de Servicios del Gimnasio", 14, 18);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, 14, 24);

    const head = [["ID", "Categoría", "Nombre", "Estado", "Usuario", "Creado"]];

    const body = (filtered || []).map((d) => {
      const usuario =
        `${d?.usuario_nombres ?? ""} ${d?.usuario_apellidos ?? ""}`.trim() ||
        d?.usuario_nombre ||
        d?.usuario_email ||
        "—";

      const estado = d?.estado_nombre || d?.estado_codigo || d?.estado || "—";
      const created = d?.created_at ?? d?.ts_created_at;

      return [
        d?.id ?? d?.ts_id ?? "—",
        d?.categoria_nombre ?? d?.cat_nombre ?? "—",
        d?.nombre ?? d?.ts_nombre ?? "—",
        estado,
        usuario,
        created ? dayjs(created).format("YYYY-MM-DD") : "—",
      ];
    });

    autoTable(doc, { head, body, startY: 30 });
    doc.save(`ServiciosGym_${Date.now()}.pdf`);
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Paper elevation={0} sx={{ ...pagePaperSx, p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Box
              sx={{
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(242,177,0,0.14)",
                border: "1px solid rgba(242,177,0,0.22)",
                color: "var(--tg-text-dark)",
              }}
            >
              <MenuBookIcon />
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                Servicios
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configuración de servicios del gimnasio
              </Typography>
            </Box>
          </Stack>

          <Chip label={`${totalRows} RESULTADOS`} sx={semanticChipSx("mustard")} />
      </Paper>

      <Paper elevation={0} sx={{ ...pagePaperSx, p: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
            <TextField
              size="small"
              label="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ ...filterInputSx, maxWidth: 320 }}
            />

            <FormControl size="small" sx={{ ...filterInputSx, width: 140 }}>
              <InputLabel>Mostrar</InputLabel>
              <Select label="Mostrar" value={rowsPerPage} onChange={handleRowsPerPageChange}>
                {[5, 10, 25, 50].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ flex: 1 }} />

            <Stack direction="row" spacing={1}>
              <PremiumButton variant="excel" onClick={handleExportExcel}>
                Excel
              </PremiumButton>

              <PremiumButton variant="pdf" onClick={handleExportPDF}>
                PDF
              </PremiumButton>

              <PremiumButton variant="anadir" onClick={openCreate}>
                Añadir
              </PremiumButton>
            </Stack>
          </Stack>

          <Box sx={{ mt: 2 }}>
            <TableContainer component={Paper} sx={{ border: "1px solid #e2e8f0", boxShadow: "none" }}>
              <Table size="small" sx={tableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell align="center">ID</TableCell>
                    <TableCell align="center">Categoría</TableCell>
                    <TableCell align="center">Nombre</TableCell>
                    <TableCell align="center">Descripción</TableCell>
                    <TableCell align="center">Usuario</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell align="center">Creado</TableCell>
                    <TableCell align="center">Actualizado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        <CircularProgress />
                      </TableCell>
                    </TableRow>
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No se encontraron registros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((d) => {
                      const id = d?.id ?? d?.ts_id;

                      const usuario =
                        `${d?.usuario_nombres ?? ""} ${d?.usuario_apellidos ?? ""}`.trim() ||
                        d?.usuario_nombre ||
                        d?.usuario_email ||
                        "—";

                      const estado = d?.estado_nombre || d?.estado_codigo || d?.estado || "—";
                      const activo =
                        String(estado).toUpperCase() === "ACTIVO" ||
                        String(estado).toUpperCase() === "PAGADO";

                      const created = d?.created_at ?? d?.ts_created_at;
                      const updated = d?.updated_at ?? d?.ts_updated_at;

                      return (
                        <TableRow key={id} hover>
                          <TableCell align="center">{id}</TableCell>
                          <TableCell align="center">{d?.categoria_nombre ?? d?.cat_nombre ?? "—"}</TableCell>
                          <TableCell align="center">{d?.nombre ?? d?.ts_nombre ?? "—"}</TableCell>
                          <TableCell align="center">{d?.descripcion ?? d?.ts_descripcion ?? "—"}</TableCell>
                          <TableCell align="center">{usuario}</TableCell>

                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={estado}
                              sx={semanticChipSx(activo ? "success" : "danger")}
                            />
                          </TableCell>

                          <TableCell align="center">
                            {created ? dayjs(created).format("YYYY-MM-DD HH:mm") : "—"}
                          </TableCell>

                          <TableCell align="center">
                            {updated ? dayjs(updated).format("YYYY-MM-DD HH:mm") : "—"}
                          </TableCell>

                          <TableCell align="center">
                            <Tooltip title="Editar">
                              <span>
                                <IconButton
                                  onClick={() => handleFetchServicioId(id)}
                                  disabled={loadingEdit === id}
                                  sx={semanticIconButtonSx("mustard")}
                                >
                                  {loadingEdit === id ? (
                                    <CircularProgress size={18} />
                                  ) : (
                                    <EditIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Pagination
              count={Math.max(1, Math.ceil(totalRows / rowsPerPage))}
              page={page}
              onChange={(e, v) => setPage(v)}
              sx={{ mt: 2, display: "flex", justifyContent: "center" }}
            />
          </Box>
      </Paper>

      {openModal ? (
        <CompModalServicioGym open={openModal} onClose={closeModal} usr_id={usr_id} dataEdit={selectedServicio} />
      ) : null}
    </Box>
  );
}
