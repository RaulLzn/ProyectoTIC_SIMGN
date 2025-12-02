import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Factory, 
    TrendingUp, 
    Coins, 
    Flame,
    Map,
    Download,
    BarChart3,
    HelpCircle,
    Mail,
    Phone,
    MessageCircle
} from 'lucide-react';

import logoMinEnergia from '../assets/img/logoMinenergia.png';

const Sidebar: React.FC = () => {
    const [showHelpMenu, setShowHelpMenu] = useState(false);

    const navItems = [
        { path: '/estadisticas', label: 'Estadísticas', icon: BarChart3, badge: null },
        { path: '/produccion', label: 'Producción', icon: Factory, badge: 'ANH' },
        { path: '/demanda', label: 'Demanda', icon: TrendingUp, badge: 'UPME' },
        { path: '/regalias', label: 'Regalías', icon: Coins, badge: 'MME' },
        { path: '/geografia', label: 'Mapa Interactivo', icon: Map, badge: null },
        { path: '/descarga-informe', label: 'Descarga de Informe', icon: Download, badge: null },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 z-20 shadow-xl hidden md:flex">
            <div className="p-6 border-b border-slate-700 flex flex-col items-center gap-4">
                <img 
                    src={logoMinEnergia} 
                    alt="Ministerio de Energía" 
                    className="h-20 w-auto"
                />
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-lg">
                        <Flame className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">SIMGN</h1>
                        <p className="text-xs text-slate-400">MinMinas & Energía</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                                isActive 
                                    ? 'bg-orange-600 text-white shadow-md' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium flex-1">{item.label}</span>
                        {item.badge && (
                            <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                                {item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <div className="relative">
                    <button 
                        onClick={() => setShowHelpMenu(!showHelpMenu)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-3 flex items-center justify-between transition-colors"
                    >
                        <span className="font-medium">Ayuda y Contacto</span>
                        <HelpCircle className="w-5 h-5" />
                    </button>
                    
                    {showHelpMenu && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
                            <div className="p-4">
                                <h4 className="font-bold text-slate-800 mb-3">Información de Contacto</h4>
                                <div className="space-y-3">
                                    <a 
                                        href="mailto:soporte@simgn.gov.co"
                                        className="flex items-center gap-3 text-sm text-slate-600 hover:text-orange-600 transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        <div>
                                            <div className="font-medium">Email</div>
                                            <div className="text-xs">soporte@simgn.gov.co</div>
                                        </div>
                                    </a>
                                    <a 
                                        href="tel:+576013234567"
                                        className="flex items-center gap-3 text-sm text-slate-600 hover:text-orange-600 transition-colors"
                                    >
                                        <Phone className="w-4 h-4" />
                                        <div>
                                            <div className="font-medium">Teléfono</div>
                                            <div className="text-xs">(+57) 601 323 4567</div>
                                        </div>
                                    </a>
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <MessageCircle className="w-4 h-4" />
                                        <div>
                                            <div className="font-medium">Horario</div>
                                            <div className="text-xs">Lun - Vie: 8:00 - 17:00</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-200">
                                    <p className="text-xs text-slate-500">
                                        MinMinas & Energía<br/>
                                        Sistema Integrado de Monitoreo<br/>
                                        de Gas Natural - SIMGN
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;