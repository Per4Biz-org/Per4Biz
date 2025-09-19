import React from 'react';
import type { LucideIcon } from 'lucide-react';
import ModernMiniChart from './ModernMiniChart';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
  trendLabel?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  accent?: 'blue' | 'green' | 'purple' | 'amber';
  trendData?: number[];
  chartColor?: string;
  chartFill?: string;
}

const accentClasses: Record<NonNullable<MetricCardProps['accent']>, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  purple: 'bg-purple-50 text-purple-600',
  amber: 'bg-amber-50 text-amber-600'
};

const trendClasses: Record<'up' | 'down' | 'neutral', string> = {
  up: 'text-emerald-600',
  down: 'text-rose-600',
  neutral: 'text-slate-500'
};

const trendIcons: Record<'up' | 'down' | 'neutral', string> = {
  up: '+',
  down: '-',
  neutral: '~'
};

const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  label,
  value,
  helper,
  trendLabel,
  trendDirection = 'neutral',
  accent = 'blue',
  trendData,
  chartColor,
  chartFill
}) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/30 p-4 shadow-sm transition-all duration-300 hover:border-slate-300/60 hover:shadow-lg hover:-translate-y-1">
      {/* Header with icon and trend */}
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accentClasses[accent]} transition-all duration-300 group-hover:scale-110 shadow-sm`}>
          <Icon size={16} />
        </div>
        {trendLabel && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendClasses[trendDirection]} bg-white border border-slate-200/50 shadow-sm`}>
            <span className="text-xs font-bold">{trendIcons[trendDirection]}</span>
            <span>{trendLabel}</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="space-y-2 mb-3">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{label}</h3>
          <p className="text-lg font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
        {helper && <p className="text-xs text-slate-600 leading-relaxed">{helper}</p>}
      </div>

      {/* Chart area */}
      {trendData && trendData.length > 1 && (
        <div className="relative">
          <ModernMiniChart
            data={trendData}
            strokeColor={chartColor}
            fillColor={chartFill}
            className="h-12 w-full relative z-10"
          />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
