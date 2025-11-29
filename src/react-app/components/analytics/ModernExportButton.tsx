import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, FileSpreadsheet, Image, File, X } from 'lucide-react';

interface ModernExportButtonProps {
  onExport: (format: 'csv' | 'excel' | 'pdf' | 'image') => void;
  disabled?: boolean;
}

export default function ModernExportButton({ onExport, disabled = false }: ModernExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportOptions = [
    { format: 'csv' as const, label: 'CSV', description: 'Comma-separated values', icon: FileText, color: 'emerald' },
    { format: 'excel' as const, label: 'Excel', description: 'Microsoft Excel format', icon: FileSpreadsheet, color: 'blue' },
    { format: 'pdf' as const, label: 'PDF', description: 'Portable document', icon: File, color: 'rose' },
    { format: 'image' as const, label: 'Image', description: 'PNG screenshot', icon: Image, color: 'purple' },
  ];

  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="
          flex items-center gap-2 px-4 py-2.5 text-sm font-medium
          bg-gradient-to-r from-blue-500 to-blue-600 text-white
          rounded-xl shadow-lg shadow-blue-500/25
          hover:shadow-xl hover:shadow-blue-500/30
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        <Download className="w-4 h-4" />
        Export
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="
                absolute top-full right-0 mt-2 z-50
                bg-white/95 backdrop-blur-xl
                border border-slate-200/50
                rounded-2xl shadow-2xl shadow-slate-200/50
                p-2 min-w-[220px]
              "
            >
              <div className="flex items-center justify-between px-3 py-2 mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Export As
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1">
                {exportOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.format}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        onExport(option.format);
                        setIsOpen(false);
                      }}
                      className="
                        w-full flex items-center gap-3 px-3 py-2.5
                        text-left rounded-xl
                        hover:bg-slate-50 transition-colors
                        group
                      "
                    >
                      <div className={`p-2 rounded-lg transition-colors ${colorClasses[option.color]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{option.label}</p>
                        <p className="text-xs text-slate-400">{option.description}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
