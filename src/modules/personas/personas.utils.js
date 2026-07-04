export const pagePaperSx = {
    borderRadius: "var(--tg-radius-sm)",
    backgroundColor: "#FFFFFF",
    border: "1px solid var(--tg-card-border)",
    boxShadow: "var(--tg-shadow)",
};

export const calcAge = (birthDateString) => {
    if (!birthDateString) return "N/A";

    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return `${age} años`;
};

export const interpretImc = (imc) => {
    if (!imc) return { label: "N/A", color: "#666" };
    if (imc < 18.5) return { label: "Bajo peso", color: "#3498db" };
    if (imc < 25) return { label: "Normal", color: "#2ecc71" };
    if (imc < 30) return { label: "Sobrepeso", color: "#f39c12" };
    return { label: "Obesidad", color: "#e74c3c" };
};
