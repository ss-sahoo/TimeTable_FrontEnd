import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import {
    LayoutGrid,
    Building2,
    Users,
    FileText,
    Layers,
    Calendar,
    Bell,
    HelpCircle,
    Search,
    ChevronDown,
    Zap,
    LogOut,
    Settings,
    Receipt,
    ChevronLeft,
    ChevronRight,
    X,
    Activity,
    User,
} from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { api } from "../../hooks/useApi";

interface SuperAdminLayoutProps {
    children: React.ReactNode;
}

const platformNavItems = [
    { id: "overview", label: "Overview", icon: LayoutGrid, href: "/superadmin/dashboard" },
    { id: "users", label: "User Management", icon: Users, href: "/superadmin/users" },
];

const operationsNavItems = [
    { id: "institutes", label: "Institutes & Centers", icon: Building2, href: "/superadmin/institutes", badge: true },
    { id: "exams", label: "Exams", icon: FileText, href: "/superadmin/exams" },
    { id: "batches", label: "Batches", icon: Layers, href: "/superadmin/batches" },
    { id: "timetable", label: "Timetable", icon: Calendar, href: "/superadmin/timetable" },
    { id: "billing", label: "Activity & Logs", icon: Activity, href: "/superadmin/billing" },
];

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
    const { user, isAuthenticated, loading: authLoading, logout } = useAuthContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate("/login", { replace: true });
        }
        if (!authLoading && user?.role !== "super_admin" && user?.role !== "SUPER_ADMIN") {
            navigate("/dashboard", { replace: true });
        }
    }, [user, isAuthenticated, authLoading, navigate]);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    // Search functionality
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            performSearch(searchQuery);
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    }, [searchQuery]);

    const performSearch = async (query: string) => {
        const lowerQuery = query.toLowerCase();
        const results: any[] = [];

        const allNavItems = [...platformNavItems, ...operationsNavItems];
        allNavItems.forEach((item) => {
            if (item.label.toLowerCase().includes(lowerQuery)) {
                results.push({
                    type: "navigation",
                    id: item.id,
                    title: item.label,
                    icon: item.icon,
                    action: () => navigate(item.href),
                });
            }
        });

        const instituteId = user?.institute_id || user?.institute?.id;
        if (instituteId) {
            try {
                const examsRes = await api.get(`/exams/exams/?institute_id=${instituteId}`);
                const exams = examsRes.data?.results || examsRes.data || [];

                exams.forEach((exam: any) => {
                    if (exam.title?.toLowerCase().includes(lowerQuery)) {
                        results.push({
                            type: "exam",
                            id: exam.id,
                            title: exam.title,
                            subtitle: `${exam.total_questions || 0} questions`,
                            icon: FileText,
                            action: () => {
                                navigate(`/superadmin/exams/${exam.id}`);
                                setSearchQuery("");
                                setShowSearchResults(false);
                            },
                        });
                    }
                });
            } catch (error) {
                console.error("Error searching exams:", error);
            }
        }

        if ("settings".includes(lowerQuery)) {
            results.push({
                type: "action",
                id: "settings",
                title: "Settings",
                subtitle: "Manage system settings",
                icon: Settings,
                action: () => navigate("/superadmin/settings"),
            });
        }

        if ("logout".includes(lowerQuery) || "sign out".includes(lowerQuery)) {
            results.push({
                type: "action",
                id: "logout",
                title: "Sign Out",
                subtitle: "Log out of your account",
                icon: LogOut,
                action: handleLogout,
            });
        }

        setSearchResults(results.slice(0, 8));
    };

    const handleSearchSelect = (result: any) => {
        result.action();
        setSearchQuery("");
        setShowSearchResults(false);
    };

    const isActive = (href: string) => {
        if (href === "/superadmin/dashboard") {
            return location.pathname === href;
        }
        return location.pathname.startsWith(href);
    };

    const isStandalonePage = location.pathname.includes('/exams/create') ||
        location.pathname.includes('/edit') ||
        location.pathname.includes('/patterns/create');

    if (authLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 text-slate-600 font-sans antialiased h-screen flex overflow-hidden">
            {/* SIDEBAR */}
            {!isStandalonePage && (
                <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-200 flex flex-col z-30 transition-all duration-300`}>
                    <div className="h-16 flex items-center px-4 border-b border-slate-100">
                        {!sidebarCollapsed ? (
                            <div className="flex items-center gap-3 w-full hover:bg-slate-50 cursor-pointer transition-colors py-2 px-2 rounded-md -mx-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg flex items-center justify-center text-white shadow-sm">
                                    <Zap className="w-4 h-4" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h1 className="font-bold text-sm text-slate-900 leading-tight">
                                        {user?.institute?.name || user?.institute_name || "DashoExams"}
                                    </h1>
                                    <p className="text-[10px] text-slate-500 font-medium tracking-wide">ENTERPRISE PLAN</p>
                                </div>
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg flex items-center justify-center text-white shadow-sm mx-auto">
                                <Zap className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-2 px-3 mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Platform</span>
                            </div>
                        )}
                        {platformNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.id}
                                    to={item.href}
                                    className={`nav-item w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm font-medium rounded-md transition-all group relative ${active
                                        ? "bg-violet-50 text-violet-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    title={sidebarCollapsed ? item.label : undefined}
                                >
                                    {active && !sidebarCollapsed && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-violet-600 rounded-r" />
                                    )}
                                    <Icon className={`w-[18px] h-[18px] ${active ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    {!sidebarCollapsed && item.label}
                                </Link>
                            );
                        })}

                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-2 px-3 mb-2 mt-6">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operations</span>
                            </div>
                        )}
                        {sidebarCollapsed && <div className="h-4" />}
                        {operationsNavItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.id}
                                    to={item.href}
                                    className={`nav-item w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 text-sm font-medium rounded-md transition-all group relative ${active
                                        ? "bg-violet-50 text-violet-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                    title={sidebarCollapsed ? item.label : undefined}
                                >
                                    {active && !sidebarCollapsed && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[70%] bg-violet-600 rounded-r" />
                                    )}
                                    <Icon className={`w-[18px] h-[18px] ${active ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                                    {!sidebarCollapsed && (
                                        <>
                                            {item.label}
                                            
                                        </>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-t border-slate-100 bg-slate-50/50">
                        {!sidebarCollapsed ? (
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
                                        {user?.first_name?.[0] || "S"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                            {user?.first_name || "Super"} {user?.last_name || "Admin"}
                                        </p>
                                        <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                                    </div>
                                    <Link to="/superadmin/settings" className="text-slate-400 hover:text-slate-600">
                                        <Settings className="w-[18px] h-[18px]" />
                                    </Link>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleLogout}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                    <button
                                        onClick={() => setSidebarCollapsed(true)}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                        title="Collapse sidebar"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 flex flex-col items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">
                                    {user?.first_name?.[0] || "S"}
                                </div>
                                <Link
                                    to="/superadmin/settings"
                                    className="text-slate-400 hover:text-slate-600"
                                    title="Settings"
                                >
                                    <Settings className="w-[18px] h-[18px]" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-red-600 hover:text-red-700"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                                <div className="w-full h-px bg-slate-200 my-1"></div>
                                <button
                                    onClick={() => setSidebarCollapsed(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                                    title="Expand sidebar"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            )}

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* HEADER */}
                {!isStandalonePage && (
                    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 h-16 sticky top-0 z-20 flex justify-between items-center px-6">
                        <div className="flex-1 max-w-md" ref={searchRef}>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery && setShowSearchResults(true)}
                                    className="block w-full pl-10 pr-12 py-2 bg-slate-100 border-none rounded-lg text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:shadow-sm transition-all"
                                    placeholder="Search exams, navigation, or settings..."
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            setShowSearchResults(false);
                                        }}
                                        className="absolute right-12 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 z-10"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 z-10">
                                    <kbd className="hidden sm:inline-flex items-center border border-slate-200 rounded px-2 text-[10px] font-sans font-medium text-slate-400 bg-white">
                                        ⌘K
                                    </kbd>
                                </div>

                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
                                        <div className="py-2">
                                            {searchResults.map((result, index) => {
                                                const Icon = result.icon;
                                                return (
                                                    <button
                                                        key={`${result.type}-${result.id}-${index}`}
                                                        onClick={() => handleSearchSelect(result)}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                                                    >
                                                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${result.type === "navigation" ? "bg-violet-50" :
                                                            result.type === "exam" ? "bg-blue-50" :
                                                                "bg-slate-50"
                                                            }`}>
                                                            <Icon className={`w-4 h-4 ${result.type === "navigation" ? "text-violet-600" :
                                                                result.type === "exam" ? "text-blue-600" :
                                                                    "text-slate-600"
                                                                }`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                                                            {result.subtitle && (
                                                                <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 uppercase font-medium">
                                                            {result.type}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pl-4">
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                            </button>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                <HelpCircle className="w-5 h-5" />
                            </button>
                            <div className="h-6 w-px bg-slate-200 mx-1"></div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs font-medium text-slate-600">System Operational</span>
                            </div>
                        </div>
                    </header>
                )}

                {/* SCROLLABLE CANVAS */}
                <div className={`flex-1 overflow-y-auto bg-slate-50 ${isStandalonePage ? 'p-0' : 'p-6 lg:p-8'}`}>
                    <div className={`${isStandalonePage ? 'max-w-none' : 'max-w-[1600px] mx-auto'}`}>
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
