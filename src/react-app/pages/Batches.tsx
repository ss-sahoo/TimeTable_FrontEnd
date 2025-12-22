import { useState } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  Calendar,
  Users,
} from 'lucide-react';

interface Batch {
  id: number;
  name: string;
  program: string;
  students: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
}

const mockBatches: Batch[] = [
  { id: 1, name: 'Super 30 – 2026 Elite', program: 'Super 30 – JEE Advanced', students: 30, startDate: '2024-01-01', endDate: '2025-12-31', status: 'active' },
  { id: 2, name: 'Super 30 – 2027 Foundation', program: 'Super 30 – JEE Advanced', students: 28, startDate: '2024-01-01', endDate: '2026-12-31', status: 'active' },
  { id: 3, name: 'OnlyBoard XII – Morning', program: 'OnlyBoard – CBSE 12th', students: 45, startDate: '2024-01-01', endDate: '2025-03-31', status: 'active' },
  { id: 4, name: 'OnlyBoard XII – Evening', program: 'OnlyBoard – CBSE 12th', students: 40, startDate: '2024-01-01', endDate: '2025-03-31', status: 'active' },
];

export default function Batches() {
  const [batches] = useState<Batch[]>(mockBatches);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBatches = batches.filter(
    (batch) =>
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.program.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Batches</h1>
          <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">Manage your batches and student groups</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/25">
          <Plus className="w-4 h-4" />
          Create Batch
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search batches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-slate-900 dark:text-gray-100"
        />
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">{batch.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400">{batch.program}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1">
                  <Users className="w-4 h-4" /> Students
                </span>
                <span className="font-medium text-slate-900 dark:text-gray-100">{batch.students}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Start Date
                </span>
                <span className="font-medium text-slate-900 dark:text-gray-100">{batch.startDate}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-gray-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> End Date
                </span>
                <span className="font-medium text-slate-900 dark:text-gray-100">{batch.endDate}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-gray-700">
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                batch.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-700 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {batch.status}
              </span>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">Manage →</button>
            </div>
          </div>
        ))}
      </div>

      {filteredBatches.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">No batches found</h3>
          <p className="text-slate-600 dark:text-gray-400">Try adjusting your search or create a new batch.</p>
        </div>
      )}
    </div>
  );
}
