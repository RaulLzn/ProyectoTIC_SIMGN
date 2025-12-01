import React, { useState, useEffect } from 'react';
import { Filter, Calendar, MapPin, Database, X, Droplets } from 'lucide-react';
import { RoyaltiesFilters, RoyaltiesFilterOptions } from '../types';
import { fetchRoyaltiesFilters } from '../services/api';
import { getTipoHidrocarburoLabel } from '../utils/nomenclature';

interface FilterBarProps {
    showFieldFilter?: boolean;
    showRegionFilter?: boolean;
    showSectorFilter?: boolean;
    showYearFilter?: boolean;
    showHydrocarbonFilter?: boolean;
    activeFilters?: RoyaltiesFilters;
    onFilterChange?: (filters: RoyaltiesFilters) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ 
    showFieldFilter = true, 
    showRegionFilter = true,
    showSectorFilter = false,
    showYearFilter = true,
    showHydrocarbonFilter = true,
    activeFilters = {},
    onFilterChange 
}) => {
    const [filters, setFilters] = useState<RoyaltiesFilters>(activeFilters);
    const [filterOptions, setFilterOptions] = useState<RoyaltiesFilterOptions | null>(null);
    const [loading, setLoading] = useState(false);

    // Sync with parent's active filters
    useEffect(() => {
        setFilters(activeFilters);
    }, [activeFilters]);

    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                setLoading(true);
                const options = await fetchRoyaltiesFilters();
                setFilterOptions(options);
            } catch (error) {
                console.error('Error loading filter options:', error);
            } finally {
                setLoading(false);
            }
        };
        loadFilterOptions();
    }, []);

    const handleFilterChange = (key: keyof RoyaltiesFilters, value: string | number | undefined) => {
        const newFilters = { ...filters };
        if (value === '' || value === null || value === undefined) {
            delete newFilters[key];
        } else {
            (newFilters as any)[key] = value;
        }
        setFilters(newFilters);
    };

    const applyFilters = () => {
        onFilterChange?.(filters);
    };

    const clearFilters = () => {
        setFilters({});
        onFilterChange?.({});
    };

    const hasActiveFilters = Object.keys(filters).length > 0;

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 animate-fade-in">
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-600">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <Filter className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-bold text-sm text-slate-700">Filtros:</span>
                        {hasActiveFilters && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                {Object.keys(filters).length} activo{Object.keys(filters).length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                        >
                            <X className="w-3 h-3" />
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap gap-3">
                    {/* Year Range */}
                    {showYearFilter && filterOptions && (
                        <>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                </div>
                                <select 
                                    value={filters.anio_min || ''}
                                    onChange={(e) => handleFilterChange('anio_min', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none transition-all hover:border-slate-300 cursor-pointer"
                                >
                                    <option value="">Año desde</option>
                                    {filterOptions?.anios?.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                </div>
                                <select 
                                    value={filters.anio_max || ''}
                                    onChange={(e) => handleFilterChange('anio_max', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none transition-all hover:border-slate-300 cursor-pointer"
                                >
                                    <option value="">Año hasta</option>
                                    {filterOptions?.anios?.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Region/Department Filter */}
                    {showRegionFilter && filterOptions && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <MapPin className="w-4 h-4 text-slate-400" />
                            </div>
                            <select 
                                value={filters.departamento || ''}
                                onChange={(e) => handleFilterChange('departamento', e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none cursor-pointer hover:border-slate-300"
                            >
                                <option value="">Todos los Departamentos</option>
                                {filterOptions?.departamentos?.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Field Filter */}
                    {showFieldFilter && filterOptions && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Database className="w-4 h-4 text-slate-400" />
                            </div>
                            <select 
                                value={filters.campo || ''}
                                onChange={(e) => handleFilterChange('campo', e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none cursor-pointer hover:border-slate-300"
                            >
                                <option value="">Todos los Campos</option>
                                {filterOptions?.campos?.slice(0, 50).map(campo => (
                                    <option key={campo} value={campo}>{campo}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Hydrocarbon Type Filter */}
                    {showHydrocarbonFilter && filterOptions && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Droplets className="w-4 h-4 text-slate-400" />
                            </div>
                            <select 
                                value={filters.tipo_hidrocarburo || ''}
                                onChange={(e) => handleFilterChange('tipo_hidrocarburo', e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 outline-none cursor-pointer hover:border-slate-300"
                            >
                                <option value="">Todos los Tipos</option>
                                {filterOptions?.tipos_hidrocarburo?.map(tipo => (
                                    <option key={tipo} value={tipo}>
                                        {getTipoHidrocarburoLabel(tipo)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Apply Button */}
                    <button
                        onClick={applyFilters}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;