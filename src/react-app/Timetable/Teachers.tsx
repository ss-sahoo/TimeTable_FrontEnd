import React, { useEffect, useState } from "react";

/* ================= TYPES ================= */

interface Slot {
  id: string;
  time: string;
}

interface DaySlots {
  day: string;
  slots: Slot[];
  color: string;
}

interface Teacher {
  id: string;
  name: string;
  code: string;
  subject: string;
  department: string;
}

interface AvailabilityMap {
  [teacherId: string]: {
    [day: string]: {
      [slotId: string]: boolean;
    };
  };
}

/* ================= MOCK TEACHERS ================= */

const TEACHERS_DATA: Teacher[] = [
  { id: "T001", name: "Dr. Sharma", code: "CSE101", subject: "Mathematics", department: "CSE" },
  { id: "T002", name: "Prof. Kumar", code: "CSE102", subject: "Data Structures", department: "CSE" },
  { id: "T003", name: "Dr. Singh", code: "CSE103", subject: "Algorithms", department: "CSE" },
  { id: "T004", name: "Prof. Gupta", code: "ECE101", subject: "Digital Electronics", department: "ECE" },
  { id: "T005", name: "Dr. Reddy", code: "ECE102", subject: "Signals & Systems", department: "ECE" },
  { id: "T006", name: "Prof. Joshi", code: "CSE104", subject: "Database Management", department: "CSE" },
];

/* ================= DAY COLORS ================= */
const DAY_COLORS = [
  "#3B82F6", // Monday - Blue
  "#10B981", // Tuesday - Green
  "#8B5CF6", // Wednesday - Purple
  "#F59E0B", // Thursday - Amber
  "#EF4444", // Friday - Red
  "#EC4899", // Saturday - Pink
  "#06B6D4", // Sunday - Cyan
];

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/* ================= MAIN COMPONENT ================= */

const TeachersAvailability: React.FC = () => {
  const [days, setDays] = useState<DaySlots[]>([]);
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  /* Load slots from localStorage */
  useEffect(() => {
    const loadSlots = () => {
      try {
        const saved = localStorage.getItem("timetableSlots");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.days) {
            // Map colors to days
            const daysWithColors = parsed.days.map((day: any, index: number) => ({
              ...day,
              color: DAY_COLORS[index % DAY_COLORS.length]
            }));
            setDays(daysWithColors);
          }
        }
      } catch (error) {
        console.error("Failed to load slots:", error);
      }
    };

    loadSlots();
    window.addEventListener('storage', loadSlots);
    return () => window.removeEventListener('storage', loadSlots);
  }, []);

  /* Load availability from localStorage */
  useEffect(() => {
    const loadAvailability = () => {
      try {
        const saved = localStorage.getItem("teacherAvailability");
        if (saved) {
          setAvailability(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Failed to load availability:", error);
      }
    };

    loadAvailability();
  }, []);

  /* Save availability to localStorage */
  const saveAvailability = () => {
    setSaveStatus("saving");
    
    setTimeout(() => {
      try {
        localStorage.setItem("teacherAvailability", JSON.stringify(availability));
        
        setSaveStatus("saved");
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
        
      } catch (error) {
        console.error("Failed to save availability:", error);
        setSaveStatus("error");
        
        // Reset error after 3 seconds
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      }
    }, 500);
  };

  /* Toggle availability */
  const toggleAvailability = (teacherId: string, day: string, slotId: string) => {
    const newAvailability = {
      ...availability,
      [teacherId]: {
        ...(availability[teacherId] || {}),
        [day]: {
          ...(availability[teacherId]?.[day] || {}),
          [slotId]: !(availability[teacherId]?.[day]?.[slotId] ?? true),
        },
      },
    };

    setAvailability(newAvailability);
  };

  /* Toggle all slots for a teacher in a day */
  const toggleDayAvailability = (teacherId: string, day: string, makeAvailable: boolean) => {
    const dayData = days.find(d => d.day === day);
    if (!dayData) return;

    const newAvailability = {
      ...availability,
      [teacherId]: {
        ...(availability[teacherId] || {}),
        [day]: {},
      },
    };

    // Set all slots for this day to the same availability
    dayData.slots.forEach(slot => {
      newAvailability[teacherId][day][slot.id] = makeAvailable;
    });

    setAvailability(newAvailability);
  };

  /* Check if a slot is available (default to true) */
  const isAvailable = (teacherId: string, day: string, slotId: string) => {
    return availability?.[teacherId]?.[day]?.[slotId] ?? true;
  };

  /* Calculate availability statistics */
  const getTeacherStats = (teacherId: string) => {
    let availableSlots = 0;
    let totalSlots = 0;

    days.forEach(day => {
      day.slots.forEach(slot => {
        totalSlots++;
        if (isAvailable(teacherId, day.day, slot.id)) {
          availableSlots++;
        }
      });
    });

    return { availableSlots, totalSlots, percentage: totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 0 };
  };

  const getOverallStats = () => {
    let totalAvailable = 0;
    let totalSlots = 0;
    
    TEACHERS_DATA.forEach(teacher => {
      const stats = getTeacherStats(teacher.id);
      totalAvailable += stats.availableSlots;
      totalSlots += stats.totalSlots;
    });

    return {
      totalAvailable,
      totalSlots,
      percentage: totalSlots > 0 ? Math.round((totalAvailable / totalSlots) * 100) : 0
    };
  };

  const overallStats = getOverallStats();

  const handleSaveAndNext = () => {
    saveAvailability();
    // You can add navigation to next page here
    alert("Saved! Next page would open here.");
  };

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Teachers Availability</h3>
          <p style={styles.subtitle}>Set availability for each teacher across all time slots</p>
        </div>
        
        {/* Action Buttons */}
        <div style={styles.headerActions}>
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{overallStats.percentage}%</span>
              <span style={styles.statLabel}>Overall Available</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statNumber}>{overallStats.totalAvailable}/{overallStats.totalSlots}</span>
              <span style={styles.statLabel}>Total Slots</span>
            </div>
          </div>
          
          <div style={styles.actionButtons}>
            <button
              style={styles.saveButton}
              onClick={saveAvailability}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving" ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={styles.spinningIcon}>
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Saving...
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Saved
                </>
              ) : saveStatus === "error" ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Error
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M17 21v-8H7v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 3v5h8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Save Changes
                </>
              )}
            </button>
            
            <button
              style={styles.primaryButton}
              onClick={handleSaveAndNext}
              disabled={saveStatus === "saving"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Save & Next
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div style={styles.helpSection}>
        <p style={styles.helpTitle}>💡 How to use:</p>
        <ul style={styles.helpList}>
          <li>Click on any <strong>AVL/UNVL tab</strong> to toggle status</li>
          <li>Use <strong>quick action buttons</strong> for each day to set all slots at once</li>
          <li>Green indicates available time slot (AVL)</li>
          <li>Red indicates unavailable time slot (UNVL)</li>
          <li>Availability is saved automatically when you click Save</li>
        </ul>
      </div>

      {days.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📅</div>
          <p style={styles.emptyText}>No time slots found</p>
          <p style={styles.emptySubtext}>Please create time slots in the Slots tab first</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          {/* Table Wrapper */}
          <div style={styles.tableWrapper}>
            <div style={styles.table}>
              {/* Header Row - Days */}
              <div style={styles.tableHeader}>
                <div style={styles.teacherHeaderColumn}>
                  <div style={styles.teacherHeaderContent}>
                    <span style={styles.headerTitle}>Teachers</span>
                    <span style={styles.headerSubtitle}>({TEACHERS_DATA.length} teachers)</span>
                  </div>
                </div>
                
                {days.map(day => (
                  <div 
                    key={day.day} 
                    style={{
                      ...styles.dayHeaderColumn,
                      backgroundColor: `${day.color}15`
                    }}
                  >
                    <div style={styles.dayHeaderContent}>
                      <div style={styles.dayHeaderTop}>
                        <div style={{...styles.dayColorDot, backgroundColor: day.color}} />
                        <span style={styles.dayName}>{day.day.substring(0, 3)}</span>
                      </div>
                      <div style={styles.slotCount}>{day.slots.length} slots</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Teacher Rows */}
              {TEACHERS_DATA.map(teacher => {
                const teacherStats = getTeacherStats(teacher.id);
                const isTeacherSelected = selectedTeacher === teacher.id;

                return (
                  <div 
                    key={teacher.id} 
                    style={{
                      ...styles.teacherRow,
                      backgroundColor: isTeacherSelected ? '#f0f9ff' : '#ffffff'
                    }}
                    onClick={() => setSelectedTeacher(teacher.id)}
                  >
                    {/* Teacher Info Column */}
                    <div style={styles.teacherInfoColumn}>
                      <div style={styles.teacherInfo}>
                        <div style={styles.teacherAvatar}>
                          {teacher.name.charAt(0)}
                        </div>
                        <div style={styles.teacherDetails}>
                          <div style={styles.teacherName}>{teacher.name}</div>
                          <div style={styles.teacherSubject}>{teacher.subject}</div>
                          <div style={styles.teacherCodeDept}>
                            <span style={styles.teacherCode}>{teacher.code}</span>
                            <span style={styles.teacherDept}>{teacher.department}</span>
                          </div>
                        </div>
                      </div>
                      <div style={styles.teacherStats}>
                        <div style={styles.statBadge}>
                          <span style={styles.statBadgeValue}>{teacherStats.percentage}%</span>
                          <span style={styles.statBadgeLabel}>available</span>
                        </div>
                      </div>
                    </div>

                    {/* Availability Columns */}
                    {days.map(day => (
                      <div 
                        key={day.day} 
                        style={{
                          ...styles.dayColumn,
                          backgroundColor: isTeacherSelected ? '#f0f9ff' : '#ffffff'
                        }}
                      >
                        {/* Quick Action Buttons */}
                        <div style={styles.dayActions}>
                          <div style={styles.quickActions}>
                            <button
                              style={styles.quickActionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDayAvailability(teacher.id, day.day, true);
                              }}
                              title="Mark all available"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              All
                            </button>
                            <button
                              style={styles.quickActionBtnUnavailable}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDayAvailability(teacher.id, day.day, false);
                              }}
                              title="Mark all unavailable"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              None
                            </button>
                          </div>
                        </div>
                        
                        {/* Slot IDs and Availability Tabs in One Line */}
                        <div style={styles.slotsContainer}>
                          {day.slots.map(slot => {
                            const available = isAvailable(teacher.id, day.day, slot.id);
                            return (
                              <div key={slot.id} style={styles.slotWrapper}>
                                {/* Slot ID */}
                                <div style={styles.slotId}>
                                  {slot.id}
                                </div>
                                {/* Availability Tab */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleAvailability(teacher.id, day.day, slot.id);
                                  }}
                                  style={{
                                    ...styles.availabilityTab,
                                    backgroundColor: available ? '#d1fae5' : '#fee2e2',
                                    color: available ? '#065f46' : '#991b1b',
                                    border: `1px solid ${available ? '#a7f3d0' : '#fecaca'}`
                                  }}
                                  title={`${teacher.name} - ${day.day} - ${slot.id}: ${slot.time}\nClick to ${available ? 'mark unavailable' : 'mark available'}`}
                                >
                                  {available ? 'AVL' : 'UNVL'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend & Info */}
          <div style={styles.footer}>
            <div style={styles.legend}>
              <div style={styles.legendItem}>
                <div style={styles.legendTabAvailable}>
                  <span style={styles.legendTabText}>AVL</span>
                </div>
                <span>Available Slot</span>
              </div>
              <div style={styles.legendItem}>
                <div style={styles.legendTabUnavailable}>
                  <span style={styles.legendTabText}>UNVL</span>
                </div>
                <span>Unavailable Slot</span>
              </div>
              <div style={styles.legendHint}>
                Click tabs to toggle • Use "All/None" buttons for quick actions
              </div>
            </div>
            
            <div style={styles.footerActions}>
              <button
                style={styles.secondaryButton}
                onClick={saveAvailability}
              >
                Save Changes
              </button>
              <button
                style={styles.footerPrimaryButton}
                onClick={handleSaveAndNext}
              >
                Save & Proceed to Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= STYLES ================= */
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    minHeight: "calc(100vh - 48px)",
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
    margin: "0",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  stats: {
    display: "flex",
    gap: "12px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "8px 12px",
    background: "#f1f5f9",
    borderRadius: "8px",
    minWidth: "60px",
  },
  statNumber: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  saveButton: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
    minWidth: "140px",
  },
  primaryButton: {
    padding: "10px 20px",
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  secondaryButton: {
    padding: "10px 20px",
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  footerPrimaryButton: {
    padding: "10px 20px",
    background: "#8b5cf6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  spinningIcon: {
    animation: "spin 1s linear infinite",
  },
  helpSection: {
    marginBottom: "24px",
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
  },
  helpTitle: {
    fontWeight: "600",
    color: "#0369a1",
    margin: "0 0 8px 0",
  },
  helpList: {
    margin: "0",
    paddingLeft: "20px",
    color: "#0c4a6e",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  emptyState: {
    padding: "48px 24px",
    textAlign: "center",
    color: "#64748b",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyText: {
    fontSize: "16px",
    fontWeight: "500",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  emptySubtext: {
    fontSize: "14px",
    margin: "0",
  },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  tableWrapper: {
    minWidth: "fit-content",
  },
  table: {
    minWidth: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    display: "flex",
    background: "#f8fafc",
    borderBottom: "2px solid #e2e8f0",
  },
  teacherHeaderColumn: {
    width: "280px",
    minWidth: "280px",
    padding: "16px",
    borderRight: "1px solid #e2e8f0",
  },
  teacherHeaderContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  headerTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
  },
  headerSubtitle: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  dayHeaderColumn: {
    flex: "1",
    minWidth: "180px",
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "1px solid #e2e8f0",
  },
  dayHeaderContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
  dayHeaderTop: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  dayColorDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  dayName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1e293b",
  },
  slotCount: {
    fontSize: "11px",
    color: "#64748b",
    background: "rgba(255,255,255,0.9)",
    padding: "2px 6px",
    borderRadius: "10px",
  },
  teacherRow: {
    display: "flex",
    borderBottom: "1px solid #f1f5f9",
    transition: "background-color 0.2s",
    cursor: "pointer",
    minHeight: "100px",
  },
  teacherInfoColumn: {
    width: "280px",
    minWidth: "280px",
    padding: "12px 16px",
    borderRight: "1px solid #e2e8f0",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  teacherInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  teacherAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "#3b82f6",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "14px",
  },
  teacherDetails: {
    flex: "1",
  },
  teacherName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "2px",
  },
  teacherSubject: {
    fontSize: "11px",
    color: "#475569",
    marginBottom: "4px",
  },
  teacherCodeDept: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  teacherCode: {
    fontSize: "10px",
    color: "#3b82f6",
    background: "#dbeafe",
    padding: "1px 4px",
    borderRadius: "3px",
    fontWeight: "500",
  },
  teacherDept: {
    fontSize: "10px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "1px 4px",
    borderRadius: "3px",
  },
  teacherStats: {
    display: "flex",
    justifyContent: "center",
  },
  statBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#ffffff",
    padding: "4px 8px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    width: "100%",
  },
  statBadgeValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  statBadgeLabel: {
    fontSize: "9px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  dayColumn: {
    flex: "1",
    minWidth: "180px",
    padding: "8px 4px",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  dayActions: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "2px",
  },
  quickActions: {
    display: "flex",
    gap: "4px",
  },
  quickActionBtn: {
    padding: "2px 6px",
    fontSize: "9px",
    background: "#dbeafe",
    color: "#1d4ed8",
    border: "1px solid #93c5fd",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "2px",
    whiteSpace: "nowrap",
  },
  quickActionBtnUnavailable: {
    padding: "2px 6px",
    fontSize: "9px",
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fca5a5",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "2px",
    whiteSpace: "nowrap",
  },
  slotsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px",
    padding: "4px 2px",
  },
  slotWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    minWidth: "40px",
  },
  slotId: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#475569",
    textAlign: "center",
    padding: "1px 2px",
    minWidth: "30px",
    background: "rgba(255,255,255,0.8)",
    borderRadius: "3px",
  },
  availabilityTab: {
    width: "100%",
    minWidth: "36px",
    height: "24px",
    padding: "0 2px",
    borderRadius: "4px",
    border: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontSize: "9px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  footer: {
    padding: "16px",
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    fontSize: "12px",
    color: "#475569",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  legendTabAvailable: {
    width: "36px",
    height: "20px",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  legendTabUnavailable: {
    width: "36px",
    height: "20px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "9px",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  legendTabText: {
    fontSize: "9px",
    fontWeight: "600",
  },
  legendHint: {
    fontSize: "11px",
    color: "#64748b",
    fontStyle: "italic",
  },
  footerActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
};

export default TeachersAvailability;