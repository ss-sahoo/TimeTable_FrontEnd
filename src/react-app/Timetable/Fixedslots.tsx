import React, { useEffect, useState, useRef } from "react";

/* ================= TYPES ================= */
interface DaySlots {
  day: string;
  slots: Array<{
    id: string;
    time: string;
  }>;
  color: string;
}

interface Teacher {
  id: string;
  name: string;
  code: string;
  subject: string;
  department: string;
  type: 'teacher';
}

interface PeriodType {
  id: string;
  name: string;
  type: 'period';
  description: string;
  color: string;
}

interface AssignedSlot {
  dayIndex: number;
  slotIndex: number;
  teacher?: Teacher;
  periodType?: PeriodType;
  batchId: string;
}

interface Batch {
  id: string;
  name: string;
  year: string;
  students: string;
  color: string;
}

interface DropdownPosition {
  top: number;
  left: number;
}

/* ================= MOCK TEACHERS DATA ================= */
const TEACHERS_DATA: Teacher[] = [
  { id: "T001", name: "Dr. Sharma", code: "CSE101", subject: "Mathematics", department: "CSE", type: 'teacher' },
  { id: "T002", name: "Prof. Kumar", code: "CSE102", subject: "Data Structures", department: "CSE", type: 'teacher' },
  { id: "T003", name: "Dr. Singh", code: "CSE103", subject: "Algorithms", department: "CSE", type: 'teacher' },
  { id: "T004", name: "Prof. Gupta", code: "ECE101", subject: "Digital Electronics", department: "ECE", type: 'teacher' },
  { id: "T005", name: "Dr. Reddy", code: "ECE102", subject: "Signals & Systems", department: "ECE", type: 'teacher' },
  { id: "T006", name: "Prof. Joshi", code: "CSE104", subject: "Database Management", department: "CSE", type: 'teacher' },
];

/* ================= PERIOD TYPES ================= */
const PERIOD_TYPES: PeriodType[] = [
  { id: "P001", name: "Free Period", type: 'period', description: "No class scheduled", color: "#10B981" },
  { id: "P002", name: "Exam", type: 'period', description: "Examination slot", color: "#EF4444" },
  { id: "P003", name: "Lab Session", type: 'period', description: "Practical lab session", color: "#8B5CF6" },
  { id: "P004", name: "Break", type: 'period', description: "Break time", color: "#F59E0B" },
];

/* ================= BATCH COLORS ================= */
const BATCH_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

/* ================= MAIN COMPONENT ================= */
const FixedSlots: React.FC = () => {
  const [days, setDays] = useState<DaySlots[]>([]);
  const [batches, setBatches] = useState<Batch[]>([
    { id: "B001", name: "CSE A", year: "2nd Year", students: "60", color: BATCH_COLORS[0] },
    { id: "B002", name: "CSE B", year: "2nd Year", students: "65", color: BATCH_COLORS[1] },
    { id: "B003", name: "ECE A", year: "3rd Year", students: "55", color: BATCH_COLORS[2] },
  ]);
  const [activeBatchId, setActiveBatchId] = useState<string>("B001");
  const [assignments, setAssignments] = useState<AssignedSlot[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside any dropdown
      const isClickInsideDropdown = Object.values(dropdownRefs.current).some(
        ref => ref && ref.contains(event.target as Node)
      );
      
      if (!isClickInsideDropdown && openDropdown && event.target) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  /* Load saved slots from localStorage */
  useEffect(() => {
    const loadSavedSlots = () => {
      try {
        const savedData = localStorage.getItem("timetableSlots");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          // Convert to new format if needed
          if (parsedData.days && parsedData.days.length > 0) {
            const convertedDays: DaySlots[] = parsedData.days.map((day: any) => {
              // Check if slots are in new format (array of objects)
              if (day.slots && day.slots.length > 0 && typeof day.slots[0] === 'object') {
                return {
                  day: day.day,
                  slots: day.slots.map((slot: any) => ({
                    id: slot.id || `${day.day.substring(0, 2).toUpperCase()}1`,
                    time: slot.time || "8:00 AM - 9:00 AM"
                  })),
                  color: day.color || "#3B82F6"
                };
              }
              // Old format - convert string array to object array
              return {
                day: day.day,
                slots: day.slots.map((slot: string, index: number) => {
                  const match = slot.match(/([A-Z]+\d+):\s*(.+)/);
                  return {
                    id: match ? match[1] : `${day.day.substring(0, 2).toUpperCase()}${index + 1}`,
                    time: match ? match[2] : "8:00 AM - 9:00 AM"
                  };
                }),
                color: day.color || "#3B82F6"
              };
            });
            setDays(convertedDays);
          }
        }
      } catch (error) {
        console.error("Failed to load slots:", error);
      }
    };

    loadSavedSlots();
    // Listen for changes from SlotsGrid component
    window.addEventListener('storage', loadSavedSlots);
    return () => window.removeEventListener('storage', loadSavedSlots);
  }, []);

  /* Load all batch assignments on mount */
  useEffect(() => {
    const loadAllAssignments = () => {
      const allAssignments: AssignedSlot[] = [];
      batches.forEach(batch => {
        const saved = localStorage.getItem(`batchAssignments_${batch.id}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            allAssignments.push(...parsed);
          } catch (error) {
            console.error(`Failed to parse assignments for batch ${batch.id}:`, error);
          }
        }
      });
      setAssignments(allAssignments);
    };
    
    loadAllAssignments();
  }, [batches]);

  /* Save assignments to localStorage */
  const saveAssignments = (batchId: string, newAssignments: AssignedSlot[]) => {
    try {
      // Update local state
      const otherAssignments = assignments.filter(a => a.batchId !== batchId);
      setAssignments([...otherAssignments, ...newAssignments]);
      
      // Save to localStorage
      localStorage.setItem(`batchAssignments_${batchId}`, JSON.stringify(newAssignments));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save assignments:", error);
    }
  };

  const assignItem = (dayIndex: number, slotIndex: number, item: Teacher | PeriodType) => {
    const batchAssignments = assignments.filter(a => a.batchId === activeBatchId);
    const existingIndex = batchAssignments.findIndex(a => 
      a.dayIndex === dayIndex && a.slotIndex === slotIndex
    );

    let newBatchAssignments = [...batchAssignments];
    
    if (existingIndex >= 0) {
      if (item.type === 'teacher') {
        newBatchAssignments[existingIndex] = { 
          dayIndex, 
          slotIndex, 
          teacher: item, 
          periodType: undefined,
          batchId: activeBatchId 
        };
      } else {
        newBatchAssignments[existingIndex] = { 
          dayIndex, 
          slotIndex, 
          periodType: item, 
          teacher: undefined,
          batchId: activeBatchId 
        };
      }
    } else {
      if (item.type === 'teacher') {
        newBatchAssignments.push({ 
          dayIndex, 
          slotIndex, 
          teacher: item, 
          periodType: undefined,
          batchId: activeBatchId 
        });
      } else {
        newBatchAssignments.push({ 
          dayIndex, 
          slotIndex, 
          periodType: item, 
          teacher: undefined,
          batchId: activeBatchId 
        });
      }
    }

    saveAssignments(activeBatchId, newBatchAssignments);
    setOpenDropdown(null);
    setDropdownPosition(null);
    setHasUnsavedChanges(true);
  };

  const removeAssignment = (dayIndex: number, slotIndex: number) => {
    const batchAssignments = assignments.filter(a => a.batchId === activeBatchId);
    const newBatchAssignments = batchAssignments.filter(a => 
      !(a.dayIndex === dayIndex && a.slotIndex === slotIndex)
    );
    
    saveAssignments(activeBatchId, newBatchAssignments);
    setHasUnsavedChanges(true);
  };

  const getAssignedItem = (dayIndex: number, slotIndex: number) => {
    const assignment = assignments.find(a => 
      a.dayIndex === dayIndex && a.slotIndex === slotIndex && a.batchId === activeBatchId
    );
    
    if (assignment?.teacher) {
      return { type: 'teacher' as const, data: assignment.teacher };
    } else if (assignment?.periodType) {
      return { type: 'period' as const, data: assignment.periodType };
    }
    return null;
  };

  const getActiveBatch = () => {
    return batches.find(b => b.id === activeBatchId);
  };

  const getBatchStats = (batchId: string) => {
    const batchAssignments = assignments.filter(a => a.batchId === batchId);
    const totalSlots = days.reduce((total, day) => total + day.slots.length, 0);
    return {
      assigned: batchAssignments.length,
      total: totalSlots,
      remaining: totalSlots - batchAssignments.length
    };
  };

  const saveChanges = () => {
    // In a real app, this would save to backend
    alert("Changes saved successfully!");
    setHasUnsavedChanges(false);
  };

  const saveAndNext = () => {
    saveChanges();
    
    // Find next batch
    const currentIndex = batches.findIndex(b => b.id === activeBatchId);
    const nextIndex = (currentIndex + 1) % batches.length;
    setActiveBatchId(batches[nextIndex].id);
  };

  const handleSlotClick = (e: React.MouseEvent, dropdownKey: string) => {
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate position
    let top = rect.bottom + 8; // 8px margin below slot
    let left = rect.left;
    
    // Check if dropdown would go off bottom of screen
    const estimatedDropdownHeight = 400; // Approximate height
    if (top + estimatedDropdownHeight > viewportHeight - 20) {
      // Position above the slot instead
      top = rect.top - estimatedDropdownHeight - 8;
    }
    
    // Check if dropdown would go off right of screen
    const dropdownWidth = 600;
    if (left + dropdownWidth > window.innerWidth - 20) {
      // Align to right edge of screen
      left = window.innerWidth - dropdownWidth - 20;
    }
    
    setDropdownPosition({ top, left });
    setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey);
  };

  const activeBatch = getActiveBatch();
  
  // Return early if no active batch (defensive check)
  if (!activeBatch) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.errorState}>
          <h3 style={styles.title}>No Active Batch</h3>
          <p>Please add a batch to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header with Save Buttons */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Fixed Batches Schedule</h3>
          <p style={styles.subtitle}>Assign teachers and periods to time slots for each batch</p>
        </div>
        
        {/* Save Buttons */}
        <div style={styles.saveButtons}>
          {hasUnsavedChanges && (
            <span style={styles.unsavedIndicator}>• Unsaved changes</span>
          )}
          <button 
            style={styles.saveBtn}
            onClick={saveChanges}
            disabled={!hasUnsavedChanges}
          >
            💾 Save Changes
          </button>
          <button 
            style={styles.saveNextBtn}
            onClick={saveAndNext}
            disabled={!hasUnsavedChanges}
          >
            💾 Save & Next Batch →
          </button>
        </div>
      </div>

      {/* Help Section at Top */}
      {showHelp && (
        <div style={styles.helpSection}>
          <div style={styles.helpHeader}>
            <div style={styles.helpTitleContainer}>
              <span style={styles.helpIcon}>💡</span>
              <span style={styles.helpTitle}>How to use:</span>
            </div>
            <button
              style={styles.closeHelpBtn}
              onClick={() => setShowHelp(false)}
              title="Close help"
            >
              ×
            </button>
          </div>
          <ul style={styles.helpList}>
            <li>Click on any time slot to open assignment dropdown</li>
            <li>Choose from <strong>Teachers</strong> or <strong>Period Types</strong> sections</li>
            <li>Select a teacher to assign them to that slot</li>
            <li>Select a period type (Free Period, Exam, etc.)</li>
            <li>Click the × button to remove an assignment</li>
            <li>Click <strong>Save Changes</strong> to save your progress</li>
            <li>Click <strong>Save & Next Batch</strong> to save and move to next batch</li>
          </ul>
        </div>
      )}

      {/* Batch Tabs */}
      <div style={styles.tabContainer}>
        {batches.map((batch) => {
          const stats = getBatchStats(batch.id);
          const isActive = activeBatchId === batch.id;
          
          return (
            <div key={batch.id} style={styles.batchTabWrapper}>
              <button
                onClick={() => setActiveBatchId(batch.id)}
                style={{
                  ...styles.batchTab,
                  ...(isActive ? styles.activeBatchTab : {}),
                  borderLeftColor: batch.color
                }}
              >
                <div style={styles.tabContent}>
                  <div style={styles.tabLeft}>
                    <div style={{...styles.batchDot, backgroundColor: batch.color}}></div>
                    <span style={styles.batchTabName}>{batch.name}</span>
                  </div>
                  <div style={styles.tabStats}>
                    <span style={styles.statBadge}>{stats.assigned}/{stats.total}</span>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Batch Content */}
      <div style={styles.batchContent}>
        {/* Batch Info Header */}
        <div style={styles.batchInfoHeader}>
          <div style={styles.batchInfo}>
            <div style={{...styles.batchColorDot, backgroundColor: activeBatch.color}}></div>
            <div>
              <h4 style={styles.activeBatchTitle}>{activeBatch.name}</h4>
              <div style={styles.batchDetails}>
                <span>{activeBatch.year}</span>
                <span>•</span>
                <span>{activeBatch.students} students</span>
              </div>
            </div>
          </div>
          <div style={styles.batchStats}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Slots:</span>
              <span style={styles.statValue}>{getBatchStats(activeBatchId).total}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Assigned:</span>
              <span style={styles.statValue}>{getBatchStats(activeBatchId).assigned}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Remaining:</span>
              <span style={styles.statValue}>{getBatchStats(activeBatchId).remaining}</span>
            </div>
          </div>
        </div>

        {/* Schedule Grid */}
        {days.length === 0 ? (
          <div style={styles.noSlotsMessage}>
            <p>No time slots found. Please define time slots in the Slots tab first.</p>
            <button 
              style={styles.goToSlotsBtn}
              onClick={() => {
                // You can implement navigation here if needed
                alert("Go to Slots tab to create time slots");
              }}
            >
              Go to Slots Tab
            </button>
          </div>
        ) : (
          <div style={styles.gridContainer}>
            {/* Table Header */}
            <div style={styles.tableHeader}>
              <div style={styles.dayHeaderColumn}>Week Days</div>
              <div style={styles.slotsHeaderColumn}>Time Slots & Assignments</div>
            </div>

            {/* Days & Slots Grid */}
            <div style={styles.grid}>
              {days.map((day, dayIndex) => (
                <div key={day.day} style={styles.dayRow}>
                  {/* Day Column */}
                  <div style={styles.dayColumn}>
                    <div style={styles.dayCell}>
                      <div 
                        style={{...styles.dayColorDot, backgroundColor: day.color}} 
                      />
                      <span style={styles.dayName}>{day.day}</span>
                      <span style={styles.daySlotCount}>
                        ({day.slots.length} slots)
                      </span>
                    </div>
                  </div>

                  {/* Slots Column */}
                  <div style={styles.slotsColumn}>
                    <div style={styles.slotsRow}>
                      {day.slots.length === 0 ? (
                        <div style={styles.emptyDayMessage}>
                          No time slots for {day.day}
                        </div>
                      ) : (
                        day.slots.map((slot, slotIndex) => {
                          const assignedItem = getAssignedItem(dayIndex, slotIndex);
                          const dropdownKey = `${activeBatchId}-${dayIndex}-${slotIndex}`;
                          const isDropdownOpen = openDropdown === dropdownKey;

                          return (
                            <div key={slotIndex} style={styles.slotContainer}>
                              <div 
                                style={styles.slotCell}
                                onClick={(e) => handleSlotClick(e, dropdownKey)}
                              >
                                {assignedItem ? (
                                  <div style={styles.assignedSlot}>
                                    <div style={styles.slotTime}>{slot.id}: {slot.time}</div>
                                    <div style={styles.teacherInfo}>
                                      {assignedItem.type === 'teacher' ? (
                                        <>
                                          <strong style={styles.subjectText}>
                                            {assignedItem.data.subject}
                                          </strong>
                                          <div style={styles.teacherDetails}>
                                            {assignedItem.data.name} ({assignedItem.data.code})
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          <strong style={{
                                            ...styles.subjectText,
                                            color: assignedItem.data.color
                                          }}>
                                            {assignedItem.data.name}
                                          </strong>
                                          <div style={styles.teacherDetails}>
                                            {assignedItem.data.description}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                    <button
                                      style={styles.removeButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeAssignment(dayIndex, slotIndex);
                                      }}
                                      title="Remove assignment"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : (
                                  <div style={styles.unassignedSlot}>
                                    <div style={styles.slotTime}>{slot.id}: {slot.time}</div>
                                    <div style={styles.assignPrompt}>
                                      + Assign Teacher/Period
                                    </div>
                                  </div>
                                )}

                                {/* Dropdown Arrow */}
                                <div style={styles.dropdownArrow}>
                                  ▼
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dropdown Portal - Rendered at root level */}
      {openDropdown && dropdownPosition && (
        <div
          ref={el => dropdownRefs.current[openDropdown] = el}
          style={{
            ...styles.assignmentDropdown,
            position: "fixed",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
        >
          <div style={styles.dropdownHeader}>
            <span style={styles.dropdownTitle}>Select Teacher/Period</span>
            <button
              style={styles.closeDropdown}
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(null);
                setDropdownPosition(null);
              }}
              title="Close dropdown"
            >
              ×
            </button>
          </div>
          
          {/* Two-column grid for Teachers and Periods */}
          <div style={styles.dropdownGrid}>
            {/* Teachers Section */}
            <div style={styles.dropdownSection}>
              <div style={styles.sectionHeader}>
                <div style={{...styles.sectionIcon, background: "#3B82F6"}}>👨‍🏫</div>
                <h4 style={styles.sectionTitle}>Teachers</h4>
              </div>
              <div style={styles.itemsList}>
                {TEACHERS_DATA.map((teacher) => (
                  <div
                    key={teacher.id}
                    style={styles.itemCard}
                    onClick={() => {
                      // Extract dayIndex and slotIndex from dropdownKey
                      const parts = openDropdown.split('-');
                      const dayIndex = parseInt(parts[1]);
                      const slotIndex = parseInt(parts[2]);
                      assignItem(dayIndex, slotIndex, teacher);
                    }}
                  >
                    <div style={styles.itemMainInfo}>
                      <strong>{teacher.subject}</strong>
                      <div style={styles.itemCode}>
                        {teacher.code}
                      </div>
                    </div>
                    <div style={styles.itemDetails}>
                      {teacher.name} • {teacher.department}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Periods Section */}
            <div style={styles.dropdownSection}>
              <div style={styles.sectionHeader}>
                <div style={{...styles.sectionIcon, background: "#10B981"}}>⏰</div>
                <h4 style={styles.sectionTitle}>Period Types</h4>
              </div>
              <div style={styles.itemsList}>
                {PERIOD_TYPES.map((period) => (
                  <div
                    key={period.id}
                    style={styles.itemCard}
                    onClick={() => {
                      // Extract dayIndex and slotIndex from dropdownKey
                      const parts = openDropdown.split('-');
                      const dayIndex = parseInt(parts[1]);
                      const slotIndex = parseInt(parts[2]);
                      assignItem(dayIndex, slotIndex, period);
                    }}
                  >
                    <div style={styles.itemMainInfo}>
                      <strong style={{ color: period.color }}>
                        {period.name}
                      </strong>
                      <div style={{
                        ...styles.periodBadge,
                        background: period.color
                      }}>
                        {period.type}
                      </div>
                    </div>
                    <div style={styles.itemDetails}>
                      {period.description}
                    </div>
                  </div>
                ))}
              </div>
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
    position: "relative",
  },
  errorState: {
    padding: "40px",
    textAlign: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
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
  saveButtons: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  unsavedIndicator: {
    fontSize: "12px",
    color: "#EF4444",
    fontWeight: "500",
    marginRight: "8px",
  },
  saveBtn: {
    padding: "10px 20px",
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  saveNextBtn: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  helpSection: {
    marginBottom: "24px",
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
    position: "relative",
  },
  helpHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  helpTitleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  helpIcon: {
    fontSize: "16px",
  },
  helpTitle: {
    fontWeight: "600",
    color: "#0369a1",
    fontSize: "15px",
  },
  closeHelpBtn: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "1px solid #94a3b8",
    background: "#ffffff",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
  },
  helpList: {
    margin: "0",
    paddingLeft: "20px",
    color: "#0c4a6e",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  tabContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
  },
  batchTabWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    position: "relative",
  },
  batchTab: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#475569",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    borderLeft: "4px solid transparent",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  activeBatchTab: {
    background: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },
  tabContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: "12px",
  },
  tabLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  batchDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  batchTabName: {
    fontSize: "14px",
    fontWeight: "500",
  },
  tabStats: {
    fontSize: "12px",
  },
  statBadge: {
    background: "rgba(255,255,255,0.2)",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "500",
  },
  batchContent: {
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    overflow: "visible",
  },
  batchInfoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },
  batchInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  batchColorDot: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
  },
  activeBatchTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  batchDetails: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    fontSize: "14px",
    color: "#64748b",
  },
  batchStats: {
    display: "flex",
    gap: "24px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
  },
  noSlotsMessage: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
  },
  goToSlotsBtn: {
    marginTop: "16px",
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  gridContainer: {
    background: "#ffffff",
    position: "relative",
    overflow: "visible",
  },
  tableHeader: {
    display: "flex",
    background: "#f1f5f9",
    borderBottom: "2px solid #e2e8f0",
  },
  dayHeaderColumn: {
    width: "180px",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
  },
  slotsHeaderColumn: {
    flex: "1",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
  },
  dayRow: {
    display: "flex",
    borderBottom: "1px solid #f1f5f9",
    position: "relative",
    overflow: "visible",
  },
  dayColumn: {
    width: "180px",
    padding: "16px",
    background: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
  },
  dayCell: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  dayColorDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },
  dayName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },
  daySlotCount: {
    fontSize: "13px",
    color: "#64748b",
  },
  slotsColumn: {
    flex: "1",
    padding: "16px",
    position: "relative",
    overflow: "visible",
  },
  slotsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    position: "relative",
    overflow: "visible",
  },
  emptyDayMessage: {
    padding: "20px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  slotContainer: {
    position: "relative",
    marginBottom: "8px",
  },
  slotCell: {
    minWidth: "220px",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "relative",
    transition: "all 0.2s",
  },
  assignedSlot: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    position: "relative",
    paddingRight: "20px",
  },
  unassignedSlot: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  slotTime: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
  teacherInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  subjectText: {
    fontSize: "14px",
    color: "#1e293b",
    fontWeight: "600",
  },
  teacherDetails: {
    fontSize: "12px",
    color: "#475569",
  },
  assignPrompt: {
    fontSize: "13px",
    color: "#2563eb",
    fontWeight: "500",
    fontStyle: "italic",
  },
  removeButton: {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownArrow: {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    fontSize: "10px",
    color: "#94a3b8",
  },
  assignmentDropdown: {
    width: "600px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    zIndex: 9999,
  },
  dropdownHeader: {
    padding: "12px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "8px 8px 0 0",
  },
  dropdownTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
  },
  closeDropdown: {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1px",
    background: "#e2e8f0",
    borderRadius: "0 0 8px 8px",
    overflow: "hidden",
  },
  dropdownSection: {
    background: "#ffffff",
    padding: "16px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
  },
  sectionIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "#ffffff",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  itemsList: {
    maxHeight: "250px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  itemCard: {
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "#ffffff",
  },
  itemMainInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  itemCode: {
    fontSize: "11px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  itemDetails: {
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.4",
  },
  periodBadge: {
    fontSize: "10px",
    color: "#ffffff",
    padding: "2px 8px",
    borderRadius: "12px",
    fontWeight: "500",
  },
};

export default FixedSlots;