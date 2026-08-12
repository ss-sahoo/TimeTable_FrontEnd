import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Image, File } from 'lucide-react';

interface ExportButtonProps {
  onExport: (format: 'csv' | 'excel' | 'pdf' | 'image') => void;
  disabled?: boolean;
}

export default function ExportButton({ onExport, disabled = false }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const exportOptions = [
    { format: 'csv' as const, label: 'Export as CSV', icon: FileText },
    { format: 'excel' as const, label: 'Export as Excel', icon: FileSpreadsheet },
    { format: 'pdf' as const, label: 'Export as PDF', icon: File },
    { format: 'image' as const, label: 'Export as Image', icon: Image },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4" />
        Export
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[180px]">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.format}
                  onClick={() => {
                    onExport(option.format);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

