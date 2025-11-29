export enum EntityType {
    PRODUCTION = 'Producción',
    DEMAND = 'Demanda',
    ROYALTIES = 'Regalías'
}

// Filter interfaces
export interface RoyaltiesFilters {
    departamento?: string;
    campo?: string;
    anio_min?: number;
    anio_max?: number;
    tipo_hidrocarburo?: string;
}

export interface RoyaltiesFilterOptions {
    departamentos: string[];
    campos: string[];
    tipos_hidrocarburo: string[];
    anios: number[];
}

export interface ProductionFilters {
    departamento?: string;
    campo?: string;
    operadora?: string;
    anio_min?: number;
    anio_max?: number;
}

export interface ProductionFilterOptions {
    departamentos: string[];
    campos: string[];
    operadoras: string[];
    anios: number[];
}

// RD-05: Campos Estandarizados & RD-04: Modelo de Datos

export interface BaseRecord {
    id: string;
    fecha_periodo: string; // YYYY-MM
    fecha_actualizacion: string;
    entidad_territorial: string; // Departamento
}

export interface ProductionRecord extends BaseRecord {
    campo: string;
    operador: string;
    valor: number; // Volumen
    unidad_medida: 'mpc' | 'gbtud'; // Millones de pies cúbicos o energía
}

export interface DemandRecord extends BaseRecord {
    region: string; // Interior, Costa, etc.
    sector: string; // Industrial, Residencial, GNV, etc.
    valor_proyectado: number;
    valor_real: number;
    unidad_medida: 'GBTUD'; // Millones de pies cúbicos día
    escenario?: string;
}



// Tipos del Backend (para cuando se integre la API)
export interface ProductionBackend {
    id: number;
    campo: string;
    operadora: string;
    departamento: string;
    municipio: string;
    anio: number;
    mes: number;
    produccion_mensual: number; // en KPC o similar
    fecha_carga: string;
}

export interface DemandBackend {
    id: number;
    sector: string; // Residencial, Industrial, etc.
    region: string;
    anio: number;
    mes: number;
    escenario: string; // Alto, Medio, Bajo
    demanda: number; // en GBTUD
    fecha_carga: string;
}

export interface RoyaltyBackend {
    id: number;
    departamento: string;
    municipio: string;
    campo: string;
    contrato: string;
    anio: number;
    mes: number;
    
    volumen_regalia: number;
    trm_promedio: number;
    tipo_prod: string;
    tipo_hidrocarburo: string;
    regimen: string;
    prod_gravable: number;
    precio_usd: number;
    porc_regalia: number;
    
    longitud?: number;
    latitud?: number;
    
    valor_liquidado: number;
    fecha_carga: string;
}

export interface RoyaltyRecord extends BaseRecord {
    campo: string;
    municipio: string;
    contrato: string;
    valor: number; // Monto en pesos (COP)
    unidad_medida: 'COP';
    
    // New fields
    volumen_regalia: number;
    trm_promedio: number;
    tipo_prod: string;
    tipo_hidrocarburo: string;
    regimen: string;
    prod_gravable: number;
    precio_usd: number;
    porc_regalia: number;
    anio: number;
    mes: number;
    longitud?: number;
    latitud?: number;
}

export interface ETLLog {
    id: string;
    timestamp: string;
    status: 'SUCCESS' | 'FAILURE' | 'RUNNING';
    message: string;
    source: string;
}

// Interfaz para visualización del mapa
export interface MapData {
    departmentId: string; // ISO Code or Name matching SVG
    departmentName: string;
    value: number;
    formattedValue: string;
    metricLabel: string;
}