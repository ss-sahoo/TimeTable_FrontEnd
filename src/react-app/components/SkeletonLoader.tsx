import React from 'react';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

// Base skeleton component with shimmer animation
const SkeletonBase: React.FC<SkeletonProps> = ({ className = '', children }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] rounded">
        {children}
      </div>
    </div>
  );
};

// Text skeleton with varying widths
export const SkeletonText: React.FC<{ 
  lines?: number; 
  className?: string;
  variant?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ lines = 1, className = '', variant = 'md' }) => {
  const heightClasses = {
    sm: 'h-3',
    md: 'h-4', 
    lg: 'h-5',
    xl: 'h-6'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBase
          key={index}
          className={`${heightClasses[variant]} ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

// Card skeleton
export const SkeletonCard: React.FC<{ 
  className?: string;
  showHeader?: boolean;
  showContent?: boolean;
  showFooter?: boolean;
}> = ({ 
  className = '', 
  showHeader = true, 
  showContent = true, 
  showFooter = false 
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm ${className}`}>
      {showHeader && (
        <div className="p-5 border-b border-slate-200 dark:border-gray-700">
          <SkeletonText lines={1} variant="lg" className="w-1/3" />
        </div>
      )}
      {showContent && (
        <div className="p-5">
          <SkeletonText lines={3} />
        </div>
      )}
      {showFooter && (
        <div className="p-5 border-t border-slate-200 dark:border-gray-700">
          <SkeletonText lines={1} variant="sm" className="w-1/4" />
        </div>
      )}
    </div>
  );
};

// Stats card skeleton
export const SkeletonStatsCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 dark:border-gray-700 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <SkeletonText lines={1} variant="sm" className="w-1/2 mb-2" />
          <SkeletonText lines={1} variant="xl" className="w-1/3" />
        </div>
        <SkeletonBase className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
};

// Table skeleton
export const SkeletonTable: React.FC<{ 
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <SkeletonText lines={1} variant="lg" className="w-1/4" />
          <SkeletonBase className="w-20 h-8 rounded-lg" />
        </div>
      </div>
      
      {/* Table rows */}
      <div className="p-5">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <SkeletonText 
                  key={colIndex} 
                  lines={1} 
                  className={`flex-1 ${colIndex === columns - 1 ? 'w-16' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// List skeleton
export const SkeletonList: React.FC<{ 
  items?: number;
  className?: string;
  showAvatars?: boolean;
}> = ({ items = 5, className = '', showAvatars = false }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-lg">
          {showAvatars && (
            <SkeletonBase className="w-10 h-10 rounded-lg" />
          )}
          <div className="flex-1">
            <SkeletonText lines={1} variant="md" className="w-2/3 mb-1" />
            <SkeletonText lines={1} variant="sm" className="w-1/2" />
          </div>
          <SkeletonBase className="w-16 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
};

// Chart skeleton
export const SkeletonChart: React.FC<{ 
  className?: string;
  height?: string;
}> = ({ className = '', height = 'h-64' }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm ${className}`}>
      <div className="p-5 border-b border-slate-200 dark:border-gray-700">
        <SkeletonText lines={1} variant="lg" className="w-1/3" />
      </div>
      <div className="p-5">
        <SkeletonBase className={`${height} w-full rounded-lg`} />
      </div>
    </div>
  );
};

// Button skeleton
export const SkeletonButton: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32'
  };

  return (
    <SkeletonBase className={`${sizeClasses[size]} rounded-lg ${className}`} />
  );
};

// Avatar skeleton
export const SkeletonAvatar: React.FC<{ 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <SkeletonBase className={`${sizeClasses[size]} rounded-full ${className}`} />
  );
};

// Grid skeleton
export const SkeletonGrid: React.FC<{ 
  columns?: number;
  rows?: number;
  className?: string;
  itemClassName?: string;
}> = ({ 
  columns = 3, 
  rows = 2, 
  className = '', 
  itemClassName = '' 
}) => {
  return (
    <div className={`grid gap-4 ${className}`} style={{
      gridTemplateColumns: `repeat(${columns}, 1fr)`
    }}>
      {Array.from({ length: columns * rows }).map((_, index) => (
        <SkeletonCard key={index} className={itemClassName} />
      ))}
    </div>
  );
};

// Dashboard skeleton - specific for admin dashboard
export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <SkeletonText lines={1} variant="xl" className="w-1/3 mb-2" />
            <SkeletonText lines={1} variant="md" className="w-1/2" />
          </div>
          <SkeletonBase className="w-16 h-16 rounded-xl" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonStatsCard key={index} />
        ))}
      </div>

      {/* Additional Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonStatsCard key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Exams Skeleton */}
        <div className="lg:col-span-2">
          <SkeletonTable rows={4} columns={1} />
        </div>

        {/* Quick Actions Skeleton */}
        <div>
          <SkeletonCard>
            <div className="p-5">
              <SkeletonList items={6} />
            </div>
          </SkeletonCard>
        </div>
      </div>

      {/* Recent Attempts Skeleton */}
      <SkeletonTable rows={5} columns={1} />

      {/* Upcoming Events Skeleton */}
      <SkeletonCard>
        <div className="p-5">
          <div className="text-center py-8">
            <SkeletonBase className="w-12 h-12 rounded-lg mx-auto mb-4" />
            <SkeletonText lines={1} variant="lg" className="w-1/3 mx-auto mb-2" />
            <SkeletonText lines={1} variant="md" className="w-1/2 mx-auto" />
          </div>
        </div>
      </SkeletonCard>
    </div>
  );
};

// Student Dashboard Skeleton
export const SkeletonStudentDashboard: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <SkeletonText lines={1} variant="xl" className="w-1/3 mb-2" />
            <SkeletonText lines={1} variant="md" className="w-1/2" />
          </div>
          <SkeletonBase className="w-16 h-16 rounded-xl" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonStatsCard key={index} />
        ))}
      </div>

      {/* Search and Filter Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <SkeletonBase className="flex-1 h-10 rounded-lg" />
          <SkeletonButton size="md" />
          <SkeletonButton size="md" />
        </div>
      </div>

      {/* Exam Cards Grid Skeleton */}
      <SkeletonGrid columns={1} rows={3} className="lg:grid-cols-2 xl:grid-cols-3" />

      {/* Recent Activity Skeleton */}
      <SkeletonTable rows={4} columns={1} />

      {/* Performance Chart Skeleton */}
      <SkeletonChart height="h-80" />
    </div>
  );
};

export default SkeletonBase;
