import React, { useState, useEffect } from "react";
import { api } from "../hooks/useApi";
import { useAuthContext } from "../contexts/AuthContext";

interface Teacher {
  user_id: string;
  username: string;
  teacher_code: string;
  name: string;
  email?: string;
  phone_number?: string;
  employee_id?: string;
  subjects?: string;
}

interface CreateTeacherPayload {
  center_name?: string;
  center_id?: string;
  name: string;
  email?: string;
  phone_number?: string;
  employee_id?: string;
  subjects?: string;
}

interface TeacherManagementProps {
  selectedCenterId?: string | null;
  selectedCenterName?: string | null;
}

const TeacherManagement: React.FC<TeacherManagementProps> = ({
  selectedCenterId: propCenterId,
  selectedCenterName: propCenterName
}) => {
  const { user } = useAuthContext();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Single teacher form
  const [teacherForm, setTeacherForm] = useState<CreateTeacherPayload>({
    name: "",
    email: "",
    phone_number: "",
    employee_id: "",
    subjects: "",
  });

  // Bulk upload
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkJson, setBulkJson] = useState("");
  const [bulkMethod, setBulkMethod] = useState<"file" | "json">("file");

  // Messages
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdTeacher, setCreatedTeacher] = useState<Teacher | null>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);

  // Get center info
  const [centerName, setCenterName] = useState<string>("");
  const [centerId, setCenterId] = useState<string>("");

  useEffect(() => {
    if (propCenterId) {
      setCenterId(propCenterId);
    }
    if (propCenterName) {
      setCenterName(propCenterName);
    }

    if (!propCenterId || !propCenterName) {
      const getCenterInfo = async () => {
        try {
          const response = await api.get("/auth/profile/");
          if (!propCenterName) {
            setCenterName(response.data?.center_name || response.data?.center?.name || "");
          }
          if (!propCenterId) {
            setCenterId(response.data?.center_id || user?.center_id || "");
          }
        } catch (error) {
          console.error("Failed to fetch center info:", error);
        }
      };
      getCenterInfo();
    }
  }, [user, propCenterId, propCenterName]);

  // Fetch teachers list
  const fetchTeachers = async () => {
    setLoading(true);
    try {
      // Use the correct endpoint - /timetable/teachers/ for listing teachers
      let endpoint = "/timetable/teachers/";

      // If we have a centerId (especially for super admin), filter by it
      if (centerId) {
        endpoint += `?center_id=${centerId}`;
      } else if (centerName) {
        endpoint += `?center_name=${centerName}`;
      }

      const response = await api.get(endpoint);
      setTeachers(response.data.teachers || response.data || []);
    } catch (error) {
      console.error("Failed to fetch teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (centerId || centerName) {
      fetchTeachers();
    }
  }, [user, centerId, centerName]);

  // Create single teacher
  const handleCreateTeacher = async () => {
    if (!teacherForm.name.trim()) {
      setMessage({ type: "error", text: "Teacher name is required" });
      return;
    }

    setLoading(true);
    setMessage(null);
    setCreatedTeacher(null);

    try {
      const endpoint = user?.role === "super_admin" || user?.role === "SUPER_ADMIN"
        ? "/timetable/superadmin/teachers/create/"
        : "/timetable/admin/teachers/create/";

      const payload: CreateTeacherPayload = {
        ...teacherForm,
      };

      // Add center info for super admin
      if (user?.role === "super_admin" || user?.role === "SUPER_ADMIN") {
        if (centerId) {
          payload.center_id = centerId;
        } else if (centerName) {
          payload.center_name = centerName;
        }
      }

      const response = await api.post(endpoint, payload);

      setCreatedTeacher(response.data);
      setMessage({
        type: "success",
        text: `Teacher created successfully! Username: ${response.data.username}`
      });

      // Reset form
      setTeacherForm({
        name: "",
        email: "",
        phone_number: "",
        employee_id: "",
        subjects: "",
      });

      // Refresh teachers list
      fetchTeachers();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || error.message || "Failed to create teacher"
      });
    } finally {
      setLoading(false);
    }
  };

  // Bulk create teachers
  const handleBulkCreate = async () => {
    setLoading(true);
    setMessage(null);
    setBulkResult(null);

    try {
      const endpoint = user?.role === "super_admin" || user?.role === "SUPER_ADMIN"
        ? "/timetable/superadmin/teachers/bulk_create/"
        : "/timetable/admin/teachers/bulk_create/";

      let response;

      if (bulkMethod === "file" && bulkFile) {
        // File upload method
        const formData = new FormData();
        formData.append("file", bulkFile);

        if (user?.role === "super_admin" || user?.role === "SUPER_ADMIN") {
          if (centerId) {
            formData.append("center_id", centerId);
          }
        }

        response = await api.post(endpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else if (bulkMethod === "json" && bulkJson.trim()) {
        // JSON method
        const jsonData = JSON.parse(bulkJson);

        const payload: any = {
          teachers: jsonData.teachers || jsonData,
        };

        if (user?.role === "super_admin" || user?.role === "SUPER_ADMIN") {
          if (centerId) {
            payload.center_id = centerId;
          }
        }

        response = await api.post(endpoint, payload);
      } else {
        setMessage({ type: "error", text: "Please provide teachers data" });
        setLoading(false);
        return;
      }

      setBulkResult(response.data);
      setMessage({
        type: "success",
        text: `Bulk creation completed! Success: ${response.data.success}, Failed: ${response.data.failed}`
      });

      // Reset form
      setBulkFile(null);
      setBulkJson("");

      // Refresh teachers list
      fetchTeachers();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || error.message || "Failed to bulk create teachers"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Teacher Management</h3>
          <p style={styles.subtitle}>Add teachers to {centerName || "your center"}</p>
        </div>
        <div style={styles.buttonGroup}>
          <button style={styles.primaryBtn} onClick={() => setShowCreateModal(true)}>
            + Add Teacher
          </button>
          <button style={styles.secondaryBtn} onClick={() => setShowBulkModal(true)}>
            📤 Bulk Upload
          </button>
        </div>
      </div>

      {/* Teachers List */}
      <div style={styles.teachersList}>
        {loading && <p style={styles.loadingText}>Loading teachers...</p>}
        {!loading && teachers.length === 0 && (
          <div style={styles.emptyState}>
            <p>No teachers found. Add your first teacher!</p>
          </div>
        )}
        {!loading && teachers.length > 0 && (
          <>
            <div style={styles.statsBar}>
              <span style={styles.statsText}>Total Teachers: <strong>{teachers.length}</strong></span>
            </div>
            <div style={styles.grid}>
              {teachers.map((teacher) => (
                <div key={teacher.user_id} style={styles.teacherCard}>
                  <div style={styles.teacherAvatar}>
                    {teacher.name?.charAt(0)?.toUpperCase() || 'T'}
                  </div>
                  <div style={styles.teacherInfo}>
                    <h4 style={styles.teacherName}>{teacher.name || 'Unknown'}</h4>
                    <p style={styles.teacherCode}>{teacher.teacher_code}</p>
                    {teacher.email && <p style={styles.teacherDetail}>📧 {teacher.email}</p>}
                    {teacher.phone_number && <p style={styles.teacherDetail}>📱 {teacher.phone_number}</p>}
                    {teacher.subjects && <p style={styles.teacherDetail}>📚 {teacher.subjects}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Teacher Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Teacher</h3>
              <button style={styles.closeBtn} onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input
                  type="text"
                  value={teacherForm.name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                  placeholder="Teacher Name"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  placeholder="teacher@example.com"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  value={teacherForm.phone_number}
                  onChange={(e) => setTeacherForm({ ...teacherForm, phone_number: e.target.value })}
                  placeholder="9876543210"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Employee ID</label>
                <input
                  type="text"
                  value={teacherForm.employee_id}
                  onChange={(e) => setTeacherForm({ ...teacherForm, employee_id: e.target.value })}
                  placeholder="EMP-001"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Subjects</label>
                <input
                  type="text"
                  value={teacherForm.subjects}
                  onChange={(e) => setTeacherForm({ ...teacherForm, subjects: e.target.value })}
                  placeholder="Physics, Chemistry"
                  style={styles.input}
                />
              </div>

              {message && (
                <div style={{
                  ...styles.messageBox,
                  backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2",
                  color: message.type === "success" ? "#166534" : "#dc2626",
                }}>
                  {message.text}
                </div>
              )}

              {createdTeacher && (
                <div style={styles.credentialsBox}>
                  <h4 style={styles.credentialsTitle}>🎉 Teacher Created Successfully!</h4>
                  <div style={styles.credentialItem}>
                    <span style={styles.credentialLabel}>Username:</span>
                    <span style={styles.credentialValue}>{createdTeacher.username}</span>
                  </div>
                  <div style={styles.credentialItem}>
                    <span style={styles.credentialLabel}>Password:</span>
                    <span style={styles.credentialValue}>Teacher@{centerName.split(" ")[0]}2025</span>
                  </div>
                  <p style={styles.credentialNote}>⚠️ Please save these credentials!</p>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button
                style={styles.confirmBtn}
                onClick={handleCreateTeacher}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Teacher"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBulkModal(false)}>
          <div style={{ ...styles.modalContent, width: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Bulk Upload Teachers</h3>
              <button style={styles.closeBtn} onClick={() => setShowBulkModal(false)}>×</button>
            </div>

            <div style={styles.modalBody}>
              {/* Method Selection */}
              <div style={styles.methodSelector}>
                <button
                  style={{
                    ...styles.methodBtn,
                    ...(bulkMethod === "file" ? styles.methodBtnActive : {}),
                  }}
                  onClick={() => setBulkMethod("file")}
                >
                  📁 File Upload
                </button>
                <button
                  style={{
                    ...styles.methodBtn,
                    ...(bulkMethod === "json" ? styles.methodBtnActive : {}),
                  }}
                  onClick={() => setBulkMethod("json")}
                >
                  📝 JSON Data
                </button>
              </div>

              {bulkMethod === "file" && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Upload Excel/CSV File</label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                    style={styles.fileInput}
                  />
                  <div style={styles.templateDownload}>
                    <p style={styles.hint}>
                      File should contain columns: name, email, phone_number, employee_id, subjects
                    </p>
                    <a
                      href="/templates/teacher_bulk_upload_template.xlsx"
                      download
                      style={styles.downloadLink}
                    >
                      📥 Download Template
                    </a>
                  </div>
                </div>
              )}

              {bulkMethod === "json" && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>JSON Data</label>
                  <textarea
                    value={bulkJson}
                    onChange={(e) => setBulkJson(e.target.value)}
                    placeholder={`{
  "teachers": [
    {
      "name": "Teacher Name 1",
      "email": "teacher1@example.com",
      "phone_number": "9876543210",
      "employee_id": "EMP-001",
      "subjects": "Physics, Chemistry"
    }
  ]
}`}
                    style={styles.textarea}
                    rows={12}
                  />
                </div>
              )}

              {message && (
                <div style={{
                  ...styles.messageBox,
                  backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2",
                  color: message.type === "success" ? "#166534" : "#dc2626",
                }}>
                  {message.text}
                </div>
              )}

              {bulkResult && (
                <div style={styles.bulkResultBox}>
                  <h4 style={styles.bulkResultTitle}>📊 Bulk Upload Results</h4>
                  <div style={styles.bulkStats}>
                    <div style={styles.statItem}>
                      <span style={styles.statValue}>{bulkResult.total}</span>
                      <span style={styles.statLabel}>Total</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={{ ...styles.statValue, color: "#16a34a" }}>{bulkResult.success}</span>
                      <span style={styles.statLabel}>Success</span>
                    </div>
                    <div style={styles.statItem}>
                      <span style={{ ...styles.statValue, color: "#dc2626" }}>{bulkResult.failed}</span>
                      <span style={styles.statLabel}>Failed</span>
                    </div>
                  </div>
                  {bulkResult.errors && bulkResult.errors.length > 0 && (
                    <div style={styles.errorsList}>
                      <p style={styles.errorsTitle}>Errors:</p>
                      {bulkResult.errors.map((err: any, idx: number) => (
                        <p key={idx} style={styles.errorItem}>• {err.error || err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowBulkModal(false)}>
                Cancel
              </button>
              <button
                style={styles.confirmBtn}
                onClick={handleBulkCreate}
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload Teachers"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
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
  buttonGroup: {
    display: "flex",
    gap: "12px",
  },
  primaryBtn: {
    padding: "10px 20px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  secondaryBtn: {
    padding: "10px 20px",
    backgroundColor: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  teachersList: {
    minHeight: "200px",
  },
  statsBar: {
    padding: "12px 16px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    marginBottom: "16px",
    border: "1px solid #bae6fd",
  },
  statsText: {
    fontSize: "14px",
    color: "#0369a1",
  },
  loadingText: {
    textAlign: "center",
    color: "#64748b",
    padding: "40px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "2px dashed #e2e8f0",
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  },
  teacherCard: {
    display: "flex",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  teacherAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: "600",
    flexShrink: 0,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  teacherCode: {
    fontSize: "12px",
    color: "#64748b",
    margin: "0 0 8px 0",
  },
  teacherDetail: {
    fontSize: "12px",
    color: "#475569",
    margin: "2px 0",
  },
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
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    width: "500px",
    maxWidth: "90vw",
    maxHeight: "85vh",
    overflow: "auto",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  closeBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    fontSize: "18px",
  },
  modalBody: {
    padding: "24px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "13px",
    fontFamily: "monospace",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    outline: "none",
    resize: "vertical",
  },
  fileInput: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
  },
  hint: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "6px",
  },
  templateDownload: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "8px",
  },
  downloadLink: {
    fontSize: "13px",
    color: "#3b82f6",
    textDecoration: "none",
    fontWeight: "500",
    padding: "6px 12px",
    backgroundColor: "#eff6ff",
    borderRadius: "6px",
    border: "1px solid #bfdbfe",
  },
  messageBox: {
    padding: "12px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    marginTop: "16px",
  },
  credentialsBox: {
    padding: "16px",
    backgroundColor: "#dcfce7",
    borderRadius: "8px",
    marginTop: "16px",
  },
  credentialsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#166534",
    margin: "0 0 12px 0",
  },
  credentialItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #bbf7d0",
  },
  credentialLabel: {
    fontSize: "14px",
    color: "#166534",
    fontWeight: "500",
  },
  credentialValue: {
    fontSize: "14px",
    color: "#166534",
    fontWeight: "600",
    fontFamily: "monospace",
  },
  credentialNote: {
    fontSize: "12px",
    color: "#166534",
    marginTop: "8px",
    fontWeight: "500",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "20px 24px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
  },
  cancelBtn: {
    padding: "10px 20px",
    backgroundColor: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  confirmBtn: {
    padding: "10px 20px",
    backgroundColor: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  methodSelector: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
  },
  methodBtn: {
    flex: 1,
    padding: "12px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  methodBtnActive: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },
  bulkResultBox: {
    padding: "16px",
    backgroundColor: "#f0f9ff",
    borderRadius: "8px",
    marginTop: "16px",
  },
  bulkResultTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0369a1",
    margin: "0 0 12px 0",
  },
  bulkStats: {
    display: "flex",
    gap: "16px",
    marginBottom: "12px",
  },
  statItem: {
    flex: 1,
    textAlign: "center",
    padding: "12px",
    backgroundColor: "#ffffff",
    borderRadius: "6px",
  },
  statValue: {
    display: "block",
    fontSize: "24px",
    fontWeight: "600",
    color: "#1e293b",
  },
  statLabel: {
    display: "block",
    fontSize: "12px",
    color: "#64748b",
    marginTop: "4px",
  },
  errorsList: {
    marginTop: "12px",
    padding: "12px",
    backgroundColor: "#fee2e2",
    borderRadius: "6px",
  },
  errorsTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#dc2626",
    margin: "0 0 8px 0",
  },
  errorItem: {
    fontSize: "12px",
    color: "#991b1b",
    margin: "4px 0",
  },
};

export default TeacherManagement;
