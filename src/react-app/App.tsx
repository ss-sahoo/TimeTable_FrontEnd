import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router";
import { AuthProvider, useAuthContext } from "@/react-app/contexts/AuthContext";
import { ThemeProvider } from "@/react-app/contexts/ThemeContext";
import { OnboardingTourProvider } from "@/react-app/contexts/OnboardingTourContext";
import Layout from "@/react-app/components/Layout";
import Login from "@/react-app/pages/Login";
import Register from "@/react-app/pages/Register";
import ForgotPassword from "@/react-app/pages/ForgotPassword";
import ResetPassword from "@/react-app/pages/ResetPassword";
import Onboarding from "@/react-app/pages/Onboarding";
import SmartDashboard from "@/react-app/components/SmartDashboard";
import ExamSetupDetails from "@/react-app/pages/ExamSetupDetails";
import EnhancedQuestionEditor from "@/react-app/pages/EnhancedQuestionEditor";
import StudentExamView from "@/react-app/pages/StudentExamView";
import ExamCreation from "@/react-app/pages/ExamCreationNew";
import ExamManagement from "@/react-app/pages/ExamManagementNew";
import ExamView from "@/react-app/pages/ExamView";
import PatternManagement from "@/react-app/pages/PatternManagement";
import PatternCreation from "@/react-app/pages/PatternCreation";
import PatternView from "@/react-app/pages/PatternView";
import QuestionCreation from "@/react-app/pages/QuestionCreation";
import QuestionCreationEnhanced from "@/react-app/pages/QuestionCreationEnhanced";
import QuestionManagement from "@/react-app/pages/QuestionManagement";
import AIAssistant from "@/react-app/pages/AIAssistant";
import Users from "@/react-app/pages/Users";
import Settings from "@/react-app/pages/Settings";
import StudentDashboard from "@/react-app/pages/StudentDashboard";
// Import new admin components
import AdminHomeContent from "./components/admin/AdminHomeContent";
import AdminPeopleContent from "./components/admin/AdminPeopleContent";
import AdminBatchesContent from "./components/admin/AdminBatchesContent";
import StudentAnalytics from "@/react-app/pages/StudentAnalytics";
import StudentAnalyticsOverview from "@/react-app/pages/StudentAnalyticsOverview";
import StudentExamList from "@/react-app/pages/StudentExamList";
import ExamAccess from "@/react-app/pages/ExamAccess";
import ExamSetup from "@/react-app/pages/ExamSetup";
import SecureExamExperience from "@/react-app/pages/SecureExamExperience";
import ExamResults from "@/react-app/pages/ExamResults";
import AdminExamResults from "@/react-app/pages/AdminExamResults";
import ExamResultsByExamId from "@/react-app/pages/ExamResultsByExamId";
import TestResults from "@/react-app/pages/TestResults";
import ViolationDashboard from "@/react-app/pages/ViolationDashboard";
import ActivityLogs from "@/react-app/pages/ActivityLogs";
import ExamAnalytics from "@/react-app/pages/ExamAnalytics";
import Results from "@/react-app/pages/Results";
import ExamReview from "@/react-app/pages/ExamReview";
import ExamResultsAnalyticsEnhanced from "@/react-app/pages/ExamResultsAnalyticsEnhanced";
import ExamAnalyticsDashboard from "@/react-app/pages/ExamAnalyticsDashboard";
import StatisticsPage from "@/react-app/pages/analytics/StatisticsPage";
import HeatMapPage from "@/react-app/pages/analytics/HeatMapPage";
import HistogramPage from "@/react-app/pages/analytics/HistogramPage";
import BoxPlotPage from "@/react-app/pages/analytics/BoxPlotPage";
import QuestionsPage from "@/react-app/pages/analytics/QuestionsPage";
import EvaluationPage from "@/react-app/pages/analytics/EvaluationPage";
import GraphsPage from "@/react-app/pages/analytics/GraphsPage";
import StudentsPage from "@/react-app/pages/analytics/StudentsPage";
import StudentDetailPage from "@/react-app/pages/analytics/StudentDetailPage";
import PublicExamAccess from "@/react-app/pages/PublicExamAccess";
import TeacherAnalytics from "@/react-app/pages/TeacherAnalytics";
import TeacherEvaluationDashboard from "@/react-app/pages/TeacherEvaluationDashboard";
import InstituteProfile from "@/react-app/pages/InstituteProfile";
import LandingPageEnhanced from "@/react-app/pages/LandingPageEnhanced";
import ProctoringDiagnostics from "@/react-app/pages/ProctoringDiagnostics";
import PlatformDashboard from './pages/PlatformDashboard';
import PlatformInstitutes from './pages/PlatformInstitutes';
import PlatformInvoices from './pages/Finance/PlatformInvoices';
import SuperAdminBilling from './pages/Finance/SuperAdminBilling';

import ProctoringSnapshotsView from "@/react-app/pages/ProctoringSnapshotsView";
import ProctoringTestPage from "@/react-app/pages/ProctoringTestPage";
import BulkImportPage from "@/react-app/pages/BulkImportPage";
import NewSuperAdminDashboard from "@/react-app/pages/NewSuperAdminDashboard";
import InstituteAndCentersContent from "@/react-app/components/superadmin/InstituteAndCentersContent";
import CenterAdminDashboard from "@/react-app/pages/CenterAdminDashboard";
import Timetable from "@/react-app/pages/Timetable";
import TimetableDashboard from "@/react-app/pages/TimetableDashboard";
import Batches from "@/react-app/pages/Batches";
import ExamHub from "@/react-app/pages/ExamHub";
import SuperAdminLayout from "@/react-app/components/superadmin/SuperAdminLayout";
import PlatformOwnerLayout from "@/react-app/components/PlatformOwnerLayout";
import CenterAdminLayout from "@/react-app/components/admin/CenterAdminLayout";
import TeacherLayout from "@/react-app/components/teacher/TeacherLayout";
import StudentLayout from "@/react-app/components/student/StudentLayout";
import TeacherHomeContent from "@/react-app/components/teacher/TeacherHomeContent";
import CentersContent from "@/react-app/components/superadmin/CentersContent";
import UsersContent from "@/react-app/components/superadmin/UsersContent";
import ExamsContent from "@/react-app/components/superadmin/ExamsContent";
import BatchesContent from "@/react-app/components/superadmin/BatchesContent";
import TimetableContent from "@/react-app/components/superadmin/TimetableContent";
import SettingsContent from "@/react-app/components/superadmin/SettingsContent";
import ProfileContent from "@/react-app/components/superadmin/ProfileContent";
import {
  AdminRoleDashboard,
  StaffDashboard,
} from "@/react-app/pages/RoleDashboards";
import Timetablelanding from "./pages/TimeTablelanding";
import TimetableLogin from "./pages/TimetableLogin";
import TimetableRegister from "./pages/TimetableRegister";
import ManagerDashboard from "./pages/ManagerDashboard";
import ExtractionV3Page from "@/react-app/pages/ExtractionV3";
import ExtractionReviewPage from "@/react-app/pages/ExtractionV3/Review";
import AnswerKeyUploadPage from "@/react-app/pages/AnswerKeyUpload";
import ExtractionV2Page from "@/react-app/pages/ExtractionNew/ExtractionV2Page";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

// Fullscreen Protected Route (no Layout - for exams)
function FullscreenProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

// Role-based Redirect Component
function RoleBasedRedirect({ children, targetPath }: { children: React.ReactNode, targetPath: string }) {
  const { user, isAuthenticated, loading } = useAuthContext();
  const location = useLocation();

  if (loading) return null;

  if (isAuthenticated && (user?.role?.toUpperCase() === 'SUPER_ADMIN' || user?.role?.toUpperCase() === 'SUPERADMIN')) {
    // Handle dynamic paths
    let path = targetPath;
    if (targetPath.includes(':')) {
      // This is a bit complex for a simple component, but we can handle common cases
      // For now, let's just use the current pathname if it matches the pattern
      path = location.pathname.startsWith('/superadmin') ? location.pathname : `/superadmin${location.pathname}`;
      return <Navigate to={path} replace />;
    }
    return <Navigate to={`/superadmin${targetPath}`} replace />;
  }

  return <>{children}</>;
}

// Role-based Protected Route Component
function RoleProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { isAuthenticated, loading, user } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user?.role || '')) {
    // If student tries to access teacher/admin routes, redirect to student dashboard
    if (user?.role === 'student') {
      return <Navigate to="/student-dashboard" replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">You don't have permission to access this page.</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}



// Helper function to get dashboard route based on role and domain
// NOTE: This does NOT redirect to /onboarding — onboarding is only triggered
// explicitly by the Google auth flow (via onboarding_required flag in Login.tsx).
// Email/password users who have no institute should still reach their dashboard.
function getDashboardRoute(user: any): string {
  // For timetable domain, always go to timetable page regardless of role
  if (typeof window !== 'undefined' && window.location.hostname === 'timetable.dashoapp.com') {
    return '/timetable';
  }

  // Handle string role for backward compatibility or accidental usage
  const role = typeof user === 'string' ? user : user?.role;
  const normalizedRole = role?.toLowerCase();

  switch (normalizedRole) {
    case 'platform_owner':
      return '/platform-owner/dashboard';
    case 'manager':
      return '/manager';
    case 'super_admin':
    case 'superadmin':
      return '/superadmin/dashboard';
    case 'admin':
    case 'institute_admin':
    case 'center_admin':
      return '/center-admin/dashboard';
    case 'student':
      return '/student-dashboard';
    case 'teacher':
      return '/teacher';
    case 'staff':
      return '/staff';
    default:
      return '/dashboard';
  }
}

// Public Route Component (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to={getDashboardRoute(user)} replace /> : children;
}

import { TimetableCenterProvider } from "@/react-app/contexts/TimetableCenterContext";

// Login Route Component (show domain-specific login page)
function LoginRoute() {
  const { isAuthenticated, loading, user } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  // Domain-based login page selection
  const hostname = window.location.hostname;
  if (hostname === 'timetable.dashoapp.com') {
    return <TimetableLogin />;
  }

  // Default: exams.dashoapp.com or any other domain shows the exam login page
  return <Login />;
}

// Register Route Component (show domain-specific register page)
function RegisterRoute() {
  const { isAuthenticated, loading, user } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  // Domain-based register page selection
  const hostname = window.location.hostname;
  if (hostname === 'timetable.dashoapp.com') {
    return <TimetableRegister />;
  }

  // Default: exams.dashoapp.com or any other domain shows the exam register page
  return <Register />;
}

// Landing Route Component (show landing page if not authenticated, dashboard if authenticated)
// Also handles domain-based landing page selection
function LandingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardRoute(user)} replace />;
  }

  // Domain-based landing page selection
  const hostname = window.location.hostname;
  if (hostname === 'timetable.dashoapp.com') {
    return <Timetablelanding />;
  }

  // Default: exams.dashoapp.com or any other domain shows the exam landing page
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/platform-owner/*" element={
        <FullscreenProtectedRoute>
          <PlatformOwnerLayout>
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<PlatformDashboard />} />
              <Route path="institutes" element={<PlatformInstitutes />} />
              <Route path="users" element={<UsersContent />} />
              <Route path="settings" element={<SettingsContent />} />
              <Route path="finance/platform-invoices" element={<PlatformInvoices />} />
              
              <Route path="profile" element={<ProfileContent />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </PlatformOwnerLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/register" element={<RegisterRoute />} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password/:uid/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Onboarding Route - Semi-protected (logged in but no institute) */}
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Public Exam Access Route */}
      <Route path="/public-exam/:token" element={<PublicExamAccess />} />

      <Route path="/Timetablelanding" element={<Timetablelanding />} />


      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          {typeof window !== 'undefined' && window.location.hostname === 'timetable.dashoapp.com' ?
            <Navigate to="/timetable" replace /> :
            <SmartDashboard />
          }
        </ProtectedRoute>
      } />

      {/* Role-specific dashboards */}
      <Route path="/superadmin/*" element={
        <FullscreenProtectedRoute>
          <SuperAdminLayout>
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<NewSuperAdminDashboard />} />
              <Route path="users" element={<UsersContent />} />
              <Route path="institutes" element={<InstituteAndCentersContent />} />
              <Route path="exams" element={<ExamsContent />} />
              <Route path="exams/create" element={<ExamCreation />} />
              <Route path="exams/:examId/edit" element={<ExamCreation />} />
              <Route path="exams/:examId" element={<ExamView />} />
              <Route path="exams/:examId/analytics" element={<ExamAnalytics />} />
              <Route path="exams/:examId/results-analytics" element={<ExamResultsAnalyticsEnhanced />} />
              <Route path="exams/:examId/results-analytics/*" element={<ExamAnalyticsDashboard />}>
                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="heatmap" element={<HeatMapPage />} />
                <Route path="histogram" element={<HistogramPage />} />
                <Route path="boxplot" element={<BoxPlotPage />} />
                <Route path="questions" element={<QuestionsPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="student/:studentId" element={<StudentDetailPage />} />
                <Route path="evaluation" element={<EvaluationPage />} />
                <Route path="graphs" element={<GraphsPage />} />
              </Route>
              <Route path="exams/:examId/evaluation" element={<TeacherEvaluationDashboard />} />
              <Route path="exam-results/:attemptId" element={<ExamResults />} />
              <Route path="exams/:examId/results" element={<AdminExamResults />} />
              <Route path="exam-review/:attemptId" element={<ExamReview />} />
              <Route path="proctoring-snapshots/:attemptId" element={<ProctoringSnapshotsView />} />
              <Route path="violation-dashboard" element={<ViolationDashboard />} />
              <Route path="patterns" element={<ExamsContent />} />
              <Route path="patterns/create" element={<PatternCreation />} />
              <Route path="patterns/:id/edit" element={<PatternCreation />} />
              <Route path="patterns/:patternId/view" element={<PatternView />} />
              <Route path="patterns/:patternId/questions/create" element={<QuestionCreation />} />
              <Route path="patterns/:patternId/sections/:sectionId/questions/create" element={<QuestionCreation />} />
              <Route path="pattern/:patternId/sections/:sectionId/questions/create" element={<QuestionCreation />} />
              <Route path="pattern/:patternId/question/:subjectSlug/:questionNumber" element={<QuestionCreationEnhanced />} />
              <Route path="pattern/:patternId/question/:questionNumber" element={<QuestionCreationEnhanced />} />
              <Route path="exam/:examId/pattern/:patternId/bulk-import" element={<BulkImportPage />} />
              <Route path="questions" element={<QuestionManagement />} />
              <Route path="batches" element={<BatchesContent />} />
              <Route path="timetable" element={<TimetableContent />} />
              <Route path="billing" element={<SuperAdminBilling />} />
              <Route path="activity-logs" element={<ActivityLogs />} />
              <Route path="settings" element={<SettingsContent />} />
              <Route path="finance/platform-invoices" element={<PlatformInvoices />} />
              
              <Route path="profile" element={<ProfileContent />} />
              <Route path="*" element={<Navigate to="/superadmin/dashboard" replace />} />
            </Routes>
          </SuperAdminLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/center-admin/*" element={
        <FullscreenProtectedRoute>
          <CenterAdminLayout>
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminHomeContent />} />
              <Route path="exams" element={<ExamHub />} />
              <Route path="exams/create" element={<ExamCreation />} />
              <Route path="exams/:examId/edit" element={<ExamCreation />} />
              <Route path="exams/:examId" element={<ExamView />} />
              <Route path="exams/:examId/analytics" element={<ExamAnalytics />} />
              <Route path="exams/:examId/results-analytics" element={<ExamResultsAnalyticsEnhanced />} />
              <Route path="exams/:examId/results-analytics/*" element={<ExamAnalyticsDashboard />}>
                <Route path="statistics" element={<StatisticsPage />} />
                <Route path="heatmap" element={<HeatMapPage />} />
                <Route path="histogram" element={<HistogramPage />} />
                <Route path="boxplot" element={<BoxPlotPage />} />
                <Route path="questions" element={<QuestionsPage />} />
                <Route path="students" element={<StudentsPage />} />
                <Route path="student/:studentId" element={<StudentDetailPage />} />
                <Route path="evaluation" element={<EvaluationPage />} />
                <Route path="graphs" element={<GraphsPage />} />
              </Route>
              <Route path="exams/:examId/evaluation" element={<TeacherEvaluationDashboard />} />
              <Route path="exam-results/:attemptId" element={<ExamResults />} />
              <Route path="exams/:examId/results" element={<AdminExamResults />} />
              <Route path="exam-review/:attemptId" element={<ExamReview />} />
              <Route path="proctoring-snapshots/:attemptId" element={<ProctoringSnapshotsView />} />
              <Route path="people" element={<AdminPeopleContent />} />
              <Route path="batches" element={<AdminBatchesContent />} />
              <Route path="patterns" element={<ExamHub />} />
              <Route path="patterns/create" element={<PatternCreation />} />
              <Route path="patterns/:id/edit" element={<PatternCreation />} />
              <Route path="patterns/:patternId/view" element={<PatternView />} />
              <Route path="patterns/:patternId/questions/create" element={<QuestionCreation />} />
              <Route path="pattern/:patternId/question/:subjectSlug/:questionNumber" element={<QuestionCreationEnhanced />} />
              <Route path="pattern/:patternId/question/:questionNumber" element={<QuestionCreationEnhanced />} />
              <Route path="exam/:examId/pattern/:patternId/bulk-import" element={<BulkImportPage />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/center-admin/dashboard" replace />} />
            </Routes>
          </CenterAdminLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/center-admin" element={<Navigate to="/center-admin/dashboard" replace />} />

      {/* Manager Dashboard - Company level management */}
      <Route path="/manager" element={
        <FullscreenProtectedRoute>
          <ManagerDashboard />
        </FullscreenProtectedRoute>
      } />
      <Route path="/manager/dashboard" element={<Navigate to="/manager" replace />} />

      <Route path="/timetable" element={
        <ProtectedRoute>
          <TimetableDashboard />
        </ProtectedRoute>
      } />
      <Route path="/timetable-interface" element={
        <ProtectedRoute>
          <Timetable />
        </ProtectedRoute>
      } />
      <Route path="/batches" element={
        <ProtectedRoute>
          <Batches />
        </ProtectedRoute>
      } />
      <Route path="/centers" element={
        <ProtectedRoute>
          <CentersContent />
        </ProtectedRoute>
      } />

      {/* Exam Hub - Main exam management page with tabs */}
      <Route path="/exam" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <ExamHub />
        </RoleProtectedRoute>
      } />

      <Route path="/admin" element={<AdminRoleDashboard />} />

      <Route path="/teacher/*" element={
        <FullscreenProtectedRoute>
          <TeacherLayout>
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TeacherHomeContent />} />
              <Route path="exams" element={<ExamHub />} />
              <Route path="exams/create" element={<ExamCreation />} />
              <Route path="exams/:examId/edit" element={<ExamCreation />} />
              <Route path="exams/:examId" element={<ExamView />} />
              <Route path="exams/:examId/results" element={<AdminExamResults />} />
              <Route path="evaluation" element={<TeacherAnalytics />} /> {/* Placeholder to match nav */}
              <Route path="batches" element={<AdminBatchesContent />} />
              <Route path="attendance" element={<AdminPeopleContent />} /> {/* Placeholder to match nav */}
              <Route path="analytics" element={<ExamResultsAnalyticsEnhanced />} /> {/* Placeholder to match nav */}
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </TeacherLayout>
        </FullscreenProtectedRoute>
      } />

      <Route path="/staff" element={<StaffDashboard />} />
      <Route path="/exams" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <RoleBasedRedirect targetPath="/exams">
            <ExamManagement />
          </RoleBasedRedirect>
        </RoleProtectedRoute>
      } />
      <Route path="/exams/create" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <ExamCreation />
        </RoleProtectedRoute>
      } />
      <Route path="/exams/:examId" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <ExamView />
        </RoleProtectedRoute>
      } />
      <Route path="/exams/:examId/analytics" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <ExamAnalytics />
        </RoleProtectedRoute>
      } />
      <Route path="/exams/:examId/results-analytics" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <ExamResultsAnalyticsEnhanced />
        </RoleProtectedRoute>
      } />
      <Route path="/exams/:examId/results-analytics/*" element={
        <FullscreenProtectedRoute>
          <ExamAnalyticsDashboard />
        </FullscreenProtectedRoute>
      }>
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="heatmap" element={<HeatMapPage />} />
        <Route path="histogram" element={<HistogramPage />} />
        <Route path="boxplot" element={<BoxPlotPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="student/:studentId" element={<StudentDetailPage />} />
        <Route path="evaluation" element={<EvaluationPage />} />
        <Route path="graphs" element={<GraphsPage />} />
      </Route>
      <Route path="/exams/:examId/evaluation" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <TeacherEvaluationDashboard />
        </RoleProtectedRoute>
      } />
      <Route path="/exams/:examId/edit" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <ExamCreation />
        </RoleProtectedRoute>
      } />
      <Route path="/exams/:examId/setup" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <ExamSetupDetails />
        </RoleProtectedRoute>
      } />
      <Route path="/exams/:examId/question/:questionNumber" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <EnhancedQuestionEditor />
        </RoleProtectedRoute>
      } />
      <Route path="/exams/:examId/extraction-v3" element={
        <FullscreenProtectedRoute>
          <ExtractionV3Page />
        </FullscreenProtectedRoute>
      } />
      <Route path="/exams/:examId/extraction-v2" element={
        <FullscreenProtectedRoute>
          <ExtractionV2Page />
        </FullscreenProtectedRoute>
      } />
      <Route path="/exams/:examId/extraction-v3/review/:jobId" element={
        <FullscreenProtectedRoute>
          <ExtractionReviewPage />
        </FullscreenProtectedRoute>
      } />
      <Route path="/exams/:examId/answer-key" element={
        <FullscreenProtectedRoute>
          <AnswerKeyUploadPage />
        </FullscreenProtectedRoute>
      } />
      <Route path="/exam-view/:examId" element={
        <RoleProtectedRoute allowedRoles={['student', 'STUDENT', 'super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <StudentExamView />
        </RoleProtectedRoute>
      } />
      <Route path="/student-dashboard" element={
        <FullscreenProtectedRoute>
          <StudentLayout>
            <StudentDashboard />
          </StudentLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/my-exams" element={
        <FullscreenProtectedRoute>
          <StudentLayout>
            <StudentDashboard />
          </StudentLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/student-exams" element={
        <FullscreenProtectedRoute>
          <StudentLayout>
            <StudentExamList />
          </StudentLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/student-analytics" element={
        <FullscreenProtectedRoute>
          <StudentLayout>
            <RoleBasedRedirect targetPath="/student-analytics">
              <StudentAnalyticsOverview />
            </RoleBasedRedirect>
          </StudentLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/student-analytics/:examId" element={
        <FullscreenProtectedRoute>
          <StudentLayout>
            <StudentAnalytics />
          </StudentLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/exam-access/:examId" element={
        <FullscreenProtectedRoute>
          <StudentLayout>
            <ExamAccess />
          </StudentLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/exam-setup/:examId" element={
        <FullscreenProtectedRoute>
          <ExamSetup />
        </FullscreenProtectedRoute>
      } />
      <Route path="/secure-exam/:attemptId" element={
        <FullscreenProtectedRoute>
          <SecureExamExperience />
        </FullscreenProtectedRoute>
      } />
      <Route path="/exam-results/:attemptId" element={
        <FullscreenProtectedRoute>
          <StudentLayout>
            <RoleBasedRedirect targetPath="/exam-results/:attemptId">
              <ExamResults />
            </RoleBasedRedirect>
          </StudentLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/exam-results/exam/:examId" element={
        <FullscreenProtectedRoute>
          <StudentLayout>
            <ExamResultsByExamId />
          </StudentLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/test-results/:attemptId" element={
        <ProtectedRoute>
          <TestResults />
        </ProtectedRoute>
      } />
      {/* Test routes removed - Advanced components are now integrated into exam-specific pages */}
      <Route path="/exam-review/:attemptId" element={
        <FullscreenProtectedRoute>
          <StudentLayout>
            <ExamReview />
          </StudentLayout>
        </FullscreenProtectedRoute>
      } />
      <Route path="/results" element={
        <FullscreenProtectedRoute>
          <StudentLayout>
            <Results />
          </StudentLayout>
        </FullscreenProtectedRoute>
      } />
      {/* Legacy route redirect */}
      <Route path="/exam-attempts" element={
        <ProtectedRoute>
          <Results />
        </ProtectedRoute>
      } />
      <Route path="/violation-dashboard" element={
        <ProtectedRoute>
          <RoleBasedRedirect targetPath="/violation-dashboard">
            <ViolationDashboard />
          </RoleBasedRedirect>
        </ProtectedRoute>
      } />
      <Route path="/proctoring-snapshots/:attemptId" element={
        <ProtectedRoute>
          <RoleBasedRedirect targetPath="/proctoring-snapshots/:attemptId">
            <ProctoringSnapshotsView />
          </RoleBasedRedirect>
        </ProtectedRoute>
      } />
      <Route path="/proctoring-test" element={
        <ProctoringTestPage />
      } />
      <Route path="/patterns" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <RoleBasedRedirect targetPath="/patterns">
            <PatternManagement />
          </RoleBasedRedirect>
        </RoleProtectedRoute>
      } />
      <Route path="/patterns/create" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <PatternCreation />
        </RoleProtectedRoute>
      } />
      <Route path="/patterns/:id/edit" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <PatternCreation />
        </RoleProtectedRoute>
      } />
      <Route path="/patterns/:patternId/view" element={
        <ProtectedRoute>
          <PatternView />
        </ProtectedRoute>
      } />
      <Route path="/patterns/:patternId/questions/create" element={
        <ProtectedRoute>
          <QuestionCreation />
        </ProtectedRoute>
      } />
      <Route path="/patterns/:patternId/sections/:sectionId/questions/create" element={
        <ProtectedRoute>
          <QuestionCreation />
        </ProtectedRoute>
      } />
      <Route path="/exam/:examId/pattern/:patternId/bulk-import" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <BulkImportPage />
        </RoleProtectedRoute>
      } />
      <Route path="/questions" element={
        <ProtectedRoute>
          <QuestionManagement />
        </ProtectedRoute>
      } />
      <Route path="/questions/create" element={
        <ProtectedRoute>
          <QuestionCreationEnhanced />
        </ProtectedRoute>
      } />
      <Route path="/questions/create-enhanced" element={
        <ProtectedRoute>
          <QuestionCreationEnhanced />
        </ProtectedRoute>
      } />
      <Route path="/pattern/:patternId/question/:subjectSlug/:questionNumber" element={
        <ProtectedRoute>
          <QuestionCreationEnhanced />
        </ProtectedRoute>
      } />
      <Route path="/pattern/:patternId/question/:questionNumber" element={
        <ProtectedRoute>
          <QuestionCreationEnhanced />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/analytics" element={
        <RoleProtectedRoute allowedRoles={['super_admin', 'SUPER_ADMIN', 'institute_admin', 'ADMIN', 'admin', 'teacher', 'TEACHER', 'exam_admin']}>
          <TeacherAnalytics />
        </RoleProtectedRoute>
      } />
      <Route path="/ai-assistant" element={
        <ProtectedRoute>
          <AIAssistant />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />
      <Route path="/proctoring-test" element={
        <ProtectedRoute>
          <ProctoringDiagnostics />
        </ProtectedRoute>
      } />
      <Route path="/institute-profile" element={
        <ProtectedRoute>
          <InstituteProfile />
        </ProtectedRoute>
      } />
      <Route path="/institute-profile/:id" element={
        <ProtectedRoute>
          <InstituteProfile />
        </ProtectedRoute>
      } />

      {/* Landing Page */}
      <Route path="/" element={
        <LandingRoute>
          <LandingPageEnhanced />
        </LandingRoute>
      } />

      {/* Default redirect for authenticated users */}
      <Route path="*" element={
        <ProtectedRoute>
          <SmartDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TimetableCenterProvider>
          <Router>
            <OnboardingTourProvider>
              <AppRoutes />
            </OnboardingTourProvider>
            <ToastContainer position="top-right" autoClose={3000} />
          </Router>
        </TimetableCenterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
