import { RoyaltyRecord, ProductionRecord, DemandRecord, RoyaltyBackend, ProductionBackend, DemandBackend, RoyaltiesFilters, RoyaltiesFilterOptions, ProductionFilters, ProductionFilterOptions } from '../types';

// CAMBIO CRÍTICO AQUÍ:
// Usamos la variable de entorno. Si no existe (como en local a veces), usa localhost como respaldo.
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';


export interface BackendProduction {
    id: number;
    campo: string;
    operadora: string;
    departamento: string;
    municipio: string;
    anio: number;
    mes: number;
    produccion_mensual: number;
    fecha_carga: string;
}

export interface BackendDemand {
    id: number;
    sector: string;
    region: string;
    anio: number;
    mes: number;
    escenario: string;
    demanda: number;
    fecha_carga: string;
}

export const fetchRoyalties = async (filters?: RoyaltiesFilters): Promise<RoyaltyBackend[]> => {
    const params = new URLSearchParams();  // No limit - get ALL data
    
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
        if (filters.tipo_hidrocarburo) params.append('tipo_hidrocarburo', filters.tipo_hidrocarburo);
    }
    
    const url = params.toString() ? `${API_URL}/royalties?${params}` : `${API_URL}/royalties`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch royalties');
    }
    return response.json();
};

export const fetchRoyaltiesFilters = async (): Promise<RoyaltiesFilterOptions> => {
    const response = await fetch(`${API_URL}/royalties/filters`);
    if (!response.ok) {
        throw new Error('Failed to fetch royalties filters');
    }
    return response.json();
};

export const fetchProduction = async (filters?: ProductionFilters): Promise<BackendProduction[]> => {
    const params = new URLSearchParams();  // No limit - get ALL data
    
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.operadora) params.append('operadora', filters.operadora);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
    }
    
    const url = params.toString() ? `${API_URL}/production?${params}` : `${API_URL}/production`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch production');
    }
    return response.json();
};

// --- Aggregation Services (Low RAM Strategy) ---

export const fetchProductionKPIs = async (filters?: ProductionFilters): Promise<any> => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.operadora) params.append('operadora', filters.operadora);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
    }
    const response = await fetch(`${API_URL}/production/kpis?${params}`);
    if (!response.ok) throw new Error('Failed to fetch production KPIs');
    return response.json();
};

export const fetchProductionTrend = async (filters?: ProductionFilters): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.operadora) params.append('operadora', filters.operadora);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
    }
    const response = await fetch(`${API_URL}/production/trend?${params}`);
    if (!response.ok) throw new Error('Failed to fetch production trend');
    return response.json();
};

export const fetchProductionRanking = async (type: 'operadora' | 'campo', filters?: ProductionFilters): Promise<any[]> => {
    const params = new URLSearchParams();
    params.append('type', type);
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.operadora) params.append('operadora', filters.operadora);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
    }
    const response = await fetch(`${API_URL}/production/ranking?${params}`);
    if (!response.ok) throw new Error('Failed to fetch production ranking');
    return response.json();
};

export const fetchProductionMap = async (filters?: ProductionFilters): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.operadora) params.append('operadora', filters.operadora);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
    }
    const response = await fetch(`${API_URL}/production/map?${params}`);
    if (!response.ok) throw new Error('Failed to fetch production map');
    return response.json();
};

export const fetchRoyaltiesKPIs = async (filters?: RoyaltiesFilters): Promise<any> => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
        if (filters.tipo_hidrocarburo) params.append('tipo_hidrocarburo', filters.tipo_hidrocarburo);
    }
    const response = await fetch(`${API_URL}/royalties/kpis?${params}`);
    if (!response.ok) throw new Error('Failed to fetch royalties KPIs');
    return response.json();
};

export const fetchRoyaltiesTrend = async (filters?: RoyaltiesFilters): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
        if (filters.tipo_hidrocarburo) params.append('tipo_hidrocarburo', filters.tipo_hidrocarburo);
    }
    const response = await fetch(`${API_URL}/royalties/trend?${params}`);
    if (!response.ok) throw new Error('Failed to fetch royalties trend');
    return response.json();
};

export const fetchRoyaltiesMap = async (filters?: RoyaltiesFilters): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
        if (filters.tipo_hidrocarburo) params.append('tipo_hidrocarburo', filters.tipo_hidrocarburo);
    }
    const response = await fetch(`${API_URL}/royalties/map?${params}`);
    if (!response.ok) throw new Error('Failed to fetch royalties map');
    return response.json();
};

export const fetchRoyaltiesDistribution = async (filters?: RoyaltiesFilters): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
        if (filters.tipo_hidrocarburo) params.append('tipo_hidrocarburo', filters.tipo_hidrocarburo);
    }
    const response = await fetch(`${API_URL}/royalties/distribution?${params}`);
    if (!response.ok) throw new Error('Failed to fetch royalties distribution');
    return response.json();
};

export const fetchRoyaltiesRanking = async (filters?: RoyaltiesFilters): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters) {
        if (filters.departamento) params.append('departamento', filters.departamento);
        if (filters.campo) params.append('campo', filters.campo);
        if (filters.anio_min) params.append('anio_min', filters.anio_min.toString());
        if (filters.anio_max) params.append('anio_max', filters.anio_max.toString());
        if (filters.tipo_hidrocarburo) params.append('tipo_hidrocarburo', filters.tipo_hidrocarburo);
    }
    const response = await fetch(`${API_URL}/royalties/ranking?${params}`);
    if (!response.ok) throw new Error('Failed to fetch royalties ranking');
    return response.json();
};

// --- Demand Aggregation ---

export const fetchDemandKPIs = async (): Promise<{ totalReal: number, totalProjected: number, deviation: number }> => {
    const response = await fetch(`${API_URL}/demand/kpis`);
    if (!response.ok) throw new Error('Failed to fetch demand KPIs');
    return response.json();
};

export const fetchDemandTrend = async (): Promise<{ name: string, real: number, projected: number }[]> => {
    const response = await fetch(`${API_URL}/demand/trend`);
    if (!response.ok) throw new Error('Failed to fetch demand trend');
    return response.json();
};

export const fetchDemandSector = async (): Promise<{ name: string, value: number }[]> => {
    const response = await fetch(`${API_URL}/demand/sector`);
    if (!response.ok) throw new Error('Failed to fetch demand by sector');
    return response.json();
};

export const fetchDemandRegion = async (): Promise<{ name: string, value: number }[]> => {
    const response = await fetch(`${API_URL}/demand/region`);
    if (!response.ok) throw new Error('Failed to fetch demand by region');
    return response.json();
};

export const fetchDemandScenarios = async () => {
    const response = await fetch(`${API_URL}/demand/scenarios`);
    if (!response.ok) throw new Error('Failed to fetch demand scenarios');
    return response.json();
};

export const fetchDemandSectors = async () => {
    const response = await fetch(`${API_URL}/demand/sectors`);
    if (!response.ok) throw new Error('Failed to fetch demand sectors');
    return response.json();
};

export const fetchDemandMap = async () => {
    const response = await fetch(`${API_URL}/demand/map`);
    if (!response.ok) throw new Error('Failed to fetch demand map');
    return response.json();
};

export const fetchDemandBalance = async () => {
    const response = await fetch(`${API_URL}/demand/balance`);
    if (!response.ok) throw new Error('Failed to fetch demand balance');
    return response.json();
};

// --- Statistics / Strategic Dashboard ---

export const fetchStatsKpis = async () => {
    const response = await fetch(`${API_URL}/stats/kpis`);
    if (!response.ok) throw new Error('Failed to fetch stats KPIs');
    return response.json();
};

export const fetchStatsProdVsRoyalties = async () => {
    const response = await fetch(`${API_URL}/stats/production-vs-royalties`);
    if (!response.ok) throw new Error('Failed to fetch stats production vs royalties');
    return response.json();
};

export const fetchStatsRegionalBalance = async () => {
    const response = await fetch(`${API_URL}/stats/regional-balance`);
    if (!response.ok) throw new Error('Failed to fetch stats regional balance');
    return response.json();
};

export const fetchProductionFilters = async (): Promise<ProductionFilterOptions> => {
    const response = await fetch(`${API_URL}/production/filters`);
    if (!response.ok) {
        throw new Error('Failed to fetch production filters');
    }
    return response.json();
};

export const fetchDemand = async (): Promise<BackendDemand[]> => {
    const response = await fetch(`${API_URL}/demand?limit=1000`);
    if (!response.ok) {
        throw new Error('Failed to fetch demand');
    }
    return response.json();
};

export const fetchRoyaltiesStats = async () => {
    const response = await fetch(`${API_URL}/royalties/stats`);
    if (!response.ok) throw new Error('Failed to fetch royalties stats');
    return response.json();
};
