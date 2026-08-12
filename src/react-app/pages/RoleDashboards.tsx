import {
  Users,
  GraduationCap,
  ClipboardList,
  CalendarDays,
  Layers,
  Building2,
  BookOpen,
  UserPlus,
  Settings,
  Sparkles,
  Search,
  Filter,
  Mail,
} from "lucide-react";

export function AdminRoleDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Header
          title="Center Admin"
          subtitle="Manage center-level people, batches and day-to-day academic operations."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Building2}
            label="Assigned Center"
            value="Kota Residential"
            pill="Center"
          />
          <StatCard icon={GraduationCap} label="Active Batches" value="6" pill="Across programs" />
          <StatCard icon={Users} label="Total Students" value="540" pill="This center" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <SectionTitle
              title="People Management"
              subtitle="Add admins, teachers, staff and students for this center."
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ActionTile
                icon={UserPlus}
                title="Add Admin"
                description="Promote teacher / staff to center admin."
              />
              <ActionTile
                icon={GraduationCap}
                title="Add Teacher"
                description="Invite or assign teachers to center."
              />
              <ActionTile
                icon={Users}
                title="Add Staff / Students"
                description="Bulk or single addition."
              />
            </div>

            <SectionTitle
              title="People Directory (Static Table)"
              subtitle="This is a non-functional preview of how the people table can look."
            />
            <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden text-xs">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-gray-700">
                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    readOnly
                    placeholder="Search people by name, email, role..."
                    className="w-full pl-7 pr-3 py-1.5 rounded-md border border-slate-200 bg-white dark:bg-gray-900 text-[11px] text-slate-700 dark:text-gray-100"
                  />
                </div>
                <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-[11px] text-slate-700 hover:bg-slate-50">
                  <Filter className="w-3 h-3" />
                  Filters
                </button>
              </div>
              <table className="w-full border-collapse text-[11px]">
                <thead className="bg-slate-50 dark:bg-gray-900/80 text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Name</th>
                    <th className="px-3 py-2 text-left font-medium">Email</th>
                    <th className="px-3 py-2 text-left font-medium">Role</th>
                    <th className="px-3 py-2 text-left font-medium">Assigned As</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-3 py-2 text-slate-800 dark:text-gray-100">Rahul Mehta</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-gray-400">rahul@example.com</td>
                    <td className="px-3 py-2">Teacher</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        Admin
                      </span>
                    </td>
                  </tr>
                  <tr className="border-t border-slate-100 dark:border-gray-800">
                    <td className="px-3 py-2 text-slate-800 dark:text-gray-100">Anita Shah</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-gray-400">anita@example.com</td>
                    <td className="px-3 py-2">Staff</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Staff
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <SectionTitle
              title="Batches & Programs"
              subtitle="Create batches and assign students under specific programs like Super 30 or OnlyBoard."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionTile
                icon={Layers}
                title="Create Batch"
                description="Map to program and academic year."
              />
              <ActionTile
                icon={ClipboardList}
                title="Assign Students to Batch"
                description="Link existing students to batches."
              />
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle
              title="Today at a Glance"
              subtitle="Quick snapshot of what’s happening in the center."
            />
            <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3 text-xs">
              <Row label="Live exams right now" value="2" />
              <Row label="Scheduled for today" value="3" />
              <Row label="Upcoming batches starting this week" value="1" />
              <Row label="New students pending onboarding" value="5" />
            </div>

            <SectionTitle
              title="Design Note"
              subtitle="This panel will later show center-specific analytics and alerts."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import TeacherHomeContent from "../components/teacher/TeacherHomeContent";

export function TeacherRoleDashboard() {
  return <TeacherHomeContent />;
}

export function StaffDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Header
          title="Staff Dashboard"
          subtitle="Support operations for attendance, communication and logistics."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Users} label="Attendance Tasks" value="2" pill="Pending" />
          <StatCard icon={BookOpen} label="Exam Logistics" value="1" pill="Today" />
          <StatCard icon={Settings} label="Center Operations" value="Routine" pill="Checks" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <SectionTitle
              title="Attendance Panel (Static)"
              subtitle="Design for marking student attendance batch-wise."
            />
            <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-gray-100">
                    Super 30 – 2026 Elite
                  </p>
                  <p className="text-[11px] text-slate-500">30 students • Morning</p>
                </div>
                <button className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-[11px] text-slate-700 hover:bg-slate-50">
                  Mark Attendance
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                In future, this card can expand into a full attendance grid for this batch.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle
              title="Communication Center (Static)"
              subtitle="Preview of bulk communication UI."
            />
            <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-xs space-y-2">
              <p className="font-semibold text-slate-800 dark:text-gray-100 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Send Announcement
              </p>
              <p className="text-[11px] text-slate-500">
                Later this will connect to SMS / email APIs. For now, this is just a static
                placeholder.
              </p>
            </div>
          </div>
        </div>

        <StaticFooterNote />
      </div>
    </div>
  );
}

export function StudentRoleDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Header
          title="Student Overview"
          subtitle="View your enrolled programs, batches and upcoming exams."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={GraduationCap}
            label="Program"
            value="Super 30"
            pill="JEE Advanced"
          />
          <StatCard
            icon={Layers}
            label="Current Batch"
            value="2026 Elite"
            pill="Kota Residential"
          />
          <StatCard
            icon={CalendarDays}
            label="Next Exam"
            value="12 Jan"
            pill="Monthly Mock"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <SectionTitle
              title="My Exams (Static)"
              subtitle="Simple view of current and upcoming exams."
            />
            <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-xs space-y-3">
              <Row label="Super 30 – Monthly Mock" value="Available" />
              <Row label="Institute Diagnostic Test" value="Scheduled" />
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle
              title="Static Hint"
              subtitle="Later this will be replaced by the real student dashboard (already exists in your app)."
            />
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 dark:bg-gray-900/60 p-4 text-xs text-slate-600 dark:text-gray-400">
              This page is only to show high-level information architecture for the student role in
              the new multi-role design. Your existing `StudentDashboard` page will continue to
              handle real data and flows.
            </div>
          </div>
        </div>

        <StaticFooterNote />
      </div>
    </div>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <div className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 border border-blue-100 mb-1">
          <Sparkles className="w-3 h-3" />
          Role Dashboard
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">{title}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-gray-400 max-w-xl">{subtitle}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  pill,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  pill: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-gray-100">{value}</p>
          <p className="mt-1 text-[11px] text-slate-500">{pill}</p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white">
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{title}</h2>
      {subtitle && <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ActionTile({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}) {
  return (
    <button className="group rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-left hover:-translate-y-0.5 hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center group-hover:bg-blue-600 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs font-semibold text-slate-900 dark:text-gray-100">{title}</p>
      </div>
      <p className="text-[11px] text-slate-600 dark:text-gray-400">{description}</p>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600 dark:text-gray-400">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

function StaticFooterNote() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white dark:bg-gray-900 p-4 text-xs text-slate-600 dark:text-gray-400">
      <p className="font-semibold mb-1">Next Step (Backend Later)</p>
      <p>
        These role pages are fully static and serve as the detailed visual design. Later, we will
        wire them to real APIs and proper role-based routing (superadmin, admin, teacher, staff,
        student) without changing this layout.
      </p>
    </div>
  );
}


