import React, { useState } from 'react';
import { Download, FileText, Table, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

const DescargaInforme: React.FC = () => {
    const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel'>('csv');
    const [selectedDatasets, setSelectedDatasets] = useState({
        produccion: true,
        demanda: true,
        regalias: true
    });
    const [dateRange, setDateRange] = useState({
        inicio: '2024-01-01',
        fin: '2024-12-31'
    });
    const [downloading, setDownloading] = useState(false);

    // RF-06 / RF-13: Exportación avanzada de datos estandarizados via Streaming
    const handleExport = async () => {
        try {
            setDownloading(true);
            
            const params = new URLSearchParams();
            if (selectedDatasets.produccion) params.append('produccion', 'true');
            if (selectedDatasets.demanda) params.append('demanda', 'true');
            if (selectedDatasets.regalias) params.append('regalias', 'true');
            
            params.append('fecha_inicio', dateRange.inicio);
            params.append('fecha_fin', dateRange.fin);
            params.append('format', selectedFormat);
            
            const url = `${API_URL}/export/combined?${params.toString()}`;
            
            // Trigger download
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SIMGN_Informe_${new Date().toISOString().slice(0,10)}.${selectedFormat === 'csv' ? 'csv' : 'xls'}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
        } catch (error) {
            console.error("Error exporting data:", error);
            alert("Error al iniciar la descarga. Por favor intente nuevamente.");
        } finally {
            // Small delay to reset state, though download happens in background
            setTimeout(() => setDownloading(false), 1000);
        }
    };

    const toggleDataset = (dataset: 'produccion' | 'demanda' | 'regalias') => {
        setSelectedDatasets(prev => ({
            ...prev,
            [dataset]: !prev[dataset]
        }));
    };

    const hasSelection = selectedDatasets.produccion || selectedDatasets.demanda || selectedDatasets.regalias;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <Download className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Descarga de Informe</h1>
                </div>
                <p className="text-blue-100">
                    Genera archivos de salida actualizados con información estandarizada y validada
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel de Configuración */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Selección de Conjuntos de Datos */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Table className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Seleccionar Conjuntos de Datos</h2>
                        </div>

                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedDatasets.produccion}
                                    onChange={() => toggleDataset('produccion')}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-slate-800">Producción de Gas Natural</div>
                                    <div className="text-sm text-slate-500">Datos históricos y recientes</div>
                                </div>
                                {selectedDatasets.produccion && <CheckCircle className="w-5 h-5 text-green-600" />}
                            </label>

                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedDatasets.demanda}
                                    onChange={() => toggleDataset('demanda')}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-slate-800">Demanda de Gas Natural</div>
                                    <div className="text-sm text-slate-500">Consumo por regiones</div>
                                </div>
                                {selectedDatasets.demanda && <CheckCircle className="w-5 h-5 text-green-600" />}
                            </label>

                            <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedDatasets.regalias}
                                    onChange={() => toggleDataset('regalias')}
                                    className="w-5 h-5 text-blue-600 rounded"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-slate-800">Regalías</div>
                                    <div className="text-sm text-slate-500">Recaudo y distribución</div>
                                </div>
                                {selectedDatasets.regalias && <CheckCircle className="w-5 h-5 text-green-600" />}
                            </label>
                        </div>
                    </div>

                    {/* Filtros de Fecha */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Rango de Fechas</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Fecha Inicio
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.inicio}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, inicio: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Fecha Fin
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.fin}
                                    onChange={(e) => setDateRange(prev => ({ ...prev, fin: e.target.value }))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Formato de Salida */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-slate-800">Formato de Salida</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setSelectedFormat('csv')}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                    selectedFormat === 'csv'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="font-semibold">CSV</div>
                                <div className="text-xs text-slate-500 mt-1">Comma Separated Values</div>
                            </button>

                            <button
                                onClick={() => setSelectedFormat('excel')}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                    selectedFormat === 'excel'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="font-semibold">Excel</div>
                                <div className="text-xs text-slate-500 mt-1">Microsoft Excel Format</div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Panel de Resumen y Descarga */}
                <div className="space-y-6">
                    {/* Resumen */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 sticky top-20">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Resumen de Descarga</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-600">Estado:</span>
                                <span className="font-bold text-slate-800">
                                    {downloading ? 'Generando...' : 'Listo para descargar'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-600">Formato:</span>
                                <span className="font-bold text-slate-800 uppercase">{selectedFormat}</span>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-slate-600">Periodo:</span>
                                <span className="text-sm text-slate-700">
                                    {dateRange.inicio} a {dateRange.fin}
                                </span>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Optimizado</span>
                                </div>
                                <p className="text-xs text-green-600 mt-1">
                                    Descarga directa desde el servidor (Bajo consumo de RAM)
                                </p>
                            </div>

                            {!hasSelection && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                                    <div className="flex items-center gap-2 text-amber-700">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="font-medium">Sin selección</span>
                                    </div>
                                    <p className="text-xs text-amber-600 mt-1">
                                        Selecciona al menos un conjunto de datos
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleExport}
                                disabled={!hasSelection || downloading}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                                    hasSelection && !downloading
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <Download className={`w-5 h-5 ${downloading ? 'animate-bounce' : ''}`} />
                                {downloading ? 'Descargando...' : 'Descargar Informe'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DescargaInforme;
