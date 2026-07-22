import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

const stamp = () => new Date().toISOString().slice(0, 10);

const clean = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value ? "Si" : "No";
    if (typeof value === "object") return "";
    return String(value).replace(/\s+/g, " ").trim();
};

export const exportRowsForReport = (rows = [], columns = []) => {
    return rows.map((row) => {
        const item = {};
        columns.forEach((column) => {
            item[column.label] = clean(column.exportValue ? column.exportValue(row) : row[column.key]);
        });
        return item;
    });
};

export const exportReportExcel = ({ title, rows = [], columns = [] }) => {
    if (!rows.length) {
        Swal.fire("Sin datos", "No hay datos para exportar.", "info");
        return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRowsForReport(rows, columns));
    worksheet["!cols"] = columns.map((column) => ({ wch: Math.max(14, String(column.label).length + 4) }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31));
    XLSX.writeFile(workbook, `${title.replace(/[^\w-]+/g, "_")}_${stamp()}.xlsx`);
};

export const exportReportPdf = ({ title, rows = [], columns = [] }) => {
    if (!rows.length) {
        Swal.fire("Sin datos", "No hay datos para exportar.", "info");
        return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(title, 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado: ${stamp()}`, 14, 23);

    autoTable(doc, {
        startY: 30,
        head: [columns.map((column) => column.label)],
        body: rows.map((row) => columns.map((column) => clean(column.exportValue ? column.exportValue(row) : row[column.key]))),
        styles: { fontSize: 8, cellPadding: 2, textColor: [31, 41, 55] },
        headStyles: { fillColor: [229, 231, 235], textColor: [17, 24, 39], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 },
    });

    doc.save(`${title.replace(/[^\w-]+/g, "_")}_${stamp()}.pdf`);
};
