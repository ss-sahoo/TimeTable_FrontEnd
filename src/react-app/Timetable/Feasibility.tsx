import React from "react";

const Feasibility: React.FC = () => {
  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Timetable Feasibility Check</h3>
          <p style={styles.subtitle}>
            UI-only preview to check whether timetable can be generated
          </p>
        </div>
        
        {/* Start Feasibility Button */}
        <button style={styles.startFeasibilityBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 10v4a1 1 0 001.555.832l3.197-2.132a.5.5 0 000-.832z" strokeWidth="2"/>
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/>
          </svg>
          Start Feasibility Check
        </button>
      </div>

      {/* Status Cards */}
      <div style={styles.cardGrid}>
        <div style={styles.statusCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8.5" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 8v6M23 11h-6" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={styles.cardTitle}>Teachers Availability</span>
          </div>
          <div style={styles.successBadge}>✅ OK</div>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={styles.cardTitle}>Slots Defined</span>
          </div>
          <div style={styles.successBadge}>✅ OK</div>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={styles.cardTitle}>Batch Constraints</span>
          </div>
          <div style={styles.successBadge}>✅ OK</div>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.cardHeader}>
            <div style={styles.cardIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8v4M12 16h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={styles.cardTitle}>Fixed Slots Conflicts</span>
          </div>
          <div style={styles.warningBadge}>⚠️ Warning</div>
        </div>
      </div>

      {/* Overall Result */}
      <div style={styles.resultBox}>
        <div style={styles.resultHeader}>
          <div style={styles.resultIconSuccess}>✓</div>
          <div>
            <h2 style={styles.resultTitle}>Timetable Can Be Generated</h2>
            <p style={styles.resultText}>
              All required data is present. You may proceed to generate the timetable.
            </p>
          </div>
        </div>
        
        {/* You can uncomment this for error state */}
        {/* 
        <div style={styles.resultHeader}>
          <div style={styles.resultIconError}>✗</div>
          <div>
            <h2 style={styles.resultTitle}>Timetable Has Conflicts</h2>
            <p style={styles.resultText}>
              Some issues need to be resolved before generating the timetable.
            </p>
          </div>
        </div>
        */}
      </div>

      {/* Issues List */}
      <div style={styles.issuesSection}>
        <h4 style={styles.sectionTitle}>Detected Notes (UI Preview)</h4>
        <div style={styles.issuesGrid}>
          <div style={styles.issueItem}>
            <div style={styles.issueIconOk}>✓</div>
            <div>
              <p style={styles.issueTitle}>All batches have assigned slots</p>
              <p style={styles.issueDescription}>Each batch has sufficient time slots allocated</p>
            </div>
          </div>
          
          <div style={styles.issueItem}>
            <div style={styles.issueIconWarn}>⚠</div>
            <div>
              <p style={styles.issueTitle}>Some fixed slots may overlap</p>
              <p style={styles.issueDescription}>Review fixed slot assignments for conflicts</p>
            </div>
          </div>
          
          <div style={styles.issueItem}>
            <div style={styles.issueIconOk}>✓</div>
            <div>
              <p style={styles.issueTitle}>Teacher availability provided</p>
              <p style={styles.issueDescription}>All required teachers have availability data</p>
            </div>
          </div>
          
          <div style={styles.issueItem}>
            <div style={styles.issueIconWarn}>⚠</div>
            <div>
              <p style={styles.issueTitle}>Some slots remain unused</p>
              <p style={styles.issueDescription}>Not all time slots are assigned to teachers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.actionSection}>
        <div style={styles.actionButtons}>
          <button style={styles.secondaryBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Go Back & Fix
          </button>
          <button style={styles.primaryBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Proceed to Generate
          </button>
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
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
  startFeasibilityBtn: {
    padding: "10px 20px",
    background: "#8b5cf6",
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
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },
  statusCard: {
    padding: "16px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  cardIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#334155",
  },
  successBadge: {
    alignSelf: "flex-end",
    padding: "6px 12px",
    background: "#dcfce7",
    color: "#16a34a",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  warningBadge: {
    alignSelf: "flex-end",
    padding: "6px 12px",
    background: "#fef3c7",
    color: "#d97706",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  resultBox: {
    background: "#ecfeff",
    border: "1px solid #67e8f9",
    padding: "24px",
    borderRadius: "10px",
    marginBottom: "28px",
  },
  resultHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  },
  resultIconSuccess: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#10b981",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
    flexShrink: "0",
  },
  resultIconError: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#ef4444",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
    flexShrink: "0",
  },
  resultTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
    margin: "0 0 8px 0",
  },
  resultText: {
    fontSize: "14px",
    color: "#334155",
    margin: "0",
    lineHeight: "1.5",
  },
  issuesSection: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "28px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 20px 0",
  },
  issuesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "16px",
  },
  issueItem: {
    display: "flex",
    gap: "12px",
    padding: "12px",
    background: "#ffffff",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  issueIconOk: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#dcfce7",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
    flexShrink: "0",
  },
  issueIconWarn: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#fef3c7",
    color: "#d97706",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
    flexShrink: "0",
  },
  issueTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  issueDescription: {
    fontSize: "12px",
    color: "#64748b",
    margin: "0",
    lineHeight: "1.4",
  },
  actionSection: {
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    marginTop: "28px",
    paddingTop: "24px",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  primaryBtn: {
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
  secondaryBtn: {
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
};

export default Feasibility;