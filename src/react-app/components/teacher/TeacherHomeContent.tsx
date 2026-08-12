import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    GraduationCap,
    FileText,
    TrendingUp,
    Clock,
    ArrowUpRight,
    BarChart3,
    Activity,
    Target,
    Zap,
    Play,
    Award,
    Loader2,
    Layers,
    ChevronRight,
    ClipboardCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthContext } from '../../contexts/AuthContext';

interface TeacherStats {
    total_students: number;
    assigned_batches: number;
    exams_conducted: number;
    pending_evaluations: number;
    average_batch_score: number;
    active_exams: number;
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
    type: 'exam_attempt' | 'exam_created' | 'evaluation_completed' | 'batch_assigned';
    title: string;
    description: string;
    time: string;
    icon: 'exam' | 'user' | 'batch' | 'score' | 'edit';
}

interface UpcomingExam {
    id: string;
    title: string;
    batch: string;
    date: string;
    students: number;
    duration: string;
}

export default function TeacherHomeContent() {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [centerName, setCenterName] = useState<string>('Your Center');
    const [stats, setStats] = useState<TeacherStats>({
        total_students: 0,
        assigned_batches: 0,
        exams_conducted: 0,
        pending_evaluations: 0,
        average_batch_score: 0,
        active_exams: 0,
    });
    const [batches, setBatches] = useState<BatchPerformance[]>([]);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // In a real app, we'd fetch teacher-specific stats
                // For now, we'll try to get real data if available, else use mocks that look "real"

                // Try to get center name from user context if available
                if (user?.center_name) {
                    setCenterName(user.center_name);
                }

                // If specialized teacher endpoints exist, use them. 
                // Since this is a UI upgrade request, I'll focus on the Premium UI with some realistic mock data
                // similar to how AdminHomeContent does it.

                loadMockData();
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                loadMockData();
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const loadMockData = () => {
        setStats({
            total_students: 84,
            assigned_batches: 3,
            exams_conducted: 15,
            pending_evaluations: 7,
            average_batch_score: 78.2,
            active_exams: 2,
        });

        setBatches([
            { id: '1', name: 'JEE Advanced 2026 Elite', code: 'JEE-E26', students: 30, avgScore: 85, completion: 72, trend: 'up' },
            { id: '2', name: 'NEET Foundation XI', code: 'NEET-F11', students: 42, avgScore: 71, completion: 60, trend: 'stable' },
            { id: '3', name: 'Evening Crash Course', code: 'CRASH-EV', students: 12, avgScore: 68, completion: 90, trend: 'down' },
        ]);

        setActivities([
            { id: '1', type: 'exam_attempt', title: 'Student Attempted Quiz', description: 'Aryan completed Physics Mock with 92%', time: '5 min ago', icon: 'score' },
            { id: '2', type: 'evaluation_completed', title: 'Evaluation Finished', description: 'You graded 15 papers for Batch A', time: '45 min ago', icon: 'edit' },
            { id: '3', type: 'exam_created', title: 'New Exam Scheduled', description: 'Chemistry Weekly added for next Monday', time: '2 hours ago', icon: 'exam' },
            { id: '4', type: 'batch_assigned', title: 'New Batch Assigned', description: 'Assigned to Evening Crash Course', time: 'Yesterday', icon: 'batch' },
        ]);

        setUpcomingExams([
            { id: '1', title: 'Physics Semi-Major', batch: 'JEE Advanced 2026', date: 'Tomorrow, 09:00 AM', students: 30, duration: '3 hours' },
            { id: '2', title: 'Biology Quiz', batch: 'NEET Foundation XI', date: 'Feb 1, 02:30 PM', students: 42, duration: '45 mins' },
            { id: '3', title: 'Chemistry Rapid Fire', batch: 'Evening Crash', date: 'Feb 3, 05:00 PM', students: 12, duration: '1 hour' },
        ]);

        setLoading(false);
    };

    const getActivityIcon = (icon: string) => {
        switch (icon) {
            case 'score': return <Award className="w-4 h-4" />;
            case 'user': return <Users className="w-4 h-4" />;
            case 'exam': return <FileText className="w-4 h-4" />;
            case 'batch': return <GraduationCap className="w-4 h-4" />;
            case 'edit': return <ClipboardCheck className="w-4 h-4" />;
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
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">Loading teacher dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
            {/* Header */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            Namaste, Prof. {user?.last_name || user?.first_name || 'Teacher'}! 🖋️
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                            Your academic overview at <span className="text-blue-600 font-bold">{centerName}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Year</p>
                            <p className="text-sm font-bold text-slate-700">2023-24</p>
                        </div>
                        <button
                            onClick={() => navigate('/teacher/exams/create')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                        >
                            <Zap className="w-4 h-4" /> Create Exam
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'My Students', value: stats.total_students, icon: Users, color: 'blue', trend: '+5 new' },
                    { label: 'Assigned Batches', value: stats.assigned_batches, icon: GraduationCap, color: 'indigo', trend: 'Active' },
                    { label: 'Exams Conducted', value: stats.exams_conducted, icon: FileText, color: 'emerald', trend: '+3 this mo' },
                    { label: 'Avg Batch Score', value: `${stats.average_batch_score}%`, icon: Target, color: 'violet', trend: '+1.2%' },
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
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-blue-200"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Play className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Live</span>
                        </div>
                        <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Active Exams</p>
                        <p className="text-4xl font-black">{stats.active_exams}</p>
                        <p className="text-blue-200 text-sm mt-2">Students currently taking your assessments</p>
                    </div>
                </motion.div>

                {/* Pending Evaluation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-amber-200"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <Clock className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">To-Do</span>
                        </div>
                        <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mb-1">Pending Evaluations</p>
                        <p className="text-4xl font-black">{stats.pending_evaluations}</p>
                        <p className="text-amber-200 text-sm mt-2">Subjective attempts awaiting your review</p>
                    </div>
                </motion.div>

                {/* Attendance Rate */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-emerald-200"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <ClipboardCheck className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">Good</span>
                        </div>
                        <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Batch Attendance</p>
                        <p className="text-4xl font-black">94.2%</p>
                        <p className="text-emerald-200 text-sm mt-2">Average attendance across your batches</p>
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
                                <h3 className="text-base font-black text-slate-900">My Batches Progress</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syllabus & Performance</p>
                            </div>
                            <button
                                onClick={() => navigate('/teacher/batches')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                Detailed View <ChevronRight className="w-3 h-3" />
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
                                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Layers className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">{batch.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{batch.code} • {batch.students} students</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-black text-slate-900">{batch.avgScore}%</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Class Avg</p>
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
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">{batch.completion}% syllabus</span>
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
                                <h3 className="text-base font-black text-slate-900">Activity Feed</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time alerts</p>
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
                                                activity.icon === 'edit' ? 'bg-indigo-100 text-indigo-600' :
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

            {/* Upcoming Exams & Teaching Actions */}
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
                                <h3 className="text-base font-black text-slate-900">Your Exam Schedule</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upcoming assessments</p>
                            </div>
                            <button
                                onClick={() => navigate('/teacher/exams')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                Manage All <ChevronRight className="w-3 h-3" />
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
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">{exam.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-medium text-slate-500">{exam.batch}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span className="text-xs font-bold text-blue-600">{exam.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-700">{exam.students} students</p>
                                            <p className="text-xs text-slate-400">{exam.duration}</p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/teacher/exams/${exam.id}`)}
                                            className="p-2 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"
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
                    <h3 className="text-base font-black text-slate-900 mb-2">Teacher Toolkit</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Fastest Access</p>
                    <div className="space-y-3">
                        {[
                            { label: 'Create New Exam', desc: 'Step-by-step wizard', icon: FileText, color: 'blue', path: '/teacher/exams/create' },
                            { label: 'Evaluate Students', desc: 'Grading dashboard', icon: Award, color: 'emerald', path: '/teacher/evaluation' },
                            { label: 'Mark Attendance', desc: 'Daily batch checks', icon: ClipboardCheck, color: 'violet', path: '/teacher/attendance' },
                            { label: 'Class Insights', desc: 'Analytics per batch', icon: BarChart3, color: 'amber', path: '/teacher/analytics' },
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
