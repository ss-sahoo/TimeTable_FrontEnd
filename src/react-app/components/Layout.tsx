import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { 
  LayoutDashboard, 
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
  GraduationCap,
  Zap,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavigation = (): NavigationItem[] => {
    const baseNavigation = [
      { name: 'Institute Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ];

    // Add role-specific navigation
    if (user?.role === 'student') {
      // Students see Dashboard, Exams, Analytics, and Settings
      baseNavigation.push(
        { name: 'My Exams', href: '/student-exams', icon: BookOpen },
        { name: 'Analytics', href: '/student-analytics', icon: BarChart3 },
        { name: 'Settings', href: '/settings', icon: Settings }
      );
    } else {
      // Teachers and admins see full navigation
      baseNavigation.push(
        { name: 'Exams', href: '/exams', icon: BookOpen },
        { name: 'Results', href: '/results', icon: FileText },
        { name: 'Patterns', href: '/patterns', icon: Zap }
      );

      if (user?.role === 'super_admin' || user?.role === 'institute_admin') {
        baseNavigation.push(
          { name: 'Users', href: '/users', icon: Users }
        );
      }

      if (user?.role === 'super_admin' || user?.role === 'institute_admin' || user?.role === 'exam_admin') {
        baseNavigation.push({ name: 'Analytics', href: '/analytics', icon: BarChart3 });
      }

      baseNavigation.push({ name: 'Settings', href: '/settings', icon: Settings });
    }

    // Note: Advanced components (Predictive Analytics, AI Proctoring, etc.) 
    // are available within exam-specific pages, not as separate menu items

    return baseNavigation;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-2xl">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-blue-700 dark:border-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-white text-lg">ExamFlow</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Mobile Navigation */}
          <nav className="p-4 space-y-1">
            {getNavigation().map((item) => {
              const Icon = item.icon;
              
              // Handle disabled/separator items
              if (item.disabled) {
                return (
                  <div key={item.name} className="px-4 py-2">
                    <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                      <Icon className="w-4 h-4" />
                      {item.name.replace('--- ', '').replace(' ---', '')}
                    </div>
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Mobile User Info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-gray-100 truncate">
                  {user?.get_full_name || user?.email}
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400 truncate">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div 
        className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-56'
        }`}
      >
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-700 shadow-sm">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between p-3 border-b border-blue-700 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-9 h-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center shadow-lg flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <span className="font-bold text-white text-base whitespace-nowrap">ExamFlow</span>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {getNavigation().map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              // Handle disabled/separator items
              if (item.disabled) {
                return (
                  <div key={item.name} className="px-3 py-2">
                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                        <Icon className="w-4 h-4" />
                        <span className="whitespace-nowrap">{item.name.replace('--- ', '').replace(' ---', '')}</span>
                      </div>
                    )}
                    {sidebarCollapsed && (
                      <div className="flex items-center justify-center">
                        <Icon className="w-4 h-4 text-slate-500 dark:text-gray-400" title={item.name.replace('--- ', '').replace(' ---', '')} />
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                  }`}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  {!sidebarCollapsed && <span className="whitespace-nowrap text-sm">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Toggle Button */}
          <div className="p-3 border-t border-slate-200 dark:border-gray-700">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-all"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>

          {/* User Info */}
          <div className="p-3 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-gray-100 truncate">
                    {user?.get_full_name || user?.email}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-gray-400 truncate">
                    {user?.role?.replace('_', ' ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'}`}>
        {/* Enhanced Top bar */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 h-16">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-700 dark:text-gray-300" />
              </button>
              
              {/* Search bar */}
              <div className="hidden sm:block">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="block w-64 pl-10 pr-4 py-2 border border-slate-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 relative transition-colors">
                <Bell className="w-5 h-5 text-slate-700 dark:text-gray-300" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                      {user?.get_full_name || user?.email}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-gray-400">
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-600 dark:text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-slate-200 dark:border-gray-700 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                          {user?.get_full_name || user?.email}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                          {user?.email}
                        </p>
                      </div>
                      <Link
                        to="/institute-profile"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Institute Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <hr className="my-2 border-slate-200 dark:border-gray-700" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
