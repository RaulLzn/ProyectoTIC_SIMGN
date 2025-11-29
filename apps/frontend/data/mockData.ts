import { ProductionRecord, DemandRecord, RoyaltyRecord, ETLLog } from '../types';

const generateMonths = (count: number) => {
    const months: string[] = [];
    const today = new Date();
    for (let i = count; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }
    return months;
};

const periods = generateMonths(11); // Últimos 12 meses

// Lista completa de departamentos para generar datos simulados distribuidos
const allDepartments = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá',
    'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare',
    'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo',
    'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima',
    'Valle del Cauca', 'Vaupés', 'Vichada', 'Bogotá D.C.'
];

// Helper para datos aleatorios consistentes
const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
};

// --- PRODUCTION DATA ---
// Generamos producción principal en departamentos petroleros reales y ruido en otros
export const mockProduction: ProductionRecord[] = periods.flatMap((p, i) => {
    return allDepartments.map((dept, idx) => {
        let baseValue = 0;
        let campo = 'Campo Menor';
        let operador = 'Independiente';

        // Departamentos productores reales de gas (simulación)
        if (['Casanare', 'La Guajira', 'Córdoba', 'Sucre', 'Meta'].includes(dept)) {
            baseValue = 2000 + seededRandom(i + idx) * 3000;
            campo = dept === 'Casanare' ? (i % 2 === 0 ? 'Cusiana' : 'Cupiagua') : 
                   dept === 'La Guajira' ? 'Ballena' :
                   dept === 'Córdoba' ? 'Jobo' : 'Campo Mayor';
            operador = dept === 'Casanare' ? 'Ecopetrol' : 'Hocol';
        } else {
             // Pequeña producción marginal o cero
             baseValue = seededRandom(i + idx) > 0.8 ? seededRandom(i + idx) * 100 : 0;
        }

        return {
            id: `prod-${dept.substring(0,3)}-${i}`,
            fecha_periodo: p,
            fecha_actualizacion: new Date().toISOString(),
            campo: campo,
            entidad_territorial: dept,
            operador: operador,
            valor: Math.round(baseValue),
            unidad_medida: 'mpc' as 'mpc'
        };
    }).filter(r => r.valor > 0); // Solo guardamos registros con valor
});

// --- DEMAND DATA ---
export const mockDemand: DemandRecord[] = periods.flatMap((p, i) => {
    return allDepartments.map((dept, idx) => {
        // Demanda correlacionada con población/industria (Simulación)
        let baseDemand = 50 + seededRandom(i + idx * 2) * 100;
        
        if (['Bogotá D.C.', 'Antioquia', 'Valle del Cauca', 'Atlántico'].includes(dept)) {
            baseDemand *= 4; // Centros urbanos consumen más
        }

        const region = ['Atlántico', 'Bolívar', 'Magdalena', 'La Guajira', 'Cesar', 'Córdoba', 'Sucre'].includes(dept) ? 'Costa Atlántica' :
                       ['Antioquia', 'Caldas', 'Risaralda', 'Quindío'].includes(dept) ? 'Antioquia-Cafetero' :
                       ['Valle del Cauca', 'Cauca', 'Nariño'].includes(dept) ? 'Suroccidente' : 'Interior';

        return {
            id: `dem-${dept.substring(0,3)}-${i}`,
            fecha_periodo: p,
            fecha_actualizacion: new Date().toISOString(),
            region: region,
            entidad_territorial: dept,
            sector: seededRandom(idx) > 0.5 ? 'Industrial' : 'Residencial',
            valor_real: Math.round(baseDemand),
            valor_proyectado: Math.round(baseDemand * (0.9 + seededRandom(i) * 0.2)),
            unidad_medida: 'mpcd' as 'mpcd'
        };
    });
});

// --- ROYALTIES DATA ---
export const mockRoyalties: RoyaltyRecord[] = periods.flatMap((p, i) => {
    // Las regalías vienen principalmente de departamentos productores
    return mockProduction.filter(prod => prod.fecha_periodo === p && prod.valor > 500).map((prod, idx) => {
        return {
            id: `roy-${prod.entidad_territorial.substring(0,3)}-${i}`,
            fecha_periodo: p,
            fecha_actualizacion: new Date().toISOString(),
            campo: prod.campo,
            entidad_territorial: prod.entidad_territorial,
            // Valor proporcional a producción con factor precio simulado
            valor: Math.round(prod.valor * (2000000 + seededRandom(idx) * 500000)), 
            unidad_medida: 'COP' as 'COP'
        };
    });
});

// --- ETL LOGS ---
export const mockETLLogs: ETLLog[] = [
    { id: '1', timestamp: new Date().toISOString(), status: 'SUCCESS', source: 'datos.gov.co', message: 'Extracción de regalías completada. 450 registros procesados.' },
    { id: '2', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'SUCCESS', source: 'minenergia.gov.co', message: 'Declaración de Producción actualizada.' },
    { id: '3', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'RUNNING', source: 'upme.gov.co', message: 'Calculando proyecciones de demanda...' },
    { id: '4', timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'FAILURE', source: 'upme.gov.co', message: 'Timeout de conexión API.' },
];