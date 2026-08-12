import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { api } from "../../hooks/useApi";
import { useAuthContext } from "../../contexts/AuthContext";
import { Building2, Users, MapPin, Globe, Mail, Phone, Calendar, Shield, Activity, TrendingUp, BookOpen, GraduationCap, Edit, Save, X, Camera, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const InstituteContent = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthContext();
  const [institute, setInstitute] = useState<any>(null);
  const [stats, setStats] = useState({
    centers: 0,
    students: 0,
    teachers: 0,
    exams: 0
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    website: ""
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstituteData = async () => {
      const instituteId = user?.institute_id || user?.institute?.id;

      if (!instituteId) {
        console.warn("InstituteContent: No institute_id found for user", user);
        setLoading(false);
        return;
      }

      console.log("InstituteContent: Fetching data for institute_id:", instituteId);
      setLoading(true);
      try {
        console.log(`InstituteContent: GET /auth/institutes/${instituteId}/`);
        const instRes = await api.get(`/auth/institutes/${instituteId}/`);
        console.log("InstituteContent: Institute details fetched:", instRes.data);
        const data = instRes.data;
        setInstitute(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          address: data.address || "",
          website: data.website || ""
        });

        // Fetch statistics
        console.log("InstituteContent: Fetching statistics...");
        const [centersRes, usersRes, examsRes] = await Promise.all([
          api.get(`/timetable/centers/?institute_id=${instituteId}`),
          api.get(`/auth/users/?institute_id=${instituteId}`),
          api.get(`/exams/exams/?institute_id=${instituteId}`)
        ]);

        console.log("InstituteContent: Statistics fetched successfully");
        const centers = centersRes.data.results || centersRes.data || [];
        const users = usersRes.data.results || usersRes.data || [];
        const exams = examsRes.data.results || examsRes.data || [];

        setStats({
          centers: centers.length,
          students: users.filter((u: any) => u.role === 'student' || u.role === 'STUDENT').length,
          teachers: users.filter((u: any) => u.role === 'teacher' || u.role === 'TEACHER').length,
          exams: exams.length
        });
      } catch (error: any) {
        console.error("Error fetching institute data:", error);
        if (error.response) {
          console.error("Error response:", error.response.status, error.response.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInstituteData();
  }, [user?.institute_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    const instituteId = user?.institute_id || user?.institute?.id;
    if (!instituteId) return;

    setSaving(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        data.append(key, (formData as any)[key]);
      });

      if (logoFile) {
        data.append('logo', logoFile);
      }

      const response = await api.put(`/auth/institutes/${instituteId}/update/`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedInstitute = response.data;
      setInstitute(updatedInstitute);
      setLogoPreview(null);
      setLogoFile(null);

      // Update global user state to refresh header name and logo
      if (user) {
        const updatedUser = {
          ...user,
          institute: {
            ...user.institute,
            ...updatedInstitute
          },
          institute_name: updatedInstitute.name
        };
        setUser(updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }

      setIsEditing(false);
      toast.success("Institute updated successfully");
    } catch (error: any) {
      console.error("Error updating institute:", error);
      toast.error(error.response?.data?.detail || "Failed to update institute");
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = user?.role?.toLowerCase() === 'super_admin';

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!institute) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <div className="w-16 h-16 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Building2 size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Institute not found</h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">We couldn't retrieve the details for your institute.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Decorative Banner */}
        <div className="h-32 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
        </div>

        <div className="px-6 pb-6">
          <div className="relative flex flex-col sm:flex-row justify-between items-end -mt-12 mb-6 gap-4">
            <div className="flex items-end gap-5">
              <div className="relative group">
                <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-xl border-4 border-white dark:border-gray-800 shadow-md flex items-center justify-center text-blue-600 shrink-0 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : institute.logo ? (
                    <img src={institute.logo} alt={institute.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={40} />
                  )}
                </div>
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </label>
                )}
              </div>
              <div className="mb-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="px-2 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px]"
                    />
                  ) : (
                    institute.name
                  )}
                  {institute.is_verified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800">
                      Verified
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Shield size={12} />
                    ID: {institute.id}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    Joined {new Date(institute.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {isSuperAdmin && (
                isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 border border-blue-600 rounded-lg text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {saving ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Save size={14} />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-xs font-bold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Edit size={14} />
                    Edit Profile
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">About Institute</h3>
              {isEditing ? (
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-900 text-sm text-slate-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Tell us about the institute..."
                />
              ) : (
                <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                  {institute.description || "No description provided for this institute."}
                </p>
              )}
            </div>
            <div className="lg:col-span-1 flex flex-wrap gap-2 content-start">
              {/* Tags or Badges could go here */}
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-gray-900 rounded-md border border-slate-100 dark:border-gray-700 text-xs font-medium text-slate-600 dark:text-gray-400 flex items-center gap-2">
                <Globe size={14} />
                {isEditing ? (
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="bg-transparent border-none outline-none text-blue-600 focus:ring-0 p-0 h-auto"
                    placeholder="Website URL"
                  />
                ) : institute.website ? (
                  <a href={institute.website} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline">
                    {institute.website.replace(/^https?:\/\//, '')}
                  </a>
                ) : 'No Website'}
              </div>
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-gray-900 rounded-md border border-slate-100 dark:border-gray-700 text-xs font-medium text-slate-600 dark:text-gray-400 flex items-center gap-2">
                <Mail size={14} />
                {isEditing ? (
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className="bg-transparent border-none outline-none focus:ring-0 p-0 h-auto"
                    placeholder="Contact Email"
                  />
                ) : (
                  institute.contact_email || 'No Email'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CompactStatCard
          icon={MapPin}
          label="Centers"
          value={stats.centers}
          color="blue"
        />
        <CompactStatCard
          icon={Users}
          label="Students"
          value={stats.students}
          color="emerald"
        />
        <CompactStatCard
          icon={Shield}
          label="Teachers"
          value={stats.teachers}
          color="indigo"
        />
        <CompactStatCard
          icon={BookOpen}
          label="Exams"
          value={stats.exams}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-blue-600" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <CompactDetailRow
                icon={Mail}
                label="Email"
                value={isEditing ? (
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className="bg-transparent border-none outline-none focus:ring-0 p-0 h-auto w-full text-sm font-medium"
                  />
                ) : institute.contact_email}
              />
              <CompactDetailRow
                icon={Phone}
                label="Phone"
                value={isEditing ? (
                  <input
                    type="text"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    className="bg-transparent border-none outline-none focus:ring-0 p-0 h-auto w-full text-sm font-medium"
                  />
                ) : institute.contact_phone}
              />
              <CompactDetailRow
                icon={MapPin}
                label="Address"
                value={isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="bg-transparent border-none outline-none focus:ring-0 p-0 h-auto w-full text-sm font-medium"
                  />
                ) : institute.address}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CompactActionCard
                icon={MapPin}
                title="Manage Centers"
                desc="Add or edit branches"
                color="blue"
              />
              <CompactActionCard
                icon={Users}
                title="User Access"
                desc="Manage permissions"
                color="emerald"
              />
              <CompactActionCard
                icon={GraduationCap}
                title="Academic Batches"
                desc="View student groups"
                color="indigo"
              />
              <CompactActionCard
                icon={Shield}
                title="Security"
                desc="Platform settings"
                color="amber"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompactStatCard = ({ icon: Icon, label, value, color }: any) => {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800",
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800",
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <h4 className="text-xl font-bold text-slate-900 dark:text-white">{value}</h4>
      </div>
    </div>
  );
};

const CompactDetailRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-slate-400">
      <Icon size={14} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-slate-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-700 dark:text-gray-200 truncate">
        {value || <span className="text-slate-400 italic">Not provided</span>}
      </p>
    </div>
  </div>
);

const CompactActionCard = ({ icon: Icon, title, desc, color }: any) => {
  const colors: any = {
    blue: "text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20",
    emerald: "text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20",
    indigo: "text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20",
    amber: "text-amber-600 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20",
  };

  return (
    <button className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-all text-left group bg-slate-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-bold text-slate-700 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{desc}</p>
      </div>
    </button>
  );
};

export default InstituteContent;
