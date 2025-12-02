import React, { useState } from 'react';
import { MapData } from '../types';

interface ColombiaMapProps {
    data: MapData[];
    title?: string;
    valueFormatter: (val: number) => string;
    onDepartmentClick?: (deptName: string) => void;
    selectedDepartment?: string | null;
    colorScale?: 'blue' | 'green' | 'orange';
}

// Mapa de Colombia más realista con forma geográfica apropiada
const departments = [
    // COSTA CARIBE - Siguiendo la costa norte de Colombia
    { 
        id: 'La Guajira', name: 'La Guajira', 
        path: 'M650,50 L720,40 L750,60 L780,90 L770,130 L740,150 L700,140 L670,120 L650,90 Z',
        labelX: 715, labelY: 95, shortName: 'LA GUAJIRA'
    },
    { 
        id: 'Magdalena', name: 'Magdalena', 
        path: 'M580,80 L650,70 L670,110 L650,140 L620,150 L590,140 L580,110 Z',
        labelX: 620, labelY: 115, shortName: 'MAGDALENA'
    },
    { 
        id: 'Atlántico', name: 'Atlántico', 
        path: 'M540,100 L580,90 L590,120 L570,140 L550,135 L540,120 Z',
        labelX: 565, labelY: 115, shortName: 'ATLÁNTICO'
    },
    { 
        id: 'Cesar', name: 'Cesar', 
        path: 'M620,160 L680,150 L700,180 L680,220 L650,230 L620,210 Z',
        labelX: 660, labelY: 190, shortName: 'CESAR'
    },
    { 
        id: 'Bolívar', name: 'Bolívar', 
        path: 'M480,140 L580,130 L590,180 L570,220 L530,240 L490,220 L480,180 Z',
        labelX: 535, labelY: 185, shortName: 'BOLÍVAR'
    },
    { 
        id: 'Sucre', name: 'Sucre', 
        path: 'M430,220 L490,210 L500,250 L480,280 L450,275 L430,250 Z',
        labelX: 465, labelY: 245, shortName: 'SUCRE'
    },
    { 
        id: 'Córdoba', name: 'Córdoba', 
        path: 'M380,260 L430,250 L440,290 L420,320 L390,315 L380,285 Z',
        labelX: 410, labelY: 285, shortName: 'CÓRDOBA'
    },

    // REGIÓN ANDINA - Siguiendo la cordillera de los Andes
    { 
        id: 'Norte de Santander', name: 'Norte de Santander', 
        path: 'M590,200 L650,190 L670,230 L650,270 L620,275 L590,250 Z',
        labelX: 630, labelY: 235, shortName: 'N. SANTANDER'
    },
    { 
        id: 'Santander', name: 'Santander', 
        path: 'M520,270 L590,260 L610,320 L580,360 L540,365 L520,325 Z',
        labelX: 565, labelY: 315, shortName: 'SANTANDER'
    },
    { 
        id: 'Boyacá', name: 'Boyacá', 
        path: 'M480,360 L540,350 L560,400 L540,440 L500,445 L480,405 Z',
        labelX: 520, labelY: 400, shortName: 'BOYACÁ'
    },
    { 
        id: 'Antioquia', name: 'Antioquia', 
        path: 'M350,320 L420,310 L450,370 L430,420 L380,435 L350,385 Z',
        labelX: 400, labelY: 375, shortName: 'ANTIOQUIA'
    },
    { 
        id: 'Caldas', name: 'Caldas', 
        path: 'M380,440 L430,430 L450,470 L430,500 L400,495 L380,465 Z',
        labelX: 415, labelY: 465, shortName: 'CALDAS'
    },
    { 
        id: 'Risaralda', name: 'Risaralda', 
        path: 'M330,470 L380,460 L390,490 L370,510 L350,505 L330,485 Z',
        labelX: 360, labelY: 485, shortName: 'RISARALDA'
    },
    { 
        id: 'Quindío', name: 'Quindío', 
        path: 'M360,510 L390,500 L400,530 L380,550 L360,540 Z',
        labelX: 380, labelY: 525, shortName: 'QUINDÍO'
    },
    { 
        id: 'Cundinamarca', name: 'Cundinamarca', 
        path: 'M450,450 L520,440 L540,500 L520,540 L470,545 L450,485 Z',
        labelX: 495, labelY: 495, shortName: 'CUNDINAMARCA'
    },
    { 
        id: 'Bogotá D.C.', name: 'Bogotá D.C.', 
        path: 'M485,515 L505,510 L510,530 L490,535 Z',
        labelX: 497, labelY: 522, shortName: 'BOGOTÁ'
    },
    { 
        id: 'Tolima', name: 'Tolima', 
        path: 'M420,550 L480,540 L500,590 L480,630 L440,635 L420,595 Z',
        labelX: 460, labelY: 590, shortName: 'TOLIMA'
    },
    { 
        id: 'Huila', name: 'Huila', 
        path: 'M400,640 L460,630 L480,680 L460,720 L420,725 L400,685 Z',
        labelX: 440, labelY: 675, shortName: 'HUILA'
    },

    // REGIÓN PACÍFICA - Costa occidental de Colombia
    { 
        id: 'Chocó', name: 'Chocó', 
        path: 'M250,350 L330,340 L350,420 L330,480 L280,490 L250,430 Z',
        labelX: 300, labelY: 415, shortName: 'CHOCÓ'
    },
    { 
        id: 'Valle del Cauca', name: 'Valle del Cauca', 
        path: 'M290,520 L370,510 L390,570 L370,610 L320,615 L290,565 Z',
        labelX: 340, labelY: 565, shortName: 'VALLE'
    },
    { 
        id: 'Cauca', name: 'Cauca', 
        path: 'M320,620 L390,610 L410,670 L390,710 L340,715 L320,665 Z',
        labelX: 365, labelY: 665, shortName: 'CAUCA'
    },
    { 
        id: 'Nariño', name: 'Nariño', 
        path: 'M310,720 L390,710 L410,770 L390,810 L340,815 L310,765 Z',
        labelX: 360, labelY: 765, shortName: 'NARIÑO'
    },

    // REGIÓN ORINOQUÍA - Llanos orientales
    { 
        id: 'Arauca', name: 'Arauca', 
        path: 'M610,340 L690,330 L710,380 L690,420 L650,425 L610,385 Z',
        labelX: 660, labelY: 380, shortName: 'ARAUCA'
    },
    { 
        id: 'Casanare', name: 'Casanare', 
        path: 'M560,420 L640,410 L660,470 L640,510 L590,515 L560,465 Z',
        labelX: 610, labelY: 465, shortName: 'CASANARE'
    },
    { 
        id: 'Meta', name: 'Meta', 
        path: 'M520,550 L590,540 L610,610 L590,670 L540,675 L520,625 Z',
        labelX: 565, labelY: 615, shortName: 'META'
    },
    { 
        id: 'Vichada', name: 'Vichada', 
        path: 'M650,460 L730,450 L750,520 L730,580 L680,585 L650,525 Z',
        labelX: 700, labelY: 520, shortName: 'VICHADA'
    },

    // REGIÓN AMAZONÍA - Selva amazónica
    { 
        id: 'Guaviare', name: 'Guaviare', 
        path: 'M590,680 L660,670 L680,730 L660,770 L620,775 L590,725 Z',
        labelX: 635, labelY: 725, shortName: 'GUAVIARE'
    },
    { 
        id: 'Caquetá', name: 'Caquetá', 
        path: 'M480,730 L550,720 L570,780 L550,820 L500,825 L480,775 Z',
        labelX: 525, labelY: 775, shortName: 'CAQUETÁ'
    },
    { 
        id: 'Putumayo', name: 'Putumayo', 
        path: 'M410,820 L480,810 L500,870 L480,910 L430,915 L410,865 Z',
        labelX: 455, labelY: 865, shortName: 'PUTUMAYO'
    },
    { 
        id: 'Vaupés', name: 'Vaupés', 
        path: 'M570,830 L650,820 L670,880 L650,920 L600,925 L570,875 Z',
        labelX: 620, labelY: 875, shortName: 'VAUPÉS'
    },
    { 
        id: 'Guainía', name: 'Guainía', 
        path: 'M680,590 L760,580 L780,640 L760,680 L710,685 L680,635 Z',
        labelX: 730, labelY: 635, shortName: 'GUAINÍA'
    },
    { 
        id: 'Amazonas', name: 'Amazonas', 
        path: 'M430,920 L570,910 L590,990 L570,1050 L480,1055 L430,1005 Z',
        labelX: 510, labelY: 985, shortName: 'AMAZONAS'
    },

    // INSULAR - Islas del Caribe
    { 
        id: 'San Andrés y Providencia', name: 'San Andrés y Providencia', 
        path: 'M150,100 L190,95 L195,130 L155,135 Z',
        labelX: 172, labelY: 115, shortName: 'SAN ANDRÉS'
    }
];

const ColombiaMap: React.FC<ColombiaMapProps> = ({ 
    data, 
    title, 
    valueFormatter, 
    onDepartmentClick, 
    selectedDepartment,
    colorScale = 'blue'
}) => {
    const [hoveredDept, setHoveredDept] = useState<string | null>(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    // Calcular valores min/max para la escala de color
    const values = data.map(d => d.value).filter(v => v > 0);
    const maxVal = values.length > 0 ? Math.max(...values) : 100;
    
    // Paletas de colores
    const colors = {
        blue: ['#dbeafe', '#93c5fd', '#60a5fa', '#2563eb', '#1e40af'], // Producción
        green: ['#d1fae5', '#6ee7b7', '#34d399', '#10b981', '#047857'], // Regalías
        orange: ['#ffedd5', '#fdba74', '#fb923c', '#f97316', '#c2410c']  // Demanda
    };

    const currentPalette = colors[colorScale];

    const getColor = (deptName: string) => {
        // Highlighting logic for selected department
        if (selectedDepartment && deptName === selectedDepartment) {
            return '#fbbf24'; // Gold/Amber highlight
        }

        const item = data.find(d => d.departmentName === deptName);
        const value = item ? item.value : 0;
        
        if (value === 0) return '#f1f5f9'; // Gris para sin datos
        
        const intensity = value / maxVal;
        
        if (intensity < 0.2) return currentPalette[0];
        if (intensity < 0.4) return currentPalette[1];
        if (intensity < 0.6) return currentPalette[2];
        if (intensity < 0.8) return currentPalette[3];
        return currentPalette[4];
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Ajuste para que el tooltip no se salga de la pantalla
        const containerRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - containerRect.left + 20;
        const y = e.clientY - containerRect.top + 20;
        setTooltipPos({ x, y });
    };

    const getDepartmentData = (name: string) => {
        return data.find(d => d.departmentName === name);
    };

    return (
        <div className="w-full h-full relative overflow-hidden group">
            {title && (
                <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-100 shadow-sm pointer-events-none">
                     <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                </div>
            )}

            {/* Tooltip Flotante */}
            {hoveredDept && (
                <div 
                    className="absolute z-50 bg-slate-900/95 backdrop-blur text-white text-xs p-3 rounded-lg shadow-xl pointer-events-none transition-opacity duration-150 border border-slate-700 min-w-[150px]"
                    style={{ left: tooltipPos.x, top: tooltipPos.y }}
                >
                    <p className="font-bold text-base mb-1 border-b border-slate-700 pb-1">{hoveredDept}</p>
                    <div className="space-y-1 pt-1">
                        {getDepartmentData(hoveredDept) ? (
                            <>
                                <p className="text-slate-300">
                                    {getDepartmentData(hoveredDept)?.metricLabel}:
                                </p>
                                <p className="font-mono text-emerald-400 font-bold text-lg">
                                    {valueFormatter(getDepartmentData(hoveredDept)!.value)}
                                </p>
                            </>
                        ) : (
                            <p className="text-slate-400 italic">Sin datos registrados</p>
                        )}
                    </div>
                </div>
            )}

            <div 
                className="w-full h-full flex items-center justify-center cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHoveredDept(null)}
            >
                <svg 
                    viewBox="0 0 900 1100" 
                    className="w-full h-full max-h-[90%]"
                    style={{ overflow: 'visible' }}
                >
                    {/* Definir gradientes y filtros para mejor apariencia */}
                    <defs>
                        <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                            <feOffset dx="2" dy="2" result="offset"/>
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3"/>
                            </feComponentTransfer>
                            <feMerge> 
                                <feMergeNode/>
                                <feMergeNode in="SourceGraphic"/> 
                            </feMerge>
                        </filter>
                        <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:'#dbeafe', stopOpacity:0.3}} />
                            <stop offset="100%" style={{stopColor:'#3b82f6', stopOpacity:0.1}} />
                        </linearGradient>
                    </defs>

                    {/* Fondo oceánico sutil */}
                    <rect width="900" height="1100" fill="url(#oceanGradient)" />

                    {/* Departamentos con mejor renderizado */}
                    {departments.map((dept) => {
                        const deptData = getDepartmentData(dept.name);
                        const hasData = deptData && deptData.value > 0;
                        const isSelected = selectedDepartment === dept.name;
                        const isHovered = hoveredDept === dept.name;
                        
                        return (
                            <g key={dept.id}>
                                {/* Path del departamento */}
                                <path
                                    id={dept.id}
                                    d={dept.path}
                                    fill={getColor(dept.name)}
                                    stroke={isSelected ? "#1f2937" : isHovered ? "#374151" : "white"}
                                    strokeWidth={isSelected ? "3" : isHovered ? "2" : "1"}
                                    filter={isSelected || isHovered ? "url(#dropshadow)" : ""}
                                    className="transition-all duration-300 ease-out hover:brightness-95 cursor-pointer"
                                    onMouseEnter={() => setHoveredDept(dept.name)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDepartmentClick && onDepartmentClick(dept.name);
                                    }}
                                />
                                
                                {/* Nombre del departamento */}
                                <text
                                    x={dept.labelX}
                                    y={dept.labelY}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={dept.shortName.length > 8 ? "9" : "11"}
                                    fontWeight="600"
                                    fill={
                                        isSelected ? "#000" : 
                                        getColor(dept.name) === currentPalette[4] || getColor(dept.name) === currentPalette[3] ? 
                                        "white" : "#1f2937"
                                    }
                                    className="pointer-events-none select-none font-sans tracking-wide"
                                    style={{
                                        textShadow: isSelected ? "1px 1px 2px rgba(255,255,255,0.8)" : 
                                                   (getColor(dept.name) === currentPalette[4] || getColor(dept.name) === currentPalette[3]) ? 
                                                   "1px 1px 2px rgba(0,0,0,0.5)" : "1px 1px 2px rgba(255,255,255,0.8)"
                                    }}
                                >
                                    {dept.shortName}
                                </text>
                                
                                {/* Indicador de datos para departamentos con información */}
                                {hasData && (
                                    <circle
                                        cx={dept.labelX + (dept.shortName.length * 3)}
                                        cy={dept.labelY - 15}
                                        r="3"
                                        fill="#10b981"
                                        stroke="white"
                                        strokeWidth="1"
                                        className="pointer-events-none"
                                    />
                                )}
                            </g>
                        );
                    })}

                    {/* Título del país */}
                    <text
                        x="450"
                        y="30"
                        textAnchor="middle"
                        fontSize="24"
                        fontWeight="bold"
                        fill="#1f2937"
                        className="font-sans tracking-wider"
                        style={{textShadow: "2px 2px 4px rgba(255,255,255,0.8)"}}
                    >
                        REPÚBLICA DE COLOMBIA
                    </text>
                </svg>
            </div>
            
            {/* Leyenda Mejorada */}
            <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-slate-200 text-xs pointer-events-none max-w-xs">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                    <p className="font-bold text-slate-700">Leyenda del Mapa</p>
                </div>
                
                {/* Escala de colores */}
                <div className="mb-3">
                    <p className="font-semibold text-slate-600 mb-2">Intensidad de Datos</p>
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-3 rounded-sm border border-slate-300" style={{backgroundColor: currentPalette[4]}}></span>
                            <span className="text-slate-700">Muy Alta (80-100%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-3 rounded-sm border border-slate-300" style={{backgroundColor: currentPalette[3]}}></span>
                            <span className="text-slate-700">Alta (60-80%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-3 rounded-sm border border-slate-300" style={{backgroundColor: currentPalette[2]}}></span>
                            <span className="text-slate-700">Media (40-60%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-3 rounded-sm border border-slate-300" style={{backgroundColor: currentPalette[1]}}></span>
                            <span className="text-slate-700">Baja (20-40%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-3 rounded-sm border border-slate-300" style={{backgroundColor: currentPalette[0]}}></span>
                            <span className="text-slate-700">Muy Baja (0-20%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-3 rounded-sm border border-slate-300" style={{backgroundColor: '#f1f5f9'}}></span>
                            <span className="text-slate-500">Sin datos</span>
                        </div>
                    </div>
                </div>

                {/* Indicadores */}
                <div className="border-t border-slate-200 pt-2">
                    <div className="flex items-center gap-2 mb-1">
                        <circle cx="6" cy="6" r="3" fill="#10b981" stroke="white" strokeWidth="1" className="w-3 h-3"/>
                        <span className="text-slate-600">Datos disponibles</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-slate-800 bg-transparent"></div>
                        <span className="text-slate-600">Departamento seleccionado</span>
                    </div>
                </div>

                {/* Estadísticas rápidas */}
                {data.length > 0 && (
                    <div className="border-t border-slate-200 pt-2 mt-2">
                        <p className="text-slate-500 text-xs">
                            {data.length} de 33 departamentos con datos
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColombiaMap;