import React, { useState, useEffect } from 'react';
import { api } from '@/react-app/hooks/useApi';
import { Clock, Globe, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import DateTimeInput from '@/react-app/components/common/DateTimeInput';

interface Timezone {
  value: string;
  label: string;
  offset: string;
  utc_offset: string;
}

interface ExamSchedulingModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: number;
  examTitle: string;
  onScheduleUpdate?: () => void;
}

export default function ExamSchedulingModal({ isOpen, onClose, examId, examTitle, onScheduleUpdate }: ExamSchedulingModalProps) {
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    timezone: 'UTC',
    start_date: '',
    end_date: '',
    grace_period_minutes: 0,
    buffer_time_minutes: 15,
    auto_start: true,
    auto_end: true,
    reschedule_allowed: false,
    max_reschedules: 0,
    reschedule_deadline: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadTimezones();
      loadExamScheduleInfo();
    }
  }, [isOpen, examId, loadTimezones, loadExamScheduleInfo]);

  const loadTimezones = React.useCallback(async () => {
    try {
      const response = await api.get('/exams/timezones/');
      setTimezones(response.data);
    } catch (error) {
      console.error('Error loading timezones:', error);
    }
  }, []);

  const loadExamScheduleInfo = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/exams/${examId}/schedule-info/`);
      const data = response.data;
      
      setFormData({
        timezone: data.timezone_info?.timezone || 'UTC',
        start_date: data.timezone_info?.start_date ? 
          new Date(data.timezone_info.start_date).toISOString().slice(0, 16) : '',
        end_date: data.timezone_info?.end_date ? 
          new Date(data.timezone_info.end_date).toISOString().slice(0, 16) : '',
        grace_period_minutes: data.scheduling_settings?.grace_period_minutes || 0,
        buffer_time_minutes: data.scheduling_settings?.buffer_time_minutes || 15,
        auto_start: data.scheduling_settings?.auto_start ?? true,
        auto_end: data.scheduling_settings?.auto_end ?? true,
        reschedule_allowed: data.scheduling_settings?.reschedule_allowed ?? false,
        max_reschedules: 0,
        reschedule_deadline: ''
      });
    } catch (error) {
      console.error('Error loading exam schedule info:', error);
      setError('Failed to load exam schedule information');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Convert local datetime to UTC for the selected timezone
      const timezone = formData.timezone;
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      const updateData = {
        timezone,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        grace_period_minutes: formData.grace_period_minutes,
        buffer_time_minutes: formData.buffer_time_minutes,
        auto_start: formData.auto_start,
        auto_end: formData.auto_end,
        reschedule_allowed: formData.reschedule_allowed,
        max_reschedules: formData.max_reschedules,
        reschedule_deadline: formData.reschedule_deadline ? 
          new Date(formData.reschedule_deadline).toISOString() : null
      };

      await api.patch(`/exams/${examId}/`, updateData);
      
      onScheduleUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error updating exam schedule:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
        : undefined;
      setError(errorMessage || 'Failed to update exam schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Exam Scheduling</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Configuring schedule for:</p>
            <p className="font-medium text-gray-900 dark:text-white">{examTitle}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Timezone Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.offset})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date & Time
                  </label>
                  <DateTimeInput
                    value={formData.start_date}
                    onChange={(v) => handleInputChange('start_date', v)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    End Date & Time
                  </label>
                  <DateTimeInput
                    value={formData.end_date}
                    onChange={(v) => handleInputChange('end_date', v)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Advanced Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Grace Period (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.grace_period_minutes}
                      onChange={(e) => handleInputChange('grace_period_minutes', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Extra time after end date
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Buffer Time (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.buffer_time_minutes}
                      onChange={(e) => handleInputChange('buffer_time_minutes', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Time before exam starts when students can access
                    </p>
                  </div>
                </div>

                {/* Auto Start/End */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto_start"
                      checked={formData.auto_start}
                      onChange={(e) => handleInputChange('auto_start', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="auto_start" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Automatically start exam at start date
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto_end"
                      checked={formData.auto_end}
                      onChange={(e) => handleInputChange('auto_end', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="auto_end" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Automatically end exam at end date
                    </label>
                  </div>
                </div>

                {/* Rescheduling Settings */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="reschedule_allowed"
                      checked={formData.reschedule_allowed}
                      onChange={(e) => handleInputChange('reschedule_allowed', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="reschedule_allowed" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Allow students to request rescheduling
                    </label>
                  </div>

                  {formData.reschedule_allowed && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Max Reschedules
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.max_reschedules}
                          onChange={(e) => handleInputChange('max_reschedules', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Reschedule Deadline
                        </label>
                        <DateTimeInput
                          value={formData.reschedule_deadline}
                          onChange={(v) => handleInputChange('reschedule_deadline', v)}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Schedule
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
