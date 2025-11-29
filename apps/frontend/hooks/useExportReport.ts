import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export const useExportReport = () => {
    const [isExporting, setIsExporting] = useState(false);

    const exportToPDF = useCallback(async (elementRef: React.RefObject<HTMLElement>, filename: string) => {
        if (!elementRef.current) return;
        
        setIsExporting(true);
        try {
            const canvas = await html2canvas(elementRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${filename}.pdf`);
            return true;
        } catch (error) {
            console.error('Error al generar PDF:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }, []);

    const exportToExcel = useCallback((data: any[], sheets: Array<{name: string, data: any[]}>, filename: string) => {
        setIsExporting(true);
        try {
            const workbook = XLSX.utils.book_new();

            sheets.forEach(sheet => {
                const worksheet = XLSX.utils.json_to_sheet(sheet.data);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
            });

            XLSX.writeFile(workbook, `${filename}.xlsx`);
            return true;
        } catch (error) {
            console.error('Error al generar Excel:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }, []);

    const exportToCSV = useCallback((data: any[], filename: string) => {
        setIsExporting(true);
        try {
            const worksheet = XLSX.utils.json_to_sheet(data);
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${filename}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return true;
        } catch (error) {
            console.error('Error al generar CSV:', error);
            throw error;
        } finally {
            setIsExporting(false);
        }
    }, []);

    return {
        isExporting,
        exportToPDF,
        exportToExcel,
        exportToCSV
    };
};

export default useExportReport;