import React from 'react';
import MiniAreaChart from './MiniAreaChart';

interface InsightCardProps {
  title: string;
  description?: string;
  value: string;
  changeLabel: string;
  changeDirection?: 'up' | 'down' | 'neutral';
  data: number[];
  strokeColor?: string;
  fillColor?: string;
}

const changeClasses: Record<'up' | 'down' | 'neutral', string> = {
  up: 'text-emerald-600',
  down: 'text-rose-600',
  neutral: 'text-slate-500'
};

const changeIcons: Record<'up' | 'down' | 'neutral', string> = {
  up: '+',
  down: '-',
  neutral: '~'
};

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  value,
  changeLabel,
  changeDirection = 'neutral',
  data,
  strokeColor,
  fillColor
}) => {
  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{title}</p>
        <h3 className="text-3xl font-semibold text-slate-900">{value}</h3>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      <div className="mt-6">
        <MiniAreaChart
          data={data}
          strokeColor={strokeColor}
          fillColor={fillColor}
          className="h-32 w-full"
        />
      </div>
      <span className={`mt-6 inline-flex items-center text-sm font-semibold ${changeClasses[changeDirection]}`}>
        <span className="mr-1">{changeIcons[changeDirection]}</span>
        {changeLabel}
      </span>
    </div>
  );
};

export default InsightCard;
