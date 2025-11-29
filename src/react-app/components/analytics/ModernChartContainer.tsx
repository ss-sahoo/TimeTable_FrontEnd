import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface ModernChartContainerProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
  height?: number | string;
  emptyMessage?: string;
  onRetry?: () => void;
}

export default function ModernChartContainer({
  loading,
  error,
  children,
  height = 400,
  emptyMessage = 'No data available',
  onRetry,
}: ModernChartContainerProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50"
        style={{ height }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            </motion.div>
            <p className="text-sm font-medium text-slate-600">Loading analytics...</p>
            <p className="text-xs text-slate-400 mt-1">Please wait</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/50"
        style={{ height }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center px-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
            </motion.div>
            <p className="text-sm font-semibold text-rose-700 mb-2">Unable to load data</p>
            <p className="text-xs text-rose-600/80 mb-4 max-w-xs">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRetry || (() => window.location.reload())}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-rose-500 rounded-lg hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/25"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-xl shadow-slate-200/30"
      style={{ minHeight: height }}
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500" />
      
      <div className="p-6">
        <AnimatePresence mode="wait">
          {children || (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center"
              style={{ height: typeof height === 'number' ? height - 48 : height }}
            >
              <p className="text-sm text-slate-400">{emptyMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
