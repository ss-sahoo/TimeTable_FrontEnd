import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Building2, Users, Activity, ShieldCheck, TrendingUp,
    Zap, Server, Globe2, ArrowUpRight, ArrowDownRight,
    Clock, Cpu, HardDrive, Database
} from 'lucide-react';
import { api } from '../hooks/useApi';

interface DashboardStats {
    totalInstitutes: number;
    totalUsers: number;
    activeUsers: number;
    healthScore: string;
}

export default function PlatformDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalInstitutes: 0,
        totalUsers: 0,
        activeUsers: 0,
        healthScore: '99.9%'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/auth/platform/institutes/');
                const institutes = Array.isArray(response.data) ? response.data : (response.data.results || []);

                setStats({
                    totalInstitutes: institutes.length,
                    totalUsers: institutes.reduce((acc: number, curr: any) => acc + (curr?.user_count || 0), 0),
                    activeUsers: institutes.reduce((acc: number, curr: any) => acc + (curr?.active_user_count || 0), 0),
                    healthScore: '99.9%'
                });
            } catch (err) {
                console.error('Failed to fetch dashboard stats', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const metricCards = [
        { label: 'Total Institutes', value: stats.totalInstitutes, icon: Building2, trend: '+12%', positive: true, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Platform Users', value: stats.totalUsers, icon: Users, trend: '+18%', positive: true, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
        { label: 'Active Sessions', value: stats.activeUsers, icon: Zap, trend: '+5%', positive: true, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'System Health', value: stats.healthScore, icon: ShieldCheck, trend: 'Stable', positive: true, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Ecosystem Overview</h1>
                        <p className="text-slate-500 max-w-md">Real-time performance metrics and global distribution analytics for all registered institutes.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20">Live Sync Active</div>
                        <div className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Just now
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-violet-50 rounded-full blur-3xl opacity-50" />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricCards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`bg-white p-6 rounded-3xl border ${card.border} shadow-sm group hover:shadow-md transition-all`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${card.bg} ${card.color} p-3 rounded-2xl`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${card.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {card.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                                {card.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{card.label}</p>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{card.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Performance Chart Card */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Platform Growth</h3>
                            <p className="text-sm text-slate-500 mt-1">Daily user engagement over the last 30 days</p>
                        </div>
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                            {['7D', '30D', '90D'].map(t => (
                                <button key={t} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${t === '30D' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Simplified Custom SVG Chart */}
                    <div className="h-64 relative mt-10">
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            {[0, 25, 50, 75, 100].map(val => (
                                <line key={val} x1="0" y1={val} x2="100" y2={val} stroke="#f1f5f9" strokeWidth="0.5" />
                            ))}
                            {/* Area */}
                            <path
                                d="M 0 80 Q 25 70, 40 40 T 70 30 T 100 10 L 100 100 L 0 100 Z"
                                fill="url(#chartGradient)"
                            />
                            {/* Line */}
                            <motion.path
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                                d="M 0 80 Q 25 70, 40 40 T 70 30 T 100 10"
                                fill="none"
                                stroke="#4f46e5"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            {/* Current Point */}
                            <circle cx="100" cy="10" r="3" fill="#4f46e5" />
                            <circle cx="100" cy="10" r="6" fill="#4f46e5" fillOpacity="0.2">
                                <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                            </circle>
                        </svg>

                        <div className="absolute inset-x-0 bottom-0 flex justify-between pt-4 text-[10px] font-bold text-slate-400">
                            <span>May 19</span>
                            <span>May 26</span>
                            <span>Jun 02</span>
                            <span>Jun 09</span>
                            <span>Jun 19</span>
                        </div>
                    </div>
                </div>

                {/* System Status Section */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Server className="w-5 h-5 text-indigo-400" />
                        System Health
                    </h3>
                    <div className="space-y-6">
                        {[
                            { name: 'Core API Services', status: 'Healthy', icon: Zap, color: 'text-indigo-400' },
                            { name: 'Database Cluster', status: 'Optimal', icon: Database, color: 'text-blue-400' },
                            { name: 'Storage Buckets', status: 'Provisioned', icon: HardDrive, color: 'text-violet-400' },
                            { name: 'Auth Server', status: 'Online', icon: ShieldCheck, color: 'text-emerald-400' },
                            { name: 'Global CDN', status: 'Global', icon: Globe2, color: 'text-sky-400' },
                        ].map((item, i) => (
                            <div key={item.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-semibold">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {item.status}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weekly Uptime</p>
                                <h4 className="text-2xl font-bold">99.98%</h4>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                    <div key={d} className="w-2 h-8 bg-indigo-500/30 rounded-full relative overflow-hidden">
                                        <div className="absolute bottom-0 inset-x-0 bg-indigo-500 h-[90%] rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
