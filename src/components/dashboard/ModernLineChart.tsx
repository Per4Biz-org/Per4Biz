import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface SeriesConfig {
  id: string;
  label: string;
  color: string;
  data: number[];
}

interface ModernLineChartProps {
  categories: string[];
  series: SeriesConfig[];
  title?: string;
  subtitle?: string;
}

const ModernLineChart: React.FC<ModernLineChartProps> = ({
  categories,
  series,
  title,
  subtitle
}) => {
  // Transformar os dados para o formato que o Recharts espera
  const data = categories.map((category, index) => {
    const dataPoint: any = { name: category };
    series.forEach(serie => {
      dataPoint[serie.id] = serie.data[index] || 0;
    });
    return dataPoint;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600">{subtitle}</p>
      </div>

      {/* Chart Container */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              opacity={0.6}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}K`;
                }
                return value.toString();
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                fontSize: '14px'
              }}
              labelStyle={{ color: '#1e293b', fontWeight: '600' }}
              formatter={(value: any, name: string) => {
                const serie = series.find(s => s.id === name);
                return [
                  `EUR ${typeof value === 'number' ? value.toLocaleString() : value}`,
                  serie?.label || name
                ];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            {series.map((serie) => (
              <Line
                key={serie.id}
                type="monotone"
                dataKey={serie.id}
                stroke={serie.color}
                strokeWidth={3}
                dot={{
                  fill: serie.color,
                  strokeWidth: 2,
                  stroke: 'white',
                  r: 4
                }}
                activeDot={{
                  r: 6,
                  stroke: serie.color,
                  strokeWidth: 2,
                  fill: 'white'
                }}
                name={serie.label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ModernLineChart;