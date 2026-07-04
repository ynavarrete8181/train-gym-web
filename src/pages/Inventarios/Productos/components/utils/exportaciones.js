import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const exportarExcel = (data, filename = "reporte-inventario") => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
        XLSX.writeFile(workbook, `${filename}_${new Date().getTime()}.xlsx`);
    } catch (error) {
        console.error("Error exportando a Excel:", error);
    }
};

export const exportarPDF = (data, columns = [], title = "Reporte") => {
    try {
        const doc = new jsPDF();
        doc.text(title, 14, 15);
        
        const tableData = data.map(item => Object.values(item));
        const tableHeaders = data.length > 0 ? Object.keys(data[0]) : [];

        doc.autoTable({
            head: [tableHeaders],
            body: tableData,
            startY: 20,
        });

        doc.save(`${title.toLowerCase()}_${new Date().getTime()}.pdf`);
    } catch (error) {
        console.error("Error exportando a PDF:", error);
    }
};
