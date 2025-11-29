import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
  showValue?: boolean;
  label?: string;
  className?: string;
}

const colorMap = {
  blue: { stroke: '#3b82f6', bg: '#dbeafe' },
  emerald: { stroke: '#10b981', bg: '#d1fae5' },
  amber: { stroke: '#f59e0b', bg: '#fef3c7' },
  rose: { stroke: '#f43f5e', bg: '#ffe4e6' },
  purple: { stroke: '#8b5cf6', bg: '#ede9fe' },
};

export default function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = 'blue',
  showValue = true,
  label,
  className = '',
}: ProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const colors = colorMap[color];

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.bg}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold text-slate-900"
          >
            {percentage.toFixed(0)}%
          </motion.span>
          {label && (
            <span className="text-xs text-slate-500 mt-0.5">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}
