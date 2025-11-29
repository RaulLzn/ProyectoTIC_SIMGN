import React, { useMemo, useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie, ComposedChart, Area 
} from 'recharts';
import { fetchProduction } from '../services/api';
import { adaptProduction } from '../adapters/adapters';
import { ProductionRecord, ProductionFilters } from '../types';
import { Factory, Flame, TrendingUp, AlertCircle, Building2 } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ProductionFilterBar from '../components/ProductionFilterBar';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const Production: React.FC = () => {
    const [productionData, setProductionData] = useState<ProductionRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<ProductionFilters>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await fetchProduction(activeFilters);
                const adaptedData = data.map(adaptProduction);
                setProductionData(adaptedData);
                console.log('Loaded production:', adaptedData.length, 'records');
            } catch (err) {
                console.error("Error loading production:", err);
                setError("No se pudieron cargar los datos de producción.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeFilters]);

    const totalProduction = useMemo(() => productionData.reduce((acc, curr) => acc + curr.valor, 0), [productionData]);

    const numberFormatter = (value: number) => 
        new Intl.NumberFormat('es-CO').format(value);

    // Time Series Data - Optimized with dynamic aggregation
    const timeSeriesData = useMemo(() => {
        if (productionData.length === 0) return [];
        
        // Calculate year range efficiently
        let minYear = Infinity;
        let maxYear = -Infinity;
        
        for (const r of productionData) {
            const year = parseInt(r.fecha_periodo.split('-')[0]);
            if (year < minYear) minYear = year;
            if (year > maxYear) maxYear = year;
        }
        
        const yearRange = maxYear - minYear + 1;
        const shouldAggregateByYear = yearRange > 2;
        
        if (shouldAggregateByYear) {
            // Aggregate by year
            const yearMap: Record<string, number> = {};
            for (const r of productionData) {
                const year = r.fecha_periodo.split('-')[0];
                yearMap[year] = (yearMap[year] || 0) + r.valor;
            }
            return Object.entries(yearMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => a.name.localeCompare(b.name));
        } else {
            // Aggregate by month
            const monthMap: Record<string, number> = {};
            for (const r of productionData) {
                monthMap[r.fecha_periodo] = (monthMap[r.fecha_periodo] || 0) + r.valor;
            }
            return Object.entries(monthMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => a.name.localeCompare(b.name));
        }
    }, [productionData]);

    // By Operator - Show ALL operators
    const byOperator = useMemo(() => {
        const map: Record<string, number> = {};
        for (const r of productionData) {
            const op = r.operador || 'Desconocido';
            map[op] = (map[op] || 0) + r.valor;
        }
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [productionData]);

    // By Field - Show ALL fields
    const byField = useMemo(() => {
        const map: Record<string, number> = {};
        for (const r of productionData) {
            const field = r.campo || 'Desconocido';
            map[field] = (map[field] || 0) + r.valor;
        }
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [productionData]);

    const handleFilterChange = (filters: ProductionFilters) => {
        setActiveFilters(filters);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando datos de producción...</div>;
    if (error) return (
        <div className="p-6 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <p>{error}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <ProductionFilterBar 
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange} 
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard 
                    title="Producción Total" 
                    value={`${numberFormatter(totalProduction)} MPC`}
                    icon={Flame}
                    color="orange"
                />
                <MetricCard 
                    title="Campos Activos" 
                    value={new Set(productionData.map(p => p.campo)).size.toString()} 
                    trendLabel="Operando"
                    icon={Factory}
                    color="blue"
                />
                <MetricCard 
                    title="Operadores" 
                    value={new Set(productionData.map(p => p.operador)).size.toString()} 
                    trendLabel="Activos"
                    icon={Building2}
                    color="purple"
                />
                <MetricCard 
                    title="Promedio Mensual" 
                    value={`${numberFormatter(timeSeriesData.length > 0 ? totalProduction / timeSeriesData.length : 0)} MPC`}
                    icon={TrendingUp}
                    color="green"
                />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Tendencia de Producción</h3>
                <p className="text-sm text-slate-500 mb-6">Volumen mensual de gas natural</p>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={timeSeriesData}>
                            <defs>
                                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                                dataKey="name" 
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis 
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                formatter={(value: any) => [numberFormatter(value) + ' MPC', 'Producción']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#f97316" 
                                strokeWidth={2}
                                fill="url(#colorProd)"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Operators - Top 15 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Top 15 Operadores</h3>
                    <p className="text-sm text-slate-500 mb-4">Principales operadoras por producción</p>
                    <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={byOperator.slice(0, 15)} 
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis 
                                    type="number" 
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                                />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    tick={{ fontSize: 11, fill: '#334155' }}
                                    width={145}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(value: any) => [numberFormatter(value) + ' MPC', 'Producción']}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={25}>
                                    {byOperator.slice(0, 15).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Fields - Top 15 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Top 15 Campos Productores</h3>
                    <p className="text-sm text-slate-500 mb-4">Principales campos por producción</p>
                    <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={byField.slice(0, 15)} 
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis 
                                    type="number" 
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                                />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    tick={{ fontSize: 11, fill: '#334155' }}
                                    width={145}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(value: any) => [numberFormatter(value) + ' MPC', 'Producción']}
                                />
                                <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} barSize={25} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Production;