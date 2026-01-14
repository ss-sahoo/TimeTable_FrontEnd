import { useState, useEffect } from "react";
import { api } from "../../hooks/useApi";
import { useAuthContext } from "../../contexts/AuthContext";
import { User, UserPlus, Edit, Trash2, Search, Filter, Shield, Mail, Building, MoreVertical, AlertCircle } from "lucide-react";

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
  institute_name?: string;
  is_active: boolean;
}

const UsersContent = () => {
  const { user: currentUser } = useAuthContext();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const instituteId = currentUser?.institute_id || currentUser?.institute?.id;
      if (!instituteId) return;
      setLoading(true);
      try {
        const response = await api.get(`/auth/users/?institute_id=${instituteId}`);
        const data = response.data.results || response.data;
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUser?.institute_id]);

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin': return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'institute_admin': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'teacher': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
      case 'student': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
      default: return 'bg-slate-50 dark:bg-gray-700 text-slate-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm">Control access and manage roles for {currentUser?.institute?.name || currentUser?.institute_name || 'your institute'}</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-bold text-sm">
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all text-sm font-medium">
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-96 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-gray-400 font-medium animate-pulse">Fetching users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-gray-900/50">
                  <th className="p-6 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">User Information</th>
                  <th className="p-6 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="p-6 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Institute</th>
                  <th className="p-6 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-900/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 flex items-center justify-center shrink-0 font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.username}</p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                            <Mail size={12} />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${getRoleBadgeColor(user.role)}`}>
                        <Shield size={14} />
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-gray-400">
                        <Building size={14} className="text-slate-400" />
                        {user.institute_name || "N/A"}
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all">
                          <Edit size={18} />
                        </button>
                        <button className="p-2 text-slate-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                        <button className="p-2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={40} className="text-slate-300 dark:text-gray-700" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No users found</h3>
            <p className="text-slate-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
              {searchQuery ? `We couldn't find any users matching "${searchQuery}"` : "Get started by adding your first system user."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersContent;
