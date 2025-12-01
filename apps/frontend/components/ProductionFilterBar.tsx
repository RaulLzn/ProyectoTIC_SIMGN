import React, { useState, useEffect } from 'react';
import { Filter, Calendar, MapPin, Database, X, Building2 } from 'lucide-react';
import { ProductionFilters, ProductionFilterOptions } from '../types';
import { fetchProductionFilters } from '../services/api';

interface ProductionFilterBarProps {
    activeFilters?: ProductionFilters;
    onFilterChange?: (filters: ProductionFilters) => void;
}

const ProductionFilterBar: React.FC<ProductionFilterBarProps> = ({ activeFilters = {}, onFilterChange }) => {
    const [filters, setFilters] = useState<ProductionFilters>(activeFilters);
    const [filterOptions, setFilterOptions] = useState<ProductionFilterOptions | null>(null);
    const [loading, setLoading] = useState(false);

    // Sync with parent's active filters
    useEffect(() => {
        setFilters(activeFilters);
    }, [activeFilters]);

    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                setLoading(true);
                const options = await fetchProductionFilters();
                setFilterOptions(options);
            } catch (error) {
                console.error('Error loading filter options:', error);
            } finally {
                setLoading(false);
            }
        };
        loadFilterOptions();
    }, []);

    const handleFilterChange = (key: keyof ProductionFilters, value: string | number | undefined) => {
        const newFilters = { ...filters };
        if (value === '' || value === null || value === undefined) {
            delete newFilters[key];
        } else {
            (newFilters as any)[key] = value;
        }
        setFilters(newFilters);
    };

    const applyFilters = () => {
        console.log('Applying filters:', filters);
        onFilterChange?.(filters);
    };

    const clearFilters = () => {
        setFilters({});
        onFilterChange?.({});
    };

    const activeFilterCount = Object.keys(filters).length;

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800">Filtros:</h3>
                {activeFilterCount > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        {activeFilterCount} activo{activeFilterCount > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Year From */}
                <div className="relative">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Año desde
                    </label>
                    <select
                        value={filters.anio_min || ''}
                        onChange={(e) => handleFilterChange('anio_min', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                    >
                        <option value="">Todos</option>
                        {filterOptions?.anios?.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Year To */}
                <div className="relative">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Año hasta
                    </label>
                    <select
                        value={filters.anio_max || ''}
                        onChange={(e) => handleFilterChange('anio_max', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                    >
                        <option value="">Todos</option>
                        {filterOptions?.anios?.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Department */}
                <div className="relative">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        Departamento
                    </label>
                    <select
                        value={filters.departamento || ''}
                        onChange={(e) => handleFilterChange('departamento', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                    >
                        <option value="">Todos los Departamentos</option>
                        {filterOptions?.departamentos?.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>

                {/* Field */}
                <div className="relative">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        <Database className="w-3 h-3 inline mr-1" />
                        Campo
                    </label>
                    <select
                        value={filters.campo || ''}
                        onChange={(e) => handleFilterChange('campo', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                    >
                        <option value="">Todos los Campos</option>
                        {filterOptions?.campos?.map(campo => (
                            <option key={campo} value={campo}>{campo}</option>
                        ))}
                    </select>
                </div>

                {/* Operator */}
                <div className="relative">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        <Building2 className="w-3 h-3 inline mr-1" />
                        Operadora
                    </label>
                    <select
                        value={filters.operadora || ''}
                        onChange={(e) => handleFilterChange('operadora', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                    >
                        <option value="">Todas las Operadoras</option>
                        {filterOptions?.operadoras?.map(op => (
                            <option key={op} value={op}>{op}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex gap-3 mt-4">
                <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    Aplicar Filtros
                </button>
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                        <X className="w-4 h-4" />
                        Limpiar
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductionFilterBar;
