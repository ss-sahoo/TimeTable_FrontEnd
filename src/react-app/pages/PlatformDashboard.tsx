import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Building2, Users, Activity, ShieldCheck, TrendingUp,
    Zap, Server, Globe2, ArrowUpRight, ArrowDownRight,
    Clock, Cpu, HardDrive, Database, IndianRupee
} from 'lucide-react';
import { api } from '../hooks/useApi';

interface DashboardStats {
    totalInstitutes: number;
    totalUsers: number;
    activeUsers: number;
    healthScore: string;
    totalRevenue: number;
    pendingRevenue: number;
    revenueTrend: { date: string, amount: number }[];
}

export default function PlatformDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalInstitutes: 0,
        totalUsers: 0,
        activeUsers: 0,
        healthScore: '99.9%',
        totalRevenue: 0,
        pendingRevenue: 0,
        revenueTrend: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [instRes, billRes] = await Promise.all([
                    api.get('/auth/platform/institutes/'),
                    api.get('/billing/platform-dashboard/')
                ]);

                const institutes = Array.isArray(instRes.data) ? instRes.data : (instRes.data.results || []);

                setStats({
                    totalInstitutes: institutes.length,
                    totalUsers: institutes.reduce((acc: number, curr: any) => acc + (curr?.user_count || 0), 0),
                    activeUsers: institutes.reduce((acc: number, curr: any) => acc + (curr?.active_user_count || 0), 0),
                    healthScore: '99.9%',
                    totalRevenue: Number(billRes.data.total_revenue),
                    pendingRevenue: Number(billRes.data.pending_revenue),
                    revenueTrend: billRes.data.revenue_trend
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
        { label: 'Total Revenue', value: '₹' + stats.totalRevenue.toLocaleString(), icon: IndianRupee, trend: '+12%', positive: true, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Pending Revenue', value: '₹' + stats.pendingRevenue.toLocaleString(), icon: Clock, trend: 'Due', positive: false, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'Total Institutes', value: stats.totalInstitutes, icon: Building2, trend: '+12%', positive: true, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Platform Users', value: stats.totalUsers, icon: Users, trend: '+18%', positive: true, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
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
            <div className="relative overflow-hidden bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-display">Ecosystem Overview</h1>
                        <p className="text-slate-500 max-w-md">Real-time financial performance and global distribution analytics for all registered institutes.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                            <Activity className="w-4 h-4 animate-pulse" /> Live Metrics
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
                        className={`bg-white p-7 rounded-3xl border ${card.border} shadow-sm group hover:shadow-lg transition-all cursor-default relative overflow-hidden`}
                    >
                        <div className="flex justify-between items-start mb-5">
                            <div className={`${card.bg} ${card.color} p-4 rounded-2xl`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                            <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full ${card.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {card.trend}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{card.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Graph Card */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Revenue Growth</h3>
                            <p className="text-sm text-slate-500 mt-1">Platform earnings over the last 30 days</p>
                        </div>
                        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                            {['7D', '30D', '90D'].map(t => (
                                <button key={t} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${t === '30D' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Revenue Graph */}
                    <div className="h-64 relative mt-10">
                        {stats.revenueTrend.length > 0 ? (
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 60" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {/* Grid Lines */}
                                {[0, 20, 40, 60].map(val => (
                                    <line key={val} x1="0" y1={val} x2="100" y2={val} stroke="#f1f5f9" strokeWidth="0.5" />
                                ))}

                                {(() => {
                                    const maxVal = Math.max(...stats.revenueTrend.map(d => d.amount), 1000);
                                    const points = stats.revenueTrend.map((d, i) => {
                                        const x = (i / (stats.revenueTrend.length - 1)) * 100;
                                        const y = 60 - (d.amount / maxVal) * 50;
                                        return `${x},${y}`;
                                    }).join(' ');

                                    return (
                                        <>
                                            <path d={`M 0,60 L ${points} L 100,60 Z`} fill="url(#chartGradient)" />
                                            <motion.polyline
                                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }}
                                                points={points} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                            />
                                        </>
                                    );
                                })()}
                            </svg>
                        ) : (
                            <div className="h-full w-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl text-sm text-slate-400">
                                Accumulating more financial data for trends...
                            </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 translate-y-6 flex justify-between text-[10px] font-bold text-slate-400">
                            {stats.revenueTrend.filter((_, i) => i % 7 === 0).map(d => (
                                <span key={d.date}>{d.date}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* System Status Section */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Server className="w-5 h-5 text-indigo-400" />
                        Infrastructure
                    </h3>
                    <div className="space-y-4">
                        {[
                            { name: 'API Services', status: 'Healthy', icon: Zap, color: 'text-indigo-400' },
                            { name: 'DB Clusters', status: 'Optimal', icon: Database, color: 'text-blue-400' },
                            { name: 'Cloud Storage', status: 'Online', icon: HardDrive, color: 'text-violet-400' },
                            { name: 'Auth Gateway', status: 'Secure', icon: ShieldCheck, color: 'text-emerald-400' },
                        ].map((item) => (
                            <div key={item.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-semibold">{item.name}</span>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-glow shadow-emerald-400/50" />
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weekly Uptime</p>
                                <h4 className="text-3xl font-black">99.98%</h4>
                            </div>
                            <div className="flex gap-1.5 items-end">
                                {[30, 50, 40, 60, 80, 70, 90].map((h, i) => (
                                    <motion.div
                                        initial={{ height: 0 }} animate={{ height: h + '%' }} transition={{ delay: 0.5 + i * 0.1 }}
                                        key={i} className="w-1.5 bg-indigo-500 rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
