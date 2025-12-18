import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuthContext } from "@/react-app/contexts/AuthContext";
import { ThemeProvider } from "@/react-app/contexts/ThemeContext";
import { OnboardingTourProvider } from "@/react-app/contexts/OnboardingTourContext";
import Layout from "@/react-app/components/Layout";
import Login from "@/react-app/pages/Login";
import Register from "@/react-app/pages/Register";
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
import StudentAnalytics from "@/react-app/pages/StudentAnalytics";
import StudentAnalyticsOverview from "@/react-app/pages/StudentAnalyticsOverview";
import StudentExamList from "@/react-app/pages/StudentExamList";
import ExamAccess from "@/react-app/pages/ExamAccess";
import ExamSetup from "@/react-app/pages/ExamSetup";
import SecureExamExperience from "@/react-app/pages/SecureExamExperience";
import ExamResults from "@/react-app/pages/ExamResults";
import ExamResultsByExamId from "@/react-app/pages/ExamResultsByExamId";
import TestResults from "@/react-app/pages/TestResults";
import ViolationDashboard from "@/react-app/pages/ViolationDashboard";
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
import LandingPage from "@/react-app/pages/LandingPage";
import ProctoringDiagnostics from "@/react-app/pages/ProctoringDiagnostics";
import ProctoringSnapshotsView from "@/react-app/pages/ProctoringSnapshotsView";
import BulkImportPage from "@/react-app/pages/BulkImportPage";
import SuperAdminDashboard from "@/react-app/pages/SuperAdminDashboard";
import CenterAdminDashboard from "@/react-app/pages/CenterAdminDashboard";
import Timetable from "@/react-app/pages/Timetable";
import {
  AdminRoleDashboard,
  TeacherRoleDashboard,
  StaffDashboard, 
} from "@/react-app/pages/RoleDashboards";

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

// Helper function to get dashboard route based on role
function getDashboardRoute(role: string | undefined): string {
  switch (role) {
    case 'super_admin':
    case 'SUPER_ADMIN':
      return '/superadmin/dashboard';
    case 'admin':
    case 'ADMIN':
    case 'institute_admin':
      return '/center-admin/dashboard';
    case 'teacher':
    case 'TEACHER':
      return '/teacher';
    case 'student':
    case 'STUDENT':
      return '/student-dashboard';
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

  return isAuthenticated ? <Navigate to={getDashboardRoute(user?.role)} replace /> : children;
}

// Landing Route Component (show landing page if not authenticated, dashboard if authenticated)
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

  return isAuthenticated ? <Navigate to={getDashboardRoute(user?.role)} replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      {/* Onboarding Route - Semi-protected (logged in but no institute) */}
      <Route path="/onboarding" element={<Onboarding />} />
      
      {/* Public Exam Access Route */}
      <Route path="/public-exam/:token" element={<PublicExamAccess />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <SmartDashboard />
        </ProtectedRoute>
      } />

      {/* Role-specific dashboards */}
      <Route path="/superadmin/dashboard" element={
        <FullscreenProtectedRoute>
          <SuperAdminDashboard />
        </FullscreenProtectedRoute>
      } />
      <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
      <Route path="/center-admin/dashboard" element={
        <FullscreenProtectedRoute>
          <CenterAdminDashboard />
        </FullscreenProtectedRoute>
      } />
      <Route path="/center-admin" element={<Navigate to="/center-admin/dashboard" replace />} />
      <Route path="/timetable" element={<Timetable />} />

      <Route path="/admin" element={<AdminRoleDashboard />} />
      <Route path="/teacher" element={<TeacherRoleDashboard />} />
      <Route path="/staff" element={<StaffDashboard />} /> 
          <Route path="/exams" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <ExamManagement />
            </RoleProtectedRoute>
          } />
          <Route path="/exams/create" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <ExamCreation />
            </RoleProtectedRoute>
          } />
          <Route path="/exams/:examId" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <ExamView />
            </RoleProtectedRoute>
          } />
          <Route path="/exams/:examId/analytics" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <ExamAnalytics />
            </RoleProtectedRoute>
          } />
          <Route path="/exams/:examId/results-analytics" element={
            <FullscreenProtectedRoute>
              <Navigate to="statistics" replace />
            </FullscreenProtectedRoute>
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
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <TeacherEvaluationDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/exams/:examId/edit" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <ExamCreation />
            </RoleProtectedRoute>
          } />
          <Route path="/exams/:examId/setup" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <ExamSetupDetails />
            </RoleProtectedRoute>
          } />
          <Route path="/exams/:examId/question/:questionNumber" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <EnhancedQuestionEditor />
            </RoleProtectedRoute>
          } />
          <Route path="/exam-view/:examId" element={
            <RoleProtectedRoute allowedRoles={['student', 'super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <StudentExamView />
            </RoleProtectedRoute>
          } />
          <Route path="/student-dashboard" element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/my-exams" element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student-exams" element={
            <ProtectedRoute>
              <StudentExamList />
            </ProtectedRoute>
          } />
          <Route path="/student-analytics" element={
            <ProtectedRoute>
              <StudentAnalyticsOverview />
            </ProtectedRoute>
          } />
          <Route path="/student-analytics/:examId" element={
            <ProtectedRoute>
              <StudentAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/exam-access/:examId" element={
            <ProtectedRoute>
              <ExamAccess />
            </ProtectedRoute>
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
            <ProtectedRoute>
              <ExamResults />
            </ProtectedRoute>
          } />
          <Route path="/exam-results/exam/:examId" element={
            <ProtectedRoute>
              <ExamResultsByExamId />
            </ProtectedRoute>
          } />
        <Route path="/test-results/:attemptId" element={
          <ProtectedRoute>
            <TestResults />
          </ProtectedRoute>
        } />
        {/* Test routes removed - Advanced components are now integrated into exam-specific pages */}
          <Route path="/exam-review/:attemptId" element={
            <ProtectedRoute>
              <ExamReview />
            </ProtectedRoute>
          } />
          <Route path="/results" element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          } />
          {/* Legacy route redirect */}
          <Route path="/exam-attempts" element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          } />
          <Route path="/violation-dashboard" element={
            <ProtectedRoute>
              <ViolationDashboard />
            </ProtectedRoute>
          } />
          <Route path="/proctoring-snapshots/:attemptId" element={
            <ProtectedRoute>
              <ProctoringSnapshotsView />
            </ProtectedRoute>
          } />
          <Route path="/patterns" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <PatternManagement />
            </RoleProtectedRoute>
          } />
          <Route path="/patterns/create" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
              <PatternCreation />
            </RoleProtectedRoute>
          } />
          <Route path="/patterns/:id/edit" element={
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
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
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
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
            <RoleProtectedRoute allowedRoles={['super_admin', 'institute_admin', 'teacher', 'exam_admin']}>
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

      {/* Landing Page */}
      <Route path="/" element={
        <LandingRoute>
          <LandingPage />
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
        <Router>
          <OnboardingTourProvider>
            <AppRoutes />
          </OnboardingTourProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
