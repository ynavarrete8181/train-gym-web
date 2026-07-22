import { useEffect, useState } from "react";
import {
    AppBar,
    Avatar,
    Badge,
    Box,
    Button,
    Chip,
    Collapse,
    Divider,
    Drawer,
    IconButton,
    InputBase,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useTheme,
} from "@mui/material";
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Inventory2 as InventoryIcon,
    PointOfSale as PointOfSaleIcon,
    Logout as LogoutIcon,
    Search as SearchIcon,
    NotificationsNone as NotificationsIcon,
    ChevronLeft as ChevronLeftIcon,
    People as PeopleIcon,
    Groups as GroupsIcon,
    FitnessCenter as FitnessCenterIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    QrCodeScanner as QrCodeScannerIcon,
    ManageSearch as ManageSearchIcon,
    MarkEmailRead as CommunicationsIcon,
} from "@mui/icons-material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiClient } from "../services/apiClient";
import { getReverbClient, resetReverbClient } from "../services/reverbClient";
import CambioPasswordObligatorio from "../components/auth/CambioPasswordObligatorio";
import logo from "../assets/imagenes/logo.jpeg";

const drawerWidth = 292;
const getUserDisplayName = (user) => {
    if (!user) return "Usuario";

    return user.username || user.name || user.email || `Usuario #${user.id ?? ""}`;
};

const getUserSubtitle = (user) => {
    if (!user) return "Sin sesión";

    const email = user.email || "Sin email";
    const gimnasioId = user.gimnasio_id ? `Gym ${user.gimnasio_id}` : "Sin gimnasio";
    return `${email} · ${gimnasioId}`;
};

const getUserInitial = (user) => {
    const base = getUserDisplayName(user);
    return String(base || "U").slice(0, 1).toUpperCase();
};

function PageTitle({ pathname }) {
    const map = {
        "/": "Dashboard",
        "/notificaciones": "Notificaciones",
        "/comunicaciones": "Comunicaciones",
        "/comunicaciones/notificaciones": "Comunicaciones / Notificaciones",
        "/comunicaciones/cumpleanos": "Comunicaciones / Cumpleaños",
        "/comunicaciones/plantillas": "Comunicaciones / Plantillas",
        "/comunicaciones/historial": "Comunicaciones / Historial",
        "/comunicaciones/reenvios": "Comunicaciones / Reenvíos",
        "/gimnasio/notificaciones": "Notificaciones",
        "/gimnasio/horario": "Servicios y Agenda / Horarios",
        "/gimnasio/categoria-servicio": "Servicios y Agenda / Categorías",
        "/gimnasio/servicio": "Servicios y Agenda / Servicios",
        "/gimnasio/reservas": "Servicios y Agenda / Reservas del Día",
        "/staff/equipo": "Equipo / Entrenadores",
        "/staff/turnos": "Equipo / Turnos Recurrentes",
        "/staff/clientes": "Equipo / Clientes por Coach",
        "/staff/mis-clientes": "Equipo / Mis Clientes",
        "/inventario/producto": "Productos",
        "/inventario/entradas": "Ingresos de Inventario",
        "/inventario/salidas": "Egresos de Inventario",
        "/inventario/ajustes-bajas": "Ajustes y Bajas",
        "/inventario/kardex": "Kardex de Inventario",
        "/inventario/movimientos": "Movimientos de Inventario",
        "/inventario/transferencias": "Transferencias",
        "/inventario/proveedores": "Proveedores",
        "/inventario/compras": "Compras e Ingresos",
        "/inventario/precios": "Precios",
        "/gimnasio/ventas-punto-venta": "Punto de Venta",
        "/gimnasio/ventas-realizadas": "Ventas Realizadas",
        "/gimnasio/ventas-cierre-caja": "Cierre de Caja",
        "/gimnasio/ventas-devoluciones": "Devoluciones",
        "/gimnasio/clientes": "Clientes",
        "/gimnasio/personas": "Clientes",
        "/gimnasio/clientes/directorio": "Clientes",
        "/gimnasio/clientes/socios": "Clientes",
        "/gimnasio/clientes/ficha-fisica": "Clientes",
        "/gimnasio/clientes/membresias": "Clientes / Membresías",
        "/gimnasio/membresias": "Clientes / Planes de Membresía",
        "/gimnasio/asignacion-membresias": "Clientes / Asignación de Membresías",
        "/gimnasio/clientes/cumpleanos": "Comunicaciones / Cumpleaños",
        "/gimnasio/check-in": "Control de Acceso",
        "/entrenamiento/ejercicios": "Catálogo de Ejercicios",
        "/entrenamiento/evaluaciones": "Evaluaciones Físicas",
        "/entrenamiento/rm": "RM",
        "/entrenamiento/planes": "Planes / Rutinas",
        "/entrenamiento/ejecucion": "Ejecución",
        "/entrenamiento/reportes": "Reportes / Evolución",
        "/reportes/evolucion": "Reportes / Evolución",
        "/reportes/adherencia": "Reportes / Adherencia",
        "/reportes/alertas": "Reportes / Alertas",
        "/reportes/premium": "Reportes / Premium",
        "/reportes/asistencias": "Reportes / Asistencias",
        "/reportes/membresias": "Reportes / Membresías",
        "/reportes/reservas": "Reportes / Reservas",
        "/reportes/coaches": "Reportes / Coaches",
        "/reportes/ventas": "Reportes / Ventas",
        "/reportes/auditoria": "Reportes / Auditoría",
        "/reportes/logs": "Reportes / Logs Técnicos",
        "/seguridad/usuarios": "Usuarios",
        "/seguridad/auditoria": "Auditoría y Logs / Auditoría",
        "/seguridad/logs": "Auditoría y Logs / Logs del Sistema",
        "/auditoria/eventos": "Auditoría y Logs / Auditoría",
        "/auditoria/logs": "Auditoría y Logs / Logs del Sistema",
    };
    return map[pathname] || "Panel";
}

function BreadcrumbsLite({ pathname }) {
    const parts = pathname.split("/").filter(Boolean);
    const current = parts.length ? parts[parts.length - 1] : "Dashboard";
    const label = current.charAt(0).toUpperCase() + current.slice(1);
    return (
        <Typography variant="body2" sx={{ opacity: 0.75 }}>
            Home <span style={{ opacity: 0.45, margin: "0 6px" }}>/</span> {label}
        </Typography>
    );
}

export default function DashboardLayout() {
    const theme = useTheme();
    const radiusSm = theme.shape.borderRadiusSm ?? 6;
    const radiusXs = 2;

    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, refreshUser } = useAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [openGroups, setOpenGroups] = useState({ Clientes: true });

    useEffect(() => {
        // Mantiene abierto el grupo asociado a la ruta actual.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpenGroups((s) => ({
            ...s,
            "Clientes": location.pathname.startsWith("/gimnasio/personas")
                || location.pathname.startsWith("/gimnasio/clientes")
                || location.pathname.startsWith("/gimnasio/membresias")
                || location.pathname.startsWith("/gimnasio/asignacion-membresias"),
            "Comunicaciones": location.pathname.startsWith("/comunicaciones")
                || location.pathname.startsWith("/notificaciones")
                || location.pathname.startsWith("/gimnasio/notificaciones")
                || location.pathname.startsWith("/gimnasio/clientes/cumpleanos"),
            "Acceso": location.pathname.startsWith("/gimnasio/check-in"),
            "Servicios y Agenda": location.pathname.startsWith("/gimnasio/categoria-servicio")
                || location.pathname.startsWith("/gimnasio/servicio")
                || location.pathname.startsWith("/gimnasio/reservas")
                || location.pathname.startsWith("/gimnasio/horario"),
            "Equipo": location.pathname.startsWith("/staff/"),
            "Entrenamiento": location.pathname.startsWith("/entrenamiento/"),
            Ventas: location.pathname.startsWith("/gimnasio/ventas-punto-venta")
                || location.pathname.startsWith("/gimnasio/ventas-realizadas")
                || location.pathname.startsWith("/gimnasio/ventas-cierre-caja")
                || location.pathname.startsWith("/gimnasio/ventas-devoluciones"),
            Inventario: location.pathname.startsWith("/inventario/producto")
                || location.pathname.startsWith("/inventario/entradas")
                || location.pathname.startsWith("/inventario/salidas")
                || location.pathname.startsWith("/inventario/ajustes-bajas")
                || location.pathname.startsWith("/inventario/kardex")
                || location.pathname.startsWith("/inventario/movimientos")
                || location.pathname.startsWith("/inventario/transferencias")
                || location.pathname.startsWith("/inventario/proveedores")
                || location.pathname.startsWith("/inventario/compras")
                || location.pathname.startsWith("/inventario/precios"),
            "Reportes": location.pathname.startsWith("/reportes/"),
            "Auditoría y Logs": location.pathname.startsWith("/auditoria/")
                || location.pathname.startsWith("/seguridad/auditoria")
                || location.pathname.startsWith("/seguridad/logs"),
        }));
    }, [location.pathname]);

    useEffect(() => {
        let mounted = true;

        apiClient.get("/gimnasio/notificaciones", { params: { limit: 6 } })
            .then(({ data }) => {
                if (!mounted) return;
                setNotifications(Array.isArray(data?.data) ? data.data : []);
                setNotificationCount(Number(data?.no_leidas || 0));
            })
            .catch(() => {
                if (!mounted) return;
                setNotifications([]);
                setNotificationCount(0);
            });

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const handleNotificationsUpdated = (event) => {
            if (Number.isFinite(event.detail?.no_leidas)) {
                setNotificationCount(Number(event.detail.no_leidas));
            }

            if (Array.isArray(event.detail?.items)) {
                setNotifications(event.detail.items.slice(0, 6));
            }
        };

        window.addEventListener("train-gym:notifications-updated", handleNotificationsUpdated);

        return () => {
            window.removeEventListener("train-gym:notifications-updated", handleNotificationsUpdated);
        };
    }, []);

    useEffect(() => {
        if (!user?.id && !user?.persona_id) {
            return undefined;
        }

        const echo = getReverbClient();
        if (!echo) {
            return undefined;
        }

        const handleNotification = (payload) => {
            setNotifications((current) => [payload, ...current].slice(0, 6));
            setNotificationCount((current) => current + 1);
        };

        const channels = [];
        if (user?.id) {
            const channel = echo.private(`notificaciones.usuario.${user.id}`);
            channel.listen(".notificacion.creada", handleNotification);
            channels.push(`notificaciones.usuario.${user.id}`);
        }
        if (user?.persona_id) {
            const channel = echo.private(`notificaciones.persona.${user.persona_id}`);
            channel.listen(".notificacion.creada", handleNotification);
            channels.push(`notificaciones.persona.${user.persona_id}`);
        }

        return () => {
            channels.forEach((channelName) => echo.leave(channelName));
        };
    }, [user?.id, user?.persona_id]);

    const handleNotificationClick = async (item) => {
        setNotificationAnchorEl(null);

        if (item?.destinatario_id && !item?.leida) {
            setNotifications((current) => current.map((notification) => (
                notification.destinatario_id === item.destinatario_id
                    ? { ...notification, leida: true, estado: "LEIDA", leida_at: new Date().toISOString() }
                    : notification
            )));
            setNotificationCount((current) => Math.max(0, current - 1));

            try {
                await apiClient.post(`/gimnasio/notificaciones/${item.destinatario_id}/leer`);
            } catch (_error) {
                setNotifications((current) => current.map((notification) => (
                    notification.destinatario_id === item.destinatario_id
                        ? { ...notification, leida: false, estado: item.estado, leida_at: item.leida_at }
                        : notification
                )));
                setNotificationCount((current) => current + 1);
            }
        }

        const targetPath = item?.data?.ruta_web;
        if (targetPath) {
            navigate(targetPath);
        }
    };

    const handleMarkAllNotificationsRead = async () => {
        if (!notificationCount) return;

        const previousNotifications = notifications;
        const previousCount = notificationCount;
        const readAt = new Date().toISOString();

        setNotifications((current) => current.map((notification) => ({
            ...notification,
            leida: true,
            estado: "LEIDA",
            leida_at: notification.leida_at || readAt,
        })));
        setNotificationCount(0);

        try {
            await apiClient.post("/gimnasio/notificaciones/leer-todas");
        } catch (_error) {
            setNotifications(previousNotifications);
            setNotificationCount(previousCount);
        }
    };

    const navItems = [
        { to: "/", label: "Dashboard", icon: <DashboardIcon /> },
        /* { to: "/members", label: "Miembros", icon: <PeopleIcon /> }, */
        /* { to: "/payments", label: "Pagos", icon: <PaymentsIcon /> }, */
        /* { to: "/inventory", label: "Inventario", icon: <InventoryIcon /> }, */
        {
            label: "Clientes",
            icon: <PeopleIcon />,
            children: [
                { to: "/gimnasio/clientes", label: "Clientes" },
                { to: "/gimnasio/membresias", label: "Planes de Membresía" },
                { to: "/gimnasio/asignacion-membresias", label: "Asignar Membresía" },
            ],
        },
        {
            label: "Comunicaciones",
            icon: <CommunicationsIcon />,
            children: [
                { to: "/comunicaciones/notificaciones", label: "Notificaciones" },
                { to: "/comunicaciones/cumpleanos", label: "Cumpleaños" },
                { to: "/comunicaciones/plantillas", label: "Plantillas" },
                { to: "/comunicaciones/historial", label: "Historial" },
                { to: "/comunicaciones/reenvios", label: "Reenvíos" },
            ],
        },
        {
            label: "Acceso",
            icon: <QrCodeScannerIcon />,
            children: [
                { to: "/gimnasio/check-in", label: "Check-in / Puerta" },
            ],
        },
        {
            label: "Servicios y Agenda",
            icon: <ScheduleIcon />,
            children: [
                { to: "/gimnasio/categoria-servicio", label: "Categorías" },
                { to: "/gimnasio/servicio", label: "Servicios" },
                { to: "/gimnasio/horario", label: "Horarios" },
                { to: "/gimnasio/reservas", label: "Reservas del Día" },
            ],
        },
        {
            label: "Equipo",
            icon: <GroupsIcon />,
            children: [
                { to: "/staff/equipo", label: "Entrenadores" },
                { to: "/staff/turnos", label: "Turnos Recurrentes" },
                { to: "/staff/clientes", label: "Clientes por Coach" },
                { to: "/staff/mis-clientes", label: "Mis Clientes" },
            ],
        },
        {
            label: "Entrenamiento",
            icon: <FitnessCenterIcon />,
            children: [
                { to: "/entrenamiento/ejercicios", label: "Ejercicios" },
                { to: "/entrenamiento/fichas", label: "Fichas" },
                { to: "/entrenamiento/evaluaciones", label: "Evaluaciones Físicas" },
                { to: "/entrenamiento/rm", label: "RM" },
                { to: "/entrenamiento/planes", label: "Planes / Rutinas" },
                { to: "/entrenamiento/ejecucion", label: "Ejecución" },
            ],
        },
        {
            label: "Ventas",
            icon: <PointOfSaleIcon />,
            children: [
                { to: "/gimnasio/ventas-punto-venta", label: "Punto de Venta" },
                { to: "/gimnasio/ventas-realizadas", label: "Ventas Realizadas" },
                { to: "/gimnasio/ventas-cierre-caja", label: "Cierre de Caja" },
                { to: "/gimnasio/ventas-devoluciones", label: "Devoluciones" },
            ],
        },
        {
            label: "Inventario",
            icon: <InventoryIcon />,
            children: [
                { to: "/inventario/proveedores", label: "Proveedores" },
                { to: "/inventario/producto", label: "Productos" },
                { to: "/inventario/entradas", label: "Ingresos" },
                { to: "/inventario/kardex", label: "Movimientos / Kardex" },
            ],
        },
        { to: "/seguridad/usuarios", label: "Usuarios", icon: <AdminPanelSettingsIcon /> },
        {
            label: "Reportes",
            icon: <DashboardIcon />,
            children: [
                { to: "/reportes/premium", label: "Premium" },
                { to: "/reportes/asistencias", label: "Asistencias" },
                { to: "/reportes/membresias", label: "Membresías" },
                { to: "/reportes/reservas", label: "Reservas" },
                { to: "/reportes/coaches", label: "Coaches" },
                { to: "/reportes/ventas", label: "Ventas" },
                { to: "/reportes/auditoria", label: "Auditoría" },
                { to: "/reportes/logs", label: "Logs Técnicos" },
                { to: "/reportes/evolucion", label: "Evolución" },
                { to: "/reportes/adherencia", label: "Adherencia" },
                { to: "/reportes/alertas", label: "Alertas" },
            ],
        },
        {
            label: "Auditoría y Logs",
            icon: <ManageSearchIcon />,
            children: [
                { to: "/auditoria/eventos", label: "Auditoría" },
                { to: "/auditoria/logs", label: "Logs del Sistema" },
            ],
        },
    ];

    const open = Boolean(anchorEl);
    const contentLeft = collapsed ? 88 : drawerWidth;
    const userDisplayName = getUserDisplayName(user);
    const userSubtitle = getUserSubtitle(user);

    const drawer = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ px: 2, py: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
                <Box
                    component="img"
                    src={logo}
                    alt="Train Gym"
                    sx={{
                        width: 46,
                        height: 46,
                        borderRadius: radiusSm,
                        objectFit: "cover",
                        border: "1px solid rgba(255,255,255,0.14)",
                    }}
                />
                {!collapsed ? (
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 950, lineHeight: 1.1 }}>Train Gym</Typography>
                        <Box sx={{ display: "flex", gap: 1, mt: 0.8, flexWrap: "wrap" }}>
                            <Chip
                                size="small"
                                label={userDisplayName}
                                sx={{
                                    bgcolor: "rgba(242,177,0,0.14)",
                                    color: "var(--tg-primary)",
                                    maxWidth: 170,
                                    "& .MuiChip-label": {
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    },
                                }}
                            />
                            <Chip
                                size="small"
                                label="Online"
                                sx={{
                                    bgcolor: "rgba(46,204,113,0.14)",
                                    color: "rgba(46,204,113,1)",
                                }}
                            />
                        </Box>
                    </Box>
                ) : null}
            </Box>

            <Divider sx={{ opacity: 0.12, borderColor: "var(--tg-sidebar-border)" }} />

            <List sx={{ px: 1.2, py: 1.2 }}>
                {navItems.map((it) => {
                    if (!it.children) {
                        return (
                            <ListItemButton
                                key={it.to}
                                component={NavLink}
                                to={it.to}
                                onClick={() => setMobileOpen(false)}
                                style={({ isActive }) => ({
                                    borderRadius: `${radiusXs}px`,
                                    margin: "6px 6px",
                                    background: isActive ? "var(--tg-sidebar-active)" : "transparent",
                                })}
                                sx={{
                                    minHeight: 46,
                                    px: 1.2,
                                    color: "#fff",
                                    border: "1px solid rgba(255,255,255,0.04)",
                                    "&:hover": { backgroundColor: "var(--tg-sidebar-hover)" },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 42, color: "inherit", opacity: 0.92 }}>
                                    {it.icon}
                                </ListItemIcon>
                                {!collapsed ? <ListItemText primary={it.label} /> : null}
                            </ListItemButton>
                        );
                    }

                    const groupOpen = !!openGroups[it.label];
                    const isGroupActive = it.children.some((c) => location.pathname.startsWith(c.to));

                    return (
                        <Box key={it.label} sx={{ mx: 0.75 }}>
                            <ListItemButton
                                onClick={() => setOpenGroups((s) => ({ ...s, [it.label]: !s[it.label] }))}
                                sx={{
                                    borderRadius: `${radiusXs}px`,
                                    my: 0.6,
                                    minHeight: 46,
                                    px: 1.2,
                                    color: "#fff",
                                    border: "1px solid rgba(255,255,255,0.04)",
                                    background: isGroupActive ? "var(--tg-sidebar-active)" : "transparent",
                                    "&:hover": { backgroundColor: "var(--tg-sidebar-hover)" },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 42, color: "inherit", opacity: 0.92 }}>
                                    {it.icon}
                                </ListItemIcon>
                                {!collapsed ? (
                                    <>
                                        <ListItemText primary={it.label} />
                                        {groupOpen ? <ExpandLess /> : <ExpandMore />}
                                    </>
                                ) : null}
                            </ListItemButton>

                            {!collapsed ? (
                                <Collapse in={groupOpen} timeout="auto" unmountOnExit>
                                    <List disablePadding sx={{ pl: 2 }}>
                                        {it.children.map((c) => (
                                            <ListItemButton
                                                key={c.to}
                                                component={NavLink}
                                                to={c.to}
                                                onClick={() => setMobileOpen(false)}
                                                style={({ isActive }) => ({
                                                    borderRadius: `${radiusXs}px`,
                                                    margin: "6px 6px",
                                                    background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                                                })}
                                                sx={{
                                                    minHeight: 40,
                                                    px: 1,
                                                    color: "#fff",
                                                    border: "1px solid rgba(255,255,255,0.04)",
                                                    "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 32, color: "inherit", opacity: 0.75 }}>
                                                    <Box sx={{ width: 6, height: 6, borderRadius: 999, bgcolor: "rgba(255,255,255,0.65)" }} />
                                                </ListItemIcon>
                                                <ListItemText primary={c.label} />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                </Collapse>
                            ) : null}
                        </Box>
                    );
                })}
            </List>

            <Box sx={{ flex: 1 }} />

            <Divider sx={{ opacity: 0.12, borderColor: "var(--tg-sidebar-border)" }} />

            <List sx={{ px: 1.2, py: 1.2 }}>
                <ListItemButton
                    onClick={() => {
                        resetReverbClient();
                        logout();
                        navigate("/login", { replace: true });
                    }}
                    sx={{
                        mx: 0.8,
                        my: 0.8,
                        borderRadius: radiusXs,
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.04)",
                        "&:hover": { backgroundColor: "var(--tg-sidebar-hover)" },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 42, color: "inherit", opacity: 0.92 }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    {!collapsed ? <ListItemText primary="Cerrar sesión" /> : null}
                </ListItemButton>
            </List>
        </Box>
    );

    return (
        <Box sx={{ minHeight: "100vh", background: "var(--tg-app-bg)" }}>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    zIndex: (t) => t.zIndex.drawer + 1,
                    background: "var(--tg-topbar-bg)",
                    backdropFilter: "blur(14px)",
                    borderBottom: "1px solid var(--tg-topbar-border)",
                    color: "#fff",
                    left: { md: contentLeft },
                    width: { md: `calc(100% - ${contentLeft}px)` },
                }}
            >
                <Toolbar sx={{ gap: 1.5 }}>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setMobileOpen((s) => !s)}
                        sx={{ display: { md: "none" } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{ display: { xs: "none", sm: "block" } }}>
                        <Typography sx={{ fontWeight: 950 }} variant="h6" noWrap>
                            <PageTitle pathname={location.pathname} />
                        </Typography>
                        <BreadcrumbsLite pathname={location.pathname} />
                    </Box>

                    <Box sx={{ flex: 1 }} />

                    <Box
                        sx={{
                            display: { xs: "none", md: "flex" },
                            alignItems: "center",
                            gap: 1,
                            px: 1.2,
                            py: 0.7,
                            borderRadius: radiusXs,
                            border: "1px solid rgba(255,255,255,0.16)",
                            background: "rgba(255,255,255,0.06)",
                            minWidth: 320,
                        }}
                    >
                        <SearchIcon sx={{ opacity: 0.75 }} />
                        <InputBase placeholder="Buscar..." sx={{ color: "#fff", width: "100%", fontSize: 14 }} />
                    </Box>

                    <IconButton
                        color="inherit"
                        onClick={(event) => setNotificationAnchorEl(event.currentTarget)}
                        sx={{ borderRadius: radiusSm }}
                    >
                        <Badge badgeContent={notificationCount} color="primary">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    <Menu
                        anchorEl={notificationAnchorEl}
                        open={Boolean(notificationAnchorEl)}
                        onClose={() => setNotificationAnchorEl(null)}
                        transformOrigin={{ horizontal: "right", vertical: "top" }}
                        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                        PaperProps={{
                            sx: {
                                mt: 1,
                                width: 360,
                                maxWidth: "calc(100vw - 32px)",
                                borderRadius: radiusXs,
                                bgcolor: theme.palette.background.paper,
                                color: theme.palette.text.primary,
                                border: `1px solid ${theme.palette.divider}`,
                            },
                        }}
                    >
                        <Box sx={{ px: 1.6, py: 1.2, display: "flex", justifyContent: "space-between", gap: 1, alignItems: "center" }}>
                            <Box>
                                <Typography sx={{ fontWeight: 950, fontSize: 14 }}>Notificaciones</Typography>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setNotificationAnchorEl(null);
                                        navigate("/notificaciones");
                                    }}
                                    sx={{
                                        mt: 0.4,
                                        p: 0,
                                        minWidth: 0,
                                        fontSize: 11,
                                        fontWeight: 900,
                                        color: "var(--tg-primary)",
                                        textTransform: "none",
                                    }}
                                >
                                    Ver todas
                                </Button>
                            </Box>
                            <Chip size="small" label={`${notificationCount} nuevas`} />
                        </Box>
                        {notificationCount ? (
                            <Box sx={{ px: 1.6, pb: 1 }}>
                                <Button
                                    fullWidth
                                    size="small"
                                    onClick={handleMarkAllNotificationsRead}
                                    sx={{
                                        borderRadius: radiusXs,
                                        border: "1px solid rgba(46,125,50,0.55)",
                                        color: "#2e7d32",
                                        fontWeight: 900,
                                        textTransform: "none",
                                    }}
                                >
                                    Marcar todas como leidas
                                </Button>
                            </Box>
                        ) : null}
                        <Divider sx={{ opacity: 0.12 }} />
                        {notifications.length ? notifications.map((item) => (
                            <MenuItem
                                key={`${item.destinatario_id || item.id}-${item.created_at || ""}`}
                                onClick={() => handleNotificationClick(item)}
                                sx={{
                                    alignItems: "flex-start",
                                    whiteSpace: "normal",
                                    py: 1.2,
                                    bgcolor: item.leida ? "transparent" : "rgba(242,177,0,0.07)",
                                }}
                            >
                                <Box>
                                    <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
                                        {item.titulo}
                                    </Typography>
                                    <Typography sx={{ fontSize: 12, opacity: 0.76, mt: 0.3 }}>
                                        {item.mensaje}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        )) : (
                            <Box sx={{ px: 1.6, py: 2 }}>
                                <Typography sx={{ fontSize: 13, opacity: 0.7 }}>
                                    Sin notificaciones recientes.
                                </Typography>
                            </Box>
                        )}
                    </Menu>

                    <IconButton
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        color="inherit"
                        sx={{ p: 0.4, borderRadius: radiusSm }}
                    >
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                borderRadius: radiusSm,
                                bgcolor: "rgba(242,177,0,0.16)",
                                color: "var(--tg-primary)",
                                border: "1px solid rgba(242,177,0,0.22)",
                            }}
                        >
                            {getUserInitial(user)}
                        </Avatar>
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={() => setAnchorEl(null)}
                        transformOrigin={{ horizontal: "right", vertical: "top" }}
                        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                        PaperProps={{
                            sx: {
                                mt: 1,
                                minWidth: 220,
                                borderRadius: radiusXs,
                                bgcolor: theme.palette.background.paper,
                                color: theme.palette.text.primary,
                                border: `1px solid ${theme.palette.divider}`,
                            },
                        }}
                    >
                        <Box sx={{ px: 1.6, py: 1.2 }}>
                            <Typography sx={{ fontWeight: 900, fontSize: "14px", lineHeight: 1.2 }}>
                                {userDisplayName}
                            </Typography>
                            <Typography sx={{ fontSize: "12px", opacity: 0.72, mt: 0.4 }}>
                                {userSubtitle}
                            </Typography>
                        </Box>
                        <Divider sx={{ opacity: 0.12 }} />
                        <MenuItem
                            sx={{ borderRadius: radiusXs, mx: 0.5, my: 0.5 }}
                            onClick={() => {
                                setAnchorEl(null);
                                resetReverbClient();
                                logout();
                                navigate("/login", { replace: true });
                            }}
                        >
                            Cerrar sesión
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box sx={{ display: "flex" }}>
                <Box component="nav" sx={{ width: { md: contentLeft }, flexShrink: { md: 0 } }}>
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={() => setMobileOpen(false)}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            display: { xs: "block", md: "none" },
                            "& .MuiDrawer-paper": {
                                width: drawerWidth,
                                bgcolor: "var(--tg-sidebar-bg)",
                                color: "#fff",
                                borderRight: "1px solid var(--tg-sidebar-border)",
                            },
                        }}
                    >
                        {drawer}
                    </Drawer>

                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: "none", md: "block" },
                            "& .MuiDrawer-paper": {
                                width: contentLeft,
                                overflowX: "hidden",
                                bgcolor: "var(--tg-sidebar-bg)",
                                color: "#fff",
                                borderRight: "1px solid var(--tg-sidebar-border)",
                            },
                        }}
                        open
                    >
                        <Box sx={{ display: "flex", justifyContent: "flex-end", px: 1.2, pt: 1 }}>
                            <IconButton
                                onClick={() => setCollapsed((s) => !s)}
                                sx={{
                                    borderRadius: radiusSm,
                                    border: "1px solid rgba(255,255,255,0.16)",
                                    background: "rgba(255,255,255,0.06)",
                                    color: "#fff",
                                }}
                            >
                                <ChevronLeftIcon sx={{ transform: collapsed ? "rotate(180deg)" : "none" }} />
                            </IconButton>
                        </Box>
                        {drawer}
                    </Drawer>
                </Box>

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        pt: 10,
                        px: { xs: 2, sm: 3 },
                        pb: 3,
                        background: "var(--tg-content-bg)",
                        minHeight: "100vh",
                    }}
                >
                    <Outlet />
                </Box>
            </Box>

            <CambioPasswordObligatorio user={user} refreshUser={refreshUser} />
        </Box>
    );
}
