import React, { useEffect, useState, useRef } from "react";

/* ================= TYPES ================= */
interface DaySlots {
  day: string;
  slots: Array<{
    id: string;
    time: string;
    day_slot_id?: string; // Add this for backend reference
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
  email?: string;
  phone?: string;
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
  code: string; // Add batch code for API
}

interface DropdownPosition {
  top: number;
  left: number;
}

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
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string>("");
  const [assignments, setAssignments] = useState<AssignedSlot[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [timetableId, setTimetableId] = useState<string>("");
  const [centerId, setCenterId] = useState<string>("bb67db93-5d47-4639-aa05-7ddb80d106a1");
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Function to get access token
  const getAccessToken = () => {
    return localStorage.getItem("access_token");
  };

  // Function to fetch teachers from API
  const fetchTeachersFromAPI = async () => {
    setLoadingTeachers(true);
    try {
      const accessToken = getAccessToken();
      
      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }
      
      const response = await fetch(
        `https://exams.dashoapp.com/api/timetable/centers/${centerId}/users/?role=teacher`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teachers: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Teachers API response:", data);
      
      // Transform API data to match our UI format
      const formattedTeachers: Teacher[] = data.results.map((teacher: any) => ({
        id: teacher.id,
        name: `${teacher.first_name} ${teacher.last_name}`,
        code: teacher.teacher_code || `TCH-${teacher.id.slice(0, 8)}`,
        subject: teacher.subject || "General",
        department: teacher.department || "General",
        type: 'teacher',
        email: teacher.email,
        phone: teacher.phone
      }));
      
      setTeachers(formattedTeachers);
      
    } catch (error: any) {
      console.error("Error fetching teachers:", error);
      
      // Fallback to mock data if API fails
      setTeachers([
        { 
          id: "T001", 
          name: "Dr. Sharma", 
          code: "TCH-CENT-230", 
          subject: "Mathematics", 
          department: "CSE", 
          type: 'teacher' 
        },
        { 
          id: "T002", 
          name: "Prof. Kumar", 
          code: "TCH-CENT-231", 
          subject: "Data Structures", 
          department: "CSE", 
          type: 'teacher' 
        },
        { 
          id: "T003", 
          name: "Dr. Singh", 
          code: "TCH-CENT-232", 
          subject: "Algorithms", 
          department: "CSE", 
          type: 'teacher' 
        },
      ]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Function to fetch timetables
  const fetchTimetables = async () => {
    try {
      const accessToken = getAccessToken();
      
      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }
      
      const response = await fetch(
        `https://exams.dashoapp.com/api/timetable/centers/${centerId}/timetables/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch timetables: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Timetables API response:", data);
      
      if (data.results && data.results.length > 0) {
        const formattedTimetables = data.results.map((timetable: any) => ({
          id: timetable.id,
          name: timetable.name || `Timetable ${timetable.id.slice(0, 8)}`
        }));
        setTimetables(formattedTimetables);
        setTimetableId(formattedTimetables[0]?.id || "");
      }
      
    } catch (error: any) {
      console.error("Error fetching timetables:", error);
      setTimetables([{ id: "default-timetable", name: "Default Timetable" }]);
      setTimetableId("default-timetable");
    }
  };

  // Function to fetch batches from localStorage (from BatchSchedule)
  const fetchBatchesFromLocalStorage = () => {
    try {
      const savedBatches = localStorage.getItem("batchTeacherAssignments");
      if (savedBatches) {
        const parsed = JSON.parse(savedBatches);
        
        // Extract unique batches from assignments
        const batchIds = new Set<string>();
        const batchMap = new Map<string, Batch>();
        
        parsed.forEach((assignment: any) => {
          if (assignment.batchId && !batchIds.has(assignment.batchId)) {
            batchIds.add(assignment.batchId);
            
            // Create batch object with default values
            const batch: Batch = {
              id: assignment.batchId,
              name: `Batch ${assignment.batchId.slice(0, 8)}`,
              year: "Current Year",
              students: "0",
              color: BATCH_COLORS[batchIds.size % BATCH_COLORS.length],
              code: `BATCH-${assignment.batchId.slice(0, 8)}`
            };
            batchMap.set(assignment.batchId, batch);
          }
        });
        
        const fetchedBatches = Array.from(batchMap.values());
        
        if (fetchedBatches.length > 0) {
          setBatches(fetchedBatches);
          setActiveBatchId(fetchedBatches[0].id);
        } else {
          // Fallback to mock batches if none found
          setBatches([
            { 
              id: "B001", 
              name: "CSE A", 
              year: "2nd Year", 
              students: "60", 
              color: BATCH_COLORS[0],
              code: "BATCH-001" 
            },
            { 
              id: "B002", 
              name: "CSE B", 
              year: "2nd Year", 
              students: "65", 
              color: BATCH_COLORS[1],
              code: "BATCH-002" 
            },
          ]);
          setActiveBatchId("B001");
        }
      } else {
        // Fallback to mock batches if no saved data
        setBatches([
          { 
            id: "B001", 
            name: "CSE A", 
            year: "2nd Year", 
            students: "60", 
            color: BATCH_COLORS[0],
            code: "BATCH-001" 
          },
          { 
            id: "B002", 
            name: "CSE B", 
            year: "2nd Year", 
            students: "65", 
            color: BATCH_COLORS[1],
            code: "BATCH-002" 
          },
        ]);
        setActiveBatchId("B001");
      }
    } catch (error) {
      console.error("Failed to fetch batches:", error);
      // Fallback to mock batches
      setBatches([
        { 
          id: "B001", 
          name: "CSE A", 
          year: "2nd Year", 
          students: "60", 
          color: BATCH_COLORS[0],
          code: "BATCH-001" 
        },
      ]);
      setActiveBatchId("B001");
    }
  };

  // Function to assign slot to backend API
  const assignSlotToBackend = async (daySlotId: string, batchCode: string, teacherCode: string, subject: string) => {
    try {
      const accessToken = getAccessToken();
      
      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }
      
      if (!timetableId) {
        throw new Error("Please select a timetable first");
      }
      
      const payload = {
        timetable_id: timetableId,
        day_slot_id: daySlotId,
        batch_code: batchCode,
        teacher_code: teacherCode,
        subject: subject
      };
      
      console.log("Assigning slot with payload:", payload);
      
      const response = await fetch(
        "https://exams.dashoapp.com/api/timetable/admin/timetables/fixed-slots/assign/",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to assign slot: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("Slot assigned successfully:", data);
      return data;
      
    } catch (error: any) {
      console.error("Error assigning slot:", error);
      throw error;
    }
  };

  // Function to remove slot assignment from backend
  const removeSlotFromBackend = async (daySlotId: string, batchCode: string) => {
    try {
      const accessToken = getAccessToken();
      
      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }
      
      if (!timetableId) {
        throw new Error("Please select a timetable first");
      }
      
      const payload = {
        timetable_id: timetableId,
        day_slot_id: daySlotId,
        batch_code: batchCode
      };
      
      console.log("Removing slot assignment:", payload);
      
      const response = await fetch(
        "https://exams.dashoapp.com/api/timetable/admin/timetables/fixed-slots/remove/",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to remove slot: ${response.status} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      console.log("Slot removed successfully:", data);
      return data;
      
    } catch (error: any) {
      console.error("Error removing slot:", error);
      throw error;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
          if (parsedData.days && parsedData.days.length > 0) {
            const convertedDays: DaySlots[] = parsedData.days.map((day: any) => {
              if (day.slots && day.slots.length > 0 && typeof day.slots[0] === 'object') {
                return {
                  day: day.day,
                  slots: day.slots.map((slot: any) => ({
                    id: slot.id || `${day.day.substring(0, 2).toUpperCase()}1`,
                    time: slot.time || "8:00 AM - 9:00 AM",
                    day_slot_id: slot.day_slot_id || slot.id
                  })),
                  color: day.color || "#3B82F6"
                };
              }
              return {
                day: day.day,
                slots: day.slots.map((slot: string, index: number) => {
                  const match = slot.match(/([A-Z]+\d+):\s*(.+)/);
                  return {
                    id: match ? match[1] : `${day.day.substring(0, 2).toUpperCase()}${index + 1}`,
                    time: match ? match[2] : "8:00 AM - 9:00 AM",
                    day_slot_id: match ? match[1] : `${day.day.substring(0, 2).toUpperCase()}${index + 1}`
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
    window.addEventListener('storage', loadSavedSlots);
    return () => window.removeEventListener('storage', loadSavedSlots);
  }, []);

  /* Load all batch assignments on mount */
  useEffect(() => {
    const loadAllAssignments = () => {
      const allAssignments: AssignedSlot[] = [];
      batches.forEach(batch => {
        const saved = localStorage.getItem(`batchFixedAssignments_${batch.id}`);
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
    
    if (batches.length > 0) {
      loadAllAssignments();
    }
  }, [batches]);

  /* Initialize data on component mount */
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await fetchTeachersFromAPI();
        await fetchTimetables();
        fetchBatchesFromLocalStorage();
      } catch (error) {
        console.error("Failed to initialize data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  /* Save assignments to localStorage */
  const saveAssignments = (batchId: string, newAssignments: AssignedSlot[]) => {
    try {
      const otherAssignments = assignments.filter(a => a.batchId !== batchId);
      setAssignments([...otherAssignments, ...newAssignments]);
      localStorage.setItem(`batchFixedAssignments_${batchId}`, JSON.stringify(newAssignments));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save assignments:", error);
    }
  };

  const assignItem = async (dayIndex: number, slotIndex: number, item: Teacher | PeriodType) => {
    const batchAssignments = assignments.filter(a => a.batchId === activeBatchId);
    const existingIndex = batchAssignments.findIndex(a => 
      a.dayIndex === dayIndex && a.slotIndex === slotIndex
    );

    let newBatchAssignments = [...batchAssignments];
    const activeBatch = getActiveBatch();
    
    if (!activeBatch) {
      alert("No active batch selected");
      return;
    }

    // Get day slot ID
    const daySlot = days[dayIndex]?.slots[slotIndex];
    if (!daySlot) {
      alert("Slot not found");
      return;
    }

    const daySlotId = daySlot.day_slot_id || daySlot.id;

    try {
      if (item.type === 'teacher') {
        // Call backend API for teacher assignment
        await assignSlotToBackend(
          daySlotId,
          activeBatch.code,
          item.code,
          item.subject
        );
        
        if (existingIndex >= 0) {
          newBatchAssignments[existingIndex] = { 
            dayIndex, 
            slotIndex, 
            teacher: item, 
            periodType: undefined,
            batchId: activeBatchId 
          };
        } else {
          newBatchAssignments.push({ 
            dayIndex, 
            slotIndex, 
            teacher: item, 
            periodType: undefined,
            batchId: activeBatchId 
          });
        }
        
        alert(`Teacher ${item.name} assigned successfully!`);
      } else {
        // For period types, just save locally (backend might not support period types)
        if (existingIndex >= 0) {
          newBatchAssignments[existingIndex] = { 
            dayIndex, 
            slotIndex, 
            periodType: item, 
            teacher: undefined,
            batchId: activeBatchId 
          };
        } else {
          newBatchAssignments.push({ 
            dayIndex, 
            slotIndex, 
            periodType: item, 
            teacher: undefined,
            batchId: activeBatchId 
          });
        }
        
        alert(`Period type "${item.name}" assigned successfully!`);
      }

      saveAssignments(activeBatchId, newBatchAssignments);
      setOpenDropdown(null);
      setDropdownPosition(null);
      setHasUnsavedChanges(true);
      
    } catch (error: any) {
      console.error("Failed to assign item:", error);
      alert(`Failed to assign: ${error.message}`);
    }
  };

  const removeAssignment = async (dayIndex: number, slotIndex: number) => {
    const batchAssignments = assignments.filter(a => a.batchId === activeBatchId);
    const assignment = batchAssignments.find(a => 
      a.dayIndex === dayIndex && a.slotIndex === slotIndex
    );
    
    const activeBatch = getActiveBatch();
    const daySlot = days[dayIndex]?.slots[slotIndex];
    
    if (!activeBatch || !daySlot) {
      alert("Cannot remove assignment: Missing data");
      return;
    }

    const daySlotId = daySlot.day_slot_id || daySlot.id;

    try {
      // Only call backend if it was a teacher assignment
      if (assignment?.teacher) {
        await removeSlotFromBackend(daySlotId, activeBatch.code);
      }
      
      const newBatchAssignments = batchAssignments.filter(a => 
        !(a.dayIndex === dayIndex && a.slotIndex === slotIndex)
      );
      
      saveAssignments(activeBatchId, newBatchAssignments);
      setHasUnsavedChanges(true);
      alert("Assignment removed successfully!");
      
    } catch (error: any) {
      console.error("Failed to remove assignment:", error);
      alert(`Failed to remove assignment: ${error.message}`);
    }
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
    // Already saving to backend when assigning/removing
    alert("Changes are saved to backend automatically!");
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
    
    let top = rect.bottom + 8;
    let left = rect.left;
    
    const estimatedDropdownHeight = 400;
    if (top + estimatedDropdownHeight > viewportHeight - 20) {
      top = rect.top - estimatedDropdownHeight - 8;
    }
    
    const dropdownWidth = 600;
    if (left + dropdownWidth > window.innerWidth - 20) {
      left = window.innerWidth - dropdownWidth - 20;
    }
    
    setDropdownPosition({ top, left });
    setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey);
  };

  const refreshTeachers = () => {
    fetchTeachersFromAPI();
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <h3 style={styles.title}>Loading Schedule...</h3>
          <p>Fetching data from the server</p>
        </div>
      </div>
    );
  }

  const activeBatch = getActiveBatch();
  
  if (!activeBatch) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.errorState}>
          <h3 style={styles.title}>No Active Batch</h3>
          <p>Please go to Batch Schedule first and assign teachers to batches.</p>
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
        
        {/* Timetable Selection and Save Buttons */}
        <div style={styles.headerActions}>
          {/* Timetable Selector */}
          <div style={styles.timetableSelector}>
            <label style={styles.timetableLabel}>
              Timetable:
              <select 
                value={timetableId}
                onChange={(e) => setTimetableId(e.target.value)}
                style={styles.timetableSelect}
              >
                {timetables.map(timetable => (
                  <option key={timetable.id} value={timetable.id}>
                    {timetable.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          {/* Refresh Teachers Button */}
          <button 
            style={styles.refreshButton}
            onClick={refreshTeachers}
            disabled={loadingTeachers}
            title="Refresh teachers from API"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" 
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {loadingTeachers ? "Loading..." : "Refresh Teachers"}
          </button>
          
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
            <li>Select a timetable from the dropdown</li>
            <li>Click on any time slot to open assignment dropdown</li>
            <li>Choose from <strong>Teachers</strong> (fetched from API) or <strong>Period Types</strong> sections</li>
            <li>Teacher assignments are saved directly to backend</li>
            <li>Click the × button to remove an assignment</li>
            <li>Use <strong>Refresh Teachers</strong> to update teacher list</li>
            <li>Batches are loaded from Batch Schedule assignments</li>
          </ul>
        </div>
      )}

      {/* Center Info */}
      <div style={styles.centerInfoBar}>
        <div style={styles.centerInfo}>
          <strong>Center ID:</strong> <code style={styles.codeText}>{centerId}</code>
          <span style={styles.infoSeparator}>•</span>
          <strong>Timetable:</strong> {timetables.find(t => t.id === timetableId)?.name || "Not selected"}
          <span style={styles.infoSeparator}>•</span>
          <strong>Batches:</strong> {batches.length}
          <span style={styles.infoSeparator}>•</span>
          <strong>Teachers Available:</strong> {teachers.length}
        </div>
      </div>

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
                <span><strong>Code:</strong> {activeBatch.code}</span>
                <span>•</span>
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
                <h4 style={styles.sectionTitle}>
                  Teachers ({teachers.length})
                  {loadingTeachers && <span style={styles.loadingText}> Loading...</span>}
                </h4>
              </div>
              <div style={styles.itemsList}>
                {teachers.length === 0 ? (
                  <div style={styles.noTeachersMessage}>
                    <p>No teachers found. Click Refresh Teachers button.</p>
                  </div>
                ) : (
                  teachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      style={styles.itemCard}
                      onClick={() => {
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
                  ))
                )}
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
                        Period
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
  loadingState: {
    padding: "40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
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
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  timetableSelector: {
    padding: "8px 12px",
    background: "#f0f9ff",
    borderRadius: "6px",
    border: "1px solid #bae6fd",
  },
  timetableLabel: {
    fontSize: "12px",
    color: "#0369a1",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  timetableSelect: {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid #94a3b8",
    background: "#ffffff",
    fontSize: "12px",
    color: "#1e293b",
    minWidth: "150px",
  },
  refreshButton: {
    padding: "8px 16px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
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
  centerInfoBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
    marginBottom: "16px",
  },
  centerInfo: {
    fontSize: "14px",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  infoSeparator: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  codeText: {
    background: "#dbeafe",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
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
  loadingText: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "normal",
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
  noTeachersMessage: {
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
  },
};

// Add CSS animation for spinner
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default FixedSlots;