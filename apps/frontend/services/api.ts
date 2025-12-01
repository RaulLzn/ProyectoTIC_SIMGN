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
