import React from 'react';
import { Navigate } from 'react-router';
import { useAuthContext } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import StudentDashboard from '../pages/StudentDashboard';
import TeacherDashboard from '../pages/TeacherDashboard';

export default function SmartDashboard() {
  const { user } = useAuthContext();

  // Route based on user role
  if (user?.role === 'super_admin' || user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/superadmin/dashboard" replace />;
  } else if (user?.role === 'student' || user?.role === 'STUDENT') {
    return <StudentDashboard />;
  } else if (user?.role === 'teacher' || user?.role === 'TEACHER' || user?.role === 'exam_admin') {
    return <TeacherDashboard />;
  }

  // Default to admin dashboard (for institute_admin, ADMIN, etc.)
  return <Dashboard />;
}
