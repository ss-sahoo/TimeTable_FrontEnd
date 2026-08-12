import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  default: {
    bg: 'bg-slate-50',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    border: 'border-slate-200/50',
  },
  success: {
    bg: 'bg-emerald-50/50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-200/50',
  },
  warning: {
    bg: 'bg-amber-50/50',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    border: 'border-amber-200/50',
  },
  danger: {
    bg: 'bg-rose-50/50',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    border: 'border-rose-200/50',
  },
  info: {
    bg: 'bg-blue-50/50',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-200/50',
  },
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = 'default',
  className = '',
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`
        relative overflow-hidden rounded-xl ${styles.bg}
        border ${styles.border} p-4
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1 truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {trend && (
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  trend.isPositive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1 truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${styles.iconBg} ${styles.iconColor} flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
