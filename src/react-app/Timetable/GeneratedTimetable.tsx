import React, { useState, useEffect } from "react";

/* ================= MOCK DATA ================= */

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_ABBREVIATIONS: Record<string, string> = {
  "Monday": "M",
  "Tuesday": "TU", 
  "Wednesday": "WE",
  "Thursday": "TH",
  "Friday": "FR",
  "Saturday": "SA",
  "Sunday": "SU"
};

const SLOTS_PER_DAY = 6;
const TIME_SLOTS = [
  "09:00-10:00",
  "10:00-11:00", 
  "11:00-12:00",
  "12:00-01:00",
  "02:00-03:00",
  "03:00-04:00"
];

const BATCHES = [
  { id: "CSE-1", name: "CSE-1", department: "CSE", semester: "5th", color: "#3B82F6" },
  { id: "CSE-2", name: "CSE-2", department: "CSE", semester: "5th", color: "#10B981" },
  { id: "ECE-1", name: "ECE-1", department: "ECE", semester: "5th", color: "#8B5CF6" },
  { id: "ECE-2", name: "ECE-2", department: "ECE", semester: "5th", color: "#F59E0B" },
  { id: "EEE-1", name: "EEE-1", department: "EEE", semester: "5th", color: "#EF4444" },
  { id: "ME-1", name: "ME-1", department: "ME", semester: "5th", color: "#EC4899" },
];

const TEACHERS = [
  { id: "T001", name: "Dr. Sharma", subject: "Mathematics", color: "#3B82F6" },
  { id: "T002", name: "Prof. Kumar", subject: "Data Structures", color: "#10B981" },
  { id: "T003", name: "Dr. Singh", subject: "Algorithms", color: "#8B5CF6" },
  { id: "T004", name: "Prof. Gupta", subject: "Digital Electronics", color: "#F59E0B" },
  { id: "T005", name: "Dr. Reddy", subject: "Signals & Systems", color: "#EF4444" },
  { id: "T006", name: "Prof. Joshi", subject: "Database Management", color: "#EC4899" },
];

const SUBJECTS = ["Mathematics", "Data Structures", "Algorithms", "Digital Electronics", "Signals", "Database", "OOP", "Networks", "OS", "CN"];

/* ================= MAIN COMPONENT ================= */

const GeneratedTimetable: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"all-batch" | "all-teacher" | "batch-view" | "teacher-view">("all-batch");
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsGenerating(false), 500);
            return 100;
          }
          return prev + 20;
        });
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  const handleRegenerate = () => {
    setIsGenerating(true);
    setProgress(0);
  };

  if (isGenerating) {
    return (
      <div style={styles.generationWrapper}>
        <div style={styles.generationContainer}>
          <div style={styles.spinner}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={styles.spinningIcon}>
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3 style={styles.generationTitle}>Generating Timetable...</h3>
          <p style={styles.generationText}>
            Optimizing schedule based on constraints
          </p>
          
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div 
                style={{
                  ...styles.progressFill,
                  width: `${progress}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div style={styles.progressText}>{progress}% Complete</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Generated Timetable</h3>
          <p style={styles.subtitle}>Optimal schedule ready for implementation</p>
        </div>
        
        <div style={styles.headerActions}>
          <button style={styles.secondaryButton} onClick={handleRegenerate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 4v6h-6M1 20v-6h6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Regenerate
          </button>
          
          <button style={styles.primaryButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 10l5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={styles.mainTabs}>
        <div style={styles.tabBar}>
          <button
            style={activeTab === "all-batch" ? styles.activeTab : styles.inactiveTab}
            onClick={() => setActiveTab("all-batch")}
          >
            All Batches
          </button>
          <button
            style={activeTab === "all-teacher" ? styles.activeTab : styles.inactiveTab}
            onClick={() => setActiveTab("all-teacher")}
          >
            All Teachers
          </button>
          <button
            style={activeTab === "batch-view" ? styles.activeTab : styles.inactiveTab}
            onClick={() => setActiveTab("batch-view")}
          >
            Batch View
          </button>
          <button
            style={activeTab === "teacher-view" ? styles.activeTab : styles.inactiveTab}
            onClick={() => setActiveTab("teacher-view")}
          >
            Teacher View
          </button>
        </div>
        
        <div style={styles.stats}>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>{BATCHES.length}</div>
            <div style={styles.statLabel}>Batches</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>{TEACHERS.length}</div>
            <div style={styles.statLabel}>Teachers</div>
          </div>
          <div style={styles.statItem}>
            <div style={styles.statNumber}>{DAYS.length * SLOTS_PER_DAY}</div>
            <div style={styles.statLabel}>Total Slots</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={styles.contentArea}>
        {activeTab === "all-batch" && <AllBatchView />}
        {activeTab === "all-teacher" && <AllTeacherView />}
        {activeTab === "batch-view" && <BatchView />}
        {activeTab === "teacher-view" && <TeacherView />}
      </div>
    </div>
  );
};

/* ================= ALL BATCH VIEW - SIDE BY SIDE ================= */

const AllBatchView = () => {
  const half = Math.ceil(BATCHES.length / 2);
  const leftBatches = BATCHES.slice(0, half);
  const rightBatches = BATCHES.slice(half);

  return (
    <div style={styles.sideBySideContainer}>
      <div style={styles.column}>
        {leftBatches.map((batch) => (
          <CompactTimetableCard
            key={batch.id}
            item={batch}
            type="batch"
          />
        ))}
      </div>
      <div style={styles.column}>
        {rightBatches.map((batch) => (
          <CompactTimetableCard
            key={batch.id}
            item={batch}
            type="batch"
          />
        ))}
      </div>
    </div>
  );
};

/* ================= ALL TEACHER VIEW - SIDE BY SIDE ================= */

const AllTeacherView = () => {
  const half = Math.ceil(TEACHERS.length / 2);
  const leftTeachers = TEACHERS.slice(0, half);
  const rightTeachers = TEACHERS.slice(half);

  return (
    <div style={styles.sideBySideContainer}>
      <div style={styles.column}>
        {leftTeachers.map((teacher) => (
          <CompactTimetableCard
            key={teacher.id}
            item={teacher}
            type="teacher"
          />
        ))}
      </div>
      <div style={styles.column}>
        {rightTeachers.map((teacher) => (
          <CompactTimetableCard
            key={teacher.id}
            item={teacher}
            type="teacher"
          />
        ))}
      </div>
    </div>
  );
};

/* ================= COMPACT TIMETABLE CARD ================= */

interface CompactTimetableCardProps {
  item: any;
  type: 'batch' | 'teacher';
}

const CompactTimetableCard: React.FC<CompactTimetableCardProps> = ({ item, type }) => {
  return (
    <div style={styles.compactCard}>
      <div style={styles.cardHeader}>
        <div style={{...styles.colorDot, backgroundColor: item.color}} />
        <div style={styles.cardHeaderInfo}>
          <div style={styles.cardTitle}>{item.name}</div>
          <div style={styles.cardSubtitle}>
            {type === 'batch' ? `${item.department} • ${item.semester} Semester` : item.subject}
          </div>
        </div>
      </div>

      <div style={styles.timetableGrid}>
        {DAYS.map((day, dayIndex) => (
          <div key={day} style={styles.gridDay}>
            <div style={styles.gridDayHeader}>
              <div style={styles.gridDayAbbr}>{DAY_ABBREVIATIONS[day]}</div>
              <div style={styles.gridDayName}>{day.substring(0, 3)}</div>
            </div>
            <div style={styles.gridSlots}>
              {Array.from({ length: SLOTS_PER_DAY }).map((_, slotIndex) => {
                const periodId = `${DAY_ABBREVIATIONS[day]}${slotIndex + 1}`;
                
                let content;
                if (type === 'batch') {
                  const subjectIndex = (parseInt(item.id.split('-')[1]) + dayIndex + slotIndex) % SUBJECTS.length;
                  const teacherIndex = (parseInt(item.id.split('-')[1]) + dayIndex + slotIndex) % TEACHERS.length;
                  content = (
                    <div style={styles.gridSlot}>
                      <div style={styles.gridPeriod}>{periodId}</div>
                      <div style={styles.gridTime}>{TIME_SLOTS[slotIndex]}</div>
                      <div style={styles.gridSubject}>{SUBJECTS[subjectIndex].substring(0, 12)}</div>
                      <div style={styles.gridTeacher}>{TEACHERS[teacherIndex].name.split(' ')[1]}</div>
                    </div>
                  );
                } else {
                  const batchIndex = (parseInt(item.id.slice(3)) + dayIndex + slotIndex) % BATCHES.length;
                  const subjectIndex = (parseInt(item.id.slice(3)) + dayIndex + slotIndex) % SUBJECTS.length;
                  content = (
                    <div style={styles.gridSlot}>
                      <div style={styles.gridPeriod}>{periodId}</div>
                      <div style={styles.gridTime}>{TIME_SLOTS[slotIndex]}</div>
                      <div style={styles.gridSubject}>{SUBJECTS[subjectIndex].substring(0, 12)}</div>
                      <div style={styles.gridBatch}>{BATCHES[batchIndex].name}</div>
                    </div>
                  );
                }
                
                return content;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ================= BATCH VIEW ================= */

const BatchView = () => {
  const [selectedBatch, setSelectedBatch] = useState<string>(BATCHES[0].id);
  const selectedBatchData = BATCHES.find(b => b.id === selectedBatch);

  return (
    <div style={styles.individualContainer}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarTitle}>Batches</span>
          <span style={styles.sidebarCount}>({BATCHES.length})</span>
        </div>
        <div style={styles.sidebarItems}>
          {BATCHES.map((batch) => (
            <div
              key={batch.id}
              style={
                selectedBatch === batch.id 
                  ? { ...styles.sidebarItem, backgroundColor: `${batch.color}15`, borderColor: batch.color }
                  : styles.sidebarItem
              }
              onClick={() => setSelectedBatch(batch.id)}
            >
              <div style={{...styles.sidebarAvatar, backgroundColor: batch.color}}>
                {batch.name.charAt(0)}
              </div>
              <div style={styles.sidebarInfo}>
                <div style={styles.sidebarName}>{batch.name}</div>
                <div style={styles.sidebarDetails}>{batch.department}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.mainContent}>
        {selectedBatchData && (
          <div>
            <div style={styles.individualHeader}>
              <div style={styles.individualTitle}>
                <div style={{...styles.individualAvatar, backgroundColor: selectedBatchData.color}}>
                  {selectedBatchData.name.charAt(0)}
                </div>
                <div>
                  <h3 style={styles.individualName}>{selectedBatchData.name}</h3>
                  <div style={styles.individualSubtitle}>
                    {selectedBatchData.department} • {selectedBatchData.semester} Semester
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.timetableGrid}>
              {DAYS.map((day, dayIndex) => (
                <div key={day} style={styles.gridDay}>
                  <div style={styles.gridDayHeader}>
                    <div style={styles.gridDayAbbr}>{DAY_ABBREVIATIONS[day]}</div>
                    <div style={styles.gridDayName}>{day.substring(0, 3)}</div>
                  </div>
                  <div style={styles.gridSlots}>
                    {Array.from({ length: SLOTS_PER_DAY }).map((_, slotIndex) => {
                      const periodId = `${DAY_ABBREVIATIONS[day]}${slotIndex + 1}`;
                      const subjectIndex = (parseInt(selectedBatchData.id.split('-')[1]) + dayIndex + slotIndex) % SUBJECTS.length;
                      const teacherIndex = (parseInt(selectedBatchData.id.split('-')[1]) + dayIndex + slotIndex) % TEACHERS.length;
                      
                      return (
                        <div key={periodId} style={styles.gridSlot}>
                          <div style={styles.gridPeriod}>{periodId}</div>
                          <div style={styles.gridTime}>{TIME_SLOTS[slotIndex]}</div>
                          <div style={styles.gridSubject}>{SUBJECTS[subjectIndex].substring(0, 12)}</div>
                          <div style={styles.gridTeacher}>{TEACHERS[teacherIndex].name.split(' ')[1]}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= TEACHER VIEW ================= */

const TeacherView = () => {
  const [selectedTeacher, setSelectedTeacher] = useState<string>(TEACHERS[0].id);
  const selectedTeacherData = TEACHERS.find(t => t.id === selectedTeacher);

  return (
    <div style={styles.individualContainer}>
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarTitle}>Teachers</span>
          <span style={styles.sidebarCount}>({TEACHERS.length})</span>
        </div>
        <div style={styles.sidebarItems}>
          {TEACHERS.map((teacher) => (
            <div
              key={teacher.id}
              style={
                selectedTeacher === teacher.id 
                  ? { ...styles.sidebarItem, backgroundColor: `${teacher.color}15`, borderColor: teacher.color }
                  : styles.sidebarItem
              }
              onClick={() => setSelectedTeacher(teacher.id)}
            >
              <div style={{...styles.sidebarAvatar, backgroundColor: teacher.color}}>
                {teacher.name.charAt(0)}
              </div>
              <div style={styles.sidebarInfo}>
                <div style={styles.sidebarName}>{teacher.name}</div>
                <div style={styles.sidebarDetails}>{teacher.subject}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.mainContent}>
        {selectedTeacherData && (
          <div>
            <div style={styles.individualHeader}>
              <div style={styles.individualTitle}>
                <div style={{...styles.individualAvatar, backgroundColor: selectedTeacherData.color}}>
                  {selectedTeacherData.name.charAt(0)}
                </div>
                <div>
                  <h3 style={styles.individualName}>{selectedTeacherData.name}</h3>
                  <div style={styles.individualSubtitle}>{selectedTeacherData.subject}</div>
                </div>
              </div>
            </div>

            <div style={styles.timetableGrid}>
              {DAYS.map((day, dayIndex) => (
                <div key={day} style={styles.gridDay}>
                  <div style={styles.gridDayHeader}>
                    <div style={styles.gridDayAbbr}>{DAY_ABBREVIATIONS[day]}</div>
                    <div style={styles.gridDayName}>{day.substring(0, 3)}</div>
                  </div>
                  <div style={styles.gridSlots}>
                    {Array.from({ length: SLOTS_PER_DAY }).map((_, slotIndex) => {
                      const periodId = `${DAY_ABBREVIATIONS[day]}${slotIndex + 1}`;
                      const batchIndex = (parseInt(selectedTeacherData.id.slice(3)) + dayIndex + slotIndex) % BATCHES.length;
                      const subjectIndex = (parseInt(selectedTeacherData.id.slice(3)) + dayIndex + slotIndex) % SUBJECTS.length;
                      
                      return (
                        <div key={periodId} style={styles.gridSlot}>
                          <div style={styles.gridPeriod}>{periodId}</div>
                          <div style={styles.gridTime}>{TIME_SLOTS[slotIndex]}</div>
                          <div style={styles.gridSubject}>{SUBJECTS[subjectIndex].substring(0, 12)}</div>
                          <div style={styles.gridBatch}>{BATCHES[batchIndex].name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
  
  generationWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "calc(100vh - 48px)",
    background: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
  },
  
  generationContainer: {
    textAlign: "center",
    padding: "40px",
    maxWidth: "500px",
  },
  
  spinner: {
    marginBottom: "24px",
  },
  
  spinningIcon: {
    animation: "spin 1s linear infinite",
    color: "#3b82f6",
  },
  
  generationTitle: {
    fontSize: "22px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "12px",
  },
  
  generationText: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "32px",
    lineHeight: "1.5",
  },
  
  progressContainer: {
    marginBottom: "32px",
  },
  
  progressBar: {
    height: "8px",
    background: "#e2e8f0",
    borderRadius: "4px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
    borderRadius: "4px",
  },
  
  progressText: {
    fontSize: "12px",
    color: "#64748b",
    textAlign: "center",
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
    gap: "12px",
    flexWrap: "wrap",
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
  
  mainTabs: {
    marginBottom: "24px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  
  tabBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  
  inactiveTab: {
    padding: "10px 20px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#475569",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  
  activeTab: {
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
  },
  
  stats: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
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
  
  contentArea: {
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  
  // Side by side layout
  sideBySideContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    padding: "20px",
  },
  
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  
  // Compact Card
  compactCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#ffffff",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  
  cardHeader: {
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    gap: "12px",
  },
  
  colorDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },
  
  cardHeaderInfo: {
    flex: "1",
  },
  
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  
  cardSubtitle: {
    fontSize: "13px",
    color: "#64748b",
  },
  
  // Grid System - OPTIMIZED FOR DEFAULT ZOOM
  timetableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "10px",
    padding: "16px",
  },
  
  gridDay: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  
  gridDayHeader: {
    textAlign: "center",
    padding: "10px 8px",
    background: "#f8fafc",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    marginBottom: "6px",
  },
  
  gridDayAbbr: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "2px",
  },
  
  gridDayName: {
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  
  gridSlots: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  
  gridSlot: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "12px",
    fontSize: "13px",
    minHeight: "100px",
  },
  
  gridPeriod: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    background: "#f1f5f9",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
    marginBottom: "8px",
  },
  
  gridTime: {
    fontSize: "11px",
    color: "#64748b",
    marginBottom: "10px",
  },
  
  gridSubject: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "6px",
    lineHeight: "1.3",
  },
  
  gridTeacher: {
    fontSize: "12px",
    color: "#3b82f6",
    fontWeight: "500",
  },
  
  gridBatch: {
    fontSize: "12px",
    color: "#10b981",
    fontWeight: "500",
  },
  
  // Individual View
  individualContainer: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    minHeight: "600px",
  },
  
  sidebar: {
    width: "280px",
    minWidth: "280px",
    borderRight: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  
  sidebarHeader: {
    padding: "16px 20px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  sidebarTitle: {
    fontSize: "14px",
    fontWeight: "600",
  },
  
  sidebarCount: {
    fontSize: "12px",
    color: "#64748b",
  },
  
  sidebarItems: {
    padding: "12px",
  },
  
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    gap: "12px",
  },
  
  sidebarAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "16px",
  },
  
  sidebarInfo: {
    flex: "1",
  },
  
  sidebarName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "2px",
  },
  
  sidebarDetails: {
    fontSize: "12px",
    color: "#475569",
  },
  
  mainContent: {
    padding: "24px",
    background: "#ffffff",
    overflow: "auto",
  },
  
  individualHeader: {
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
  },
  
  individualTitle: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  
  individualAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "10px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "24px",
  },
  
  individualName: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  
  individualSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
  },
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .compactCard, .sidebarItem, .gridSlot {
    animation: fadeIn 0.3s ease-out;
  }
  
  .gridSlot:hover {
    transform: translateY(-2px);
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .sidebarItem:hover {
    transform: translateX(4px);
    border-color: #3b82f6;
  }
  
  .primaryButton:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  }
  
  .secondaryButton:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    transform: translateY(-1px);
  }
  
  .activeTab:hover {
    background: #2563eb;
  }
  
  .inactiveTab:hover {
    border-color: #3b82f6;
  }
`;
document.head.appendChild(style);

export default GeneratedTimetable;