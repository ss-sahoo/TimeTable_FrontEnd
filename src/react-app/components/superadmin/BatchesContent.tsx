import { useState, useEffect } from "react";
import { api } from "../../hooks/useApi";
import { useAuthContext } from "../../contexts/AuthContext";
import { GraduationCap, Plus, Edit, Trash2, Search, Filter, Users, Building, MoreVertical, AlertCircle } from "lucide-react";

interface Batch {
  id: string;
  name: string;
  institute_name?: string;
  student_count?: number;
  created_at?: string;
}

const BatchesContent = () => {
  const { user } = useAuthContext();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBatches = async () => {
      const instituteId = user?.institute_id || user?.institute?.id;
      if (!instituteId) return;
      setLoading(true);
      try {
        const response = await api.get(`/timetable/batches/?institute_id=${instituteId}`);
        const data = response.data.results || response.data;
        setBatches(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching batches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBatches();
  }, [user?.institute_id]);

  const filteredBatches = batches.filter(batch =>
    batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.institute_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Batch Management</h2>
          <p className="text-slate-500 dark:text-gray-400 text-sm">Organize students into groups for {user?.institute?.name || user?.institute_name || 'your institute'}</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-bold text-sm">
          <Plus size={18} />
          Create New Batch
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search by name or institute..."
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
            <p className="text-slate-500 dark:text-gray-400 font-medium animate-pulse">Fetching batches...</p>
          </div>
        ) : filteredBatches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-gray-900/50">
                  <th className="p-6 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Batch Name</th>
                  <th className="p-6 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Students</th>
                  <th className="p-6 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Institute</th>
                  <th className="p-6 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-900/50 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <GraduationCap size={22} />
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{batch.name}</p>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-gray-400">
                        <Users size={16} className="text-slate-400" />
                        {batch.student_count || 0} Students
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-gray-400">
                        <Building size={14} className="text-slate-400" />
                        {batch.institute_name || "N/A"}
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
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No batches found</h3>
            <p className="text-slate-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
              {searchQuery ? `We couldn't find any batches matching "${searchQuery}"` : "Get started by creating your first student batch."}
            </p >
          </div >
        )}
      </div >
    </div >
  );
};

export default BatchesContent;
