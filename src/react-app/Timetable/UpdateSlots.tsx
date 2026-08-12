import React, { useState, useEffect, useCallback } from "react";
import { Fetch } from "../usefetch";
import { cleanTimetableId } from "../AllApi";

/* ================= TYPES ================= */
interface FixedSlot {
  id: string;
  slot_id: string;
  slot_code: string;
  day_index?: number;
  day?: string;
  actual_date: string;
  start_time: string;
  end_time: string;
  batch_code: string;
  batch_name: string;
  teacher_code: string | null;
  teacher_name: string | null;
  subject: string | null;
  is_locked: boolean;
  room_number?: string;
}

interface FixedSlotsResponse {
  timetable_id: string;
  timetable: string;
  from_date: string;
  to_date: string;
  fixed_slots: FixedSlot[];
  total_fixed_slots: number;
}

interface Teacher {
  teacher_id: string;
  teacher_code: string;
  teacher_name: string;
  subject?: string;
  subject_code?: string;
  subject_name?: string;
}

/* ================= CONSTANTS ================= */
const DAY_COLORS: { [key: string]: string } = {
  "1": "#3b82f6",
  "2": "#10b981",
  "3": "#8b5cf6",
  "4": "#f59e0b",
  "5": "#ef4444",
  "6": "#ec4899",
  "7": "#06b6d4",
  "Monday": "#3b82f6",
  "Tuesday": "#10b981",
  "Wednesday": "#8b5cf6",
  "Thursday": "#f59e0b",
  "Friday": "#ef4444",
  "Saturday": "#ec4899",
  "Sunday": "#06b6d4",
};

/* Helper to get day key from slot */
const getDayKey = (slot: FixedSlot): string => {
  if (slot.day) return slot.day;
  if (slot.day_index !== undefined) return String(slot.day_index);
  return "unknown";
};

/* Helper to get day display name */
const getDayDisplay = (slot: FixedSlot): string => {
  if (slot.day) return slot.day;
  if (slot.day_index !== undefined) return `Day ${slot.day_index}`;
  return "Unknown";
};

/* ================= MAIN COMPONENT ================= */
const UpdateSlots: React.FC = () => {
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fixedSlots, setFixedSlots] = useState<FixedSlot[]>([]);
  const [timetableInfo, setTimetableInfo] = useState<{ timetable: string; from_date: string; to_date: string } | null>(null);
  
  // Filter states
  const [filterBatch, setFilterBatch] = useState<string>("all");
  const [filterDay, setFilterDay] = useState<string>("all");
  
  // Edit modal state
  const [editingSlot, setEditingSlot] = useState<FixedSlot | null>(null);
  const [editForm, setEditForm] = useState({ teacher_code: "", is_locked: false });
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Teachers list for dropdown
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Get timetable ID from localStorage
  useEffect(() => {
    const rawId = localStorage.getItem("timetable_id");
    if (rawId) {
      setTimetableId(cleanTimetableId(rawId));
    } else {
      setError("No timetable selected. Please select a timetable first.");
      setLoading(false);
    }
  }, []);

  // Fetch fixed slots
  const fetchFixedSlots = useCallback(async () => {
    if (!timetableId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await Fetch(
        `/api/timetable/timetables/${timetableId}/fixed-slots/`,
        { method: "GET" }
      );
      if (!response.ok) throw new Error(`Failed to load fixed slots: ${response.status}`);
      const data: FixedSlotsResponse = await response.json();
      setTimetableInfo({
        timetable: data.timetable,
        from_date: data.from_date,
        to_date: data.to_date,
      });
      setFixedSlots(data.fixed_slots || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [timetableId]);

  // Fetch teachers for dropdown
  const fetchTeachers = useCallback(async () => {
    if (!timetableId) return;
    try {
      const response = await Fetch(
        `/api/timetable/timetables/${timetableId}/teachers/`,
        { method: "GET" }
      );
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      }
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    }
  }, [timetableId]);

  useEffect(() => {
    if (timetableId) {
      fetchFixedSlots();
      fetchTeachers();
    }
  }, [timetableId, fetchFixedSlots, fetchTeachers]);

  // Open edit modal
  const handleEditSlot = (slot: FixedSlot) => {
    setEditingSlot(slot);
    setEditForm({
      teacher_code: slot.teacher_code || "",
      is_locked: slot.is_locked,
    });
    // Set initial subject from current teacher
    const currentTeacher = teachers.find(t => t.teacher_code === slot.teacher_code);
    setSelectedTeacherSubject(currentTeacher?.subject || currentTeacher?.subject_name || slot.subject || "");
    setSaveMessage(null);
  };

  // Handle teacher selection change
  const handleTeacherChange = (teacherCode: string) => {
    setEditForm({ ...editForm, teacher_code: teacherCode });
    if (teacherCode) {
      const teacher = teachers.find(t => t.teacher_code === teacherCode);
      setSelectedTeacherSubject(teacher?.subject || teacher?.subject_name || "");
    } else {
      setSelectedTeacherSubject("");
    }
  };

  // Close edit modal
  const handleCloseModal = () => {
    setEditingSlot(null);
    setSaveMessage(null);
  };

  // Save slot changes
  const handleSaveSlot = async () => {
    if (!editingSlot) return;
    setSaving(true);
    setSaveMessage(null);

    try {
      const payload: any = {};
      
      // Only include changed fields
      if (editForm.teacher_code !== (editingSlot.teacher_code || "")) {
        payload.teacher_code = editForm.teacher_code;
        // Subject comes from teacher automatically
        if (selectedTeacherSubject) {
          payload.subject = selectedTeacherSubject;
        }
      }
      if (editForm.is_locked !== editingSlot.is_locked) {
        payload.is_locked = editForm.is_locked;
      }

      if (Object.keys(payload).length === 0) {
        setSaveMessage({ type: "error", text: "No changes to save" });
        setSaving(false);
        return;
      }

      const response = await Fetch(
        `/api/timetable/admin/timetables/fixed-slots/${editingSlot.id}/update/`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || `Failed to update: ${response.status}`);
      }

      setSaveMessage({ type: "success", text: "Slot updated successfully!" });
      
      // Refresh the slots list
      await fetchFixedSlots();
      
      // Close modal after short delay
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setSaveMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Get unique batches for filter
  const uniqueBatches = [...new Set(fixedSlots.map(s => s.batch_code))];
  const uniqueDays = [...new Set(fixedSlots.map(s => getDayKey(s)))];

  // Filter slots
  const filteredSlots = fixedSlots.filter(slot => {
    if (filterBatch !== "all" && slot.batch_code !== filterBatch) return false;
    if (filterDay !== "all" && getDayKey(slot) !== filterDay) return false;
    return true;
  });

  // Group slots by day
  const slotsByDay = filteredSlots.reduce((acc, slot) => {
    const dayKey = getDayKey(slot);
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(slot);
    return acc;
  }, {} as { [key: string]: FixedSlot[] });

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p>Loading Fixed Slots...</p>
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
          <button style={styles.retryBtn} onClick={fetchFixedSlots}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Update Fixed Slots</h2>
          {timetableInfo && (
            <p style={styles.subtitle}>
              {timetableInfo.timetable} • {timetableInfo.from_date} to {timetableInfo.to_date}
            </p>
          )}
        </div>
        <div style={styles.headerActions}>
          <button style={styles.refreshBtn} onClick={fetchFixedSlots}>🔄 Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statNum}>{fixedSlots.length}</span>
          <span style={styles.statLabel}>Total Fixed Slots</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNum}>{fixedSlots.filter(s => s.is_locked).length}</span>
          <span style={styles.statLabel}>Locked Slots</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNum}>{uniqueBatches.length}</span>
          <span style={styles.statLabel}>Batches</span>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <span style={styles.filterLabel}>Filters:</span>
        <select
          style={styles.filterSelect}
          value={filterBatch}
          onChange={(e) => setFilterBatch(e.target.value)}
        >
          <option value="all">All Batches</option>
          {uniqueBatches.map(batch => (
            <option key={batch} value={batch}>{batch}</option>
          ))}
        </select>
        <select
          style={styles.filterSelect}
          value={filterDay}
          onChange={(e) => setFilterDay(e.target.value)}
        >
          <option value="all">All Days</option>
          {uniqueDays.map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      {/* Slots Grid */}
      {fixedSlots.length === 0 ? (
        <div style={styles.emptyBox}>
          <span style={{ fontSize: 48 }}>📭</span>
          <p>No fixed slots found</p>
          <p style={{ fontSize: 14, color: "#94a3b8" }}>Fixed slots will appear here once assigned</p>
        </div>
      ) : (
        <div style={styles.slotsContainer}>
          {Object.keys(slotsByDay).sort().map(dayKey => {
            const daySlots = slotsByDay[dayKey];
            const dayColor = DAY_COLORS[dayKey] || "#64748b";
            const firstSlot = daySlots[0];
            const dayDisplay = getDayDisplay(firstSlot);

            return (
              <div key={dayKey} style={styles.daySection}>
                <div style={{ ...styles.dayHeader, borderLeftColor: dayColor }}>
                  <div style={styles.dayInfo}>
                    <div style={{ ...styles.dayDot, backgroundColor: dayColor }}></div>
                    <span style={styles.dayTitle}>{dayDisplay}</span>
                    {firstSlot && firstSlot.actual_date && <span style={styles.dayDate}>{firstSlot.actual_date}</span>}
                  </div>
                  <span style={styles.dayCount}>{daySlots.length} slots</span>
                </div>

                <div style={styles.slotsGrid}>
                  {daySlots.map(slot => (
                    <div
                      key={slot.id}
                      style={{
                        ...styles.slotCard,
                        borderLeftColor: slot.is_locked ? "#f59e0b" : "#10b981",
                      }}
                      onClick={() => handleEditSlot(slot)}
                    >
                      <div style={styles.slotHeader}>
                        <span style={styles.slotCode}>{slot.slot_code}</span>
                        {slot.is_locked && <span style={styles.lockedBadge}>🔒 Locked</span>}
                      </div>
                      <div style={styles.slotTime}>
                        {slot.start_time} - {slot.end_time}
                      </div>
                      <div style={styles.slotBatch}>📚 {slot.batch_name || slot.batch_code}</div>
                      <div style={styles.slotSubject}>
                        {slot.subject || <span style={styles.noValue}>No subject</span>}
                      </div>
                      <div style={styles.slotTeacher}>
                        {slot.teacher_name ? (
                          <>👨‍🏫 {slot.teacher_name}</>
                        ) : (
                          <span style={styles.noValue}>No teacher assigned</span>
                        )}
                      </div>
                      <div style={styles.editHint}>Click to edit</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingSlot && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Edit Fixed Slot</h3>
              <button style={styles.closeBtn} onClick={handleCloseModal}>×</button>
            </div>

            <div style={styles.modalBody}>
              {/* Slot Info */}
              <div style={styles.slotInfoBox}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Slot:</span>
                  <span style={styles.infoValue}>{editingSlot.slot_code}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Time:</span>
                  <span style={styles.infoValue}>{editingSlot.start_time} - {editingSlot.end_time}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Date:</span>
                  <span style={styles.infoValue}>{editingSlot.actual_date}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Batch:</span>
                  <span style={styles.infoValue}>{editingSlot.batch_name || editingSlot.batch_code}</span>
                </div>
              </div>

              {/* Edit Form */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Teacher</label>
                <select
                  style={styles.formSelect}
                  value={editForm.teacher_code}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                >
                  <option value="">-- No Teacher (Free Slot) --</option>
                  {teachers.map(t => (
                    <option key={t.teacher_code} value={t.teacher_code}>
                      {t.teacher_name} ({t.teacher_code}) {t.subject || t.subject_name ? `- ${t.subject || t.subject_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-filled Subject Display */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Subject (from Teacher)</label>
                <div style={styles.subjectDisplay}>
                  {selectedTeacherSubject ? (
                    <span style={styles.subjectValue}>📚 {selectedTeacherSubject}</span>
                  ) : (
                    <span style={styles.noSubject}>No subject - Select a teacher to auto-fill</span>
                  )}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={editForm.is_locked}
                    onChange={(e) => setEditForm({ ...editForm, is_locked: e.target.checked })}
                    style={styles.checkbox}
                  />
                  <span>🔒 Lock this slot (prevent optimization changes)</span>
                </label>
              </div>

              {/* Save Message */}
              {saveMessage && (
                <div style={{
                  ...styles.saveMessage,
                  backgroundColor: saveMessage.type === "success" ? "#dcfce7" : "#fee2e2",
                  color: saveMessage.type === "success" ? "#166534" : "#dc2626",
                }}>
                  {saveMessage.type === "success" ? "✓" : "✗"} {saveMessage.text}
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={handleCloseModal} disabled={saving}>
                Cancel
              </button>
              <button style={styles.saveBtn} onClick={handleSaveSlot} disabled={saving}>
                {saving ? "Saving..." : "💾 Save Changes"}
              </button>
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
  refreshBtn: {
    padding: "10px 18px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
  },
  statsRow: {
    display: "flex",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px 28px",
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #e2e8f0",
  },
  statNum: {
    fontSize: 28,
    fontWeight: 700,
    color: "#0f172a",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#475569",
  },
  filterSelect: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: 14,
    cursor: "pointer",
    minWidth: 150,
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
  slotsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  daySection: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #e2e8f0",
  },
  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "#f8fafc",
    borderLeft: "4px solid",
  },
  dayInfo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  dayDot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
  },
  dayDate: {
    fontSize: 13,
    color: "#64748b",
    marginLeft: 8,
  },
  dayCount: {
    fontSize: 13,
    color: "#64748b",
    background: "#e2e8f0",
    padding: "4px 12px",
    borderRadius: 12,
  },
  slotsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
    padding: 20,
  },
  slotCard: {
    padding: 16,
    background: "#fafbfc",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    borderLeft: "4px solid",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  slotHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  slotCode: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
  },
  lockedBadge: {
    fontSize: 11,
    background: "#fef3c7",
    color: "#92400e",
    padding: "2px 8px",
    borderRadius: 10,
    fontWeight: 500,
  },
  slotTime: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: 600,
    marginBottom: 8,
  },
  slotBatch: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 4,
  },
  slotSubject: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
    marginBottom: 4,
  },
  slotTeacher: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
  },
  noValue: {
    color: "#94a3b8",
    fontStyle: "italic",
  },
  editHint: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "right",
    marginTop: 8,
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    borderRadius: 16,
    width: 500,
    maxWidth: "90vw",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
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
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontSize: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 24,
    overflowY: "auto",
    maxHeight: "60vh",
  },
  slotInfoBox: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #e2e8f0",
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 600,
    color: "#0f172a",
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#475569",
    marginBottom: 8,
  },
  formSelect: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    background: "#fff",
    fontSize: 14,
    cursor: "pointer",
  },
  subjectDisplay: {
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    fontSize: 14,
  },
  subjectValue: {
    color: "#0f172a",
    fontWeight: 600,
  },
  noSubject: {
    color: "#94a3b8",
    fontStyle: "italic",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    color: "#475569",
    cursor: "pointer",
  },
  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer",
  },
  saveMessage: {
    padding: "12px 16px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    marginTop: 16,
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    padding: "16px 24px",
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
  },
  cancelBtn: {
    padding: "10px 20px",
    background: "#fff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  saveBtn: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
};

export default UpdateSlots;
