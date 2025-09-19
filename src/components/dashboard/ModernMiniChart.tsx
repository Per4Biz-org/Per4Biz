import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface ModernMiniChartProps {
  data: number[];
  strokeColor?: string;
  fillColor?: string;
  className?: string;
}

const ModernMiniChart: React.FC<ModernMiniChartProps> = ({
  data,
  strokeColor = '#2563eb',
  fillColor = 'rgba(37, 99, 235, 0.15)',
  className = 'h-16 w-full'
}) => {
  // Transformar os dados para o formato que o Recharts espera
  const chartData = data.map((value, index) => ({
    index,
    value
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
        >
          <defs>
            <linearGradient id={`gradient-${strokeColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={2.5}
            fill={`url(#gradient-${strokeColor.replace('#', '')})`}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ModernMiniChart;