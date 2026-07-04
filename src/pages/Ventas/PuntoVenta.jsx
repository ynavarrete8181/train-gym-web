import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Chip, CircularProgress } from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { apiClient, getApiErrorMessage, normalizeAssetUrl, openModalSwal } from "../../services/apiClient";
import PremiumButton from "../../components/ui/PremiumButton";
import { useAuth } from "../../context/AuthContext";

const formatMoney = (value) =>
    new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(Number(value || 0));

const buildDraftCard = (draft) => {
    const items = Array.isArray(draft?.items) ? draft.items : [];
    const subtotalItems = items.reduce((acc, item) => {
        const cantidad = Number(item?.cantidad || 0);
        const precioUnitario = Number(
            item?.precio_unitario
            ?? item?.precio
            ?? (cantidad > 0 && item?.subtotal ? Number(item.subtotal) / cantidad : 0)
        );
        return acc + cantidad * precioUnitario;
    }, 0);
    const subtotal = Number(draft?.subtotal || subtotalItems || 0);
    const total = Number(draft?.total || subtotal || 0);

    return {
        id: draft?.id,
        persona_id: draft?.persona_id,
        nombre: draft?.cliente_nombre || "Consumidor final",
        cedula: draft?.cliente_cedula || "",
        referencia: draft?.referencia || "",
        total,
        subtotal,
        items_count: Number(draft?.items_count || items.reduce((acc, item) => acc + Number(item?.cantidad || 1), 0) || items.length),
        estado_pago: draft?.estado_pago || "BORRADOR",
        codigo_socio: draft?.codigo_socio || "",
        updated_at: draft?.updated_at || "",
        items,
        membresia_id: draft?.membresia_id || null,
        observacion: draft?.observacion || "",
        sede_id: draft?.sede_id || null,
        metadata: draft?.metadata || {},
    };
};

const buildVentaAbiertaCard = (venta) => {
    const detalles = Array.isArray(venta?.detalles) ? venta.detalles : [];

    return {
        id: venta?.id,
        persona_id: venta?.persona_id,
        nombre: venta?.cliente_nombre || "Consumidor final",
        cedula: venta?.cliente_cedula || "",
        referencia: venta?.referencia || "",
        total: Number(venta?.total || 0),
        subtotal: Number(venta?.subtotal || venta?.total || 0),
        items_count: detalles.reduce((acc, item) => acc + Number(item?.cantidad || 0), 0),
        estado_pago: venta?.estado_pago || "PENDIENTE",
        updated_at: venta?.updated_at || venta?.fecha || "",
        items: detalles,
        membresia_id: venta?.membresia_id || null,
        observacion: venta?.observacion || "",
        sede_id: venta?.sede_id || null,
        metadata: venta?.metadata || {},
        tipo_venta: venta?.tipo_venta || "",
    };
};

const paymentOptions = [
    { label: "Efectivo", value: "EFECTIVO" },
    { label: "Tarjeta", value: "TARJETA" },
    { label: "Transf.", value: "TRANSFERENCIA" },
    { label: "QR", value: "QR" },
    { label: "Beca (Gratis)", value: "BECA" },
];

const listProductosVenta = async (sedeId) => {
    const { data } = await apiClient.get("/gimnasio/ventas/punto-venta/catalogo", {
        params: { sede_id: sedeId },
    });

    return Array.isArray(data) ? data : [];
};

const listSedesVenta = async () => {
    const { data } = await apiClient.get("/inventario/sedes");
    return Array.isArray(data) ? data : [];
};

const listMembresiasVenta = async (sedeId = null) => {
    const { data } = await apiClient.get("/gimnasio/membresias", {
        params: {
            ...(sedeId ? { sede_id: sedeId } : {}),
        },
    });

    return Array.isArray(data) ? data.filter((item) => item.activa) : [];
};

const procesarVentaRapida = async ({
    ventaId,
    items = [],
    sedeId,
    personaId,
    formaPago,
    estadoPago,
    observacion,
    referencia,
    membresiaId,
}) => {
    const { data } = await apiClient.post("/gimnasio/ventas/punto-venta", {
        venta_id: ventaId ?? null,
        sede_id: sedeId,
        persona_id: personaId ?? null,
        forma_pago: formaPago ?? null,
        estado_pago: estadoPago ?? "PAGADO",
        observacion,
        referencia,
        membresia_id: membresiaId ?? null,
        items: items.map((item) => ({
            producto_id: item.producto_id,
            cantidad: Number(item.cantidad || 0),
            precio_unitario:
                item.precio_unitario === null || item.precio_unitario === undefined
                    ? null
                    : Number(item.precio_unitario),
            costo_unitario:
                item.costo_unitario === null || item.costo_unitario === undefined
                    ? null
                    : Number(item.costo_unitario),
            tipo_precio: item.tipo_precio || null,
        })),
    });

    return data?.data ?? data;
};

const listVentasAbiertasPuntoVenta = async ({ personaId = null, sedeId = null, fechaConsumo = null } = {}) => {
    const { data } = await apiClient.get("/gimnasio/ventas/punto-venta/abiertas", {
        params: {
            ...(personaId ? { persona_id: personaId } : {}),
            ...(sedeId ? { sede_id: sedeId } : {}),
            ...(fechaConsumo ? { fecha_consumo: fechaConsumo } : {}),
        },
    });

    return Array.isArray(data?.data) ? data.data : [];
};

const listBorradoresPuntoVenta = async () => {
    const { data } = await apiClient.get("/gimnasio/ventas/punto-venta/borradores");
    return Array.isArray(data?.data) ? data.data : [];
};

const guardarBorradorPuntoVenta = async (payload) => {
    const { data } = await apiClient.post("/gimnasio/ventas/punto-venta/borradores", payload);
    return data?.data ?? data;
};

const confirmarBorradorPuntoVenta = async (draftId) => {
    const { data } = await apiClient.post(`/gimnasio/ventas/punto-venta/borradores/${draftId}/confirmar`);
    return data?.data ?? data;
};

function ProductCard({ producto, onAdd }) {
    const imageUrl = normalizeAssetUrl(producto.imagen_url);

    return (
        <button type="button" onClick={() => onAdd(producto)} className="rev-product-card">
            <div className="rev-product-top">
                <div className="rev-product-icon">
                    {imageUrl ? (
                        <img src={imageUrl} alt={producto.nombre} className="rev-product-image" />
                    ) : (
                        <span>{producto.nombre.slice(0, 2).toUpperCase()}</span>
                    )}
                </div>
                <div className="rev-product-info">
                    <h3>{producto.nombre}</h3>
                    <p>{producto.categoria}</p>
                </div>
                <strong className="rev-price">{formatMoney(producto.precio)}</strong>
            </div>

            <p className="rev-product-description">{producto.descripcion || "Producto disponible en catalogo Revive."}</p>

            <div className="rev-product-footer">
                <span className={producto.esPopular ? "rev-badge rev-badge-gold" : "rev-badge"}>
                    {producto.esPopular ? "Popular" : `Stock ${producto.stock}`}
                </span>
                <span className="rev-add-label">Agregar</span>
            </div>
        </button>
    );
}

function CartItem({ item, onIncrease, onDecrease, onRemove }) {
    return (
        <div className="rev-cart-item">
            <div className="rev-cart-item-head">
                <div>
                    <h4>{item.nombre}</h4>
                    <p>{item.categoria}</p>
                </div>
                <button type="button" onClick={() => onRemove(item.id)} className="rev-remove-btn" aria-label="Eliminar producto">
                    ×
                </button>
            </div>

            <div className="rev-cart-item-body">
                <div className="rev-qty-control">
                    <button type="button" onClick={() => onDecrease(item.id)}>−</button>
                    <span>{item.cantidad}</span>
                    <button type="button" onClick={() => onIncrease(item.id)}>+</button>
                </div>

                <div className="rev-line-total">
                    <small>Subtotal</small>
                    <strong>{formatMoney(item.precio * item.cantidad)}</strong>
                </div>
            </div>
        </div>
    );
}

function StepPill({ active, done, children }) {
    return (
        <div className={`rev-step-pill ${active ? "active" : ""} ${done ? "done" : ""}`}>
            <span className="rev-step-dot">{done ? "✓" : ""}</span>
            <span>{children}</span>
        </div>
    );
}

export default function PuntoVenta() {
    const { user } = useAuth();
    const cedulaInputRef = useRef(null);
    const guardadoDraftTimerRef = useRef(null);
    const [productos, setProductos] = useState([]);
    const [membresias, setMembresias] = useState([]);
    const [borradores, setBorradores] = useState([]);
    const [ventasAbiertas, setVentasAbiertas] = useState([]);
    const [draftId, setDraftId] = useState(null);
    const [sedes, setSedes] = useState([]);
    const [loadingCatalogo, setLoadingCatalogo] = useState(true);
    const [guardandoVenta, setGuardandoVenta] = useState(false);
    const [categoriaActiva, setCategoriaActiva] = useState("Todos");
    const [busqueda, setBusqueda] = useState("");
    const [carrito, setCarrito] = useState([]);
    const [membresiaSeleccionadaId, setMembresiaSeleccionadaId] = useState("");
    const [metodoPago, setMetodoPago] = useState("EFECTIVO");
    const [estadoPago, setEstadoPago] = useState("PAGADO");
    const [sedeId, setSedeId] = useState("");
    const [filtroSedeAbiertas, setFiltroSedeAbiertas] = useState("TODAS");
    const [referenciaDraft, setReferenciaDraft] = useState("");
    const [cedulaCliente, setCedulaCliente] = useState("");
    const [cliente, setCliente] = useState(null);
    const [buscandoCliente, setBuscandoCliente] = useState(false);

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            setLoadingCatalogo(true);

            try {
                const sedesData = await listSedesVenta();

                if (ignore) return;

                const sedesDisponibles = Array.isArray(user?.sedes) && user.sedes.length
                    ? sedesData.filter((sede) => user.sedes.some((permitida) => String(permitida.id) === String(sede.id)))
                    : sedesData;

                setSedes(Array.isArray(sedesDisponibles) ? sedesDisponibles : []);

                if (sedesDisponibles?.length) {
                    setSedeId(String(sedesDisponibles[0].id));
                }
            } catch (error) {
                if (!ignore) {
                    openModalSwal({
                        icon: "error",
                        title: "No se pudo cargar el punto de venta",
                        text: getApiErrorMessage(error, "Revisa la conexion con inventario y vuelve a intentar."),
                    });
                    setLoadingCatalogo(false);
                }
            }
        };

        load();
        return () => {
            ignore = true;
        };
    }, [user?.sedes]);

    const isAdmin = useMemo(() => {
        const roles = Array.isArray(user?.roles) ? user.roles : [];
        return roles.some((rol) => {
            const codigo = String(rol?.codigo || "").toUpperCase();
            const nombre = String(rol?.nombre || "").toUpperCase();
            return codigo === "ADMINISTRADOR" || nombre === "ADMINISTRADOR";
        });
    }, [user]);

    const isCashier = useMemo(() => {
        const roles = Array.isArray(user?.roles) ? user.roles : [];
        return roles.some((rol) => {
            const codigo = String(rol?.codigo || "").toUpperCase();
            const nombre = String(rol?.nombre || "").toUpperCase();
            return codigo === "CAJERO" || nombre === "CAJERO";
        });
    }, [user]);

    const sedeFiltroEfectiva = useMemo(() => {
        if (isAdmin || isCashier) {
            return filtroSedeAbiertas === "TODAS" ? null : Number(filtroSedeAbiertas);
        }

        return sedeId ? Number(sedeId) : null;
    }, [isAdmin, isCashier, filtroSedeAbiertas, sedeId]);
    const refrescarBorradores = useCallback(async () => {
        try {
            const [draftsData, ventasData] = await Promise.all([
                listBorradoresPuntoVenta(),
                listVentasAbiertasPuntoVenta({
                    sedeId: sedeFiltroEfectiva,
                }),
            ]);

            setBorradores((Array.isArray(draftsData) ? draftsData : []).map((draft) => buildDraftCard(draft)));
            setVentasAbiertas((Array.isArray(ventasData) ? ventasData : [])
                .filter((venta) => {
                    const estado = String(venta?.estado_pago || "").toUpperCase();
                    const saldo = Number(venta?.saldo_pendiente || 0);
                    return (estado === "PENDIENTE" || estado === "ABONADO") && saldo > 0;
                })
                .map((venta) => buildVentaAbiertaCard(venta)));
        } catch (error) {
            console.warn("No se pudieron cargar los borradores del POS:", error);
            openModalSwal({
                icon: "warning",
                title: "No se pudieron cargar las cuentas abiertas",
                text: getApiErrorMessage(error, "Vuelve a actualizar la vista para consultar las facturas pendientes."),
            });
        }
    }, [sedeFiltroEfectiva]);

    useEffect(() => {
        refrescarBorradores();
    }, [refrescarBorradores]);

    useEffect(() => {
        let ignore = false;

        const loadCatalogo = async () => {
            if (!sedeId) return;

            setLoadingCatalogo(true);

            try {
                const [productosData, membresiasData] = await Promise.all([
                    listProductosVenta(Number(sedeId)),
                    listMembresiasVenta(Number(sedeId)),
                ]);

                if (ignore) return;

                const mapped = productosData.map((producto) => ({
                    id: Number(producto.id),
                    producto_id: Number(producto.id),
                    nombre: producto.nombre,
                    categoria: producto.categoria || "General",
                    descripcion: producto.descripcion || "",
                    imagen_url: producto.imagen_url || "",
                    precio: Number(producto.precio_venta || 0),
                    stock: Number(producto.stock_disponible || 0),
                    precio_costo: null,
                    tipo_precio: "VENTA",
                    esPopular: ["Desayunos", "Almuerzos", "Snacks"].includes(producto.categoria),
                }));

                setProductos(mapped);
                setMembresias(Array.isArray(membresiasData) ? membresiasData : []);
            } catch (error) {
                if (!ignore) {
                    openModalSwal({
                        icon: "error",
                        title: "No se pudo cargar el catalogo POS",
                        text: getApiErrorMessage(error, "Revisa la sede o el catalogo configurado para el punto de venta."),
                    });
                }
            } finally {
                if (!ignore) {
                    setLoadingCatalogo(false);
                }
            }
        };

        loadCatalogo();

        return () => {
            ignore = true;
        };
    }, [sedeId]);

    const categorias = useMemo(() => (
        ["Todos", ...new Set(productos.map((producto) => producto.categoria).filter(Boolean))]
    ), [productos]);

    const productosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return productos.filter((producto) => {
            const coincideCategoria = categoriaActiva === "Todos" || producto.categoria === categoriaActiva;
            const coincideTexto = !texto
                || producto.nombre.toLowerCase().includes(texto)
                || producto.descripcion.toLowerCase().includes(texto)
                || producto.categoria.toLowerCase().includes(texto);

            return coincideCategoria && coincideTexto;
        });
    }, [busqueda, categoriaActiva, productos]);

    const resumen = useMemo(() => {
        const subtotal = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
        const iva = 0;
        const total = subtotal + iva;
        const cantidadProductos = carrito.reduce((acc, item) => acc + item.cantidad, 0);

        return { subtotal, iva, total, cantidadProductos };
    }, [carrito]);

    const membresiaSeleccionada = useMemo(
        () => membresias.find((item) => String(item.id) === String(membresiaSeleccionadaId)) || null,
        [membresias, membresiaSeleccionadaId]
    );

    const totalGeneral = useMemo(
        () => resumen.total + Number(membresiaSeleccionada?.precio || 0),
        [resumen.total, membresiaSeleccionada]
    );

    const ventaAbiertaActiva = useMemo(
        () => ventasAbiertas.find((venta) => String(venta.id) === String(draftId)) || null,
        [ventasAbiertas, draftId]
    );

    const borradorGuardadoActivo = useMemo(
        () => borradores.find((draft) => String(draft.id) === String(draftId)) || null,
        [borradores, draftId]
    );

    const buscarCliente = async () => {
        const cedula = cedulaCliente.trim();

        if (!cedula) {
            setCliente(null);
            return;
        }

        setBuscandoCliente(true);

        try {
            const { data } = await apiClient.get("/gimnasio/personas/buscar", {
                params: { cedula },
            });
            const ventaAbierta = ventasAbiertas.find((venta) => (
                String(venta.persona_id || "") === String(data.id || "")
                || String(venta.cedula || "").replace(/\D/g, "") === String(data.cedula || "").replace(/\D/g, "")
            ));
            const borradorAbierto = borradores.find((draft) => (
                String(draft.persona_id || "") === String(data.id || "")
                || String(draft.cedula || "").replace(/\D/g, "") === String(data.cedula || "").replace(/\D/g, "")
            ));

            if (ventaAbierta) {
                cargarBorrador(ventaAbierta, data);
                return;
            }

            if (borradorAbierto) {
                cargarBorrador(borradorAbierto, data);
                return;
            }

            const ventasAbiertasPersona = await listVentasAbiertasPuntoVenta({
                personaId: data.id,
                sedeId: sedeFiltroEfectiva,
            }).catch(() => []);
            const ventaAbiertaRemota = Array.isArray(ventasAbiertasPersona) && ventasAbiertasPersona.length
                ? ventasAbiertasPersona[0]
                : null;

            if (ventaAbiertaRemota) {
                cargarBorrador(ventaAbiertaRemota, data);
                return;
            }

            setCliente(data);
        } catch (error) {
            setCliente(null);
            openModalSwal({
                icon: "error",
                title: "No se encontró la persona",
                text: getApiErrorMessage(error, "Verifica la cédula e intenta nuevamente."),
            });
        } finally {
            setBuscandoCliente(false);
        }
    };

    const guardarBorrador = useCallback(async () => {
        if (!cliente || !sedeId) return;
        if (ventaAbiertaActiva) return null;

        try {
            const draft = await guardarBorradorPuntoVenta({
                id: draftId ?? null,
                sede_id: Number(sedeId),
                persona_id: cliente?.id ?? null,
                membresia_id: membresiaSeleccionada?.id ?? null,
                membresia_precio: Number(membresiaSeleccionada?.precio || 0),
                forma_pago: estadoPago === "PENDIENTE" ? "PENDIENTE" : metodoPago,
                estado_pago: estadoPago,
                referencia: referenciaDraft || `POS-${Date.now()}`,
                observacion: cliente?.es_socio
                    ? `Borrador POS | Socio ${cliente.socio?.codigo_socio || cliente.cedula}`
                    : "Borrador POS",
                items: carrito.map((item) => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio,
                    costo_unitario: item.precio_costo,
                    tipo_precio: item.tipo_precio,
                })),
            });

            if (draft?.id) {
                setDraftId(draft.id);
                setReferenciaDraft(draft.referencia || referenciaDraft);
            }
            await refrescarBorradores();
            return draft;
        } catch (error) {
            console.warn("No se pudo guardar el borrador del POS:", error);
            return null;
        }
    }, [
        cliente,
        sedeId,
        draftId,
        membresiaSeleccionada,
        estadoPago,
        metodoPago,
        referenciaDraft,
        carrito,
        refrescarBorradores,
        ventaAbiertaActiva,
    ]);

    useEffect(() => {
        if (!cliente || !sedeId) return;

        if (guardadoDraftTimerRef.current) {
            window.clearTimeout(guardadoDraftTimerRef.current);
        }

        guardadoDraftTimerRef.current = window.setTimeout(() => {
            guardarBorrador();
        }, 500);

        return () => {
            if (guardadoDraftTimerRef.current) {
                window.clearTimeout(guardadoDraftTimerRef.current);
            }
        };
    }, [
        cliente,
        sedeId,
        draftId,
        carrito,
        membresiaSeleccionadaId,
        metodoPago,
        estadoPago,
        guardarBorrador,
    ]);

    const cargarBorrador = (draft, personaOverride = null) => {
        if (!draft) return;

        setDraftId(draft.id);
        setSedeId(String(draft.sede_id || ""));
        setCedulaCliente(draft.cedula || "");
        setEstadoPago(draft.metadata?.estado_pago_final || draft.estado_pago || "PAGADO");
        setMetodoPago(draft.forma_pago && draft.forma_pago !== "PENDIENTE" ? draft.forma_pago : "EFECTIVO");
        setMembresiaSeleccionadaId(draft.membresia_id ? String(draft.membresia_id) : "");
        setReferenciaDraft(draft.referencia || "");

        const personaBase = personaOverride ? {
            ...personaOverride,
            id: personaOverride.id ?? draft.persona_id,
            cedula: personaOverride.cedula || draft.cedula,
            nombres: personaOverride.nombres || draft.nombre || draft.cliente_nombre || "Consumidor final",
            es_socio: personaOverride.es_socio ?? Boolean(draft.codigo_socio),
            socio: personaOverride.socio || (draft.codigo_socio
                ? { codigo_socio: draft.codigo_socio, membresia_nombre: "" }
                : null),
        } : {
            id: draft.persona_id,
            cedula: draft.cedula,
            nombres: draft.nombre || draft.cliente_nombre || "Consumidor final",
            es_socio: Boolean(draft.codigo_socio),
            socio: draft.codigo_socio
                ? { codigo_socio: draft.codigo_socio, membresia_nombre: "" }
                : null,
            deuda: { saldo_total: 0, tiene_deuda: false },
        };
        setCliente(personaBase);

        const detallesVenta = Array.isArray(draft.items)
            ? draft.items
            : Array.isArray(draft.detalles)
                ? draft.detalles
                : [];

        const membresiaDetalle = detallesVenta.find((item) => String(item?.tipo_detalle || "").toUpperCase() === "MEMBRESIA" || item?.membresia_id);
        if (membresiaDetalle?.membresia_id) {
            setMembresiaSeleccionadaId(String(membresiaDetalle.membresia_id));
        }

        const itemsDraft = detallesVenta
            .filter((item) => String(item?.tipo_detalle || "").toUpperCase() !== "MEMBRESIA" && !item?.membresia_id)
            .map((item) => {
            const producto = productos.find((productoActual) => productoActual.producto_id === item.producto_id || productoActual.id === item.producto_id);

            return {
                id: producto?.id ?? item.producto_id,
                producto_id: item.producto_id,
                nombre: producto?.nombre || `Producto ${item.producto_id}`,
                categoria: producto?.categoria || "General",
                descripcion: producto?.descripcion || "",
                imagen_url: producto?.imagen_url || "",
                precio: Number(item.precio_unitario || producto?.precio || 0),
                precio_costo: item.costo_unitario ?? producto?.precio_costo ?? null,
                tipo_precio: item.tipo_precio || "VENTA",
                cantidad: Number(item.cantidad || 0),
                stock: producto?.stock ?? 0,
                esPopular: Boolean(producto?.esPopular),
            };
        });
        setCarrito(itemsDraft);
    };

    const agregarProducto = (producto) => {
        setCarrito((prev) => {
            const existe = prev.find((item) => item.id === producto.id);

            if (existe) {
                return prev.map((item) =>
                    item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            }

            return [...prev, { ...producto, cantidad: 1 }];
        });
    };

    const aumentarCantidad = (id) => {
        setCarrito((prev) => prev.map((item) => (
            item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item
        )));
    };

    const disminuirCantidad = (id) => {
        setCarrito((prev) => prev
            .map((item) => (item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item))
            .filter((item) => item.cantidad > 0));
    };

    const eliminarProducto = (id) => {
        setCarrito((prev) => prev.filter((item) => item.id !== id));
    };

    const limpiarVenta = () => {
        setCarrito([]);
        setMembresiaSeleccionadaId("");
        setBusqueda("");
        setCategoriaActiva("Todos");
        setCliente(null);
        setCedulaCliente("");
        setEstadoPago("PAGADO");
        setMetodoPago("EFECTIVO");
        setDraftId(null);
        setReferenciaDraft("");
        window.requestAnimationFrame(() => {
            cedulaInputRef.current?.focus();
        });
    };

    const confirmarVenta = async () => {
        if ((!carrito.length && !membresiaSeleccionada) || !sedeId) return;

        setGuardandoVenta(true);

        try {
            if (borradorGuardadoActivo) {
                const response = await confirmarBorradorPuntoVenta(draftId);

                await openModalSwal({
                    icon: "success",
                    title: estadoPago === "PENDIENTE" ? "Cuenta pendiente registrada" : "Venta registrada",
                    html: `
                        <div style="text-align:left">
                            <p><strong>Cliente:</strong> ${cliente?.nombres || "Consumidor final"}</p>
                            <p><strong>Total general:</strong> ${formatMoney(response.total_general || 0)}</p>
                            <p><strong>Estado de pago:</strong> ${estadoPago}</p>
                            <p><strong>Operaciones:</strong> ${(response.ventas || []).map((item) => `${item.tipo_venta} ${item.referencia}`).join("<br/>")}</p>
                            ${
                                response?.deuda_actualizada?.tiene_deuda
                                    ? `<p><strong>Saldo pendiente del cliente:</strong> ${formatMoney(response.deuda_actualizada.saldo_total)}</p>`
                                    : ""
                            }
                        </div>
                    `,
                    confirmButtonText: "Continuar",
                });

                if (cliente && response?.deuda_actualizada) {
                    setCliente((prev) => prev ? { ...prev, deuda: response.deuda_actualizada } : prev);
                }

                setBorradores((prev) => prev.filter((item) => String(item.id) !== String(draftId)));
                await refrescarBorradores();
                limpiarVenta();
                return;
            }

            const response = await procesarVentaRapida({
                ventaId: ventaAbiertaActiva?.id ?? null,
                sedeId: Number(sedeId),
                personaId: cliente?.id ?? null,
                formaPago: estadoPago === "PENDIENTE" ? null : metodoPago,
                estadoPago,
                observacion: cliente?.es_socio
                    ? `Venta POS Revive | Socio ${cliente.socio?.codigo_socio || cliente.cedula}`
                    : "Venta POS Revive",
                referencia: `POS-REVIVE-${Date.now()}`,
                membresiaId: membresiaSeleccionada?.id ?? null,
                items: carrito.map((item) => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio,
                    costo_unitario: item.precio_costo,
                    tipo_precio: item.tipo_precio,
                })),
            });

            await openModalSwal({
                icon: "success",
                title: estadoPago === "PENDIENTE" ? "Cuenta pendiente registrada" : "Venta registrada",
                html: `
                    <div style="text-align:left">
                        <p><strong>Cliente:</strong> ${cliente?.nombres || "Consumidor final"}</p>
                        <p><strong>Total general:</strong> ${formatMoney(response.total_general || 0)}</p>
                        <p><strong>Estado de pago:</strong> ${estadoPago}</p>
                        <p><strong>Operaciones:</strong> ${(response.ventas || []).map((item) => `${item.tipo_venta} ${item.referencia}`).join("<br/>")}</p>
                        ${
                            response?.deuda_actualizada?.tiene_deuda
                                ? `<p><strong>Saldo pendiente del cliente:</strong> ${formatMoney(response.deuda_actualizada.saldo_total)}</p>`
                                : ""
                        }
                    </div>
                `,
                confirmButtonText: "Continuar",
            });

            if (cliente && response?.deuda_actualizada) {
                setCliente((prev) => prev ? { ...prev, deuda: response.deuda_actualizada } : prev);
            }
            await refrescarBorradores();
            limpiarVenta();
        } catch (error) {
            openModalSwal({
                icon: "error",
                title: "No se pudo registrar la venta",
                text: getApiErrorMessage(error, "Revisa el stock o la configuracion del producto e intenta de nuevo."),
            });
        } finally {
            setGuardandoVenta(false);
        }
    };

    const clienteSeleccionado = Boolean(cliente);
    const deudaActualCliente = Number(cliente?.deuda?.saldo_total || 0);
    const borradorActivo = useMemo(() => {
        const ventaActivaPorId = ventasAbiertas.find((venta) => String(venta.id) === String(draftId));
        if (ventaActivaPorId) return ventaActivaPorId;

        const draftById = borradores.find((draft) => String(draft.id) === String(draftId));
        if (draftById) return draftById;

        const clienteActualId = cliente?.id ? String(cliente.id) : "";
        const clienteActualCedula = String(cliente?.cedula || cedulaCliente || "").replace(/\D/g, "");

        return ventasAbiertas.find((draft) => {
            const draftPersonaId = draft?.persona_id ? String(draft.persona_id) : "";
            const draftCedula = String(draft?.cedula || "").replace(/\D/g, "");

            return (
                (clienteActualId && draftPersonaId && clienteActualId === draftPersonaId)
                || (clienteActualCedula && draftCedula && clienteActualCedula === draftCedula)
            );
        }) || borradores.find((draft) => {
            const draftPersonaId = draft?.persona_id ? String(draft.persona_id) : "";
            const draftCedula = String(draft?.cedula || "").replace(/\D/g, "");

            return (
                (clienteActualId && draftPersonaId && clienteActualId === draftPersonaId)
                || (clienteActualCedula && draftCedula && clienteActualCedula === draftCedula)
            );
        }) || null;
    }, [ventasAbiertas, borradores, draftId, cliente, cedulaCliente]);

    const borradorActivoTotal = borradorActivo
        ? (String(borradorActivo.id) === String(draftId) ? totalGeneral : Number(borradorActivo.total || borradorActivo.subtotal || 0))
        : 0;
    const borradorActivoItems = borradorActivo
        ? (String(borradorActivo.id) === String(draftId) ? resumen.cantidadProductos : Number(borradorActivo.items_count || 0))
        : 0;
    const cuentasAbiertasVisibles = ventasAbiertas;
    const usarVentasAbiertas = ventasAbiertas.length > 0;

    return (
        <div className="revive-pos-page">
            <style>{`
                .revive-pos-page {
                    --rev-black: #0b0b0b;
                    --rev-gold: var(--tg-primary);
                    --rev-gold-soft: rgba(240, 180, 0, 0.14);
                    --rev-bg: var(--tg-content-bg);
                    --rev-border: rgba(17, 17, 17, 0.12);
                    --rev-text: var(--tg-text-dark);
                    --rev-muted: rgba(17, 17, 17, 0.62);
                    --rev-green: #16a34a;
                    background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(243,241,235,0.94) 100%);
                    color: var(--rev-text);
                    min-height: calc(100vh - 80px);
                    padding: 24px;
                }

                .rev-page-header,
                .rev-section-head {
                    display: flex;
                    justify-content: space-between;
                    gap: 18px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .rev-page-header {
                    margin-bottom: 20px;
                }

                .rev-kicker {
                    margin: 0 0 6px;
                    color: var(--rev-gold);
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.24em;
                    text-transform: uppercase;
                }

                .rev-title {
                    margin: 0;
                    font-size: 34px;
                    line-height: 1;
                    font-weight: 950;
                }

                .rev-subtitle {
                    margin: 8px 0 0;
                    color: var(--rev-muted);
                    font-size: 14px;
                    max-width: 720px;
                }

                .rev-user-boxes {
                    display: flex;
                    gap: 12px;
                    align-items: stretch;
                    flex-wrap: wrap;
                }

                .rev-user-box,
                .rev-avatar {
                    border: 1px solid var(--rev-border);
                    background: rgba(255,255,255,0.92);
                    border-radius: 10px;
                    box-shadow: var(--tg-shadow);
                }

                .rev-user-box {
                    padding: 12px 14px;
                    min-width: 170px;
                }

                .rev-user-box span {
                    display: block;
                    color: var(--rev-muted);
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 0.16em;
                    text-transform: uppercase;
                }

                .rev-user-box strong {
                    display: block;
                    margin-top: 6px;
                    font-size: 14px;
                    font-weight: 900;
                }

                .rev-avatar {
                    width: 52px;
                    display: grid;
                    place-items: center;
                    background: var(--rev-gold);
                    color: #000;
                    font-weight: 900;
                }

                .rev-layout {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 410px;
                    gap: 20px;
                    align-items: start;
                }

                .rev-flow-shell {
                    display: grid;
                    gap: 14px;
                    margin-bottom: 18px;
                }

                .rev-flow-top {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    align-items: center;
                    padding: 14px 16px;
                    border: 1px solid var(--rev-border);
                    background: #ffffff;
                    border-radius: 14px;
                    box-shadow: 0 8px 24px rgba(17, 24, 39, 0.06);
                }

                .rev-flow-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .rev-flow-badge {
                    width: 42px;
                    height: 42px;
                    display: grid;
                    place-items: center;
                    border-radius: 10px;
                    background: #eef4ff;
                    border: 1px solid #c7d7f2;
                    font-weight: 900;
                    color: #16325c;
                }

                .rev-flow-title h2 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 950;
                }

                .rev-flow-title p {
                    margin: 4px 0 0;
                    color: var(--rev-muted);
                    font-size: 13px;
                }

                .rev-step-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    align-items: center;
                }

                .rev-step-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    border: 1px solid #d8e1ef;
                    border-radius: 999px;
                    background: #fff;
                    color: #2f3e55;
                    font-size: 12px;
                    font-weight: 800;
                }

                .rev-step-pill.active {
                    border-color: #9fc0f2;
                    color: #123d7a;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
                }

                .rev-step-pill.done {
                    background: #f4f8ff;
                }

                .rev-step-dot {
                    width: 20px;
                    height: 20px;
                    display: grid;
                    place-items: center;
                    border-radius: 999px;
                    background: #eef2f7;
                    font-size: 11px;
                    font-weight: 900;
                }

                .rev-step-pill.active .rev-step-dot,
                .rev-step-pill.done .rev-step-dot {
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .rev-stage-card {
                    border: 1px solid var(--rev-border);
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 10px 28px rgba(17, 24, 39, 0.06);
                }

                .rev-stage-body {
                    padding: 14px;
                }

                .rev-stage-inner {
                    max-width: none;
                    margin: 0 auto;
                    display: grid;
                    gap: 14px;
                }

                .rev-stage-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 14px;
                    align-items: stretch;
                }

                .rev-stage-grid-full {
                    grid-column: 1 / -1;
                }

                .rev-search-panel {
                    display: grid;
                    gap: 14px;
                    padding: 8px 0 0;
                    justify-items: center;
                }

                .rev-search-card {
                    border: 1px solid #dbe3ee;
                    border-radius: 14px;
                    background: rgba(255,255,255,0.95);
                    padding: 18px;
                    display: grid;
                    gap: 12px;
                    width: min(560px, 100%);
                    justify-self: center;
                }

                .rev-search-card-top {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .rev-search-title {
                    display: grid;
                    gap: 4px;
                    justify-items: center;
                    text-align: center;
                }

                .rev-search-title strong {
                    font-size: 16px;
                    line-height: 1.2;
                    font-weight: 950;
                    color: #111827;
                }

                .rev-search-title span {
                    color: var(--rev-muted);
                    font-size: 12px;
                    font-weight: 700;
                }

                .rev-search-note {
                    margin: 0;
                    color: #244468;
                    font-size: 13px;
                    font-weight: 700;
                    text-align: center;
                }

                .rev-search-selected {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    align-items: center;
                    padding: 12px 14px;
                    border: 1px solid rgba(240,180,0,0.22);
                    border-radius: 12px;
                    background: linear-gradient(180deg, rgba(255,248,224,0.95) 0%, rgba(255,255,255,0.98) 100%);
                }

                .rev-search-selected strong {
                    display: block;
                    color: #111827;
                    font-size: 14px;
                    font-weight: 950;
                }

                .rev-search-selected span {
                    display: block;
                    color: var(--rev-muted);
                    font-size: 12px;
                    margin-top: 4px;
                }

                .rev-search-selected .rev-badge {
                    white-space: nowrap;
                }

                .rev-client-grid-shell {
                    display: grid;
                    gap: 12px;
                    margin-top: 0;
                }

                .rev-client-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
                    gap: 14px;
                }

                .rev-client-tile {
                    border: 1px solid var(--rev-border);
                    background: #fff;
                    border-radius: 14px;
                    padding: 16px;
                    text-align: left;
                    cursor: pointer;
                    transition: 0.18s ease;
                    min-height: 220px;
                    display: grid;
                    gap: 14px;
                }

                .rev-client-tile:hover {
                    transform: translateY(-2px);
                    border-color: var(--rev-gold);
                    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
                }

                .rev-client-tile.active {
                    border-color: var(--rev-gold);
                    background: linear-gradient(180deg, #fffef5 0%, #fff4cf 100%);
                }

                .rev-client-tile-top {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }

                .rev-client-initials {
                    width: 58px;
                    height: 58px;
                    border-radius: 999px;
                    background: linear-gradient(180deg, #ffe9b8 0%, #f6d889 100%);
                    display: grid;
                    place-items: center;
                    font-size: 20px;
                    font-weight: 950;
                    color: #102a5c;
                    flex: 0 0 auto;
                }

                .rev-client-main {
                    min-width: 0;
                    display: grid;
                    gap: 5px;
                    flex: 1;
                }

                .rev-client-main h4 {
                    margin: 0;
                    font-size: 16px;
                    line-height: 1.25;
                    font-weight: 950;
                    color: #111827;
                    word-break: break-word;
                }

                .rev-client-main p {
                    margin: 0;
                    color: var(--rev-muted);
                    font-size: 12px;
                    line-height: 1.35;
                }

                .rev-client-tile-footer {
                    display: flex;
                    justify-content: stretch;
                    gap: 12px;
                    align-items: center;
                    margin-top: auto;
                    flex-wrap: nowrap;
                }

                .rev-client-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: nowrap;
                    justify-content: stretch;
                    align-items: center;
                    width: 100%;
                }

                .rev-client-summary {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }

                .rev-client-summary-card {
                    border: 1px solid #dbe3ee;
                    border-radius: 12px;
                    padding: 12px;
                    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
                    display: grid;
                    gap: 4px;
                }

                .rev-client-summary-card span {
                    color: var(--rev-muted);
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }

                .rev-client-summary-card strong {
                    color: #0f3e9d;
                    font-size: 18px;
                    font-weight: 950;
                    line-height: 1.1;
                }

                .rev-status-panel {
                    border: 1px solid #dbe3ee;
                    border-radius: 14px;
                    background: #fff;
                    padding: 16px;
                }

                .rev-search-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 14px;
                    align-items: center;
                }

                .rev-search-row-centered {
                    width: 100%;
                    max-width: 520px;
                    margin: 0;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 150px;
                    gap: 14px;
                    align-items: center;
                    justify-content: stretch;
                }

                .rev-search-caption {
                    color: var(--rev-muted);
                    font-size: 13px;
                    line-height: 1.5;
                    text-align: center;
                    max-width: 760px;
                    margin: 8px auto 0;
                }

                .rev-status-panel {
                    display: grid;
                    place-items: center;
                    min-height: 96px;
                    width: 100%;
                    background: #fdfefe;
                }

                .rev-status-panel.is-empty {
                    grid-column: 1 / -1;
                    min-height: 210px;
                    padding: 28px 18px;
                    width: 100%;
                }

                .rev-status-panel.is-success {
                    min-height: 140px;
                }

                .rev-status-panel.is-error {
                    min-height: 96px;
                }

                .rev-status-empty,
                .rev-status-error,
                .rev-status-success {
                    text-align: center;
                    color: var(--rev-muted);
                }

                .rev-status-empty {
                    display: grid;
                    justify-items: center;
                    gap: 10px;
                    max-width: none;
                    width: 100%;
                }

                .rev-status-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    background: rgba(240, 180, 0, 0.12);
                    color: var(--tg-primary-strong);
                }

                .rev-status-error {
                    width: 100%;
                    max-width: 100%;
                    padding-inline: 24px;
                }

                .rev-status-empty strong,
                .rev-status-error strong,
                .rev-status-success strong {
                    display: block;
                    color: #1a2f52;
                    font-size: 18px;
                    margin-bottom: 2px;
                }

                .rev-status-error strong {
                    color: #b91c1c;
                }

                .rev-status-line {
                    display: block;
                    line-height: 1.55;
                    max-width: 560px;
                    text-align: center;
                }

                .rev-status-line.emphasis {
                    font-weight: 950;
                    color: #1a2f52;
                }

                .rev-status-note {
                    display: block;
                    margin-top: 4px;
                    font-size: 12px;
                    line-height: 1.5;
                    color: rgba(17, 17, 17, 0.56);
                    font-style: italic;
                }

                .rev-preview-card {
                    display: grid;
                    gap: 14px;
                    max-width: 760px;
                    margin: 0 auto;
                }

                .rev-preview-header {
                    display: flex;
                    gap: 14px;
                    align-items: center;
                }

                .rev-preview-avatar {
                    width: 68px;
                    height: 68px;
                    border-radius: 18px;
                    display: grid;
                    place-items: center;
                    background: var(--rev-gold);
                    color: #000;
                    font-size: 24px;
                    font-weight: 950;
                }

                .rev-preview-header h4 {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 950;
                }

                .rev-preview-header p {
                    margin: 5px 0 0;
                    color: var(--rev-muted);
                    font-size: 13px;
                }

                .rev-preview-metrics {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 10px;
                }

                .rev-preview-metric {
                    border: 1px solid var(--rev-border);
                    border-radius: 12px;
                    padding: 12px;
                    background: rgba(255,255,255,0.95);
                }

                .rev-preview-metric span {
                    display: block;
                    color: var(--rev-muted);
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .rev-preview-metric strong {
                    display: block;
                    margin-top: 5px;
                    font-size: 16px;
                    font-weight: 950;
                }

                .rev-stage-note {
                    border: 1px solid rgba(59,130,246,0.18);
                    background: rgba(59,130,246,0.08);
                    color: #244468;
                    border-radius: 12px;
                    padding: 12px 14px;
                    font-size: 13px;
                    font-weight: 700;
                    width: 100%;
                }

                .rev-card,
                .rev-client-card,
                .rev-cart-card {
                    border: 1px solid var(--rev-border);
                    background: rgba(255,255,255,0.95);
                    border-radius: 14px;
                    box-shadow: var(--tg-shadow);
                }

                .rev-card-body {
                    padding: 22px;
                }

                .rev-search-row,
                .rev-client-search,
                .rev-inline-row {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .rev-inline-row {
                    flex-wrap: wrap;
                }

                .rev-input,
                .rev-select {
                    height: 46px;
                    border: 1px solid var(--rev-border);
                    background: #fff;
                    color: var(--rev-text);
                    padding: 0 14px;
                    outline: none;
                    font-weight: 700;
                    font-size: 13px;
                    border-radius: 10px;
                }

                .rev-input:focus,
                .rev-select:focus {
                    border-color: var(--rev-gold);
                    box-shadow: 0 0 0 4px rgba(240, 180, 0, 0.12);
                }

                .rev-search-input {
                    flex: 1;
                }

                .rev-category-tabs {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin: 18px 0;
                }

                .rev-tab {
                    border: 1px solid var(--rev-border);
                    background: #fff;
                    color: #4b5563;
                    padding: 10px 14px;
                    font-size: 12px;
                    font-weight: 900;
                    border-radius: 999px;
                    cursor: pointer;
                }

                .rev-tab:hover,
                .rev-tab-active {
                    border-color: var(--rev-gold);
                    background: var(--rev-gold);
                    color: #000;
                }

                .rev-products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 14px;
                }

                .rev-product-card {
                    border: 1px solid var(--rev-border);
                    background: #fff;
                    padding: 14px;
                    text-align: left;
                    border-radius: 14px;
                    cursor: pointer;
                    transition: 0.18s ease;
                }

                .rev-product-card:hover {
                    border-color: var(--rev-gold);
                    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
                    transform: translateY(-2px);
                }

                .rev-product-top {
                    display: flex;
                    gap: 10px;
                    align-items: flex-start;
                }

                .rev-product-icon {
                    width: 42px;
                    height: 42px;
                    display: grid;
                    place-items: center;
                    border-radius: 10px;
                    background: var(--rev-gold-soft);
                    color: #000;
                    font-size: 12px;
                    font-weight: 900;
                    overflow: hidden;
                    flex: 0 0 auto;
                }

                .rev-product-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                }

                .rev-product-info {
                    min-width: 0;
                    flex: 1;
                }

                .rev-product-info h3 {
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.3;
                    font-weight: 900;
                }

                .rev-product-info p {
                    margin: 4px 0 0;
                    color: var(--rev-muted);
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                }

                .rev-price {
                    border: 1px solid rgba(240,180,0,0.45);
                    background: var(--rev-gold-soft);
                    padding: 5px 8px;
                    font-size: 13px;
                    white-space: nowrap;
                    border-radius: 8px;
                }

                .rev-product-description {
                    min-height: 38px;
                    margin: 12px 0 0;
                    color: var(--rev-muted);
                    font-size: 13px;
                    line-height: 1.45;
                }

                .rev-product-footer,
                .rev-summary-row,
                .rev-total-row,
                .rev-cart-item-head,
                .rev-cart-item-body {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    align-items: center;
                }

                .rev-product-footer {
                    margin-top: 14px;
                }

                .rev-badge,
                .rev-add-label {
                    border: 1px solid var(--rev-border);
                    background: #fafafa;
                    color: var(--rev-muted);
                    padding: 6px 9px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    border-radius: 999px;
                }

                .rev-badge-gold {
                    border-color: var(--rev-gold);
                    background: var(--rev-gold-soft);
                    color: #111;
                }

                .rev-add-label {
                    border-color: #111;
                    background: #111;
                    color: #fff;
                }

                button.rev-add-label {
                    appearance: none;
                    cursor: pointer;
                    border: 1px solid #111;
                }

                .rev-side {
                    position: sticky;
                    top: 20px;
                    display: grid;
                    gap: 14px;
                }

                .rev-client-card {
                    padding: 18px;
                }

                .rev-client-found {
                    margin-top: 14px;
                    border: 1px solid var(--rev-border);
                    background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(240,180,0,0.08) 100%);
                    border-radius: 12px;
                    padding: 14px;
                }

                .rev-client-found h4 {
                    margin: 0 0 6px;
                    font-size: 16px;
                }

                .rev-client-found p,
                .rev-client-meta {
                    margin: 4px 0 0;
                    color: var(--rev-muted);
                    font-size: 12px;
                    font-weight: 700;
                }

                .rev-client-chip-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 10px;
                }

                .rev-client-chip {
                    border: 1px solid rgba(240,180,0,0.28);
                    background: rgba(240,180,0,0.12);
                    color: #111;
                    padding: 6px 10px;
                    border-radius: 999px;
                    font-size: 11px;
                    font-weight: 800;
                }

                .rev-error {
                    margin: 10px 0 0;
                    color: #dc2626;
                    font-size: 12px;
                    font-weight: 800;
                }

                .rev-cart-head {
                    border-bottom: 2px solid var(--rev-gold);
                    background: #0e0e0e;
                    color: #fff;
                    padding: 18px;
                    border-radius: 14px 14px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .rev-cart-head h2 {
                    margin: 4px 0 0;
                    font-size: 22px;
                    font-weight: 900;
                }

                .rev-cart-head p {
                    margin: 5px 0 0;
                    color: rgba(255,255,255,0.72);
                    font-size: 13px;
                }

                .rev-cart-icon {
                    width: 46px;
                    height: 46px;
                    display: grid;
                    place-items: center;
                    border-radius: 12px;
                    background: var(--rev-gold);
                    color: #000;
                    font-size: 22px;
                }

                .rev-cart-list {
                    max-height: 390px;
                    overflow-y: auto;
                    padding: 14px;
                    display: grid;
                    gap: 10px;
                    background: rgba(243,241,235,0.52);
                }

                .rev-empty-cart {
                    min-height: 220px;
                    display: grid;
                    place-items: center;
                    border: 1px dashed #d1d5db;
                    background: #fff;
                    text-align: center;
                    padding: 24px;
                    border-radius: 12px;
                }

                .rev-empty-cart div:first-child {
                    margin: 0 auto 12px;
                    width: 62px;
                    height: 62px;
                    display: grid;
                    place-items: center;
                    border-radius: 12px;
                    background: rgba(240,180,0,0.12);
                    font-size: 30px;
                }

                .rev-cart-item {
                    border: 1px solid var(--rev-border);
                    background: #fff;
                    padding: 13px;
                    border-radius: 12px;
                }

                .rev-cart-item h4 {
                    margin: 0;
                    font-size: 13px;
                    font-weight: 900;
                }

                .rev-cart-item p {
                    margin: 4px 0 0;
                    color: var(--rev-muted);
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                }

                .rev-remove-btn {
                    border: 1px solid var(--rev-border);
                    background: #fff;
                    color: var(--rev-muted);
                    font-size: 16px;
                    font-weight: 900;
                    cursor: pointer;
                    border-radius: 8px;
                }

                .rev-cart-item-body {
                    margin-top: 12px;
                }

                .rev-qty-control {
                    display: inline-flex;
                    align-items: center;
                    border: 1px solid var(--rev-border);
                    background: #fafafa;
                    border-radius: 10px;
                }

                .rev-qty-control button,
                .rev-qty-control span {
                    width: 36px;
                    height: 34px;
                    display: grid;
                    place-items: center;
                    border: 0;
                    background: transparent;
                    color: var(--rev-text);
                    font-weight: 900;
                }

                .rev-qty-control button {
                    cursor: pointer;
                    font-size: 16px;
                }

                .rev-line-total {
                    text-align: right;
                }

                .rev-line-total small {
                    display: block;
                    color: var(--rev-muted);
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                }

                .rev-line-total strong {
                    display: block;
                    margin-top: 2px;
                    font-size: 17px;
                    font-weight: 900;
                }

                .rev-cart-summary {
                    border-top: 1px solid var(--rev-border);
                    padding: 16px;
                }

                .rev-pay-card {
                    border: 1px solid rgba(240,180,0,0.28);
                    background: linear-gradient(180deg, rgba(255,244,207,0.92) 0%, rgba(255,255,255,0.98) 100%);
                    border-radius: 14px;
                    padding: 16px;
                    margin-bottom: 12px;
                    display: grid;
                    gap: 10px;
                }

                .rev-pay-card-top {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                    align-items: flex-start;
                }

                .rev-pay-card-top span {
                    display: block;
                    color: var(--rev-muted);
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                }

                .rev-pay-card-top strong {
                    display: block;
                    margin-top: 6px;
                    font-size: 34px;
                    line-height: 1;
                    font-weight: 950;
                    color: #111;
                }

                .rev-pay-mini {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 8px;
                }

                .rev-pay-mini div {
                    border: 1px solid #eadfc2;
                    background: rgba(255,255,255,0.86);
                    border-radius: 12px;
                    padding: 10px 12px;
                }

                .rev-pay-mini span {
                    display: block;
                    color: var(--rev-muted);
                    font-size: 10px;
                    font-weight: 900;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                }

                .rev-pay-mini strong {
                    display: block;
                    margin-top: 5px;
                    font-size: 15px;
                    font-weight: 950;
                    color: #111;
                }

                .rev-summary-box {
                    border: 1px solid var(--rev-border);
                    background: #fafafa;
                    padding: 14px;
                    margin-bottom: 14px;
                    border-radius: 12px;
                }

                .rev-summary-row {
                    color: var(--rev-muted);
                    font-size: 13px;
                    font-weight: 800;
                    margin-bottom: 8px;
                }

                .rev-summary-row strong,
                .rev-total-row strong {
                    color: var(--rev-text);
                    font-weight: 900;
                }

                .rev-summary-line {
                    height: 1px;
                    background: var(--rev-border);
                    margin: 12px 0;
                }

                .rev-total-row span {
                    color: var(--rev-muted);
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.18em;
                    text-transform: uppercase;
                }

                .rev-total-row strong {
                    font-size: 30px;
                }

                .rev-pay-methods {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 12px;
                }

                .rev-pay-methods button {
                    flex: 1 1 auto;
                    height: 42px;
                    border: 1px solid var(--rev-border);
                    background: #fff;
                    color: #4b5563;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    cursor: pointer;
                    border-radius: 10px;
                }

                .rev-pay-methods button.active,
                .rev-pay-methods button:hover {
                    border-color: var(--rev-gold);
                    background: var(--rev-gold);
                    color: #000;
                }

                .rev-debt-banner {
                    border: 1px solid rgba(185, 28, 28, 0.16);
                    background: rgba(254, 242, 242, 0.96);
                    color: #991b1b;
                    border-radius: 12px;
                    padding: 12px 14px;
                    font-size: 13px;
                    font-weight: 800;
                }

                .rev-membership-shell {
                    margin: 18px 0 8px;
                    display: grid;
                    gap: 12px;
                }

                .rev-membership-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 12px;
                }

                .rev-membership-card {
                    border: 1px solid var(--rev-border);
                    background: #fffef8;
                    border-radius: 14px;
                    padding: 14px;
                    text-align: left;
                    cursor: pointer;
                    transition: 0.18s ease;
                }

                .rev-membership-card.active {
                    border-color: var(--rev-gold);
                    box-shadow: 0 10px 26px rgba(240, 180, 0, 0.14);
                    background: #fff7dd;
                }

                .rev-membership-card h4 {
                    margin: 0;
                    font-size: 15px;
                    font-weight: 950;
                }

                .rev-membership-card p {
                    margin: 8px 0 0;
                    color: var(--rev-muted);
                    font-size: 12px;
                    line-height: 1.45;
                }

                .rev-membership-meta {
                    display: flex;
                    justify-content: space-between;
                    gap: 10px;
                    align-items: center;
                    margin-top: 12px;
                    font-size: 12px;
                    font-weight: 900;
                }

                .rev-action-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-top: 12px;
                }

                .rev-actions-stack {
                    display: grid;
                    gap: 10px;
                }

                .rev-button,
                .rev-button.btn-add,
                .rev-button.btn-close {
                    width: 100%;
                    justify-content: center;
                }

                .rev-search-row-centered .rev-button {
                    width: 100%;
                }

                .rev-loading-shell {
                    min-height: 440px;
                    display: grid;
                    place-items: center;
                }

                .rev-disabled-stage {
                    opacity: 0.52;
                    pointer-events: none;
                    filter: grayscale(0.08);
                }

                @media (max-width: 1200px) {
                    .rev-layout {
                        grid-template-columns: 1fr 340px;
                    }
                }

                @media (max-width: 992px) {
                    .rev-layout {
                        grid-template-columns: 1fr;
                    }
                    .rev-side {
                        position: static;
                    }
                }

                @media (max-width: 768px) {
                    .revive-pos-page {
                        padding: 14px;
                    }

                    .rev-page-header,
                    .rev-section-head,
                    .rev-search-row,
                    .rev-client-search {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .rev-flow-top {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 16px;
                    }

                    .rev-pay-methods,
                    .rev-action-row {
                        grid-template-columns: 1fr;
                    }

                    .rev-search-actions {
                        grid-template-columns: 1fr;
                    }

                    .rev-search-row-centered {
                        grid-template-columns: 1fr;
                    }

                    .rev-search-selected {
                        flex-direction: column;
                        align-items: stretch;
                    }

                }

                @media (max-width: 560px) {
                    .rev-pay-mini {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            <section className="rev-flow-shell">
                <div className="rev-flow-top">
                    <div className="rev-flow-title">
                        <div className="rev-flow-badge">PV</div>
                        <div>
                            <h2>Venta</h2>
                            <p>Identifica al cliente y continúa con la venta.</p>
                        </div>
                    </div>

                    <div className="rev-step-row">
                        <StepPill active={!clienteSeleccionado} done={false}>Paso 1 · Buscar cliente</StepPill>
                        <StepPill active={clienteSeleccionado && carrito.length === 0} done={clienteSeleccionado}>Paso 2 · Elegir productos</StepPill>
                        <StepPill active={carrito.length > 0} done={false}>Paso 3 · Confirmar venta</StepPill>
                    </div>
                </div>

                {!clienteSeleccionado ? (
                    <div className="rev-stage-card">
                        <div className="rev-stage-body">
                            <div className="rev-stage-inner">
                                <div className="rev-stage-grid">
                                    <div className="rev-search-card">
                                        <div className="rev-search-card-top">
                                            <div className="rev-search-title">
                                                <strong>Buscar cédula</strong>
                                                <span>Trae al cliente y abre su cuenta de venta.</span>
                                            </div>
                                        </div>

                                        <form
                                            className="rev-search-row-centered"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                buscarCliente();
                                            }}
                                        >
                                            <input
                                                ref={cedulaInputRef}
                                                value={cedulaCliente}
                                                onChange={(event) => {
                                                    const soloDigitos = event.target.value.replace(/\D/g, "").slice(0, 10);
                                                    setCedulaCliente(soloDigitos);
                                                }}
                                                placeholder="Número de cédula"
                                                className="rev-input rev-search-input"
                                                maxLength={10}
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                            />
                                            <PremiumButton
                                                type="submit"
                                                variant="primary"
                                                disabled={buscandoCliente}
                                                sx={{ height: 46 }}
                                            >
                                                {buscandoCliente ? <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> : <SearchRoundedIcon sx={{ mr: 1, fontSize: 20 }} />}
                                                Buscar
                                            </PremiumButton>
                                        </form>
                                    </div>

                                    <div className="rev-client-grid-shell rev-stage-grid-full">
                                        <div className="rev-section-head" style={{ marginBottom: 2 }}>
                                            <div>
                                                <p className="rev-kicker">Facturas por cobrar</p>
                                                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950 }}>Facturas pendientes de pago</h3>
                                                <p style={{ color: "var(--rev-muted)", marginTop: 6 }}>
                                                    Retoma una factura pendiente para cobrarla cuando el cliente pague.
                                                </p>
                                                {(isAdmin || isCashier) ? (
                                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                                                        <Chip
                                                            label={isCashier && !isAdmin ? "Mi caja" : "Todas"}
                                                            clickable
                                                            color={filtroSedeAbiertas === "TODAS" ? "warning" : "default"}
                                                            onClick={() => setFiltroSedeAbiertas("TODAS")}
                                                            size="small"
                                                        />
                                                        {sedes.map((sede) => (
                                                            <Chip
                                                                key={sede.id}
                                                                label={sede.nombre}
                                                                clickable
                                                                color={String(filtroSedeAbiertas) === String(sede.id) ? "warning" : "default"}
                                                                onClick={() => setFiltroSedeAbiertas(String(sede.id))}
                                                                size="small"
                                                            />
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <PremiumButton
                                                type="button"
                                                variant="outline"
                                                onClick={refrescarBorradores}
                                                startIcon={<RefreshRoundedIcon fontSize="small" />}
                                                className="btn-view"
                                                sx={{ minHeight: 40, px: 2.2, whiteSpace: "nowrap" }}
                                            >
                                                Actualizar
                                            </PremiumButton>
                                        </div>

                                        <div className="rev-client-grid">
                                            {cuentasAbiertasVisibles.length ? (
                                                cuentasAbiertasVisibles.map((venta) => {
                                                    const ventaPersonaId = venta?.persona_id ? String(venta.persona_id) : "";
                                                    const ventaCedula = String(venta?.cedula || "").replace(/\D/g, "");
                                                    const clienteActualId = cliente?.id ? String(cliente.id) : "";
                                                    const clienteActualCedula = String(cliente?.cedula || cedulaCliente || "").replace(/\D/g, "");
                                                    const coincideClienteActivo = Boolean(
                                                        draftId && String(draftId) === String(venta.id)
                                                        || clienteActualId && ventaPersonaId && clienteActualId === ventaPersonaId
                                                        || clienteActualCedula && ventaCedula && clienteActualCedula === ventaCedula
                                                    );
                                                    const ventaTotalVisible = coincideClienteActivo
                                                        ? totalGeneral
                                                        : Number(venta.total || venta.subtotal || 0);
                                                    const ventaItemsVisible = coincideClienteActivo
                                                        ? resumen.cantidadProductos
                                                        : Number(venta.items_count || 0);
                                                    const tipoVentaBase = String(venta.tipo_venta || "PENDIENTE").toUpperCase();
                                                    const tipoVisible = tipoVentaBase === "COMPUESTA"
                                                        ? "Mixta"
                                                        : tipoVentaBase;

                                                    return (
                                                        <div
                                                            key={venta.id}
                                                            className={`rev-client-tile ${coincideClienteActivo ? "active" : ""}`}
                                                        >
                                                            <div className="rev-client-tile-top">
                                                                <div className="rev-client-initials">
                                                                    {String(venta.nombre || "PV").slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <div className="rev-client-main">
                                                                    <h4>{venta.nombre}</h4>
                                                                    <p>Cédula: {venta.cedula || "Consumidor final"}</p>
                                                                    <p>
                                                                        {ventaItemsVisible} producto(s) · {usarVentasAbiertas ? (tipoVisible === "PENDIENTE" ? "Por cobrar" : tipoVisible) : (coincideClienteActivo ? "En edición" : "Borrador")}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="rev-client-summary">
                                                                <div className="rev-client-summary-card">
                                                                    <span>Total</span>
                                                                    <strong>{formatMoney(ventaTotalVisible)}</strong>
                                                                </div>
                                                                <div className="rev-client-summary-card">
                                                                    <span>Productos</span>
                                                                    <strong>{ventaItemsVisible}</strong>
                                                                </div>
                                                            </div>

                                                            <div className="rev-client-tile-footer">
                                                                <div className="rev-client-actions">
                                                                    <PremiumButton
                                                                        type="button"
                                                                        variant="outline"
                                                                        className="btn-search"
                                                                        onClick={() => cargarBorrador(venta)}
                                                                        startIcon={<ReceiptLongRoundedIcon fontSize="small" />}
                                                                        sx={{
                                                                            width: "100%",
                                                                            minHeight: 42,
                                                                            justifyContent: "center",
                                                                        }}
                                                                        aria-label="Abrir venta"
                                                                        title="Abrir venta"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="rev-status-panel is-empty">
                                                    <div className="rev-status-empty">
                                                        <div className="rev-status-icon">
                                                            <SearchRoundedIcon fontSize="medium" />
                                                        </div>
                                                        <strong>No hay facturas pendientes</strong>
                                                        <span className="rev-status-line">
                                                            Ingresa una cédula y pulsa <strong>Abrir venta</strong> para mostrar la facturación pendiente.
                                                        </span>
                                                        <span className="rev-status-note">
                                                            {isAdmin
                                                                ? "Si una venta queda pendiente o abonada, aparecerá aquí para cobrarla y podrás filtrarla por sede."
                                                                : "Si una venta queda pendiente o abonada en esta sede, aparecerá aquí para cobrarla con su total y sus productos."}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </section>

            {clienteSeleccionado ? (
                <div className="rev-layout">
                    <section className="rev-card">
                    <div className="rev-card-body">
                            {borradorActivo ? (
                                <div className="rev-status-panel" style={{ marginBottom: 18 }}>
                                    <div className="rev-section-head" style={{ marginBottom: 10 }}>
                                        <div>
                                            <p className="rev-kicker">Factura pendiente</p>
                                            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950 }}>
                                                {borradorActivo.nombre || "Consumidor final"}
                                            </h3>
                                            <p style={{ color: "var(--rev-muted)", marginTop: 6 }}>
                                                Cédula: {borradorActivo.cedula || "Sin cédula"} · {borradorActivoItems} producto(s)
                                            </p>
                                        </div>
                                        <div className="rev-badge rev-badge-gold" style={{ alignSelf: "flex-start" }}>
                                            {String(borradorActivo.estado_pago || "").toUpperCase() === "BORRADOR"
                                                    ? "En proceso"
                                                    : String(borradorActivo.estado_pago || "PENDIENTE")}
                                        </div>
                                    </div>
                                    <div className="rev-client-summary" style={{ marginTop: 0 }}>
                                        <div className="rev-client-summary-card">
                                            <span>Total acumulado</span>
                                            <strong>{formatMoney(borradorActivoTotal)}</strong>
                                        </div>
                                        <div className="rev-client-summary-card">
                                            <span>Estado</span>
                                            <strong>
                                                {String(borradorActivo.estado_pago || "").toUpperCase() === "BORRADOR"
                                                    ? "Por cobrar"
                                                    : String(borradorActivo.estado_pago || "PENDIENTE")}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="rev-section-head">
                                <div>
                                    <p className="rev-kicker">Paso 2 · Catálogo</p>
                                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 950 }}>Catálogo</h2>
                                    <p style={{ color: "var(--rev-muted)", marginTop: 6 }}>
                                    Productos, servicios y membresías listos para cobrar.
                                </p>
                                </div>

                            <div className="rev-inline-row" style={{ flex: 1, minWidth: 0 }}>
                                <input
                                    value={busqueda}
                                    onChange={(event) => setBusqueda(event.target.value)}
                                    placeholder="Buscar producto..."
                                    className="rev-input rev-search-input"
                                />
                                <select
                                    value={sedeId}
                                    onChange={(event) => setSedeId(event.target.value)}
                                    className="rev-select"
                                >
                                    {sedes.map((sede) => (
                                        <option key={sede.id} value={sede.id}>
                                            {sede.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="rev-category-tabs">
                            {categorias.map((categoria) => (
                                <button
                                    key={categoria}
                                    type="button"
                                    onClick={() => setCategoriaActiva(categoria)}
                                    className={categoriaActiva === categoria ? "rev-tab rev-tab-active" : "rev-tab"}
                                >
                                    {categoria}
                                </button>
                            ))}
                        </div>

                        <div className="rev-membership-shell">
                            <div className="rev-section-head">
                                <div>
                                    <p className="rev-kicker">Membresías</p>
                                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 950 }}>Planes</h3>
                                    <p style={{ color: "var(--rev-muted)", marginTop: 6 }}>
                                        Se cobra junto o separado del consumo.
                                    </p>
                                </div>
                            </div>

                            <div className="rev-membership-grid">
                                {membresias.map((membresia) => (
                                    <button
                                        key={membresia.id}
                                        type="button"
                                        className={`rev-membership-card ${String(membresiaSeleccionadaId) === String(membresia.id) ? "active" : ""}`}
                                        onClick={() => setMembresiaSeleccionadaId((prev) => String(prev) === String(membresia.id) ? "" : String(membresia.id))}
                                    >
                                        <h4>{membresia.nombre}</h4>
                                        <p>{membresia.descripcion || "Plan disponible para activarse desde el punto de venta."}</p>
                                        <div className="rev-membership-meta">
                                            <span>{membresia.duracion_dias} día(s)</span>
                                            <strong>{formatMoney(membresia.precio)}</strong>
                                        </div>
                                    </button>
                                ))}
                            </div>

                        </div>

                        {loadingCatalogo ? (
                            <div className="rev-loading-shell">
                                <CircularProgress sx={{ color: "var(--tg-primary)" }} />
                            </div>
                        ) : productosFiltrados.length ? (
                            <div className="rev-products-grid">
                                {productosFiltrados.map((producto) => (
                                    <ProductCard key={producto.id} producto={producto} onAdd={agregarProducto} />
                                ))}
                            </div>
                        ) : (
                            <div className="rev-empty-cart">
                                <div>🔎</div>
                                <h3>Sin resultados</h3>
                                <p>Prueba con otro nombre, otra categoria o revisa la sede activa.</p>
                            </div>
                        )}
                    </div>
                    </section>

                    <aside className="rev-side">
                        <section className="rev-cart-card">
                        <div className="rev-cart-head">
                            <div>
                                <p className="rev-kicker">Paso 3 · Venta actual</p>
                                <h2>Carrito de venta</h2>
                                <p>{resumen.cantidadProductos} producto(s) seleccionado(s)</p>
                            </div>
                            <div className="rev-cart-icon">🧾</div>
                        </div>

                        <div className="rev-cart-list">
                            {carrito.length ? (
                                carrito.map((item) => (
                                    <CartItem
                                        key={item.id}
                                        item={item}
                                        onIncrease={aumentarCantidad}
                                        onDecrease={disminuirCantidad}
                                        onRemove={eliminarProducto}
                                    />
                                ))
                            ) : (
                                <div className="rev-empty-cart">
                                    <div>🛒</div>
                                    <h3>Carrito vacío</h3>
                                    <p>Selecciona productos del catálogo para iniciar la venta.</p>
                                </div>
                            )}
                        </div>

                        <div className="rev-cart-summary">
                            <div className="rev-pay-card">
                                <div className="rev-pay-card-top">
                                    <div>
                                        <span>Valor a pagar</span>
                                        <strong>{formatMoney(totalGeneral)}</strong>
                                    </div>
                                    <span className="rev-badge rev-badge-gold">Factura abierta</span>
                                </div>

                                <div className="rev-pay-mini">
                                    <div>
                                        <span>Consumo</span>
                                        <strong>{formatMoney(resumen.subtotal)}</strong>
                                    </div>
                                    <div>
                                        <span>Membresía</span>
                                        <strong>{formatMoney(membresiaSeleccionada?.precio || 0)}</strong>
                                    </div>
                                    <div>
                                        <span>Deuda previa</span>
                                        <strong>{formatMoney(deudaActualCliente)}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="rev-pay-methods" style={{ marginBottom: 10 }}>
                                {[
                                    { label: "Cobrar ahora", value: "PAGADO" },
                                    { label: "Dejar por cobrar", value: "PENDIENTE" },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setEstadoPago(option.value)}
                                        className={estadoPago === option.value ? "active" : ""}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {estadoPago === "PAGADO" ? (
                                <div className="rev-pay-methods">
                                    {paymentOptions.map((metodo) => (
                                        <button
                                            key={metodo.value}
                                            type="button"
                                            onClick={() => setMetodoPago(metodo.value)}
                                            className={metodoPago === metodo.value ? "active" : ""}
                                        >
                                            {metodo.label}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="rev-debt-banner" style={{ marginBottom: 12 }}>
                                    La factura quedará pendiente de pago y aparecerá como deuda del cliente.
                                </div>
                            )}

                            <div className="rev-actions-stack">
                                <PremiumButton
                                    type="button"
                                    variant="guardar"
                                    loading={guardandoVenta}
                                    disabled={(!carrito.length && !membresiaSeleccionada) || !sedeId || guardandoVenta}
                                    onClick={confirmarVenta}
                                    sx={{ width: "100%", height: 46, fontSize: "13px", fontWeight: 900 }}
                                >
                                    {estadoPago === "PENDIENTE" ? "Guardar factura por cobrar" : "Finalizar y cobrar"}
                                </PremiumButton>

                                <div className="rev-action-row">
                                    <Button
                                        type="button"
                                        onClick={() => setCarrito([])}
                                        className="btn-close rev-button"
                                        startIcon={<DeleteOutlineRoundedIcon />}
                                    >
                                        Vaciar carrito
                                    </Button>
                                    <PremiumButton
                                        type="button"
                                        variant="anadir"
                                        onClick={limpiarVenta}
                                        startIcon={<RestartAltRoundedIcon />}
                                        sx={{ width: "100%", height: 44, fontSize: "13px" }}
                                    >
                                        Nueva factura
                                    </PremiumButton>
                                </div>
                            </div>
                        </div>
                        </section>
                    </aside>
                </div>
            ) : null}
        </div>
    );
}
