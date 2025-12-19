import React, { useEffect, useState, useCallback } from "react";

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

interface TeacherAvailabilityRecord {
  teacher_code: string;
  day_slot_id: string;
  is_available: boolean;
}

/* ================= MOCK TEACHERS ================= */

const TEACHERS_DATA: Teacher[] = [
  { id: "T001", name: "Dr. Sharma", code: "TCH-CSE-001", subject: "Mathematics", department: "CSE" },
  { id: "T002", name: "Prof. Kumar", code: "TCH-CSE-002", subject: "Data Structures", department: "CSE" },
  { id: "T003", name: "Dr. Singh", code: "TCH-CSE-003", subject: "Algorithms", department: "CSE" },
  { id: "T004", name: "Prof. Gupta", code: "TCH-ECE-001", subject: "Digital Electronics", department: "ECE" },
  { id: "T005", name: "Dr. Reddy", code: "TCH-ECE-002", subject: "Signals & Systems", department: "ECE" },
  { id: "T006", name: "Prof. Joshi", code: "TCH-CSE-004", subject: "Database Management", department: "CSE" },
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

/* ================= API CONFIGURATION ================= */
const API_BASE_URL = "https://exams.dashoapp.com/api/timetable";

// Get access token from localStorage or use provided one
const getAuthToken = () => {
  return localStorage.getItem("access_token") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY2MTI1ODQ3LCJpYXQiOjE3NjYwNDU1NTgsImp0aSI6ImJiM2RiYmM0NGU4ZTRlNjVhZTg3OWEwYzJlNDIwNzg3IiwidXNlcl9pZCI6Mjl9.KmEgpihnyKOhcnpf2iewZl_EZarQPZ2ZIu4r4xBno9w";
};

/* ================= MAIN COMPONENT ================= */

const TeachersAvailability: React.FC = () => {
  const [days, setDays] = useState<DaySlots[]>([]);
  const [availability, setAvailability] = useState<AvailabilityMap>({});
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const [daySlotMap, setDaySlotMap] = useState<{[day: string]: {[slotId: string]: string}}>({});

  /* Get timetable ID from localStorage and clean it */
  useEffect(() => {
    const loadTimetableId = () => {
      try {
        const id = localStorage.getItem("timetable_id");
        if (id) {
          // Clean the ID - remove any quotes or extra characters
          const cleanId = id.replace(/"/g, '').trim();
          console.log("Original timetable ID:", id);
          console.log("Cleaned timetable ID:", cleanId);
          setTimetableId(cleanId);
        } else {
          setError("No timetable ID found in localStorage. Please create a timetable first.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load timetable ID:", error);
        setError("Failed to load timetable ID from localStorage.");
        setLoading(false);
      }
    };

    loadTimetableId();
  }, []);

  /* Load slots from localStorage and create day_slot_id mapping */
  useEffect(() => {
    const loadSlots = () => {
      try {
        const saved = localStorage.getItem("timetableSlots");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.days) {
            // Map colors to days and ensure unique days
            const uniqueDays = new Map<string, DaySlots>();
            parsed.days.forEach((day: any, index: number) => {
              if (!uniqueDays.has(day.day)) {
                uniqueDays.set(day.day, {
                  ...day,
                  color: DAY_COLORS[index % DAY_COLORS.length]
                });
              }
            });
            
            const daysWithColors = Array.from(uniqueDays.values());
            setDays(daysWithColors);
            
            // Create mapping of day+slot to day_slot_id
            const newDaySlotMap: {[day: string]: {[slotId: string]: string}} = {};
            daysWithColors.forEach((day: DaySlots) => {
              newDaySlotMap[day.day] = {};
              day.slots.forEach((slot: Slot) => {
                // Create day_slot_id - adjust format as needed
                newDaySlotMap[day.day][slot.id] = `${day.day}_${slot.time.replace(/:/g, '')}`;
              });
            });
            setDaySlotMap(newDaySlotMap);
            console.log("Day slot map created:", newDaySlotMap);
          }
        } else {
          setError("No time slots found. Please create time slots first.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load slots:", error);
        setError("Failed to load time slots.");
        setLoading(false);
      }
    };

    loadSlots();
    window.addEventListener('storage', loadSlots);
    return () => window.removeEventListener('storage', loadSlots);
  }, []);

  /* Fetch availability from API */
  const fetchAvailability = useCallback(async () => {
    if (!timetableId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`Fetching availability for timetable ID: ${timetableId}`);
      
      const authToken = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/timetables/${timetableId}/teacher-availability/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      console.log(`API Response Status: ${response.status}`);
      
      if (response.status === 404) {
        console.log("No existing availability found, initializing...");
        initializeDefaultAvailability();
        return;
      }
      
      if (response.status === 401) {
        throw new Error("Authentication failed. Please check your access token.");
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error Response: ${errorText}`);
        throw new Error(`Failed to fetch availability: ${response.status}`);
      }

      const data = await response.json();
      console.log("API Response Data:", data);
      
      // Parse the response based on expected format
      if (data && Array.isArray(data)) {
        // Transform array of {teacher_code, day_slot_id, is_available} to AvailabilityMap
        const transformedAvailability: AvailabilityMap = {};
        
        data.forEach((record: TeacherAvailabilityRecord) => {
          // Find which day and slot this day_slot_id corresponds to
          let foundDay = '';
          let foundSlotId = '';
          
          // Search through daySlotMap to find matching day_slot_id
          Object.keys(daySlotMap).forEach(day => {
            Object.keys(daySlotMap[day]).forEach(slotId => {
              if (daySlotMap[day][slotId] === record.day_slot_id) {
                foundDay = day;
                foundSlotId = slotId;
              }
            });
          });
          
          if (foundDay && foundSlotId) {
            // Find teacher by code
            const teacher = TEACHERS_DATA.find(t => t.code === record.teacher_code);
            if (teacher) {
              if (!transformedAvailability[teacher.id]) {
                transformedAvailability[teacher.id] = {};
              }
              if (!transformedAvailability[teacher.id][foundDay]) {
                transformedAvailability[teacher.id][foundDay] = {};
              }
              transformedAvailability[teacher.id][foundDay][foundSlotId] = record.is_available;
            }
          }
        });
        
        console.log("Transformed Availability:", transformedAvailability);
        setAvailability(transformedAvailability);
      } else {
        console.log("Unexpected API response format, initializing default availability");
        initializeDefaultAvailability();
      }
      
    } catch (error) {
      console.error("Failed to fetch availability:", error);
      setError(error instanceof Error ? error.message : "Failed to load teacher availability from server. Using default availability.");
      
      // Initialize with default availability
      initializeDefaultAvailability();
    } finally {
      setLoading(false);
    }
  }, [timetableId, daySlotMap]);

  /* Initialize default availability (all slots available) */
  const initializeDefaultAvailability = () => {
    const defaultAvailability: AvailabilityMap = {};
    
    TEACHERS_DATA.forEach(teacher => {
      defaultAvailability[teacher.id] = {};
      days.forEach(day => {
        defaultAvailability[teacher.id][day.day] = {};
        day.slots.forEach(slot => {
          defaultAvailability[teacher.id][day.day][slot.id] = true; // Default to available
        });
      });
    });
    
    console.log("Initialized default availability:", defaultAvailability);
    setAvailability(defaultAvailability);
  };

  /* Load availability on component mount and when timetableId changes */
  useEffect(() => {
    if (timetableId && days.length > 0) {
      console.log("Timetable ID and days available, fetching availability...");
      fetchAvailability();
    } else if (days.length === 0) {
      setLoading(false);
    }
  }, [timetableId, days.length, fetchAvailability]);

  /* Toggle availability for a single slot */
  const toggleAvailability = async (teacherId: string, day: string, slotId: string) => {
    const teacher = TEACHERS_DATA.find(t => t.id === teacherId);
    if (!teacher || !timetableId) return;

    const newAvailableStatus = !(availability[teacherId]?.[day]?.[slotId] ?? true);
    const daySlotId = daySlotMap[day]?.[slotId];
    
    if (!daySlotId) {
      console.error(`No day_slot_id found for ${day} - ${slotId}`);
      return;
    }

    // Update local state immediately for responsive UI
    const newAvailability = {
      ...availability,
      [teacherId]: {
        ...(availability[teacherId] || {}),
        [day]: {
          ...(availability[teacherId]?.[day] || {}),
          [slotId]: newAvailableStatus,
        },
      },
    };
    
    setAvailability(newAvailability);

    // Send API request
    try {
      const authToken = getAuthToken();
      const payload = {
        teacher_code: teacher.code,
        day_slot_id: daySlotId,
        is_available: newAvailableStatus
      };

      console.log("Sending availability update:", payload);
      
      const response = await fetch(
        `${API_BASE_URL}/timetables/${timetableId}/teacher-availability/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Update API Error: ${errorText}`);
        // Revert the change if API call fails
        setAvailability(availability); // Revert to previous state
        setError("Failed to save change. Please try again.");
      } else {
        const result = await response.json();
        console.log("Update successful:", result);
      }
    } catch (error) {
      console.error("Failed to update availability:", error);
      // Revert the change if API call fails
      setAvailability(availability); // Revert to previous state
      setError("Network error. Please check your connection.");
    }
  };

  /* Toggle all slots for a teacher in a day */
  const toggleDayAvailability = async (teacherId: string, day: string, makeAvailable: boolean) => {
    const teacher = TEACHERS_DATA.find(t => t.id === teacherId);
    const dayData = days.find(d => d.day === day);
    if (!teacher || !dayData || !timetableId) return;

    // Update local state
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

    // Send API requests for all slots
    const updatePromises = dayData.slots.map(async (slot) => {
      const daySlotId = daySlotMap[day]?.[slot.id];
      if (!daySlotId) return;

      const authToken = getAuthToken();
      const payload = {
        teacher_code: teacher.code,
        day_slot_id: daySlotId,
        is_available: makeAvailable
      };

      try {
        const response = await fetch(
          `${API_BASE_URL}/timetables/${timetableId}/teacher-availability/`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update slot ${slot.id}`);
        }
      } catch (error) {
        console.error(`Error updating slot ${slot.id}:`, error);
        throw error;
      }
    });

    // Handle all promises
    try {
      await Promise.all(updatePromises);
      console.log(`All slots updated for ${teacher.name} on ${day}`);
    } catch (error) {
      console.error("Failed to update some slots:", error);
      setError("Failed to update some slots. Please try again.");
      // Revert to previous state
      setAvailability(availability);
    }
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
    alert("Availability is saved automatically when you click slots. Next page would open here.");
  };

  const handleRetry = () => {
    if (timetableId) {
      fetchAvailability();
    }
  };

  const clearError = () => {
    setError(null);
  };

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
          <p style={styles.subtitle}>Set availability for each teacher across all time slots</p>
          {timetableId && (
            <div style={styles.timetableInfo}>
              <span style={styles.timetableBadge}>Timetable ID: {timetableId}</span>
            </div>
          )}
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
              style={{
                ...styles.primaryButton,
                // Fix: Use separate border properties
                borderWidth: '0px',
                borderStyle: 'none',
              }}
              onClick={handleSaveAndNext}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorAlert}>
          <span style={styles.errorAlertText}>{error}</span>
          <button style={styles.errorAlertButton} onClick={clearError}>
            ×
          </button>
        </div>
      )}

      {/* Help Section */}
      <div style={styles.helpSection}>
        <p style={styles.helpTitle}>💡 How to use:</p>
        <ul style={styles.helpList}>
          <li>Click on any <strong>AVL/UNVL tab</strong> to toggle status (saves automatically)</li>
          <li>Use <strong>quick action buttons</strong> for each day to set all slots at once</li>
          <li>Green indicates available time slot (AVL)</li>
          <li>Red indicates unavailable time slot (UNVL)</li>
          <li>Changes are saved automatically to the server</li>
          {timetableId && (
            <li>Connected to timetable: <strong>{timetableId}</strong></li>
          )}
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
                
                {days.map((day, index) => (
                  <div 
                    key={`${day.day}-${index}`} // Fix: Use unique key
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
                    {days.map((day, dayIndex) => (
                      <div 
                        key={`${teacher.id}-${day.day}-${dayIndex}`} // Fix: Use unique key
                        style={{
                          ...styles.dayColumn,
                          backgroundColor: isTeacherSelected ? '#f0f9ff' : '#ffffff'
                        }}
                      >
                        {/* Quick Action Buttons */}
                        <div style={styles.dayActions}>
                          <div style={styles.quickActions}>
                            <button
                              style={{
                                ...styles.quickActionBtn,
                                // Fix: Use separate border properties
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: '#93c5fd',
                              }}
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
                              style={{
                                ...styles.quickActionBtnUnavailable,
                                // Fix: Use separate border properties
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: '#fca5a5',
                              }}
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
                              <div key={`${teacher.id}-${day.day}-${slot.id}`} style={styles.slotWrapper}>
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
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: available ? '#a7f3d0' : '#fecaca',
                                    borderRadius: "4px",
                                  }}
                                  title={`${teacher.name} - ${day.day} - ${slot.id}: ${slot.time}\nClick to ${available ? 'mark unavailable (false)' : 'mark available (true)'}`}
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
                <span>Available Slot (true)</span>
              </div>
              <div style={styles.legendItem}>
                <div style={styles.legendTabUnavailable}>
                  <span style={styles.legendTabText}>UNVL</span>
                </div>
                <span>Unavailable Slot (false)</span>
              </div>
              <div style={styles.legendHint}>
                Click tabs to toggle • Changes saved automatically
              </div>
            </div>
            
            <div style={styles.footerActions}>
              <button
                style={{
                  ...styles.footerPrimaryButton,
                  // Fix: Use separate border properties
                  borderWidth: '0px',
                  borderStyle: 'none',
                }}
                onClick={handleSaveAndNext}
              >
                Proceed to Next
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
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
  timetableInfo: {
    marginTop: "8px",
  },
  timetableBadge: {
    fontSize: "12px",
    color: "#3b82f6",
    background: "#dbeafe",
    padding: "4px 8px",
    borderRadius: "4px",
    fontWeight: "500",
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
  primaryButton: {
    padding: "10px 20px",
    background: "#10b981",
    color: "#ffffff",
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
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  retryButton: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    borderWidth: '0px',
    borderStyle: 'none',
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    marginTop: "12px",
  },
  spinningIcon: {
    animation: "spin 1s linear infinite",
  },
  helpSection: {
    marginBottom: "24px",
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#bae6fd',
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
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
    textAlign: "center",
  },
  spinner: {
    width: "40px",
    height: "40px",
    borderWidth: '4px',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "16px",
  },
  loadingText: {
    fontSize: "16px",
    color: "#64748b",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
    textAlign: "center",
  },
  errorIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  errorText: {
    fontSize: "16px",
    color: "#dc2626",
    margin: "0 0 16px 0",
    maxWidth: "500px",
  },
  errorAlert: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#fef2f2",
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#fecaca',
    borderRadius: "8px",
    marginBottom: "24px",
  },
  errorAlertText: {
    fontSize: "14px",
    color: "#dc2626",
    flex: "1",
  },
  errorAlertButton: {
    background: "none",
    borderWidth: '0px',
    borderStyle: 'none',
    color: "#dc2626",
    fontSize: "18px",
    cursor: "pointer",
    padding: "0 8px",
  },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "8px",
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
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
    borderBottomWidth: '2px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#e2e8f0',
  },
  teacherHeaderColumn: {
    width: "280px",
    minWidth: "280px",
    padding: "16px",
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: '#e2e8f0',
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
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: '#e2e8f0',
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
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: '#f1f5f9',
    transition: "background-color 0.2s",
    cursor: "pointer",
    minHeight: "100px",
  },
  teacherInfoColumn: {
    width: "280px",
    minWidth: "280px",
    padding: "12px 16px",
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: '#e2e8f0',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
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
    borderRightWidth: '1px',
    borderRightStyle: 'solid',
    borderRightColor: '#e2e8f0',
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
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: '#e2e8f0',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#a7f3d0',
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
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#fecaca',
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