import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
    fetchProductionKPIs, fetchDemandKPIs, fetchRoyaltiesKPIs,
    fetchProductionTrend, fetchDemandTrend, fetchRoyaltiesTrend,
    fetchProductionRanking
} from '../services/api';

const Estadisticas = () => {
    const [kpis, setKpis] = useState({
        prod: { total: 0, avg: 0 },
        dem: { total: 0, avg: 0 },
        roy: { total: 0, avg: 0 }
    });
    const [trends, setTrends] = useState({
        prod: [] as any[],
        dem: [] as any[],
        roy: [] as any[]
    });
    const [distribucionProduccion, setDistribucionProduccion] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [
                    prodKPIs, demKPIs, royKPIs,
                    prodTrend, demTrend, royTrend,
                    prodDist
                ] = await Promise.all([
                    fetchProductionKPIs(),
                    fetchDemandKPIs(),
                    fetchRoyaltiesKPIs(),
                    fetchProductionTrend(),
                    fetchDemandTrend(),
                    fetchRoyaltiesTrend(),
                    fetchProductionRanking('operadora', undefined) // Top operators
                ]);

                setKpis({
                    prod: { total: prodKPIs.totalProduction, avg: prodKPIs.averageMonthly },
                    dem: { total: demKPIs.totalReal + demKPIs.totalProjected, avg: 0 }, // Avg calculated later
                    roy: { total: royKPIs.totalAmount, avg: 0 } // Avg calculated later
                });

                setTrends({
                    prod: prodTrend,
                    dem: demTrend,
                    roy: royTrend
                });

                setDistribucionProduccion(prodDist);

            } catch (error) {
                console.error("Error loading statistics data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Comparación mensual (Merge trends)
    const comparacionMensual = useMemo(() => {
        const map = new Map<string, { produccion: number; demanda: number }>();
        
        trends.prod.forEach(p => {
            const key = `${p.year}-${String(p.month).padStart(2, '0')}`;
            if (!map.has(key)) map.set(key, { produccion: 0, demanda: 0 });
            map.get(key)!.produccion = p.total;
        });

        trends.dem.forEach(d => {
            // d.name is already YYYY-MM
            const key = d.name;
            if (!map.has(key)) map.set(key, { produccion: 0, demanda: 0 });
            map.get(key)!.demanda = d.real + d.projected;
        });

        return Array.from(map).map(([mes, data]) => ({
            mes: mes, // Keep YYYY-MM for sorting
            displayMes: mes.substring(5), // MM
            produccion: data.produccion,
            demanda: data.demanda,
            diferencia: data.produccion - data.demanda
        })).sort((a, b) => a.mes.localeCompare(b.mes));
    }, [trends]);

    // Tendencias
    const promTendencia = useMemo(() => {
        const ultimosMeses = comparacionMensual.slice(-6);
        if (ultimosMeses.length < 2) return 0;
        
        const tendenciaProduccion = ultimosMeses.map((item, idx, arr) => {
            if (idx === 0) return 0;
            return ((item.produccion - arr[idx - 1].produccion) / arr[idx - 1].produccion) * 100;
        });
        return tendenciaProduccion.slice(1).reduce((a, b) => a + b, 0) / (tendenciaProduccion.length - 1);
    }, [comparacionMensual]);

    if (loading) return <div className="flex justify-center items-center h-96">Cargando estadísticas...</div>;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-6">
            {/* Resumen Estadístico */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-600">Producción Total</h3>
                        <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {(kpis.prod.total / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-slate-500 mt-1">GBTUD acumulado</p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-600">Demanda Total</h3>
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {(kpis.dem.total / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-slate-500 mt-1">GBTUD acumulado</p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-600">Regalías Total</h3>
                        <BarChart3 className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        ${(kpis.roy.total / 1000000).toFixed(1)}M
                    </p>
                    <p className="text-xs text-slate-500 mt-1">COP recaudado</p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-600">Tendencia</h3>
                        {promTendencia >= 0 ? (
                            <TrendingUp className="w-5 h-5 text-green-500" />
                        ) : (
                            <TrendingDown className="w-5 h-5 text-red-500" />
                        )}
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {promTendencia >= 0 ? '+' : ''}{promTendencia.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Variación mensual</p>
                </div>
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Comparación Producción vs Demanda */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-slate-600" />
                        <h3 className="text-lg font-semibold text-slate-900">Producción vs Demanda</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={comparacionMensual}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="displayMes" stroke="#64748b" style={{ fontSize: '12px' }} />
                            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="produccion" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                name="Producción (GBTUD)"
                            />
                            <Line 
                                type="monotone" 
                                dataKey="demanda" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                name="Demanda (GBTUD)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Distribución por Fuente */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-slate-600" />
                        <h3 className="text-lg font-semibold text-slate-900">Distribución Producción</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={distribucionProduccion}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {distribucionProduccion.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#fff', 
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Balance Oferta-Demanda */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Balance Mensual (Producción - Demanda)</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparacionMensual}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="displayMes" stroke="#64748b" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#fff', 
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Legend />
                        <Bar 
                            dataKey="diferencia" 
                            fill="#8b5cf6" 
                            name="Balance (GBTUD)"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Estadísticas Detalladas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3">Producción</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-blue-700">Promedio mensual:</span>
                            <span className="font-bold text-blue-900">{kpis.prod.avg.toFixed(1)} GBTUD</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700">Máximo:</span>
                            <span className="font-bold text-blue-900">
                                {trends.prod.length ? Math.max(...trends.prod.map(p => p.total)).toFixed(1) : 0} GBTUD
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700">Mínimo:</span>
                            <span className="font-bold text-blue-900">
                                {trends.prod.length ? Math.min(...trends.prod.map(p => p.total)).toFixed(1) : 0} GBTUD
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
                    <h4 className="text-sm font-semibold text-emerald-900 mb-3">Demanda</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-emerald-700">Promedio mensual:</span>
                            <span className="font-bold text-emerald-900">{(trends.dem.length ? (kpis.dem.total / trends.dem.length) : 0).toFixed(1)} GBTUD</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-emerald-700">Máximo:</span>
                            <span className="font-bold text-emerald-900">
                                {trends.dem.length ? Math.max(...trends.dem.map(d => d.real + d.projected)).toFixed(1) : 0} GBTUD
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-emerald-700">Mínimo:</span>
                            <span className="font-bold text-emerald-900">
                                {trends.dem.length ? Math.min(...trends.dem.map(d => d.real + d.projected)).toFixed(1) : 0} GBTUD
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
                    <h4 className="text-sm font-semibold text-amber-900 mb-3">Regalías</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-amber-700">Promedio mensual:</span>
                            <span className="font-bold text-amber-900">${(trends.roy.length ? (kpis.roy.total / trends.roy.length) / 1000000 : 0).toFixed(1)}M COP</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-amber-700">Máximo:</span>
                            <span className="font-bold text-amber-900">
                                {trends.roy.length ? `$${(Math.max(...trends.roy.map(r => r.valor)) / 1000000).toFixed(1)}M COP` : '$0 COP'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-amber-700">Mínimo:</span>
                            <span className="font-bold text-amber-900">
                                {trends.roy.length ? `$${(Math.min(...trends.roy.map(r => r.valor)) / 1000000).toFixed(1)}M COP` : '$0 COP'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Estadisticas;
