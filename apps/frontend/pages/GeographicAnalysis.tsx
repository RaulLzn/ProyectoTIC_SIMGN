import React, { useState, useMemo, useEffect } from 'react';
import { 
    ZoomIn, ZoomOut, Maximize, Factory, TrendingUp, Coins, MapPin, 
    ArrowRight, Activity, ChevronRight, AlertCircle 
} from 'lucide-react';
import ColombiaMap from '../components/ColombiaMap';
import DetailedReportModal from '../components/DetailedReportModal';
import { fetchProductionMap, fetchDemandMap, fetchRoyaltiesMap } from '../services/api';
import { MapData } from '../types';

type LayerType = 'production' | 'demand' | 'royalties';

const GeographicAnalysis: React.FC = () => {
    const [activeLayer, setActiveLayer] = useState<LayerType>('production');
    const [selectedDept, setSelectedDept] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [productionMapData, setProductionMapData] = useState<MapData[]>([]);
    const [demandMapData, setDemandMapData] = useState<MapData[]>([]);
    const [royaltiesMapData, setRoyaltiesMapData] = useState<MapData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                const [prod, dem, roy] = await Promise.all([
                    fetchProductionMap(),
                    fetchDemandMap(),
                    fetchRoyaltiesMap()
                ]);

                setProductionMapData(prod.map((p: any) => ({
                    departmentId: p.department,
                    departmentName: p.department,
                    value: p.value,
                    formattedValue: `${(p.value / 1000).toFixed(1)}k`,
                    metricLabel: 'Producción Total (mpc)'
                })));

                setDemandMapData(dem.map((d: any) => ({
                    departmentId: d.name,
                    departmentName: d.name,
                    value: d.value,
                    formattedValue: `${d.value.toLocaleString()} GBTUD`,
                    metricLabel: 'Demanda Real'
                })));

                setRoyaltiesMapData(roy.map((r: any) => ({
                    departmentId: r.department,
                    departmentName: r.department,
                    value: r.value,
                    formattedValue: new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: "compact" }).format(r.value),
                    metricLabel: 'Regalías Liquidadas'
                })));

            } catch (err) {
                console.error("Error loading geographic data:", err);
                setError("Error al cargar los datos geográficos.");
            } finally {
                setLoading(false);
            }
        };
        loadAllData();
    }, []);

    // --- Data Processing Logic ---



    // Select Data based on Active Layer
    const currentData = activeLayer === 'production' ? productionMapData 
                      : activeLayer === 'demand' ? demandMapData 
                      : royaltiesMapData;

    const colorScale = activeLayer === 'production' ? 'blue' 
                     : activeLayer === 'demand' ? 'orange' 
                     : 'green';

    // --- Interactive Logic ---

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 4));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.5, 1));
    const handleReset = () => { setZoom(1); setPosition({ x: 0, y: 0 }); setSelectedDept(null); };

    const handleDeptClick = (deptName: string) => {
        setSelectedDept(deptName);
        // Simple auto-centering logic could go here, but keeping it simple for now
    };

    // Get stats for selected department
    const deptStats = useMemo(() => {
        if (!selectedDept) return null;
        const prod = productionMapData.find(d => d.departmentName === selectedDept)?.value || 0;
        const dem = demandMapData.find(d => d.departmentName === selectedDept)?.value || 0;
        const roy = royaltiesMapData.find(d => d.departmentName === selectedDept)?.value || 0;
        
        // Top field logic removed for optimization (requires extra fetch)
        const topField = 'N/A'; 

        return { prod, dem, roy, topField };
    }, [selectedDept, productionMapData, demandMapData, royaltiesMapData]);

    const currencyFormatter = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: "compact" }).format(val);

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6 overflow-hidden">
            
            {/* --- Main Map Area --- */}
            <div className="flex-1 bg-slate-200 rounded-xl relative overflow-hidden shadow-inner border border-slate-300 group">
                
                {/* Map Controls */}
                <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
                    <button onClick={handleZoomIn} className="bg-white p-2 rounded-lg shadow-md hover:bg-slate-50 text-slate-700 transition-colors" title="Acercar">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button onClick={handleZoomOut} className="bg-white p-2 rounded-lg shadow-md hover:bg-slate-50 text-slate-700 transition-colors" title="Alejar">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button onClick={handleReset} className="bg-white p-2 rounded-lg shadow-md hover:bg-slate-50 text-slate-700 transition-colors" title="Reiniciar Vista">
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>

                {/* Layer Switcher */}
                <div className="absolute top-6 right-6 z-20 bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-lg border border-slate-200 flex flex-col sm:flex-row gap-1">
                    <button 
                        onClick={() => setActiveLayer('production')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeLayer === 'production' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Factory className="w-4 h-4" /> Producción
                    </button>
                    <button 
                        onClick={() => setActiveLayer('royalties')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeLayer === 'royalties' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <Coins className="w-4 h-4" /> Regalías
                    </button>
                    <button 
                        onClick={() => setActiveLayer('demand')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${activeLayer === 'demand' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        <TrendingUp className="w-4 h-4" /> Demanda
                    </button>
                </div>

                {/* Map Container with Transform */}
                <div 
                    className="w-full h-full transition-transform duration-500 ease-out flex items-center justify-center bg-pattern"
                    style={{ transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)` }}
                >
                    <ColombiaMap 
                        data={currentData} 
                        valueFormatter={(v) => activeLayer === 'royalties' ? currencyFormatter(v) : `${v.toLocaleString()}`}
                        onDepartmentClick={handleDeptClick}
                        selectedDepartment={selectedDept}
                        colorScale={colorScale}
                    />
                </div>

                {/* Info Overlay when no selection */}
                {!selectedDept && (
                    <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 max-w-xs">
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <h4 className="font-bold text-slate-800">Explorador Interactivo</h4>
                        </div>
                        <p className="text-sm text-slate-500">
                            Haga clic en cualquier departamento para ver estadísticas detalladas de producción, regalías y demanda regional. use los controles para acercar.
                        </p>
                    </div>
                )}
            </div>

            {/* --- Detail Sidebar --- */}
            <div className={`w-96 bg-white rounded-xl shadow-xl border border-slate-200 transition-all duration-300 transform ${selectedDept ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-50 hidden'} flex flex-col`}>
                {selectedDept && deptStats && (
                    <>
                        <div className="p-6 bg-slate-50 border-b border-slate-200 rounded-t-xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Departamento</p>
                                    <h2 className="text-3xl font-bold text-slate-900">{selectedDept}</h2>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                                    <Activity className="w-6 h-6 text-slate-700" />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto flex-1">
                            {/* Card Production */}
                            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Factory className="w-4 h-4 text-blue-600" />
                                    <span className="font-bold text-blue-900 text-sm">Producción Gas</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-3xl font-bold text-blue-700">{deptStats.prod > 0 ? (deptStats.prod / 1000).toFixed(1) : 0}k</span>
                                    <span className="text-blue-600 text-sm font-medium mb-1">mpc</span>
                                </div>
                                {deptStats.prod > 0 && (
                                    <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between text-xs text-blue-800">
                                        <span>Campo Principal:</span>
                                        <span className="font-bold">{deptStats.topField}</span>
                                    </div>
                                )}
                            </div>

                            {/* Card Royalties */}
                            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Coins className="w-4 h-4 text-emerald-600" />
                                    <span className="font-bold text-emerald-900 text-sm">Regalías Generadas</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-2xl font-bold text-emerald-700">{currencyFormatter(deptStats.roy)}</span>
                                </div>
                                <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-3">
                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                            </div>

                            {/* Card Demand */}
                            <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-4 h-4 text-orange-600" />
                                    <span className="font-bold text-orange-900 text-sm">Demanda Regional</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-2xl font-bold text-orange-700">{deptStats.dem.toLocaleString()}</span>
                                    <span className="text-orange-600 text-sm font-medium mb-1">mpcd</span>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    Ver Informe Detallado <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
                {!selectedDept && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                        <MapPin className="w-12 h-12 mb-4 text-slate-300" />
                        <p>Seleccione un departamento en el mapa para visualizar su información.</p>
                    </div>
                )}
            </div>

            {/* Modal de Informe Detallado */}
            {selectedDept && (
                <DetailedReportModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    selectedDepartment={selectedDept}
                    productionData={[]} // Disabled for now
                    demandData={[]} // Disabled for now
                    royaltiesData={[]} // Disabled for now
                />
            )}
        </div>
    );
};

export default GeographicAnalysis;