import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  delay?: number;
}

export default function GlassCard({
  children,
  className = '',
  hover = true,
  padding = 'md',
  delay = 0,
}: GlassCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.15)' } : undefined}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/80 backdrop-blur-xl
        border border-white/20
        shadow-xl shadow-slate-200/50
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-slate-50/30 pointer-events-none" />
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
