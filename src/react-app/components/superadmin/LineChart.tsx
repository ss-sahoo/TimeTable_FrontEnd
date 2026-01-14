import React from 'react';

interface ChartData {
  label: string;
  value: number;
}

interface LineChartProps {
  data: ChartData[];
  title?: string;
  height?: number;
}

export default function LineChart({ data, height = 300 }: LineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 10);
  const padding = 20;
  const chartHeight = 100 - (padding * 2);
  const chartWidth = 100;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = 100 - padding - (item.value / maxValue) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="w-full">
      <div style={{ height: `${height}px` }} className="relative group">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <line
              key={tick}
              x1="0"
              y1={100 - padding - tick * chartHeight}
              x2="100"
              y2={100 - padding - tick * chartHeight}
              className="stroke-slate-200 dark:stroke-gray-700"
              strokeWidth="0.1"
              strokeDasharray="1,1"
            />
          ))}

          {/* Area Fill */}
          <polygon
            points={areaPoints}
            fill="url(#chartGradient)"
          />

          {/* Line */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="drop-shadow-lg"
          />

          {/* Data Points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * chartWidth;
            const y = 100 - padding - (item.value / maxValue) * chartHeight;
            return (
              <g key={index} className="cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r="1.5"
                  className="fill-white dark:fill-gray-800 stroke-blue-500 transition-all duration-300 group-hover:r-2"
                  strokeWidth="0.5"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* X-Axis Labels */}
      <div className="flex justify-between mt-4 px-1">
        {data.map((item, index) => (
          <span key={index} className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
