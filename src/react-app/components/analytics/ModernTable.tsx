import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface ModernTableProps<T> {
  columns: Column<T>[];
  data: T[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export default function ModernTable<T extends Record<string, any>>({
  columns,
  data,
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
}: ModernTableProps<T>) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/50 overflow-hidden bg-white/50">
        <div className="animate-pulse">
          <div className="h-12 bg-slate-100" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border-t border-slate-100 flex items-center px-4 gap-4">
              {columns.map((_, j) => (
                <div key={j} className="h-4 bg-slate-100 rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/50 overflow-hidden bg-white/50 p-12 text-center">
        <p className="text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/50 overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-slate-100/80">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-4 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider
                    ${alignClasses[column.align || 'left']}
                    ${column.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className={`flex items-center gap-1.5 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
                    {column.header}
                    {column.sortable && sortBy === column.key && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        {sortOrder === 'asc' ? (
                          <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                        )}
                      </motion.span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onRowClick?.(item)}
                className={`
                  group transition-colors
                  ${onRowClick ? 'cursor-pointer hover:bg-blue-50/50' : 'hover:bg-slate-50/50'}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-4 text-sm ${alignClasses[column.align || 'left']}`}
                  >
                    {column.render
                      ? column.render(item, index)
                      : item[column.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
