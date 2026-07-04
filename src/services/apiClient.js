import axios from "axios";
import Swal from "sweetalert2";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
export const API_BASE_ORIGIN = new URL(API_BASE_URL).origin;

export const normalizeAssetUrl = (url) => {
    if (!url) return "";

    const raw = String(url).trim();
    if (!raw) return "";

    if (raw.startsWith("/")) {
        return `${API_BASE_ORIGIN}${raw}`;
    }

    try {
        const parsed = new URL(raw);

        if (
            parsed.pathname.startsWith("/uploads/") &&
            ["localhost", "127.0.0.1"].includes(parsed.hostname) &&
            parsed.origin !== API_BASE_ORIGIN
        ) {
            return new URL(parsed.pathname, API_BASE_ORIGIN).toString();
        }
    } catch {
        return raw;
    }

    return raw;
};

const TRAINING_FIELD_LABELS = {
    rpe: "RPE",
    rpe_objetivo: "RPE objetivo",
    repeticiones: "repeticiones",
    descanso_segundos: "descanso",
    tiempo_segundos: "tiempo",
    distancia_metros: "distancia",
    porcentaje_rm: "% RM",
    carga_fija: "carga fija",
    unidad_carga: "unidad de carga",
    tempo: "tempo",
    ejercicio_id: "ejercicio",
    nombre: "nombre",
    observaciones: "observaciones",
};

const capitalize = (value = "") => value.charAt(0).toUpperCase() + value.slice(1);

const getTrainingFieldLabel = (field) => TRAINING_FIELD_LABELS[field] || field.replaceAll("_", " ");

const formatTrainingValidationPath = (path) => {
    const parts = String(path || "").split(".");
    if (!parts.length) return null;

    const labels = [];

    for (let index = 0; index < parts.length; index += 1) {
        const part = parts[index];
        const next = parts[index + 1];

        if (part === "bloques" && next !== undefined) {
            labels.push(`Bloque ${Number(next) + 1}`);
            index += 1;
            continue;
        }

        if (part === "ejercicios" && next !== undefined) {
            labels.push(`Ejercicio ${Number(next) + 1}`);
            index += 1;
            continue;
        }

        if (part === "series" && next !== undefined) {
            labels.push(`Serie ${Number(next) + 1}`);
            index += 1;
            continue;
        }

        if (part === "transferencias" && next !== undefined) {
            labels.push(`Transferencia ${Number(next) + 1}`);
            index += 1;
            continue;
        }
    }

    const field = parts[parts.length - 1];
    if (["bloques", "ejercicios", "series", "transferencias"].includes(field)) {
        return labels.join(", ");
    }

    return [...labels, `campo ${getTrainingFieldLabel(field)}`].join(", ");
};

const translateValidationMessage = (path, message) => {
    const text = String(message || "").trim();
    const formattedPath = formatTrainingValidationPath(path);
    const field = String(path || "").split(".").pop();
    const fieldLabel = getTrainingFieldLabel(field);

    if (!formattedPath) return text;

    if (text.includes("field must be at least 0")) {
        return `${formattedPath} tiene un valor invalido. Debe estar vacio o ser 0 o mayor.`;
    }

    if (text.includes("field is required")) {
        return `${formattedPath} es obligatorio.`;
    }

    if (text.includes("field must be a number")) {
        return `${formattedPath} debe ser numerico.`;
    }

    if (text.includes("field must be an integer")) {
        return `${formattedPath} debe ser un numero entero.`;
    }

    if (text.includes("field must not be greater than 10")) {
        return `${formattedPath} no puede ser mayor que 10.`;
    }

    if (text.includes("field must be at least 1")) {
        return `${formattedPath} debe ser 1 o mayor.`;
    }

    return `${capitalize(formattedPath)}: ${text.replace(fieldLabel, `el campo ${fieldLabel}`)}`;
};

export const getApiErrorMessage = (error, fallback = "Ocurrió un error al procesar la solicitud.") => {
    const data = error?.response?.data;

    if (typeof data?.message === "string" && data.message.trim()) {
        return data.message.trim();
    }

    const errors = data?.errors;
    if (errors && typeof errors === "object") {
        const firstErrorKey = Object.keys(errors).find((key) => {
            const value = errors[key];
            return Array.isArray(value) ? value.length > 0 : Boolean(value);
        });
        const firstEntry = firstErrorKey ? errors[firstErrorKey] : null;

        if (Array.isArray(firstEntry) && firstEntry[0]) {
            return translateValidationMessage(firstErrorKey, firstEntry[0]);
        }

        if (typeof firstEntry === "string" && firstEntry.trim()) {
            return translateValidationMessage(firstErrorKey, firstEntry.trim());
        }
    }

    return fallback;
};

export const openModalSwal = (options) =>
    Swal.fire({
        ...options,
        target: document.body,
        heightAuto: false,
        didOpen: () => {
            const container = Swal.getContainer();
            if (container) {
                container.style.zIndex = "20000";
            }
            options?.didOpen?.();
        },
    });

export const apiClient = axios.create(
    {
        baseURL: `${API_BASE_URL}/api`,
        timeout: 20000,
        headers: { Accept: "application/json", "Content-Type": "application/json" },
    });

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

apiClient.interceptors.response.use(
    (r) => r,
    (e) => {
        if (e?.response?.status === 401) {
            localStorage.removeItem("ACCESS_TOKEN");
            localStorage.removeItem("USER");
        }
        return Promise.reject(e);
    }
);
