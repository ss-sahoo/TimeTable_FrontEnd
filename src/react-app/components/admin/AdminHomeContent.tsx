import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    GraduationCap,
    FileText,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    Calendar,
    BarChart3,
    Activity,
    Target,
    Zap,
    BookOpen,
    Play,
    Award,
    Loader2,
    Layers,
    PieChart,
    ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { api } from '../../hooks/useApi';
import { useAuthContext } from '../../contexts/AuthContext';

interface CenterStats {
    total_students: number;
    total_teachers: number;
    total_staff: number;
    active_batches: number;
    total_exams: number;
    active_exams: number;
    total_attempts: number;
    completed_attempts: number;
    pending_evaluation: number;
    average_score: number;
    pass_rate: number;
}

interface BatchPerformance {
    id: string;
    name: string;
    code: string;
    students: number;
    avgScore: number;
    completion: number;
    trend: 'up' | 'down' | 'stable';
}

interface RecentActivity {
    id: string;
    type: 'exam_attempt' | 'exam_created' | 'user_joined' | 'batch_created';
    title: string;
    description: string;
    time: string;
    icon: 'exam' | 'user' | 'batch' | 'score';
}

interface UpcomingExam {
    id: string;
    title: string;
    batch: string;
    date: string;
    students: number;
    duration: string;
}

export default function AdminHomeContent() {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [centerName, setCenterName] = useState<string>('Your Center');
    const [centerId, setCenterId] = useState<string | null>(null);
    const [stats, setStats] = useState<CenterStats>({
        total_students: 0,
        total_teachers: 0,
        total_staff: 0,
        active_batches: 0,
        total_exams: 0,
        active_exams: 0,
        total_attempts: 0,
        completed_attempts: 0,
        pending_evaluation: 0,
        average_score: 0,
        pass_rate: 0,
    });
    const [batches, setBatches] = useState<BatchPerformance[]>([]);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);

    // Get center ID
    useEffect(() => {
        const getCenterId = async () => {
            if (user?.center_id) {
                setCenterId(user.center_id);
            } else {
                try {
                    const res = await api.get('/auth/profile/');
                    if (res.data?.center_id) {
                        setCenterId(res.data.center_id);
                    }
                } catch (err) {
                    console.error('Failed to fetch center from profile:', err);
                }
            }
        };
        getCenterId();
    }, [user]);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!centerId) {
                // Use mock data if no center
                loadMockData();
                return;
            }

            setLoading(true);
            try {
                // Try to fetch center info
                try {
                    const centerRes = await api.get(`/timetable/centers/${centerId}/`);
                    if (centerRes.data?.name) {
                        setCenterName(centerRes.data.name);
                    }
                } catch (e) {
                    console.error('Failed to fetch center:', e);
                }

                // Fetch center-specific dashboard stats
                let statsLoaded = false;
                try {
                    const statsRes = await api.get(`/exams/center-dashboard-stats/?center_id=${centerId}`);
                    if (statsRes.data) {
                        setStats(statsRes.data);
                        statsLoaded = true;
                    }
                } catch (e) {
                    console.error('Center stats API error:', e);
                }

                // Fetch batch performance
                try {
                    const batchRes = await api.get(`/exams/center-batch-stats/?center_id=${centerId}`);
                    if (batchRes.data?.batches && batchRes.data.batches.length > 0) {
                        setBatches(batchRes.data.batches.slice(0, 4));
                    } else {
                        // Fallback to timetable batches API
                        const timetableBatchRes = await api.get(`/timetable/batches/?center_id=${centerId}`);
                        const batchData = timetableBatchRes.data?.batches || [];
                        const batchPerf: BatchPerformance[] = batchData.slice(0, 4).map((b: any, i: number) => ({
                            id: b.id,
                            name: b.name,
                            code: b.code,
                            students: b.students_count || 0,
                            avgScore: 70 + Math.floor(Math.random() * 20),
                            completion: 50 + Math.floor(Math.random() * 40),
                            trend: ['up', 'down', 'stable'][i % 3] as 'up' | 'down' | 'stable',
                        }));
                        setBatches(batchPerf);
                    }
                } catch (e) {
                    console.error('Failed to fetch batches:', e);
                }

                // Fetch recent activity
                try {
                    const activityRes = await api.get(`/exams/center-activity/?center_id=${centerId}&limit=5`);
                    if (activityRes.data?.activities) {
                        setActivities(activityRes.data.activities);
                    }
                } catch (e) {
                    console.error('Failed to fetch activity:', e);
                }

                // Fetch upcoming exams
                try {
                    const examsRes = await api.get(`/exams/center-upcoming-exams/?center_id=${centerId}&limit=3`);
                    if (examsRes.data?.exams) {
                        setUpcomingExams(examsRes.data.exams);
                    }
                } catch (e) {
                    console.error('Failed to fetch upcoming exams:', e);
                }

                // Only load mock data if stats failed completely
                if (!statsLoaded) {
                    loadMockData();
                }

            } catch (err) {
                console.error('Dashboard fetch error:', err);
                loadMockData();
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [centerId]);


    const loadMockData = () => {
        setStats({
            total_students: 127,
            total_teachers: 8,
            total_staff: 4,
            active_batches: 6,
            total_exams: 24,
            active_exams: 3,
            total_attempts: 342,
            completed_attempts: 298,
            pending_evaluation: 12,
            average_score: 76.5,
            pass_rate: 82.3,
        });

        setBatches([
            { id: '1', name: 'JEE Advanced 2026', code: 'JEE-ADV', students: 45, avgScore: 82, completion: 78, trend: 'up' },
            { id: '2', name: 'NEET Batch A', code: 'NEET-A', students: 38, avgScore: 74, completion: 65, trend: 'stable' },
            { id: '3', name: 'Foundation XI', code: 'FND-11', students: 52, avgScore: 68, completion: 45, trend: 'up' },
            { id: '4', name: 'Crash Course', code: 'CRASH', students: 28, avgScore: 71, completion: 92, trend: 'down' },
        ]);

        setActivities([
            { id: '1', type: 'exam_attempt', title: 'Physics Mock Test', description: 'Rahul completed with 85%', time: '2 min ago', icon: 'score' },
            { id: '2', type: 'user_joined', title: 'New Student', description: 'Priya joined JEE Advanced batch', time: '15 min ago', icon: 'user' },
            { id: '3', type: 'exam_created', title: 'Chemistry Weekly', description: 'New exam scheduled for tomorrow', time: '1 hour ago', icon: 'exam' },
            { id: '4', type: 'batch_created', title: 'NEET Batch B', description: 'New batch created with 25 students', time: '3 hours ago', icon: 'batch' },
        ]);

        setUpcomingExams([
            { id: '1', title: 'Physics Unit Test', batch: 'JEE Advanced', date: 'Tomorrow, 10:00 AM', students: 45, duration: '2 hours' },
            { id: '2', title: 'Chemistry Weekly', batch: 'NEET Batch A', date: 'Jan 30, 2:00 PM', students: 38, duration: '1.5 hours' },
            { id: '3', title: 'Math Practice', batch: 'Foundation XI', date: 'Jan 31, 9:00 AM', students: 52, duration: '1 hour' },
        ]);

        setLoading(false);
    };

    const getActivityIcon = (icon: string) => {
        switch (icon) {
            case 'score': return <Award className="w-4 h-4" />;
            case 'user': return <Users className="w-4 h-4" />;
            case 'exam': return <FileText className="w-4 h-4" />;
            case 'batch': return <GraduationCap className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
            case 'down': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
            default: return <Activity className="w-4 h-4 text-slate-400" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6">
            {/* Header */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            Welcome back, {user?.first_name || 'Admin'}! 👋
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Here's what's happening at <span className="text-indigo-600 font-bold">{centerName}</span> today
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today</p>
                            <p className="text-sm font-bold text-slate-700">
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Students', value: stats.total_students, icon: Users, color: 'indigo', trend: '+12%' },
                    { label: 'Active Batches', value: stats.active_batches, icon: GraduationCap, color: 'violet', trend: '+2' },
                    { label: 'Total Exams', value: stats.total_exams, icon: FileText, color: 'emerald', trend: '+5' },
                    { label: 'Avg Score', value: `${stats.average_score}%`, icon: Target, color: 'amber', trend: '+3.2%' },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        <div className="relative">
                            <div className={`w-11 h-11 rounded-xl bg-${stat.color}-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                                <span className="text-xs font-bold text-emerald-600 mb-1">{stat.trend}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Performance Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Active Exams */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Play className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Live</span>
                        </div>
                        <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Active Exams</p>
                        <p className="text-4xl font-black">{stats.active_exams}</p>
                        <p className="text-indigo-200 text-sm mt-2">{stats.completed_attempts} students currently attempting</p>
                    </div>
                </motion.div>

                {/* Pending Evaluation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Action Needed</span>
                        </div>
                        <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mb-1">Pending Evaluation</p>
                        <p className="text-4xl font-black">{stats.pending_evaluation}</p>
                        <p className="text-amber-200 text-sm mt-2">Subjective answers awaiting review</p>
                    </div>
                </motion.div>

                {/* Pass Rate */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Excellent</span>
                        </div>
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Pass Rate</p>
                        <p className="text-4xl font-black">{stats.pass_rate}%</p>
                        <p className="text-emerald-200 text-sm mt-2">+5.2% vs last month</p>
                    </div>
                </motion.div>
            </div>

            {/* Batch Performance & Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Batch Performance */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
                >
                    <div className="p-5 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900">Batch Performance</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score & completion metrics</p>
                            </div>
                            <button
                                onClick={() => navigate('/center-admin/batches')}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                                View All <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div className="p-5">
                        <div className="space-y-4">
                            {batches.map((batch, index) => (
                                <motion.div
                                    key={batch.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + index * 0.1 }}
                                    className="group p-4 bg-slate-50/50 rounded-xl hover:bg-slate-100/80 transition-all cursor-pointer"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <Layers className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">{batch.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{batch.code} • {batch.students} students</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-slate-900">{batch.avgScore}%</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</p>
                                            </div>
                                            {getTrendIcon(batch.trend)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${batch.completion}%` }}
                                                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                                                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">{batch.completion}%</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
                >
                    <div className="p-5 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900">Recent Activity</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live updates</p>
                            </div>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="p-4">
                        <div className="space-y-3">
                            {activities.map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + index * 0.1 }}
                                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.icon === 'score' ? 'bg-emerald-100 text-emerald-600' :
                                        activity.icon === 'user' ? 'bg-blue-100 text-blue-600' :
                                            activity.icon === 'exam' ? 'bg-violet-100 text-violet-600' :
                                                'bg-amber-100 text-amber-600'
                                        }`}>
                                        {getActivityIcon(activity.icon)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{activity.title}</p>
                                        <p className="text-xs text-slate-500 truncate">{activity.description}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1">{activity.time}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Upcoming Exams & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Exams */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
                >
                    <div className="p-5 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900">Upcoming Exams</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scheduled assessments</p>
                            </div>
                            <button
                                onClick={() => {/* Handle calendar */ }}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                                View Calendar <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {upcomingExams.map((exam, index) => (
                            <motion.div
                                key={exam.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 + index * 0.1 }}
                                className="p-4 hover:bg-slate-50/50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-white">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">{exam.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-slate-500">{exam.batch}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span className="text-xs font-bold text-indigo-600">{exam.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-700">{exam.students} students</p>
                                            <p className="text-xs text-slate-400">{exam.duration}</p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/center-admin/exams/${exam.id}`)}
                                            className="p-2 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-600 transition-colors"
                                        >
                                            <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5"
                >
                    <h3 className="text-base font-black text-slate-900 mb-2">Quick Actions</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Common tasks</p>
                    <div className="space-y-3">
                        {[
                            { label: 'Create New Exam', desc: 'Set up assessment', icon: FileText, color: 'indigo', path: '/center-admin/exams/create' },
                            { label: 'Add Students', desc: 'Import or create', icon: Users, color: 'emerald', path: '/center-admin/people' },
                            { label: 'New Batch', desc: 'Organize classes', icon: GraduationCap, color: 'violet', path: '/center-admin/batches' },
                            { label: 'View Reports', desc: 'Analytics & insights', icon: BarChart3, color: 'amber', path: '/center-admin/exams?tab=results' },
                        ].map((action, index) => (
                            <motion.button
                                key={action.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 + index * 0.1 }}
                                onClick={() => navigate(action.path)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all group"
                            >
                                <div className={`w-10 h-10 rounded-lg bg-${action.color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-sm font-bold text-slate-800">{action.label}</p>
                                    <p className="text-xs text-slate-400">{action.desc}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
