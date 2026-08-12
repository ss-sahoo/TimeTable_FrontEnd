import { useState } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { api } from "../../hooks/useApi";
import { User, Mail, Phone, Shield, Save, Loader2, CheckCircle2, AlertCircle, Camera } from "lucide-react";

const ProfileContent = () => {
    const { user, setUser } = useAuthContext();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
    });

    const [uploadingImage, setUploadingImage] = useState(false);

    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await api.patch("/auth/profile/", formData);
            setUser(response.data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Error updating profile:", err);
            setError(err.response?.data?.detail || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            setError("New passwords do not match");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await api.post("/auth/change-password/", {
                old_password: passwordData.current_password,
                new_password: passwordData.new_password,
                new_password_confirm: passwordData.confirm_password
            });
            setSuccess(true);
            setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Error changing password:", err);
            setError(err.response?.data?.detail || err.response?.data?.error || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("profile_picture", file);

        setUploadingImage(true);
        setError(null);
        try {
            const response = await api.patch("/auth/profile/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setUser(response.data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Error uploading image:", err);
            setError("Failed to upload image");
        } finally {
            setUploadingImage(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h2>
                <p className="text-slate-500 dark:text-gray-400 text-sm">Manage your personal information and account security</p>
            </div>

            {success && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={18} />
                    Changes saved successfully!
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 rounded-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Quick Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-gray-700 text-center">
                        <div className="relative inline-block mb-4">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-violet-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-xl overflow-hidden">
                                {user?.profile_picture ? (
                                    <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    user?.first_name?.[0] || user?.email?.[0]?.toUpperCase()
                                )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-slate-100 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                                {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {user?.full_name || `${user?.first_name} ${user?.last_name}`.trim() || user?.email.split('@')[0]}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4 truncate">{user?.email}</p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
                            <Shield size={12} />
                            {user?.role?.replace('_', ' ')}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-gray-700">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Account Status</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-gray-400">Verified</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Yes</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-gray-400">Two-Factor Auth</span>
                                <span className="text-slate-400 dark:text-gray-500 font-bold">Disabled</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500 dark:text-gray-400">Last Login</span>
                                <span className="text-slate-900 dark:text-white font-medium">Today</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Forms */}
                <div className="md:col-span-2 space-y-8">
                    {/* Personal Information */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h3>
                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Update your basic account details</p>
                        </div>
                        <form onSubmit={handleProfileUpdate} className="p-6 sm:p-8 space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            disabled
                                            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl text-slate-500 dark:text-gray-500 transition-all text-sm cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-bold text-sm disabled:opacity-70"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    Save Profile
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Password Change */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security</h3>
                            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Change your password to keep your account secure</p>
                        </div>
                        <form onSubmit={handlePasswordUpdate} className="p-6 sm:p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-8 py-3 bg-slate-900 dark:bg-gray-700 text-white rounded-2xl hover:bg-slate-800 dark:hover:bg-gray-600 transition-all shadow-lg font-bold text-sm disabled:opacity-70"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileContent;
