import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onChange: (dateFrom: string, dateTo: string) => void;
}

export default function DateRangePicker({ dateFrom, dateTo, onChange }: DateRangePickerProps) {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, dateTo);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(dateFrom, e.target.value);
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-700">Date Range</label>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFrom}
            onChange={handleFromChange}
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <span className="text-xs text-slate-500">to</span>
        <div className="relative flex-1">
          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateTo}
            onChange={handleToChange}
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

