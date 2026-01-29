import React from 'react';
import { Navigate } from 'react-router';
import { useAuthContext } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import StudentDashboard from '../pages/StudentDashboard';
import TeacherDashboard from '../pages/TeacherDashboard';

export default function SmartDashboard() {
  const { user } = useAuthContext();

  // Route based on user role
  const normalizedRole = user?.role?.toLowerCase();

  if (normalizedRole === 'super_admin' || normalizedRole === 'superadmin') {
    return <Navigate to="/superadmin/dashboard" replace />;
  } else if (normalizedRole === 'student') {
    return <StudentDashboard />;
  } else if (normalizedRole === 'teacher' || normalizedRole === 'exam_admin') {
    return <TeacherDashboard />;
  }

  // Default to admin dashboard (for institute_admin, ADMIN, etc.)
  return <Dashboard />;
}
