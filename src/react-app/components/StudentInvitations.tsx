import React, { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, Calendar, BookOpen } from 'lucide-react';
import { api, getErrorMessage } from '@/react-app/hooks/useApi';

interface Invitation {
  id: number;
  exam: number;
  exam_title: string;
  student: number;
  student_name: string;
  student_email: string;
  invited_by: number;
  invited_by_name: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invited_at: string;
  accepted_at?: string;
  declined_at?: string;
  custom_message?: string;
  decline_reason?: string;
  invitation_token: string;
}

const StudentInvitations: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/exams/invitations/student/');
      setInvitations(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load invitations'));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      setActionLoading(invitationId);
      await api.post(`/exams/invitations/${invitationId}/accept/`);
      await loadInvitations();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to accept invitation'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineInvitation = async (invitationId: number, reason: string) => {
    try {
      setActionLoading(invitationId);
      await api.post(`/exams/invitations/${invitationId}/decline/`, {
        reason: reason
      });
      await loadInvitations();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to decline invitation'));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'accepted':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'declined':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'expired':
        return 'bg-gray-50 border-gray-200 text-gray-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadInvitations}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Invitations</h3>
        <p className="text-gray-600">You don't have any exam invitations at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {invitation.exam_title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Invited by {invitation.invited_by_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-4">
                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invitation.status)}`}>
                  {getStatusIcon(invitation.status)}
                  <span className="capitalize">{invitation.status}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Invited {formatDate(invitation.invited_at)}</span>
                </div>
              </div>

              {invitation.custom_message && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Personal Message:</strong> {invitation.custom_message}
                  </p>
                </div>
              )}

              {invitation.decline_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">
                    <strong>Decline Reason:</strong> {invitation.decline_reason}
                  </p>
                </div>
              )}

              {invitation.status === 'accepted' && invitation.accepted_at && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>Accepted:</strong> {formatDate(invitation.accepted_at)}
                  </p>
                </div>
              )}

              {invitation.status === 'declined' && invitation.declined_at && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">
                    <strong>Declined:</strong> {formatDate(invitation.declined_at)}
                  </p>
                </div>
              )}
            </div>

            {invitation.status === 'pending' && (
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleAcceptInvitation(invitation.id)}
                  disabled={actionLoading === invitation.id}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === invitation.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Accept</span>
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Please provide a reason for declining (optional):');
                    if (reason !== null) {
                      handleDeclineInvitation(invitation.id, reason);
                    }
                  }}
                  disabled={actionLoading === invitation.id}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionLoading === invitation.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>Decline</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentInvitations;
