import React from 'react';
import { Menu, Download, RefreshCw } from 'lucide-react';
import { mockProduction, mockDemand, mockRoyalties } from '../data/mockData';

interface TopBarProps {
    onMenuClick: () => void;
    title: string;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, title }) => {
    
    // RF-06 / RF-13: Exportación funcional de datos
    const handleExport = () => {
        // Generamos un CSV simple combinando los datos principales para demo
        const headers = "ID,Periodo,Entidad,Concepto,Valor,Unidad\n";
        
        const prodRows = mockProduction.map(r => `${r.id},${r.fecha_periodo},${r.entidad_territorial},Producción - ${r.campo},${r.valor},${r.unidad_medida}`).join("\n");
        const demRows = mockDemand.map(r => `${r.id},${r.fecha_periodo},${r.entidad_territorial},Demanda - ${r.region},${r.valor_real},${r.unidad_medida}`).join("\n");
        const royRows = mockRoyalties.map(r => `${r.id},${r.fecha_periodo},${r.entidad_territorial},Regalías - ${r.campo},${r.valor},${r.unidad_medida}`).join("\n");

        const csvContent = headers + prodRows + "\n" + demRows + "\n" + royRows;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `simgn_export_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onMenuClick}
                    className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actualizado:</span>
                    <span className="text-sm font-mono text-slate-700">Hoy, 08:30 AM</span>
                    <RefreshCw className="w-3 h-3 text-blue-500 ml-1 cursor-pointer hover:rotate-180 transition-transform duration-500" />
                </div>

                <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

               
            </div>
        </header>
    );
};

export default TopBar;