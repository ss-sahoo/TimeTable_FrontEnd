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
type DisplayMode = "all" | "single";

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

const DAY_NAMES: { [key: string]: string } = {
  "d1": "Monday",
  "d2": "Tuesday",
  "d3": "Wednesday",
  "d4": "Thursday",
  "d5": "Friday",
  "d6": "Saturday",
  "d7": "Sunday",
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
  const [displayMode, setDisplayMode] = useState<DisplayMode>("all");
  
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
        // Auto-select first batch if in single mode
        if (data.batches && data.batches.length > 0 && displayMode === "single") {
          setSelectedBatchId(data.batches[0].batch_id);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timetableId, displayMode]);

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
        // Auto-select first teacher if in single mode
        if (data.teachers && data.teachers.length > 0 && displayMode === "single") {
          setSelectedTeacherId(data.teachers[0].teacher_id);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timetableId, displayMode]);

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
          onClick={() => { setViewMode("batch"); setSelectedBatchId("all"); setDisplayMode("all"); }}
        >
          <span style={styles.tabIcon}>📚</span>
          Batch-wise View
        </button>
        <button
          style={viewMode === "teacher" ? styles.viewTabActive : styles.viewTab}
          onClick={() => { setViewMode("teacher"); setSelectedTeacherId("all"); setDisplayMode("all"); }}
        >
          <span style={styles.tabIcon}>👨‍🏫</span>
          Teacher-wise View
        </button>
      </div>

      {/* Display Mode Toggle */}
      <div style={styles.displayModeToggle}>
        <button
          style={displayMode === "all" ? styles.displayModeActive : styles.displayModeBtn}
          onClick={() => {
            setDisplayMode("all");
            if (viewMode === "batch") setSelectedBatchId("all");
            else setSelectedTeacherId("all");
          }}
        >
          <span style={styles.displayModeIcon}>📋</span>
          All {viewMode === "batch" ? "Batches" : "Teachers"}
        </button>
        <button
          style={displayMode === "single" ? styles.displayModeActive : styles.displayModeBtn}
          onClick={() => setDisplayMode("single")}
        >
          <span style={styles.displayModeIcon}>👤</span>
          Single {viewMode === "batch" ? "Batch" : "Teacher"}
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

      {/* Filter Row - Only show in single display mode */}
      {displayMode === "single" && (
        <div style={styles.filterRow}>
          <span style={styles.filterLabel}>
            Select {viewMode === "batch" ? "Batch" : "Teacher"}:
          </span>
          {viewMode === "batch" ? (
            <select
              style={styles.filterSelect}
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.batch_name} ({b.batch_code})
                </option>
              ))}
            </select>
          ) : (
            <select
              style={styles.filterSelect}
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
            >
              {teachers.map((t) => (
                <option key={t.teacher_id} value={t.teacher_id}>
                  {t.teacher_name} ({t.teacher_code})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* All View Buttons - Only show in all display mode */}
      {displayMode === "all" && (
        <div style={styles.filterRow}>
          <span style={styles.filterLabel}>View all {viewMode === "batch" ? "batches" : "teachers"}:</span>
          {viewMode === "batch" ? (
            batches.map((b, i) => (
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
            ))
          ) : (
            teachers.map((t, i) => (
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
            ))
          )}
        </div>
      )}

      {/* Content */}
      {viewMode === "batch" ? (
        batches.length === 0 ? (
          <EmptyState message="No batch timetable data available" />
        ) : displayMode === "single" ? (
          <SingleTimetableView
            type="batch"
            entities={filteredBatches}
            getEntityColor={getBatchColor}
            getSubjectColor={getSubjectColor}
          />
        ) : (
          <AllTimetablesView
            type="batch"
            entities={filteredBatches}
            getEntityColor={getBatchColor}
            getSubjectColor={getSubjectColor}
          />
        )
      ) : (
        teachers.length === 0 ? (
          <EmptyState message="No teacher timetable data available" />
        ) : displayMode === "single" ? (
          <SingleTimetableView
            type="teacher"
            entities={filteredTeachers}
            getEntityColor={getTeacherColor}
            getSubjectColor={getSubjectColor}
          />
        ) : (
          <AllTimetablesView
            type="teacher"
            entities={filteredTeachers}
            getEntityColor={getTeacherColor}
            getSubjectColor={getSubjectColor}
          />
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

/* ================= SINGLE TIMETABLE VIEW ================= */
interface SingleTimetableViewProps {
  type: "batch" | "teacher";
  entities: any[];
  getEntityColor: (idx: number) => { bg: string; border: string; text: string };
  getSubjectColor: (s: string | null) => { bg: string; text: string; border: string };
}

const SingleTimetableView: React.FC<SingleTimetableViewProps> = ({
  type,
  entities,
  getEntityColor,
  getSubjectColor,
}) => {
  if (entities.length === 0) return <EmptyState message={`No ${type} selected`} />;
  
  const entity = entities[0];
  const color = getEntityColor(0);
  
  if (type === "batch") {
    return <BatchTable batch={entity} color={color} getSubjectColor={getSubjectColor} />;
  } else {
    return <TeacherTable teacher={entity} color={color} getSubjectColor={getSubjectColor} />;
  }
};

/* ================= ALL TIMETABLES VIEW ================= */
interface AllTimetablesViewProps {
  type: "batch" | "teacher";
  entities: any[];
  getEntityColor: (idx: number) => { bg: string; border: string; text: string };
  getSubjectColor: (s: string | null) => { bg: string; text: string; border: string };
}

const AllTimetablesView: React.FC<AllTimetablesViewProps> = ({
  type,
  entities,
  getEntityColor,
  getSubjectColor,
}) => {
  if (entities.length === 0) return <EmptyState message={`No ${type}s available`} />;
  
  return (
    <div style={styles.allTablesContainer}>
      {entities.map((entity, idx) =>
        type === "batch" ? (
          <CompactBatchTable
            key={entity.batch_id}
            batch={entity}
            color={getEntityColor(idx)}
            getSubjectColor={getSubjectColor}
          />
        ) : (
          <CompactTeacherTable
            key={entity.teacher_id}
            teacher={entity}
            color={getEntityColor(idx)}
            getSubjectColor={getSubjectColor}
          />
        )
      )}
    </div>
  );
};

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

      <div style={styles.timetableContainer}>
        <StandardTimetableGrid
          slots={batch.slots}
          dayKeys={dayKeys}
          timeSlots={timeSlots}
          getSubjectColor={getSubjectColor}
          showBatch={false}
        />
      </div>
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

      <div style={styles.timetableContainer}>
        {hasSlots ? (
          <StandardTimetableGrid
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
    </div>
  );
};

/* ================= COMPACT BATCH TABLE ================= */
const CompactBatchTable: React.FC<BatchTableProps> = ({ batch, color, getSubjectColor }) => {
  const dayKeys = Object.keys(batch.slots || {}).sort();
  const timeSlots = getUniqueTimeSlots(batch.slots, dayKeys);

  return (
    <div style={styles.compactTableCard}>
      <div style={{ ...styles.compactHeader, borderLeftColor: color.border }}>
        <div style={styles.compactEntityInfo}>
          <div style={{ ...styles.compactAvatar, backgroundColor: color.border }}>
            {batch.batch_name.charAt(0)}
          </div>
          <div style={styles.compactEntityDetails}>
            <h4 style={{ ...styles.compactName, color: color.text }}>{batch.batch_name}</h4>
            <p style={styles.compactMeta}>{batch.batch_code} • {dayKeys.length} days</p>
          </div>
        </div>
        <div style={styles.compactBadge}>
          {batch.total_classes} classes
        </div>
      </div>
      
      <div style={styles.compactTimetable}>
        <CompactTimetableGrid
          slots={batch.slots}
          dayKeys={dayKeys}
          timeSlots={timeSlots}
          getSubjectColor={getSubjectColor}
          showBatch={false}
        />
      </div>
    </div>
  );
};

/* ================= COMPACT TEACHER TABLE ================= */
const CompactTeacherTable: React.FC<TeacherTableProps> = ({ teacher, color, getSubjectColor }) => {
  const dayKeys = Object.keys(teacher.slots || {}).sort();
  const timeSlots = getUniqueTimeSlots(teacher.slots, dayKeys);

  return (
    <div style={styles.compactTableCard}>
      <div style={{ ...styles.compactHeader, borderLeftColor: color.border }}>
        <div style={styles.compactEntityInfo}>
          <div style={{ ...styles.compactAvatar, backgroundColor: color.border }}>
            👨‍🏫
          </div>
          <div style={styles.compactEntityDetails}>
            <h4 style={{ ...styles.compactName, color: color.text }}>{teacher.teacher_name}</h4>
            <p style={styles.compactMeta}>{teacher.teacher_code}</p>
          </div>
        </div>
        <div style={styles.compactBadge}>
          {teacher.total_classes} classes
        </div>
      </div>
      
      <div style={styles.compactTimetable}>
        <CompactTimetableGrid
          slots={teacher.slots}
          dayKeys={dayKeys}
          timeSlots={timeSlots}
          getSubjectColor={getSubjectColor}
          showBatch={true}
        />
      </div>
    </div>
  );
};

/* ================= STANDARD TIMETABLE GRID ================= */
interface StandardTimetableGridProps {
  slots: { [dayKey: string]: SlotData[] };
  dayKeys: string[];
  timeSlots: { start: string; end: string }[];
  getSubjectColor: (s: string | null) => { bg: string; text: string; border: string };
  showBatch: boolean;
}

const StandardTimetableGrid: React.FC<StandardTimetableGridProps> = ({
  slots,
  dayKeys,
  timeSlots,
  getSubjectColor,
  showBatch,
}) => {
  const getTeacherName = (teacher: string | TeacherInfo | null): string | null => {
    if (!teacher) return null;
    if (typeof teacher === "string") return teacher;
    return teacher.teacher_name || teacher.teacher_code || null;
  };

  const getBatchDisplayName = (slot: SlotData): string | null => {
    if (slot.batch_name) return slot.batch_name;
    if (slot.batch_code) return slot.batch_code;
    if (!slot.batch) return null;
    if (typeof slot.batch === "string") return slot.batch;
    return slot.batch.batch_name || slot.batch.batch_code || null;
  };

  return (
    <div style={styles.tableScroll}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.thTime}>Time</th>
            {dayKeys.map((dk) => (
              <th key={dk} style={styles.thDay}>
                <div style={styles.dayHeader}>
                  <div style={{ ...styles.dayDot, backgroundColor: DAY_COLORS[dk] || "#64748b" }}></div>
                  <div style={styles.dayHeaderContent}>
                    <span style={styles.dayName}>{DAY_NAMES[dk] || `Day ${dk.replace("d", "")}`}</span>
                    {slots[dk]?.[0]?.actual_date && (
                      <span style={styles.dayDate}>{slots[dk][0].actual_date}</span>
                    )}
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time, timeIdx) => (
            <tr key={`time-${timeIdx}`}>
              <td style={styles.timeCell}>
                <div style={styles.timeSlotDisplay}>
                  <span style={styles.timeStart}>{time.start}</span>
                  <span style={styles.timeSeparator}>-</span>
                  <span style={styles.timeEnd}>{time.end}</span>
                </div>
              </td>
              {dayKeys.map((dk) => {
                const slot = (slots[dk] || []).find(
                  (s) => s.start_time === time.start && s.end_time === time.end
                );
                
                if (!slot) {
                  return <td key={`${dk}-${timeIdx}`} style={styles.emptyCell}></td>;
                }

                const sc = getSubjectColor(slot.subject);
                const teacherName = getTeacherName(slot.teacher);
                const batchName = getBatchDisplayName(slot);
                
                return (
                  <td key={`${dk}-${timeIdx}`} style={styles.slotCell}>
                    <div
                      style={{
                        ...styles.slotCard,
                        backgroundColor: sc.bg,
                        borderColor: sc.border,
                      }}
                    >
                      <div style={styles.slotHeader}>
                        <span style={{ ...styles.slotSubject, color: sc.text }}>
                          {slot.subject || "Free"}
                        </span>
                        <span style={styles.slotCode}>{slot.slot_code}</span>
                      </div>
                      
                      <div style={styles.slotContent}>
                        {showBatch ? (
                          batchName && (
                            <div style={styles.slotBatch}>
                              <span style={styles.slotIcon}>📚</span>
                              {batchName}
                            </div>
                          )
                        ) : (
                          teacherName && (
                            <div style={styles.slotTeacher}>
                              <span style={styles.slotIcon}>👨‍🏫</span>
                              {teacherName}
                            </div>
                          )
                        )}
                        
                        {slot.room_number && (
                          <div style={styles.slotRoom}>
                            <span style={styles.slotIcon}>🏠</span>
                            {slot.room_number}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ================= COMPACT TIMETABLE GRID ================= */
const CompactTimetableGrid: React.FC<StandardTimetableGridProps> = ({
  slots,
  dayKeys,
  timeSlots,
  getSubjectColor,
  showBatch,
}) => {
  const getTeacherName = (teacher: string | TeacherInfo | null): string | null => {
    if (!teacher) return null;
    if (typeof teacher === "string") return teacher;
    return teacher.teacher_name || teacher.teacher_code || null;
  };

  const getBatchDisplayName = (slot: SlotData): string | null => {
    if (slot.batch_name) return slot.batch_name;
    if (slot.batch_code) return slot.batch_code;
    if (!slot.batch) return null;
    if (typeof slot.batch === "string") return slot.batch;
    return slot.batch.batch_name || slot.batch.batch_code || null;
  };

  return (
    <div style={styles.compactGrid}>
      {dayKeys.map((dk) => (
        <div key={dk} style={styles.compactDayColumn}>
          <div style={styles.compactDayHeader}>
            <div style={{ ...styles.compactDayDot, backgroundColor: DAY_COLORS[dk] || "#64748b" }}></div>
            <span style={styles.compactDayName}>
              {DAY_NAMES[dk]?.substring(0, 3) || dk.replace("d", "")}
            </span>
          </div>
          
          <div style={styles.compactDaySlots}>
            {timeSlots.map((time) => {
              const slot = (slots[dk] || []).find(
                (s) => s.start_time === time.start && s.end_time === time.end
              );
              
              if (!slot) return null;

              const sc = getSubjectColor(slot.subject);
              const teacherName = getTeacherName(slot.teacher);
              const batchName = getBatchDisplayName(slot);
              
              return (
                <div
                  key={`${dk}-${time.start}`}
                  style={{
                    ...styles.compactSlot,
                    backgroundColor: sc.bg,
                    borderColor: sc.border,
                  }}
                >
                  <div style={styles.compactSlotTime}>{time.start}</div>
                  <div style={{ ...styles.compactSlotSubject, color: sc.text }}>
                    {slot.subject?.substring(0, 6) || "Free"}
                  </div>
                  <div style={styles.compactSlotInfo}>
                    {showBatch ? (
                      batchName && (
                        <span style={styles.compactSlotText}>📚</span>
                      )
                    ) : (
                      teacherName && (
                        <span style={styles.compactSlotText}>👨‍🏫</span>
                      )
                    )}
                    {slot.room_number && (
                      <span style={styles.compactSlotText}>🏠{slot.room_number}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
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
    marginBottom: 16,
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
  displayModeToggle: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    background: "#fff",
    padding: 6,
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    width: "fit-content",
  },
  displayModeBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 13,
    color: "#64748b",
    transition: "all 0.2s",
  },
  displayModeActive: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    color: "#fff",
    boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
  },
  displayModeIcon: {
    fontSize: 14,
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
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#475569",
    minWidth: "fit-content",
  },
  filterSelect: {
    padding: "10px 16px",
    background: "#fff",
    border: "2px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    color: "#475569",
    fontWeight: 500,
    minWidth: 250,
    cursor: "pointer",
    outline: "none",
    transition: "border-color 0.2s",
  },
  filterBtn: {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 13,
    color: "#475569",
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
  allTablesContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
    gap: 20,
  },
  tableCard: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
  },
  compactTableCard: {
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    border: "1px solid #e2e8f0",
  },
  timetableContainer: {
    padding: 20,
  },
  compactTimetable: {
    padding: 16,
    paddingTop: 0,
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
  compactHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderLeft: "4px solid",
  },
  entityInfo: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  compactEntityInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
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
  compactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
  },
  entityName: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
  },
  compactName: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  entityMeta: {
    fontSize: 13,
    color: "#64748b",
    margin: "4px 0 0",
  },
  compactMeta: {
    fontSize: 12,
    color: "#64748b",
    margin: "2px 0 0",
  },
  compactEntityDetails: {
    display: "flex",
    flexDirection: "column",
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
  compactBadge: {
    padding: "4px 10px",
    background: "#f1f5f9",
    borderRadius: 16,
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
  },
  tableScroll: {
    overflowX: "auto",
    borderRadius: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 800,
  },
  thTime: {
    padding: "16px",
    background: "#f8fafc",
    fontSize: 14,
    fontWeight: 700,
    color: "#475569",
    textAlign: "center",
    border: "1px solid #e2e8f0",
    width: 100,
    position: "sticky",
    left: 0,
    zIndex: 1,
  },
  thDay: {
    padding: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  },
  dayHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
  },
  dayHeaderContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  dayName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  dayDate: {
    fontSize: 12,
    color: "#64748b",
  },
  timeCell: {
    padding: "12px",
    background: "#fafbfc",
    border: "1px solid #e2e8f0",
    textAlign: "center",
    position: "sticky",
    left: 0,
    zIndex: 1,
  },
  timeSlotDisplay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  timeStart: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
  },
  timeSeparator: {
    fontSize: 10,
    color: "#94a3b8",
  },
  timeEnd: {
    fontSize: 12,
    color: "#64748b",
  },
  emptyCell: {
    padding: "12px",
    background: "#fafbfc",
    border: "1px solid #e2e8f0",
    textAlign: "center",
  },
  slotCell: {
    padding: "8px",
    border: "1px solid #e2e8f0",
    verticalAlign: "top",
  },
  slotCard: {
    padding: "12px",
    borderRadius: 8,
    border: "2px solid",
    minHeight: 80,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  slotHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  slotSubject: {
    fontSize: 14,
    fontWeight: 700,
    flex: 1,
  },
  slotCode: {
    fontSize: 10,
    fontWeight: 600,
    color: "#64748b",
    background: "rgba(255,255,255,0.6)",
    padding: "2px 6px",
    borderRadius: 4,
  },
  slotContent: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  slotTeacher: {
    fontSize: 12,
    color: "#475569",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  slotBatch: {
    fontSize: 12,
    color: "#475569",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  slotRoom: {
    fontSize: 11,
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  slotIcon: {
    fontSize: 10,
  },
  compactGrid: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 8,
  },
  compactDayColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 70,
  },
  compactDayHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px",
    background: "#f8fafc",
    borderRadius: 6,
    justifyContent: "center",
  },
  compactDayDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },
  compactDayName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#0f172a",
  },
  compactDaySlots: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  compactSlot: {
    padding: "8px",
    borderRadius: 6,
    border: "1px solid",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    alignItems: "center",
    textAlign: "center",
  },
  compactSlotTime: {
    fontSize: 10,
    fontWeight: 600,
    color: "#475569",
  },
  compactSlotSubject: {
    fontSize: 11,
    fontWeight: 700,
  },
  compactSlotInfo: {
    display: "flex",
    gap: 4,
    fontSize: 9,
    color: "#64748b",
    alignItems: "center",
  },
  compactSlotText: {
    display: "flex",
    alignItems: "center",
    gap: 1,
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

// Add CSS animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default GeneratedTimetable;