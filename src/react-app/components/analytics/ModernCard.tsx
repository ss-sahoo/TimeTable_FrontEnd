import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ModernCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  gradient?: 'blue' | 'emerald' | 'purple' | 'amber' | 'rose' | 'cyan';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const gradientMap = {
  blue: 'from-blue-500 to-blue-600',
  emerald: 'from-emerald-500 to-emerald-600',
  purple: 'from-purple-500 to-purple-600',
  amber: 'from-amber-500 to-amber-600',
  rose: 'from-rose-500 to-rose-600',
  cyan: 'from-cyan-500 to-cyan-600',
};

const iconBgMap = {
  blue: 'bg-blue-500/20 text-blue-100',
  emerald: 'bg-emerald-500/20 text-emerald-100',
  purple: 'bg-purple-500/20 text-purple-100',
  amber: 'bg-amber-500/20 text-amber-100',
  rose: 'bg-rose-500/20 text-rose-100',
  cyan: 'bg-cyan-500/20 text-cyan-100',
};

export default function ModernCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  gradient = 'blue',
  size = 'md',
  className = '',
  onClick,
}: ModernCardProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  const valueSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientMap[gradient]}
        shadow-lg shadow-${gradient}-500/25 ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
      
      {/* Decorative circles */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-2">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className={`${valueSizes[size]} font-bold text-white`}>{value}</p>
            {trend && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  trend.isPositive 
                    ? 'bg-emerald-400/30 text-emerald-100' 
                    : 'bg-rose-400/30 text-rose-100'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </motion.span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-white/70 mt-2">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBgMap[gradient]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
