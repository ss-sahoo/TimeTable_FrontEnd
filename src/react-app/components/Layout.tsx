import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Bell,
  Search,
  User,
  ChevronDown,
  Zap,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Command,
  Moon,
  Sun,
  HelpCircle,
  Shield,
  Home,
  GraduationCap,
  CalendarDays,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useOnboardingTour } from '../contexts/OnboardingTourContext';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { user, logout } = useAuthContext();
  const { theme, setTheme, actualTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(actualTheme === 'dark' ? 'light' : 'dark');
  };
  const {
    ctaLabel,
    ctaTone,
    isActive: tourActive,
    hasCompleted: tourCompleted,
    isPaused: tourPaused,
    startTour,
    resumeTour,
    restartTour,
  } = useOnboardingTour();
  const location = useLocation();
  const navigate = useNavigate();

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getNavigation = (): NavigationItem[] => {
    const baseNavigation: NavigationItem[] = [
      { name: 'Home', href: '/dashboard', icon: Home },
    ];

    if (user?.role === 'student') {
      baseNavigation.push(
        { name: 'My Exams', href: '/student-exams', icon: BookOpen },
        { name: 'Analytics', href: '/student-analytics', icon: BarChart3 },
      );
    } else {
      baseNavigation.push(
        { name: 'Exam', href: '/exam', icon: BookOpen },
        { name: 'Batches', href: '/batches', icon: GraduationCap },
        { name: 'Timetable', href: '/timetable', icon: CalendarDays },
      );
    }

    return baseNavigation;
  };

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const handleOnboardingClick = () => {
    if (tourActive) return;
    if (tourCompleted) {
      restartTour();
      return;
    }
    if (tourPaused) {
      resumeTour();
      return;
    }
    startTour();
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Mock notifications
  const notifications = [
    { id: 1, title: 'New exam submitted', message: 'John Doe completed Physics Exam', time: '5m ago', unread: true },
    { id: 2, title: 'Results published', message: 'Math Final results are ready', time: '1h ago', unread: true },
    { id: 3, title: 'System update', message: 'New features available', time: '2h ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-900">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-400/10 dark:bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-400/10 dark:bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-80 lg:hidden"
            >
              <div className="flex flex-col h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 dark:border-gray-800/50">
                {/* Mobile Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200/50 dark:border-gray-800/50">
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
                    >
                      <Zap className="w-6 h-6 text-white" />
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
                    </motion.div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">DashoExams</span>
                      <p className="text-xs text-slate-500 dark:text-gray-400">Exam Management</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-all"
                  >
                    <X className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                  </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                  <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Menu</p>
                  {getNavigation().map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all relative overflow-hidden ${
                            active
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                              : 'text-slate-700 dark:text-gray-300 hover:bg-slate-100/80 dark:hover:bg-gray-800/80'
                          }`}
                        >
                          {active && (
                            <motion.div
                              layoutId="mobileActiveGlow"
                              className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-violet-400/20"
                            />
                          )}
                          <Icon className={`w-5 h-5 relative z-10 ${!active && 'group-hover:scale-110 transition-transform'}`} />
                          <span className="relative z-10">{item.name}</span>
                          {item.badge && (
                            <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded-full relative z-10 ${
                              active ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile User Info */}
                <div className="p-4 border-t border-slate-200/50 dark:border-gray-800/50 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-slate-200/50 dark:border-gray-700/50">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {user?.get_full_name || user?.email}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-gray-400 truncate capitalize flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        {user?.role?.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-200/50 dark:border-red-800/50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* Desktop sidebar */}
      <motion.div 
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col z-30"
        animate={{ width: sidebarCollapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="flex flex-col flex-grow bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-gray-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/20">
          {/* Logo */}
          <div className="flex items-center justify-between h-[72px] px-5 border-b border-slate-200/50 dark:border-gray-800/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0 cursor-pointer"
              >
                <Zap className="w-6 h-6 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/0 to-white/20" />
              </motion.div>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden"
                  >
                    <span className="font-bold text-slate-900 dark:text-white text-lg whitespace-nowrap tracking-tight">DashoExams</span>
                    <p className="text-xs text-slate-500 dark:text-gray-400 whitespace-nowrap">Exam Management</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
            {!sidebarCollapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Menu</p>
            )}
            {getNavigation().map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all relative overflow-hidden ${
                    sidebarCollapsed ? 'justify-center' : ''
                  } ${
                    active
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100/80 dark:hover:bg-gray-800/80 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  {active && (
                    <>
                      <motion.div
                        layoutId="desktopActiveIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-violet-400/10" />
                    </>
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 ${!active && 'group-hover:scale-110 transition-transform'}`} />
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="whitespace-nowrap overflow-hidden relative z-10"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!sidebarCollapsed && item.badge && (
                    <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded-full relative z-10 ${
                      active ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>


          {/* Quick Actions */}
          {!sidebarCollapsed && (
            <div className="px-4 py-3 border-t border-slate-200/50 dark:border-gray-800/50">
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Quick Actions</p>
              <button
                onClick={handleOnboardingClick}
                disabled={tourActive}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-gray-400 hover:bg-slate-100/80 dark:hover:bg-gray-800/80 transition-all disabled:opacity-50"
              >
                <HelpCircle className="w-5 h-5" />
                <span>Help & Tour</span>
              </button>
            </div>
          )}

          {/* Collapse Toggle */}
          <div className="p-4 border-t border-slate-200/50 dark:border-gray-800/50">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-gray-400 hover:bg-slate-100/80 dark:hover:bg-gray-800/80 transition-all group"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>


          {/* User Info */}
          <div className="p-4 border-t border-slate-200/50 dark:border-gray-800/50 bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-gray-800/30 dark:to-gray-900/30">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
              </div>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 min-w-0 overflow-hidden"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user?.get_full_name || user?.email}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 truncate capitalize flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>


      {/* Main content */}
      <motion.div 
        className="lg:transition-all lg:duration-300"
        animate={{ paddingLeft: sidebarCollapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ paddingLeft: 0 }}
      >
        <div className="hidden lg:block" style={{ paddingLeft: sidebarCollapsed ? 80 : 260 }} />
        
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-gray-800/50 shadow-sm shadow-slate-200/20 dark:shadow-black/10">
          <div className="flex items-center justify-between px-4 lg:px-6 h-[72px]">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl bg-slate-100/80 dark:bg-gray-800/80 hover:bg-slate-200/80 dark:hover:bg-gray-700/80 transition-all"
              >
                <Menu className="w-5 h-5 text-slate-700 dark:text-gray-300" />
              </motion.button>
              
              {/* Search bar */}
              <div className="hidden sm:block">
                <motion.div 
                  className="relative group"
                  animate={{ width: searchFocused ? 320 : 280 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className={`h-4 w-4 transition-colors ${searchFocused ? 'text-blue-500' : 'text-slate-400 dark:text-gray-500'}`} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search exams, patterns..."
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="block w-full pl-11 pr-16 py-3 border border-slate-200/80 dark:border-gray-700/80 rounded-2xl text-sm bg-slate-50/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400 dark:text-gray-500 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-600 shadow-sm">
                      <Command className="w-3 h-3" />K
                    </kbd>
                  </div>
                </motion.div>
              </div>
            </div>


            <div className="flex items-center gap-2 sm:gap-3">
              {/* Onboarding CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOnboardingClick}
                disabled={tourActive}
                className={`hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  ctaTone === 'success'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                    : ctaTone === 'outline'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
                    : 'bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-lg shadow-blue-500/25'
                } disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden md:inline">{ctaLabel}</span>
                {tourActive && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                    Live
                  </span>
                )}
              </motion.button>

              {/* Theme Toggle */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-gray-800/80 hover:bg-slate-200/80 dark:hover:bg-gray-700/80 transition-all"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </motion.button>


              {/* Notifications */}
              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 rounded-xl bg-slate-100/80 dark:bg-gray-800/80 hover:bg-slate-200/80 dark:hover:bg-gray-700/80 transition-all"
                >
                  <Bell className="w-5 h-5 text-slate-600 dark:text-gray-400" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-white dark:ring-gray-900">
                      {unreadCount}
                    </span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setNotificationsOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-gray-700/80 overflow-hidden z-50"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-gray-800 dark:to-gray-800/50">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
                              {unreadCount} new
                            </span>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 border-b border-slate-100 dark:border-gray-700/50 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                                notification.unread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notification.unread ? 'bg-blue-500' : 'bg-slate-300 dark:bg-gray-600'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-white">{notification.title}</p>
                                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">{notification.message}</p>
                                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">{notification.time}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="px-4 py-3 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-700">
                          <button className="w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                            View all notifications
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>


              {/* User menu */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-gray-800/80 hover:bg-slate-200/80 dark:hover:bg-gray-700/80 transition-all"
                >
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.get_full_name || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 capitalize">
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronDown className={`hidden sm:block w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-gray-700/80 overflow-hidden z-50"
                      >
                        <div className="px-4 py-4 border-b border-slate-100 dark:border-gray-700 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-gray-800 dark:to-gray-800/50">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {user?.get_full_name || user?.email}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-gray-400 truncate">
                                {user?.email}
                              </p>
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full capitalize">
                                <Shield className="w-3 h-3" />
                                {user?.role?.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="py-2">
                          <Link
                            to="/institute-profile"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                              <User className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium">Institute Profile</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400">Manage your institute</p>
                            </div>
                          </Link>
                          <Link
                            to="/settings"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                              <Settings className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium">Settings</p>
                              <p className="text-xs text-slate-500 dark:text-gray-400">Preferences & security</p>
                            </div>
                          </Link>
                        </div>
                        <div className="border-t border-slate-100 dark:border-gray-700 p-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                              <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">Sign out</p>
                              <p className="text-xs text-red-500/70 dark:text-red-400/70">End your session</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>


        {/* Page content */}
        <main className="min-h-[calc(100vh-4.5rem)] relative">
          {children}
        </main>

        {/* Footer */}
        <footer className="relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-t border-slate-200/50 dark:border-gray-800/50 py-4">
          <div className="px-4 lg:px-6 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-gray-400">
              © 2024 DashoExams. All rights reserved.
            </p>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              Powered by{' '}
              <a 
                href="https://diracai.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent hover:from-blue-500 hover:to-violet-500 transition-all"
              >
                DiracAI
              </a>
            </p>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
