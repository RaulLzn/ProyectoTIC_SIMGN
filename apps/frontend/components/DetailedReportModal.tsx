import React, { useState, useRef } from 'react';
import { X, Download, FileText, FileSpreadsheet, Calendar, MapPin, Factory, TrendingUp, Coins, Activity } from 'lucide-react';
import { ProductionRecord, DemandRecord, RoyaltyRecord } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

interface DetailedReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDepartment: string;
    productionData: ProductionRecord[];
    demandData: DemandRecord[];
    royaltiesData: RoyaltyRecord[];
}

const DetailedReportModal: React.FC<DetailedReportModalProps> = ({
    isOpen,
    onClose,
    selectedDepartment,
    productionData,
    demandData,
    royaltiesData
}) => {
    const [selectedTab, setSelectedTab] = useState<'overview' | 'production' | 'demand' | 'royalties'>('overview');
    const [isExporting, setIsExporting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    // Filtrar datos por departamento
    const deptProduction = productionData.filter(p => p.entidad_territorial === selectedDepartment);
    const deptDemand = demandData.filter(d => d.entidad_territorial === selectedDepartment);
    const deptRoyalties = royaltiesData.filter(r => r.entidad_territorial === selectedDepartment);

    // Calcular totales
    const totalProduction = deptProduction.reduce((sum, p) => sum + p.valor, 0);
    const totalDemand = deptDemand.reduce((sum, d) => sum + d.valor_real, 0);
    const totalRoyalties = deptRoyalties.reduce((sum, r) => sum + r.valor, 0);

    // Agrupar por período
    const productionByPeriod = deptProduction.reduce((acc, p) => {
        const period = p.fecha_periodo;
        if (!acc[period]) acc[period] = 0;
        acc[period] += p.valor;
        return acc;
    }, {} as Record<string, number>);

    const demandByPeriod = deptDemand.reduce((acc, d) => {
        const period = d.fecha_periodo;
        if (!acc[period]) acc[period] = { real: 0, proyectado: 0 };
        acc[period].real += d.valor_real;
        acc[period].proyectado += d.valor_proyectado;
        return acc;
    }, {} as Record<string, { real: number; proyectado: number }>);

    const royaltiesByPeriod = deptRoyalties.reduce((acc, r) => {
        const period = r.fecha_periodo;
        if (!acc[period]) acc[period] = 0;
        acc[period] += r.valor;
        return acc;
    }, {} as Record<string, number>);

    // Exportar a PDF
    const exportToPDF = async () => {
        if (!reportRef.current) return;
        
        setIsExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true
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

            pdf.save(`Informe_Detallado_${selectedDepartment}_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error al generar PDF:', error);
            alert('Error al generar el PDF');
        } finally {
            setIsExporting(false);
        }
    };

    // Exportar a Excel
    const exportToExcel = () => {
        setIsExporting(true);
        try {
            const workbook = XLSX.utils.book_new();

            // Hoja de Resumen
            const summaryData = [
                ['Departamento', selectedDepartment],
                ['Fecha de Generación', new Date().toLocaleDateString('es-CO')],
                ['', ''],
                ['RESUMEN EJECUTIVO', ''],
                ['Producción Total (mpc)', totalProduction.toLocaleString()],
                ['Demanda Total (mpcd)', totalDemand.toLocaleString()],
                ['Regalías Totales (COP)', totalRoyalties.toLocaleString()],
            ];
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

            // Hoja de Producción
            const productionSheet = XLSX.utils.json_to_sheet(
                deptProduction.map(p => ({
                    'Período': p.fecha_periodo,
                    'Campo': p.campo,
                    'Operador': p.operador,
                    'Valor (mpc)': p.valor,
                    'Unidad': p.unidad_medida
                }))
            );
            XLSX.utils.book_append_sheet(workbook, productionSheet, 'Producción');

            // Hoja de Demanda
            const demandSheet = XLSX.utils.json_to_sheet(
                deptDemand.map(d => ({
                    'Período': d.fecha_periodo,
                    'Región': d.region,
                    'Sector': d.sector,
                    'Valor Real (mpcd)': d.valor_real,
                    'Valor Proyectado (mpcd)': d.valor_proyectado,
                    'Unidad': d.unidad_medida
                }))
            );
            XLSX.utils.book_append_sheet(workbook, demandSheet, 'Demanda');

            // Hoja de Regalías
            const royaltiesSheet = XLSX.utils.json_to_sheet(
                deptRoyalties.map(r => ({
                    'Período': r.fecha_periodo,
                    'Campo': r.campo,
                    'Valor (COP)': r.valor,
                    'Unidad': r.unidad_medida
                }))
            );
            XLSX.utils.book_append_sheet(workbook, royaltiesSheet, 'Regalías');

            XLSX.writeFile(workbook, `Informe_Detallado_${selectedDepartment}_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Error al generar Excel:', error);
            alert('Error al generar el archivo Excel');
        } finally {
            setIsExporting(false);
        }
    };

    const currencyFormatter = (val: number) => 
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: "compact" }).format(val);

    const tabs = [
        { id: 'overview', label: 'Resumen', icon: Activity },
        { id: 'production', label: 'Producción', icon: Factory },
        { id: 'demand', label: 'Demanda', icon: TrendingUp },
        { id: 'royalties', label: 'Regalías', icon: Coins }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">Informe Detallado</h2>
                            <div className="flex items-center gap-4 text-slate-200">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{selectedDepartment}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date().toLocaleDateString('es-CO')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportToPDF}
                                disabled={isExporting}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                <FileText className="w-4 h-4" />
                                PDF
                            </button>
                            <button
                                onClick={exportToExcel}
                                disabled={isExporting}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Excel
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200">
                    <div className="flex">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedTab(tab.id as any)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                        selectedTab === tab.id
                                            ? 'border-blue-600 text-blue-600 bg-blue-50'
                                            : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div ref={reportRef} className="p-6 overflow-y-auto max-h-[60vh]">
                    {selectedTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-6">
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Factory className="w-6 h-6 text-blue-600" />
                                        <h3 className="font-bold text-blue-900">Producción</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-blue-700">
                                        {(totalProduction / 1000).toFixed(1)}k
                                    </p>
                                    <p className="text-blue-600 text-sm">mpc acumulados</p>
                                </div>

                                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <TrendingUp className="w-6 h-6 text-orange-600" />
                                        <h3 className="font-bold text-orange-900">Demanda</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-orange-700">
                                        {totalDemand.toLocaleString()}
                                    </p>
                                    <p className="text-orange-600 text-sm">mpcd acumulados</p>
                                </div>

                                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Coins className="w-6 h-6 text-green-600" />
                                        <h3 className="font-bold text-green-900">Regalías</h3>
                                    </div>
                                    <p className="text-2xl font-bold text-green-700">
                                        {currencyFormatter(totalRoyalties)}
                                    </p>
                                    <p className="text-green-600 text-sm">COP acumulados</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl">
                                <h3 className="font-bold text-slate-800 mb-4">Análisis Temporal</h3>
                                <div className="space-y-3">
                                    {Object.entries(productionByPeriod).map(([period, value]) => (
                                        <div key={period} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-b-0">
                                            <span className="font-medium text-slate-700">{new Date(period + '-01').toLocaleDateString('es-CO', { year: 'numeric', month: 'long' })}</span>
                                            <div className="text-right">
                                                <div className="text-sm text-slate-600">
                                                    Prod: {(value / 1000).toFixed(1)}k mpc
                                                </div>
                                                {demandByPeriod[period] && (
                                                    <div className="text-sm text-slate-600">
                                                        Dem: {demandByPeriod[period].real.toLocaleString()} mpcd
                                                    </div>
                                                )}
                                                {royaltiesByPeriod[period] && (
                                                    <div className="text-sm text-slate-600">
                                                        Reg: {currencyFormatter(royaltiesByPeriod[period])}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'production' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-800">Datos de Producción</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Período</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Campo</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Operador</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Valor (mpc)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deptProduction.map((item, index) => (
                                            <tr key={index} className="border-t border-slate-200 hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-700">{item.fecha_periodo}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{item.campo}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{item.operador}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700 text-right font-mono">{item.valor.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'demand' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-800">Datos de Demanda</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Período</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Región</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Sector</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Real (mpcd)</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Proyectado (mpcd)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deptDemand.map((item, index) => (
                                            <tr key={index} className="border-t border-slate-200 hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-700">{item.fecha_periodo}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{item.region}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{item.sector}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700 text-right font-mono">{item.valor_real.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700 text-right font-mono">{item.valor_proyectado.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {selectedTab === 'royalties' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-800">Datos de Regalías</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
                                    <thead className="bg-slate-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Período</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Campo</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium text-slate-700">Valor (COP)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deptRoyalties.map((item, index) => (
                                            <tr key={index} className="border-t border-slate-200 hover:bg-slate-50">
                                                <td className="px-4 py-3 text-sm text-slate-700">{item.fecha_periodo}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700">{item.campo}</td>
                                                <td className="px-4 py-3 text-sm text-slate-700 text-right font-mono">{currencyFormatter(item.valor)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetailedReportModal;