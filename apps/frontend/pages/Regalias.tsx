import React, { useMemo, useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area,
    PieChart, Pie, Legend, LineChart, Line, ComposedChart
} from 'recharts';
import { fetchRoyalties } from '../services/api';
import { adaptRoyalty } from '../adapters/adapters';
import { RoyaltyRecord, MapData, RoyaltiesFilters } from '../types';
import { Coins, DollarSign, TrendingUp, AlertCircle, Droplets, Flame, Activity } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ColombiaMap from '../components/ColombiaMap';
import FilterBar from '../components/FilterBar';
import { getTipoHidrocarburoLabel, getTipoProduccionLabel } from '../utils/nomenclature';
import { normalizeDepartmentName } from '../utils/departmentNames';

const Regalias: React.FC = () => {
    const [royalties, setRoyalties] = useState<RoyaltyRecord[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilters, setActiveFilters] = useState<RoyaltiesFilters>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await fetchRoyalties(activeFilters);
                const adaptedData = data.map(adaptRoyalty);
                setRoyalties(adaptedData);
                console.log('Loaded royalties:', adaptedData.length, 'records');
                console.log('Sample:', adaptedData[0]);
            } catch (err) {
                console.error("Error loading royalties:", err);
                setError("No se pudieron cargar los datos de regalías. Asegúrese de que el backend esté en ejecución.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeFilters]);

    const totalAmount = useMemo(() => royalties.reduce((acc, curr) => acc + curr.valor, 0), [royalties]);
    const totalVolume = useMemo(() => royalties.reduce((acc, curr) => acc + (curr.volumen_regalia || 0), 0), [royalties]);
    const avgPriceUsd = useMemo(() => {
        const valid = royalties.filter(r => r.precio_usd > 0);
        return valid.length ? valid.reduce((acc, curr) => acc + curr.precio_usd, 0) / valid.length : 0;
    }, [royalties]);

    const currencyFormatter = (value: number) => 
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

    const numberFormatter = (value: number) => 
        new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value);

    // Map Data - Using departamento from backend with normalization
    const mapData: MapData[] = useMemo(() => {
        const map = new Map<string, number>();
        royalties.forEach(r => {
            // Normalize department name to match ColombiaMap expectations
            const dept = normalizeDepartmentName(r.entidad_territorial);
            if (dept && dept !== 'Desconocido') {
                map.set(dept, (map.get(dept) || 0) + r.valor);
            }
        });
        const result = Array.from(map).map(([name, value]) => ({
            departmentId: name,
            departmentName: name,
            value: value,
            formattedValue: currencyFormatter(value),
            metricLabel: 'Regalías'
        }));
        console.log('Map data generated:', result.length, 'departments');
        console.log('All departments:', result.map(d => d.departmentName));
        console.log('Sample values:', result.slice(0, 3));
        return result;
    }, [royalties]);

    // Time Series Data - Optimized for large datasets
    const timeSeriesData = useMemo(() => {
        if (royalties.length === 0) return [];
        
        // Calculate year range efficiently
        let minYear = Infinity;
        let maxYear = -Infinity;
        
        for (const r of royalties) {
            if (r.anio < minYear) minYear = r.anio;
            if (r.anio > maxYear) maxYear = r.anio;
        }
        
        const yearRange = maxYear - minYear + 1;
        const shouldAggregateByYear = yearRange > 2;
        
        if (shouldAggregateByYear) {
            // Aggregate by year - optimized for large datasets
            const yearMap: Record<number, { valor: number; volumen: number; precio: number; count: number }> = {};
            
            for (const r of royalties) {
                const year = r.anio;
                if (!yearMap[year]) {
                    yearMap[year] = { valor: 0, volumen: 0, precio: 0, count: 0 };
                }
                yearMap[year].valor += r.valor;
                yearMap[year].volumen += r.volumen_regalia || 0;
                yearMap[year].precio += r.precio_usd || 0;
                yearMap[year].count += 1;
            }
            
            return Object.entries(yearMap)
                .map(([year, data]) => ({
                    name: year,
                    valor: data.valor,
                    volumen: data.volumen,
                    precio: data.count > 0 ? data.precio / data.count : 0
                }))
                .sort((a, b) => parseInt(a.name) - parseInt(b.name));
        } else {
            // Aggregate by month - optimized
            const monthMap: Record<string, { valor: number; volumen: number; precio: number; count: number }> = {};
            
            for (const r of royalties) {
                const key = r.fecha_periodo;
                if (!monthMap[key]) {
                    monthMap[key] = { valor: 0, volumen: 0, precio: 0, count: 0 };
                }
                monthMap[key].valor += r.valor;
                monthMap[key].volumen += r.volumen_regalia || 0;
                monthMap[key].precio += r.precio_usd || 0;
                monthMap[key].count += 1;
            }
            
            return Object.entries(monthMap)
                .map(([month, data]) => ({
                    name: month,
                    valor: data.valor,
                    volumen: data.volumen,
                    precio: data.count > 0 ? data.precio / data.count : 0
                }))
                .sort((a, b) => a.name.localeCompare(b.name));
        }
    }, [royalties]);

    // By Hydrocarbon Type
    const byType = useMemo(() => {
        const map = new Map<string, number>();
        royalties.forEach(r => {
            const type = getTipoHidrocarburoLabel(r.tipo_hidrocarburo);
            map.set(type, (map.get(type) || 0) + r.valor);
        });
        return Array.from(map).map(([name, value]) => ({ name, value }));
    }, [royalties]);

    // Top Fields - Show ALL fields with hydrocarbon type
    const byField = useMemo(() => {
        const fieldMap: Record<string, { valor: number; tipos: Set<string> }> = {};
        
        for (const r of royalties) {
            const field = r.campo || 'Desconocido';
            if (!fieldMap[field]) {
                fieldMap[field] = { valor: 0, tipos: new Set() };
            }
            fieldMap[field].valor += r.valor;
            if (r.tipo_hidrocarburo) {
                fieldMap[field].tipos.add(r.tipo_hidrocarburo);
            }
        }
        
        return Object.entries(fieldMap)
            .map(([name, data]) => {
                // Determine icon based on hydrocarbon types
                const tipos = Array.from(data.tipos);
                let icon = '';
                if (tipos.includes('G') && tipos.includes('O')) {
                    icon = '🛢️💨'; // Both
                } else if (tipos.includes('G')) {
                    icon = '💨'; // Gas
                } else if (tipos.includes('O')) {
                    icon = '🛢️'; // Oil
                }
                
                return {
                    name: `${icon} ${name}`,
                    value: data.valor,
                    rawName: name
                };
            })
            .sort((a, b) => b.value - a.value); // Sort by value descending (top to bottom)
    }, [royalties]);

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
                    value={currencyFormatter(totalAmount)}
                    icon={DollarSign}
                    color="green"
                />
                <MetricCard 
                    title="Volumen Total" 
                    value={numberFormatter(totalVolume)} 
                    trendLabel="Bls/Kpc"
                    icon={Droplets}
                    color="blue"
                />
                <MetricCard 
                    title="Precio Promedio" 
                    value={`$${numberFormatter(avgPriceUsd)}`} 
                    trendLabel="USD/Unidad"
                    icon={Activity}
                    color="orange"
                />
                <MetricCard 
                    title="Municipios" 
                    value={new Set(royalties.map(r => r.municipio)).size.toString()} 
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
                            <ComposedChart data={timeSeriesData}>
                                <defs>
                                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                                    data={byType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {byType.map((entry, index) => (
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
                                data={byField.slice(0, 20)} 
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
                                    {byField.slice(0, 20).map((entry, index) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={entry.name.includes('💨') && entry.name.includes('🛢️') ? '#8b5cf6' : 
                                                  entry.name.includes('💨') ? '#3b82f6' : '#10b981'} 
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