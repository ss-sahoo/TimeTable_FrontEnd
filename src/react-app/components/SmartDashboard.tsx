import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import StudentDashboard from '../pages/StudentDashboard';
import TeacherDashboard from '../pages/TeacherDashboard';

export default function SmartDashboard() {
  const { user } = useAuthContext();

  // Redirect super admins to their dedicated dashboard
  if (user?.role === 'super_admin' || user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  // Redirect center admins to their dedicated dashboard
  if (user?.role === 'admin' || user?.role === 'ADMIN' || user?.role === 'institute_admin') {
    return <Navigate to="/center-admin/dashboard" replace />;
  }

  // Route based on user role
  if (user?.role === 'student' || user?.role === 'STUDENT') {
    return <StudentDashboard />;
  } else if (user?.role === 'teacher' || user?.role === 'TEACHER' || user?.role === 'exam_admin') {
    return <TeacherDashboard />;
  }

  // Default to admin dashboard
  return <Dashboard />;
}
