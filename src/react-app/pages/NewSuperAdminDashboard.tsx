import { useEffect } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import DashboardContent from "../components/superadmin/DashboardContent";
import InstituteContent from "../components/superadmin/InstituteContent";
import CentersContent from "../components/superadmin/CentersContent";
import UsersContent from "../components/superadmin/UsersContent";
import ExamsContent from "../components/superadmin/ExamsContent";
import BatchesContent from "../components/superadmin/BatchesContent";
import TimetableContent from "../components/superadmin/TimetableContent";
import SettingsContent from "../components/superadmin/SettingsContent";
import ProfileContent from "../components/superadmin/ProfileContent";

const navItems = [
  { id: "dashboard", content: DashboardContent },
  { id: "institute", content: InstituteContent },
  { id: "centers", content: CentersContent },
  { id: "users", content: UsersContent },
  { id: "exams", content: ExamsContent },
  { id: "batches", content: BatchesContent },
  { id: "timetable", content: TimetableContent },
  { id: "settings", content: SettingsContent },
  { id: "profile", content: ProfileContent },
];

export default function NewSuperAdminDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
    if (!authLoading && user?.role !== 'super_admin' && user?.role !== 'SUPER_ADMIN') {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const ActiveContent = navItems.find((item) => item.id === activeTab)?.content || DashboardContent;

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <ActiveContent />
      </div>
    </Layout>
  );
}
