import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff,
  Key,
  Building2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { api } from '../hooks/useApi';

interface UserSettings {
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    bio: string;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    date_format: string;
    notifications: {
      email: boolean;
      push: boolean;
      exam_reminders: boolean;
      result_notifications: boolean;
      system_updates: boolean;
    };
  };
  security: {
    two_factor_enabled: boolean;
    login_notifications: boolean;
    session_timeout: number;
  };
  institute: {
    name: string;
    domain: string;
    address: string;
    phone: string;
    website: string;
  };
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string>('');

  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone_number: '',
      bio: ''
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      date_format: 'MM/DD/YYYY',
      notifications: {
        email: true,
        push: true,
        exam_reminders: true,
        result_notifications: true,
        system_updates: false
      }
    },
    security: {
      two_factor_enabled: false,
      login_notifications: true,
      session_timeout: 30
    },
    institute: {
      name: user?.institute_name || '',
      domain: '',
      address: '',
      phone: '',
      website: ''
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'preferences', name: 'Preferences', icon: SettingsIcon },
    { id: 'security', name: 'Security', icon: Shield },
    ...(user?.role?.toLowerCase() === 'super_admin' || user?.role?.toLowerCase() === 'institute_admin'
      ? [{ id: 'institute-redirect', name: 'Institute', icon: Building2 }]
      : [{ id: 'institute', name: 'Institute', icon: Building2 }])
  ];

  const handleInputChange = (section: keyof UserSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNestedInputChange = (section: keyof UserSettings, parent: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parent]: {
          ...(prev[section] as any)[parent],
          [field]: value
        }
      }
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!settings.profile.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!settings.profile.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!settings.profile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(settings.profile.email)) {
      newErrors.email = 'Email is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await api.patch('/auth/users/me/', settings.profile);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!passwordForm.current_password) {
      newErrors.current_password = 'Current password is required';
    }

    if (!passwordForm.new_password) {
      newErrors.new_password = 'New password is required';
    } else if (passwordForm.new_password.length < 8) {
      newErrors.new_password = 'Password must be at least 8 characters';
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      await api.post('/auth/change-password/', passwordForm);
      setSuccess('Password changed successfully!');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to change password:', error);
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/users/me/preferences/', settings.preferences);
      setSuccess('Preferences updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInstituteSave = async () => {
    setSaving(true);
    try {
      await api.patch('/institutes/me/', settings.institute);
      setSuccess('Institute settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Failed to update institute:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Settings</h1>
          <p className="text-sm text-slate-600 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === 'institute-redirect') {
                          navigate('/institute-profile');
                        } else {
                          setActiveTab(tab.id);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-100'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Profile Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={settings.profile.first_name}
                      onChange={(e) => handleInputChange('profile', 'first_name', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.first_name ? 'border-red-300' : 'border-slate-300'
                        }`}
                    />
                    {errors.first_name && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={settings.profile.last_name}
                      onChange={(e) => handleInputChange('profile', 'last_name', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.last_name ? 'border-red-300' : 'border-slate-300'
                        }`}
                    />
                    {errors.last_name && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.last_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => handleInputChange('profile', 'email', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-300' : 'border-slate-300'
                        }`}
                    />
                    {errors.email && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={settings.profile.phone_number}
                      onChange={(e) => handleInputChange('profile', 'phone_number', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bio</label>
                  <textarea
                    value={settings.profile.bio}
                    onChange={(e) => handleInputChange('profile', 'bio', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                {/* Theme & Language */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Appearance</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Theme</label>
                      <select
                        value={settings.preferences.theme}
                        onChange={(e) => handleInputChange('preferences', 'theme', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Language</label>
                      <select
                        value={settings.preferences.language}
                        onChange={(e) => handleInputChange('preferences', 'language', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Timezone</label>
                      <select
                        value={settings.preferences.timezone}
                        onChange={(e) => handleInputChange('preferences', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Asia/Kolkata">India Standard Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Date Format</label>
                      <select
                        value={settings.preferences.date_format}
                        onChange={(e) => handleInputChange('preferences', 'date_format', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-orange-600" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Notifications</h2>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(settings.preferences.notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-gray-100">
                            {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-gray-400">
                            {key === 'email' && 'Receive notifications via email'}
                            {key === 'push' && 'Receive push notifications'}
                            {key === 'exam_reminders' && 'Get reminded before exams'}
                            {key === 'result_notifications' && 'Notify when results are published'}
                            {key === 'system_updates' && 'Receive system update notifications'}
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => handleNestedInputChange('preferences', 'notifications', key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handlePreferencesSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Change Password */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5 text-red-600" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Change Password</h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.current_password}
                          onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                          className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.current_password ? 'border-red-300' : 'border-slate-300'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                        </button>
                      </div>
                      {errors.current_password && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.current_password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.new_password}
                        onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.new_password ? 'border-red-300' : 'border-slate-300'
                          }`}
                      />
                      {errors.new_password && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.new_password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirm_password}
                        onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.confirm_password ? 'border-red-300' : 'border-slate-300'
                          }`}
                      />
                      {errors.confirm_password && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {errors.confirm_password}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handlePasswordSave}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Security Settings</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-gray-100">Two-Factor Authentication</div>
                        <div className="text-xs text-slate-600 dark:text-gray-400">Add an extra layer of security to your account</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.two_factor_enabled}
                          onChange={(e) => handleInputChange('security', 'two_factor_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-gray-100">Login Notifications</div>
                        <div className="text-xs text-slate-600 dark:text-gray-400">Get notified when someone logs into your account</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.security.login_notifications}
                          onChange={(e) => handleInputChange('security', 'login_notifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={settings.security.session_timeout}
                        onChange={(e) => handleInputChange('security', 'session_timeout', parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        min="5"
                        max="480"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Institute Tab */}
            {activeTab === 'institute' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100">Institute Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Institute Name</label>
                    <input
                      type="text"
                      value={settings.institute.name}
                      onChange={(e) => handleInputChange('institute', 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Domain</label>
                    <input
                      type="text"
                      value={settings.institute.domain}
                      onChange={(e) => handleInputChange('institute', 'domain', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={settings.institute.phone}
                      onChange={(e) => handleInputChange('institute', 'phone', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={settings.institute.website}
                      onChange={(e) => handleInputChange('institute', 'website', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                  <textarea
                    value={settings.institute.address}
                    onChange={(e) => handleInputChange('institute', 'address', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Enter institute address..."
                  />
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleInstituteSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Institute Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
