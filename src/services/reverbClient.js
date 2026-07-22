import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { API_BASE_ORIGIN } from "./apiClient";

window.Pusher = Pusher;

let echoInstance = null;

export const getReverbClient = () => {
    const key = import.meta.env.VITE_REVERB_APP_KEY;
    const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
    const port = Number(import.meta.env.VITE_REVERB_PORT || 8080);
    const scheme = import.meta.env.VITE_REVERB_SCHEME || "http";

    if (!key) {
        return null;
    }

    if (!echoInstance) {
        echoInstance = new Echo({
            broadcaster: "reverb",
            key,
            wsHost: host,
            wsPort: port,
            wssPort: port,
            forceTLS: scheme === "https",
            enabledTransports: ["ws", "wss"],
            authEndpoint: `${API_BASE_ORIGIN}/broadcasting/auth`,
            auth: {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN") || ""}`,
                    Accept: "application/json",
                },
            },
        });
    }

    return echoInstance;
};

export const resetReverbClient = () => {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
};
