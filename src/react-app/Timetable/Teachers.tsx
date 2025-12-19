import React, { useEffect, useState, useCallback } from "react";
import { fetchTeacherWiseAvailability, updateTeacherAvailability, cleanTimetableId } from "../AllApi";

/* ================= TYPES ================= */
interface SlotData {
  slot_id: string;
  slot_code: string;
  start_time: string;
  end_time: string;
  is_free_class: boolean;
  is_available: boolean;
}

interface DayData {
  day: string;
  day_number: number;
  date: string;
  slots: SlotData[];
}

interface TeacherData {
  teacher_code: string;
  teacher_name: string;
  teacher_id: string;
  days: DayData[];
}

interface ApiResponse {
  timetable_id: string;
  timetable: string;
  center: string;
  from_date: string;
  to_date: string;
  teachers: TeacherData[];
}

interface UniqueDayInfo {
  day: string;
  date: string;
  day_number: number;
}

/* ================= DAY COLORS ================= */
const DAY_COLORS: { [key: string]: string } = {
  "Monday": "#3B82F6",
  "Tuesday": "#10B981",
  "Wednesday": "#8B5CF6",
  "Thursday": "#F59E0B",
  "Friday": "#EF4444",
  "Saturday": "#EC4899",
  "Sunday": "#06B6D4",
};

/* ================= MAIN COMPONENT ================= */
const TeachersAvailability: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [updatingSlot, setUpdatingSlot] = useState<string | null>(null);

  /* Get timetable ID from localStorage */
  useEffect(() => {
    const rawId = localStorage.getItem("timetable_id");
    if (rawId) {
      const cleanId = cleanTimetableId(rawId);
      console.log("Timetable ID loaded:", cleanId);
      setTimetableId(cleanId);
    } else {
      setError("No timetable ID found. Please create a timetable first.");
      setLoading(false);
    }
  }, []);

  /* Fetch teacher availability when timetableId is available */
  const loadAvailability = useCallback(async () => {
    if (!timetableId) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching teacher availability for:", timetableId);
      const data: ApiResponse = await fetchTeacherWiseAvailability(timetableId);
      console.log("API Response:", data);

      if (data && data.teachers && Array.isArray(data.teachers)) {
        setApiData(data);
        setTeachers(data.teachers);
        console.log("Teachers loaded:", data.teachers.length);
      } else {
        console.log("No teachers in response:", data);
        setTeachers([]);
      }
    } catch (err: any) {
      console.error("Failed to fetch availability:", err);
      setError(err.message || "Failed to load teacher availability");
    } finally {
      setLoading(false);
    }
  }, [timetableId]);

  /* Load availability when timetableId changes */
  useEffect(() => {
    if (timetableId) {
      loadAvailability();
    }
  }, [timetableId, loadAvailability]);

  /* Get unique days with dates from all teachers */
  const getUniqueDays = (): UniqueDayInfo[] => {
    const daysMap = new Map<string, UniqueDayInfo>();
    teachers.forEach(teacher => {
      if (!teacher.days) return;
      teacher.days.forEach(dayData => {
        const key = `${dayData.date}-${dayData.day}`;
        if (!daysMap.has(key)) {
          daysMap.set(key, {
            day: dayData.day,
            date: dayData.date,
            day_number: dayData.day_number
          });
        }
      });
    });
    // Sort by day_number (chronological order)
    return Array.from(daysMap.values()).sort((a, b) => a.day_number - b.day_number);
  };

  /* Get slots for a teacher on a specific day/date */
  const getTeacherSlotsForDay = (teacher: TeacherData, date: string): SlotData[] => {
    if (!teacher.days) return [];
    const dayData = teacher.days.find(d => d.date === date);
    if (!dayData || !dayData.slots) return [];
    return dayData.slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  /* Format time for display */
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  /* Toggle availability for a slot */
  const handleToggleAvailability = async (
    teacherCode: string,
    slotId: string,
    currentStatus: boolean
  ) => {
    if (!timetableId || updatingSlot) return;

    const newStatus = !currentStatus;
    const slotKey = `${teacherCode}-${slotId}`;
    setUpdatingSlot(slotKey);

    // Optimistic update
    setTeachers(prev =>
      prev.map(teacher =>
        teacher.teacher_code === teacherCode
          ? {
              ...teacher,
              days: teacher.days.map(day => ({
                ...day,
                slots: day.slots.map(slot =>
                  slot.slot_id === slotId
                    ? { ...slot, is_available: newStatus }
                    : slot
                )
              }))
            }
          : teacher
      )
    );

    try {
      console.log("Updating availability:", { timetableId, slotId, teacherCode, newStatus });
      await updateTeacherAvailability(timetableId, slotId, teacherCode, newStatus);
      console.log("Update successful");
    } catch (err: any) {
      console.error("Failed to update:", err);
      // Revert on error
      setTeachers(prev =>
        prev.map(teacher =>
          teacher.teacher_code === teacherCode
            ? {
                ...teacher,
                days: teacher.days.map(day => ({
                  ...day,
                  slots: day.slots.map(slot =>
                    slot.slot_id === slotId
                      ? { ...slot, is_available: currentStatus }
                      : slot
                  )
                }))
              }
            : teacher
        )
      );
      setError("Failed to update. Please try again.");
    } finally {
      setUpdatingSlot(null);
    }
  };

  const uniqueDays = getUniqueDays();

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading teacher availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Teachers Availability</h3>
          <p style={styles.subtitle}>Click on slots to toggle availability</p>
          {apiData && (
            <div style={styles.infoRow}>
              <span style={styles.infoBadge}>{apiData.center}</span>
              <span style={styles.infoBadge}>{apiData.from_date} to {apiData.to_date}</span>
              <span style={styles.infoBadge}>{teachers.length} Teachers</span>
            </div>
          )}
        </div>
       
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorAlert}>
          <span>{error}</span>
          <button style={styles.errorCloseBtn} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* No Data State */}
      {teachers.length === 0 && !error ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📅</div>
          <p style={styles.emptyText}>No teacher availability data found</p>
          <p style={styles.emptySubtext}>Please ensure teachers and slots are configured</p>
        </div>
      ) : (
        /* Data Table */
        <div style={styles.tableContainer}>
          <div style={styles.tableWrapper}>
            {/* Header Row */}
            <div style={styles.tableHeader}>
              <div style={styles.teacherColumn}>
                <span style={styles.columnTitle}>Teacher ({teachers.length})</span>
              </div>
              {uniqueDays.map(dayInfo => (
                <div
                  key={`${dayInfo.date}-${dayInfo.day}`}
                  style={{
                    ...styles.dayColumn,
                    backgroundColor: `${DAY_COLORS[dayInfo.day] || '#6B7280'}15`
                  }}
                >
                  <div style={{
                    ...styles.dayDot,
                    backgroundColor: DAY_COLORS[dayInfo.day] || '#6B7280'
                  }} />
                  <div style={styles.dayInfo}>
                    <span style={styles.dayName}>{dayInfo.day}</span>
                    <span style={styles.dayDate}>{dayInfo.date}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Teacher Rows */}
            {teachers.map(teacher => (
              <div key={teacher.teacher_code} style={styles.teacherRow}>
                {/* Teacher Info */}
                <div style={styles.teacherInfoCell}>
                  <div style={styles.teacherAvatar}>
                    {teacher.teacher_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.teacherDetails}>
                    <div style={styles.teacherName}>{teacher.teacher_name}</div>
                    <div style={styles.teacherCode}>{teacher.teacher_code}</div>
                    <div style={styles.slotCount}>{teacher.days.length} days</div>
                  </div>
                </div>

                {/* Slots for each day */}
                {uniqueDays.map(dayInfo => {
                  const daySlots = getTeacherSlotsForDay(teacher, dayInfo.date);
                  return (
                    <div key={`${teacher.teacher_code}-${dayInfo.date}`} style={styles.slotsCell}>
                      {daySlots.length > 0 ? (
                        <div style={styles.slotsGrid}>
                          {daySlots.map(slot => {
                            const isUpdating = updatingSlot === `${teacher.teacher_code}-${slot.slot_id}`;
                            return (
                              <button
                                key={slot.slot_id}
                                onClick={() => handleToggleAvailability(
                                  teacher.teacher_code,
                                  slot.slot_id,
                                  slot.is_available
                                )}
                                disabled={isUpdating}
                                style={{
                                  ...styles.slotButton,
                                  backgroundColor: slot.is_available ? '#d1fae5' : '#fee2e2',
                                  color: slot.is_available ? '#065f46' : '#991b1b',
                                  borderColor: slot.is_available ? '#a7f3d0' : '#fecaca',
                                  opacity: isUpdating ? 0.5 : 1,
                                  cursor: isUpdating ? 'wait' : 'pointer'
                                }}
                                title={`${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}\nSlot: ${slot.slot_code}\nID: ${slot.slot_id}\nClick to ${slot.is_available ? 'mark unavailable' : 'mark available'}`}
                              >
                                <span style={styles.slotTime}>
                                  {formatTime(slot.start_time)}-{formatTime(slot.end_time)}
                                </span>
                                <span style={styles.slotCode}>{slot.slot_code}</span>
                                <span style={styles.slotStatus}>
                                  {isUpdating ? '...' : (slot.is_available ? 'AVL' : 'UNVL')}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={styles.noSlots}>-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{...styles.legendBox, backgroundColor: '#d1fae5', borderColor: '#a7f3d0', color: '#065f46'}}>AVL</div>
          <span>Available</span>
        </div>
        <div style={styles.legendItem}>
          <div style={{...styles.legendBox, backgroundColor: '#fee2e2', borderColor: '#fecaca', color: '#991b1b'}}>UNVL</div>
          <span>Unavailable</span>
        </div>
        <span style={styles.legendHint}>Click on any slot to toggle availability</span>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    padding: "20px",
    backgroundColor: "#f8fafc",
    minHeight: "400px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "14px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0 0 12px 0",
  },
  infoRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap" as const,
  },
  infoBadge: {
    padding: "4px 10px",
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },
  refreshBtn: {
    padding: "8px 16px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  errorAlert: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
    borderRadius: "6px",
    marginBottom: "16px",
    color: "#991b1b",
  },
  errorCloseBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#991b1b",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "60px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "2px dashed #e2e8f0",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "16px",
    color: "#475569",
    margin: "0 0 8px 0",
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#94a3b8",
    margin: "0",
  },
  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  tableWrapper: {
    overflowX: "auto" as const,
  },
  tableHeader: {
    display: "flex",
    borderBottom: "2px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    minWidth: "fit-content",
  },
  teacherColumn: {
    minWidth: "200px",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    borderRight: "1px solid #e2e8f0",
  },
  columnTitle: {
    fontSize: "14px",
  },
  dayColumn: {
    minWidth: "150px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    borderRight: "1px solid #e2e8f0",
  },
  dayDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  dayInfo: {
    display: "flex",
    flexDirection: "column" as const,
  },
  dayName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
  },
  dayDate: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  teacherRow: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
    minWidth: "fit-content",
  },
  teacherInfoCell: {
    minWidth: "200px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderRight: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  teacherAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "16px",
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  teacherCode: {
    fontSize: "12px",
    color: "#64748b",
  },
  slotCount: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  slotsCell: {
    minWidth: "150px",
    padding: "8px",
    borderRight: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  slotsGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  slotButton: {
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid",
    fontSize: "11px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "2px",
    transition: "all 0.2s",
  },
  slotTime: {
    fontWeight: "500",
  },
  slotCode: {
    fontSize: "9px",
    color: "#6b7280",
  },
  slotStatus: {
    fontSize: "10px",
    fontWeight: "600",
  },
  noSlots: {
    color: "#cbd5e1",
    fontSize: "14px",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginTop: "16px",
    padding: "12px 16px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  legendBox: {
    padding: "4px 8px",
    borderRadius: "4px",
    border: "1px solid",
    fontSize: "11px",
    fontWeight: "600",
  },
  legendHint: {
    marginLeft: "auto",
    fontSize: "12px",
    color: "#94a3b8",
  },
};

export default TeachersAvailability;
