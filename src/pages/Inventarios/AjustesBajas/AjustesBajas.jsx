import RuleFolderOutlinedIcon from "@mui/icons-material/RuleFolderOutlined";

import InventoryPrototypeShell from "../components/InventoryPrototypeShell";

export default function AjustesBajasInventario() {
  return (
    <InventoryPrototypeShell
      icon={<RuleFolderOutlinedIcon />}
      title="Ajustes y Bajas"
      description="Estructura alineada al estilo DBANU para resolver diferencias, pérdidas, daños y vencimientos con trazabilidad clara."
      badge="AJUSTES"
      status="BASE VISUAL LISTA"
      bullets={[
        "Ajuste positivo o negativo por regularización.",
        "Baja por daño, pérdida o vencimiento.",
        "Toda operación exige observación para auditoría.",
        "Cuando aplique, la baja podrá consumir stock por lote específico.",
      ]}
      flow={[
        {
          title: "Identificar incidencia",
          description: "Determinar si el caso es ajuste, merma o baja definitiva según la condición del producto.",
        },
        {
          title: "Justificar el evento",
          description: "Obligar motivo y observación para dejar trazabilidad clara de la decisión operativa.",
        },
        {
          title: "Aplicar impacto",
          description: "Modificar stock por sede y lote según la naturaleza del ajuste o la baja registrada.",
        },
        {
          title: "Auditar resultado",
          description: "Conservar quién ejecutó el cambio, qué producto fue afectado y cómo quedó el inventario.",
        },
      ]}
      nextSteps={[
        "Separar ajuste manual y baja definitiva en flujos distintos.",
        "Aprovechar el modal de movimientos para ajustes simples.",
        "Migrar la lógica de bajas con lotes desde inventarios_prueba.",
      ]}
    />
  );
}
