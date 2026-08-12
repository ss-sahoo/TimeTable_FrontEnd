import React, { useState, useEffect } from 'react';
import {
    Activity,
    Clock,
    User,
    BookOpen,
    Search,
    ArrowRight,
    Shield,
    LogIn
} from 'lucide-react';
import { api } from '../hooks/useApi';

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

interface LogEntry {
    id: string | number;
    type: 'exam' | 'user' | 'violation' | 'login';
    title: string;
    description: string;
    timestamp: string;
    user: string;
    status?: 'success' | 'warning' | 'error' | 'info';
    metadata?: any;
}

const ActivityLogs: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [filter, searchTerm]);

    const fetchLogs = async () => {
        try {
            setLoading(true);

            const response = await api.get('/auth/activity-logs/', {
                params: {
                    log_type: filter === 'all' ? undefined : filter, // Send undefined if 'all'
                    search: searchTerm
                }
            });

            const mappedLogs: LogEntry[] = response.data.results.map((log: any) => ({
                id: log.id,
                type: log.log_type,
                title: log.title,
                description: log.description,
                timestamp: log.timestamp,
                user: log.user_name || log.user_email || 'System',
                status: log.status,
                metadata: log.metadata
            }));

            setLogs(mappedLogs);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesFilter = filter === 'all' || log.type === filter;
        const matchesSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'exam': return <BookOpen className="w-4 h-4" />;
            case 'user': return <User className="w-4 h-4" />;
            case 'violation': return <Shield className="w-4 h-4" />;
            case 'login': return <LogIn className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'success': return 'bg-green-100 text-green-700 border-green-200';
            case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'error': return 'bg-red-100 text-red-700 border-red-200';
            case 'info': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="w-6 h-6 text-indigo-600" />
                            Institute Activity Logs
                        </h1>
                        <p className="text-slate-600 text-sm mt-1">Real-time audit trail of all activities within your institute.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                            />
                        </div>
                        <button
                            onClick={fetchLogs}
                            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                            title="Refresh Logs"
                        >
                            <Clock className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {['all', 'exam', 'user', 'violation', 'login'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${filter === t
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                                }`}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Logs List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-slate-500 text-sm">Fetching latest activities...</p>
                        </div>
                    ) : filteredLogs.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {filteredLogs.map((log) => (
                                <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors group">
                                    <div className="flex gap-4">
                                        <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${getStatusColor(log.status)}`}>
                                            {getIcon(log.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h3 className="text-sm font-bold text-slate-900 truncate">{log.title}</h3>
                                                <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {formatDate(log.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2 mb-2">{log.description}</p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                                                        <User className="w-3 h-3 text-slate-500" />
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-medium">{log.user}</span>
                                                </div>

                                                <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">
                                                    View Details
                                                    <ArrowRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Activity className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-slate-900 font-bold">No activities found</h3>
                            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="mt-6 flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                    <span>Showing {filteredLogs.length} recent activities</span>
                    <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        Live Feed Active
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ActivityLogs;
