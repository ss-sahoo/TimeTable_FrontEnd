import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
}

const StatsCard = ({ title, value, icon: Icon, color, trend }: StatsCardProps) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${trend.isUp ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
            }`}>
            {trend.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-6">
        <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;
