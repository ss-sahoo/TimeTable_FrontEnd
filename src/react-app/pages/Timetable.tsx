import React, { useState } from "react";
import SlotsGrid from "../Timetable/SlotsGrid";
import BatchSchedule from "../Timetable/BatchSchedule";
import Fixedslots from "../Timetable/Fixedslots";
import Teachers from "../Timetable/Teachers";
import Feasibility from "../Timetable/Feasibility";
import GeneratedTimetable from "../Timetable/GeneratedTimetable";
import UpdateSlots from "../Timetable/UpdateSlots";
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
  const [activeTab, setActiveTab] = useState<TabType>("instructions");

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

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Institute Timetable</h2>
      

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
        {activeTab === "slots" && <Slots />}
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
  const [instructions, setInstructions] = useState("Add your timetable creation guidelines here...");

  return (
    <div style={styles.tabContent}>
      <div style={styles.headerRow}>
        <h3 style={styles.tabTitle}>Instructions</h3>
        <button style={styles.primaryBtn}>Save Changes</button>
      </div>
      <textarea
        style={styles.textarea}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Enter timetable rules, constraints, and guidelines..."
      />
      <div style={styles.hintText}>
        <p><strong>Tip:</strong> Define clear rules for timetable generation.</p>
      </div>
    </div>
  );
};

// Slots Tab
const Slots = () => {
  const [slotsData, setSlotsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    const fetchSlots = async () => {
      const rawTimetableId = localStorage.getItem('timetable_id');
      
      if (!rawTimetableId) {
        setError('No timetable ID found in localStorage');
        return;
      }

      // Clean the timetable ID - remove any quotes or extra characters
      const timetableId = rawTimetableId.replace(/"/g, '').trim();
      console.log('Original timetable ID:', rawTimetableId);
      console.log('Cleaned timetable ID:', timetableId);

      setLoading(true);
      setError(null);

      try {
        const { fetchTimetableSlots } = await import('../AllApi');
        const data = await fetchTimetableSlots(timetableId);
        setSlotsData(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch slots');
        console.error('Error fetching slots:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, []);

  return (
    <div style={styles.tabContent}>
      {loading && <div style={styles.loadingText}>Loading slots...</div>}
      {error && <div style={styles.errorText}>Error: {error}</div>}
      <SlotsGrid slotsData={slotsData} />
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
};

export default Timetable;