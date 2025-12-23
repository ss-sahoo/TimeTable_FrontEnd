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

interface OptimizationSettings {
  max_retries: number;
  max_try_for_slot_assign: number;
  weight_power_fector: number;
  max_one_subject_repetation_per_day: number;
  max_one_subject_repetation_per_day_penalty_fector: number;
  weight_penalty_consu_sub_repetation: number[];
  clear_existing: boolean;
}

const DEFAULT_SETTINGS: OptimizationSettings = {
  max_retries: 1000,
  max_try_for_slot_assign: 100,
  weight_power_fector: 3,
  max_one_subject_repetation_per_day: 2,
  max_one_subject_repetation_per_day_penalty_fector: 0,
  weight_penalty_consu_sub_repetation: [0.01, 0, 0, 0, 0],
  clear_existing: true
};

const Feasibility: React.FC = () => {
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingSlots, setUpdatingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FeasibilityResult | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [generatedTimetable, setGeneratedTimetable] = useState<any>(null);
  const [payload, setPayload] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<OptimizationSettings>(DEFAULT_SETTINGS);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [brokenRules, setBrokenRules] = useState<string[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [stopSlot, setStopSlot] = useState<string>("");
  
  // Progress tracking for async optimization
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; fitness?: number } | null>(null);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // State for checking if timetable has existing slots
  const [checkingSlots, setCheckingSlots] = useState(true);
  const [hasExistingSlots, setHasExistingSlots] = useState(false);
  const [batchesData, setBatchesData] = useState<any>(null);

  /* Get timetable ID from localStorage */
  useEffect(() => {
    const rawId = localStorage.getItem("timetable_id");
    if (rawId) {
      const cleanId = cleanTimetableId(rawId);
      console.log("Feasibility - Timetable ID loaded:", cleanId);
      setTimetableId(cleanId);
    }
  }, []);

  /* Check if timetable has existing slots on load */
  const checkExistingSlots = useCallback(async () => {
    if (!timetableId) {
      setCheckingSlots(false);
      return;
    }

    setCheckingSlots(true);
    try {
      console.log("Checking existing slots for timetable:", timetableId);
      const response = await Fetch(`/api/timetable/timetables/${timetableId}/batches/`, {
        method: "GET",
      });

      if (!response.ok) {
        console.error("Failed to fetch batches:", response.status);
        setCheckingSlots(false);
        return;
      }

      const data = await response.json();
      console.log("Batches data:", data);
      setBatchesData(data);

      // Check if any batch has non-empty slots
      const batches = data.batches || [];
      let slotsExist = false;

      for (const batch of batches) {
        if (batch.slots && typeof batch.slots === 'object') {
          const slotKeys = Object.keys(batch.slots);
          if (slotKeys.length > 0) {
            // Check if any slot key has actual slot data
            for (const key of slotKeys) {
              if (Array.isArray(batch.slots[key]) && batch.slots[key].length > 0) {
                slotsExist = true;
                break;
              }
            }
          }
        }
        if (slotsExist) break;
      }

      console.log("Has existing slots:", slotsExist);
      setHasExistingSlots(slotsExist);

    } catch (err: any) {
      console.error("Error checking existing slots:", err);
    } finally {
      setCheckingSlots(false);
    }
  }, [timetableId]);

  /* Fetch batches data when timetableId changes */
  useEffect(() => {
    if (timetableId) {
      checkExistingSlots();
    }
  }, [timetableId, checkExistingSlots]);

  /* Parse error response to extract broken rules */
  const parseErrorResponse = (errorData: any): string => {
    if (!errorData) {
      return "An unknown error occurred";
    }

    // If errorData is a string, return it
    if (typeof errorData === 'string') {
      return errorData;
    }

    // If errorData has a 'detail' field
    if (errorData.detail) {
      if (typeof errorData.detail === 'string') {
        return errorData.detail;
      }
      return JSON.stringify(errorData.detail);
    }

    // If errorData has violations object
    if (errorData.violations) {
      const brokenRulesList: string[] = [];
      const rules: Record<string, string> = {
        RULE_1: "Each slot must have enough available teachers for all batches",
        RULE_2: "Fixed slot teachers must be available in that slot",
        RULE_3: "Batch must have enough slots to meet minimum class requirements",
        RULE_4: "Batch must not exceed maximum class limit",
        RULE_5: "Batch max classes must be >= min classes remaining",
        RULE_6: "Teacher must have enough available slots to meet their minimum load"
      };

      Object.entries(errorData.violations).forEach(([rule, violations]) => {
        if (Array.isArray(violations) && violations.length > 0) {
          brokenRulesList.push(rule);
        }
      });

      setBrokenRules(brokenRulesList);

      if (brokenRulesList.length > 0) {
        let errorMessage = "Feasibility check failed due to the following rule violations:\n\n";
        brokenRulesList.forEach(rule => {
          errorMessage += `• ${rule}: ${rules[rule as keyof typeof rules]}\n`;
          // Add specific violations if available
          const violations = errorData.violations[rule];
          if (Array.isArray(violations) && violations.length > 0) {
            violations.forEach((violation: string, index: number) => {
              if (index < 3) { // Show only first 3 violations per rule to avoid overwhelming
                errorMessage += `  - ${violation}\n`;
              }
            });
            if (violations.length > 3) {
              errorMessage += `  ... and ${violations.length - 3} more violations\n`;
            }
          }
          errorMessage += "\n";
        });
        return errorMessage;
      }
    }

    // Default fallback
    return JSON.stringify(errorData);
  };

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
    setBrokenRules([]);

    try {
      // Step 1: Get payload from the timetable
      console.log("Fetching payload for timetable:", timetableId);
      const payloadResponse = await Fetch(`/api/timetable/timetables/${timetableId}/payload/`, {
        method: "GET",
      });
      
      if (!payloadResponse.ok) {
        const errorData = await payloadResponse.json().catch(() => null);
        throw new Error(`Failed to fetch payload: ${payloadResponse.status} - ${parseErrorResponse(errorData)}`);
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
        const errorData = await feasibilityResponse.json().catch(() => null);
        throw new Error(parseErrorResponse(errorData));
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

  /* Cleanup polling on unmount */
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  /* Check task status */
  const checkTaskStatus = useCallback(async (taskIdToCheck: string) => {
    try {
      const res = await Fetch(`/api/timetable/tasks/${taskIdToCheck}/status/`, {
        method: "GET",
      });
      if (!res.ok) {
        throw new Error("Failed to check task status");
      }
      return await res.json();
    } catch (err) {
      console.error("Error checking task status:", err);
      throw err;
    }
  }, []);

  /* Cancel generation */
  const handleCancelGeneration = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setGenerating(false);
    setUpdatingSlots(false);
    setTaskId(null);
    setProgress(null);
    setProgressStatus("");
  }, []);

  /* Generate timetable (optimize) */
  const handleGenerateTimetable = useCallback(async () => {
    if (!timetableId) {
      setError("No payload available. Please run feasibility check first.");
      return;
    }

    setGenerating(true);
    setError(null);
    setProgress(null);
    setProgressStatus("Starting optimization...");

    try {
      console.log("Generating timetable (optimize) with settings:", settings);
      
      // Create optimization payload with settings
      const optimizationPayload = {
        max_retries: settings.max_retries,
        max_try_for_slot_assign: settings.max_try_for_slot_assign,
        weight_power_fector: settings.weight_power_fector,
        max_one_subject_repetation_per_day: settings.max_one_subject_repetation_per_day,
        max_one_subject_repetation_per_day_penalty_fector: settings.max_one_subject_repetation_per_day_penalty_fector,
        weight_penalty_consu_sub_repetation: settings.weight_penalty_consu_sub_repetation
      };

      const optimizeResponse = await Fetch(`/api/timetable/timetables/${timetableId}/optimize/`, {
        method: "POST",
        body: JSON.stringify(optimizationPayload),
      });

      if (!optimizeResponse.ok) {
        const errorData = await optimizeResponse.json().catch(() => null);
        throw new Error(`Optimization failed: ${optimizeResponse.status} - ${parseErrorResponse(errorData)}`);
      }

      const { task_id } = await optimizeResponse.json();
      console.log("Optimization task started:", task_id);
      setTaskId(task_id);
      setProgressStatus("Optimization in progress...");

      // Start polling for task status
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const data = await checkTaskStatus(task_id);
          console.log("Task status:", data);

          if (data.status === 'PROGRESS') {
            setProgress({
              current: data.progress?.current || 0,
              total: data.progress?.total || 100,
              fitness: data.progress?.fitness
            });
            setProgressStatus(`Generation ${data.progress?.current || 0}/${data.progress?.total || 100}`);
          } else if (data.status === 'SUCCESS') {
            // Clear polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            setGeneratedTimetable(data.result);
            setGenerating(false);
            setTaskId(null);
            setProgress(null);
            setProgressStatus("");
            
            // Show success message
            const entriesCreated = data.result?.entries_created || 'Unknown';
            alert(`Timetable generated successfully! ${entriesCreated} entries created.`);
          } else if (data.status === 'FAILURE') {
            // Clear polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            
            setGenerating(false);
            setTaskId(null);
            setProgress(null);
            setProgressStatus("");
            setError(data.error || "Optimization failed");
          } else if (data.status === 'PENDING') {
            setProgressStatus("Waiting in queue...");
          }
        } catch (err: any) {
          console.error("Polling error:", err);
          // Don't stop polling on transient errors, but log them
        }
      }, 2000); // Poll every 2 seconds

    } catch (err: any) {
      console.error("Optimization error:", err);
      setError(err.message || "Failed to generate timetable");
      setGenerating(false);
      setProgress(null);
      setProgressStatus("");
    }
  }, [timetableId, settings, checkTaskStatus]);

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
        const errorData = await saveResponse.json().catch(() => null);
        throw new Error(`Save failed: ${saveResponse.status} - ${parseErrorResponse(errorData)}`);
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

  /* Open update modal */
  const handleOpenUpdateModal = () => {
    setShowUpdateModal(true);
    setStopSlot("");
  };

  /* Update old slots with regenerate-from-slot API */
  const handleUpdateOldSlots = useCallback(async () => {
    if (!timetableId) {
      setError("No timetable ID found. Please create a timetable first.");
      return;
    }
    if (!stopSlot.trim()) {
      setError("Please enter a stop slot (e.g., d2_s3)");
      return;
    }
    setUpdatingSlots(true);
    setError(null);
    setProgress(null);
    setProgressStatus("Starting regeneration...");
    
    try {
      console.log("Regenerating timetable from slot:", stopSlot);
      const payload = {
        stop_slot: stopSlot.trim(),
        max_retries: settings.max_retries,
        max_try_for_slot_assign: settings.max_try_for_slot_assign,
        weight_power_fector: settings.weight_power_fector,
        max_one_subject_repetation_per_day: settings.max_one_subject_repetation_per_day
      };
      const updateResponse = await Fetch(`/api/timetable/timetables/${timetableId}/regenerate-from-slot/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => null);
        throw new Error(`Regenerate from slot failed: ${updateResponse.status} - ${parseErrorResponse(errorData)}`);
      }
      const updateData = await updateResponse.json();
      const { task_id } = updateData;
      console.log("Regeneration task started:", task_id);
      setTaskId(task_id);
      setProgressStatus("Regeneration in progress...");
      
      // Close the update modal but keep progress modal
      setShowUpdateModal(false);
      const savedStopSlot = stopSlot.trim();
      setStopSlot("");
      
      // Start polling for task status every 2.5 seconds
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const data = await checkTaskStatus(task_id);
          console.log("Regeneration task status:", data);
          
          if (data.status === 'PROGRESS') {
            setProgress({
              current: data.progress?.current || 0,
              total: data.progress?.total || 100,
              fitness: data.progress?.fitness
            });
            setProgressStatus(`Regeneration ${data.progress?.current || 0}/${data.progress?.total || 100}`);
          } else if (data.status === 'SUCCESS') {
            // Clear polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setUpdatingSlots(false);
            setTaskId(null);
            setProgress(null);
            setProgressStatus("");
            
            // Show success message
            const entriesUpdated = data.result?.entries_updated || 'Unknown';
            alert(`Timetable regenerated successfully from slot ${savedStopSlot}! ${entriesUpdated} entries updated.`);
            
            // Refresh the slots check
            checkExistingSlots();
          } else if (data.status === 'FAILURE') {
            // Clear polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            setUpdatingSlots(false);
            setTaskId(null);
            setProgress(null);
            setProgressStatus("");
            setError(data.error || "Regeneration failed");
          } else if (data.status === 'PENDING') {
            setProgressStatus("Waiting in queue...");
          }
        } catch (err: any) {
          console.error("Regeneration polling error:", err);
          // Don't stop polling on transient errors, but log them
        }
      }, 2500); // Poll every 2.5 seconds
      
    } catch (err: any) {
      console.error("Regenerate from slot error:", err);
      setError(err.message || "Failed to regenerate from slot");
      setUpdatingSlots(false);
      setProgress(null);
      setProgressStatus("");
    }
  }, [timetableId, stopSlot, settings, checkTaskStatus, checkExistingSlots]);

  /* Settings handlers */
  const handleSettingsChange = (key: keyof OptimizationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSettingsChanged(true);
  };

  const handleResetToDefault = () => {
    setSettings(DEFAULT_SETTINGS);
    setSettingsChanged(false);
  };

  const handleApplySettings = () => {
    // Settings are automatically applied when generating
    setShowSettings(false);
    alert("Settings saved. They will be used in the next generation.");
  };

  const handleNumberArrayChange = (index: number, value: string) => {
    const newArray = [...settings.weight_penalty_consu_sub_repetation];
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      newArray[index] = numValue;
      setSettings(prev => ({
        ...prev,
        weight_penalty_consu_sub_repetation: newArray
      }));
      setSettingsChanged(true);
    }
  };

  /* Get violation count for a rule */
  const getViolationCount = (ruleKey: string): number => {
    if (!result?.violations) return 0;
    const violations = result.violations[ruleKey as keyof typeof result.violations];
    return violations?.length || 0;
  };

  return (
    <div style={styles.wrapper}>
      {/* Settings Modal */}
      {showSettings && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Optimization Settings</h3>
              <button 
                style={styles.modalCloseBtn}
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
            </div>

            <div style={styles.settingsGrid}>
              {/* Integer Inputs */}
              <div style={styles.settingField}>
                <label style={styles.settingLabel}>
                  Max Retries
                  <span style={styles.settingDescription}>Maximum number of optimization attempts</span>
                </label>
                <input
                  type="number"
                  value={settings.max_retries}
                  onChange={(e) => handleSettingsChange("max_retries", parseInt(e.target.value) || 0)}
                  style={styles.numberInput}
                  min="1"
                />
              </div>

              <div style={styles.settingField}>
                <label style={styles.settingLabel}>
                  Max Try for Slot Assignment
                  <span style={styles.settingDescription}>Max attempts per slot assignment</span>
                </label>
                <input
                  type="number"
                  value={settings.max_try_for_slot_assign}
                  onChange={(e) => handleSettingsChange("max_try_for_slot_assign", parseInt(e.target.value) || 0)}
                  style={styles.numberInput}
                  min="1"
                />
              </div>

              <div style={styles.settingField}>
                <label style={styles.settingLabel}>
                  Weight Power Factor
                  <span style={styles.settingDescription}>Power factor for weight calculations</span>
                </label>
                <input
                  type="number"
                  value={settings.weight_power_fector}
                  onChange={(e) => handleSettingsChange("weight_power_fector", parseInt(e.target.value) || 0)}
                  style={styles.numberInput}
                  min="0"
                  step="1"
                />
              </div>

              <div style={styles.settingField}>
                <label style={styles.settingLabel}>
                  Max Subject Repetition Per Day
                  <span style={styles.settingDescription}>Maximum times a subject can repeat in a day</span>
                </label>
                <input
                  type="number"
                  value={settings.max_one_subject_repetation_per_day}
                  onChange={(e) => handleSettingsChange("max_one_subject_repetation_per_day", parseInt(e.target.value) || 0)}
                  style={styles.numberInput}
                  min="0"
                />
              </div>

              <div style={styles.settingField}>
                <label style={styles.settingLabel}>
                  Repetition Penalty Factor
                  <span style={styles.settingDescription}>Penalty factor for subject repetition</span>
                </label>
                <input
                  type="number"
                  value={settings.max_one_subject_repetation_per_day_penalty_fector}
                  onChange={(e) => handleSettingsChange("max_one_subject_repetation_per_day_penalty_fector", parseFloat(e.target.value) || 0)}
                  style={styles.numberInput}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Weight Penalty Array */}
              <div style={styles.settingFieldFull}>
                <label style={styles.settingLabel}>
                  Weight Penalty for Consecutive Subject Repetition
                  <span style={styles.settingDescription}>Penalties for consecutive days (0-4 days)</span>
                </label>
                <div style={styles.arrayInputs}>
                  {settings.weight_penalty_consu_sub_repetation.map((value, index) => (
                    <div key={index} style={styles.arrayInputWrapper}>
                      <span style={styles.arrayLabel}>Day {index}</span>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleNumberArrayChange(index, e.target.value)}
                        style={styles.arrayInput}
                        step="0.01"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button 
                style={styles.defaultBtn}
                onClick={handleResetToDefault}
                disabled={!settingsChanged}
              >
                Reset to Default
              </button>
              <div style={styles.modalActions}>
                <button 
                  style={styles.cancelBtn}
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </button>
                <button 
                  style={styles.applyBtn}
                  onClick={handleApplySettings}
                >
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Old Slots Modal */}
      {showUpdateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Update Old Slots</h3>
              <button 
                style={styles.modalCloseBtn}
                onClick={() => {
                  setShowUpdateModal(false);
                  setStopSlot("");
                }}
              >
                ×
              </button>
            </div>
            <div style={styles.updateModalBody}>
              <p style={styles.updateModalDescription}>
                Enter the slot code from which you want to regenerate the timetable. 
                All slots from this point onwards will be regenerated.
              </p>
              <div style={styles.settingField}>
                <label style={styles.settingLabel}>
                  Stop Slot Code
                  <span style={styles.settingDescription}>e.g., d2_s3, d1_s1, d3_s4</span>
                </label>
                <input
                  type="text"
                  value={stopSlot}
                  onChange={(e) => setStopSlot(e.target.value)}
                  placeholder="Enter slot code (e.g., d2_s3)"
                  style={styles.numberInput}
                />
              </div>
              <div style={styles.updateModalNote}>
                <span style={styles.noteIcon}>ℹ️</span>
                <span style={styles.noteText}>
                  This will regenerate the timetable from the specified slot onwards. 
                  Make sure the slot code exists in your timetable configuration.
                </span>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button 
                style={styles.cancelBtn}
                onClick={() => {
                  setShowUpdateModal(false);
                  setStopSlot("");
                }}
              >
                Cancel
              </button>
              <button 
                style={{
                  ...styles.primaryBtn,
                  opacity: updatingSlots || !stopSlot.trim() ? 0.7 : 1,
                  cursor: updatingSlots || !stopSlot.trim() ? "not-allowed" : "pointer",
                }}
                onClick={handleUpdateOldSlots}
                disabled={updatingSlots || !stopSlot.trim()}
              >
                {updatingSlots ? (
                  <>
                    <div style={styles.buttonSpinnerWhite}></div>
                    Updating...
                  </>
                ) : (
                  "Update Timetable"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Progress Modal */}
      {(generating || updatingSlots) && (
        <div style={styles.modalOverlay}>
          <div style={styles.progressModalContent}>
            <div style={styles.progressModalHeader}>
              <div style={styles.progressIconContainer}>
                <div style={styles.progressSpinner}></div>
              </div>
              <h3 style={styles.progressTitle}>
                {updatingSlots ? "Regenerating Timetable" : "Generating Timetable"}
              </h3>
              <p style={styles.progressSubtitle}>{progressStatus}</p>
            </div>
            
            <div style={styles.progressBody}>
              {/* Progress Bar */}
              <div style={styles.progressBarContainer}>
                <div style={styles.progressBarBackground}>
                  <div 
                    style={{
                      ...styles.progressBarFill,
                      width: progress ? `${Math.min((progress.current / progress.total) * 100, 100)}%` : '0%',
                    }}
                  ></div>
                </div>
                <div style={styles.progressStats}>
                  {progress ? (
                    <>
                      <span style={styles.progressCount}>
                        {progress.current} / {progress.total}
                      </span>
                      <span style={styles.progressPercent}>
                        {Math.round((progress.current / progress.total) * 100)}%
                      </span>
                    </>
                  ) : (
                    <span style={styles.progressCount}>Initializing...</span>
                  )}
                </div>
              </div>

              {/* Fitness Score */}
              {progress?.fitness !== undefined && (
                <div style={styles.fitnessContainer}>
                  <span style={styles.fitnessLabel}>Fitness Score:</span>
                  <span style={styles.fitnessValue}>{progress.fitness.toLocaleString()}</span>
                </div>
              )}

              {/* Info Message */}
              <div style={styles.progressInfo}>
                <span style={styles.progressInfoIcon}>💡</span>
                <span style={styles.progressInfoText}>
                  {updatingSlots 
                    ? "The system is regenerating your timetable from the specified slot onwards. This may take a few minutes."
                    : "The optimization algorithm is finding the best timetable arrangement. This may take a few minutes depending on the complexity."
                  }
                </span>
              </div>
            </div>

            <div style={styles.progressFooter}>
              <button 
                style={styles.cancelGenerationBtn}
                onClick={handleCancelGeneration}
              >
                {updatingSlots ? "Cancel Regeneration" : "Cancel Generation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Timetable Feasibility Check</h3>
          <p style={styles.subtitle}>
            {hasExistingSlots 
              ? "Manage your existing timetable or generate a new one"
              : "Check whether timetable can be generated with current configuration"
            }
          </p>
        </div>
        
        {/* Start Feasibility Button - Only show when no existing slots */}
        {!hasExistingSlots && (
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
        )}
      </div>

      {/* Error Display - Enhanced with broken rules */}
      {error && (
        <div style={styles.errorAlert}>
          <div style={styles.errorContent}>
            <div style={styles.errorIcon}>❌</div>
            <div style={styles.errorMessage}>
              <div style={styles.errorTitle}>Feasibility Check Failed</div>
              <div style={styles.errorText}>{error}</div>
              {brokenRules.length > 0 && (
                <div style={styles.brokenRulesSection}>
                  <div style={styles.brokenRulesTitle}>Broken Rules:</div>
                  {brokenRules.map((rule, index) => {
                    const ruleExplanations: Record<string, string> = {
                      RULE_1: "Each slot must have enough available teachers for all batches",
                      RULE_2: "Fixed slot teachers must be available in that slot",
                      RULE_3: "Batch must have enough slots to meet minimum class requirements",
                      RULE_4: "Batch must not exceed maximum class limit",
                      RULE_5: "Batch max classes must be >= min classes remaining",
                      RULE_6: "Teacher must have enough available slots to meet their minimum load"
                    };
                    return (
                      <div key={index} style={styles.brokenRuleItem}>
                        <span style={styles.brokenRuleName}>{rule}:</span>
                        <span style={styles.brokenRuleDescription}>{ruleExplanations[rule] || "Unknown rule"}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
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

              {/* Only show Update Old Slots when slots exist */}
              {hasExistingSlots && (
                <button 
                  style={styles.updateSlotsBtn}
                  onClick={handleOpenUpdateModal}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Update Old Slots
                </button>
              )}

              <button 
                style={styles.secondaryBtn}
                onClick={() => setShowSettings(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Settings
              </button>
              
              {/* Show Generate button based on feasibility and slot status */}
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
                      {hasExistingSlots ? "Generate New Timetable" : "Proceed to Generate"}
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
      {!loading && !hasRun && timetableId && !checkingSlots && (
        <div style={styles.initialState}>
          <div style={styles.initialIcon}>{hasExistingSlots ? "📊" : "🔍"}</div>
          <h3 style={styles.initialTitle}>
            {hasExistingSlots ? "Timetable Has Existing Data" : "Ready to Check Feasibility"}
          </h3>
          <p style={styles.initialText}>
            {hasExistingSlots 
              ? "This timetable already has generated slots. You can update existing slots or generate a new timetable."
              : "Click \"Start Feasibility Check\" to verify if your timetable configuration is valid and can be generated."
            }
          </p>
          {hasExistingSlots && batchesData?.batches && (
            <div style={styles.existingSlotsInfo}>
              <div style={styles.existingSlotsTitle}>Current Batches:</div>
              {batchesData.batches.map((batch: any, index: number) => (
                <div key={index} style={styles.batchInfoItem}>
                  <span style={styles.batchName}>{batch.batch_name}</span>
                  <span style={styles.batchProgram}>{batch.program}</span>
                  <span style={styles.batchSlotCount}>
                    {Object.keys(batch.slots || {}).length > 0 
                      ? `${Object.values(batch.slots || {}).flat().length} slots`
                      : "No slots"
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {/* Show action buttons when existing slots are detected */}
          {hasExistingSlots && (
            <div style={styles.existingSlotsActions}>
              <button 
                style={styles.updateSlotsBtn}
                onClick={handleOpenUpdateModal}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Update Old Slots
              </button>
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
                      <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Generate New Timetable
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading state while checking slots */}
      {!loading && !hasRun && timetableId && checkingSlots && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Checking timetable status...</p>
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
    position: "relative",
  },
  
  // Enhanced Error Styles
  errorAlert: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    marginBottom: "20px",
    color: "#dc2626",
  },
  errorContent: {
    display: "flex",
    gap: "12px",
    flex: 1,
  },
  errorIcon: {
    fontSize: "20px",
    flexShrink: 0,
    marginTop: "2px",
  },
  errorMessage: {
    flex: 1,
  },
  errorTitle: {
    fontWeight: "600",
    fontSize: "14px",
    marginBottom: "4px",
  },
  errorText: {
    fontSize: "13px",
    lineHeight: "1.4",
    whiteSpace: "pre-line",
    marginBottom: "12px",
  },
  brokenRulesSection: {
    marginTop: "12px",
    padding: "12px",
    background: "rgba(220, 38, 38, 0.05)",
    border: "1px solid rgba(220, 38, 38, 0.2)",
    borderRadius: "6px",
  },
  brokenRulesTitle: {
    fontWeight: "600",
    fontSize: "13px",
    marginBottom: "8px",
    color: "#991b1b",
  },
  brokenRuleItem: {
    display: "flex",
    gap: "8px",
    marginBottom: "6px",
    alignItems: "flex-start",
  },
  brokenRuleName: {
    fontWeight: "600",
    fontSize: "12px",
    color: "#dc2626",
    flexShrink: 0,
    minWidth: "70px",
  },
  brokenRuleDescription: {
    fontSize: "12px",
    color: "#991b1b",
    lineHeight: "1.4",
  },
  errorCloseBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#dc2626",
    marginLeft: "8px",
    padding: "0",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
  },
  
  // ... (all other styles remain exactly the same) ...
  
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
  updateSlotsBtn: {
    padding: "10px 20px",
    background: "#f59e0b",
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
  existingSlotsInfo: {
    marginTop: "20px",
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
    width: "100%",
    maxWidth: "500px",
  },
  existingSlotsTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0369a1",
    marginBottom: "12px",
  },
  batchInfoItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    background: "#ffffff",
    borderRadius: "6px",
    marginBottom: "8px",
    border: "1px solid #e2e8f0",
  },
  batchName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
  },
  batchProgram: {
    fontSize: "12px",
    color: "#64748b",
  },
  batchSlotCount: {
    fontSize: "12px",
    color: "#0369a1",
    background: "#dbeafe",
    padding: "2px 8px",
    borderRadius: "12px",
    fontWeight: "500",
  },
  existingSlotsActions: {
    display: "flex",
    gap: "16px",
    marginTop: "24px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  
  // Header
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
  
  // Modal Styles
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
    padding: "20px",
  },
  modalContent: {
    background: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    maxWidth: "800px",
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 24px 16px",
    borderBottom: "1px solid #e2e8f0",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  modalCloseBtn: {
    background: "none",
    border: "none",
    fontSize: "24px",
    color: "#64748b",
    cursor: "pointer",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
  },
  settingsGrid: {
    padding: "24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
  },
  settingField: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  settingFieldFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  settingLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  settingDescription: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "400",
  },
  numberInput: {
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#1e293b",
    background: "#ffffff",
  },
  arrayInputs: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "12px",
    marginTop: "8px",
  },
  arrayInputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  arrayLabel: {
    fontSize: "12px",
    color: "#64748b",
  },
  arrayInput: {
    padding: "8px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#1e293b",
    background: "#ffffff",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
    background: "#f8fafc",
  },
  defaultBtn: {
    padding: "8px 16px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    opacity: 0.7,
    transition: "all 0.2s",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
  },
  cancelBtn: {
    padding: "8px 16px",
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  applyBtn: {
    padding: "8px 20px",
    background: "#8b5cf6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  // Update Modal Styles
  updateModalBody: {
    padding: "24px",
  },
  updateModalDescription: {
    fontSize: "14px",
    color: "#475569",
    marginBottom: "20px",
    lineHeight: "1.5",
  },
  updateModalNote: {
    display: "flex",
    gap: "12px",
    padding: "16px",
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "8px",
    alignItems: "flex-start",
    marginTop: "16px",
  },
  noteIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  noteText: {
    fontSize: "13px",
    color: "#0369a1",
    lineHeight: "1.4",
  },
  // Progress Modal Styles
  progressModalContent: {
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    maxWidth: "480px",
    width: "100%",
    overflow: "hidden",
  },
  progressModalHeader: {
    padding: "32px 24px 24px",
    textAlign: "center",
    background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
    color: "#ffffff",
  },
  progressIconContainer: {
    width: "64px",
    height: "64px",
    margin: "0 auto 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  progressSpinner: {
    width: "48px",
    height: "48px",
    border: "4px solid rgba(255, 255, 255, 0.3)",
    borderTop: "4px solid #ffffff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  progressTitle: {
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 8px 0",
  },
  progressSubtitle: {
    fontSize: "14px",
    opacity: 0.9,
    margin: 0,
  },
  progressBody: {
    padding: "24px",
  },
  progressBarContainer: {
    marginBottom: "20px",
  },
  progressBarBackground: {
    height: "12px",
    background: "#e2e8f0",
    borderRadius: "6px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)",
    borderRadius: "6px",
    transition: "width 0.3s ease-out",
  },
  progressStats: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressCount: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },
  progressPercent: {
    fontSize: "14px",
    color: "#8b5cf6",
    fontWeight: "600",
  },
  fitnessContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    background: "#f8fafc",
    borderRadius: "8px",
    marginBottom: "20px",
  },
  fitnessLabel: {
    fontSize: "13px",
    color: "#64748b",
  },
  fitnessValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },
  progressInfo: {
    display: "flex",
    gap: "12px",
    padding: "14px 16px",
    background: "#fef3c7",
    border: "1px solid #fcd34d",
    borderRadius: "8px",
    alignItems: "flex-start",
  },
  progressInfoIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  progressInfoText: {
    fontSize: "13px",
    color: "#92400e",
    lineHeight: "1.4",
  },
  progressFooter: {
    padding: "16px 24px 24px",
    display: "flex",
    justifyContent: "center",
  },
  cancelGenerationBtn: {
    padding: "10px 24px",
    background: "#ffffff",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default Feasibility;