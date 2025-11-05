import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import Dashboard from '../pages/Dashboard';
import StudentDashboard from '../pages/StudentDashboard';
import TeacherDashboard from '../pages/TeacherDashboard';

export default function SmartDashboard() {
  const { user } = useAuthContext();

  // Route based on user role
  if (user?.role === 'student') {
    return <StudentDashboard />;
  } else if (user?.role === 'teacher' || user?.role === 'exam_admin') {
    return <TeacherDashboard />;
  }

  // Default to admin dashboard for super_admin and institute_admin
  return <Dashboard />;
}
