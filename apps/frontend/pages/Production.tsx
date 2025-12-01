import React, { useMemo, useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie, ComposedChart, Area 
} from 'recharts';
import { fetchProductionKPIs, fetchProductionTrend, fetchProductionRanking } from '../services/api';
import { ProductionFilters } from '../types';
import { Factory, Flame, TrendingUp, AlertCircle, Building2 } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ProductionFilterBar from '../components/ProductionFilterBar';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

const Production: React.FC = () => {
    // Aggregated State
    const [kpis, setKpis] = useState({ totalProduction: 0, activeFields: 0, activeOperators: 0, averageMonthly: 0 });
    const [trendData, setTrendData] = useState<any[]>([]);
    const [operatorRanking, setOperatorRanking] = useState<any[]>([]);
    const [fieldRanking, setFieldRanking] = useState<any[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<ProductionFilters>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Fetch all aggregated data in parallel
                const [kpiData, trend, topOperators, topFields] = await Promise.all([
                    fetchProductionKPIs(activeFilters),
                    fetchProductionTrend(activeFilters),
                    fetchProductionRanking('operadora', activeFilters),
                    fetchProductionRanking('campo', activeFilters)
                ]);
                
                setKpis(kpiData);
                setTrendData(trend);
                setOperatorRanking(topOperators);
                setFieldRanking(topFields);
                
                console.log('Loaded aggregated data');
            } catch (err) {
                console.error("Error loading production data:", err);
                setError("No se pudieron cargar los datos de producción.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeFilters]);

    const numberFormatter = (value: number) => 
        new Intl.NumberFormat('es-CO').format(value);

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
                    value={`${numberFormatter(kpis.totalProduction)} MPC`}
                    icon={Flame}
                    color="orange"
                />
                <MetricCard 
                    title="Campos Activos" 
                    value={kpis.activeFields.toString()} 
                    trendLabel="Operando"
                    icon={Factory}
                    color="blue"
                />
                <MetricCard 
                    title="Operadores" 
                    value={kpis.activeOperators.toString()} 
                    trendLabel="Activos"
                    icon={Building2}
                    color="purple"
                />
                <MetricCard 
                    title="Promedio Mensual" 
                    value={`${numberFormatter(kpis.averageMonthly)} MPC`}
                    icon={TrendingUp}
                    color="green"
                />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Tendencia de Producción</h3>
                <p className="text-sm text-slate-500 mb-6">Volumen mensual de gas natural</p>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={trendData}>
                            <defs>
                                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                                dataKey="year" 
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tickFormatter={(val) => val.toString()}
                            />
                            <YAxis 
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                formatter={(value: any) => [numberFormatter(value) + ' MPC', 'Producción']}
                                labelFormatter={(label) => `Año: ${label}`}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="total" 
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
                                data={operatorRanking} 
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
                                    {operatorRanking.map((entry, index) => (
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
                                data={fieldRanking} 
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