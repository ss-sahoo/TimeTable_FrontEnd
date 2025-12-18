import { useState, useEffect, useRef } from "react";
import {
  Building2,
  FileText,
  Home,
  Users,
  GraduationCap,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  MoreVertical,
  MapPin,
  Menu,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { useAuthContext } from "../contexts/AuthContext";
import { api } from "../hooks/useApi";
import { useNavigate } from "react-router-dom";

type SidebarTab = "home" | "exams";
type HomeSubTab = "centers" | "programs";

interface Center {
  id: string;
  name: string;
  city: string;
  address?: string;
  phone?: string;
  email?: string;
  institute?: string | {
    id: string;
    name: string;
  };
  created_at?: string;
}

interface Program {
  id: string;
  name: string;
  center: string;
  center_id?: string;
  description?: string;
  category?: string;
  is_active: boolean;
  batches_count?: number;
  created_at?: string;
  updated_at?: string;
}

export default function SuperAdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("home");
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>("centers");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // State for centers and programs
  const [centers, setCenters] = useState<Center[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // Modal states
  const [showAddCenterModal, setShowAddCenterModal] = useState(false);
  const [showEditCenterModal, setShowEditCenterModal] = useState(false);
  const [showViewCenterModal, setShowViewCenterModal] = useState(false);
  const [showDeleteCenterModal, setShowDeleteCenterModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);

  const [showAddProgramModal, setShowAddProgramModal] = useState(false);
  
  // Check if user is super admin, if not redirect - but wait for auth to load
  useEffect(() => {
    // Don't redirect while auth is still loading
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Only redirect if user is definitely not a super admin
    if (user && user.role !== 'super_admin' && user.role !== 'SUPER_ADMIN') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  // Fetch centers when Centers tab is opened
  useEffect(() => {
    const fetchCenters = async () => {
      if (sidebarTab === "home" && homeSubTab === "centers") {
        setLoadingCenters(true);
        try {
          const response = await api.get('/timetable/centers/');
          if (response.data?.results) {
            // Transform API response to match our Center interface
            const centersData: Center[] = response.data.results.map((center: {
              id: string;
              name: string;
              city: string;
              address?: string;
              phone?: string;
              email?: string;
              institute?: string | { id: string; name: string };
              created_at?: string;
            }) => ({
              id: center.id,
              name: center.name,
              city: center.city,
              address: center.address || undefined,
              phone: center.phone || undefined,
              email: center.email || undefined,
              institute: typeof center.institute === 'object' ? center.institute.name : center.institute,
              created_at: center.created_at || undefined,
            }));
            setCenters(centersData);
          }
        } catch (error) {
          console.error('Error fetching centers:', error);
        } finally {
          setLoadingCenters(false);
        }
      }
    };
    fetchCenters();
  }, [sidebarTab, homeSubTab]);

  // Fetch programs
  useEffect(() => {
    const fetchPrograms = async () => {
      if (sidebarTab === "home" && homeSubTab === "programs") {
        setLoadingPrograms(true);
        try {
          const response = await api.get('/timetable/programs/');
          if (response.data?.programs) {
            setPrograms(response.data.programs);
          }
        } catch (error) {
          console.error('Error fetching programs:', error);
        } finally {
          setLoadingPrograms(false);
        }
      }
    };
    fetchPrograms();
  }, [sidebarTab, homeSubTab]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not super admin
  if (!isAuthenticated || (user && user.role !== 'super_admin' && user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  // Refresh centers after creation - fetch all centers from API
  const refreshCenters = async () => {
    setLoadingCenters(true);
    try {
      const response = await api.get('/timetable/centers/');
      if (response.data?.results) {
        // Transform API response to match our Center interface
        const centersData: Center[] = response.data.results.map((center: {
          id: string;
          name: string;
          city: string;
          address?: string;
          phone?: string;
          email?: string;
          institute?: string | { id: string; name: string };
          created_at?: string;
        }) => ({
          id: center.id,
          name: center.name,
          city: center.city,
          address: center.address || undefined,
          phone: center.phone || undefined,
          email: center.email || undefined,
          institute: typeof center.institute === 'object' ? center.institute.name : center.institute,
          created_at: center.created_at || undefined,
        }));
        setCenters(centersData);
      }
    } catch (error) {
      console.error('Error fetching centers:', error);
    } finally {
      setLoadingCenters(false);
    }
  };

  // Refresh programs after creation
  const refreshPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const response = await api.get('/timetable/programs/');
      if (response.data?.programs) {
        setPrograms(response.data.programs);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoadingPrograms(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl" />
      </div>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-white/80 backdrop-blur-xl border-r border-slate-200/50 shadow-xl shadow-slate-200/20 transition-all duration-300 ${
            sidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between h-[72px] px-5 border-b border-slate-200/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <span className="font-bold text-slate-900 text-lg whitespace-nowrap tracking-tight">DashoExams</span>
                  <p className="text-xs text-slate-500 whitespace-nowrap">Super Admin</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {!sidebarCollapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
            )}
            <SidebarNavItem
              icon={Home}
              label="Home"
              active={sidebarTab === "home"}
              onClick={() => setSidebarTab("home")}
              collapsed={sidebarCollapsed}
            />
            <SidebarNavItem
              icon={FileText}
              label="Exams"
              active={sidebarTab === "exams"}
              onClick={() => setSidebarTab("exams")}
              collapsed={sidebarCollapsed}
            />
          </nav>

          {/* Collapse Toggle */}
          <div className="p-4 border-t border-slate-200/50">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100/80 transition-all"
            >
              {sidebarCollapsed ? (
                <ChevronLeft className="w-5 h-5" />
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 h-[72px] flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {sidebarTab === "home" && "Home"}
                  {sidebarTab === "exams" && "Exams"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.get_full_name || user?.email}</p>
                <p className="text-xs text-slate-500">Super Admin</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            {sidebarTab === "home" && (
              <HomeTab
                activeSubTab={homeSubTab}
                onSubTabChange={setHomeSubTab}
                onAddCenter={() => setShowAddCenterModal(true)}
                onEditCenter={(center) => {
                  setSelectedCenter(center);
                  setShowEditCenterModal(true);
                }}
                onViewCenter={(center) => {
                  setSelectedCenter(center);
                  setShowViewCenterModal(true);
                }}
                onDeleteCenter={(center) => {
                  setSelectedCenter(center);
                  setShowDeleteCenterModal(true);
                }}
                onAddProgram={() => setShowAddProgramModal(true)}
                centers={centers}
                programs={programs}
                loadingCenters={loadingCenters}
                loadingPrograms={loadingPrograms}
                onRefreshCenters={refreshCenters}
                onRefreshPrograms={refreshPrograms}
              />
            )}
            {sidebarTab === "exams" && <ExamsTab />}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-5 border-b">
                <span className="font-bold text-slate-900 text-lg">DashoExams</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                <SidebarNavItem
                  icon={Home}
                  label="Home"
                  active={sidebarTab === "home"}
                  onClick={() => {
                    setSidebarTab("home");
                    setMobileMenuOpen(false);
                  }}
                  collapsed={false}
                />
                <SidebarNavItem
                  icon={FileText}
                  label="Exams"
                  active={sidebarTab === "exams"}
                  onClick={() => {
                    setSidebarTab("exams");
                    setMobileMenuOpen(false);
                  }}
                  collapsed={false}
                />
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showAddCenterModal && (
        <AddCenterModal 
          onClose={() => setShowAddCenterModal(false)} 
          onSuccess={() => {
            refreshCenters();
          }}
        />
      )}
      {showEditCenterModal && selectedCenter && (
        <EditCenterModal center={selectedCenter} onClose={() => setShowEditCenterModal(false)} />
      )}
      {showViewCenterModal && selectedCenter && (
        <ViewCenterModal center={selectedCenter} onClose={() => setShowViewCenterModal(false)} />
      )}
      {showDeleteCenterModal && selectedCenter && (
        <DeleteCenterModal center={selectedCenter} onClose={() => setShowDeleteCenterModal(false)} />
      )}
      {showAddProgramModal && (
        <AddProgramModal 
          onClose={() => setShowAddProgramModal(false)} 
          onSuccess={refreshPrograms}
          centers={centers}
        />
      )}
    </div>
  );
}

// Sidebar Nav Item Component
function SidebarNavItem({
  icon: Icon,
  label,
  active,
  onClick,
  collapsed,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-medium transition-all relative overflow-hidden w-full ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
          : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
      }`}
      title={collapsed ? label : undefined}
    >
      {active && (
        <>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-violet-400/10" />
        </>
      )}
      <Icon className="w-5 h-5 flex-shrink-0 relative z-10" />
      {!collapsed && <span className="relative z-10">{label}</span>}
    </button>
  );
}

// Home Tab Component
function HomeTab({
  activeSubTab,
  onSubTabChange,
  onAddCenter,
  onEditCenter,
  onViewCenter,
  onDeleteCenter,
  onAddProgram,
  centers,
  programs,
  loadingCenters,
  loadingPrograms,
}: {
  activeSubTab: HomeSubTab;
  onSubTabChange: (tab: HomeSubTab) => void;
  onAddCenter: () => void;
  onEditCenter: (center: Center) => void;
  onViewCenter: (center: Center) => void;
  onDeleteCenter: (center: Center) => void;
  onAddProgram: () => void;
  centers: Center[];
  programs: Program[];
  loadingCenters: boolean;
  loadingPrograms: boolean;
  onRefreshCenters: () => void;
  onRefreshPrograms: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => onSubTabChange("centers")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === "centers"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Centers
          </button>
          <button
            onClick={() => onSubTabChange("programs")}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeSubTab === "programs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            Programs
          </button>
        </nav>
      </div>

      {/* Sub Tab Content */}
      {activeSubTab === "centers" && (
        <CentersSubTab
          onAdd={onAddCenter}
          onEdit={onEditCenter}
          onView={onViewCenter}
          onDelete={onDeleteCenter}
          centers={centers}
          loading={loadingCenters}
        />
      )}
      {activeSubTab === "programs" && (
        <ProgramsSubTab 
          onAdd={onAddProgram} 
          programs={programs}
          loading={loadingPrograms}
        />
      )}
    </div>
  );
}

// Centers Sub Tab
function CentersSubTab({
  onAdd,
  onEdit,
  onView,
  onDelete,
  centers,
  loading,
}: {
  onAdd: () => void;
  onEdit: (center: Center) => void;
  onView: (center: Center) => void;
  onDelete: (center: Center) => void;
  centers: Center[];
  loading: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCenters = centers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search centers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          Create Center
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCenters.map((center) => (
          <CenterCard
            key={center.id}
            center={center}
            onEdit={() => onEdit(center)}
            onView={() => onView(center)}
            onDelete={() => onDelete(center)}
          />
        ))}
      </div>
    </div>
  );
}

// Center Card
function CenterCard({
  center,
  onEdit,
  onView,
  onDelete,
}: {
  center: Center;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{center.name}</h3>
            <p className="text-sm text-slate-500">{center.city}</p>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <MoreVertical className="w-5 h-5 text-slate-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
              <button
                onClick={() => {
                  onView();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button
                onClick={() => {
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="w-4 h-4" />
          <span>{center.city}</span>
        </div>
        {center.address && (
          <div className="text-sm text-slate-500">
            {center.address}
          </div>
        )}
        {center.institute && (
          <div className="text-sm text-slate-500">
            Institute: {typeof center.institute === 'object' ? center.institute.name : center.institute}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          onClick={onView}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}

// Programs Sub Tab
function ProgramsSubTab({ 
  onAdd, 
  programs, 
  loading 
}: { 
  onAdd: () => void; 
  programs: Program[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Programs</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Plus className="w-4 h-4" />
          Create Program
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs.map((program) => (
          <div
            key={program.id}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">{program.name}</h3>
                <p className="text-sm text-slate-500">{program.center}</p>
              </div>
            </div>
            {program.description && (
              <p className="text-sm text-slate-600 mb-3">{program.description}</p>
            )}
            <div className="space-y-2">
              {program.batches_count !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Batches</span>
                  <span className="font-medium text-slate-900">{program.batches_count}</span>
                </div>
              )}
              {program.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium text-slate-900">{program.category}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <span className={`font-medium ${program.is_active ? 'text-green-600' : 'text-slate-500'}`}>
                  {program.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {programs.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-500">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p>No programs found</p>
          <p className="text-sm mt-2">Click "Create Program" to create your first program</p>
        </div>
      )}
    </div>
  );
}

// Exams Tab
function ExamsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Exams Management</h2>
        <p className="text-slate-600">Exam management interface will be implemented here</p>
      </div>
    </div>
  );
}

// Modal Components
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-white px-6 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function AddCenterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    institute_name: '',
    name: '',
    city: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/timetable/superadmin/centers/create/', formData);
      if (response.data) {
        // Refresh centers list after successful creation
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          institute_name: '',
          name: '',
          city: '',
          address: '',
        });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to create center');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Center">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Institute Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.institute_name}
            onChange={(e) => setFormData({ ...formData, institute_name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Allen Coaching"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Center Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Allen - Jaipur Center"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Jaipur"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Address (Optional)
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Full address of the center"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Center'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditCenterModal({ center, onClose }: { center: Center; onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Center">
      <p className="text-slate-600">Edit center form for {center.name} will be implemented here</p>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </Modal>
  );
}

function ViewCenterModal({ center, onClose }: { center: Center; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [centerDetails, setCenterDetails] = useState<Center | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCenterDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/timetable/centers/${center.id}/`);
        if (response.data) {
          // Transform API response to match our Center interface
          setCenterDetails({
            id: response.data.id,
            name: response.data.name,
            city: response.data.city,
            address: response.data.address || undefined,
            phone: response.data.phone || undefined,
            email: response.data.email || undefined,
            institute: typeof response.data.institute === 'object' 
              ? response.data.institute.name 
              : response.data.institute,
            created_at: response.data.created_at || undefined,
          });
        }
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load center details');
      } finally {
        setLoading(false);
      }
    };

    fetchCenterDetails();
  }, [center.id]);

  const displayCenter = centerDetails || center;
  const instituteName = typeof displayCenter.institute === 'object' 
    ? displayCenter.institute.name 
    : displayCenter.institute;

  return (
    <Modal isOpen={true} onClose={onClose} title="Center Details">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">Name</p>
            <p className="text-base font-medium text-slate-900">{displayCenter.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">City</p>
            <p className="text-base font-medium text-slate-900">{displayCenter.city}</p>
          </div>
          {displayCenter.address && (
            <div>
              <p className="text-sm text-slate-500">Address</p>
              <p className="text-base font-medium text-slate-900">{displayCenter.address}</p>
            </div>
          )}
          {displayCenter.phone && (
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="text-base font-medium text-slate-900">{displayCenter.phone}</p>
            </div>
          )}
          {displayCenter.email && (
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="text-base font-medium text-slate-900">{displayCenter.email}</p>
            </div>
          )}
          {instituteName && (
            <div>
              <p className="text-sm text-slate-500">Institute</p>
              <p className="text-base font-medium text-slate-900">{instituteName}</p>
            </div>
          )}
          {displayCenter.created_at && (
            <div>
              <p className="text-sm text-slate-500">Created At</p>
              <p className="text-base font-medium text-slate-900">
                {new Date(displayCenter.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

function DeleteCenterModal({ center, onClose }: { center: Center; onClose: () => void }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Delete Center">
      <p className="text-slate-600">
        Are you sure you want to delete <strong>{center.name}</strong>? This action cannot be undone.
      </p>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

function AddProgramModal({ 
  onClose, 
  onSuccess, 
  centers 
}: { 
  onClose: () => void; 
  onSuccess: () => void;
  centers: Center[];
}) {
  const [formData, setFormData] = useState({
    center_name: '',
    name: '',
    description: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Prepare request body matching Postman collection format
      const requestBody: {
        center_name: string;
        name: string;
        description?: string;
        category?: string;
      } = {
        center_name: formData.center_name,
        name: formData.name,
      };
      
      // Only include optional fields if they have values
      if (formData.description) {
        requestBody.description = formData.description;
      }
      if (formData.category) {
        requestBody.category = formData.category;
      }

      const response = await api.post('/timetable/superadmin/programs/create/', requestBody);
      if (response.data) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          center_name: '',
          name: '',
          description: '',
          category: '',
        });
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to create program');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Program">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Center <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.center_name}
            onChange={(e) => setFormData({ ...formData, center_name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Allen - Jaipur Center"
            list="centers-list"
          />
          {centers.length > 0 && (
            <datalist id="centers-list">
              {centers.map((center) => (
                <option key={center.id} value={center.name} />
              ))}
            </datalist>
          )}
          <p className="text-xs text-slate-500 mt-1">Enter the exact center name</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Program Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Super 30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category (Optional)
          </label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., JEE Prep"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Program description"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Program'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

