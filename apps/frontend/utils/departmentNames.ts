// Department name normalization for map matching
// Database has names in various formats, map expects specific capitalization

const DEPARTMENT_NAME_MAP: Record<string, string> = {
    // Normalize all caps to proper case
    'LA GUAJIRA': 'La Guajira',
    'MAGDALENA': 'Magdalena',
    'ATLÁNTICO': 'Atlántico',
    'ATLANTICO': 'Atlántico',
    'CESAR': 'Cesar',
    'BOLÍVAR': 'Bolívar',
    'BOLIVAR': 'Bolívar',
    'SUCRE': 'Sucre',
    'CÓRDOBA': 'Córdoba',
    'CORDOBA': 'Córdoba',
    'NORTE DE SANTANDER': 'Norte de Santander',
    'SANTANDER': 'Santander',
    'BOYACÁ': 'Boyacá',
    'BOYACA': 'Boyacá',
    'ANTIOQUIA': 'Antioquia',
    'CALDAS': 'Caldas',
    'RISARALDA': 'Risaralda',
    'QUINDÍO': 'Quindío',
    'QUINDIO': 'Quindío',
    'CUNDINAMARCA': 'Cundinamarca',
    'BOGOTÁ D.C.': 'Bogotá D.C.',
    'BOGOTA D.C.': 'Bogotá D.C.',
    'BOGOTÁ': 'Bogotá D.C.',
    'BOGOTA': 'Bogotá D.C.',
    'TOLIMA': 'Tolima',
    'HUILA': 'Huila',
    'CHOCÓ': 'Chocó',
    'CHOCO': 'Chocó',
    'VALLE DEL CAUCA': 'Valle del Cauca',
    'VALLE': 'Valle del Cauca',
    'CAUCA': 'Cauca',
    'NARIÑO': 'Nariño',
    'NARINO': 'Nariño',
    'ARAUCA': 'Arauca',
    'CASANARE': 'Casanare',
    'META': 'Meta',
    'VICHADA': 'Vichada',
    'GUAVIARE': 'Guaviare',
    'CAQUETÁ': 'Caquetá',
    'CAQUETA': 'Caquetá',
    'PUTUMAYO': 'Putumayo',
    'VAUPÉS': 'Vaupés',
    'VAUPES': 'Vaupés',
    'GUAINÍA': 'Guainía',
    'GUAINIA': 'Guainía',
    'AMAZONAS': 'Amazonas',
    'SAN ANDRÉS Y PROVIDENCIA': 'San Andrés y Providencia',
    'SAN ANDRES Y PROVIDENCIA': 'San Andrés y Providencia',
    'SAN ANDRÉS': 'San Andrés y Providencia',
    'SAN ANDRES': 'San Andrés y Providencia'
};

export function normalizeDepartmentName(name: string | null | undefined): string {
    if (!name) return 'Desconocido';
    
    // Try exact match first (case-insensitive)
    const upperName = name.toUpperCase().trim();
    if (DEPARTMENT_NAME_MAP[upperName]) {
        return DEPARTMENT_NAME_MAP[upperName];
    }
    
    // Return original if no match found
    return name;
}
