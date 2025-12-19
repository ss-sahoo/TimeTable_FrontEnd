import React, { useEffect, useState } from "react";

/* ================= TYPES ================= */
interface Teacher {
  id: string;
  name: string;
  code: string;
  subject: string;
  department: string;
  minLecturesPerDay: number;
  maxLecturesPerDay: number;
  minLecturesPerWeek: number;
  maxLecturesPerWeek: number;
}

interface Program {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  program: Program;
  student_count: number;
  teacher_count: number;
  created_at: string;
  color?: string; // Added for UI styling
  year?: string; // Added for UI compatibility
  students?: string; // Added for UI compatibility
}

/* ================= MOCK TEACHERS DATA ================= */
const TEACHERS_DATA: Teacher[] = [
  { id: "T001", name: "Dr. Sharma", code: "CSE101", subject: "Mathematics", department: "CSE", 
    minLecturesPerDay: 1, maxLecturesPerDay: 3, minLecturesPerWeek: 4, maxLecturesPerWeek: 8 },
  { id: "T002", name: "Prof. Kumar", code: "CSE102", subject: "Data Structures", department: "CSE", 
    minLecturesPerDay: 1, maxLecturesPerDay: 2, minLecturesPerWeek: 3, maxLecturesPerWeek: 6 },
  { id: "T003", name: "Dr. Singh", code: "CSE103", subject: "Algorithms", department: "CSE", 
    minLecturesPerDay: 1, maxLecturesPerDay: 2, minLecturesPerWeek: 2, maxLecturesPerWeek: 5 },
  { id: "T004", name: "Prof. Gupta", code: "ECE101", subject: "Digital Electronics", department: "ECE", 
    minLecturesPerDay: 1, maxLecturesPerDay: 2, minLecturesPerWeek: 3, maxLecturesPerWeek: 7 },
  { id: "T005", name: "Dr. Reddy", code: "ECE102", subject: "Signals & Systems", department: "ECE", 
    minLecturesPerDay: 2, maxLecturesPerDay: 4, minLecturesPerWeek: 4, maxLecturesPerWeek: 8 },
  { id: "T006", name: "Prof. Joshi", code: "CSE104", subject: "Database Management", department: "CSE", 
    minLecturesPerDay: 1, maxLecturesPerDay: 2, minLecturesPerWeek: 2, maxLecturesPerWeek: 6 },
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
const BatchSchedule: React.FC = () => {
  // State for center ID (you might want to get this from context or props)
  const [centerId, setCenterId] = useState<string>("bb67db93-5d47-4639-aa05-7ddb80d106a1");
  const [centerName, setCenterName] = useState<string>("Center Test");
  
  // State for batches from API
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatch, setActiveBatch] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add Batch State
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchYear, setNewBatchYear] = useState("2nd Year");
  const [newBatchStudents, setNewBatchStudents] = useState("");

  // Teacher assignments state
  const [teacherAssignments, setTeacherAssignments] = useState<{batchId: string, teachers: Teacher[]}[]>([]);

  // New states for save functionality and help section
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showHelp, setShowHelp] = useState(true);

  // ===================== API FUNCTIONS =====================
  
  // Function to fetch batches from API
  const fetchBatchesFromAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const accessToken = localStorage.getItem("access_token");
      
      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }
      
      const response = await fetch(
        `https://exams.dashoapp.com/api/timetable/centers/${centerId}/batches/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch batches: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Batches API response:", data);
      
      // Transform API data to match our UI format
      const formattedBatches: Batch[] = data.results.map((batch: any, index: number) => ({
        id: batch.id,
        code: batch.code,
        name: batch.name,
        start_date: batch.start_date,
        end_date: batch.end_date,
        program: batch.program,
        student_count: batch.student_count,
        teacher_count: batch.teacher_count,
        created_at: batch.created_at,
        color: BATCH_COLORS[index % BATCH_COLORS.length],
        year: extractYearFromBatchName(batch.name) || `${new Date(batch.start_date).getFullYear()} Year`,
        students: batch.student_count.toString()
      }));
      
      setBatches(formattedBatches);
      setCenterName(data.center_name || "Center Test");
      
      // Set first batch as active if available
      if (formattedBatches.length > 0 && !activeBatch) {
        setActiveBatch(formattedBatches[0].id);
      }
      
    } catch (error: any) {
      console.error("Error fetching batches:", error);
      setError(error.message || "Failed to load batches");
      
      // Fallback to mock data if API fails
      setBatches([
        { 
          id: "12a1eb2d-58e0-4696-adeb-bdaf57c3d399", 
          code: "HDTN-1A-ZA1", 
          name: "Super 30 - Batch A (2025)", 
          start_date: "2025-01-01", 
          end_date: "2025-03-31", 
          program: { id: "2858f78d-74e6-42d2-a443-1ac1f10e3a29", name: "JEE Main 2025" }, 
          student_count: 0, 
          teacher_count: 0, 
          created_at: "2025-12-18T11:58:42.245735+00:00",
          color: BATCH_COLORS[0],
          year: "2025 Year",
          students: "0"
        }
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract year from batch name
  const extractYearFromBatchName = (batchName: string): string => {
    const yearMatch = batchName.match(/\((\d{4})\)/);
    if (yearMatch && yearMatch[1]) {
      return `${yearMatch[1]} Year`;
    }
    return "";
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  /* Load saved data from localStorage */
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedAssignments = localStorage.getItem("batchTeacherAssignments");
        if (savedAssignments) {
          setTeacherAssignments(JSON.parse(savedAssignments));
        }
      } catch (error) {
        console.error("Failed to load saved data:", error);
      }
    };

    loadSavedData();
  }, []);

  /* Fetch batches on component mount */
  useEffect(() => {
    fetchBatchesFromAPI();
  }, [centerId]);

  /* Save data to localStorage */
  useEffect(() => {
    localStorage.setItem("batchTeacherAssignments", JSON.stringify(teacherAssignments));
  }, [teacherAssignments]);

  const getBatchAssignments = (batchId: string) => {
    return teacherAssignments.find(a => a.batchId === batchId)?.teachers || [];
  };

  const updateBatchAssignments = (batchId: string, teachers: Teacher[]) => {
    setTeacherAssignments(prev => {
      const existing = prev.find(a => a.batchId === batchId);
      if (existing) {
        return prev.map(a => a.batchId === batchId ? { ...a, teachers } : a);
      } else {
        return [...prev, { batchId, teachers }];
      }
    });
  };

  const assignTeacher = (teacher: Teacher) => {
    const currentTeachers = getBatchAssignments(activeBatch);
    // Check if teacher already exists in this batch
    if (currentTeachers.some(t => t.id === teacher.id)) {
      alert("This teacher is already assigned to this batch!");
      return;
    }
    
    const updatedTeachers = [...currentTeachers, { ...teacher }];
    updateBatchAssignments(activeBatch, updatedTeachers);
    setOpenDropdown(null);
  };

  const removeTeacher = (teacherId: string) => {
    const currentTeachers = getBatchAssignments(activeBatch);
    const updatedTeachers = currentTeachers.filter(t => t.id !== teacherId);
    updateBatchAssignments(activeBatch, updatedTeachers);
  };

  const updateTeacherLimits = (teacherId: string, field: keyof Teacher, value: number) => {
    const currentTeachers = getBatchAssignments(activeBatch);
    const updatedTeachers = currentTeachers.map(teacher => 
      teacher.id === teacherId 
        ? { ...teacher, [field]: value }
        : teacher
    );
    updateBatchAssignments(activeBatch, updatedTeachers);
  };

  // Note: Since batches are fetched from API, we'll disable adding new batches
  // unless you have a POST endpoint for creating batches
  const addNewBatch = () => {
    if (!newBatchName.trim()) return;
    
    // This is a mock function since we don't have a POST endpoint
    alert("Batch creation would require a POST API endpoint. Currently, batches are fetched from the backend.");
    
    // If you had a POST endpoint, you would call it here
    // Example:
    // const newBatch = await createBatchAPI(newBatchName, newBatchYear, newBatchStudents);
    // setBatches([...batches, newBatch]);
    
    setNewBatchName("");
    setNewBatchYear("2nd Year");
    setNewBatchStudents("");
    setShowAddBatch(false);
  };

  // Note: Batch deletion would also require a DELETE API endpoint
  const deleteBatch = (batchId: string) => {
    if (batches.length <= 1) {
      alert("You must have at least one batch");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this batch? This would require a DELETE API call to the backend.")) {
      // This is a mock function since we don't have a DELETE endpoint
      alert("Batch deletion would require a DELETE API endpoint. Currently, batches are managed by the backend.");
      
      // If you had a DELETE endpoint, you would call it here
      // Example:
      // await deleteBatchAPI(batchId);
      // Then refresh the batches list
      // fetchBatchesFromAPI();
    }
  };

  const getActiveBatch = () => {
    return batches.find(b => b.id === activeBatch);
  };

  const getBatchStats = (batchId: string) => {
    const teachers = getBatchAssignments(batchId);
    const totalMinPerDay = teachers.reduce((sum, t) => sum + t.minLecturesPerDay, 0);
    const totalMaxPerDay = teachers.reduce((sum, t) => sum + t.maxLecturesPerDay, 0);
    const totalMinPerWeek = teachers.reduce((sum, t) => sum + t.minLecturesPerWeek, 0);
    const totalMaxPerWeek = teachers.reduce((sum, t) => sum + t.maxLecturesPerWeek, 0);
    
    return {
      teachers: teachers.length,
      totalMinPerDay,
      totalMaxPerDay,
      totalMinPerWeek,
      totalMaxPerWeek
    };
  };

  const saveAssignments = () => {
    setSaveStatus("saving");
    
    setTimeout(() => {
      try {
        // Already saving to localStorage via useEffect, just show success
        setSaveStatus("saved");
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
        
      } catch (error) {
        console.error("Failed to save assignments:", error);
        setSaveStatus("error");
        
        // Reset error after 3 seconds
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);
      }
    }, 500);
  };

  const handleSaveAndNext = () => {
    saveAssignments();
    // You can add navigation to next page here
    alert("Saved! Next page would open here.");
  };

  const refreshBatches = () => {
    fetchBatchesFromAPI();
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <h3 style={styles.title}>Loading Batches...</h3>
          <p>Fetching batch data from the server</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && batches.length === 0) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.errorState}>
          <h3 style={styles.title}>Error Loading Batches</h3>
          <p>{error}</p>
          <button 
            style={styles.retryButton}
            onClick={refreshBatches}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeBatchObj = getActiveBatch();
  
  if (!activeBatchObj && batches.length > 0) {
    setActiveBatch(batches[0].id);
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Setting up batch...</p>
        </div>
      </div>
    );
  }

  if (!activeBatchObj) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.errorState}>
          <h3 style={styles.title}>No Batches Available</h3>
          <p>No batches found for this center.</p>
          <button 
            style={styles.retryButton}
            onClick={refreshBatches}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const activeBatchTeachers = getBatchAssignments(activeBatch);
  const stats = getBatchStats(activeBatch);

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Batch Teachers Assignment</h3>
          <p style={styles.subtitle}>
            Assign teachers and set lecture limits for batches in <strong>{centerName}</strong>
          </p>
        </div>
        
        {/* Action Buttons */}
        <div style={styles.headerActions}>
          {/* Refresh Button */}
          <button 
            style={styles.refreshButton}
            onClick={refreshBatches}
            title="Refresh batches"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" 
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Refresh
          </button>
          
          <div style={styles.actionButtons}>
            <button
              style={styles.saveButton}
              onClick={saveAssignments}
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
      {showHelp && (
        <div style={styles.helpSection}>
          <div style={styles.helpHeader}>
            <p style={styles.helpTitle}>💡 How to use:</p>
            <button
              style={styles.closeHelpBtn}
              onClick={() => setShowHelp(false)}
              title="Close help"
            >
              ×
            </button>
          </div>
          <ul style={styles.helpList}>
            <li>Batches are fetched from the backend API for <strong>{centerName}</strong></li>
            <li>Click "Add Teacher" to select teachers from the dropdown</li>
            <li>Set daily and weekly lecture limits for each teacher</li>
            <li>Click the × button to remove a teacher from the batch</li>
            <li>Use "Save Changes" to save assignments locally</li>
            <li>Each batch maintains its own list of teachers</li>
            <li>Click "Refresh" to reload batches from the server</li>
          </ul>
        </div>
      )}

      {/* Center Info Bar */}
      <div style={styles.centerInfoBar}>
        <div style={styles.centerInfo}>
          <strong>Center:</strong> {centerName}
          <span style={styles.infoSeparator}>•</span>
          <strong>Batches:</strong> {batches.length}
          <span style={styles.infoSeparator}>•</span>
          <strong>Center ID:</strong> <code style={styles.codeText}>{centerId}</code>
        </div>
        <button
          style={styles.smallButton}
          onClick={() => {
            // You can add functionality to change center ID here
            const newCenterId = prompt("Enter Center ID:", centerId);
            if (newCenterId && newCenterId !== centerId) {
              setCenterId(newCenterId);
            }
          }}
          title="Change Center ID"
        >
          Change Center
        </button>
      </div>

      {/* Batch Tabs */}
      <div style={styles.tabContainer}>
        {batches.map((batch) => {
          const batchStats = getBatchStats(batch.id);
          const isActive = activeBatch === batch.id;
          
          return (
            <div key={batch.id} style={styles.batchTabWrapper}>
              <button
                onClick={() => setActiveBatch(batch.id)}
                style={{
                  ...styles.batchTab,
                  ...(isActive ? styles.activeBatchTab : {}),
                  borderLeftColor: batch.color || BATCH_COLORS[0]
                }}
              >
                <div style={styles.tabContent}>
                  <div style={styles.tabLeft}>
                    <div style={{...styles.batchDot, backgroundColor: batch.color || BATCH_COLORS[0]}}></div>
                    <div style={styles.batchInfoCompact}>
                      <span style={styles.batchTabName}>{batch.name}</span>
                      <div style={styles.batchMeta}>
                        <span style={styles.batchCode}>{batch.code}</span>
                        <span style={styles.separator}>•</span>
                        <span style={styles.batchProgram}>{batch.program.name}</span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.tabStats}>
                    <span style={styles.statBadge}>{batchStats.teachers} teachers</span>
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
            <div style={{...styles.batchColorDot, backgroundColor: activeBatchObj.color || BATCH_COLORS[0]}}></div>
            <div>
              <h4 style={styles.activeBatchTitle}>{activeBatchObj.name}</h4>
              <div style={styles.batchDetails}>
                <span><strong>Code:</strong> {activeBatchObj.code}</span>
                <span>•</span>
                <span><strong>Program:</strong> {activeBatchObj.program.name}</span>
                <span>•</span>
                <span><strong>Dates:</strong> {formatDate(activeBatchObj.start_date)} to {formatDate(activeBatchObj.end_date)}</span>
                <span>•</span>
                <span><strong>Students:</strong> {activeBatchObj.student_count}</span>
                <span>•</span>
                <span><strong>Teachers:</strong> {activeBatchTeachers.length}</span>
              </div>
            </div>
          </div>
          <div style={styles.batchStats}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Teachers:</span>
              <span style={styles.statValue}>{stats.teachers}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Min/Day:</span>
              <span style={styles.statValue}>{stats.totalMinPerDay}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Min/Week:</span>
              <span style={styles.statValue}>{stats.totalMinPerWeek}</span>
            </div>
          </div>
        </div>

        {/* Teachers Grid */}
        <div style={styles.gridContainer}>
          {/* Table Header */}
          <div style={styles.tableHeader}>
            <div style={styles.teacherHeaderColumn}>Teachers</div>
            <div style={styles.subjectHeaderColumn}>Subject Details</div>
            <div style={styles.limitsHeaderColumn}>Daily Limits</div>
            <div style={styles.limitsHeaderColumn}>Weekly Limits</div>
          </div>

          {/* Add Teacher Button Row */}
          <div style={styles.addTeacherRow}>
            <div style={styles.addTeacherCell}>
              <button 
                style={styles.addTeacherBtn}
                onClick={() => setOpenDropdown(openDropdown === "add-teacher" ? null : "add-teacher")}
              >
                + Add Teacher
              </button>
              
              {/* Teachers Dropdown */}
              {openDropdown === "add-teacher" && (
                <div style={styles.teachersDropdown}>
                  <div style={styles.dropdownHeader}>
                    <span>Select Teacher</span>
                    <button
                      style={styles.closeDropdown}
                      onClick={() => setOpenDropdown(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div style={styles.teachersList}>
                    {TEACHERS_DATA.map((teacher) => (
                      <div
                        key={teacher.id}
                        style={styles.teacherItem}
                        onClick={() => assignTeacher(teacher)}
                      >
                        <div style={styles.teacherMainInfo}>
                          <strong>{teacher.subject}</strong>
                          <div style={styles.teacherCode}>
                            {teacher.code}
                          </div>
                        </div>
                        <div style={styles.teacherDetails}>
                          {teacher.name} • {teacher.department}
                        </div>
                        <div style={styles.teacherLimits}>
                          Day: {teacher.minLecturesPerDay}-{teacher.maxLecturesPerDay} • 
                          Week: {teacher.minLecturesPerWeek}-{teacher.maxLecturesPerWeek}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={styles.subjectColumn}>
              <div style={styles.addTeacherPrompt}>
                Select a teacher to see subject details
              </div>
            </div>
            <div style={styles.limitsColumn}>
              <div style={styles.addTeacherPrompt}>
                -
              </div>
            </div>
            <div style={styles.limitsColumn}>
              <div style={styles.addTeacherPrompt}>
                -
              </div>
            </div>
          </div>

          {/* Teacher Rows */}
          {activeBatchTeachers.length === 0 ? (
            <div style={styles.noTeachersMessage}>
              <p>No teachers assigned yet. Click "Add Teacher" to get started.</p>
            </div>
          ) : (
            activeBatchTeachers.map((teacher) => (
              <div key={teacher.id} style={styles.teacherRow}>
                {/* Teacher Column */}
                <div style={styles.teacherColumn}>
                  <div style={styles.teacherCell}>
                    <div style={styles.teacherInfoCompact}>
                      <div style={styles.teacherAvatar}>
                        {teacher.name.charAt(0)}
                      </div>
                      <div>
                        <div style={styles.teacherName}>{teacher.name}</div>
                        <div style={styles.teacherDept}>{teacher.department}</div>
                      </div>
                    </div>
                    <button
                      style={styles.removeButton}
                      onClick={() => removeTeacher(teacher.id)}
                      title="Remove teacher"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Subject Details Column */}
                <div style={styles.subjectColumn}>
                  <div style={styles.subjectCell}>
                    <div style={styles.subjectRow}>
                      <div style={styles.subjectLabel}>Subject:</div>
                      <div style={styles.subjectValue}>{teacher.subject}</div>
                    </div>
                    <div style={styles.subjectRow}>
                      <div style={styles.subjectLabel}>Code:</div>
                      <div style={styles.codeValue}>{teacher.code}</div>
                    </div>
                  </div>
                </div>

                {/* Daily Limits Column */}
                <div style={styles.limitsColumn}>
                  <div style={styles.limitsCell}>
                    <div style={styles.limitsContainer}>
                      <div style={styles.limitTypeLabel}>Per Day</div>
                      <div style={styles.limitsInputGroup}>
                        <div style={styles.limitInput}>
                          <div style={styles.limitHeader}>
                            <div style={styles.limitLabel}>Min</div>
                          </div>
                          <input
                            type="number"
                            value={teacher.minLecturesPerDay}
                            onChange={(e) => updateTeacherLimits(teacher.id, 'minLecturesPerDay', parseInt(e.target.value) || 0)}
                            min="0"
                            max="8"
                            style={styles.numberInput}
                          />
                        </div>
                        <div style={styles.limitDivider}>/</div>
                        <div style={styles.limitInput}>
                          <div style={styles.limitHeader}>
                            <div style={styles.limitLabel}>Max</div>
                          </div>
                          <input
                            type="number"
                            value={teacher.maxLecturesPerDay}
                            onChange={(e) => updateTeacherLimits(teacher.id, 'maxLecturesPerDay', parseInt(e.target.value) || 0)}
                            min="0"
                            max="8"
                            style={styles.numberInput}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Limits Column */}
                <div style={styles.limitsColumn}>
                  <div style={styles.limitsCell}>
                    <div style={styles.limitsContainer}>
                      <div style={styles.limitTypeLabel}>Per Week</div>
                      <div style={styles.limitsInputGroup}>
                        <div style={styles.limitInput}>
                          <div style={styles.limitHeader}>
                            <div style={styles.limitLabel}>Min</div>
                          </div>
                          <input
                            type="number"
                            value={teacher.minLecturesPerWeek}
                            onChange={(e) => updateTeacherLimits(teacher.id, 'minLecturesPerWeek', parseInt(e.target.value) || 0)}
                            min="0"
                            max="40"
                            style={styles.numberInput}
                          />
                        </div>
                        <div style={styles.limitDivider}>/</div>
                        <div style={styles.limitInput}>
                          <div style={styles.limitHeader}>
                            <div style={styles.limitLabel}>Max</div>
                          </div>
                          <input
                            type="number"
                            value={teacher.maxLecturesPerWeek}
                            onChange={(e) => updateTeacherLimits(teacher.id, 'maxLecturesPerWeek', parseInt(e.target.value) || 0)}
                            min="0"
                            max="40"
                            style={styles.numberInput}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Section */}
        <div style={styles.summarySection}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Teachers:</span>
            <span style={styles.summaryValue}>{activeBatchTeachers.length}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Min/Day:</span>
            <span style={styles.summaryValue}>
              {activeBatchTeachers.reduce((sum, t) => sum + t.minLecturesPerDay, 0)}
            </span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Max/Day:</span>
            <span style={styles.summaryValue}>
              {activeBatchTeachers.reduce((sum, t) => sum + t.maxLecturesPerDay, 0)}
            </span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Min/Week:</span>
            <span style={styles.summaryValue}>
              {activeBatchTeachers.reduce((sum, t) => sum + t.minLecturesPerWeek, 0)}
            </span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Max/Week:</span>
            <span style={styles.summaryValue}>
              {activeBatchTeachers.reduce((sum, t) => sum + t.maxLecturesPerWeek, 0)}
            </span>
          </div>
        </div>
      </div>
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  retryButton: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
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
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  refreshButton: {
    padding: "10px 20px",
    background: "#f1f5f9",
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
  smallButton: {
    padding: "6px 12px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
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
  spinningIcon: {
    animation: "spin 1s linear infinite",
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
  helpSection: {
    marginBottom: "24px",
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
  },
  helpHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  helpTitle: {
    fontWeight: "600",
    color: "#0369a1",
    margin: "0",
  },
  closeHelpBtn: {
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
    color: "#6b7280",
    transition: "all 0.2s",
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
  batchInfoCompact: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  batchTabName: {
    fontSize: "14px",
    fontWeight: "500",
  },
  batchMeta: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.8)",
  },
  batchCode: {
    background: "rgba(255,255,255,0.2)",
    padding: "1px 4px",
    borderRadius: "2px",
    fontSize: "10px",
  },
  separator: {
    fontSize: "10px",
  },
  batchProgram: {
    fontSize: "10px",
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
    overflow: "hidden",
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
    fontSize: "13px",
    color: "#64748b",
    flexWrap: "wrap",
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
  gridContainer: {
    background: "#ffffff",
  },
  tableHeader: {
    display: "flex",
    background: "#f1f5f9",
    borderBottom: "2px solid #e2e8f0",
  },
  teacherHeaderColumn: {
    width: "250px",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
  },
  subjectHeaderColumn: {
    width: "200px",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
    borderLeft: "1px solid #e2e8f0",
  },
  limitsHeaderColumn: {
    width: "250px",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
    borderLeft: "1px solid #e2e8f0",
  },
  addTeacherRow: {
    display: "flex",
    borderBottom: "1px solid #f1f5f9",
  },
  addTeacherCell: {
    width: "250px",
    padding: "16px",
    background: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
    position: "relative",
  },
  addTeacherBtn: {
    padding: "12px 16px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    width: "100%",
  },
  addTeacherPrompt: {
    fontSize: "14px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  subjectColumn: {
    width: "200px",
    padding: "16px",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
  },
  limitsColumn: {
    width: "250px",
    padding: "16px",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  noTeachersMessage: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },
  teacherRow: {
    display: "flex",
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s",
  },
  teacherColumn: {
    width: "250px",
    padding: "16px",
    background: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
  },
  teacherCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  teacherInfoCompact: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  teacherAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#3b82f6",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "16px",
  },
  teacherName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  teacherDept: {
    fontSize: "12px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: "12px",
    display: "inline-block",
  },
  removeButton: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  subjectCell: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  subjectRow: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  subjectLabel: {
    fontSize: "11px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: "500",
  },
  subjectValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },
  codeValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#3b82f6",
    background: "#eff6ff",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
  },
  limitsCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  limitsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    width: "100%",
  },
  limitTypeLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  limitsInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f0f9ff",
    padding: "12px 16px",
    borderRadius: "8px",
    width: "100%",
    justifyContent: "center",
  },
  limitInput: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  limitHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  limitLabel: {
    fontSize: "11px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  numberInput: {
    width: "70px",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    background: "#ffffff",
  },
  limitDivider: {
    fontSize: "20px",
    color: "#94a3b8",
    fontWeight: "300",
    marginTop: "8px",
  },
  teachersDropdown: {
    position: "absolute",
    top: "100%",
    left: "0",
    width: "100%",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    marginTop: "8px",
    zIndex: "1000",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  dropdownHeader: {
    padding: "12px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeDropdown: {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
  },
  teachersList: {
    maxHeight: "300px",
    overflowY: "auto",
  },
  teacherItem: {
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  teacherMainInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  teacherCode: {
    fontSize: "11px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  teacherDetails: {
    fontSize: "12px",
    color: "#475569",
  },
  teacherLimits: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  summarySection: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px",
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    marginTop: "20px",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  summaryLabel: {
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
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

export default BatchSchedule;