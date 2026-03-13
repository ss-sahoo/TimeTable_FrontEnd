import { useState, useEffect } from "react";
import { api } from "../../hooks/useApi";
import { useAuthContext } from "../../contexts/AuthContext";
import { useTimetableCenter } from "../../contexts/TimetableCenterContext";
import { toast } from "react-toastify";
import {
  Building2,
  Upload,
  Search,
  Filter,
  Edit2,
  MapPin,
  Users,
  TrendingUp,
  CheckCircle,
  X,
  AlertCircle,
  Trash2,
  UserPlus,
  Copy,
  Check,
} from "lucide-react";

interface CenterData {
  id: string;
  name: string;
  city: string;
  address?: string;
  institute?: {
    id: number;
    name: string;
  };
  admin_count?: number;
  student_count?: number;
  capacity?: number;
}

const CentersContent = () => {
  const { user: currentUser } = useAuthContext();
  const { refreshCenters } = useTimetableCenter();
  const [centers, setCenters] = useState<CenterData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showCenterDetailModal, setShowCenterDetailModal] = useState(false);
  const [centerUsers, setCenterUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<CenterData | null>(null);
  const [adminCredentials, setAdminCredentials] = useState<{ username: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState({
    totalCenters: 0,
    totalCapacity: 0,
    totalStudents: 0,
    operationalPercentage: 100,
  });
  const [newCenter, setNewCenter] = useState({
    name: "",
    city: "",
    address: "",
  });
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    phone_number: "",
  });

  useEffect(() => {
    fetchCenters();
  }, [currentUser?.institute_id]);

  const fetchCenters = async () => {
    const instituteId = currentUser?.institute_id || currentUser?.institute?.id;
    if (!instituteId) return;

    setLoading(true);
    try {
      // Fetch centers
      const response = await api.get(`/timetable/centers/?institute_id=${instituteId}`);
      const centersData = response.data.results || response.data.centers || response.data || [];
      setCenters(Array.isArray(centersData) ? centersData : []);

      // Fetch analytics for stats
      try {
        const analyticsRes = await api.get(`/auth/analytics/dashboard/?institute_id=${instituteId}`);
        const analyticsData = analyticsRes.data;

        setStats({
          totalCenters: analyticsData.stats?.centers?.total || centersData.length,
          totalCapacity: analyticsData.stats?.centers?.capacity || (centersData.length * 300),
          totalStudents: analyticsData.stats?.students?.total || 0,
          operationalPercentage: 100,
        });
      } catch (analyticsError) {
        console.error("Error fetching analytics:", analyticsError);
        // Fallback to basic calculation
        setStats({
          totalCenters: centersData.length,
          totalCapacity: centersData.length * 300,
          totalStudents: 0,
          operationalPercentage: 100,
        });
      }
    } catch (error) {
      console.error("Error fetching centers:", error);
      setError("Failed to fetch centers");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCenter = async () => {
    if (!selectedCenter) return;

    try {
      setError("");
      setLoading(true);

      await api.put(`/timetable/superadmin/centers/${selectedCenter.id}/update/`, {
        name: newCenter.name,
        city: newCenter.city,
        address: newCenter.address,
      });

      setShowEditModal(false);
      setSelectedCenter(null);
      setNewCenter({ name: "", city: "", address: "" });
      fetchCenters();
      setNewCenter({ name: "", city: "", address: "" });
      fetchCenters();
      refreshCenters(); // Update global context
      toast.error("Center updated successfully!");
    } catch (error: any) {
      console.error("Error updating center:", error);
      setError(error.response?.data?.detail || "Failed to update center");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (center: CenterData) => {
    setSelectedCenter(center);
    setNewCenter({
      name: center.name,
      city: center.city,
      address: center.address || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (center: CenterData) => {
    setSelectedCenter(center);
    setShowDeleteModal(true);
  };

  const handleDeleteCenter = async () => {
    if (!selectedCenter) return;

    try {
      setError("");
      setLoading(true);

      await api.delete(`/timetable/superadmin/centers/${selectedCenter.id}/delete/`);

      setShowDeleteModal(false);
      setSelectedCenter(null);
      fetchCenters();
      setSelectedCenter(null);
      fetchCenters();
      refreshCenters(); // Update global context
      toast.error("Center deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting center:", error);
      setError(error.response?.data?.detail || "Failed to delete center");
      toast.error(error.response?.data?.detail || "Failed to delete center");
    } finally {
      setLoading(false);
    }
  };

  const openAddAdminModal = (center: CenterData) => {
    setSelectedCenter(center);
    setNewAdmin({ name: "", email: "", phone_number: "" });
    setShowAddAdminModal(true);
  };

  const openCenterDetailModal = async (center: CenterData) => {
    setSelectedCenter(center);
    setShowCenterDetailModal(true);
    setLoadingUsers(true);
    setCenterUsers([]);

    try {
      // Fetch users for this center
      const instituteId = currentUser?.institute_id || currentUser?.institute?.id;
      const response = await api.get(`/auth/people/?institute_id=${instituteId}`);
      const allUsers = response.data.users || response.data.results || response.data || [];

      // Filter users by center
      const filteredUsers = allUsers.filter((user: any) => {
        const userCenterId = user.center?.id || user.center_id;
        const userCenterName = user.center?.name || user.center_name;
        return userCenterId === center.id || userCenterName === center.name;
      });

      setCenterUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching center users:", error);
      setCenterUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!selectedCenter) return;

    try {
      setError("");
      setLoading(true);

      const response = await api.post('/timetable/superadmin/admins/create/', {
        center_id: selectedCenter.id,
        name: newAdmin.name,
        email: newAdmin.email,
        phone_number: newAdmin.phone_number,
      });

      setShowAddAdminModal(false);
      setNewAdmin({ name: "", email: "", phone_number: "" });

      // Show credentials modal instead of alert
      const credentials = response.data;
      setAdminCredentials({
        username: credentials.username,
        password: credentials.password,
      });
      setShowCredentialsModal(true);

      // Refresh centers to update admin count
      fetchCenters();
    } catch (error: any) {
      console.error("Error creating admin:", error);
      setError(error.response?.data?.detail || "Failed to create admin");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleCloseCredentials = () => {
    setShowCredentialsModal(false);
    setAdminCredentials(null);
    setSelectedCenter(null);
    setCopiedField(null);
  };

  const handleAddCenter = async () => {
    const instituteId = currentUser?.institute_id || currentUser?.institute?.id;
    if (!instituteId) return;

    try {
      setError("");
      setLoading(true);

      await api.post('/timetable/superadmin/centers/create/', {
        ...newCenter,
        institute_id: instituteId,
      });

      setShowAddModal(false);
      setNewCenter({ name: "", city: "", address: "" });
      fetchCenters();
      setNewCenter({ name: "", city: "", address: "" });
      fetchCenters();
      refreshCenters(); // Update global context
      toast.error("Center created successfully!");
    } catch (error: any) {
      console.error("Error creating center:", error);
      setError(error.response?.data?.detail || "Failed to create center");
    } finally {
      setLoading(false);
    }
  };

  const filteredCenters = centers.filter(center => {
    const matchesSearch =
      center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      center.city.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter (all centers are operational for now)
    if (statusFilter !== "all") {
      return matchesSearch; // Can add status logic here later
    }

    return matchesSearch;
  });

  const totalCapacity = stats.totalCapacity;
  const operationalPercentage = stats.operationalPercentage;

  return (
    <div className="w-full h-full">
      {/* Header & Actions */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Center Management
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Monitor branch performance, manage locations, and track capacity across all institutes.
          </p>
        </div>
        <div className="mt-4 flex sm:ml-4 sm:mt-0">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 mr-3"
          >
            <Upload className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
            Download Report
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            type="button"
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <Building2 className="-ml-0.5 mr-1.5 h-5 w-5" />
            Add Center
          </button>
        </div>
      </div>

      {/* KPI Stats Cards - Compact Design */}
      <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
        <div className="relative overflow-hidden rounded-lg bg-white px-3 py-3 shadow-sm border border-gray-200">
          <dt>
            <div className="absolute rounded-md bg-indigo-500 p-1.5">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <p className="ml-10 truncate text-xs font-medium text-gray-500">Total Operational Centers</p>
          </dt>
          <dd className="ml-10 flex items-baseline mt-1">
            <p className="text-2xl font-bold text-gray-900">{stats.totalCenters}</p>
            {stats.totalCenters > 0 && (
              <p className="ml-2 flex items-baseline text-xs font-medium text-green-600">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                Active
              </p>
            )}
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-3 py-3 shadow-sm border border-gray-200">
          <dt>
            <div className="absolute rounded-md bg-blue-500 p-1.5">
              <Users className="h-4 w-4 text-white" />
            </div>
            <p className="ml-10 truncate text-xs font-medium text-gray-500">Total Student Capacity</p>
          </dt>
          <dd className="ml-10 flex items-baseline mt-1">
            <p className="text-2xl font-bold text-gray-900">{totalCapacity.toLocaleString()}</p>
            <span className="ml-2 text-xs text-gray-500">across all hubs</span>
          </dd>
        </div>

        <div className="relative overflow-hidden rounded-lg bg-white px-3 py-3 shadow-sm border border-gray-200">
          <dt>
            <div className="absolute rounded-md bg-green-500 p-1.5">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <p className="ml-10 truncate text-xs font-medium text-gray-500">System Status</p>
          </dt>
          <dd className="ml-10 flex items-baseline mt-1">
            <p className="text-2xl font-bold text-green-600">{operationalPercentage}%</p>
            <span className="ml-2 text-xs text-gray-500">Operational</span>
          </dd>
        </div>
      </dl>

      {/* Main Table Card */}
      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl overflow-hidden">
        {/* Filters Toolbar */}
        <div className="border-b border-gray-200 bg-gray-50/50 p-4 sm:flex sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Search centers or cities..."
            />
          </div>
          <div className="mt-3 sm:ml-4 sm:mt-0 flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="all">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500 sm:pl-6">
                    Center Details
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Location
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Center Head
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredCenters.map((center, index) => (
                  <tr key={center.id} className="hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg ${index % 2 === 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'
                          }`}>
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => openCenterDetailModal(center)}
                            className="font-medium text-gray-900 hover:text-indigo-600 transition text-left"
                          >
                            {center.name}
                          </button>
                          <div className="text-gray-500 text-xs">ID: {center.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {center.city}
                      </div>
                      {center.address && (
                        <div className="text-xs text-gray-400 mt-0.5">{center.address}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mr-2">
                            {center.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{center.admin_count || 0} Admins</span>
                        </div>
                        <button
                          onClick={() => openAddAdminModal(center)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800 transition"
                          title="Add admin to this center"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Operational
                      </span>
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => openEditModal(center)}
                          className="text-gray-400 hover:text-indigo-600 transition"
                          title="Edit center"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(center)}
                          className="text-gray-400 hover:text-red-600 transition"
                          title="Delete center"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCenters.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      {loading ? "Loading centers..." : "No centers found. Create your first center to get started."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{' '}
                <span className="font-medium">{Math.min(filteredCenters.length, 10)}</span> of{' '}
                <span className="font-medium">{filteredCenters.length}</span> centers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Center Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddModal(false)}></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-md">
                {/* Modal Header */}
                <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add New Center
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowAddModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-4 py-4">
                  {error && (
                    <div className="mb-3 rounded-md bg-red-50 p-2.5">
                      <div className="flex">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                        <div className="ml-2">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Center Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Center Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCenter.name}
                        onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Downtown Campus"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCenter.city}
                        onChange={(e) => setNewCenter({ ...newCenter, city: e.target.value })}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="New York"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Address
                      </label>
                      <textarea
                        value={newCenter.address}
                        onChange={(e) => setNewCenter({ ...newCenter, address: e.target.value })}
                        rows={2}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="Street, P.O. Box, etc."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-4 py-3 flex flex-row-reverse gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleAddCenter}
                    disabled={!newCenter.name || !newCenter.city || loading}
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Center"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Center Modal */}
      {showEditModal && selectedCenter && (
        <div className="fixed inset-0 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditModal(false)}></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-md">
                {/* Modal Header */}
                <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Center
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowEditModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-4 py-4">
                  {error && (
                    <div className="mb-3 rounded-md bg-red-50 p-2.5">
                      <div className="flex">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                        <div className="ml-2">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Center Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Center Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCenter.name}
                        onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. Downtown Campus"
                      />
                    </div>

                    {/* City */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newCenter.city}
                        onChange={(e) => setNewCenter({ ...newCenter, city: e.target.value })}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="New York"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Address
                      </label>
                      <textarea
                        value={newCenter.address}
                        onChange={(e) => setNewCenter({ ...newCenter, address: e.target.value })}
                        rows={2}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="Street, P.O. Box, etc."
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-4 py-3 flex flex-row-reverse gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleEditCenter}
                    disabled={!newCenter.name || !newCenter.city || loading}
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Update Center"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Center Modal */}
      {showDeleteModal && selectedCenter && (
        <div className="fixed inset-0 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteModal(false)}></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-md">
                {/* Modal Header */}
                <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Center
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-4 py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">
                        Are you sure you want to delete <span className="font-semibold">{selectedCenter.name}</span>?
                        This action cannot be undone and will remove all associated data.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-4 py-3 flex flex-row-reverse gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleDeleteCenter}
                    disabled={loading}
                    className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Deleting..." : "Delete Center"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    onClick={() => setShowDeleteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && selectedCenter && (
        <div className="fixed inset-0 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddAdminModal(false)}></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-md">
                {/* Modal Header */}
                <div className="bg-white px-4 py-3 flex justify-between items-center border-b border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Add Admin
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Center: {selectedCenter.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowAddAdminModal(false)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-4 py-4">
                  {error && (
                    <div className="mb-3 rounded-md bg-red-50 p-2.5">
                      <div className="flex">
                        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                        <div className="ml-2">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Admin Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="e.g. John Doe"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="admin@example.com"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={newAdmin.phone_number}
                        onChange={(e) => setNewAdmin({ ...newAdmin, phone_number: e.target.value })}
                        className="block w-full rounded-md border border-gray-300 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        placeholder="9876543210"
                      />
                    </div>

                    <div className="rounded-md bg-blue-50 p-3">
                      <div className="flex">
                        <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                        <div className="ml-2">
                          <p className="text-xs text-blue-800">
                            Login credentials will be auto-generated and displayed after creation. Please save them securely.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-4 py-3 flex flex-row-reverse gap-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleAddAdmin}
                    disabled={!newAdmin.name || !newAdmin.email || loading}
                    className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating..." : "Create Admin"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    onClick={() => setShowAddAdminModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Credentials Modal */}
      {showCredentialsModal && adminCredentials && (
        <div className="fixed inset-0 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-md">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Admin Created Successfully!
                      </h3>
                      <p className="text-xs text-green-100">
                        Save these credentials securely
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="px-4 py-5">
                  <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="ml-2">
                        <p className="text-sm font-medium text-amber-800">Important!</p>
                        <p className="text-xs text-amber-700 mt-1">
                          These credentials will only be shown once. Please copy and save them now.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Username */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Username
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5">
                          <p className="text-sm font-mono font-semibold text-gray-900">
                            {adminCredentials.username}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(adminCredentials.username, 'username')}
                          className="flex-shrink-0 p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md transition-colors"
                          title="Copy username"
                        >
                          {copiedField === 'username' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Password
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5">
                          <p className="text-sm font-mono font-semibold text-gray-900">
                            {adminCredentials.password}
                          </p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(adminCredentials.password, 'password')}
                          className="flex-shrink-0 p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md transition-colors"
                          title="Copy password"
                        >
                          {copiedField === 'password' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs text-blue-800">
                      <span className="font-semibold">Next steps:</span> Share these credentials with the admin securely.
                      They can change their password after first login.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseCredentials}
                    className="w-full inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    I've Saved the Credentials
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Center Detail Modal */}
      {showCenterDetailModal && selectedCenter && (
        <div className="fixed inset-0 z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCenterDetailModal(false)}></div>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all w-full max-w-4xl">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                      <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {selectedCenter.name}
                      </h3>
                      <p className="text-sm text-indigo-100">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {selectedCenter.city}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-white/80 hover:text-white"
                    onClick={() => setShowCenterDetailModal(false)}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-6 py-5">
                  {/* Center Info */}
                  <div className="mb-6 grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Users className="h-4 w-4" />
                        <span>Total Users</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{centerUsers.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <UserPlus className="h-4 w-4" />
                        <span>Admins</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {centerUsers.filter(u => u.role?.toLowerCase() === 'admin' || u.role?.toLowerCase() === 'institute_admin').length}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <Users className="h-4 w-4" />
                        <span>Students</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {centerUsers.filter(u => u.role?.toLowerCase() === 'student').length}
                      </p>
                    </div>
                  </div>

                  {/* Users List */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Users at this Center</h4>

                    {loadingUsers ? (
                      <div className="flex justify-center items-center h-32">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : centerUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No users assigned to this center yet.</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {centerUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm">
                                  <div className="font-medium text-gray-900">
                                    {user.first_name && user.last_name
                                      ? `${user.first_name} ${user.last_name}`
                                      : user.username}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{user.email}</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'institute_admin'
                                      ? 'bg-indigo-50 text-indigo-700 ring-indigo-700/10'
                                      : user.role?.toLowerCase() === 'teacher'
                                        ? 'bg-green-50 text-green-700 ring-green-600/20'
                                        : user.role?.toLowerCase() === 'student'
                                          ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                          : 'bg-gray-50 text-gray-600 ring-gray-500/10'
                                    }`}>
                                    {user.role?.replace('_', ' ').split(' ').map((w: string) =>
                                      w.charAt(0).toUpperCase() + w.slice(1)
                                    ).join(' ')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex items-center gap-x-2">
                                    <div className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span className="text-gray-700">{user.is_active ? 'Active' : 'Inactive'}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    onClick={() => setShowCenterDetailModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CentersContent;
