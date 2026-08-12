import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Building2, Mail, Phone, Globe, MapPin, Users, Settings,
  Edit2, Save, X, CheckCircle, AlertCircle, Clock, Shield,
  Calendar, FileText, Activity, TrendingUp, Award, UserCheck
} from 'lucide-react';
import { api } from '../hooks/useApi';
import { useAuthContext } from '../contexts/AuthContext';

interface Institute {
  id: number;
  name: string;
  domain: string;
  description: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  logo: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
  active_user_count?: number;
}

interface InstituteSettings {
  id: number;
  allow_student_registration: boolean;
  require_email_verification: boolean;
  max_exam_duration: number;
  allow_exam_retakes: boolean;
  max_retake_attempts: number;
  exam_security_level: 'basic' | 'standard' | 'high';
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone: string;
  profile_picture: string | null;
  is_verified: boolean;
  created_at: string;
}

interface InstituteStats {
  total_users: number;
  active_users: number;
  total_exams: number;
  active_exams: number;
  total_students: number;
  total_teachers: number;
  total_admins: number;
}

export default function InstituteProfile() {
  const navigate = useNavigate();
  const { id: urlId } = useParams();
  const { user: currentUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'users' | 'stats'>('overview');
  const [isEditing, setIsEditing] = useState(false);

  const [institute, setInstitute] = useState<Institute | null>(null);
  const [settings, setSettings] = useState<InstituteSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<InstituteStats | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  });

  const [settingsFormData, setSettingsFormData] = useState({
    allow_student_registration: true,
    require_email_verification: true,
    max_exam_duration: 180,
    allow_exam_retakes: false,
    max_retake_attempts: 1,
    exam_security_level: 'standard' as 'basic' | 'standard' | 'high',
  });

  useEffect(() => {
    loadInstituteData();
  }, []);

  useEffect(() => {
    if (institute) {
      setFormData({
        name: institute.name || '',
        domain: institute.domain || '',
        description: institute.description || '',
        address: institute.address || '',
        contact_email: institute.contact_email || '',
        contact_phone: institute.contact_phone || '',
        website: institute.website || '',
      });
    }
  }, [institute]);

  useEffect(() => {
    if (settings) {
      setSettingsFormData({
        allow_student_registration: settings.allow_student_registration,
        require_email_verification: settings.require_email_verification,
        max_exam_duration: settings.max_exam_duration,
        allow_exam_retakes: settings.allow_exam_retakes,
        max_retake_attempts: settings.max_retake_attempts,
        exam_security_level: settings.exam_security_level,
      });
    }
  }, [settings]);

  const loadInstituteData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get institute ID from URL or currentUser
      const instituteId = urlId || currentUser?.institute?.id;

      if (!instituteId) {
        setError('No institute associated with your account');
        setLoading(false);
        return;
      }

      // Load institute details
      const instituteResponse = await api.get(`/auth/institutes/${instituteId}/`);
      setInstitute(instituteResponse.data);

      // Load institute settings
      try {
        const settingsResponse = await api.get('/auth/institute-settings/');
        setSettings(settingsResponse.data);
      } catch (err: any) {
        console.error('Error loading settings:', err);
      }

      // Load users if admin
      if (['super_admin', 'institute_admin', 'exam_admin'].includes(currentUser.role)) {
        try {
          const usersResponse = await api.get(`/auth/institutes/${instituteId}/users/`);
          // Handle both array and paginated response
          let usersData = usersResponse.data;
          if (!Array.isArray(usersData)) {
            usersData = usersData.results || [];
          }
          setUsers(usersData);
        } catch (err: any) {
          console.error('Error loading users:', err);
          setUsers([]); // Set empty array on error
        }
      }

      // Load stats
      await loadStats();
    } catch (err: any) {
      console.error('Error loading institute data:', err);
      setError('Failed to load institute data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from users data
      const instituteId = urlId || currentUser?.institute?.id;
      if (!instituteId) return;

      const usersResponse = await api.get(`/auth/institutes/${instituteId}/users/`);

      // Handle both array and paginated response
      let allUsers = usersResponse.data;
      if (!Array.isArray(allUsers)) {
        // If paginated, extract results array
        allUsers = allUsers.results || [];
      }

      const statsData: InstituteStats = {
        total_users: allUsers.length,
        active_users: allUsers.filter((u: User) => u.is_verified).length,
        total_exams: 0,
        active_exams: 0,
        total_students: allUsers.filter((u: User) => u.role === 'student').length,
        total_teachers: allUsers.filter((u: User) => u.role === 'teacher').length,
        total_admins: allUsers.filter((u: User) => ['super_admin', 'institute_admin', 'exam_admin'].includes(u.role)).length,
      };

      // Try to get exam stats
      try {
        const examsResponse = await api.get('/exams/exams/');
        let examsData = examsResponse.data;
        if (!Array.isArray(examsData)) {
          examsData = examsData.results || [];
        }
        statsData.total_exams = examsData.length;
        statsData.active_exams = examsData.filter((e: any) => e.status === 'active').length;
      } catch (err) {
        console.error('Error loading exam stats:', err);
      }

      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSettingsFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSaveInstitute = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const instituteId = urlId || currentUser?.institute?.id;
      if (!instituteId) {
        setError('No institute ID found');
        setSaving(false);
        return;
      }

      const response = await api.put(`/auth/institutes/${instituteId}/update/`, formData);
      setInstitute(response.data);
      setSuccess('Institute details updated successfully');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error saving institute:', err);
      setError(err.response?.data?.detail || 'Failed to save institute details');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await api.put('/auth/institute-settings/', settingsFormData);
      setSettings(response.data);
      setSuccess('Institute settings updated successfully');
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const userRoleLower = currentUser?.role?.toLowerCase();
  const canEdit = userRoleLower === 'super_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-600 dark:text-gray-400">Loading institute profile...</p>
        </div>
      </div>
    );
  }

  if (!institute) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Institute Not Found</h2>
          <p className="text-sm text-slate-600 dark:text-gray-400 mb-4">
            You are not associated with any institute
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-700 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Institute Profile</h1>
                <p className="text-sm text-slate-600 dark:text-gray-400">Manage your institute details and settings</p>
              </div>
            </div>
            {canEdit && activeTab === 'overview' && (
              <button
                onClick={() => {
                  if (isEditing) {
                    handleSaveInstitute();
                  } else {
                    setIsEditing(true);
                  }
                }}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </>
                )}
              </button>
            )}
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 rounded-md whitespace-nowrap text-sm font-medium transition-colors ${activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800'
                }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            {canEdit && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-md whitespace-nowrap text-sm font-medium transition-colors ${activeTab === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800'
                  }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Settings
              </button>
            )}
            {canEdit && (
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-2 rounded-md whitespace-nowrap text-sm font-medium transition-colors ${activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800'
                  }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Users
              </button>
            )}
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-2 rounded-md whitespace-nowrap text-sm font-medium transition-colors ${activeTab === 'stats'
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800'
                }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Statistics
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Institute Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold mb-2"
                      placeholder="Institute Name"
                    />
                  ) : (
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{institute.name}</h2>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {institute.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    {institute.is_active && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md text-xs">
                        <Activity className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Description */}
              <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <FileText className="w-4 h-4" />
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="Institute description"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    {institute.description || 'No description available'}
                  </p>
                )}
              </div>

              {/* Contact Email */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <Mail className="w-4 h-4" />
                  Contact Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="contact@institute.edu"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-gray-400">{institute.contact_email}</p>
                )}
              </div>

              {/* Contact Phone */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <Phone className="w-4 h-4" />
                  Contact Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="+1234567890"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    {institute.contact_phone || 'Not provided'}
                  </p>
                )}
              </div>

              {/* Website */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <Globe className="w-4 h-4" />
                  Website
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="https://institute.edu"
                  />
                ) : (
                  <a
                    href={institute.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {institute.website || 'Not provided'}
                  </a>
                )}
              </div>

              {/* Domain */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <Shield className="w-4 h-4" />
                  Email Domain
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="domain"
                    value={formData.domain}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="institute.edu"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    {institute.domain || 'Not set'}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="Institute address"
                  />
                ) : (
                  <p className="text-sm text-slate-600 dark:text-gray-400">
                    {institute.address || 'Not provided'}
                  </p>
                )}
              </div>

              {/* Created Date */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <Calendar className="w-4 h-4" />
                  Created Date
                </label>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  {new Date(institute.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Last Updated */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <Clock className="w-4 h-4" />
                  Last Updated
                </label>
                <p className="text-sm text-slate-600 dark:text-gray-400">
                  {new Date(institute.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Institute Settings</h3>

              <div className="space-y-4">
                {/* Student Registration */}
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Student Registration</p>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Students can self-register to your institute</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="allow_student_registration"
                      checked={settingsFormData.allow_student_registration}
                      onChange={handleSettingsChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Email Verification */}
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Require Email Verification</p>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Users must verify their email to access exams</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="require_email_verification"
                      checked={settingsFormData.require_email_verification}
                      onChange={handleSettingsChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Exam Retakes */}
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Allow Exam Retakes</p>
                    <p className="text-xs text-slate-600 dark:text-gray-400">Students can retake failed exams</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="allow_exam_retakes"
                      checked={settingsFormData.allow_exam_retakes}
                      onChange={handleSettingsChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Max Exam Duration */}
                <div className="py-3 border-b border-slate-200 dark:border-gray-700">
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                    Maximum Exam Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="max_exam_duration"
                    value={settingsFormData.max_exam_duration}
                    onChange={handleSettingsChange}
                    min="1"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                {/* Max Retake Attempts */}
                {settingsFormData.allow_exam_retakes && (
                  <div className="py-3 border-b border-slate-200 dark:border-gray-700">
                    <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                      Maximum Retake Attempts
                    </label>
                    <input
                      type="number"
                      name="max_retake_attempts"
                      value={settingsFormData.max_retake_attempts}
                      onChange={handleSettingsChange}
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                )}

                {/* Security Level */}
                <div className="py-3">
                  <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                    Exam Security Level
                  </label>
                  <select
                    name="exam_security_level"
                    value={settingsFormData.exam_security_level}
                    onChange={handleSettingsChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Institute Users</h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900 dark:text-white">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(users) && users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 dark:border-gray-700 last:border-0">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {user.first_name} {user.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-gray-400">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs capitalize">
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.is_verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(!Array.isArray(users) || users.length === 0) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 opacity-80" />
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{stats.total_users}</p>
                <p className="text-sm opacity-90">Total Users</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <UserCheck className="w-8 h-8 opacity-80" />
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{stats.active_users}</p>
                <p className="text-sm opacity-90">Active Users</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-8 h-8 opacity-80" />
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{stats.total_exams}</p>
                <p className="text-sm opacity-90">Total Exams</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-8 h-8 opacity-80" />
                  <Activity className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{stats.active_exams}</p>
                <p className="text-sm opacity-90">Active Exams</p>
              </div>
            </div>

            {/* User Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">User Distribution</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-gray-400">Students</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(stats.total_students / stats.total_users) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                      {stats.total_students}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-gray-400">Teachers</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full"
                        style={{ width: `${(stats.total_teachers / stats.total_users) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                      {stats.total_teachers}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-gray-400">Admins</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${(stats.total_admins / stats.total_users) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white w-12 text-right">
                      {stats.total_admins}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

