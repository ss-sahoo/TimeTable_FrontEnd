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

  // Load timetables when center name is available
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
  }, [centerName]);

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
    { key: "feasibility", label: "Feasibility" },
    { key: "generate", label: "Generate" },
    { key: "UpdateSlots", label: "Update Slots" },
  ];

  // Get selected timetable info
  const selectedTimetable = timetables.find(t => t.id === selectedTimetableId || t.timetable_id === selectedTimetableId);

  // Format timetable display name
  const formatTimetableName = (tt: any) => {
    const dateRange = `${tt.from_date} → ${tt.to_date}`;
    const slots = tt.slots_count || tt.total_slots || 0;
    return `${tt.center || 'Timetable'} (${dateRange}) - ${slots} slots`;
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Institute Timetable</h2>
      
      {/* Timetable Dropdown Selector
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
      </div> */}

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
        {activeTab === "instructions" && <Instructions />}
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
const Instructions = () => {
  const [freeClassesCount, setFreeClassesCount] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  return (
    <div style={styles.tabContent}>
      <div style={styles.headerRow}>
        <h3 style={styles.tabTitle}>Timetable Configuration</h3>
      </div>
      
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
};

export default Timetable;