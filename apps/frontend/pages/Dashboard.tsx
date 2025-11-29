import React, { useState, useEffect, useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Legend, ReferenceLine 
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { Factory, TrendingUp, Coins, Activity } from 'lucide-react';
import { fetchProduction, fetchDemand, fetchRoyalties } from '../services/api';
import { adaptProduction, adaptDemand, adaptRoyalty } from '../adapters/adapters';
import { ProductionRecord, DemandRecord, RoyaltyRecord } from '../types';

const Dashboard: React.FC = () => {
    const [productionData, setProductionData] = useState<ProductionRecord[]>([]);
    const [demandData, setDemandData] = useState<DemandRecord[]>([]);
    const [royaltiesData, setRoyaltiesData] = useState<RoyaltyRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [prod, dem, roy] = await Promise.all([
                    fetchProduction(),
                    fetchDemand(),
                    fetchRoyalties()
                ]);
                setProductionData(prod.map(adaptProduction));
                setDemandData(dem.map(adaptDemand));
                setRoyaltiesData(roy.map(adaptRoyalty));
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Process data for charts
    const chartData = useMemo(() => {
        return productionData.reduce((acc: any[], curr) => {
            const existing = acc.find(a => a.name === curr.fecha_periodo);
            if (existing) {
                existing.production += curr.valor;
            } else {
                acc.push({ name: curr.fecha_periodo, production: curr.valor, demand: 0 });
            }
            return acc;
        }, []).map(item => {
            // Add demand to the same periods
            const demandForPeriod = demandData.filter(d => d.fecha_periodo === item.name).reduce((sum, d) => sum + d.valor_real, 0);
            return { ...item, demand: demandForPeriod };
        }).sort((a, b) => a.name.localeCompare(b.name));
    }, [productionData, demandData]);

    // Calculate Totals for Cards
    const totalProd = Math.round(productionData.reduce((acc, curr) => acc + curr.valor, 0));
    const totalDemand = Math.round(demandData.reduce((acc, curr) => acc + curr.valor_real, 0));
    const totalRoyalties = royaltiesData.reduce((acc, curr) => acc + curr.valor, 0);

    const formatter = (value: number) => new Intl.NumberFormat('es-CO', { notation: "compact", compactDisplay: "short" }).format(value);
    const currencyFormatter = (value: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: "compact" }).format(value);

    if (loading) {
        return <div className="flex justify-center items-center h-96">Cargando tablero...</div>;
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Producción Total (Año)" 
                    value={`${formatter(totalProd)} mpc`}
                    trend={2.4}
                    icon={Factory}
                    color="blue"
                />
                <MetricCard 
                    title="Demanda Total (Año)" 
                    value={`${formatter(totalDemand)} mpc`}
                    trend={-1.2}
                    icon={TrendingUp}
                    color="orange"
                />
                <MetricCard 
                    title="Regalías Liquidadas" 
                    value={currencyFormatter(totalRoyalties)}
                    trend={5.8}
                    icon={Coins}
                    color="green"
                />
                <MetricCard 
                    title="Balance Oferta/Demanda" 
                    value={`${((totalProd / totalDemand) * 100).toFixed(1)}%`}
                    trend={0.5}
                    trendLabel="Cobertura"
                    icon={Activity}
                    color="purple"
                />
            </div>

            {/* Main Integrated Analysis Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Balance: Producción vs Demanda</h3>
                        <select className="text-sm border-slate-200 rounded-md text-slate-600 focus:ring-blue-500 border p-1">
                            <option>Últimos 12 meses</option>
                            <option>Año Actual</option>
                        </select>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorDem" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatter} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`${formatter(value)} mpc`, '']}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="production" name="Producción" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" />
                                <Area type="monotone" dataKey="demand" name="Demanda" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorDem)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Eficiencia por Mes</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" fontSize={11} width={60} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <ReferenceLine x={0} stroke="#000" />
                                <Bar dataKey="production" name="Producción" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} />
                                <Bar dataKey="demand" name="Demanda" fill="#f97316" radius={[0, 4, 4, 0]} barSize={15} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;