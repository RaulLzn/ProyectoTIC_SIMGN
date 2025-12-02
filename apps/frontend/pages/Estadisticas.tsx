import React, { useState, useEffect } from 'react';
import { 
    BarChart3, TrendingUp, Activity, DollarSign, 
    ArrowUpRight, ArrowDownRight, Scale 
} from 'lucide-react';
import { 
    BarChart, Bar, LineChart, Line, ComposedChart, 
    PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
    fetchStatsKpis, fetchStatsProdVsRoyalties, 
    fetchStatsRegionalBalance, fetchProductionRanking 
} from '../services/api';

const Estadisticas = () => {
    const [kpis, setKpis] = useState<any>(null);
    const [prodVsRoy, setProdVsRoy] = useState<any[]>([]);
    const [regionalBalance, setRegionalBalance] = useState<any[]>([]);
    const [topOperators, setTopOperators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [kpisData, prodVsRoyData, regionalData, operatorsData] = await Promise.all([
                    fetchStatsKpis(),
                    fetchStatsProdVsRoyalties(),
                    fetchStatsRegionalBalance(),
                    fetchProductionRanking('operadora', undefined)
                ]);

                setKpis(kpisData);
                setProdVsRoy(prodVsRoyData);
                setRegionalBalance(regionalData);
                setTopOperators(operatorsData.slice(0, 5)); // Top 5
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Tablero de Control Estratégico</h2>
                <p className="text-slate-500">Visión consolidada de Producción, Regalías y Demanda</p>
            </div>

            {/* Executive KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard 
                    title="Producción Promedio"
                    value={`${kpis?.production_avg_gbtud?.toLocaleString('es-CO', { maximumFractionDigits: 0 })} GBTUD`}
                    subtitle={`Año ${kpis?.year}`}
                    icon={Activity}
                    color="blue"
                />
                <MetricCard 
                    title="Regalías Totales (Histórico)"
                    value={`$${(kpis?.royalties_total_historical_cop / 1000000000000).toFixed(1)}T`}
                    subtitle={`Recaudo ${kpis?.year}: $${(kpis?.royalties_annual_cop / 1000000000).toFixed(1)}B`}
                    icon={DollarSign}
                    color="amber"
                />
                <MetricCard 
                    title="Demanda Promedio"
                    value={`${kpis?.demand_avg_gbtud?.toLocaleString('es-CO', { maximumFractionDigits: 0 })} GBTUD`}
                    subtitle="Escenario Medio"
                    icon={TrendingUp}
                    color="emerald"
                />
                <MetricCard 
                    title="Ratio de Cobertura"
                    value={`${kpis?.coverage_ratio?.toFixed(1)}%`}
                    subtitle="Oferta / Demanda"
                    icon={Scale}
                    color={kpis?.coverage_ratio >= 100 ? "green" : "red"}
                />
            </div>

            {/* Strategic Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Valor vs Volumen */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Valor vs Volumen</h3>
                            <p className="text-sm text-slate-500">Correlación Producción vs Regalías (Intersección Histórica)</p>
                        </div>
                        <BarChart3 className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={prodVsRoy}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                                <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} tickFormatter={(val) => `$${(val/1000000000).toFixed(0)}B`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any, name: string) => {
                                        if (name === 'Producción') return [`${Number(value).toLocaleString()} KPC`, name];
                                        return [`$${Number(value).toLocaleString()} COP`, name];
                                    }}
                                />
                                <Legend />
                                <Bar yAxisId="left" dataKey="production_vol" name="Producción" fill="#3b82f6" fillOpacity={0.2} radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="royalties_val" name="Regalías" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Balance Regional */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Balance Regional</h3>
                            <p className="text-sm text-slate-500">
                                Superávit vs Déficit (Producción ANH - Demanda UPME)
                            </p>
                        </div>
                        <div className="group relative">
                            <Scale className="w-5 h-5 text-slate-400 cursor-help" />
                            <div className="absolute right-0 w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                Estimación basada en Producción Fiscalizada (ANH) vs Demanda Regional (UPME) distribuida por departamento.
                            </div>
                        </div>
                    </div>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={regionalBalance} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" stroke="#64748b" fontSize={12} />
                                <YAxis dataKey="department" type="category" stroke="#64748b" fontSize={11} width={100} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [`${Number(value).toFixed(0)} GBTUD`, 'Balance']}
                                />
                                <ReferenceLine x={0} stroke="#94a3b8" />
                                <Bar dataKey="balance" name="Balance" radius={[0, 4, 4, 0]}>
                                    {regionalBalance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.balance > 0 ? '#10b981' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Operadores */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Top Operadores</h3>
                            <p className="text-sm text-slate-500">Participación en la Oferta</p>
                        </div>
                        <Activity className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={topOperators}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {topOperators.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Insight Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-sm border border-slate-700 p-6 text-white flex flex-col justify-center">
                    <h3 className="text-xl font-bold mb-4">Insights Clave</h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg mt-1">
                                <Activity className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-blue-100">Eficiencia Económica</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    La correlación Valor/Volumen muestra cómo los precios internacionales impactan el recaudo de regalías independiente de la producción.
                                </p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg mt-1">
                                <Scale className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-medium text-emerald-100">Autosuficiencia Regional</p>
                                <p className="text-sm text-slate-400 mt-1">
                                    {regionalBalance.filter(r => r.balance > 0).length} departamentos son excedentarios, mientras que {regionalBalance.filter(r => r.balance < 0).length} dependen del suministro externo.
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>

            </div>
        </div>
    );
};

const MetricCard = ({ title, value, subtitle, icon: Icon, color }: any) => {
    const colorClasses: any = {
        blue: "text-blue-600 bg-blue-50",
        amber: "text-amber-600 bg-amber-50",
        emerald: "text-emerald-600 bg-emerald-50",
        green: "text-green-600 bg-green-50",
        red: "text-red-600 bg-red-50",
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900">{value}</span>
                <span className="text-xs text-slate-500 mt-1">{subtitle}</span>
            </div>
        </div>
    );
};

export default Estadisticas;
