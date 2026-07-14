const formatReason = (reason) => {
  if (!reason) return "Error desconocido";
  if (reason instanceof Error) return reason.stack || reason.message;
  if (typeof reason === "string") return reason;

  try {
    return JSON.stringify(reason, null, 2);
  } catch {
    return String(reason);
  }
};

const showRuntimeError = (title, detail) => {
  const existing = document.querySelector("[data-runtime-error-panel='true']");
  if (existing) existing.remove();

  const panel = document.createElement("section");
  panel.setAttribute("data-runtime-error-panel", "true");
  panel.className = "runtime-error-panel";
  panel.innerHTML = `
    <div class="runtime-error-panel__body">
      <p class="runtime-error-panel__eyebrow">Error detectado</p>
      <h2>${title}</h2>
      <pre></pre>
      <button type="button">Cerrar</button>
    </div>
  `;

  panel.querySelector("pre").textContent = detail;
  panel.querySelector("button").addEventListener("click", () => panel.remove());
  document.body.appendChild(panel);
};

export const installMobileDiagnostics = () => {
  window.addEventListener("error", (event) => {
    const detail = event.error?.stack || event.message || "Error no controlado";
    console.error("Runtime error:", detail);
    showRuntimeError("La accion genero un error", detail);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const detail = formatReason(event.reason);
    console.error("Promise rechazada sin manejar:", event.reason);
    showRuntimeError("La accion no pudo completarse", detail);
  });
};
