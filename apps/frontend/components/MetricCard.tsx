import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string;
    trend?: number;
    trendLabel?: string;
    icon?: React.ElementType;
    color?: 'blue' | 'orange' | 'green' | 'purple';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    value, 
    trend, 
    trendLabel = 'vs mes anterior',
    icon: Icon,
    color = 'blue'
}) => {
    const colorStyles = {
        blue: 'bg-blue-50 text-blue-600',
        orange: 'bg-orange-50 text-orange-600',
        green: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
                </div>
                {Icon && (
                    <div className={`p-3 rounded-lg ${colorStyles[color]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
            
            <div className="flex items-center text-sm">
                {trend !== undefined && (
                    <>
                        <span className={`flex items-center font-medium ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                            {trend > 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : trend < 0 ? <ArrowDownRight className="w-4 h-4 mr-1" /> : <Minus className="w-4 h-4 mr-1" />}
                            {Math.abs(trend)}%
                        </span>
                        <span className="text-slate-400 ml-2">{trendLabel}</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default MetricCard;