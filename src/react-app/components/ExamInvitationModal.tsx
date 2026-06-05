import React, { useState } from 'react';
import { X, Mail, Send, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { api, getErrorMessage } from '@/react-app/hooks/useApi';

interface ExamInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: number;
  examTitle: string;
  onSuccess: () => void;
}

interface CreatedInvitation {
  id: number;
  email: string;
  [key: string]: unknown;
}

interface InvitationResult {
  created_count: number;
  failed_count: number;
  created_invitations: CreatedInvitation[];
  failed_invitations: { email: string; error: string }[];
}

const ExamInvitationModal: React.FC<ExamInvitationModalProps> = ({
  isOpen,
  onClose,
  examId,
  examTitle,
  onSuccess
}) => {
  const [studentEmails, setStudentEmails] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [sendReminder, setSendReminder] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [invitationResult, setInvitationResult] = useState<InvitationResult | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentEmails.trim()) {
      setError('Please enter at least one student email');
      return;
    }

    const emails = studentEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (emails.length === 0) {
      setError('Please enter valid email addresses');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setInvitationResult(null);

    try {
      const response = await api.post(`/exams/${examId}/invitations/send/`, {
        student_emails: emails,
        custom_message: customMessage,
        send_reminder: sendReminder
      });

      setInvitationResult(response.data);
      setSuccess(true);
      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send invitations'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStudentEmails('');
    setCustomMessage('');
    setSendReminder(false);
    setError(null);
    setSuccess(false);
    setInvitationResult(null);
    onClose();
  };

  const handleResendReminders = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post(`/exams/${examId}/reminders/`);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to send reminders'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Exam Invitations</h2>
              <p className="text-sm text-gray-600">{examTitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Emails */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Email Addresses
                </label>
                <textarea
                  value={studentEmails}
                  onChange={(e) => setStudentEmails(e.target.value)}
                  placeholder="Enter email addresses, one per line:&#10;student1@example.com&#10;student2@example.com&#10;student3@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter one email address per line. Maximum 100 students per batch.
                </p>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add a personal message to include in the invitation email..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customMessage.length}/1000 characters
                </p>
              </div>

              {/* Send Reminder Option */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="sendReminder"
                  checked={sendReminder}
                  onChange={(e) => setSendReminder(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="sendReminder" className="text-sm text-gray-700">
                  Send reminder emails to students who don't respond
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Sending...' : 'Send Invitations'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Invitations Sent Successfully!</h3>
                  <p className="text-sm text-green-700">
                    {invitationResult?.created_count || 0} invitations sent, {invitationResult?.failed_count || 0} failed
                  </p>
                </div>
              </div>

              {/* Results Summary */}
              {invitationResult && (
                <div className="space-y-4">
                  {/* Successful Invitations */}
                  {invitationResult.created_invitations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        ✅ Successful Invitations ({invitationResult.created_invitations.length})
                      </h4>
                      <div className="space-y-1">
                        {invitationResult.created_invitations.map((invitation, index) => (
                          <div key={index} className="text-sm text-gray-600 bg-green-50 p-2 rounded">
                            {invitation.student_email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed Invitations */}
                  {invitationResult.failed_invitations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        ❌ Failed Invitations ({invitationResult.failed_invitations.length})
                      </h4>
                      <div className="space-y-1">
                        {invitationResult.failed_invitations.map((failure, index) => (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            <strong>{failure.email}:</strong> {failure.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button
                  onClick={handleResendReminders}
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Send Reminders</span>
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamInvitationModal;
