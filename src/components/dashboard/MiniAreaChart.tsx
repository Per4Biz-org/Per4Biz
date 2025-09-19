import React from 'react';

interface MiniAreaChartProps {
  data: number[];
  strokeColor?: string;
  fillColor?: string;
  className?: string;
}

const MiniAreaChart: React.FC<MiniAreaChartProps> = ({
  data,
  strokeColor = '#2563eb',
  fillColor = 'rgba(37, 99, 235, 0.15)',
  className = 'h-16 w-full'
}) => {
  const safeData = data.length > 1 ? data : [...data, data[data.length - 1] ?? 0];
  const max = Math.max(...safeData);
  const min = Math.min(...safeData);
  const range = max - min || 1;

  const points = safeData.map((value, index) => {
    const x = (index / (safeData.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');

  const areaPath = ['M0,100']
    .concat(points.map(point => `L${point.x},${point.y}`))
    .concat('L100,100 Z')
    .join(' ');

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <path d={areaPath} fill={fillColor} stroke="none" />
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

export default MiniAreaChart;
