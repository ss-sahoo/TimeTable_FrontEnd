import React, { useState, useEffect, useCallback } from "react";
import { Fetch } from "../usefetch";
import { cleanTimetableId } from "../AllApi";

/* ================= TYPES ================= */
interface TeacherInfo {
  teacher_code: string;
  teacher_name: string;
}

interface BatchInfo {
  batch_code: string;
  batch_name: string;
}

interface SlotData {
  slot_id: string;
  slot_code: string;
  slot_number: number;
  start_time: string;
  end_time: string;
  subject: string | null;
  room_number: string;
  day_index: number;
  actual_date: string;
  teacher: string | TeacherInfo | null;
  batch?: string | BatchInfo | null;
  // Direct batch fields (used in teacher view)
  batch_code?: string;
  batch_name?: string;
}

interface BatchData {
  batch_id: string;
  batch_code: string;
  batch_name: string;
  program: string;
  slots: { [dayKey: string]: SlotData[] };
  total_classes: number;
}

interface TeacherData {
  teacher_id: string;
  teacher_code: string;
  teacher_name: string;
  department?: string;
  slots: { [dayKey: string]: SlotData[] };
  total_classes: number;
  batches?: string[]; // List of batch names assigned to this teacher
}

interface TimetableResponse {
  timetable_id: string;
  timetable: string;
  from_date: string;
  to_date: string;
  batches?: BatchData[];
  teachers?: TeacherData[];
  total_batches?: number;
  total_teachers?: number;
}

type ViewMode = "batch" | "teacher";

/* ================= CONSTANTS ================= */
const SUBJECT_COLORS: { [key: string]: { bg: string; text: string; border: string } } = {
  "Physics": { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  "Chemistry": { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  "Chemestry": { bg: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  "Biology": { bg: "#dcfce7", text: "#166534", border: "#86efac" },
  "Mathematics": { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  "Maths": { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  "English": { bg: "#e0e7ff", text: "#3730a3", border: "#a5b4fc" },
  "default": { bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
};

const DAY_COLORS: { [key: string]: string } = {
  "d1": "#3b82f6",
  "d2": "#10b981",
  "d3": "#8b5cf6",
  "d4": "#f59e0b",
  "d5": "#ef4444",
  "d6": "#ec4899",
  "d7": "#06b6d4",
};

const BATCH_COLORS = [
  { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
  { bg: "#f0fdf4", border: "#22c55e", text: "#166534" },
  { bg: "#faf5ff", border: "#a855f7", text: "#7e22ce" },
  { bg: "#fffbeb", border: "#f59e0b", text: "#92400e" },
];

const TEACHER_COLORS = [
  { bg: "#fef2f2", border: "#ef4444", text: "#b91c1c" },
  { bg: "#f0fdfa", border: "#14b8a6", text: "#0f766e" },
  { bg: "#fefce8", border: "#eab308", text: "#a16207" },
  { bg: "#f5f3ff", border: "#8b5cf6", text: "#6d28d9" },
];

/* ================= MAIN COMPONENT ================= */
const GeneratedTimetable: React.FC = () => {
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("batch");
  const [timetableInfo, setTimetableInfo] = useState<{
    timetable: string;
    from_date: string;
    to_date: string;
  } | null>(null);
  
  // Batch view state
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("all");
  
  // Teacher view state
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  useEffect(() => {
    const rawId = localStorage.getItem("timetable_id");
    if (rawId) {
      setTimetableId(cleanTimetableId(rawId));
    } else {
      setError("No timetable ID found. Please select a timetable first.");
      setLoading(false);
    }
  }, []);

  // Load batches data
  const loadBatchesData = useCallback(async () => {
    if (!timetableId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await Fetch(
        `/api/timetable/timetables/${timetableId}/batches/`,
        { method: "GET" }
      );
      if (!response.ok) throw new Error(`Failed to load batches: ${response.status}`);
      const data: TimetableResponse = await response.json();
      if (data) {
        setTimetableInfo({
          timetable: data.timetable,
          from_date: data.from_date,
          to_date: data.to_date,
        });
        setBatches(data.batches || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timetableId]);

  // Load teachers data
  const loadTeachersData = useCallback(async () => {
    if (!timetableId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await Fetch(
        `/api/timetable/timetables/${timetableId}/teachers/`,
        { method: "GET" }
      );
      if (!response.ok) throw new Error(`Failed to load teachers: ${response.status}`);
      const data: TimetableResponse = await response.json();
      if (data) {
        setTimetableInfo({
          timetable: data.timetable,
          from_date: data.from_date,
          to_date: data.to_date,
        });
        setTeachers(data.teachers || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timetableId]);

  // Load data based on view mode
  useEffect(() => {
    if (timetableId) {
      if (viewMode === "batch") {
        loadBatchesData();
      } else {
        loadTeachersData();
      }
    }
  }, [timetableId, viewMode, loadBatchesData, loadTeachersData]);

  const getSubjectColor = (subject: string | null) =>
    subject ? SUBJECT_COLORS[subject] || SUBJECT_COLORS.default : SUBJECT_COLORS.default;

  const getBatchColor = (idx: number) => BATCH_COLORS[idx % BATCH_COLORS.length];
  const getTeacherColor = (idx: number) => TEACHER_COLORS[idx % TEACHER_COLORS.length];

  const filteredBatches =
    selectedBatchId === "all"
      ? batches
      : batches.filter((b) => b.batch_id === selectedBatchId);

  const filteredTeachers =
    selectedTeacherId === "all"
      ? teachers
      : teachers.filter((t) => t.teacher_id === selectedTeacherId);

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p>Loading Timetable...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.errorBox}>
          <span style={{ fontSize: 40 }}>❌</span>
          <h3>Error</h3>
          <p>{error}</p>
          <button style={styles.retryBtn} onClick={viewMode === "batch" ? loadBatchesData : loadTeachersData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📅 Generated Timetable</h2>
          {timetableInfo && (
            <p style={styles.subtitle}>
              {timetableInfo.from_date} — {timetableInfo.to_date}
            </p>
          )}
        </div>
        <div style={styles.headerActions}>
          <button style={styles.exportBtn}>📥 Export PDF</button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div style={styles.viewTabs}>
        <button
          style={viewMode === "batch" ? styles.viewTabActive : styles.viewTab}
          onClick={() => { setViewMode("batch"); setSelectedBatchId("all"); }}
        >
          <span style={styles.tabIcon}>📚</span>
          Batch-wise View
        </button>
        <button
          style={viewMode === "teacher" ? styles.viewTabActive : styles.viewTab}
          onClick={() => { setViewMode("teacher"); setSelectedTeacherId("all"); }}
        >
          <span style={styles.tabIcon}>👨‍🏫</span>
          Teacher-wise View
        </button>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        {viewMode === "batch" ? (
          <>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{batches.length}</span>
              <span style={styles.statLabel}>Total Batches</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNum}>
                {batches.reduce((sum, b) => sum + b.total_classes, 0)}
              </span>
              <span style={styles.statLabel}>Total Classes</span>
            </div>
          </>
        ) : (
          <>
            <div style={styles.statCard}>
              <span style={styles.statNum}>{teachers.length}</span>
              <span style={styles.statLabel}>Total Teachers</span>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statNum}>
                {teachers.reduce((sum, t) => sum + t.total_classes, 0)}
              </span>
              <span style={styles.statLabel}>Total Classes</span>
            </div>
          </>
        )}
      </div>

      {/* Filter Row */}
      <div style={styles.filterRow}>
        <span style={styles.filterLabel}>Filter by {viewMode === "batch" ? "Batch" : "Teacher"}:</span>
        
        {viewMode === "batch" ? (
          <>
            <button
              style={selectedBatchId === "all" ? styles.filterActive : styles.filterBtn}
              onClick={() => setSelectedBatchId("all")}
            >
              All Batches
            </button>
            {batches.map((b, i) => (
              <button
                key={b.batch_id}
                style={{
                  ...(selectedBatchId === b.batch_id ? styles.filterActive : styles.filterBtn),
                  borderLeft: `3px solid ${getBatchColor(i).border}`,
                }}
                onClick={() => setSelectedBatchId(b.batch_id)}
              >
                {b.batch_name}
              </button>
            ))}
          </>
        ) : (
          <>
            <button
              style={selectedTeacherId === "all" ? styles.filterActive : styles.filterBtn}
              onClick={() => setSelectedTeacherId("all")}
            >
              All Teachers
            </button>
            {teachers.map((t, i) => (
              <button
                key={t.teacher_id}
                style={{
                  ...(selectedTeacherId === t.teacher_id ? styles.filterActive : styles.filterBtn),
                  borderLeft: `3px solid ${getTeacherColor(i).border}`,
                }}
                onClick={() => setSelectedTeacherId(t.teacher_id)}
              >
                {t.teacher_name}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Content */}
      {viewMode === "batch" ? (
        batches.length === 0 ? (
          <EmptyState message="No batch timetable data available" />
        ) : (
          <div style={styles.tablesContainer}>
            {filteredBatches.map((batch, idx) => (
              <BatchTable
                key={batch.batch_id}
                batch={batch}
                color={getBatchColor(idx)}
                getSubjectColor={getSubjectColor}
              />
            ))}
          </div>
        )
      ) : (
        teachers.length === 0 ? (
          <EmptyState message="No teacher timetable data available" />
        ) : (
          <div style={styles.tablesContainer}>
            {filteredTeachers.map((teacher, idx) => (
              <TeacherTable
                key={teacher.teacher_id}
                teacher={teacher}
                color={getTeacherColor(idx)}
                getSubjectColor={getSubjectColor}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
};

/* ================= EMPTY STATE ================= */
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div style={styles.emptyBox}>
    <span style={{ fontSize: 48 }}>📋</span>
    <p>{message}</p>
  </div>
);

/* ================= BATCH TABLE ================= */
interface BatchTableProps {
  batch: BatchData;
  color: { bg: string; border: string; text: string };
  getSubjectColor: (s: string | null) => { bg: string; text: string; border: string };
}

const BatchTable: React.FC<BatchTableProps> = ({ batch, color, getSubjectColor }) => {
  const dayKeys = Object.keys(batch.slots || {}).sort(
    (a, b) => parseInt(a.replace("d", "")) - parseInt(b.replace("d", ""))
  );

  const timeSlots = getUniqueTimeSlots(batch.slots, dayKeys);

  return (
    <div style={styles.tableCard}>
      <div style={{ ...styles.tableHeader, borderLeftColor: color.border, backgroundColor: color.bg }}>
        <div style={styles.entityInfo}>
          <div style={{ ...styles.entityAvatar, backgroundColor: color.border }}>
            {batch.batch_name.charAt(0)}
          </div>
          <div>
            <h3 style={{ ...styles.entityName, color: color.text }}>{batch.batch_name}</h3>
            <p style={styles.entityMeta}>
              {batch.batch_code} • {batch.program}
            </p>
          </div>
        </div>
        <div style={styles.entityBadges}>
          <span style={styles.badge}>📅 {dayKeys.length} Days</span>
          <span style={styles.badge}>📖 {batch.total_classes} Classes</span>
        </div>
      </div>

      <TimetableGrid
        slots={batch.slots}
        dayKeys={dayKeys}
        timeSlots={timeSlots}
        getSubjectColor={getSubjectColor}
        showBatch={false}
      />
    </div>
  );
};

/* ================= TEACHER TABLE ================= */
interface TeacherTableProps {
  teacher: TeacherData;
  color: { bg: string; border: string; text: string };
  getSubjectColor: (s: string | null) => { bg: string; text: string; border: string };
}

const TeacherTable: React.FC<TeacherTableProps> = ({ teacher, color, getSubjectColor }) => {
  const dayKeys = Object.keys(teacher.slots || {}).sort(
    (a, b) => parseInt(a.replace("d", "")) - parseInt(b.replace("d", ""))
  );

  const timeSlots = getUniqueTimeSlots(teacher.slots, dayKeys);
  const hasSlots = dayKeys.length > 0 && timeSlots.length > 0;

  return (
    <div style={styles.tableCard}>
      <div style={{ ...styles.tableHeader, borderLeftColor: color.border, backgroundColor: color.bg }}>
        <div style={styles.entityInfo}>
          <div style={{ ...styles.entityAvatar, backgroundColor: color.border }}>
            👨‍🏫
          </div>
          <div>
            <h3 style={{ ...styles.entityName, color: color.text }}>{teacher.teacher_name}</h3>
            <p style={styles.entityMeta}>
              {teacher.teacher_code} {teacher.department ? `• ${teacher.department}` : ""}
            </p>
          </div>
        </div>
        <div style={styles.entityBadges}>
          {teacher.batches && teacher.batches.length > 0 && (
            <span style={styles.badge}>📚 {teacher.batches.join(", ")}</span>
          )}
          <span style={styles.badge}>📖 {teacher.total_classes} Classes</span>
        </div>
      </div>

      {hasSlots ? (
        <TimetableGrid
          slots={teacher.slots}
          dayKeys={dayKeys}
          timeSlots={timeSlots}
          getSubjectColor={getSubjectColor}
          showBatch={true}
        />
      ) : (
        <div style={styles.noSlotsMessage}>
          <span style={{ fontSize: 24 }}>📭</span>
          <p>No scheduled classes yet</p>
          {teacher.batches && teacher.batches.length > 0 && (
            <p style={styles.assignedBatchesText}>
              Assigned to: {teacher.batches.join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* ================= TIMETABLE GRID ================= */
interface TimetableGridProps {
  slots: { [dayKey: string]: SlotData[] };
  dayKeys: string[];
  timeSlots: { start: string; end: string }[];
  getSubjectColor: (s: string | null) => { bg: string; text: string; border: string };
  showBatch: boolean;
}

const TimetableGrid: React.FC<TimetableGridProps> = ({
  slots,
  dayKeys,
  timeSlots,
  getSubjectColor,
  showBatch,
}) => {
  // Helper to get display name from teacher (string or object)
  const getTeacherName = (teacher: string | TeacherInfo | null): string | null => {
    if (!teacher) return null;
    if (typeof teacher === "string") return teacher;
    return teacher.teacher_name || teacher.teacher_code || null;
  };

  // Helper to get display name from batch (string or object, or direct fields)
  const getBatchDisplayName = (slot: SlotData): string | null => {
    // First check direct batch_name field (used in teacher view)
    if (slot.batch_name) return slot.batch_name;
    if (slot.batch_code) return slot.batch_code;
    
    // Then check nested batch object
    if (!slot.batch) return null;
    if (typeof slot.batch === "string") return slot.batch;
    return slot.batch.batch_name || slot.batch.batch_code || null;
  };

  return (
    <div style={styles.tableScroll}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.thDay}>Day / Date</th>
            {timeSlots.map((time, i) => (
              <th key={i} style={styles.thTime}>
                <div style={styles.timeHead}>
                  <span style={styles.timeMain}>{time.start}</span>
                  <span style={styles.timeTo}>to</span>
                  <span style={styles.timeSub}>{time.end}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dayKeys.map((dk) => {
            const daySlots = slots[dk] || [];
            const firstSlot = daySlots[0];
            const dayColor = DAY_COLORS[dk] || "#64748b";

            return (
              <tr key={dk}>
                <td style={styles.tdDayCell}>
                  <div style={styles.dayBox}>
                    <div style={{ ...styles.dayDot, backgroundColor: dayColor }}></div>
                    <div style={styles.dayInfo}>
                      <span style={styles.dayLabel}>Day {dk.replace("d", "")}</span>
                      {firstSlot && (
                        <span style={styles.dayDate}>{firstSlot.actual_date}</span>
                      )}
                    </div>
                  </div>
                </td>
                {timeSlots.map((time, i) => {
                  const slot = daySlots.find(
                    (s) => s.start_time === time.start && s.end_time === time.end
                  );
                  if (!slot) return <td key={i} style={styles.tdEmpty}>—</td>;

                  const sc = getSubjectColor(slot.subject);
                  const teacherName = getTeacherName(slot.teacher);
                  const batchName = getBatchDisplayName(slot);
                  
                  return (
                    <td key={i} style={styles.tdSlot}>
                      <div
                        style={{
                          ...styles.slotBox,
                          backgroundColor: sc.bg,
                          borderColor: sc.border,
                        }}
                      >
                        <div style={{ ...styles.slotSubject, color: sc.text }}>
                          {slot.subject || "No Subject"}
                        </div>
                        {showBatch ? (
                          batchName ? (
                            <div style={styles.slotBatch}>📚 {batchName}</div>
                          ) : (
                            <div style={styles.slotNoBatch}>No batch</div>
                          )
                        ) : (
                          teacherName ? (
                            <div style={styles.slotTeacher}>👨‍🏫 {teacherName}</div>
                          ) : (
                            <div style={styles.slotNoTeacher}>No teacher</div>
                          )
                        )}
                        <div style={styles.slotFooter}>
                          <span style={styles.slotCode}>{slot.slot_code}</span>
                          {slot.room_number && (
                            <span style={styles.slotRoom}>🏠 {slot.room_number}</span>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/* ================= HELPER FUNCTIONS ================= */
function getUniqueTimeSlots(
  slots: { [dayKey: string]: SlotData[] },
  dayKeys: string[]
): { start: string; end: string }[] {
  const timeSlots: { start: string; end: string }[] = [];
  dayKeys.forEach((dk) => {
    slots[dk]?.forEach((slot) => {
      if (!timeSlots.find((t) => t.start === slot.start_time && t.end === slot.end_time)) {
        timeSlots.push({ start: slot.start_time, end: slot.end_time });
      }
    });
  });
  return timeSlots.sort((a, b) => a.start.localeCompare(b.start));
}


/* ================= STYLES ================= */
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    padding: 24,
    borderRadius: 16,
    minHeight: "calc(100vh - 48px)",
  },
  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 80,
    color: "#64748b",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: 16,
  },
  errorBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 80,
    textAlign: "center",
    color: "#64748b",
  },
  retryBtn: {
    marginTop: 16,
    padding: "10px 24px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    margin: "4px 0 0",
  },
  headerActions: {
    display: "flex",
    gap: 12,
  },
  exportBtn: {
    padding: "10px 18px",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  viewTabs: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    background: "#fff",
    padding: 6,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    width: "fit-content",
  },
  viewTab: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    color: "#64748b",
    transition: "all 0.2s",
  },
  viewTabActive: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    color: "#fff",
    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
  },
  tabIcon: {
    fontSize: 16,
  },
  statsRow: {
    display: "flex",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 28px",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #e2e8f0",
  },
  statNum: {
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#475569",
  },
  filterBtn: {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 13,
    transition: "all 0.2s",
  },
  filterActive: {
    padding: "8px 16px",
    background: "#3b82f6",
    color: "#fff",
    border: "1px solid #3b82f6",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 80,
    color: "#64748b",
    background: "#fff",
    borderRadius: 16,
    border: "2px dashed #e2e8f0",
  },
  tablesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 32,
  },
  tableCard: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderLeft: "5px solid",
    flexWrap: "wrap",
    gap: 16,
  },
  entityInfo: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  entityAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 20,
  },
  entityName: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
  },
  entityMeta: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0",
  },
  entityBadges: {
    display: "flex",
    gap: 10,
  },
  badge: {
    padding: "6px 14px",
    background: "rgba(255,255,255,0.7)",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
  },
  tableScroll: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 700,
  },
  thDay: {
    padding: "16px 20px",
    background: "#f8fafc",
    fontSize: 13,
    fontWeight: 700,
    color: "#475569",
    textAlign: "left",
    borderBottom: "2px solid #e2e8f0",
    width: 140,
    position: "sticky",
    left: 0,
    zIndex: 1,
  },
  thTime: {
    padding: "14px 12px",
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
    minWidth: 150,
    textAlign: "center",
  },
  timeHead: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  timeMain: {
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
  },
  timeTo: {
    fontSize: 10,
    color: "#94a3b8",
  },
  timeSub: {
    fontSize: 13,
    color: "#64748b",
  },
  tdDayCell: {
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
    background: "#fafbfc",
    position: "sticky",
    left: 0,
    zIndex: 1,
  },
  dayBox: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  dayDot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    flexShrink: 0,
  },
  dayInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  dayDate: {
    fontSize: 12,
    color: "#64748b",
  },
  tdEmpty: {
    padding: 12,
    borderBottom: "1px solid #f1f5f9",
    textAlign: "center",
    color: "#cbd5e1",
    fontSize: 14,
  },
  tdSlot: {
    padding: 8,
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  },
  slotBox: {
    padding: 14,
    borderRadius: 12,
    border: "2px solid",
    minHeight: 90,
  },
  slotSubject: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 8,
  },
  slotTeacher: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 10,
  },
  slotNoTeacher: {
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
    marginBottom: 10,
  },
  slotBatch: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 10,
  },
  slotNoBatch: {
    fontSize: 11,
    color: "#94a3b8",
    fontStyle: "italic",
    marginBottom: 10,
  },
  slotFooter: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  slotCode: {
    fontSize: 10,
    fontWeight: 600,
    color: "#64748b",
    background: "rgba(255,255,255,0.6)",
    padding: "3px 8px",
    borderRadius: 6,
  },
  slotRoom: {
    fontSize: 10,
    color: "#64748b",
  },
  noSlotsMessage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    color: "#64748b",
    background: "#fafbfc",
    borderTop: "1px solid #e2e8f0",
    gap: 8,
    minHeight: 120,
  },
  assignedBatchesText: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: 500,
    marginTop: 4,
  },
};

export default GeneratedTimetable;
