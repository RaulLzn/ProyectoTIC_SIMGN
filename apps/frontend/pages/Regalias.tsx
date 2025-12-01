import React, { useMemo, useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area,
    PieChart, Pie, Legend, LineChart, Line, ComposedChart
} from 'recharts';
import { fetchRoyaltiesKPIs, fetchRoyaltiesTrend, fetchRoyaltiesMap, fetchRoyaltiesDistribution, fetchRoyaltiesRanking } from '../services/api';
import { adaptRoyalty } from '../adapters/adapters';
import { RoyaltyRecord, MapData, RoyaltiesFilters } from '../types';
import { Coins, DollarSign, TrendingUp, AlertCircle, Droplets, Flame, Activity } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ColombiaMap from '../components/ColombiaMap';
import FilterBar from '../components/FilterBar';
import { getTipoHidrocarburoLabel, getTipoProduccionLabel } from '../utils/nomenclature';
import { normalizeDepartmentName } from '../utils/departmentNames';

const Regalias: React.FC = () => {
    // Aggregated State
    const [kpis, setKpis] = useState({ totalAmount: 0, totalVolume: 0, avgPriceUsd: 0, municipalities: 0 });
    const [trendData, setTrendData] = useState<any[]>([]);
    const [mapData, setMapData] = useState<MapData[]>([]);
    const [distributionData, setDistributionData] = useState<any[]>([]);
    const [rankingData, setRankingData] = useState<any[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<RoyaltiesFilters>({});

    const currencyFormatter = (value: number) => 
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

    const numberFormatter = (value: number) => 
        new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Fetch all aggregated data in parallel
                const [kpiData, trend, map, dist, ranking] = await Promise.all([
                    fetchRoyaltiesKPIs(activeFilters),
                    fetchRoyaltiesTrend(activeFilters),
                    fetchRoyaltiesMap(activeFilters),
                    fetchRoyaltiesDistribution(activeFilters),
                    fetchRoyaltiesRanking(activeFilters)
                ]);

                setKpis(kpiData);
                setTrendData(trend);
                
                // Process map data for component
                const processedMapData = map.map((item: any) => ({
                    departmentId: normalizeDepartmentName(item.department),
                    departmentName: normalizeDepartmentName(item.department),
                    value: item.value,
                    formattedValue: currencyFormatter(item.value),
                    metricLabel: 'Regalías'
                }));
                setMapData(processedMapData);

                // Process distribution data
                const processedDist = dist.map((item: any) => ({
                    name: getTipoHidrocarburoLabel(item.name),
                    value: item.value
                }));
                setDistributionData(processedDist);

                // Process ranking data
                // Note: Backend currently doesn't return types per field for icon logic, 
                // so we'll simplify or need to update backend if icons are critical.
                // For now, let's just show the name.
                const processedRanking = ranking.map((item: any) => ({
                    name: item.name,
                    value: item.value,
                    rawName: item.name
                }));
                setRankingData(processedRanking);
                
                console.log('Loaded aggregated royalties data');
            } catch (err) {
                console.error("Error loading royalties:", err);
                setError("No se pudieron cargar los datos de regalías. Asegúrese de que el backend esté en ejecución.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeFilters]);


    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const handleFilterChange = (filters: RoyaltiesFilters) => {
        setActiveFilters(filters);
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando datos de regalías...</div>;
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-6 h-6" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <FilterBar 
                activeFilters={activeFilters}
                showFieldFilter={true} 
                showRegionFilter={true} 
                showYearFilter={true}
                showHydrocarbonFilter={true}
                onFilterChange={handleFilterChange}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Total Regalías" 
                    value={currencyFormatter(kpis.totalAmount)}
                    icon={DollarSign}
                    color="green"
                />
                <MetricCard 
                    title="Volumen Total" 
                    value={numberFormatter(kpis.totalVolume)} 
                    trendLabel="Bls/Kpc"
                    icon={Droplets}
                    color="blue"
                />
                <MetricCard 
                    title="Precio Promedio" 
                    value={`$${numberFormatter(kpis.avgPriceUsd)}`} 
                    trendLabel="USD/Unidad"
                    icon={Activity}
                    color="orange"
                />
                <MetricCard 
                    title="Municipios" 
                    value={kpis.municipalities.toString()} 
                    trendLabel="Beneficiados"
                    icon={Coins}
                    color="purple"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolution Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Evolución de Recaudo y Precios</h3>
                    <p className="text-sm text-slate-500 mb-6">Relación entre regalías liquidadas y precio internacional</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="year" 
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tickFormatter={(val) => val ? val.toString() : ''}
                                />
                                <YAxis 
                                    yAxisId="left"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickFormatter={(val) => `${(val / 1000000000).toFixed(0)}B`}
                                />
                                <YAxis 
                                    yAxisId="right" 
                                    orientation="right"
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickFormatter={(val) => `$${val.toFixed(0)}`}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(value: any, name: string) => {
                                        if (name === 'Regalías (COP)') return [currencyFormatter(value), name];
                                        if (name === 'Precio Promedio (USD)') return [`$${value.toFixed(2)}`, name];
                                        return [value, name];
                                    }}
                                    labelFormatter={(label) => `Año: ${label}`}
                                />
                                <Area 
                                    yAxisId="left"
                                    type="monotone" 
                                    dataKey="valor" 
                                    stroke="#10b981" 
                                    strokeWidth={2}
                                    fill="url(#colorValor)"
                                    name="Regalías (COP)"
                                />
                                <Line 
                                    yAxisId="right"
                                    type="monotone" 
                                    dataKey="precio" 
                                    stroke="#f59e0b" 
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name="Precio Promedio (USD)"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution by Type */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Por Tipo de Hidrocarburo</h3>
                    <p className="text-sm text-slate-500 mb-6">Distribución del valor liquidado</p>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => currencyFormatter(value)} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Mapa Financiero (COP)</h3>
                    <p className="text-sm text-slate-500 mb-4">Distribución de regalías por departamento productor</p>
                    <div className="h-[500px] overflow-hidden">
                        <ColombiaMap 
                            data={mapData} 
                            title="" 
                            valueFormatter={(v) => currencyFormatter(v)}
                            colorScale="green"
                        />
                    </div>
                </div>

                {/* Top Fields - Top 20 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Top 20 Campos Generadores</h3>
                    <p className="text-sm text-slate-500 mb-4">Principales campos por regalías generadas</p>
                    <div className="h-[600px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={rankingData} 
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 160, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis 
                                    type="number" 
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(val) => `${(val / 1000000000).toFixed(1)}B`}
                                />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    tick={{ fontSize: 11, fill: '#334155' }}
                                    width={155}
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                    formatter={(value: any) => [currencyFormatter(value), 'Regalías']}
                                    labelFormatter={(label: string) => label.replace(/[🛢️💨]/g, '').trim()}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
                                    {rankingData.map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.name.includes('Gas') && entry.name.includes('Aceite') ? '#8b5cf6' : 
                                                  entry.name.includes('Gas') ? '#3b82f6' : '#10b981'} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-green-500"></div>
                            <span className="text-slate-600">🛢️ Petróleo</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-blue-500"></div>
                            <span className="text-slate-600">💨 Gas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-purple-500"></div>
                            <span className="text-slate-600">🛢️💨 Ambos</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Regalias;