import React, { useState, useEffect, useCallback } from "react";
import { Fetch } from "../usefetch";
import { cleanTimetableId } from "../AllApi";

/* ================= TYPES ================= */
interface FeasibilityResult {
  feasible: boolean;
  violations: {
    RULE_1?: string[];
    RULE_2?: string[];
    RULE_3?: string[];
    RULE_4?: string[];
    RULE_5?: string[];
    RULE_6?: string[];
  };
  summary: {
    total_batches: number;
    total_teachers: number;
    total_slots: number;
    total_violations: number;
    start_slot: string;
  };
  rules_explanation: {
    RULE_1: string;
    RULE_2: string;
    RULE_3: string;
    RULE_4: string;
    RULE_5: string;
    RULE_6: string;
  };
}

const Feasibility: React.FC = () => {
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FeasibilityResult | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [generatedTimetable, setGeneratedTimetable] = useState<any>(null);
  const [payload, setPayload] = useState<any>(null);

  /* Get timetable ID from localStorage */
  useEffect(() => {
    const rawId = localStorage.getItem("timetable_id");
    if (rawId) {
      const cleanId = cleanTimetableId(rawId);
      console.log("Feasibility - Timetable ID loaded:", cleanId);
      setTimetableId(cleanId);
    }
  }, []);

  /* Run feasibility check */
  const runFeasibilityCheck = useCallback(async () => {
    if (!timetableId) {
      setError("No timetable ID found. Please create a timetable first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setGeneratedTimetable(null);

    try {
      // Step 1: Get payload from the timetable
      console.log("Fetching payload for timetable:", timetableId);
      const payloadResponse = await Fetch(`/api/timetable/timetables/${timetableId}/payload/`, {
        method: "GET",
      });
      
      if (!payloadResponse.ok) {
        throw new Error(`Failed to fetch payload: ${payloadResponse.status}`);
      }
      
      const payloadData = await payloadResponse.json();
      console.log("Payload received:", payloadData);
      setPayload(payloadData);

      // Step 2: Send payload to check-feasibility endpoint
      console.log("Running feasibility check...");
      const feasibilityResponse = await Fetch(`/api/timetable/timetables/${timetableId}/check-feasibility/`, {
        method: "POST",
        body: JSON.stringify(payloadData),
      });

      if (!feasibilityResponse.ok) {
        throw new Error(`Feasibility check failed: ${feasibilityResponse.status}`);
      }

      const feasibilityData: FeasibilityResult = await feasibilityResponse.json();
      console.log("Feasibility result:", feasibilityData);

      setResult(feasibilityData);
      setHasRun(true);
    } catch (err: any) {
      console.error("Feasibility check error:", err);
      setError(err.message || "Failed to run feasibility check");
    } finally {
      setLoading(false);
    }
  }, [timetableId]);

  /* Generate timetable (optimize) */
  const handleGenerateTimetable = useCallback(async () => {
    if (!timetableId || !payload) {
      setError("No payload available. Please run feasibility check first.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      console.log("Generating timetable (optimize)...");
      const optimizeResponse = await Fetch(`/api/timetable/timetables/${timetableId}/optimize/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!optimizeResponse.ok) {
        throw new Error(`Optimization failed: ${optimizeResponse.status}`);
      }

      const optimizeData = await optimizeResponse.json();
      console.log("Optimization result:", optimizeData);
      setGeneratedTimetable(optimizeData);
    } catch (err: any) {
      console.error("Optimization error:", err);
      setError(err.message || "Failed to generate timetable");
    } finally {
      setGenerating(false);
    }
  }, [timetableId, payload]);

  /* Save generated timetable */
  const handleSaveTimetable = useCallback(async () => {
    if (!timetableId || !generatedTimetable) {
      setError("No generated timetable to save.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      console.log("Saving timetable...");
      const saveResponse = await Fetch(`/api/timetable/timetables/${timetableId}/save/`, {
        method: "POST",
        body: JSON.stringify(generatedTimetable),
      });

      if (!saveResponse.ok) {
        throw new Error(`Save failed: ${saveResponse.status}`);
      }

      const saveData = await saveResponse.json();
      console.log("Save result:", saveData);
      alert("Timetable saved successfully!");
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save timetable");
    } finally {
      setSaving(false);
    }
  }, [timetableId, generatedTimetable]);

  /* Get violation count for a rule */
  const getViolationCount = (ruleKey: string): number => {
    if (!result?.violations) return 0;
    const violations = result.violations[ruleKey as keyof typeof result.violations];
    return violations?.length || 0;
  };

  /* Get rule status */
  const getRuleStatus = (ruleKey: string): "ok" | "error" => {
    return getViolationCount(ruleKey) > 0 ? "error" : "ok";
  };

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Timetable Feasibility Check</h3>
          <p style={styles.subtitle}>
            Check whether timetable can be generated with current configuration
          </p>
        </div>
        
        {/* Start Feasibility Button */}
        <button 
          style={{
            ...styles.startFeasibilityBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "wait" : "pointer",
          }}
          onClick={runFeasibilityCheck}
          disabled={loading || !timetableId}
        >
          {loading ? (
            <>
              <div style={styles.buttonSpinner}></div>
              Running Check...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 10v4a1 1 0 001.555.832l3.197-2.132a.5.5 0 000-.832z" strokeWidth="2"/>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2"/>
              </svg>
              Start Feasibility Check
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorAlert}>
          <span>❌ {error}</span>
          <button style={styles.errorCloseBtn} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* No Timetable ID Warning */}
      {!timetableId && !error && (
        <div style={styles.warningAlert}>
          <span>⚠️ No timetable ID found. Please create or select a timetable first.</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Running feasibility check...</p>
        </div>
      )}

      {/* Results */}
      {!loading && hasRun && result && (
        <>
          {/* Summary Cards */}
          {result.summary && (
            <div style={styles.summaryGrid}>
              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Total Batches</span>
                <span style={styles.summaryValue}>{result.summary.total_batches}</span>
              </div>
              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Total Teachers</span>
                <span style={styles.summaryValue}>{result.summary.total_teachers}</span>
              </div>
              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Total Slots</span>
                <span style={styles.summaryValue}>{result.summary.total_slots}</span>
              </div>
              <div style={{
                ...styles.summaryCard,
                background: result.summary.total_violations > 0 ? "#fef2f2" : "#dcfce7",
                borderColor: result.summary.total_violations > 0 ? "#fecaca" : "#a7f3d0",
              }}>
                <span style={styles.summaryLabel}>Total Violations</span>
                <span style={{
                  ...styles.summaryValue,
                  color: result.summary.total_violations > 0 ? "#dc2626" : "#16a34a",
                }}>{result.summary.total_violations}</span>
              </div>
            </div>
          )}

          {/* Overall Result */}
          <div style={{
            ...styles.resultBox,
            background: result.feasible ? "#dcfce7" : "#fef2f2",
            borderColor: result.feasible ? "#a7f3d0" : "#fecaca",
          }}>
            <div style={styles.resultHeader}>
              {result.feasible ? (
                <>
                  <div style={styles.resultIconSuccess}>✓</div>
                  <div>
                    <h2 style={styles.resultTitle}>Timetable Can Be Generated</h2>
                    <p style={styles.resultText}>
                      All constraints are satisfied. You may proceed to generate the timetable.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.resultIconError}>✗</div>
                  <div>
                    <h2 style={styles.resultTitle}>Timetable Has Violations</h2>
                    <p style={styles.resultText}>
                      {result.summary.total_violations} violation(s) found. Please fix the issues below before generating.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Violations Section - Only show if not feasible */}
          {!result.feasible && result.violations && (
            <div style={styles.violationsSection}>
              <h4 style={styles.sectionTitle}>Rule Violations</h4>
              
              {Object.entries(result.rules_explanation).map(([ruleKey, explanation]) => {
                const violations = result.violations[ruleKey as keyof typeof result.violations] || [];
                const hasViolations = violations.length > 0;
                
                return (
                  <div key={ruleKey} style={{
                    ...styles.ruleCard,
                    borderLeftColor: hasViolations ? "#ef4444" : "#10b981",
                  }}>
                    <div style={styles.ruleHeader}>
                      <div style={styles.ruleHeaderLeft}>
                        <span style={{
                          ...styles.ruleStatus,
                          background: hasViolations ? "#fee2e2" : "#dcfce7",
                          color: hasViolations ? "#dc2626" : "#16a34a",
                        }}>
                          {hasViolations ? "✗" : "✓"}
                        </span>
                        <span style={styles.ruleKey}>{ruleKey}</span>
                        {hasViolations && (
                          <span style={styles.violationCount}>{violations.length} violation(s)</span>
                        )}
                      </div>
                    </div>
                    <p style={styles.ruleExplanation}>{explanation}</p>
                    
                    {hasViolations && (
                      <div style={styles.violationsList}>
                        {violations.map((violation, idx) => (
                          <div key={idx} style={styles.violationItem}>
                            <span style={styles.violationBullet}>•</span>
                            <span style={styles.violationText}>{violation}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Generated Timetable Success */}
          {generatedTimetable && (
            <div style={styles.successAlert}>
              <span>✅ Timetable generated successfully! Click "Save Timetable" to save it.</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={styles.actionSection}>
            <div style={styles.actionButtons}>
              <button style={styles.secondaryBtn} onClick={runFeasibilityCheck} disabled={loading}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Run Again
              </button>
              
              {result.feasible && !generatedTimetable && (
                <button 
                  style={{
                    ...styles.primaryBtn,
                    opacity: generating ? 0.7 : 1,
                    cursor: generating ? "wait" : "pointer",
                  }}
                  onClick={handleGenerateTimetable}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <div style={styles.buttonSpinnerWhite}></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Proceed to Generate
                    </>
                  )}
                </button>
              )}

              {generatedTimetable && (
                <button 
                  style={{
                    ...styles.saveBtn,
                    opacity: saving ? 0.7 : 1,
                    cursor: saving ? "wait" : "pointer",
                  }}
                  onClick={handleSaveTimetable}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div style={styles.buttonSpinnerWhite}></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="17,21 17,13 7,13 7,21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="7,3 7,8 15,8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Save Timetable
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Initial State - Before Running */}
      {!loading && !hasRun && timetableId && (
        <div style={styles.initialState}>
          <div style={styles.initialIcon}>🔍</div>
          <h3 style={styles.initialTitle}>Ready to Check Feasibility</h3>
          <p style={styles.initialText}>
            Click "Start Feasibility Check" to verify if your timetable configuration is valid and can be generated.
          </p>
        </div>
      )}
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
  buttonSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid #ffffff40",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  buttonSpinnerWhite: {
    width: "16px",
    height: "16px",
    border: "2px solid #ffffff40",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorAlert: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    marginBottom: "20px",
    color: "#dc2626",
  },
  errorCloseBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#dc2626",
  },
  warningAlert: {
    padding: "12px 16px",
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    borderRadius: "8px",
    marginBottom: "20px",
    color: "#92400e",
  },
  successAlert: {
    padding: "12px 16px",
    background: "#dcfce7",
    border: "1px solid #a7f3d0",
    borderRadius: "8px",
    marginBottom: "20px",
    color: "#16a34a",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #8b5cf6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    color: "#64748b",
    fontSize: "14px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  summaryCard: {
    padding: "16px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  summaryLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1e293b",
  },
  resultBox: {
    padding: "24px",
    borderRadius: "10px",
    marginBottom: "24px",
    border: "1px solid",
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
    flexShrink: 0,
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
    flexShrink: 0,
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
  violationsSection: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "24px",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 20px 0",
  },
  ruleCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderLeft: "4px solid",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  ruleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  ruleHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  ruleStatus: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
  },
  ruleKey: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  violationCount: {
    fontSize: "12px",
    color: "#dc2626",
    background: "#fee2e2",
    padding: "2px 8px",
    borderRadius: "12px",
  },
  ruleExplanation: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 12px 0",
    paddingLeft: "36px",
  },
  violationsList: {
    background: "#fef2f2",
    borderRadius: "6px",
    padding: "12px",
    marginLeft: "36px",
  },
  violationItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "8px",
  },
  violationBullet: {
    color: "#dc2626",
    fontWeight: "bold",
  },
  violationText: {
    fontSize: "13px",
    color: "#991b1b",
    fontFamily: "monospace",
  },
  actionSection: {
    background: "#f8fafc",
    borderTop: "1px solid #e2e8f0",
    marginTop: "24px",
    paddingTop: "24px",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
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
  saveBtn: {
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
  initialState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    textAlign: "center",
  },
  initialIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  initialTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  initialText: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
    maxWidth: "400px",
  },
};

export default Feasibility;
