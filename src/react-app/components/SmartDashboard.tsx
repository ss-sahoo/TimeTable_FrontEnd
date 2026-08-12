import React from 'react';
import { Navigate } from 'react-router';
import { useAuthContext } from '../contexts/AuthContext';

export default function SmartDashboard() {
  const { user } = useAuthContext();

  // Route based on user role
  const normalizedRole = user?.role?.toLowerCase();

  if (normalizedRole === 'platform_owner') {
    return <Navigate to="/platform-owner/dashboard" replace />;
  } else if (normalizedRole === 'super_admin' || normalizedRole === 'superadmin') {
    return <Navigate to="/superadmin/dashboard" replace />;
  } else if (normalizedRole === 'student') {
    return <Navigate to="/student-dashboard" replace />;
  } else if (normalizedRole === 'teacher' || normalizedRole === 'exam_admin' || normalizedRole === 'TEACHER') {
    return <Navigate to="/teacher/dashboard" replace />;
  } else {
    // Default to admin dashboard (for institute_admin, ADMIN, etc.)
    return <Navigate to="/center-admin/dashboard" replace />;
  }
}
