import React, { useState, useEffect, useCallback } from "react";
import { Fetch } from "../usefetch";
import { cleanTimetableId } from "../AllApi";
import { toast } from "react-toastify";

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

type ViewMode = "batch" | "teacher" | "available_teachers";

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

const DAY_SHORT_NAMES: { [key: string]: string } = {
  "d1": "Mon",
  "d2": "Tue",
  "d3": "Wed",
  "d4": "Thu",
  "d5": "Fri",
  "d6": "Sat",
  "d7": "Sun",
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

/* ================= HELPER FUNCTIONS ================= */
// Function to get weekday short name
const getWeekdayShortName = (dayIndex: number): string => {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const adjustedIndex = (dayIndex - 1) % 7;
  return weekdays[adjustedIndex];
};

// Function to get weekday color for any day index
const getWeekdayColor = (dayIndex: number): string => {
  const defaultColors = [
    "#3b82f6",  // Monday - Blue
    "#10b981",  // Tuesday - Green
    "#8b5cf6",  // Wednesday - Purple
    "#f59e0b",  // Thursday - Orange
    "#ef4444",  // Friday - Red
    "#ec4899",  // Saturday - Pink
    "#06b6d4"   // Sunday - Cyan
  ];
  const colorIndex = (dayIndex - 1) % 7;
  return defaultColors[colorIndex];
};

/* ================= DROPDOWN SELECTOR ================= */
interface DropdownSelectorProps {
  title: string;
  items: { id: string; label: string; color?: string }[];
  selectedIds: string[];
  onSelectItem: (id: string) => void;
  onClearAll: () => void;
  placeholder?: string;
}

const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  title,
  items,
  selectedIds,
  onSelectItem,
  onClearAll,
  placeholder = "Select items..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (id: string) => {
    onSelectItem(id);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={dropdownRef}>
      <button
        style={{
          ...styles.dropdownTrigger,
          backgroundColor: "#f8fafc",
          borderColor: "#e2e8f0",
          color: "#475569",
        }}
        onClick={() => setIsOpen(!isOpen)}
        title={`Select ${title.toLowerCase()}`}
      >
        <span style={styles.dropdownTriggerText}>
          <span style={{ marginRight: "4px" }}>▼</span>
          {placeholder}
        </span>
      </button>

      {isOpen && (
        <div style={styles.selectorDropdown}>
          <div style={styles.selectorHeader}>
            <span style={styles.selectorTitle}>Select {title}</span>
            <button
              style={styles.selectorClearBtn}
              onClick={(e) => {
                e.stopPropagation();
                onClearAll();
              }}
            >
              Clear All
            </button>
          </div>

          <div style={styles.selectorInfo}>
            <span style={styles.selectorCount}>
              {selectedIds.length} of {items.length} selected
            </span>
          </div>

          <div style={styles.selectorItems}>
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  ...styles.selectorItem,
                  backgroundColor: selectedIds.includes(item.id) ? "#f1f5f9" : "transparent",
                }}
                onClick={() => handleItemClick(item.id)}
              >
                <div style={styles.selectorCheckbox}>
                  {selectedIds.includes(item.id) ? (
                    <div style={styles.selectorCheckboxChecked}>✓</div>
                  ) : (
                    <div style={styles.selectorCheckboxUnchecked} />
                  )}
                </div>
                <span style={styles.selectorItemLabel}>{item.label}</span>
                {item.color && (
                  <div
                    style={{
                      ...styles.selectorItemColor,
                      backgroundColor: item.color
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div style={styles.selectorFooter}>
            <button
              style={styles.selectorDoneBtn}
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= MATRIX TIMETABLE COMPONENT ================= */  


interface MatrixTimetableProps {
  rows: BatchData[] | TeacherData[];
  rowType: "batch" | "teacher";
  getSubjectColor: (s: string | null) => { bg: string; text: string; border: string };
  toggleAvailableTeachers: (slotId: string, dayKey: string, timeSlot: string, entityId: string, entityType: 'batch' | 'teacher') => void;
  loadingAvailableTeachers: {[key: string]: boolean};
}

const MatrixTimetable: React.FC<MatrixTimetableProps> = ({
  rows,
  rowType,
  getSubjectColor,
  toggleAvailableTeachers,
  loadingAvailableTeachers
}) => {
  // Get all days present in the data
  const allDays = React.useMemo(() => {
    const daysSet = new Set<string>();
    rows.forEach(row => {
      Object.keys(row.slots || {}).forEach(dayKey => {
        daysSet.add(dayKey);
      });
    });
    
    // Sort days by day index
    return Array.from(daysSet).sort((a, b) => {
      const dayA = parseInt(a.replace('d', ''));
      const dayB = parseInt(b.replace('d', ''));
      return dayA - dayB;
    });
  }, [rows]);

  // Get ALL unique time slots across ALL days and rows
  const allTimeSlots = React.useMemo(() => {
    const timeSet = new Set<string>();
    
    rows.forEach(row => {
      Object.keys(row.slots || {}).forEach(dayKey => {
        const daySlots = row.slots[dayKey] || [];
        daySlots.forEach(slot => {
          const timeKey = `${slot.start_time}-${slot.end_time}`;
          timeSet.add(timeKey);
        });
      });
    });
    
    // Convert to array and sort by time
    return Array.from(timeSet)
      .map(time => {
        const [start, end] = time.split('-');
        return { start, end, key: time };
      })
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [rows]);

  // Calculate dynamic width for day cells based on number of time slots
  const dayCellWidth = React.useMemo(() => {
    // Each slot needs ~90px (80px width + 4px gap * 2)
    const slotWidth = 90;
    const minDayWidth = 150; // Minimum width for day cell
    const calculatedWidth = Math.max(minDayWidth, allTimeSlots.length * slotWidth);
    return calculatedWidth;
  }, [allTimeSlots.length]);

  // Get color for row based on index
  const getRowColor = (index: number) => {
    if (rowType === "batch") {
      return BATCH_COLORS[index % BATCH_COLORS.length];
    } else {
      return TEACHER_COLORS[index % TEACHER_COLORS.length];
    }
  };

  // Function to find slot for specific row, day, and time
  const findSlot = (row: BatchData | TeacherData, dayKey: string, timeSlot: {start: string, end: string}) => {
    const daySlots = row.slots[dayKey] || [];
    return daySlots.find(s => 
      s.start_time === timeSlot.start && s.end_time === timeSlot.end
    );
  };

  const handleSlotClick = (
    slot: SlotData, 
    rowId: string, 
    dayKey: string
  ) => {
    if (slot && slot.slot_id) {
      toggleAvailableTeachers(
        slot.slot_id,
        dayKey,
        `${slot.start_time}-${slot.end_time}`,
        rowId,
        rowType
      );
    }
  };

  // Function to get time display for slot
  const getTimeDisplay = (slot: SlotData) => {
    const start = slot.start_time.substring(0, 5);
    const end = slot.end_time.substring(0, 5);
    return `${start}-${end}`;
  };

  const getDateForDay = (dayKey: string): string | null => {
    for (const row of rows) {
      const slots = row.slots[dayKey];
      if (slots && slots.length > 0) {
        return slots[0].actual_date;
      }
    }
    return null;
  };

  return (
    <div style={styles.matrixWrapper}>
      <div style={styles.matrixContainer}>
        {/* Header Row */}
        <div style={styles.matrixHeader}>
          <div style={styles.matrixCornerCell}>
            {rowType === "batch" ? "Batch" : "Teacher"}
          </div>
          {allDays.map(dayKey => (
            <div 
              key={dayKey} 
              style={{
                ...styles.matrixDayHeader,
                backgroundColor: getWeekdayColor(parseInt(dayKey.replace('d', ''))),
                minWidth: dayCellWidth,
              }}
            >
              <div style={styles.dayHeaderContent}>
                <div style={styles.dayName}>
                  {DAY_SHORT_NAMES[dayKey] || getWeekdayShortName(parseInt(dayKey.replace('d', '')))}
                </div>

                {getDateForDay(dayKey) && (
                  <div style={styles.dayDate}>
                    {new Date(getDateForDay(dayKey)!).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Rows (Batches or Teachers) */}
        {rows.map((row, rowIndex) => {
          const rowColor = getRowColor(rowIndex);
          
          return (
            <div key={row[rowType === "batch" ? "batch_id" : "teacher_id"]} style={styles.matrixRow}>
              {/* Left Column - Row Name */}
              <div 
                style={{
                  ...styles.matrixRowLabel,
                  backgroundColor: rowColor.bg,
                  borderLeftColor: rowColor.border,
                  color: rowColor.text
                }}
              >
                <div style={styles.rowLabelContent}>
                  <div style={styles.rowName}>
                    {rowType === "batch" 
                      ? (row as BatchData).batch_name 
                      : (row as TeacherData).teacher_name}
                  </div>
                  <div style={styles.rowCode}>
                    {rowType === "batch" 
                      ? (row as BatchData).batch_code 
                      : (row as TeacherData).teacher_code}
                  </div>
                </div>
              </div>

              {/* Day Cells with Horizontal Time Slots */}
              {allDays.map(dayKey => (
                <div 
                  key={`${row[rowType === "batch" ? "batch_id" : "teacher_id"]}-${dayKey}`} 
                  style={{
                    ...styles.matrixDayCell,
                    minWidth: dayCellWidth,
                  }}
                >
                  {/* Time slots in horizontal row */}
                  <div style={styles.timeSlotsRow}>
                    {allTimeSlots.map((timeSlot, timeIdx) => {
                      const slot = findSlot(row, dayKey, timeSlot);
                      
                      if (!slot) {
                        return (
                          <div 
                            key={`${dayKey}-${timeIdx}`} 
                            style={styles.emptyTimeSlotHorizontal}
                            title="No class"
                          />
                        );
                      }

                      const subjectColor = getSubjectColor(slot.subject);
                      const isLoading = loadingAvailableTeachers[slot.slot_id];
                      
                      return (
                        <div
                          key={`${dayKey}-${timeIdx}`}
                          style={{
                            ...styles.slotBoxHorizontal,
                            backgroundColor: subjectColor.bg,
                            borderColor: subjectColor.border,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleSlotClick(slot, 
                            row[rowType === "batch" ? "batch_id" : "teacher_id"], 
                            dayKey
                          )}
                          title={`${slot.subject || 'Free'} \n${getTimeDisplay(slot)} \n${slot.room_number ? `Room: ${slot.room_number}` : ''}`}
                        >
                          <div style={styles.slotContentHorizontal}>
                            <div style={{...styles.slotSubjectHorizontal, color: subjectColor.text}}>
                              {slot.subject || 'Free'}
                            </div>
                            <div style={styles.slotTimeHorizontal}>
                              {getTimeDisplay(slot)}
                            </div>
                            {rowType === "teacher" && slot.batch_name && (
                              <div style={styles.slotBatchMiniHorizontal}>
                                {slot.batch_name}
                              </div>
                            )}
                            {rowType === "batch" && slot.teacher && (
                              <div style={styles.slotTeacherMiniHorizontal}>
                                {typeof slot.teacher === 'string' 
                                  ? slot.teacher 
                                  : slot.teacher.teacher_name || slot.teacher.teacher_code || 'TCH'}
                              </div>
                            )}
                          </div>
                          
                          {isLoading && (
                            <div style={styles.slotLoading}>
                              <div style={styles.miniSpinner}></div>
                            </div>
                          )}
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
  );
};
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
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [activeBatchTab, setActiveBatchTab] = useState<string | null>(null);
  
  // Teacher view state
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [activeTeacherTab, setActiveTeacherTab] = useState<string | null>(null);

  // Available teachers state
  const [loadingAvailableTeachers, setLoadingAvailableTeachers] = useState<{[key: string]: boolean}>({});
  const [slotsWithTeachers, setSlotsWithTeachers] = useState<{
    [slotId: string]: {
      slot: SlotData;
      teachers: AvailableTeacher[];
      hasLoaded: boolean;
    }
  }>({});
  const [loadingAllTeachers, setLoadingAllTeachers] = useState(false);

  // Timetable activation state
  const [isActive, setIsActive] = useState<boolean>(false);
  const [togglingActive, setTogglingActive] = useState(false);

  useEffect(() => {
    const rawId = localStorage.getItem("timetable_id");
    if (rawId) {
      setTimetableId(cleanTimetableId(rawId));
    } else {
      setError("No timetable ID found. Please select a timetable first.");
      setLoading(false);
    }
  }, []);

  // Check timetable activation status
  const checkActivationStatus = useCallback(async () => {
    if (!timetableId) return;
    try {
      const response = await Fetch(`/api/timetable/timetables/${timetableId}/`, {
        method: "GET",
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Timetable activation status from API:", data.is_active);
        // Explicitly check if is_active is true, otherwise set to false
        const activeStatus = data.is_active === true;
        console.log("Setting isActive to:", activeStatus);
        setIsActive(activeStatus);
      } else {
        console.log("API response not OK, setting to inactive");
        // If API fails, default to inactive
        setIsActive(false);
      }
    } catch (err) {
      console.error("Error checking activation status:", err);
      // On error, default to inactive
      setIsActive(false);
    }
  }, [timetableId]);

  // Toggle timetable activation
  const toggleActivation = useCallback(async () => {
    if (!timetableId || togglingActive) return;
    
    setTogglingActive(true);
    try {
      const endpoint = isActive 
        ? `/api/timetable/admin/timetables/${timetableId}/deactivate/`
        : `/api/timetable/admin/timetables/${timetableId}/activate/`;
      
      const response = await Fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        setIsActive(!isActive);
       
      } else {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to ${isActive ? 'deactivate' : 'activate'} timetable`);
      }
    } catch (err: any) {
      console.error("Toggle activation error:", err);
      toast.error(err.message || `Failed to ${isActive ? 'deactivate' : 'activate'} timetable`);
    } finally {
      setTogglingActive(false);
    }
  }, [timetableId, isActive, togglingActive]);

  // Check activation status when timetableId changes
  useEffect(() => {
    if (timetableId) {
      checkActivationStatus();
    }
  }, [timetableId, checkActivationStatus]);

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

  // Load all available teachers for the available teachers view
  const loadAllAvailableTeachers = useCallback(async () => {
    if (!timetableId) return;
    
    setLoadingAllTeachers(true);
    
    try {
      const batchResponse = await Fetch(
        `/api/timetable/timetables/${timetableId}/batches/`,
        { method: "GET" }
      );
      
      if (!batchResponse.ok) {
        console.warn(`Failed to load batches: ${batchResponse.status}`);
        return;
      }
      
      const batchData: TimetableResponse = await batchResponse.json();
      const allBatches = batchData.batches || [];
      
      const slotsMap: { [slotId: string]: { slot: SlotData; teachers: AvailableTeacher[]; hasLoaded: boolean; } } = {};
      
      for (const batch of allBatches) {
        for (const dayKey in batch.slots) {
          for (const slot of batch.slots[dayKey]) {
            if (!slotsMap[slot.slot_id]) {
              slotsMap[slot.slot_id] = {
                slot,
                teachers: [],
                hasLoaded: false,
              };
            }
          }
        }
      }
      
      setSlotsWithTeachers(slotsMap);
    } catch (err: any) {
      console.warn(`Error loading slots:`, err.message);
    } finally {
      setLoadingAllTeachers(false);
    }
  }, [timetableId]);

  // Load data based on view mode
  useEffect(() => {
    if (timetableId) {
      if (viewMode === "batch") {
        loadBatchesData();
      } else if (viewMode === "teacher") {
        loadTeachersData();
      } else if (viewMode === "available_teachers") {
        loadAllAvailableTeachers();
      }
    }
  }, [timetableId, viewMode, loadBatchesData, loadTeachersData, loadAllAvailableTeachers]);

  // Toggle available teachers for a slot
  const toggleAvailableTeachers = useCallback(async (slotId: string, dayKey: string, timeSlot: string, entityId: string, entityType: 'batch' | 'teacher') => {
    if (entityId === 'available_teachers_view') {
      if (loadingAvailableTeachers[slotId]) return;

      setSlotsWithTeachers(prev => {
        const current = prev[slotId];
        if (!current) return prev;

        return {
          ...prev,
          [slotId]: {
            ...current,
            slot: {
              ...current.slot,
              show_available_teachers: !current.slot.show_available_teachers,
            },
          },
        };
      });

      if (slotsWithTeachers[slotId]?.hasLoaded) return;

      const teachers = await loadAvailableTeachers(slotId);

      if (teachers) {
        setSlotsWithTeachers(prev => ({
          ...prev,
          [slotId]: {
            ...prev[slotId],
            teachers,
            hasLoaded: true,
          },
        }));
      }

      return;
    } else {
      if (entityType === 'teacher') {
        setTeachers(prev => prev.map(teacher => {
          if (teacher.teacher_id === entityId) {
            const updatedSlots = { ...teacher.slots };
            if (updatedSlots[dayKey]) {
              updatedSlots[dayKey] = updatedSlots[dayKey].map(slot => {
                if (slot.slot_id === slotId) {
                  const shouldShow = !slot.show_available_teachers;
                  
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
      } else if (entityType === 'batch') {
        setBatches(prev => prev.map(batch => {
          if (batch.batch_id === entityId) {
            const updatedSlots = { ...batch.slots };
            if (updatedSlots[dayKey]) {
              updatedSlots[dayKey] = updatedSlots[dayKey].map(slot => {
                if (slot.slot_id === slotId) {
                  const shouldShow = !slot.show_available_teachers;
                  
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
      }
    }
  }, [loadAvailableTeachers, loadingAvailableTeachers, slotsWithTeachers]);

  const getSubjectColor = (subject: string | null) =>
    subject ? SUBJECT_COLORS[subject] || SUBJECT_COLORS.default : SUBJECT_COLORS.default;

  // Toggle batch selection
  const toggleBatchSelection = (batchId: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId)
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  // Toggle teacher selection
  const toggleTeacherSelection = (teacherId: string) => {
    setSelectedTeacherIds(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  // Clear all batch filters
  const clearBatchFilters = () => {
    setSelectedBatchIds([]);
  };

  // Clear all teacher filters
  const clearTeacherFilters = () => {
    setSelectedTeacherIds([]);
  };

  // Filter rows based on selection
  const getFilteredRows = () => {
    if (viewMode === "batch") {
      if (activeBatchTab) {
        return batches.filter(b => b.batch_id === activeBatchTab);
      }
      if (selectedBatchIds.length > 0) {
        return batches.filter(b => selectedBatchIds.includes(b.batch_id));
      }
      return batches;
    } else {
      if (activeTeacherTab) {
        return teachers.filter(t => t.teacher_id === activeTeacherTab);
      }
      if (selectedTeacherIds.length > 0) {
        return teachers.filter(t => selectedTeacherIds.includes(t.teacher_id));
      }
      return teachers;
    }
  };

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

  const filteredRows = getFilteredRows();

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
          {/* Activation Toggle */}
          <div style={styles.activationToggleContainer}>
            <span style={styles.activationLabel}>
              {isActive ? "Active" : "Inactive"}
            </span>
            <button
              style={{
                ...styles.toggleSwitch,
                backgroundColor: isActive ? "#10b981" : "#cbd5e1",
                opacity: togglingActive ? 0.7 : 1,
                cursor: togglingActive ? "wait" : "pointer",
              }}
              onClick={toggleActivation}
              disabled={togglingActive}
              title={isActive ? "Click to deactivate timetable" : "Click to activate timetable"}
            >
              <div
                style={{
                  ...styles.toggleKnob,
                  transform: isActive ? "translateX(20px)" : "translateX(0)",
                }}
              >
                {togglingActive && <div style={styles.toggleSpinner}></div>}
              </div>
            </button>
          </div>
          
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
          {viewMode === "teacher" && (
            <div style={styles.headerStatsInline}>
              <button style={styles.headerStatBtn} onClick={() => setViewMode("teacher")}>
                <div style={styles.headerStatNum}>{teachers.length}</div>
                <div style={styles.headerStatLabel}>Total Teachers</div>
              </button>
              <button style={styles.headerStatBtn} onClick={() => setViewMode("teacher")}>
                <div style={styles.headerStatNum}>{teachers.reduce((sum, t) => sum + t.total_classes, 0)}</div>
                <div style={styles.headerStatLabel}>Total Classes</div>
              </button>
            </div>
          )}
          {viewMode === "available_teachers" && (
            <div style={styles.headerStatsInline}>
              <button style={styles.headerStatBtn} onClick={() => setViewMode("available_teachers")}>
                <div style={styles.headerStatNum}>{Object.keys(slotsWithTeachers).length}</div>
                <div style={styles.headerStatLabel}>Total Slots</div>
              </button>
              <button style={styles.headerStatBtn} onClick={() => setViewMode("available_teachers")}>
                <div style={styles.headerStatNum}>
                  Click to load
                </div>
                <div style={styles.headerStatLabel}>Available Teachers</div>
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
          onClick={() => { setViewMode("batch"); clearBatchFilters(); setActiveBatchTab(null); }}
        >
          <span style={styles.tabIcon}>📚</span>
          Batch-wise View
        </button>
        <button
          style={viewMode === "teacher" ? styles.viewTabActive : styles.viewTab}
          onClick={() => { setViewMode("teacher"); clearTeacherFilters(); setActiveTeacherTab(null); }}
        >
          <span style={styles.tabIcon}>👨‍🏫</span>
          Teacher-wise View
        </button>
        <button
          style={viewMode === "available_teachers" ? styles.viewTabActive : styles.viewTab}
          onClick={() => { setViewMode("available_teachers"); }}
        >
          <span style={styles.tabIcon}>✅</span>
          Available Teachers
        </button>
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        {/* Stats can be added here if needed */}
      </div>

      {viewMode !== "available_teachers" && (
        <div style={styles.filterRow}>
          <span style={styles.filterLabel}>View {viewMode === "batch" ? "Batches" : "Teachers"}:</span>
          
          {/* Always show "All" button */}
          <button
            style={ 
              ((viewMode === "batch" && !activeBatchTab && selectedBatchIds.length === 0) || 
              (viewMode === "teacher" && !activeTeacherTab && selectedTeacherIds.length === 0))
                ? styles.filterActive 
                : styles.filterBtn
            }
            onClick={() => {
              if (viewMode === "batch") {
                setActiveBatchTab(null);
                setSelectedBatchIds([]);
              } else {
                setActiveTeacherTab(null);
                setSelectedTeacherIds([]);
              }
            }}
          >
            All {viewMode === "batch" ? "Batches" : "Teachers"}
          </button>
          
          {/* Selected items as separate tabs */}
          {viewMode === "batch" ? (
            <>
              {selectedBatchIds.map((batchId, idx) => {
                const batch = batches.find(b => b.batch_id === batchId);
                if (!batch) return null;
                
                return (
                  <button
                    key={batch.batch_id}
                    style={{
                      ...(activeBatchTab === batch.batch_id 
                        ? styles.filterActive 
                        : styles.filterBtn
                      ),
                      borderLeft: `3px solid ${BATCH_COLORS[idx % BATCH_COLORS.length].border}`,
                    }}
                    onClick={() => setActiveBatchTab(batch.batch_id)}
                  >
                    {batch.batch_name}
                  </button>
                );
              })}
            </>
          ) : (
            <>
              {selectedTeacherIds.map((teacherId, idx) => {
                const teacher = teachers.find(t => t.teacher_id === teacherId);
                if (!teacher) return null;
                
                return (
                  <button
                    key={teacher.teacher_id}
                    style={{
                      ...(activeTeacherTab === teacher.teacher_id 
                        ? styles.filterActive 
                        : styles.filterBtn
                      ),
                      borderLeft: `3px solid ${TEACHER_COLORS[idx % TEACHER_COLORS.length].border}`,
                    }}
                    onClick={() => setActiveTeacherTab(teacher.teacher_id)}
                  >
                    {teacher.teacher_name}
                  </button>
                );
              })}
            </>
          )}
          
          {/* Dropdown for selecting more items */}
          <div style={{ display: 'inline-block' }}>
            {viewMode === "batch" ? (
              <DropdownSelector
                title="Batches"
                items={batches.map(b => ({
                  id: b.batch_id,
                  label: b.batch_name,
                  color: BATCH_COLORS[batches.indexOf(b) % BATCH_COLORS.length].border
                }))}
                selectedIds={selectedBatchIds}
                onSelectItem={(id) => {
                  toggleBatchSelection(id);
                  setActiveBatchTab(id);
                }}
                onClearAll={() => {
                  clearBatchFilters();
                  setActiveBatchTab(null);
                }}
                placeholder="Add batch..."
              />
            ) : (
              <DropdownSelector
                title="Teachers"
                items={teachers.map(t => ({
                  id: t.teacher_id,
                  label: t.teacher_name,
                  color: TEACHER_COLORS[teachers.indexOf(t) % TEACHER_COLORS.length].border
                }))}
                selectedIds={selectedTeacherIds}
                onSelectItem={(id) => {
                  toggleTeacherSelection(id);
                  setActiveTeacherTab(id);
                }}
                onClearAll={() => {
                  clearTeacherFilters();
                  setActiveTeacherTab(null);
                }}
                placeholder="Add teacher..."
              />
            )}
          </div>
        </div>
      )}

      {/* Info Banner */}
      {viewMode === "available_teachers" && (
        <div style={styles.infoBanner}>
          <span style={styles.infoIcon}>ℹ️</span>
          <span>
            View all available teachers and their availability status across time slots
          </span>
        </div>
      )}

      {/* Content */}
      {viewMode === "batch" ? (
        batches.length === 0 ? (
          <EmptyState message="No batch timetable data available" />
        ) : (
          <MatrixTimetable
            rows={filteredRows as BatchData[]}
            rowType="batch"
            getSubjectColor={getSubjectColor}
            toggleAvailableTeachers={toggleAvailableTeachers}
            loadingAvailableTeachers={loadingAvailableTeachers}
          />
        )
      ) : viewMode === "teacher" ? (
        teachers.length === 0 ? (
          <EmptyState message="No teacher timetable data available" />
        ) : (
          <MatrixTimetable
            rows={filteredRows as TeacherData[]}
            rowType="teacher"
            getSubjectColor={getSubjectColor}
            toggleAvailableTeachers={toggleAvailableTeachers}
            loadingAvailableTeachers={loadingAvailableTeachers}
          />
        )
      ) : viewMode === "available_teachers" ? (
        loadingAllTeachers ? (
          <div style={styles.wrapper}>
            <div style={styles.loadingBox}>
              <div style={styles.spinner}></div>
              <p>Loading Available Teachers...</p>
            </div>
          </div>
        ) : Object.keys(slotsWithTeachers).length === 0 ? (
          <EmptyState message="No slots with available teachers data found" />
        ) : (
          <AvailableTeachersView
            slotsWithTeachers={slotsWithTeachers}
            toggleAvailableTeachers={toggleAvailableTeachers}
            loadingAvailableTeachers={loadingAvailableTeachers}
          />
        )
      ) : null}
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

/* ================= AVAILABLE TEACHERS VIEW ================= */
interface AvailableTeachersViewProps {
  slotsWithTeachers: { [slotId: string]: { slot: SlotData; teachers: AvailableTeacher[] } };
  toggleAvailableTeachers: (slotId: string, dayKey: string, timeSlot: string, entityId: string, entityType: 'batch' | 'teacher') => void;
  loadingAvailableTeachers: {[key: string]: boolean};
}

const AvailableTeachersView: React.FC<AvailableTeachersViewProps> = ({
  slotsWithTeachers,
  toggleAvailableTeachers,
  loadingAvailableTeachers
}) => {
  // Group slots by day and time
  const groupedSlots = React.useMemo(() => {
    const groups: { [dayKey: string]: { 
      dayKey: string; 
      dayName: string; 
      date?: string;
      slots: { 
        slot: SlotData; 
        teachers: AvailableTeacher[];
        availableTeachers: AvailableTeacher[];
      }[] 
    } } = {};
    
    Object.values(slotsWithTeachers).forEach(({ slot, teachers }) => {
      const dayKey = `d${slot.day_index}`;
const dayName = getWeekdayShortName(slot.day_index);
      
      if (!groups[dayKey]) {
        groups[dayKey] = {
          dayKey,
          dayName,
          date: slot.actual_date,
          slots: []
        };
      }
      
      groups[dayKey].slots.push({
        slot,
        teachers,
        availableTeachers: teachers.filter(t => t.is_available)
      });
    });
    
    Object.keys(groups).forEach(dayKey => {
      groups[dayKey].slots.sort((a, b) => 
        a.slot.start_time.localeCompare(b.slot.start_time)
      );
    });
    
    return Object.keys(groups)
      .sort((a, b) => {
        const dayA = parseInt(a.replace('d', ''));
        const dayB = parseInt(b.replace('d', ''));
        return dayA - dayB;
      })
      .map(key => groups[key]);
  }, [slotsWithTeachers]);

  // Get unique time slots across all days
  const timeSlots = React.useMemo(() => {
    const slots: { start: string; end: string }[] = [];
    Object.values(slotsWithTeachers).forEach(({ slot }) => {
      if (!slots.find(t => t.start === slot.start_time && t.end === slot.end_time)) {
        slots.push({ start: slot.start_time, end: slot.end_time });
      }
    });
    return slots.sort((a, b) => a.start.localeCompare(b.start));
  }, [slotsWithTeachers]);

  const handleSlotClick = (slot: SlotData) => {
    toggleAvailableTeachers(
      slot.slot_id,
      `d${slot.day_index}`,
      `${slot.start_time}-${slot.end_time}`,
      'available_teachers_view',
      'batch'
    );
  };

  if (groupedSlots.length === 0) {
    return (
      <EmptyState message="No slots with available teachers data found" />
    );
  }
  const formatDayDate = (date?: string) => {
  if (!date) return null;

  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
};


  return (
    <div style={styles.availableTeachersView}>
      <div style={styles.timetableContainer}>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thTime}>Time</th>
                {groupedSlots.map(dayGroup => (
                  <th key={dayGroup.dayKey} style={styles.thDay}>
                    <div style={styles.dayHeader}>
                      <div style={{ 
                        ...styles.dayDot, 
                        backgroundColor: getWeekdayColor(parseInt(dayGroup.dayKey.replace('d', ''))) 
                      }}></div>
                      <div style={styles.dayHeaderContent}>
                        <span style={styles.dayName}>
  {dayGroup.dayName}
</span>

{dayGroup.date && (
  <span style={styles.dayDate}>
    {formatDayDate(dayGroup.date)}
  </span>
)}

                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, timeIdx) => (
                <tr key={`${time.start}-${time.end}`}>
                  <td style={styles.timeCell}>
                    <div style={styles.timeSlotDisplay}>
                      <span style={styles.timeStart}>{time.start}</span>
                      <span style={styles.timeSeparator}>-</span>
                      <span style={styles.timeEnd}>{time.end}</span>
                    </div>
                  </td>
                  
                  {groupedSlots.map(dayGroup => {
                    const slotData = dayGroup.slots.find(s => 
                      s.slot.start_time === time.start && s.slot.end_time === time.end
                    );
                    
                    if (!slotData) {
                      return <td key={`${dayGroup.dayKey}-${timeIdx}`} style={styles.emptyCell}></td>;
                    }
                    
                    const { slot, teachers, availableTeachers } = slotData;
                    const isLoading = loadingAvailableTeachers[slot.slot_id];
                    const hasTeachersData = teachers.length > 0;
                    
                    return (
                      <td key={`${dayGroup.dayKey}-${timeIdx}`} style={styles.slotCell}>
                        <div
                          style={{
                            ...styles.slotCard,
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                          onClick={() => handleSlotClick(slot)}
                          title="Click to view available teachers"
                        >
                          <div style={styles.slotHeader}>
                            <span style={{ ...styles.slotSubject, color: '#475569' }}>
                              {slot.slot_code}
                            </span>
                          </div>
                          
                          <div style={styles.slotContent}>
                            {slot.batch_name && (
                              <div style={styles.slotBatch}>
                                <span style={styles.slotIcon}>📚</span>
                                {slot.batch_name}
                              </div>
                            )}
                            
                            {slot.room_number && (
                              <div style={styles.slotRoom}>
                                <span style={styles.slotIcon}>🏠</span>
                                {slot.room_number}
                              </div>
                            )}
                            
                            <div style={styles.availableTeachersIndicator}>
                              {isLoading ? (
                                <div style={styles.loadingIndicator}>
                                  <div style={styles.smallSpinner}></div>
                                  <span style={styles.indicatorText}>Loading...</span>
                                </div>
                              ) : hasTeachersData ? (
                                <>
                                  <span style={{
                                    ...styles.indicatorText,
                                    color: availableTeachers.length > 0 ? '#059669' : '#dc2626'
                                  }}>
                                    {availableTeachers.length > 0 ? '✅' : '❌'} {availableTeachers.length} available
                                  </span>
                                  <span style={slot.show_available_teachers ? styles.indicatorOpen : styles.indicatorClosed}>
                                    {slot.show_available_teachers ? '▲' : '▼'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span style={styles.indicatorText}>
                                    Click to load
                                  </span>
                                  <span style={styles.indicatorClosed}>
                                    ▼
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {slot.show_available_teachers && hasTeachersData && (
                            <div style={styles.availableTeachersPanel}>
                              <div style={styles.availableTeachersHeader}>
                                <span style={styles.availableTeachersTitle}>
                                  Available Teachers for {slot.slot_code}
                                </span>
                              </div>
                              
                              {isLoading ? (
                                <div style={styles.loadingTeachers}>
                                  <div style={styles.smallSpinner}></div>
                                  <span>Loading teachers...</span>
                                </div>
                              ) : (
                                <div style={styles.teachersList}>
                                  {teachers.length > 0 ? (
                                    teachers.map(teacher => (
                                      <div key={teacher.teacher_id} style={styles.teacherItem}>
                                        <div style={styles.teacherInfo}>
                                          <span style={styles.teacherName}>{teacher.teacher_name}</span>
                                          <span style={styles.teacherCode}>({teacher.teacher_code})</span>
                                        </div>
                                        
                                        <div style={styles.teacherStatus}>
                                          <span style={
                                            teacher.is_available ? styles.statusAvailable : styles.statusUnavailable
                                          }>
                                            {teacher.is_available ? 'Available' : 'Unavailable'}
                                          </span>
                                        </div>
                                        
                                        {teacher.subject_specializations && teacher.subject_specializations.length > 0 && (
                                          <div style={styles.teacherSubjects}>
                                            <span style={styles.subjectsLabel}>Subjects: </span>
                                            {teacher.subject_specializations.join(', ')}
                                          </div>
                                        )}
                                        
                                        {teacher.current_assignment && (
                                          <div style={styles.currentAssignment}>
                                            Currently: {teacher.current_assignment}
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div style={styles.noTeachersMessage}>
                                      No teachers data available for this slot
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */
const styles: Record<string, React.CSSProperties> = {

    /* ================= HORIZONTAL TIME SLOTS STYLES ================= */
  matrixDayCell: {
    flex: 1,
    minWidth: 110,
    padding: "8px",
    borderRight: "1px solid #e2e8f0",
    backgroundColor: "#fff",
    overflowX: "auto",
  },
  timeSlotsRow: {
    display: "flex",
    gap: "4px",
    height: "100%",
    alignItems: "stretch",
  },
  slotBoxHorizontal: {
    minWidth: "80px",
    width: "80px",
    borderRadius: 6,
    border: "2px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "all 0.2s",
    padding: "6px 4px",
    boxSizing: "border-box",
    overflow: "hidden",
    flexShrink: 0,
  },
  slotContentHorizontal: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    width: "100%",
    textAlign: "center",
    overflow: "hidden",
  },
  slotSubjectHorizontal: {
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.1,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "normal",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    maxHeight: "2.2em",
  },
  slotTimeHorizontal: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: 600,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: "1px 3px",
    borderRadius: 3,
    lineHeight: 1,
    marginTop: 1,
  },
  slotBatchMiniHorizontal: {
    fontSize: 9,
    color: "#475569",
    fontWeight: 600,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: "1px 3px",
    borderRadius: 3,
    lineHeight: 1,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: 1,
  },
  slotTeacherMiniHorizontal: {
    fontSize: 9,
    color: "#475569",
    fontWeight: 600,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: "1px 3px",
    borderRadius: 3,
    lineHeight: 1,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: 1,
  },
  emptyTimeSlotHorizontal: {
    minWidth: "80px",
    width: "80px",
    borderRadius: 6,
    backgroundColor: "#f8fafc",
    border: "2px dashed #e2e8f0",
    flexShrink: 0,
  },
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
  miniSpinner: {
    width: 10,
    height: 10,
    border: "1px solid #e2e8f0",
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
  dropdownTrigger: {
    padding: "8px 16px",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 13,
    backgroundColor: "#f8fafc",
    color: "#475569",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  dropdownTriggerText: {
    display: "flex",
    alignItems: "center",
    fontSize: 13,
  },
  selectorDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    minWidth: 280,
    maxWidth: 320,
    maxHeight: 400,
    overflow: "hidden",
    zIndex: 1000,
    marginTop: 4,
  },
  selectorHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
  },
  selectorClearBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 8px",
    borderRadius: 4,
  },
  selectorInfo: {
    padding: "8px 16px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  selectorCount: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: 500,
  },
  selectorItems: {
    maxHeight: 280,
    overflowY: "auto",
  },
  selectorItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px 16px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    borderBottom: "1px solid #f1f5f9",
  },
  selectorCheckbox: {
    width: 20,
    height: 20,
    marginRight: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  selectorCheckboxChecked: {
    width: 16,
    height: 16,
    backgroundColor: "#3b82f6",
    borderRadius: 4,
    color: "#fff",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  selectorCheckboxUnchecked: {
    width: 16,
    height: 16,
    border: "2px solid #cbd5e1",
    borderRadius: 4,
  },
  selectorItemLabel: {
    fontSize: 13,
    color: "#334155",
    flex: 1,
  },
  selectorItemColor: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    marginLeft: 8,
  },
  selectorFooter: {
    padding: "12px 16px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
    backgroundColor: "#f8fafc",
  },
  selectorDoneBtn: {
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "6px 16px",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
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
  
  /* ================= MATRIX TIMETABLE STYLES ================= */
  matrixWrapper: {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  matrixContainer: {
    width: "100%",
    overflowX: "auto",
  },
  matrixHeader: {
    display: "flex",
    borderBottom: "2px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 10,
    backgroundColor: "#f8fafc",
  },
  matrixCornerCell: {
    minWidth: 180,
    width: 180,
    padding: "16px",
    fontWeight: 700,
    fontSize: 14,
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "1px solid #e2e8f0",
    backgroundColor: "#f1f5f9",
    position: "sticky",
    left: 0,
    zIndex: 11,
  },
  matrixDayHeader: {
    flex: 1,
    minWidth: 110,
    padding: "12px",
    color: "white",
    fontWeight: 700,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRight: "1px solid rgba(255,255,255,0.2)",
  },
  dayHeaderContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 700,
  },
  dayDate: {
    fontSize: 11,
    opacity: 0.9,
  },
  matrixRow: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
    transition: "background-color 0.2s",
  },
  matrixRowLabel: {
    minWidth: 180,
    width: 180,
    padding: "12px 16px",
    borderRight: "1px solid #e2e8f0",
    borderLeft: "4px solid",
    display: "flex",
    alignItems: "center",
    position: "sticky",
    left: 0,
    zIndex: 8,
  },
  rowLabelContent: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  rowName: {
    fontSize: 14,
    fontWeight: 700,
  },
  rowCode: {
    fontSize: 12,
    opacity: 0.8,
  },
  slotBox: {
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: 8,
    border: "2px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    transition: "all 0.2s",
    padding: "8px",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  slotContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: "100%",
    textAlign: "center",
    overflow: "hidden",
  },
  slotSubject: {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.2,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "normal",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    maxHeight: "2.4em",
  },
  slotTime: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: 600,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: "2px 4px",
    borderRadius: 4,
    lineHeight: 1,
    marginTop: 2,
  },
  slotBatchMini: {
    fontSize: 10,
    color: "#475569",
    fontWeight: 600,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: "2px 4px",
    borderRadius: 4,
    lineHeight: 1,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: 2,
  },
  slotTeacherMini: {
    fontSize: 10,
    color: "#475569",
    fontWeight: 600,
    backgroundColor: "rgba(255,255,255,0.7)",
    padding: "2px 4px",
    borderRadius: 4,
    lineHeight: 1,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: 2,
  },
  slotLoading: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  emptySlot: {
    minHeight: 80,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    border: "2px dashed #e2e8f0",
  },
  
  /* ================= AVAILABLE TEACHERS VIEW STYLES ================= */
  availableTeachersView: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  timetableContainer: {
    padding: '16px',
    overflowX: 'auto',
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
    minHeight: 60,
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
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1px dashed rgba(0,0,0,0.1)",
    fontSize: 10,
    color: "#64748b",
  },
  loadingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  indicatorText: {
    fontSize: 9,
    fontWeight: 600,
  },
  indicatorOpen: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  indicatorClosed: {
    fontSize: 8,
    fontWeight: 'bold',
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
    maxHeight: 300,
    overflowY: "auto",
  },
  teacherItem: {
    padding: "12px",
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
  activationToggleContainer: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 16px",
    background: "#fff",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
  },
  activationLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#475569",
    minWidth: 60,
  },
  toggleSwitch: {
    position: "relative" as const,
    width: 44,
    height: 24,
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    padding: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    backgroundColor: "#fff",
    borderRadius: "50%",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "transform 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleSpinner: {
    width: 12,
    height: 12,
    border: "2px solid #e2e8f0",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
};

// Add CSS animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(
  `@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }`,
  styleSheet.cssRules.length
);

styleSheet.insertRule(
  `@keyframes slideDown {
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
  }`,
  styleSheet.cssRules.length
);

export default GeneratedTimetable;