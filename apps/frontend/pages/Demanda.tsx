import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area, ComposedChart, Cell, ReferenceLine 
} from 'recharts';
import { fetchDemandScenarios, fetchDemandSectors, fetchDemandMap, fetchDemandBalance } from '../services/api';
import { Users, Zap, BarChart3, AlertCircle, TrendingUp, AlertTriangle, Map as MapIcon } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import FilterBar from '../components/FilterBar';
import ColombiaMap from '../components/ColombiaMap';
import { MapData } from '../types';

const Demanda: React.FC = () => {
    // State
    const [scenariosData, setScenariosData] = useState<any[]>([]);
    const [sectorsData, setSectorsData] = useState<any[]>([]);
    const [mapData, setMapData] = useState<MapData[]>([]);
    const [balanceData, setBalanceData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);



    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [scenarios, sectors, map, balance] = await Promise.all([
                    fetchDemandScenarios(),
                    fetchDemandSectors(),
                    fetchDemandMap(),
                    fetchDemandBalance()
                ]);
                
                setScenariosData(scenarios);
                setSectorsData(sectors);
                // Transform backend map data (already by department) to MapData format
                const formattedMapData: MapData[] = map.map((item: any) => ({
                    departmentId: item.name,
                    departmentName: item.name,
                    value: item.value,
                    formattedValue: `${Math.round(item.value)} GBTUD`,
                    metricLabel: 'Demanda (GBTUD)'
                }));
                setMapData(formattedMapData);
                setBalanceData(balance);
                
                console.log('Loaded new demand data');
            } catch (err: any) {
                console.error("Error loading demand:", err);
                setError(`Error: ${err.message || err}`);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Calculate KPIs
    const kpis = useMemo(() => {
        if (!scenariosData.length) return { totalReal: 0, totalProjected: 0, deviation: 0 };
        
        // Assuming 'Histórico' is available in scenariosData for past years
        // Or we use the last available year for "Current Demand"
        const lastYearData = scenariosData[scenariosData.length - 1]; // This might be 2038
        // We need current year data (e.g., 2024 or 2023)
        const currentYear = new Date().getFullYear();
        const currentData = scenariosData.find(d => d.year === currentYear) || scenariosData[0];
        
        const real = currentData?.['Histórico'] || currentData?.['Medio'] || 0; // Fallback to Medio if no Historic
        const projected = currentData?.['Medio'] || 0;
        const deviation = projected > 0 ? ((real - projected) / projected) * 100 : 0;

        return {
            totalReal: real,
            totalProjected: projected,
            deviation: deviation
        };
    }, [scenariosData]);

    // Calculate current balance deficit (for alert)
    const currentYear = new Date().getFullYear();
    const currentBalance = balanceData.find(d => d.year === currentYear + 1) || balanceData[0]; // Look ahead
    const hasDeficit = currentBalance && currentBalance.deficit > 0;

    // Stable props
    const emptyFilters = useMemo(() => ({}), []);
    const mapValueFormatter = useCallback((val: number) => `${Math.round(val)} GBTUD`, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando datos de demanda...</div>;
    if (error) return (
        <div className="p-6 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <p>{error}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <FilterBar 
                showFieldFilter={false} 
                showRegionFilter={true} 
                activeFilters={emptyFilters}
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title={`Demanda ${currentYear} (Est.)`}
                    value={`${Math.round(kpis.totalReal).toLocaleString()} GBTUD`}
                    trend={1.5}
                    icon={TrendingUp}
                    color="blue"
                />
                 <MetricCard 
                    title="Proyección UPME (Medio)" 
                    value={`${Math.round(kpis.totalProjected).toLocaleString()} GBTUD`}
                    trend={0}
                    trendLabel="Meta anual"
                    icon={Zap}
                    color="purple"
                />
                <MetricCard 
                    title="Desviación" 
                    value={`${kpis.deviation > 0 ? '+' : ''}${kpis.deviation.toFixed(1)}%`}
                    trend={kpis.deviation}
                    trendLabel="vs Proyección"
                    icon={AlertTriangle}
                    color={Math.abs(kpis.deviation) > 5 ? 'orange' : 'green'}
                />
            </div>

            {/* Supply-Demand Balance Alert */}
            {hasDeficit && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4 animate-pulse">
                    <div className="bg-red-100 p-2 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800 text-lg">Alerta de Déficit Proyectado ({currentBalance.year})</h3>
                        <p className="text-red-700">
                            La demanda proyectada (Escenario Alto) supera la producción disponible en 
                            <span className="font-bold"> {Math.round(currentBalance.deficit)} GBTUD</span>.
                            Se requiere gestión inmediata de oferta.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Real vs Projected Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-800">Proyección de Demanda (Escenarios)</h3>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">UPME 2024-2038</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">Comparativa Histórico vs Escenarios (Bajo, Medio, Alto)</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={scenariosData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} label={{ value: 'GBTUD', angle: -90, position: 'insideLeft' }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Line type="monotone" dataKey="Bajo" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="Medio" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="Alto" stroke="#ef4444" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="Histórico" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sectoral Trends */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Tendencia por Sector (Esc. Medio)</h3>
                    <p className="text-sm text-slate-500 mb-6">Evolución del consumo por tipo de usuario</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sectorsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Area type="monotone" dataKey="TermoEléctrico" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                                <Area type="monotone" dataKey="Industrial" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                                <Area type="monotone" dataKey="Residencial" stackId="1" stroke="#10b981" fill="#10b981" />
                                <Area type="monotone" dataKey="GNC Transporte" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                                <Area type="monotone" dataKey="Petroquímica" stackId="1" stroke="#ec4899" fill="#ec4899" />
                                <Area type="monotone" dataKey="Refinería" stackId="1" stroke="#64748b" fill="#64748b" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Regional Map */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[600px]">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Mapa de Demanda Regional</h3>
                        <p className="text-sm text-slate-500">Intensidad de consumo promedio (2024-2038)</p>
                    </div>
                    <div className="bg-orange-50 p-2 rounded-lg">
                        <MapIcon className="w-6 h-6 text-orange-600" />
                    </div>
                </div>
                <div className="h-[500px] w-full">
                    <ColombiaMap 
                        data={mapData} 
                        valueFormatter={mapValueFormatter}
                        colorScale="orange"
                    />
                </div>
            </div>
        </div>
    );
};

export default Demanda;