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
  is_busy?: boolean;
  batch_code?: string;
  batch_name?: string;
  subject_code?: string;
  subject_name?: string;
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
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);

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
          <p style={styles.subtitle}>Click on slots to toggle availability status</p>
          {apiData && (
            <div style={styles.infoRow}>
              <span style={styles.infoBadge}>{apiData.center}</span>
              <span style={styles.infoBadge}>{apiData.from_date} to {apiData.to_date}</span>
              <span style={styles.infoBadge}>{teachers.length} Teachers</span>
            </div>
          )}
        </div>
        
        {/* Header Actions */}
        <div style={styles.headerActions}>
          <button 
            style={styles.refreshBtn}
            onClick={loadAvailability}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
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
              <div 
                key={teacher.teacher_code} 
                style={{
                  ...styles.teacherRow,
                  backgroundColor: expandedTeacher === teacher.teacher_code ? '#f0f9ff' : '#ffffff'
                }}
              >
                {/* Teacher Info */}
                <div style={styles.teacherInfoCell}>
                  <div style={styles.teacherAvatar}>
                    {teacher.teacher_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.teacherDetails}>
                    <div style={styles.teacherName}>{teacher.teacher_name}</div>
                    <div style={styles.teacherCode}>{teacher.teacher_code}</div>
                    <div style={styles.slotCount}>
                      <button 
                        style={styles.expandBtn}
                        onClick={() => setExpandedTeacher(
                          expandedTeacher === teacher.teacher_code ? null : teacher.teacher_code
                        )}
                      >
                        {expandedTeacher === teacher.teacher_code ? '▼' : '▶'} 
                        {teacher.days.length} days
                      </button>
                    </div>
                  </div>
                </div>

                {/* Slots for each day - Compact Grid View */}
                {uniqueDays.map(dayInfo => {
                  const daySlots = getTeacherSlotsForDay(teacher, dayInfo.date);
                  return (
                    <div key={`${teacher.teacher_code}-${dayInfo.date}`} style={styles.slotsCell}>
                      {daySlots.length > 0 ? (
                        <div style={styles.compactGrid}>
                          {daySlots.map(slot => {
                            const isUpdating = updatingSlot === `${teacher.teacher_code}-${slot.slot_id}`;

                            // Determine slot style based on availability only
                            let bgColor = '#d1fae5';  // Available - green
                            let textColor = '#065f46';
                            let borderColor = '#a7f3d0';
                            let statusText = 'A';

                            if (!slot.is_available) {
                              bgColor = '#fee2e2';  // Unavailable - red
                              textColor = '#991b1b';
                              borderColor = '#fecaca';
                              statusText = 'U';
                            }

                            const batchInfo = slot.batch_name || slot.batch_code || '';
                            const subjectInfo = slot.subject_name || slot.subject_code || '';

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
                                  ...styles.slotPill,
                                  backgroundColor: bgColor,
                                  color: textColor,
                                  borderColor: borderColor,
                                  opacity: isUpdating ? 0.5 : 1,
                                  cursor: isUpdating ? 'wait' : 'pointer',
                                  transform: isUpdating ? 'scale(0.95)' : 'scale(1)'
                                }}
                                title={`${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}\n${slot.slot_code}\nClick to toggle`}
                              >
                                <span style={styles.slotTimeShort}>
                                  {formatTime(slot.start_time).replace(':', '')}
                                </span>
                                <span style={styles.slotStatus}>
                                  {isUpdating ? '...' : statusText}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={styles.noSlots}>-</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded View Modal */}
      {expandedTeacher && teachers.find(t => t.teacher_code === expandedTeacher) && (
        <div style={styles.modalOverlay} onClick={() => setExpandedTeacher(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTeacherInfo}>
                <div style={{...styles.teacherAvatar, width: '48px', height: '48px', fontSize: '18px'}}>
                  {teachers.find(t => t.teacher_code === expandedTeacher)!.teacher_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={styles.modalTitle}>
                    {teachers.find(t => t.teacher_code === expandedTeacher)!.teacher_name}
                  </h3>
                  <p style={styles.modalSubtitle}>
                    {teachers.find(t => t.teacher_code === expandedTeacher)!.teacher_code}
                  </p>
                </div>
              </div>
              <button style={styles.closeModalBtn} onClick={() => setExpandedTeacher(null)}>×</button>
            </div>
            
            <div style={styles.modalGrid}>
              {uniqueDays.map(dayInfo => {
                const teacher = teachers.find(t => t.teacher_code === expandedTeacher)!;
                const daySlots = getTeacherSlotsForDay(teacher, dayInfo.date);
                
                return (
                  <div key={dayInfo.date} style={styles.modalDayCard}>
                    <div style={styles.modalDayHeader}>
                      <div style={{
                        ...styles.dayDot,
                        backgroundColor: DAY_COLORS[dayInfo.day] || '#6B7280'
                      }} />
                      <div>
                        <div style={styles.modalDayName}>{dayInfo.day}</div>
                        <div style={styles.modalDayDate}>{dayInfo.date}</div>
                      </div>
                    </div>
                    
                    {daySlots.length > 0 ? (
                      <div style={styles.modalSlotsGrid}>
                        {daySlots.map(slot => {
                          const isUpdating = updatingSlot === `${teacher.teacher_code}-${slot.slot_id}`;

                          let bgColor = '#d1fae5';
                          let textColor = '#065f46';
                          let statusText = 'Available';

                          if (!slot.is_available) {
                            bgColor = '#fee2e2';
                            textColor = '#991b1b';
                            statusText = 'Unavailable';
                          }

                          return (
                            <div key={slot.slot_id} style={{
                              ...styles.modalSlotCard,
                              backgroundColor: bgColor,
                              borderColor: bgColor
                            }}>
                              <div style={styles.modalSlotHeader}>
                                <span style={{color: textColor, fontWeight: '600'}}>{slot.slot_code}</span>
                                <span style={{color: textColor, fontSize: '12px'}}>
                                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                </span>
                              </div>
                              <div style={styles.modalSlotInfo}>
                                <span style={{color: textColor, fontSize: '11px'}}>
                                  {(slot.batch_name || slot.subject_name) ? (
                                    <>{slot.batch_name} {slot.subject_name && `- ${slot.subject_name}`}</>
                                  ) : statusText}
                                </span>
                                <button
                                  onClick={() => handleToggleAvailability(
                                    teacher.teacher_code,
                                    slot.slot_id,
                                    slot.is_available
                                  )}
                                  disabled={isUpdating}
                                  style={{
                                    ...styles.toggleBtn,
                                    backgroundColor: slot.is_available ? '#ef4444' : '#10b981',
                                    color: '#ffffff'
                                  }}
                                >
                                  {isUpdating ? '...' : (slot.is_available ? 'Mark Unavailable' : 'Mark Available')}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={styles.modalNoSlots}>No slots scheduled</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legend and Stats */}
      <div style={styles.footer}>
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={styles.legendDotAvailable}></div>
            <span>A = Available</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendDotUnavailable}></div>
            <span>U = Unavailable</span>
          </div>
          {/* Busy state removed from UI */}
        </div>
        
        <div style={styles.statsInfo}>
          <div style={styles.statsItem}>
            <span style={styles.statsValue}>{teachers.reduce((acc, t) => acc + (t.days?.length || 0), 0)}</span>
            <span style={styles.statsLabel}>Total Days</span>
          </div>
          <div style={styles.statsItem}>
            <span style={styles.statsValue}>
              {teachers.reduce((acc, t) => acc + (t.days?.reduce((dayAcc, d) => dayAcc + (d.slots?.length || 0), 0) || 0), 0)}
            </span>
            <span style={styles.statsLabel}>Total Slots</span>
          </div>
          <div style={styles.statsItem}>
            <button 
              style={styles.expandAllBtn}
              onClick={() => setExpandedTeacher(null)}
            >
              Show All Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */
const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    backgroundColor: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    minHeight: "calc(100vh - 48px)",
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
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
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
  headerActions: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  refreshBtn: {
    padding: "8px 16px",
    backgroundColor: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
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
    backgroundColor: "#f8fafc",
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
    marginBottom: "24px",
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
    minWidth: "220px",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    borderRight: "1px solid #e2e8f0",
  },
  columnTitle: {
    fontSize: "14px",
  },
  dayColumn: {
    minWidth: "120px",
    padding: "12px 8px",
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
    fontSize: "12px",
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
    transition: "background-color 0.2s",
  },
  teacherInfoCell: {
    minWidth: "220px",
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
    borderRadius: "8px",
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
    marginBottom: "2px",
  },
  teacherCode: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  slotCount: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  expandBtn: {
    background: "none",
    border: "none",
    color: "#3b82f6",
    cursor: "pointer",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "0",
  },
  slotsCell: {
    minWidth: "120px",
    padding: "8px 4px",
    borderRight: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
  },
  compactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(32px, 1fr))",
    gap: "4px",
  },
  slotPill: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "600",
    transition: "all 0.2s",
    padding: "0",
  },
  slotTimeShort: {
    fontSize: "9px",
    fontWeight: "500",
    lineHeight: 1,
  },
  slotStatus: {
    fontSize: "10px",
    fontWeight: "600",
    lineHeight: 1,
  },
  noSlots: {
    color: "#cbd5e1",
    fontSize: "14px",
    textAlign: "center" as const,
    padding: "8px 0",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    width: "90%",
    maxWidth: "1200px",
    maxHeight: "80vh",
    overflow: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTeacherInfo: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  modalSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
  },
  closeModalBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
    padding: "24px",
  },
  modalDayCard: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    padding: "16px",
  },
  modalDayHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  modalDayName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  modalDayDate: {
    fontSize: "12px",
    color: "#64748b",
  },
  modalSlotsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  modalSlotCard: {
    backgroundColor: "#ffffff",
    borderRadius: "6px",
    border: "1px solid",
    padding: "12px",
  },
  modalSlotHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  modalSlotInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleBtn: {
    padding: "4px 8px",
    fontSize: "11px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
  },
  modalNoSlots: {
    color: "#94a3b8",
    fontSize: "14px",
    textAlign: "center",
    padding: "12px",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    flexWrap: "wrap",
    gap: "16px",
  },
  legend: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#475569",
  },
  legendDotAvailable: {
    width: "12px",
    height: "12px",
    borderRadius: "4px",
    backgroundColor: "#d1fae5",
    border: "1px solid #a7f3d0",
  },
  legendDotUnavailable: {
    width: "12px",
    height: "12px",
    borderRadius: "4px",
    backgroundColor: "#fee2e2",
    border: "1px solid #fecaca",
  },
  legendDotBusy: {
    width: "12px",
    height: "12px",
    borderRadius: "4px",
    backgroundColor: "#dbeafe",
    border: "1px solid #93c5fd",
  },
  statsInfo: {
    display: "flex",
    gap: "24px",
    alignItems: "center",
  },
  statsItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statsValue: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
  },
  statsLabel: {
    fontSize: "11px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  expandAllBtn: {
    padding: "8px 16px",
    backgroundColor: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  },
};

export default TeachersAvailability;