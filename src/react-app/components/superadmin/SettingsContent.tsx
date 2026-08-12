import { Settings, Bell, Shield, Globe, Database, Mail, Save } from "lucide-react";

const SettingsContent = () => {
  return (
    <div className="space-y-8 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Settings</h2>
        <p className="text-slate-500 dark:text-gray-400 text-sm">Configure global parameters and system preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'general', label: 'General Configuration', icon: Settings, active: true },
            { id: 'security', label: 'Security & Access', icon: Shield },
            { id: 'notifications', label: 'System Notifications', icon: Bell },
            { id: 'database', label: 'Data Management', icon: Database },
            { id: 'email', label: 'Email Services', icon: Mail },
          ].map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${item.active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800'
                }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">General Configuration</h3>
              <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Basic platform information and branding</p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Platform Name</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      defaultValue="DiracAI Exam Flow"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">Support Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      defaultValue="support@diracai.com"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 dark:text-gray-100 transition-all text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-gray-300 ml-1">System Maintenance Mode</label>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Settings size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Maintenance Mode</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">Disable all public access during updates</p>
                    </div>
                  </div>
                  <button className="w-12 h-6 bg-slate-200 dark:bg-gray-700 rounded-full relative transition-colors">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-gray-900/50 border-t border-slate-100 dark:border-gray-700 flex justify-end gap-4">
              <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all">
                Discard Changes
              </button>
              <button className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 font-bold text-sm">
                <Save size={18} />
                Save Configuration
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Danger Zone</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400">Critical system actions and data resets</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
              <div>
                <p className="text-sm font-bold text-red-900 dark:text-red-400">Clear System Cache</p>
                <p className="text-xs text-red-700 dark:text-red-500/70">This will force all users to re-authenticate</p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all">
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsContent;
