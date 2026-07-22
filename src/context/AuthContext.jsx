import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiClient } from "../services/apiClient";

const AuthContext = createContext(null);
const clearStoredAuth = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("USER");
};

const normalizeUser = (data) => {
    if (!data) return null;

    const email = String(data.email || "").trim();
    const username = String(data.username || data.name || email || "Usuario").trim();

    return {
        ...data,
        email,
        username,
    };
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const raw = localStorage.getItem("USER");
        return raw ? normalizeUser(JSON.parse(raw)) : null;
    });

    const [booting, setBooting] = useState(true);

    const persistUser = (data) => {
        const normalized = normalizeUser(data);
        if (normalized) {
            localStorage.setItem("USER", JSON.stringify(normalized));
        } else {
            localStorage.removeItem("USER");
        }
        setUser(normalized);
        return normalized;
    };

    useEffect(() => {
        const token = localStorage.getItem("ACCESS_TOKEN");
        if (!token) {
            clearStoredAuth();
            setBooting(false);
            return;
        }

        apiClient
            .get("/auth/me")
            .then(({ data }) => {
                persistUser(data);
            })
            .catch(() => {
                clearStoredAuth();
                setUser(null);
            })
            .finally(() => setBooting(false));
    }, []);

    const login = async ({ user: username, password }) => {
        try {
            const { data } = await apiClient.post("/auth/login", {
                cedula: username,
                password,
            });

            const token = data?.token;
            const u = normalizeUser(data?.user);

            if (!token || !u) return { ok: false, message: "Respuesta inválida del servidor" };

            localStorage.setItem("ACCESS_TOKEN", token);
            persistUser(u);

            return { ok: true };
        } catch (error) {
            clearStoredAuth();
            setUser(null);
            if (error.response && error.response.status === 401) {
                return { ok: false, message: "Cédula o contraseña incorrecta" };
            }
            return { ok: false, message: "Error de conexión. ¿Reiniciaste el servidor local con npm run dev?" };
        }
    };

    const logout = async () => {
        try {
            await apiClient.post("/auth/logout");
        } finally {
            clearStoredAuth();
            setUser(null);
        }
    };

    const refreshUser = async () => {
        const { data } = await apiClient.get("/auth/me");
        return persistUser(data);
    };

    const updateUser = (nextUser) => persistUser(nextUser);

    const value = useMemo(
        () => ({ user, booting, login, logout, refreshUser, updateUser }),
        [user, booting]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
