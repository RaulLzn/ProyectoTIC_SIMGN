import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchProduction, fetchDemand, fetchRoyalties } from '../services/api';
import { adaptProduction, adaptDemand, adaptRoyalty } from '../adapters/adapters';
import { ProductionRecord, DemandRecord, RoyaltyRecord } from '../types';

const Estadisticas = () => {
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
                console.error("Error loading statistics data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Cálculos estadísticos
    const totalProduccion = productionData.reduce((sum, item) => sum + item.valor, 0);
    const totalDemanda = demandData.reduce((sum, item) => sum + item.valor_real, 0);
    const totalRegalias = royaltiesData.reduce((sum, item) => sum + item.valor, 0);
    
    const promProduccion = productionData.length ? totalProduccion / productionData.length : 0;
    const promDemanda = demandData.length ? totalDemanda / demandData.length : 0;
    const promRegalias = royaltiesData.length ? totalRegalias / royaltiesData.length : 0;

    // Distribución por fuente (por operador)
    const distribucionProduccion = useMemo(() => {
        const operadorMap = new Map<string, number>();
        productionData.forEach(p => {
            operadorMap.set(p.operador, (operadorMap.get(p.operador) || 0) + p.valor);
        });
        return Array.from(operadorMap).map(([name, value]) => ({ name, value }));
    }, [productionData]);

    // Comparación mensual
    const comparacionMensual = useMemo(() => {
        const periodoMap = new Map<string, { produccion: number; demanda: number }>();
        productionData.forEach(p => {
            const existing = periodoMap.get(p.fecha_periodo) || { produccion: 0, demanda: 0 };
            existing.produccion += p.valor;
            periodoMap.set(p.fecha_periodo, existing);
        });
        demandData.forEach(d => {
            const existing = periodoMap.get(d.fecha_periodo) || { produccion: 0, demanda: 0 };
            existing.demanda += d.valor_real;
            periodoMap.set(d.fecha_periodo, existing);
        });
        return Array.from(periodoMap).map(([mes, data]) => ({
            mes: mes.substring(5), // Solo mostrar MM
            produccion: data.produccion,
            demanda: data.demanda,
            diferencia: data.produccion - data.demanda
        })).sort((a, b) => a.mes.localeCompare(b.mes));
    }, [productionData, demandData]);

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
                        {(totalProduccion / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-slate-500 mt-1">GBTUD acumulado</p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-600">Demanda Total</h3>
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        {(totalDemanda / 1000).toFixed(1)}K
                    </p>
                    <p className="text-xs text-slate-500 mt-1">GBTUD acumulado</p>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-600">Regalías Total</h3>
                        <BarChart3 className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                        ${(totalRegalias / 1000000).toFixed(1)}M
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
                            <XAxis dataKey="mes" stroke="#64748b" style={{ fontSize: '12px' }} />
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
                        <XAxis dataKey="mes" stroke="#64748b" style={{ fontSize: '12px' }} />
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
                            <span className="font-bold text-blue-900">{promProduccion.toFixed(1)} GBTUD</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700">Máximo:</span>
                            <span className="font-bold text-blue-900">
                                {productionData.length ? Math.max(...productionData.map(p => p.valor)).toFixed(1) : 0} GBTUD
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-700">Mínimo:</span>
                            <span className="font-bold text-blue-900">
                                {productionData.length ? Math.min(...productionData.map(p => p.valor)).toFixed(1) : 0} GBTUD
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border border-emerald-200">
                    <h4 className="text-sm font-semibold text-emerald-900 mb-3">Demanda</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-emerald-700">Promedio mensual:</span>
                            <span className="font-bold text-emerald-900">{promDemanda.toFixed(1)} GBTUD</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-emerald-700">Máximo:</span>
                            <span className="font-bold text-emerald-900">
                                {demandData.length ? Math.max(...demandData.map(d => d.valor_real)).toFixed(1) : 0} GBTUD
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-emerald-700">Mínimo:</span>
                            <span className="font-bold text-emerald-900">
                                {demandData.length ? Math.min(...demandData.map(d => d.valor_real)).toFixed(1) : 0} GBTUD
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
                    <h4 className="text-sm font-semibold text-amber-900 mb-3">Regalías</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-amber-700">Promedio mensual:</span>
                            <span className="font-bold text-amber-900">${(promRegalias / 1000000).toFixed(1)}M COP</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-amber-700">Máximo:</span>
                            <span className="font-bold text-amber-900">
                                {royaltiesData.length ? `$${(Math.max(...royaltiesData.map(r => r.valor)) / 1000000).toFixed(1)}M COP` : '$0 COP'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-amber-700">Mínimo:</span>
                            <span className="font-bold text-amber-900">
                                {royaltiesData.length ? `$${(Math.min(...royaltiesData.map(r => r.valor)) / 1000000).toFixed(1)}M COP` : '$0 COP'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Estadisticas;
