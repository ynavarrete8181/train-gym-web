export const getClientRisk = (cliente) => {
    const adherencia = Number(cliente?.adherencia_promedio || 0);
    const dolor = Number(cliente?.dolor_promedio || 0);
    const sesiones = Number(cliente?.sesiones || 0);

    if (!sesiones) return { tone: "neutral", label: "Sin seguimiento" };
    if (dolor >= 7 || adherencia < 60) return { tone: "danger", label: "Riesgo" };
    if (dolor >= 4 || adherencia < 80) return { tone: "mustard", label: "Seguimiento" };
    return { tone: "success", label: "Estable" };
};

export const buildClientRecommendations = (cliente) => {
    const recomendaciones = [];
    const adherencia = Number(cliente?.adherencia_promedio || 0);
    const dolor = Number(cliente?.dolor_promedio || 0);
    const rpe = Number(cliente?.rpe_promedio || 0);
    const sesiones = Number(cliente?.sesiones || 0);

    if (!sesiones) {
        recomendaciones.push({
            tone: "neutral",
            label: "Sin base",
            action: "Registrar primeras sesiones para empezar a medir adherencia y respuesta.",
        });
        return recomendaciones;
    }

    if (dolor >= 7) {
        recomendaciones.push({
            tone: "danger",
            label: "Revisar dolor",
            action: "Bajar carga o volumen y evaluar técnica antes de continuar progresando.",
        });
    } else if (dolor >= 4) {
        recomendaciones.push({
            tone: "mustard",
            label: "Controlar molestias",
            action: "Monitorear dolor en la próxima sesión y ajustar ejercicios irritativos.",
        });
    }

    if (adherencia < 60) {
        recomendaciones.push({
            tone: "danger",
            label: "Recuperar adherencia",
            action: "Reducir complejidad del plan y reforzar seguimiento semanal del cliente.",
        });
    } else if (adherencia < 80) {
        recomendaciones.push({
            tone: "mustard",
            label: "Sostener seguimiento",
            action: "Mantener contacto y revisar horarios o carga para evitar más omitidos.",
        });
    }

    if (rpe >= 9) {
        recomendaciones.push({
            tone: "mustard",
            label: "Bajar fatiga",
            action: "Valorar una semana de descarga o reducir intensidad en el siguiente bloque.",
        });
    }

    if (!recomendaciones.length) {
        recomendaciones.push({
            tone: "success",
            label: "Mantener progresión",
            action: "La respuesta es estable; se puede progresar carga o volumen de forma gradual.",
        });
    }

    return recomendaciones.slice(0, 3);
};

export const buildExecutionRecommendations = ({ resumen, dolorPromedio, comparativaResumen }) => {
    const recomendaciones = [];

    if (dolorPromedio >= 7) {
        recomendaciones.push({
            tone: "danger",
            label: "Dolor alto",
            action: "Detener progresiones agresivas y revisar ejercicios que dispararon dolor.",
        });
    } else if (dolorPromedio >= 4) {
        recomendaciones.push({
            tone: "mustard",
            label: "Molestia moderada",
            action: "Ajustar rango, tempo o volumen en la próxima sesión.",
        });
    }

    if (Number(resumen?.cumplimiento || 0) < 60) {
        recomendaciones.push({
            tone: "danger",
            label: "Cumplimiento bajo",
            action: "Repetir semana o simplificar el día antes de subir carga.",
        });
    } else if (Number(resumen?.cumplimiento || 0) < 80) {
        recomendaciones.push({
            tone: "mustard",
            label: "Sesión irregular",
            action: "Revisar por qué hubo parciales u omitidos y ajustar el plan inmediato.",
        });
    }

    if (Number(comparativaResumen?.cargaAbajo || 0) >= 2) {
        recomendaciones.push({
            tone: "mustard",
            label: "Carga por debajo",
            action: "Confirmar fatiga o técnica; no subir intensidad hasta estabilizar ejecución.",
        });
    }

    if (Number(comparativaResumen?.cargaArriba || 0) >= 2 && Number(resumen?.cumplimiento || 0) >= 80 && Number(dolorPromedio || 0) < 4) {
        recomendaciones.push({
            tone: "success",
            label: "Posible progresión",
            action: "El cliente toleró mejor la carga; se puede progresar con control en la siguiente sesión.",
        });
    }

    if (!recomendaciones.length) {
        recomendaciones.push({
            tone: "success",
            label: "Sesión estable",
            action: "Mantener la línea actual y seguir monitoreando adherencia y percepción de esfuerzo.",
        });
    }

    return recomendaciones.slice(0, 4);
};
