import React, { useMemo, useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area, ComposedChart, Cell, ReferenceLine 
} from 'recharts';
import { fetchDemand } from '../services/api';
import { adaptDemand } from '../adapters/adapters';
import { DemandRecord } from '../types';
import { Users, Zap, BarChart3, AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import FilterBar from '../components/FilterBar';

const Demanda: React.FC = () => {
    const [demandData, setDemandData] = useState<DemandRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchDemand();
                const adaptedData = data.map(adaptDemand);
                console.log('Demand Data Sample:', adaptedData[0]);
                setDemandData(adaptedData);
            } catch (err) {
                console.error("Error loading demand:", err);
                setError("No se pudieron cargar los datos de demanda.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const totalDemand = useMemo(() => demandData.reduce((acc, curr) => acc + curr.valor_real, 0), [demandData]);

    const numberFormatter = (value: number) => 
        new Intl.NumberFormat('es-CO').format(value);

    // Time Series Data
    const timeSeriesData = useMemo(() => {
        const map = new Map<string, { name: string, real: number | null, projected: number | null }>();
        demandData.forEach(r => {
            const current = map.get(r.fecha_periodo) || { name: r.fecha_periodo, real: 0, projected: 0 };
            // We use non-null assertion or check because we initialized with 0
            const currentReal = current.real || 0;
            const currentProj = current.projected || 0;
            
            map.set(r.fecha_periodo, {
                name: r.fecha_periodo,
                real: currentReal + r.valor_real,
                projected: currentProj + r.valor_proyectado
            });
        });
        
        // Convert 0 to null to avoid lines dropping to zero in the chart
        return Array.from(map.values()).map(item => ({
            ...item,
            real: item.real === 0 ? null : item.real,
            projected: item.projected === 0 ? null : item.projected
        })).sort((a,b) => a.name.localeCompare(b.name));
    }, [demandData]);

    // Seasonality Data (Simulated for RF-09 "Estacionalidad")
    const seasonalityData = useMemo(() => {
        return [
            { month: 'Ene', factor: 0.95 }, { month: 'Feb', factor: 0.98 },
            { month: 'Mar', factor: 1.02 }, { month: 'Abr', factor: 1.05 },
            { month: 'May', factor: 1.00 }, { month: 'Jun', factor: 0.98 },
            { month: 'Jul', factor: 0.96 }, { month: 'Ago', factor: 1.01 },
            { month: 'Sep', factor: 1.03 }, { month: 'Oct', factor: 1.08 },
            { month: 'Nov', factor: 1.10 }, { month: 'Dic', factor: 0.90 },
        ];
    }, []);

    // By Sector
    const bySector = useMemo(() => {
        const map = new Map<string, number>();
        demandData.forEach(r => {
            map.set(r.sector, (map.get(r.sector) || 0) + r.valor_real);
        });
        return Array.from(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [demandData]);

    // By Region
    const byRegion = useMemo(() => {
        const map = new Map<string, number>();
        demandData.forEach(r => {
            map.set(r.region, (map.get(r.region) || 0) + r.valor_real);
        });
        return Array.from(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [demandData]);

    const totalReal = Math.round(timeSeriesData.reduce((acc, curr) => acc + (curr.real || 0), 0));
    const totalProj = Math.round(timeSeriesData.reduce((acc, curr) => acc + (curr.projected || 0), 0));
    const deviation = totalProj > 0 ? ((totalReal - totalProj) / totalProj) * 100 : 0;

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando datos de demanda...</div>;
    if (error) return (
        <div className="p-6 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <p>{error}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <FilterBar showFieldFilter={false} showRegionFilter={true} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard 
                    title="Demanda Real Acumulada" 
                    value={`${totalReal.toLocaleString()} GBTUD`}
                    trend={1.5}
                    icon={TrendingUp}
                    color="blue"
                />
                 <MetricCard 
                    title="Proyección UPME" 
                    value={`${totalProj.toLocaleString()} GBTUD`}
                    trend={0}
                    trendLabel="Meta anual"
                    icon={TrendingUp}
                    color="purple"
                />
                <MetricCard 
                    title="Desviación vs Proyección" 
                    value={`${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%`}
                    trend={deviation}
                    trendLabel="Diferencia Porcentual"
                    icon={AlertTriangle}
                    color={Math.abs(deviation) > 5 ? 'orange' : 'green'}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Proyección vs Realidad - RF-09 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Proyección vs Demanda Real</h3>
                    <p className="text-sm text-slate-500 mb-6">Comparativa de cumplimiento de metas UPME</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Area type="monotone" dataKey="real" name="Demanda Real" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" strokeWidth={3} />
                                <Line type="monotone" dataKey="projected" name="Proyección UPME" stroke="#f97316" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Estacionalidad de la Demanda - RF-09 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-800">Estacionalidad de la Demanda</h3>
                        <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">Análisis IA</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">Factores de consumo mensual promedio</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={seasonalityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0.8, 1.2]} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="factor" name="Factor Estacional" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                    {seasonalityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.factor > 1.05 ? '#f59e0b' : '#6366f1'} />
                                    ))}
                                </Bar>
                                <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="3 3" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Demanda por Sector</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={bySector} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Demanda por Región</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={byRegion} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Demanda;