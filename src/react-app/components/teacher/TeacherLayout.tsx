import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import {
    Home,
    FileText,
    X,
    Menu,
    ChevronLeft,
    ChevronDown,
    Zap,
    LogOut,
    Users as UsersIcon,
    Settings as SettingsIcon,
    Layers,
    Award,
    ClipboardCheck,
    BarChart3,
} from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";

interface TeacherLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { id: "home", label: "Dashboard", icon: Home, href: "/teacher/dashboard" },
    { id: "exams", label: "Exams", icon: FileText, href: "/teacher/exams" },
    { id: "evaluation", label: "Evaluation", icon: Award, href: "/teacher/evaluation" },
    { id: "batches", label: "My Batches", icon: Layers, href: "/teacher/batches" },
    { id: "attendance", label: "Attendance", icon: ClipboardCheck, href: "/teacher/attendance" },
    { id: "analytics", label: "Insights", icon: BarChart3, href: "/teacher/analytics" },
];

export default function TeacherLayout({ children }: TeacherLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, logout } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (href: string) => {
        if (href === "/teacher/dashboard") {
            return location.pathname === href;
        }
        return location.pathname.startsWith(href);
    };

    const getPageTitle = () => {
        if (location.pathname === "/teacher/dashboard") return "Dashboard";
        if (location.pathname.startsWith("/teacher/exams")) return "Exam Management";
        if (location.pathname.startsWith("/teacher/evaluation")) return "Grading & Evaluation";
        if (location.pathname.startsWith("/teacher/batches")) return "My Batches";
        if (location.pathname.startsWith("/teacher/attendance")) return "Attendance Tracking";
        if (location.pathname.startsWith("/teacher/analytics")) return "Performance Insights";
        if (location.pathname.startsWith("/teacher/settings")) return "Settings";
        return "Teacher Portal";
    };

    const isStandalonePage = location.pathname.includes('/exams/create') ||
        location.pathname.includes('/edit');

    return (
        <div className="bg-slate-50 text-slate-600 font-sans antialiased h-screen flex overflow-hidden">
            {/* Sidebar */}
            {!isStandalonePage && (
                <aside
                    className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 ${sidebarCollapsed ? "w-20" : "w-72"
                        }`}
                >
                    {/* Logo / Context Switcher */}
                    <div className="h-16 flex items-center px-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3 w-full">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0">
                                <Zap className="w-4 h-4" />
                            </div>
                            {!sidebarCollapsed && (
                                <>
                                    <div className="flex-1 min-w-0">
                                        <h1 className="font-bold text-sm text-slate-900 leading-tight truncate">
                                            {user?.institute?.name || user?.institute_name || "DashoExams"}
                                        </h1>
                                        <p className="text-[10px] text-slate-500 font-medium tracking-wide whitespace-nowrap uppercase">Teacher Portal</p>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-2 px-3 mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Menu</span>
                            </div>
                        )}
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.id}
                                    to={item.href}
                                    className={`nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all group relative ${sidebarCollapsed ? "justify-center" : ""
                                        } ${active
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    title={sidebarCollapsed ? item.label : undefined}
                                >
                                    {active && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-blue-600 rounded-r" />
                                    )}
                                    <Icon className={`w-[18px] h-[18px] ${active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        {!sidebarCollapsed ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
                                        {user?.first_name?.[0] || user?.full_name?.[0] || "T"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                            {user?.full_name || user?.get_full_name || user?.email}
                                        </p>
                                        <p className="text-[10px] text-slate-500 truncate">Teacher</p>
                                    </div>
                                    <button
                                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <ChevronLeft className="w-[18px] h-[18px]" />
                                    </button>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                    className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 rotate-180" />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Top Header */}
                {!isStandalonePage && (
                    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 h-16 sticky top-0 z-20 flex justify-between items-center px-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <Menu className="w-5 h-5 text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-xl font-semibold text-slate-900">
                                    {getPageTitle()}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-900">{user?.full_name || user?.get_full_name || user?.email}</p>
                                <p className="text-xs text-slate-500">Teacher Account</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm">
                                {user?.first_name?.[0] || user?.full_name?.[0] || "T"}
                            </div>
                        </div>
                    </header>
                )}

                {/* Content Area */}
                <div className={`flex-1 overflow-y-auto bg-slate-50 ${isStandalonePage ? 'p-0' : 'p-6 lg:p-8'}`}>
                    <div className={`${isStandalonePage ? 'max-w-none' : 'max-w-[1600px] mx-auto'}`}>
                        {children}
                    </div>
                </div>
            </main>

            {/* Mobile Sidebar */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between p-5 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white shadow-sm">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm">DashoExams</span>
                                </div>
                                <button onClick={() => setMobileMenuOpen(false)}>
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>
                            </div>
                            <nav className="flex-1 p-4 space-y-1">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.id}
                                            to={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`nav-item w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all group relative ${active
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                }`}
                                        >
                                            {active && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-blue-600 rounded-r" />
                                            )}
                                            <Icon className={`w-[18px] h-[18px] ${active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                            <span className="flex-1 text-left">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            {/* Mobile Logout Button */}
                            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
                                        {user?.first_name?.[0] || user?.full_name?.[0] || "T"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                            {user?.full_name || user?.get_full_name || user?.email}
                                        </p>
                                        <p className="text-[10px] text-slate-500 truncate">Teacher</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
