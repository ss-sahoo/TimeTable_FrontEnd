import React, { useState, useEffect } from "react";
import SlotsGrid from "../Timetable/SlotsGrid";
import BatchSchedule from "../Timetable/BatchSchedule";
import Fixedslots from "../Timetable/Fixedslots";
import Teachers from "../Timetable/Teachers";
import Feasibility from "../Timetable/Feasibility";
import GeneratedTimetable from "../Timetable/GeneratedTimetable";
import UpdateSlots from "../Timetable/UpdateSlots";
import { fetchAllTimetables, updateFreeClassesCount, cleanTimetableId } from "../AllApi";
import { useAuthContext } from "../contexts/AuthContext";
import { api } from "../hooks/useApi";
import { JSX } from "react";



/* ================================
   TYPES
================================ */
type TabType =
  | "instructions"
  | "slots"
  | "batches"
  | "teachers"
  | "fixedSlots"
  | "feasibility"
  | "generate"
  | "UpdateSlots";

interface TableData {
  headers: string[];
  rows: (string | JSX.Element)[][];
}

/* ================================
   MAIN COMPONENT
================================ */
const Timetable: React.FC = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabType>("instructions");
  const [timetables, setTimetables] = useState<any[]>([]);
  const [loadingTimetables, setLoadingTimetables] = useState(false);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [centerName, setCenterName] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Key to trigger timetable list refresh

  // Get center name from user profile API
  useEffect(() => {
    const getCenterName = async () => {
      try {
        const response = await api.get('/auth/profile/');
        // The API response may have center_name or center.name
        const name = response.data?.center_name || response.data?.center?.name || null;
        if (name) {
          setCenterName(name);
        }
      } catch (error) {
        console.error("Failed to fetch center name:", error);
      }
    };
    
    getCenterName();
  }, [user]);

  // Load timetables when center name is available or refreshKey changes
  useEffect(() => {
    const loadTimetables = async () => {
      setLoadingTimetables(true);
      try {
        const data = await fetchAllTimetables(centerName || undefined);
        // Handle different response formats: { timetables: [...] }, { results: [...] }, or direct array
        const timetableList = data.timetables || data.results || (Array.isArray(data) ? data : []);
        setTimetables(timetableList);
        
        // Check if there's a stored timetable_id
        const storedId = localStorage.getItem("timetable_id");
        if (storedId) {
          setSelectedTimetableId(JSON.parse(storedId));
        }
      } catch (error) {
        console.error("Failed to fetch timetables:", error);
      } finally {
        setLoadingTimetables(false);
      }
    };
    
    loadTimetables();
  }, [centerName, refreshKey]);

  // Callback to refresh timetable list after creation
  const handleTimetableCreated = (newTimetableId: string) => {
    setSelectedTimetableId(newTimetableId);
    setRefreshKey(prev => prev + 1); // Trigger refresh of timetable list
  };

  // Handle timetable selection - no page reload
  const handleSelectTimetable = (timetableId: string) => {
    localStorage.setItem("timetable_id", JSON.stringify(timetableId));
    setSelectedTimetableId(timetableId);
  };

  // Tabs configuration
  const tabs: { key: TabType; label: string }[] = [
    { key: "instructions", label: "Instructions" },
    { key: "slots", label: "Slots" },
    { key: "batches", label: "Batches" },
    { key: "teachers", label: "Teachers" },
    { key: "fixedSlots", label: "Fixed Slots" },
    { key: "feasibility", label: "Generate" },
    { key: "generate", label: "Timetable" },
  ];

  // Get selected timetable info
  const selectedTimetable = timetables.find(t => t.id === selectedTimetableId || t.timetable_id === selectedTimetableId);

  // Format timetable display name
  const formatTimetableName = (tt: any) => {
    const dateRange = `${tt.from_date} → ${tt.to_date}`;
    const slots = tt.slots_count || tt.total_slots || 0;
    return `${tt.name  || 'Timetable'} (${dateRange}) - ${slots} slots`;
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Institute Timetable</h2>
      
      <div style={styles.timetableSelector}>
        <div style={styles.selectorRow}>
          <label style={styles.dropdownLabel}>📅 Select Timetable:</label>
          {loadingTimetables ? (
            <span style={styles.loadingText}>Loading...</span>
          ) : (
            <select
              style={styles.timetableDropdown}
              value={selectedTimetableId || ""}

              onChange={(e) => handleSelectTimetable(e.target.value)}
            >
              <option value="">-- Select a timetable --</option>
              {timetables.map((tt) => {
                const ttId = tt.id || tt.timetable_id;
                return (
                  <option key={ttId} value={ttId}>
                    {formatTimetableName(tt)}
                  </option>
                );
              })}
            </select>
          )}
          {selectedTimetable && (
            <span style={styles.selectedInfo}>
              ✓ {selectedTimetable.is_active ? "Active" : "Inactive"}
            </span>
          )}
        </div>
      </div>

      {/* Clickable Tabs */}
      <div style={styles.tabContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tabButton,
              ...(activeTab === tab.key ? styles.activeTab : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.contentArea}>
        {activeTab === "instructions" && <Instructions onTimetableCreated={handleTimetableCreated} />}
        {activeTab === "slots" && <Slots key={selectedTimetableId || 'new'} />}
        {activeTab === "batches" && <Batches />}
        {activeTab === "teachers" && <TeachersWrapper />}
        {activeTab === "fixedSlots" && <FixedSlots />}
        {activeTab === "feasibility" && <Feasibility />}
        {activeTab === "generate" && <GeneratedTimetable />}
        {activeTab === "UpdateSlots" && <UpdateSlots />}
      </div>
    </div>
  );
};

/* ================================
   TAB CONTENT COMPONENTS
================================ */

// Instructions Tab
const Instructions = ({ onTimetableCreated }: { onTimetableCreated: (id: string) => void }) => {
  const [freeClassesCount, setFreeClassesCount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create new timetable states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timetableName, setTimetableName] = useState<string>("");
  const [calendarRange, setCalendarRange] = useState({ startDate: "", endDate: "" });
  const [creatingTimetable, setCreatingTimetable] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get date 7 days from now
  const getNextWeekDate = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  };

  // Get date 30 days from now
  const getNextMonthDate = () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    return nextMonth.toISOString().split('T')[0];
  };

  // Get days from date range (for display)
  const getDaysFromDateRange = (startDate: string, endDate: string): string[] => {
    if (!startDate || !endDate) return [];
    
    const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const DAY_ABBREVIATIONS: Record<string, string> = {
      "Monday": "M",
      "Tuesday": "TU",
      "Wednesday": "WE",
      "Thursday": "TH",
      "Friday": "FR",
      "Saturday": "SA",
      "Sunday": "SU"
    };

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysInRange: string[] = [];
    
    const dayIndexMap: Record<number, string> = {
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
      0: "Sunday"
    };
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayIndex = currentDate.getDay();
      const dayName = dayIndexMap[dayIndex];
      
      if (dayName && !daysInRange.includes(dayName)) {
        daysInRange.push(dayName);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return daysInRange.sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b));
  };

  // Get days count from calendar range
  const getDaysCountFromRange = () => {
    if (!calendarRange.startDate || !calendarRange.endDate) return 0;
    return getDaysFromDateRange(calendarRange.startDate, calendarRange.endDate).length;
  };

  // Create new timetable with initial days
  const createNewTimetableHandler = async () => {
    if (!timetableName.trim()) {
      setCreateMessage({ type: 'error', text: 'Please enter a timetable name' });
      return;
    }

    if (!calendarRange.startDate || !calendarRange.endDate) {
      setCreateMessage({ type: 'error', text: 'Please select start and end dates' });
      return;
    }

    setCreatingTimetable(true);
    setCreateMessage(null);

    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }

      // Only call create API - no update needed
      const createPayload = {
        name: timetableName.trim(),
        from_date: calendarRange.startDate,
        to_date: calendarRange.endDate,
        free_classes_count: 0,
        weekly_slots: {},
        holidays: [],
      };

      const createResponse = await fetch(
        "https://exams.dashoapp.com/api/timetable/admin/timetables/create/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify(createPayload),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`API Error: ${createResponse.status} - ${errorText}`);
      }

      const createData = await createResponse.json();
      const timetableId = createData.timetable_id;

      // Store the timetable ID and calendar range in localStorage
      localStorage.setItem("timetable_id", JSON.stringify(timetableId));
      localStorage.setItem("timetable_dateRange", JSON.stringify({
        startDate: calendarRange.startDate,
        endDate: calendarRange.endDate
      }));
      
      setCreateMessage({ 
        type: 'success', 
        text: `Timetable "${timetableName}" created successfully! You can now add slots in the Slots tab.` 
      });

      // Reset form
      setTimetableName("");
      setCalendarRange({ startDate: "", endDate: "" });
      
      // Close modal after 2 seconds and notify parent to refresh list
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateMessage(null);
        onTimetableCreated(timetableId); // Notify parent to refresh timetable list
      }, 2000);

    } catch (error: any) {
      console.error("Failed to create timetable:", error);
      setCreateMessage({ type: 'error', text: error.message || 'Failed to create timetable. Please try again.' });
    } finally {
      setCreatingTimetable(false);
    }
  };

  const handleSaveFreeClasses = async () => {
    const timetableId = localStorage.getItem("timetable_id");
    if (!timetableId) {
      setSaveMessage({ type: 'error', text: 'Please select a timetable first' });
      return;
    }

    if (freeClassesCount < 0) {
      setSaveMessage({ type: 'error', text: 'Free classes count must be 0 or greater' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const cleanId = cleanTimetableId(timetableId);
      await updateFreeClassesCount(cleanId, freeClassesCount);
      setSaveMessage({ type: 'success', text: `Free classes count set to ${freeClassesCount} successfully!` });
    } catch (error: any) {
      console.error("Failed to save free classes:", error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const DAY_ABBREVIATIONS: Record<string, string> = {
    "Monday": "M",
    "Tuesday": "TU",
    "Wednesday": "WE",
    "Thursday": "TH",
    "Friday": "FR",
    "Saturday": "SA",
    "Sunday": "SU"
  };

  return (
    <div style={styles.tabContent}>
      <div style={styles.headerRow}>
        <h3 style={styles.tabTitle}>Timetable Configuration</h3>
      </div>
      
      {/* Create New Timetable Card */}
      <div style={styles.configCard}>
        <div style={styles.configHeader}>
          <span style={styles.configIcon}>✨</span>
          <h4 style={styles.configTitle}>Create New Timetable</h4>
        </div>
        <p style={styles.configDescription}>
          Start by creating a new timetable with a name and date range. You'll add specific slots and batches after creation.
        </p>
        <button 
          style={styles.saveConfigBtn}
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Timetable
        </button>
      </div>

      {/* Create Timetable Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={{...styles.modalContent, width: 500}} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create New Timetable</h3>
              <button
                style={styles.closeModalBtn}
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <div style={{padding: 16}}>
              <label style={{display: 'block', marginBottom: 8, color: '#475569'}}>Timetable name</label>
              <input
                type="text"
                value={timetableName}
                onChange={(e) => setTimetableName(e.target.value)}
                placeholder="e.g. JEE Main 2025 Schedule"
                style={{width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e2e8f0'}}
              />
            </div>

            {/* Calendar Range Selection */}
            <div style={{padding: 12, borderTop: '1px solid #eef2f7'}}>
              <div style={styles.timeNote}>
                <p style={styles.noteText}>
                  💡 <strong>Note:</strong> Select the date range for your timetable. You can add specific time slots after creation.
                </p>
              </div>

              <div style={styles.calendarSelection}>
                <div style={styles.calendarHeader}>
                  <span style={styles.selectionTitle}>Select Date Range</span>
                </div>
          
                <div style={styles.calendarInputs}>
                  <div style={styles.dateInputGroup}>
                    <label style={styles.dateLabel}>Start Date</label>
                    <input
                      type="date"
                      value={calendarRange.startDate}
                      onChange={(e) => setCalendarRange({...calendarRange, startDate: e.target.value})}
                      style={styles.dateInput}
                      min={getCurrentDate()}
                    />
                    <button
                      style={styles.quickDateBtn}
                      onClick={() => setCalendarRange({...calendarRange, startDate: getCurrentDate()})}
                    >
                      Today
                    </button>
                  </div>
            
                  <div style={styles.dateInputGroup}>
                    <label style={styles.dateLabel}>End Date</label>
                    <input
                      type="date"
                      value={calendarRange.endDate}
                      onChange={(e) => setCalendarRange({...calendarRange, endDate: e.target.value})}
                      style={styles.dateInput}
                      min={calendarRange.startDate || getCurrentDate()}
                    />
                    <div style={styles.quickDateButtons}>
                      <button
                        style={styles.quickDateBtn}
                        onClick={() => setCalendarRange({...calendarRange, endDate: getNextWeekDate()})}
                      >
                        Next Week
                      </button>
                      <button
                        style={styles.quickDateBtn}
                        onClick={() => setCalendarRange({...calendarRange, endDate: getNextMonthDate()})}
                      >
                        Next Month
                      </button>
                    </div>
                  </div>
                </div>
          
                {calendarRange.startDate && calendarRange.endDate && (
                  <div style={styles.calendarInfo}>
                    <p>📅 Date range: <strong>{getDaysCountFromRange()}</strong> days</p>
                    <div style={styles.daysList}>
                      {getDaysFromDateRange(calendarRange.startDate, calendarRange.endDate).map(day => (
                        <span key={day} style={styles.dayBadge}>
                          {DAY_ABBREVIATIONS[day]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Create Message */}
            {createMessage && (
              <div style={{
                ...styles.messageBox,
                backgroundColor: createMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: createMessage.type === 'success' ? '#166534' : '#dc2626',
                borderColor: createMessage.type === 'success' ? '#bbf7d0' : '#fecaca',
                margin: '12px 16px 0 16px'
              }}>
                {createMessage.type === 'success' ? '✓' : '✗'} {createMessage.text}
              </div>
            )}

            <div style={styles.modalFooter}>
              <button style={styles.cancelModalBtn} onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button
                style={styles.confirmModalBtn}
                onClick={createNewTimetableHandler}
                disabled={creatingTimetable}
              >
                {creatingTimetable ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Free Classes Configuration */}
      <div style={styles.configCard}>
        <div style={styles.configHeader}>
          <span style={styles.configIcon}>📚</span>
          <h4 style={styles.configTitle}>Free Classes Configuration</h4>
        </div>
        <p style={styles.configDescription}>
          How many free classes do you want to schedule simultaneously across all batches?
        </p>
        <div style={styles.inputRow}>
          <label style={styles.inputLabel}>Number of Simultaneous Free Classes:</label>
          <input
            type="number"
            min="0"
            max="20"
            value={freeClassesCount}
            onChange={(e) => setFreeClassesCount(parseInt(e.target.value) || 0)}
            style={styles.numberInput}
            placeholder="Enter count"
          />
          <button 
            style={styles.saveConfigBtn}
            onClick={handleSaveFreeClasses}
            disabled={saving}
          >
            {saving ? "Saving..." : "💾 Save"}
          </button>
        </div>
        
        {/* Save Message */}
        {saveMessage && (
          <div style={{
            ...styles.messageBox,
            backgroundColor: saveMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: saveMessage.type === 'success' ? '#166534' : '#dc2626',
            borderColor: saveMessage.type === 'success' ? '#bbf7d0' : '#fecaca',
          }}>
            {saveMessage.type === 'success' ? '✓' : '✗'} {saveMessage.text}
          </div>
        )}
        
        <div style={styles.hintBox}>
          <p style={styles.hintTitle}>💡 What does this mean?</p>
          <p style={styles.hintDescription}>
            This setting controls how many free periods can be scheduled at the same time slot across different batches. 
            For example, if set to 3, up to 3 batches can have a free period during the same time slot.
          </p>
        </div>
      </div>
    </div>
  );
};

// Slots Tab
const Slots = () => {
  return (
    <div style={styles.tabContent}>
      <SlotsGrid />
    </div>
  );
};

// Batches Tab
const Batches = () => {
  return (
    <div style={styles.tabContent}>
      <BatchSchedule />
    </div>
  );
};

// Teachers Wrapper Tab
const TeachersWrapper = () => {
  console.log('TeachersWrapper component rendered - Teachers tab is active');
  return (
    <div style={styles.tabContent}>
      <Teachers />
    </div>
  );
};

// // Teachers Tab
// const Teachers = () => {
//   const tableData: TableData = {
//     headers: ["Teacher ID", "Name", "Department", "Subject", "Actions"],
//     rows: [
//       ["#T001", "Dr. Sharma", "CSE", "Mathematics", renderActions()],
//       ["#T002", "Prof. Kumar", "ECE", "Digital Electronics", renderActions()],
//       ["#T003", "Dr. Singh", "CSE", "Data Structures", renderActions()],
//     ]
//   };

//   return (
//     <div style={styles.tabContent}>
//       <div style={styles.headerRow}>
//         <h3 style={styles.tabTitle}>Teachers</h3>
//         <button style={styles.primaryBtn}>+ Add New Teacher</button>
//       </div>
//       <Table data={tableData} />
//     </div>
//   );
// };

// Fixed Slots Tab
const FixedSlots = () => {
  return (
    <div style={styles.tabContent}>
      <Fixedslots />
    </div>
  );
};

// Finals Tab
// const Feasibility = () => {
//   return (
//     <div style={styles.tabContent}>
//       <div style={styles.headerRow}>
//         <h3 style={styles.tabTitle}>Final Timetable</h3>
//         <div style={styles.buttonGroup}>
//           <button style={styles.successBtn}>Generate Final</button>
//           <button style={styles.secondaryBtn}>Export as PDF</button>
//         </div>
//       </div>
//       <div style={styles.placeholder}>
//         <p style={styles.placeholderText}>No final timetable generated yet.</p>
//         <p style={styles.mutedText}>Use the Generate tab to create a timetable first.</p>
//       </div>
//     </div>
//   );
// };

// Generate Tab
const Generate = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div style={styles.tabContent}>
      <h3 style={styles.tabTitle}>Auto-Generate Timetable</h3>
      <div style={styles.generateCard}>
        <div style={styles.generateOptions}>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" defaultChecked /> Consider teacher availability
          </label>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" defaultChecked /> Consider batch constraints
          </label>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" defaultChecked /> Avoid clashes
          </label>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" /> Include breaks
          </label>
        </div>
        <button 
          style={styles.successBtn} 
          onClick={() => setIsGenerating(true)}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Timetable"}
        </button>
        {isGenerating && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}></div>
            <p style={styles.mutedText}>Processing constraints and generating timetable...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Update Slots Tab
// const UpdateSlots = () => {
//   return (
//     <div style={styles.tabContent}>
//       <h3 style={styles.tabTitle}>Update Slots</h3>
//       <div style={styles.updateCard}>
//         <div style={styles.warningBox}>
//           <p><strong>Warning:</strong> Updating slots will affect all generated timetables.</p>
//         </div>
//         <div style={styles.buttonGroup}>
//           <button style={styles.warningBtn}>Update All Slots</button>
//           <button style={styles.secondaryBtn}>Reset Changes</button>
//         </div>
//         <div style={styles.hintText}>
//           <p><strong>Tip:</strong> Update slots only when necessary to avoid conflicts.</p>
//         </div>
//       </div>
//     </div>
//   );
// };

/* ================================
   REUSABLE COMPONENTS
================================ */

const Table: React.FC<{ data: TableData }> = ({ data }) => (
  <div style={styles.tableContainer}>
    <table style={styles.table}>
      <thead>
        <tr>
          {data.headers.map((header, index) => (
            <th key={index} style={styles.tableHeader}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, rowIndex) => (
          <tr key={rowIndex} style={rowIndex % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} style={styles.tableCell}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ================================
   HELPER FUNCTIONS
================================ */

const renderActions = () => (
  <div style={styles.actionButtons}>
    <button style={styles.editBtn}>Edit</button>
    <button style={styles.deleteBtn}>Delete</button>
  </div>
);

/* ================================
   STYLES (Dashboard-like UI)
================================ */

const styles: Record<string, React.CSSProperties> = {
  // Page Layout
  page: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "24px",
    color: "#1e293b",
  },

  // Timetable Dropdown Selector
  timetableSelector: {
    marginBottom: "24px",
    padding: "16px 20px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
  },
  selectorRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  dropdownLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    whiteSpace: "nowrap",
  },
  timetableDropdown: {
    flex: "1",
    minWidth: "300px",
    maxWidth: "500px",
    padding: "10px 14px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#1e293b",
    cursor: "pointer",
    outline: "none",
  },
  selectedInfo: {
    padding: "6px 12px",
    background: "#dcfce7",
    color: "#16a34a",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "500",
  },

  // Tabs
  tabContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "24px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
  },
  tabButton: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#475569",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  activeTab: {
    background: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },

  // Content Area
  contentArea: {
    background: "#ffffff",
    borderRadius: "8px",
  },

  // Tab Content
  tabContent: {
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  tabTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  buttonGroup: {
    display: "flex",
    gap: "12px",
  },

  // Buttons
  primaryBtn: {
    background: "#3b82f6",
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  secondaryBtn: {
    background: "#ffffff",
    color: "#475569",
    padding: "10px 20px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  successBtn: {
    background: "#10b981",
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    minWidth: "160px",
  },
  warningBtn: {
    background: "#f59e0b",
    color: "#ffffff",
    padding: "10px 20px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  editBtn: {
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    marginRight: "8px",
  },
  deleteBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
  },

  // Table
  tableContainer: {
    overflowX: "auto",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
  },
  tableHeader: {
    padding: "16px",
    textAlign: "left",
    backgroundColor: "#f1f5f9",
    color: "#475569",
    fontWeight: "600",
    fontSize: "14px",
    borderBottom: "1px solid #e2e8f0",
  },
  tableCell: {
    padding: "16px",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "14px",
  },
  tableRowEven: {
    backgroundColor: "#ffffff",
  },
  tableRowOdd: {
    backgroundColor: "#f8fafc",
  },
  actionButtons: {
    display: "flex",
    gap: "4px",
  },

  // Form Elements
  textarea: {
    width: "100%",
    minHeight: "150px",
    padding: "16px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    marginBottom: "16px",
    backgroundColor: "#ffffff",
  },

  // Special Cards
  generateCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  updateCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  generateOptions: {
    marginBottom: "24px",
  },

  // Checkbox
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    color: "#334155",
    fontSize: "14px",
  },

  // Progress
  progressContainer: {
    marginTop: "20px",
  },
  progressBar: {
    height: "8px",
    background: "linear-gradient(90deg, #3b82f6 0%, #10b981 100%)",
    borderRadius: "4px",
    marginBottom: "8px",
    animation: "pulse 2s infinite",
  },

  // Warning Box
  warningBox: {
    background: "#fffbeb",
    border: "1px solid #fbbf24",
    padding: "16px",
    borderRadius: "6px",
    marginBottom: "20px",
    color: "#92400e",
  },

  // Placeholder
  placeholder: {
    background: "#f8fafc",
    padding: "40px",
    borderRadius: "8px",
    textAlign: "center",
    border: "2px dashed #cbd5e1",
  },
  placeholderText: {
    fontSize: "18px",
    color: "#64748b",
    margin: "0 0 8px 0",
  },

  // Text Styles
  hintText: {
    marginTop: "16px",
    padding: "12px",
    background: "#f0f9ff",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#0369a1",
  },
  mutedText: {
    color: "#64748b",
    fontSize: "14px",
    margin: "0",
  },

  // Loading and Error States
  loadingText: {
    color: "#3b82f6",
    fontSize: "14px",
    padding: "16px",
    textAlign: "center",
    fontWeight: "500",
  },
  errorText: {
    color: "#dc2626",
    fontSize: "14px",
    padding: "16px",
    backgroundColor: "#fee2e2",
    borderRadius: "6px",
    marginBottom: "16px",
    border: "1px solid #fecaca",
  },

  // Configuration Card Styles
  configCard: {
    background: "#ffffff",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    marginBottom: "20px",
  },
  configHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  configIcon: {
    fontSize: "24px",
  },
  configTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  configDescription: {
    fontSize: "14px",
    color: "#64748b",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  inputLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
  },
  numberInput: {
    width: "120px",
    padding: "10px 14px",
    fontSize: "16px",
    fontWeight: "600",
    borderRadius: "8px",
    border: "2px solid #e2e8f0",
    textAlign: "center",
    outline: "none",
  },
  saveConfigBtn: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  messageBox: {
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "16px",
    border: "1px solid",
  },
  hintBox: {
    background: "#f0f9ff",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
  },
  hintTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0369a1",
    margin: "0 0 8px 0",
  },
  hintDescription: {
    fontSize: "13px",
    color: "#0c4a6e",
    margin: "0",
    lineHeight: "1.5",
  },

  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#ffffff",
    borderRadius: "12px",
    width: "500px",
    maxWidth: "90vw",
    maxHeight: "85vh",
    overflow: "hidden",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
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
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "20px 24px",
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
  },
  cancelModalBtn: {
    padding: "10px 20px",
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  confirmModalBtn: {
    padding: "10px 20px",
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },

  // Calendar Styles
  timeNote: {
    marginBottom: "20px",
    padding: "12px 16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
  },
  noteText: {
    margin: "0",
    fontSize: "13px",
    color: "#0369a1",
    lineHeight: "1.5",
  },
  calendarSelection: {
    marginBottom: "24px",
  },
  calendarHeader: {
    marginBottom: "20px",
  },
  selectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },
  calendarInputs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "20px",
  },
  dateInputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  dateLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
  },
  dateInput: {
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    width: "100%",
  },
  quickDateButtons: {
    display: "flex",
    gap: "8px",
  },
  quickDateBtn: {
    padding: "6px 12px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    flex: "1",
  },
  calendarInfo: {
    padding: "12px",
    background: "#f0f9ff",
    borderRadius: "6px",
    border: "1px solid #bae6fd",
    color: "#0369a1",
    fontSize: "13px",
    marginTop: "12px",
  },
  daysList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginTop: "8px",
  },
  dayBadge: {
    padding: "4px 10px",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
  },
};

export default Timetable;