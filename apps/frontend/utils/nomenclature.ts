// Nomenclature mappings for Regalias data
export const TIPO_PROD_LABELS: Record<string, string> = {
    'QB': 'Quema de Producción Básica',
    'P': 'Producción Crudo Pesada',
    'B': 'Producción Básica',
    'I': 'Producción Incremental',
    'QI': 'Quema de Producción Incremental'
};

export const TIPO_HIDROCARBURO_LABELS: Record<string, string> = {
    'G': 'Gas',
    'O': 'Petróleo'
};

export function getTipoProduccionLabel(code: string | null | undefined): string {
    if (!code) return 'Desconocido';
    return TIPO_PROD_LABELS[code] || code;
}

export function getTipoHidrocarburoLabel(code: string | null | undefined): string {
    if (!code) return 'Desconocido';
    return TIPO_HIDROCARBURO_LABELS[code] || code;
}

export function getTipoHidrocarburoIcon(code: string | null | undefined): string {
    if (code === 'G') return '💨'; // Gas
    if (code === 'O') return '🛢️'; // Oil
    return '❓';
}
