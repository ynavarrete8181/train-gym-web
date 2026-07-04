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
                const normalized = normalizeUser(data);
                setUser(normalized);
                localStorage.setItem("USER", JSON.stringify(normalized));
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

            if (!token || !u) return { ok: false };

            localStorage.setItem("ACCESS_TOKEN", token);
            localStorage.setItem("USER", JSON.stringify(u));
            setUser(u);

            return { ok: true };
        } catch {
            clearStoredAuth();
            setUser(null);
            return { ok: false };
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

    const value = useMemo(() => ({ user, booting, login, logout }), [user, booting]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
