import React, { useEffect, useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';
import { useTimetableCenter } from '../contexts/TimetableCenterContext';
import { Building2, Landmark, AlertCircle, CalendarDays, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const TimetableDashboard: React.FC = () => {
    const { user } = useAuthContext();
    const { selectedCenterName, centers } = useTimetableCenter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/auth/profile/');
                setProfile(response.data);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const instituteName = profile?.institute?.name || profile?.institute_name || 'N/A';
    const effectiveCenterName = selectedCenterName || profile?.center?.name || profile?.center_name || null;
    const isStudent = user?.role?.toUpperCase() === 'STUDENT';
    const isTeacher = user?.role?.toUpperCase() === 'TEACHER';
    const isReadOnly = isStudent || isTeacher;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {isStudent ? 'My Dashboard' : 'Timetable Dashboard'}
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Institute Info */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Institute Details</h2>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-gray-400">Name</p>
                            <p className="font-medium text-slate-700 dark:text-gray-200">{instituteName}</p>
                        </div>
                    </div>
                </div>

                {/* Center Info */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Center Details</h2>
                    </div>
                    <div className="space-y-3">
                        {effectiveCenterName ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">
                                        {isReadOnly ? 'Your Center' : 'Active Center'}
                                    </p>
                                    <p className="font-bold text-lg text-slate-800 dark:text-white">{effectiveCenterName}</p>
                                </div>
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-full">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-full mb-3">
                                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <p className="text-slate-600 dark:text-gray-400 mb-4 font-medium">
                                    {isReadOnly
                                        ? 'You are not currently assigned to any center. Please contact your admin.'
                                        : 'Please select a center from the header to manage timetables.'}
                                </p>
                                {user?.role?.toUpperCase() === 'SUPER_ADMIN' && centers.length === 0 && (
                                    <Link
                                        to="/centers"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm transition-all"
                                    >
                                        Create Your First Center
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {effectiveCenterName && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/timetable-interface"
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-500/30"
                        >
                            <CalendarDays className="w-5 h-5" />
                            {isReadOnly ? 'View Timetable' : 'Manage Time Table'}
                        </Link>
                        <Link
                            to="/batches"
                            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-semibold shadow-sm"
                        >
                            <Users className="w-5 h-5" />
                            {isStudent ? 'My Batches' : isTeacher ? 'View Batches' : 'Manage Batches'}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimetableDashboard;
