import React from 'react';
import { TrendingUp } from 'lucide-react';

interface ScoreRangeSliderProps {
  min: number;
  max: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
}

export default function ScoreRangeSlider({ min, max, valueMin, valueMax, onChange }: ScoreRangeSliderProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), valueMax);
    onChange(newMin, valueMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), valueMin);
    onChange(valueMin, newMax);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-700">Score Range</label>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-slate-400" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={min}
              max={max}
              value={valueMin}
              onChange={handleMinChange}
              className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="number"
              min={min}
              max={max}
              value={valueMax}
              onChange={handleMaxChange}
              className="w-20 px-2 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <input
              type="range"
              min={min}
              max={max}
              value={valueMin}
              onChange={handleMinChange}
              className="absolute w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              style={{ zIndex: valueMin > valueMax - 10 ? 2 : 1 }}
            />
            <input
              type="range"
              min={min}
              max={max}
              value={valueMax}
              onChange={handleMaxChange}
              className="absolute w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

