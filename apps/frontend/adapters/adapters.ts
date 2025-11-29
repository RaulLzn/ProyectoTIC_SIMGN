import { BackendProduction, BackendDemand } from '../services/api';
import { RoyaltyRecord, ProductionRecord, DemandRecord, RoyaltyBackend } from '../types';

export const adaptRoyalty = (data: RoyaltyBackend): RoyaltyRecord => {
    return {
        id: data.id.toString(),
        fecha_periodo: `${data.anio}-${data.mes.toString().padStart(2, '0')}`,
        fecha_actualizacion: data.fecha_carga,
        entidad_territorial: data.departamento || 'Desconocido',
        campo: data.campo || 'Desconocido',
        valor: data.valor_liquidado || 0,
        unidad_medida: 'COP',
        
        // New fields
        municipio: data.municipio,
        contrato: data.contrato,
        volumen_regalia: data.volumen_regalia,
        trm_promedio: data.trm_promedio,
        tipo_prod: data.tipo_prod,
        tipo_hidrocarburo: data.tipo_hidrocarburo,
        regimen: data.regimen,
        prod_gravable: data.prod_gravable,
        precio_usd: data.precio_usd,
        porc_regalia: data.porc_regalia,
        anio: data.anio,
        mes: data.mes,
        longitud: data.longitud,
        latitud: data.latitud
    };
};

export const adaptProduction = (data: BackendProduction): ProductionRecord => {
    // Format YYYY-MM
    const mes = data.mes < 10 ? `0${data.mes}` : data.mes;
    const periodo = `${data.anio}-${mes}`;

    return {
        id: data.id.toString(),
        fecha_periodo: periodo,
        fecha_actualizacion: data.fecha_carga,
        entidad_territorial: data.departamento || 'Desconocido',
        campo: data.campo || 'Desconocido',
        operador: data.operadora || 'Desconocido',
        valor: data.produccion_mensual || 0,
        unidad_medida: 'mpc' // Assuming backend is in mpc or similar, need to confirm but for now default
    };
};

export const adaptDemand = (data: BackendDemand): DemandRecord => {
    const isProjected = data.anio >= 2024;
    return {
        id: data.id.toString(),
        fecha_periodo: `${data.anio}-${data.mes.toString().padStart(2, '0')}`,
        fecha_actualizacion: new Date().toISOString(), // Backend doesn't send this yet
        entidad_territorial: data.region || 'Nacional',
        region: data.region || 'Nacional',
        sector: data.sector || 'Desconocido',
        valor_real: isProjected ? 0 : (data.demanda || 0),
        valor_proyectado: isProjected ? (data.demanda || 0) : 0,
        unidad_medida: 'GBTUD',
        escenario: data.escenario || 'Medio'
    };
};
