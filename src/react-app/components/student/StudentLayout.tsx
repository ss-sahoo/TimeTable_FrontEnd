import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import {
    Home,
    FileText,
    BarChart3,
    LogOut,
    Zap,
    Bell,
    Menu,
    X,
    ChevronLeft,
    BookOpen,
} from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";

interface StudentLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    { id: "home", label: "Dashboard", icon: Home, href: "/student-dashboard" },
    { id: "exams", label: "My Exams", icon: BookOpen, href: "/student-exams" },
    { id: "results", label: "Results", icon: FileText, href: "/results" },
    { id: "analytics", label: "Analytics", icon: BarChart3, href: "/student-analytics" },
];

export default function StudentLayout({ children }: StudentLayoutProps) {
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
        if (href === "/student-dashboard") {
            return location.pathname === href;
        }
        return location.pathname.startsWith(href);
    };

    const getPageTitle = () => {
        if (location.pathname === "/student-dashboard") return "Dashboard";
        if (location.pathname.startsWith("/student-exams")) return "My Exams";
        if (location.pathname.startsWith("/results")) return "Exam Results";
        if (location.pathname.startsWith("/student-analytics")) return "Performance Analytics";
        return "Student Dashboard";
    };

    return (
        <div className="bg-slate-50 text-slate-600 font-sans antialiased h-screen flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 ${sidebarCollapsed ? "w-20" : "w-72"}`}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-4 border-b border-slate-100">
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0">
                            <img
                                src="/examlogo.png"
                                alt="Exam Logo"
                                className="w-8 h-8 object-contain rounded-md"
                            />                       </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <h1 className="font-bold text-sm text-slate-900 leading-tight truncate">
                                    {user?.institute?.name || user?.institute_name || "DashoExams"}
                                </h1>
                                <p className="text-[10px] text-slate-500 font-medium tracking-wide whitespace-nowrap uppercase">Student Portal</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2 px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Main Menu
                        </div>
                    )}
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.id}
                                to={item.href}
                                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all group relative ${sidebarCollapsed ? "justify-center" : ""} ${active
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
                                    {user?.first_name?.[0] || user?.full_name?.[0] || "S"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                        {user?.full_name || user?.get_full_name || user?.email}
                                    </p>
                                    <p className="text-[10px] text-slate-500 truncate uppercase">Student</p>
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

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Header */}
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
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-900">{user?.full_name || user?.get_full_name || user?.email}</p>
                                <p className="text-xs text-slate-500 uppercase">Student</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white shadow-sm">
                                {user?.first_name?.[0] || user?.full_name?.[0] || "S"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-8">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white shadow-sm">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-slate-900 text-sm">Student Portal</span>
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
                                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${active
                                            ? "bg-blue-50 text-blue-700 font-semibold"
                                            : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        <Icon className={`w-[18px] h-[18px] ${active ? "text-blue-600" : "text-slate-400"}`} />
                                        <span className="flex-1">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
                                    {user?.first_name?.[0] || user?.full_name?.[0] || "S"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                        {user?.full_name || user?.get_full_name || user?.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-100"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
