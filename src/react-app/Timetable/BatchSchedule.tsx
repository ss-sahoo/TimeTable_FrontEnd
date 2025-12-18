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

interface Batch {
  id: string;
  name: string;
  year: string;
  students: string;
  color: string;
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
  const [batches, setBatches] = useState<Batch[]>([
    { id: "B001", name: "CSE A", year: "2nd Year", students: "60", color: BATCH_COLORS[0] },
    { id: "B002", name: "CSE B", year: "2nd Year", students: "65", color: BATCH_COLORS[1] },
    { id: "B003", name: "ECE A", year: "3rd Year", students: "55", color: BATCH_COLORS[2] },
  ]);
  
  const [activeBatch, setActiveBatch] = useState<string>("B001");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
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

  /* Load saved data from localStorage */
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedBatches = localStorage.getItem("batchScheduleBatches");
        if (savedBatches) {
          const parsed = JSON.parse(savedBatches);
          setBatches(parsed);
        }

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

  /* Save data to localStorage */
  useEffect(() => {
    localStorage.setItem("batchScheduleBatches", JSON.stringify(batches));
    localStorage.setItem("batchTeacherAssignments", JSON.stringify(teacherAssignments));
  }, [batches, teacherAssignments]);

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

  const addNewBatch = () => {
    if (!newBatchName.trim()) return;
    
    const newId = `B${String(batches.length + 1).padStart(3, '0')}`;
    const newBatch: Batch = {
      id: newId,
      name: newBatchName,
      year: newBatchYear,
      students: newBatchStudents || "0",
      color: BATCH_COLORS[batches.length % BATCH_COLORS.length]
    };
    
    setBatches([...batches, newBatch]);
    setActiveBatch(newId);
    setNewBatchName("");
    setNewBatchYear("2nd Year");
    setNewBatchStudents("");
    setShowAddBatch(false);
  };

  const deleteBatch = (batchId: string) => {
    if (batches.length <= 1) {
      alert("You must have at least one batch");
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this batch? All teacher assignments will be lost.")) {
      // Remove from batches array
      const newBatches = batches.filter(b => b.id !== batchId);
      setBatches(newBatches);
      
      // If deleting active batch, switch to another
      if (batchId === activeBatch) {
        setActiveBatch(newBatches[0].id);
      }
      
      // Remove assignments
      setTeacherAssignments(prev => prev.filter(a => a.batchId !== batchId));
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

  const activeBatchObj = getActiveBatch();
  
  if (!activeBatchObj) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.errorState}>
          <h3 style={styles.title}>No Active Batch</h3>
          <p>Please add a batch to continue.</p>
          <button 
            style={styles.addBatchBtn}
            onClick={() => setShowAddBatch(true)}
          >
            + Add New Batch
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
          <p style={styles.subtitle}>Assign teachers and set lecture limits for each batch</p>
        </div>
        
        {/* Action Buttons */}
        <div style={styles.headerActions}>
          {/* Add Batch Button */}
          <button 
            style={styles.addBatchBtn}
            onClick={() => setShowAddBatch(true)}
          >
            + Add New Batch
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
            <li>Click "Add Teacher" to select teachers from the dropdown</li>
            <li>Set daily and weekly lecture limits for each teacher</li>
            <li>Click the × button to remove a teacher from the batch</li>
            <li>Use "Save Changes" to save assignments</li>
            <li>Each batch maintains its own list of teachers</li>
          </ul>
        </div>
      )}

      {/* Add Batch Form */}
      {showAddBatch && (
        <div style={styles.addBatchForm}>
          <h4 style={styles.formTitle}>Add New Batch</h4>
          <div style={styles.formRow}>
            <input
              type="text"
              placeholder="Batch Name (e.g., CSE C)"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              style={styles.formInput}
            />
            <select
              value={newBatchYear}
              onChange={(e) => setNewBatchYear(e.target.value)}
              style={styles.formSelect}
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <input
              type="number"
              placeholder="Number of Students"
              value={newBatchStudents}
              onChange={(e) => setNewBatchStudents(e.target.value)}
              style={styles.formInput}
              min="1"
            />
          </div>
          <div style={styles.formActions}>
            <button 
              style={styles.cancelBtn}
              onClick={() => setShowAddBatch(false)}
            >
              Cancel
            </button>
            <button 
              style={styles.saveBtn}
              onClick={addNewBatch}
              disabled={!newBatchName.trim()}
            >
              Add Batch
            </button>
          </div>
        </div>
      )}

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
                  borderLeftColor: batch.color
                }}
              >
                <div style={styles.tabContent}>
                  <div style={styles.tabLeft}>
                    <div style={{...styles.batchDot, backgroundColor: batch.color}}></div>
                    <span style={styles.batchTabName}>{batch.name}</span>
                  </div>
                  <div style={styles.tabStats}>
                    <span style={styles.statBadge}>{batchStats.teachers} teachers</span>
                  </div>
                </div>
              </button>
              
              {/* Delete Button */}
              {batches.length > 1 && (
                <button
                  style={styles.deleteTabBtn}
                  onClick={() => deleteBatch(batch.id)}
                  title={`Delete ${batch.name}`}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Batch Content */}
      <div style={styles.batchContent}>
        {/* Batch Info Header */}
        <div style={styles.batchInfoHeader}>
          <div style={styles.batchInfo}>
            <div style={{...styles.batchColorDot, backgroundColor: activeBatchObj.color}}></div>
            <div>
              <h4 style={styles.activeBatchTitle}>{activeBatchObj.name}</h4>
              <div style={styles.batchDetails}>
                <span>{activeBatchObj.year}</span>
                <span>•</span>
                <span>{activeBatchObj.students} students</span>
                <span>•</span>
                <span>{activeBatchTeachers.length} teachers</span>
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
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  addBatchBtn: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.2s",
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
  addBatchForm: {
    background: "#f0f9ff",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    border: "1px solid #bae6fd",
  },
  formTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0369a1",
    margin: "0 0 16px 0",
  },
  formRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
  },
  formInput: {
    flex: "1",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
  },
  formSelect: {
    flex: "1",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    background: "#ffffff",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  cancelBtn: {
    padding: "10px 20px",
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  saveBtn: {
    padding: "10px 20px",
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
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
  deleteTabBtn: {
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
    marginLeft: "-8px",
    zIndex: "1",
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

export default BatchSchedule;