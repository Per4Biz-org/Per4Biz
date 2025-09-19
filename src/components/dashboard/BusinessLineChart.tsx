import React from 'react';

interface SeriesConfig {
  id: string;
  label: string;
  color: string;
  data: number[];
}

interface BusinessLineChartProps {
  categories: string[];
  series: SeriesConfig[];
  title?: string;
  subtitle?: string;
  height?: number;
}

const BusinessLineChart: React.FC<BusinessLineChartProps> = ({ categories, series, title, subtitle, height = 220 }) => {
  if (!series.length || !categories.length) {
    return null;
  }

  const max = Math.max(...series.flatMap(s => s.data));
  const min = Math.min(...series.flatMap(s => s.data));
  const range = max - min || 1;

  const pointsBySeries = series.map(({ data }) =>
    data.map((value, index) => {
      const x = (index / (categories.length - 1 || 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return { x, y };
    })
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">{series[0].label}</p>
          <p className="text-sm text-slate-500">{categories[0]} • {categories[categories.length - 1]}</p>
        </div>
        <div className="flex gap-4">
          {series.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6">
        <div className="relative">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full"
            style={{ height }}
          >
            <defs>
              {series.map((item) => (
                <linearGradient id={`line-${item.id}`} key={item.id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={item.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={item.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {Array.from({ length: 4 }).map((_, index) => {
              const y = (index / 3) * 100;
              return (
                <line
                  key={index}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="2 4"
                  strokeWidth={0.4}
                />
              );
            })}

            {pointsBySeries.map((points, sIndex) => {
              const { color, id } = series[sIndex];
              const linePath = points
                .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
                .join(' ');

              const areaPath = ['M0,100']
                .concat(points.map(point => `L${point.x},${point.y}`))
                .concat('L100,100 Z')
                .join(' ');

              const last = points[points.length - 1];

              return (
                <g key={id}>
                  <path d={areaPath} fill={`url(#line-${id})`} stroke="none" />
                  <path
                    d={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.6}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <circle cx={last.x} cy={last.y} r={1.8} fill={color} stroke="#fff" strokeWidth={0.7} />
                </g>
              );
            })}
          </svg>
        </div>
        <div className="mt-4 flex justify-between text-xs text-slate-400">
          {categories.map((label, index) => (
            <span key={label} className={index === 0 ? 'text-left' : index === categories.length - 1 ? 'text-right' : 'text-center'}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BusinessLineChart;

