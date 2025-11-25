import React from 'react';
import { Filter, X } from 'lucide-react';
import DateRangePicker from './DateRangePicker';
import ScoreRangeSlider from './ScoreRangeSlider';

export interface AnalyticsFilters {
  dateFrom: string;
  dateTo: string;
  scoreMin: number;
  scoreMax: number;
  status: string;
  sectionId: string;
  subject: string;
  violationsOnly: boolean;
}

interface FilterPanelProps {
  filters: AnalyticsFilters;
  onChange: (filters: AnalyticsFilters) => void;
  onReset: () => void;
  examTotalMarks?: number;
  sections?: Array<{ id: number; name: string; subject: string }>;
  isOpen: boolean;
  onToggle: () => void;
}

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  examTotalMarks = 100,
  sections = [],
  isOpen,
  onToggle,
}: FilterPanelProps) {
  const updateFilter = (key: keyof AnalyticsFilters, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = 
    filters.dateFrom || filters.dateTo ||
    filters.scoreMin > 0 || filters.scoreMax < examTotalMarks ||
    filters.status !== 'all' ||
    filters.sectionId !== '' ||
    filters.subject !== '' ||
    filters.violationsOnly;

  return (
    <>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
          hasActiveFilters
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[10px]">
            Active
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Filter Analytics</h3>
            <button
              onClick={onToggle}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <DateRangePicker
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              onChange={(from, to) => {
                updateFilter('dateFrom', from);
                updateFilter('dateTo', to);
              }}
            />

            <ScoreRangeSlider
              min={0}
              max={examTotalMarks}
              valueMin={filters.scoreMin}
              valueMax={filters.scoreMax}
              onChange={(min, max) => {
                updateFilter('scoreMin', min);
                updateFilter('scoreMax', max);
              }}
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="auto_submitted">Auto Submitted</option>
                <option value="in_progress">In Progress</option>
                <option value="disqualified">Disqualified</option>
              </select>
            </div>

            {sections.length > 0 && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Section</label>
                  <select
                    value={filters.sectionId}
                    onChange={(e) => updateFilter('sectionId', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sections</option>
                    {sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name} ({section.subject})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={filters.subject}
                    onChange={(e) => updateFilter('subject', e.target.value)}
                    placeholder="Filter by subject..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="violations-only"
                checked={filters.violationsOnly}
                onChange={(e) => updateFilter('violationsOnly', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="violations-only" className="text-xs text-slate-700">
                Show only attempts with violations
              </label>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={onReset}
                className="flex-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
              >
                Reset Filters
              </button>
              <button
                onClick={onToggle}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

