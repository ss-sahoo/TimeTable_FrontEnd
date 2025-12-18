import React, { useState, useEffect } from "react";
import Fixedslots from "../Timetable/Fixedslots"; // Import your existing  component
import FixedSlots from "../Timetable/Fixedslots";

/* ================= MAIN UPDATE SLOTS COMPONENT ================= */
const UpdateSlots1: React.FC = () => {
  const [hasGeneratedTimetable, setHasGeneratedTimetable] = useState<boolean>(false);
  const [showSlotsEditor, setShowSlotsEditor] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Check if timetable has been generated (check localStorage)
  useEffect(() => {
    const checkTimetableGenerated = () => {
      try {
        // Check if there are any batch assignments or timetable data
        const hasAssignments = Object.keys(localStorage).some(key => 
          key.startsWith('batchAssignments_')
        );
        
        const hasSlots = localStorage.getItem("timetableSlots") !== null;
        
        setHasGeneratedTimetable(hasAssignments && hasSlots);
      } catch (error) {
        console.error("Error checking timetable:", error);
        setHasGeneratedTimetable(false);
      }
    };

    checkTimetableGenerated();
    
    // Listen for changes in localStorage
    const handleStorageChange = () => {
      checkTimetableGenerated();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle opening slots editor
  const handleEditSlots = () => {
    setShowSlotsEditor(true);
  };

  // Handle regenerating timetable
  const handleRegenerateTimetable = () => {
    setShowConfirmModal(true);
  };

  // Confirm regeneration
  const confirmRegenerate = () => {
    setIsRegenerating(true);
    
    // Simulate regeneration process (2 seconds)
    setTimeout(() => {
      // In a real app, this would call your timetable generation logic
      alert("Timetable regenerated successfully with updated slots!");
      setIsRegenerating(false);
      setShowConfirmModal(false);
      
      // Optionally reset to the welcome screen
      setShowSlotsEditor(false);
    }, 2000);
  };

  // Cancel regeneration
  const cancelRegenerate = () => {
    setShowConfirmModal(false);
  };

  // Back to welcome screen
  const handleBackToWelcome = () => {
    setShowSlotsEditor(false);
  };

  // If showing slots editor, show the FixedSlots component
  if (showSlotsEditor) {
    return (
      <div style={styles.wrapper}>
        {/* Header with Back Button */}
        <div style={styles.header}>
          <button 
            style={styles.backButton}
            onClick={handleBackToWelcome}
            title="Back to welcome screen"
          >
            ← Back
          </button>
          
          <div>
            <h3 style={styles.title}>Update Time Slots</h3>
            <p style={styles.subtitle}>Edit teacher assignments and period types for each batch</p>
          </div>
          
          <div style={styles.headerActions}>
            <button 
              style={styles.regenerateButton}
              onClick={handleRegenerateTimetable}
              disabled={isRegenerating}
            >
              {isRegenerating ? "⏳ Regenerating..." : "🔄 Regenerate Timetable"}
            </button>
          </div>
        </div>

        {/* Note Banner */}
        <div style={styles.noteBanner}>
          <span style={styles.noteIcon}>📝</span>
          <span style={styles.noteText}>
            <strong>Note:</strong> Changes made here will update the existing timetable. 
            After editing, click "Regenerate Timetable" to apply changes.
          </span>
        </div>

        {/* Render the existing FixedSlots component */}
        <FixedSlots />
      </div>
    );
  }

  // Welcome Screen
  return (
    <div style={styles.wrapper}>
      <div style={styles.welcomeContainer}>
        {/* Status Card */}
        <div style={styles.statusCard}>
          <div style={styles.statusHeader}>
            <div style={styles.statusIcon}>
              {hasGeneratedTimetable ? "✅" : "⏳"}
            </div>
            <h3 style={styles.statusTitle}>
              {hasGeneratedTimetable ? "Timetable Generated" : "No Timetable Found"}
            </h3>
          </div>
          
          <p style={styles.statusMessage}>
            {hasGeneratedTimetable 
              ? "Your timetable has been successfully generated. You can now update slots if teachers are absent or if changes are needed."
              : "No timetable has been generated yet. Please generate a timetable first before editing slots."}
          </p>

          {/* Stats Summary */}
          {hasGeneratedTimetable && (
            <div style={styles.statsSummary}>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>
                  {Object.keys(localStorage).filter(key => key.startsWith('batchAssignments_')).length}
                </span>
                <span style={styles.statLabel}>Batches</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>
                  {(() => {
                    const slotsData = localStorage.getItem("timetableSlots");
                    if (slotsData) {
                      try {
                        const parsed = JSON.parse(slotsData);
                        return parsed.days?.reduce((total: number, day: any) => total + (day.slots?.length || 0), 0) || 0;
                      } catch {
                        return 0;
                      }
                    }
                    return 0;
                  })()}
                </span>
                <span style={styles.statLabel}>Total Slots</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statNumber}>
                  {(() => {
                    let totalAssignments = 0;
                    Object.keys(localStorage).forEach(key => {
                      if (key.startsWith('batchAssignments_')) {
                        try {
                          const assignments = JSON.parse(localStorage.getItem(key) || '[]');
                          totalAssignments += assignments.length;
                        } catch {
                          // Ignore invalid data
                        }
                      }
                    });
                    return totalAssignments;
                  })()}
                </span>
                <span style={styles.statLabel}>Assignments</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Section */}
        <div style={styles.actionCard}>
          <h4 style={styles.actionTitle}>
            {hasGeneratedTimetable ? "Update Your Timetable" : "Generate Timetable First"}
          </h4>
          
          {hasGeneratedTimetable ? (
            <>
              <p style={styles.actionDescription}>
                Edit time slot assignments for teacher absences or changes. 
                This allows you to modify the existing timetable without starting from scratch.
              </p>
              
              <div style={styles.featuresList}>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>✏️</span>
                  <span>Edit teacher assignments for specific slots</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>🔄</span>
                  <span>Change period types (Free Period, Exam, etc.)</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>📊</span>
                  <span>View assignments across all batches</span>
                </div>
                <div style={styles.featureItem}>
                  <span style={styles.featureIcon}>⚡</span>
                  <span>Regenerate timetable with updated slots</span>
                </div>
              </div>
              
              <div style={styles.actionButtons}>
                <button
                  style={styles.primaryActionButton}
                  onClick={handleEditSlots}
                >
                  ✏️ Edit Time Slots
                </button>
                <button
                  style={styles.secondaryActionButton}
                  onClick={handleRegenerateTimetable}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? "⏳ Processing..." : "🔄 Regenerate Now"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={styles.actionDescription}>
                You need to generate a timetable first before you can update slots.
                Go to the Timetable Generation section to create your schedule.
              </p>
              
              <div style={styles.actionButtons}>
                <button
                  style={styles.primaryActionButton}
                  onClick={() => {
                    // In a real app, this would navigate to timetable generation
                    alert("Navigate to Timetable Generation page");
                  }}
                >
                  ⚡ Generate Timetable
                </button>
                <button
                  style={styles.secondaryActionButton}
                  onClick={() => {
                    // In a real app, this might show instructions
                    alert("Timetable generation instructions");
                  }}
                >
                  📖 How to Generate
                </button>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        {hasGeneratedTimetable && (
          <div style={styles.quickActionsCard}>
            <h4 style={styles.quickActionsTitle}>Quick Actions</h4>
            <div style={styles.quickActionsGrid}>
              <button 
                style={styles.quickActionButton}
                onClick={() => {
                  // Clear all assignments
                  if (window.confirm("Clear all teacher assignments?")) {
                    Object.keys(localStorage).forEach(key => {
                      if (key.startsWith('batchAssignments_')) {
                        localStorage.removeItem(key);
                      }
                    });
                    alert("All assignments cleared. Please refresh.");
                  }
                }}
              >
                <span style={styles.quickActionIcon}>🗑️</span>
                <span style={styles.quickActionText}>Clear All Assignments</span>
              </button>
              <button 
                style={styles.quickActionButton}
                onClick={() => {
                  // Export timetable data
                  const timetableData: any = {};
                  Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('batchAssignments_') || key === 'timetableSlots') {
                      try {
                        timetableData[key] = JSON.parse(localStorage.getItem(key) || '{}');
                      } catch {
                        timetableData[key] = localStorage.getItem(key);
                      }
                    }
                  });
                  
                  const dataStr = JSON.stringify(timetableData, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  
                  const exportFileDefaultName = 'timetable_backup.json';
                  
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
              >
                <span style={styles.quickActionIcon}>💾</span>
                <span style={styles.quickActionText}>Export Timetable</span>
              </button>
              <button 
                style={styles.quickActionButton}
                onClick={() => {
                  // View current timetable
                  alert("This would show the current timetable view");
                }}
              >
                <span style={styles.quickActionIcon}>👁️</span>
                <span style={styles.quickActionText}>View Current Timetable</span>
              </button>
              <button 
                style={styles.quickActionButton}
                onClick={() => {
                  // Import backup
                  alert("Import backup functionality");
                }}
              >
                <span style={styles.quickActionIcon}>📤</span>
                <span style={styles.quickActionText}>Import Backup</span>
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Regeneration */}
        {showConfirmModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Regenerate Timetable</h3>
                <button
                  style={styles.closeModalBtn}
                  onClick={cancelRegenerate}
                >
                  ×
                </button>
              </div>
              
              <div style={styles.modalBody}>
                <div style={styles.modalIcon}>🔄</div>
                <h4 style={styles.modalSubtitle}>Confirm Regeneration</h4>
                <p style={styles.modalText}>
                  Are you sure you want to regenerate the timetable with the current slot assignments?
                  This will update all schedules based on the latest changes.
                </p>
                
                <div style={styles.modalStats}>
                  <div style={styles.modalStat}>
                    <span style={styles.modalStatValue}>
                      {Object.keys(localStorage).filter(key => key.startsWith('batchAssignments_')).length}
                    </span>
                    <span style={styles.modalStatLabel}>Batches to Update</span>
                  </div>
                  <div style={styles.modalStat}>
                    <span style={styles.modalStatValue}>
                      {(() => {
                        const slotsData = localStorage.getItem("timetableSlots");
                        if (slotsData) {
                          try {
                            const parsed = JSON.parse(slotsData);
                            return parsed.days?.length || 0;
                          } catch {
                            return 0;
                          }
                        }
                        return 0;
                      })()}
                    </span>
                    <span style={styles.modalStatLabel}>Days</span>
                  </div>
                </div>
                
                <div style={styles.modalNote}>
                  <span style={styles.modalNoteIcon}>💡</span>
                  <span style={styles.modalNoteText}>
                    This process may take a few moments. All existing schedules will be updated.
                  </span>
                </div>
              </div>
              
              <div style={styles.modalFooter}>
                <button
                  style={styles.modalCancelBtn}
                  onClick={cancelRegenerate}
                  disabled={isRegenerating}
                >
                  Cancel
                </button>
                <button
                  style={styles.modalConfirmBtn}
                  onClick={confirmRegenerate}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? "Regenerating..." : "Yes, Regenerate"}
                </button>
              </div>
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
  
  // Welcome Screen Styles
  welcomeContainer: {
    maxWidth: "1000px",
    margin: "0 auto",
  },
  
  statusCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    borderRadius: "16px",
    padding: "32px",
    color: "#ffffff",
    marginBottom: "24px",
    boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)",
  },
  
  statusHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
  },
  
  statusIcon: {
    fontSize: "40px",
    background: "rgba(255, 255, 255, 0.2)",
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  statusTitle: {
    fontSize: "28px",
    fontWeight: "700",
    margin: "0",
  },
  
  statusMessage: {
    fontSize: "16px",
    lineHeight: "1.6",
    opacity: "0.9",
    margin: "0 0 24px 0",
  },
  
  statsSummary: {
    display: "flex",
    gap: "24px",
    marginTop: "32px",
  },
  
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.1)",
    padding: "16px 24px",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
  },
  
  statNumber: {
    fontSize: "32px",
    fontWeight: "700",
    marginBottom: "8px",
  },
  
  statLabel: {
    fontSize: "14px",
    opacity: "0.9",
  },
  
  actionCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  
  actionTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 16px 0",
  },
  
  actionDescription: {
    fontSize: "16px",
    color: "#64748b",
    lineHeight: "1.6",
    margin: "0 0 24px 0",
  },
  
  featuresList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "32px",
  },
  
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "15px",
    color: "#475569",
  },
  
  featureIcon: {
    fontSize: "18px",
    width: "32px",
    height: "32px",
    background: "#f1f5f9",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  
  actionButtons: {
    display: "flex",
    gap: "16px",
  },
  
  primaryActionButton: {
    padding: "16px 32px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s",
  },
  
  secondaryActionButton: {
    padding: "16px 32px",
    background: "#ffffff",
    color: "#3b82f6",
    border: "2px solid #3b82f6",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "all 0.3s",
  },
  
  quickActionsCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "32px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  
  quickActionsTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 24px 0",
  },
  
  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  
  quickActionButton: {
    padding: "20px 16px",
    background: "#f8fafc",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.3s",
  },
  
  quickActionIcon: {
    fontSize: "24px",
  },
  
  quickActionText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    textAlign: "center",
  },
  
  // Editor Mode Styles
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    paddingBottom: "20px",
    borderBottom: "2px solid #f1f5f9",
  },
  
  backButton: {
    padding: "10px 20px",
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 4px 0",
    textAlign: "center",
  },
  
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
    textAlign: "center",
  },
  
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  
  regenerateButton: {
    padding: "12px 24px",
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  
  noteBanner: {
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  
  noteIcon: {
    fontSize: "18px",
  },
  
  noteText: {
    fontSize: "14px",
    color: "#0369a1",
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
    zIndex: "1000",
  },
  
  modalContent: {
    background: "#ffffff",
    borderRadius: "16px",
    width: "500px",
    maxWidth: "90vw",
    overflow: "hidden",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  },
  
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  
  modalTitle: {
    fontSize: "20px",
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
  
  modalBody: {
    padding: "32px 24px",
    textAlign: "center",
  },
  
  modalIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  
  modalSubtitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 16px 0",
  },
  
  modalText: {
    fontSize: "15px",
    color: "#64748b",
    lineHeight: "1.6",
    margin: "0 0 24px 0",
  },
  
  modalStats: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
    margin: "24px 0",
  },
  
  modalStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  
  modalStatValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#3b82f6",
    marginBottom: "8px",
  },
  
  modalStatLabel: {
    fontSize: "14px",
    color: "#64748b",
  },
  
  modalNote: {
    padding: "12px 16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
    marginTop: "24px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  
  modalNoteIcon: {
    fontSize: "16px",
  },
  
  modalNoteText: {
    fontSize: "13px",
    color: "#0369a1",
    textAlign: "left",
  },
  
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "20px 24px",
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
  },
  
  modalCancelBtn: {
    padding: "12px 24px",
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  
  modalConfirmBtn: {
    padding: "12px 24px",
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
};

export default UpdateSlots1;