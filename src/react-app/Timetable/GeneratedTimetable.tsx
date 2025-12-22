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
  // New fields for available teachers
  available_teachers?: AvailableTeacher[];
  show_available_teachers?: boolean;
}

interface AvailableTeacher {
  teacher_id: string;
  teacher_code: string;
  teacher_name: string;
  subject_specializations?: string[];
  is_available: boolean;
  current_assignment?: string;
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
  batches?: string[];
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

  // Available teachers state
  const [loadingAvailableTeachers, setLoadingAvailableTeachers] = useState<{[key: string]: boolean}>({});

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

  // Load available teachers for a specific slot
  const loadAvailableTeachers = useCallback(async (slotId: string) => {
    if (!timetableId) return null;
    
    setLoadingAvailableTeachers(prev => ({ ...prev, [slotId]: true }));
    
    try {
      const response = await Fetch(
        `/api/timetable/timetables/${timetableId}/slots/${slotId}/available-teachers/`,
        { method: "GET" }
      );
      
      if (!response.ok) {
        console.warn(`Failed to load available teachers for slot ${slotId}: ${response.status}`);
        return null;
      }
      
      const data = await response.json();
      return data.available_teachers || [];
    } catch (err: any) {
      console.warn(`Error loading available teachers for slot ${slotId}:`, err.message);
      return null;
    } finally {
      setLoadingAvailableTeachers(prev => ({ ...prev, [slotId]: false }));
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

  // Toggle available teachers for a slot
  const toggleAvailableTeachers = useCallback(async (slotId: string, dayKey: string, timeSlot: string, entityId: string, entityType: 'batch' | 'teacher') => {
    // Update the state based on entity type
    if (entityType === 'batch') {
      setBatches(prev => prev.map(batch => {
        if (batch.batch_id === entityId) {
          const updatedSlots = { ...batch.slots };
          if (updatedSlots[dayKey]) {
            updatedSlots[dayKey] = updatedSlots[dayKey].map(slot => {
              if (slot.slot_id === slotId) {
                const shouldShow = !slot.show_available_teachers;
                
                // If we need to show and haven't loaded yet, load the data
                if (shouldShow && !slot.available_teachers) {
                  loadAvailableTeachers(slotId).then(teachers => {
                    if (teachers) {
                      setBatches(prevBatches => prevBatches.map(b => {
                        if (b.batch_id === entityId) {
                          const updated = { ...b };
                          if (updated.slots[dayKey]) {
                            updated.slots[dayKey] = updated.slots[dayKey].map(s => {
                              if (s.slot_id === slotId) {
                                return { ...s, available_teachers: teachers, show_available_teachers: true };
                              }
                              return s;
                            });
                          }
                          return updated;
                        }
                        return b;
                      }));
                    }
                  });
                }
                
                return {
                  ...slot,
                  show_available_teachers: shouldShow
                };
              }
              return slot;
            });
          }
          return { ...batch, slots: updatedSlots };
        }
        return batch;
      }));
    } else {
      setTeachers(prev => prev.map(teacher => {
        if (teacher.teacher_id === entityId) {
          const updatedSlots = { ...teacher.slots };
          if (updatedSlots[dayKey]) {
            updatedSlots[dayKey] = updatedSlots[dayKey].map(slot => {
              if (slot.slot_id === slotId) {
                const shouldShow = !slot.show_available_teachers;
                
                // If we need to show and haven't loaded yet, load the data
                if (shouldShow && !slot.available_teachers) {
                  loadAvailableTeachers(slotId).then(teachers => {
                    if (teachers) {
                      setTeachers(prevTeachers => prevTeachers.map(t => {
                        if (t.teacher_id === entityId) {
                          const updated = { ...t };
                          if (updated.slots[dayKey]) {
                            updated.slots[dayKey] = updated.slots[dayKey].map(s => {
                              if (s.slot_id === slotId) {
                                return { ...s, available_teachers: teachers, show_available_teachers: true };
                              }
                              return s;
                            });
                          }
                          return updated;
                        }
                        return t;
                      }));
                    }
                  });
                }
                
                return {
                  ...slot,
                  show_available_teachers: shouldShow
                };
              }
              return slot;
            });
          }
          return { ...teacher, slots: updatedSlots };
        }
        return teacher;
      }));
    }
  }, [loadAvailableTeachers]);

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
          {viewMode === "batch" && (
            <div style={styles.headerStatsInline}>
              <button style={styles.headerStatBtn} onClick={() => setViewMode("batch")}>
                <div style={styles.headerStatNum}>{batches.length}</div>
                <div style={styles.headerStatLabel}>Total Batches</div>
              </button>
              <button style={styles.headerStatBtn} onClick={() => setViewMode("batch")}>
                <div style={styles.headerStatNum}>{batches.reduce((sum, b) => sum + b.total_classes, 0)}</div>
                <div style={styles.headerStatLabel}>Total Classes</div>
              </button>
            </div>
          )}
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
          <></>
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

      {/* Info Banner */}
      <div style={styles.infoBanner}>
        <span style={styles.infoIcon}>ℹ️</span>
        <span>
          Click on any class slot to view available teachers for that time period
        </span>
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
                toggleAvailableTeachers={toggleAvailableTeachers}
                loadingAvailableTeachers={loadingAvailableTeachers}
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
                toggleAvailableTeachers={toggleAvailableTeachers}
                loadingAvailableTeachers={loadingAvailableTeachers}
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
  toggleAvailableTeachers: (slotId: string, dayKey: string, timeSlot: string, entityId: string, entityType: 'batch' | 'teacher') => void;
  loadingAvailableTeachers: {[key: string]: boolean};
}

const BatchTable: React.FC<BatchTableProps> = ({
  batch,
  color,
  getSubjectColor,
  toggleAvailableTeachers,
  loadingAvailableTeachers
}) => {
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
          entityId={batch.batch_id}
          entityType="batch"
          toggleAvailableTeachers={toggleAvailableTeachers}
          loadingAvailableTeachers={loadingAvailableTeachers}
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
  toggleAvailableTeachers: (slotId: string, dayKey: string, timeSlot: string, entityId: string, entityType: 'batch' | 'teacher') => void;
  loadingAvailableTeachers: {[key: string]: boolean};
}

const TeacherTable: React.FC<TeacherTableProps> = ({
  teacher,
  color,
  getSubjectColor,
  toggleAvailableTeachers,
  loadingAvailableTeachers
}) => {
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
            entityId={teacher.teacher_id}
            entityType="teacher"
            toggleAvailableTeachers={toggleAvailableTeachers}
            loadingAvailableTeachers={loadingAvailableTeachers}
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

/* ================= STANDARD TIMETABLE GRID ================= */
interface StandardTimetableGridProps {
  slots: { [dayKey: string]: SlotData[] };
  dayKeys: string[];
  timeSlots: { start: string; end: string }[];
  getSubjectColor: (s: string | null) => { bg: string; text: string; border: string };
  showBatch: boolean;
  entityId: string;
  entityType: 'batch' | 'teacher';
  toggleAvailableTeachers: (slotId: string, dayKey: string, timeSlot: string, entityId: string, entityType: 'batch' | 'teacher') => void;
  loadingAvailableTeachers: {[key: string]: boolean};
}

const StandardTimetableGrid: React.FC<StandardTimetableGridProps> = ({
  slots,
  dayKeys,
  timeSlots,
  getSubjectColor,
  showBatch,
  entityId,
  entityType,
  toggleAvailableTeachers,
  loadingAvailableTeachers
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

  const handleSlotClick = (slot: SlotData, dayKey: string) => {
    toggleAvailableTeachers(slot.slot_id, dayKey, `${slot.start_time}-${slot.end_time}`, entityId, entityType);
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
                const isLoading = loadingAvailableTeachers[slot.slot_id];
                
                return (
                  <td key={`${dk}-${timeIdx}`} style={styles.slotCell}>
                    <div
                      style={{
                        ...styles.slotCard,
                        backgroundColor: sc.bg,
                        borderColor: sc.border,
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => handleSlotClick(slot, dk)}
                      title="Click to view available teachers"
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

                      {/* Available teachers toggle indicator */}
                      <div style={styles.availableTeachersIndicator}>
                        {isLoading ? (
                          <span style={styles.loadingIndicator}>⏳</span>
                        ) : slot.show_available_teachers ? (
                          <span style={styles.indicatorOpen}>▼</span>
                        ) : (
                          <span style={styles.indicatorClosed}>▶</span>
                        )}
                        <span style={styles.indicatorText}>
                          {slot.available_teachers?.length || 0} available
                        </span>
                      </div>
                    </div>

                    {/* Available teachers panel */}
                    {slot.show_available_teachers && (
                      <div style={styles.availableTeachersPanel}>
                        <div style={styles.availableTeachersHeader}>
                          <span style={styles.availableTeachersTitle}>
                            👨‍🏫 Available Teachers ({time.start} - {time.end})
                          </span>
                        </div>
                        
                        {isLoading ? (
                          <div style={styles.loadingTeachers}>
                            <div style={styles.smallSpinner}></div>
                            <span>Loading available teachers...</span>
                          </div>
                        ) : slot.available_teachers && slot.available_teachers.length > 0 ? (
                          <div style={styles.teachersList}>
                            {slot.available_teachers.map((teacher, idx) => (
                              <div
                                key={teacher.teacher_id}
                                style={{
                                  ...styles.teacherItem,
                                  backgroundColor: teacher.is_available ? '#f0fdf4' : '#fef2f2',
                                  borderLeft: `4px solid ${teacher.is_available ? '#22c55e' : '#ef4444'}`
                                }}
                              >
                                <div style={styles.teacherInfo}>
                                  <span style={styles.teacherName}>{teacher.teacher_name}</span>
                                  <span style={styles.teacherCode}>({teacher.teacher_code})</span>
                                </div>
                                <div style={styles.teacherStatus}>
                                  {teacher.is_available ? (
                                    <span style={styles.statusAvailable}>✅ Available</span>
                                  ) : (
                                    <span style={styles.statusUnavailable}>❌ Unavailable</span>
                                  )}
                                </div>
                                {teacher.subject_specializations && teacher.subject_specializations.length > 0 && (
                                  <div style={styles.teacherSubjects}>
                                    <span style={styles.subjectsLabel}>Subjects: </span>
                                    {teacher.subject_specializations.join(", ")}
                                  </div>
                                )}
                                {teacher.current_assignment && (
                                  <div style={styles.currentAssignment}>
                                    Currently: {teacher.current_assignment}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={styles.noTeachersMessage}>
                            <span>No available teachers found for this time slot</span>
                          </div>
                        )}
                      </div>
                    )}
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
  smallSpinner: {
    width: 16,
    height: 16,
    border: "2px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
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
  headerStatsInline: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  headerStatBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    minWidth: 96,
    cursor: 'pointer',
  },
  headerStatNum: {
    fontSize: 16,
    fontWeight: 700,
    color: '#0f172a',
    lineHeight: 1,
  },
  headerStatLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: 600,
  },
  infoBanner: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "linear-gradient(135deg, #dbeafe, #93c5fd)",
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 14,
    color: "#1e40af",
    fontWeight: 500,
  },
  infoIcon: {
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
    gap: 12,
    marginBottom: 20,
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
  timetableContainer: {
    padding: 20,
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
    transition: "all 0.2s ease",
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
  availableTeachersIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1px dashed rgba(0,0,0,0.1)",
    fontSize: 10,
    color: "#64748b",
  },
  loadingIndicator: {
    fontSize: 10,
  },
  indicatorOpen: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  indicatorClosed: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  indicatorText: {
    fontSize: 9,
    fontWeight: 600,
  },
  availableTeachersPanel: {
    marginTop: 8,
    background: "#f8fafc",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    animation: "slideDown 0.3s ease-out",
  },
  availableTeachersHeader: {
    padding: "10px 12px",
    background: "#e2e8f0",
    borderBottom: "1px solid #cbd5e1",
  },
  availableTeachersTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
  },
  loadingTeachers: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "16px",
    color: "#64748b",
    fontSize: 12,
  },
  teachersList: {
    maxHeight: 200,
    overflowY: "auto",
  },
  teacherItem: {
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
    transition: "background-color 0.2s",
  },
  teacherInfo: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#1e293b",
  },
  teacherCode: {
    fontSize: 11,
    color: "#64748b",
  },
  teacherStatus: {
    marginBottom: 4,
  },
  statusAvailable: {
    fontSize: 10,
    color: "#166534",
    fontWeight: 600,
    padding: "2px 6px",
    background: "#dcfce7",
    borderRadius: 4,
    display: "inline-block",
  },
  statusUnavailable: {
    fontSize: 10,
    color: "#991b1b",
    fontWeight: 600,
    padding: "2px 6px",
    background: "#fee2e2",
    borderRadius: 4,
    display: "inline-block",
  },
  teacherSubjects: {
    fontSize: 10,
    color: "#475569",
    marginTop: 2,
  },
  subjectsLabel: {
    fontWeight: 600,
  },
  currentAssignment: {
    fontSize: 9,
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 2,
  },
  noTeachersMessage: {
    padding: "16px",
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
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

// Add CSS animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 300px;
    }
  }
`, styleSheet.cssRules.length);

export default GeneratedTimetable;