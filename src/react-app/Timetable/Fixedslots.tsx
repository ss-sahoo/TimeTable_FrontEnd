import React, { useEffect, useState, useRef, useCallback } from "react";
import { assignFixedSlot, deleteFixedSlotById, fetchFixedSlots, fetchCenterTeachers, cleanTimetableId } from "../AllApi";
import { Fetch } from "../usefetch";
import { useTimetableCenter } from "../contexts/TimetableCenterContext";

/* ================= TYPES ================= */
interface SlotData {
  slot_id: string;
  slot_code: string;
  start_time: string;
  end_time: string;
  is_free_class: boolean;
  is_assigned: boolean;
  subject: string | null;
  teacher_code: string | null;
  teacher_name: string | null;
  is_fixed: boolean;
  fixed_slot_id?: string;
  id?: string;  // API might return 'id' instead of 'fixed_slot_id'
}

interface DayData {
  day: string;
  day_number: number;
  date: string;
  slots: SlotData[];
}

interface BatchSummary {
  batch_id: string;
  batch_code: string;
  batch_name: string;
}

interface BatchDetailData {
  batch_id: string;
  batch_code: string;
  batch_name: string;
  days: DayData[];
}

interface BatchWiseSlotsResponse {
  timetable_id: string;
  timetable: string;
  center: string;
  from_date: string;
  to_date: string;
  batches: BatchSummary[];
}

interface BatchDetailResponse {
  timetable_id: string;
  timetable: string;
  center: string;
  from_date: string;
  to_date: string;
  batches: BatchDetailData[];
}

interface Teacher {
  id: string;
  name: string;
  code: string;
  subject: string;
  department: string;
  type: 'teacher';
  email?: string;
  phone?: string;
}

interface DropdownPosition {
  top: number;
  left: number;
}

/* ================= DAY COLORS ================= */
const DAY_COLORS: { [key: string]: string } = {
  "Monday": "#3B82F6",
  "Tuesday": "#10B981",
  "Wednesday": "#8B5CF6",
  "Thursday": "#F59E0B",
  "Friday": "#EF4444",
  "Saturday": "#EC4899",
  "Sunday": "#06B6D4",
};

/* ================= BATCH COLORS ================= */
const BATCH_COLORS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#84CC16",
];

/* ================= MAIN COMPONENT ================= */
const FixedSlots: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingBatchDetails, setLoadingBatchDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const [timetableInfo, setTimetableInfo] = useState<{ timetable: string; center: string; from_date: string; to_date: string } | null>(null);
  const [batchList, setBatchList] = useState<BatchSummary[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string>("");
  const [activeBatchCode, setActiveBatchCode] = useState<string>("");
  const [activeBatchData, setActiveBatchData] = useState<BatchDetailData | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition | null>(null);
  const [updatingSlot, setUpdatingSlot] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  // Map to store fixed slot IDs: key = "batch_code|slot_code", value = fixed_slot_id
  const [fixedSlotsMap, setFixedSlotsMap] = useState<Map<string, string>>(new Map());
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const { selectedCenterId } = useTimetableCenter();
  const centerId = selectedCenterId || "";

  /* Get timetable ID from localStorage */
  useEffect(() => {
    const rawId = localStorage.getItem("timetable_id");
    if (rawId) {
      const cleanId = cleanTimetableId(rawId);
      console.log("Timetable ID loaded:", cleanId);
      setTimetableId(cleanId);
    } else {
      setError("No timetable ID found. Please create a timetable first.");
      setLoading(false);
    }
  }, []);

  /* Fetch all batches (batch-wise-slots API) */
  const loadBatchList = useCallback(async () => {
    if (!timetableId) return;

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching batch-wise-slots for:", timetableId);
      const response = await Fetch(`/api/timetable/timetables/${timetableId}/batch-wise-slots/`, {
        method: "GET",
      });
      const data: BatchWiseSlotsResponse = await response.json();
      console.log("Batch-wise-slots Response:", data);

      if (data) {
        setTimetableInfo({
          timetable: data.timetable,
          center: data.center,
          from_date: data.from_date,
          to_date: data.to_date,
        });

        if (data.batches && Array.isArray(data.batches) && data.batches.length > 0) {
          setBatchList(data.batches);
          // Auto-select first batch if none selected
          if (!activeBatchId) {
            const firstBatch = data.batches[0];
            setActiveBatchId(firstBatch.batch_id);
            setActiveBatchCode(firstBatch.batch_code);
          }
          console.log("Batches loaded:", data.batches.length);
        } else {
          console.log("No batches in response:", data);
          setBatchList([]);
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch batch list:", err);
      setError(err.message || "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, [timetableId, activeBatchId]);

  /* Fetch batch details (slots for specific batch) */
  const loadBatchDetails = useCallback(async (batchId: string) => {
    if (!timetableId || !batchId) return;

    setLoadingBatchDetails(true);

    try {
      console.log("Fetching batch details for:", batchId);
      const response = await Fetch(`/api/timetable/timetables/${timetableId}/batch-wise-slots/${batchId}/`, {
        method: "GET",
      });
      const data: BatchDetailResponse = await response.json();
      console.log("Batch Details Response:", data);

      if (data && data.batches && data.batches.length > 0) {
        setActiveBatchData(data.batches[0]);
        console.log("Batch details loaded:", data.batches[0].batch_name);
      } else {
        setActiveBatchData(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch batch details:", err);
      setError(err.message || "Failed to load batch details");
    } finally {
      setLoadingBatchDetails(false);
    }
  }, [timetableId]);

  /* Fetch teachers */
  const loadTeachers = useCallback(async () => {
    setLoadingTeachers(true);
    try {
      console.log("Fetching teachers for center:", centerId);
      const data = await fetchCenterTeachers(centerId);
      console.log("Teachers Response:", data);

      const results = data.results || data;
      if (Array.isArray(results)) {
        const formattedTeachers: Teacher[] = results.map((teacher: any) => ({
          id: teacher.id,
          name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.name || 'Unknown',
          code: teacher.teacher_code || `TCH-${teacher.id?.slice(0, 8) || 'XXX'}`,
          subject: teacher.teacher_subjects || teacher.subject || "General",
          department: teacher.department || "General",
          type: 'teacher',
          email: teacher.email,
          phone: teacher.phone
        }));
        setTeachers(formattedTeachers);
      }
    } catch (err: any) {
      console.error("Failed to fetch teachers:", err);
    } finally {
      setLoadingTeachers(false);
    }
  }, [centerId]);

  /* Load fixed slots to get their IDs for deletion */
  const loadFixedSlotsMap = useCallback(async () => {
    if (!timetableId) return;
    try {
      console.log("Fetching fixed slots for mapping:", timetableId);
      const data = await fetchFixedSlots(timetableId);
      const fixedSlots = data.fixed_slots || [];

      // Create a map: "batch_code|slot_code" -> fixed_slot_id
      const newMap = new Map<string, string>();
      fixedSlots.forEach((fs: any) => {
        const key = `${fs.batch_code}|${fs.slot_code}`;
        newMap.set(key, fs.id);
      });
      setFixedSlotsMap(newMap);
      console.log("Fixed slots map loaded:", newMap.size, "entries");
    } catch (err: any) {
      console.error("Failed to fetch fixed slots map:", err);
    }
  }, [timetableId]);

  /* Load batch list when timetableId changes */
  useEffect(() => {
    if (timetableId) {
      loadBatchList();
      loadTeachers();
      loadFixedSlotsMap();
    }
  }, [timetableId, loadBatchList, loadTeachers, loadFixedSlotsMap]);

  /* Load batch details when active batch changes */
  useEffect(() => {
    if (activeBatchId && timetableId) {
      loadBatchDetails(activeBatchId);
    }
  }, [activeBatchId, timetableId, loadBatchDetails]);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isClickInsideDropdown = Object.values(dropdownRefs.current).some(
        ref => ref && ref.contains(event.target as Node)
      );
      if (!isClickInsideDropdown && openDropdown) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  /* Get unique days for active batch */
  const getUniqueDays = (): DayData[] => {
    if (!activeBatchData || !activeBatchData.days) return [];
    return activeBatchData.days.sort((a, b) => a.day_number - b.day_number);
  };

  /* Handle batch selection */
  const handleBatchSelect = (batch: BatchSummary) => {
    setActiveBatchId(batch.batch_id);
    setActiveBatchCode(batch.batch_code);
  };

  /* Format time */
  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  /* Get batch stats from active batch data */
  const getBatchStats = () => {
    if (!activeBatchData || !activeBatchData.days) return { assigned: 0, fixed: 0, total: 0, remaining: 0 };

    let total = 0;
    let assigned = 0;
    let fixed = 0;
    activeBatchData.days.forEach(day => {
      if (day.slots) {
        total += day.slots.length;
        assigned += day.slots.filter(s => s.is_assigned).length;
        fixed += day.slots.filter(s => s.is_fixed).length;
      }
    });
    return { assigned, fixed, total, remaining: total - assigned };
  };

  /* Assign teacher to slot (fixed slot) */
  const handleAssignTeacher = async (slotCode: string, teacher: Teacher) => {
    if (!timetableId || updatingSlot) return;

    const slotKey = `${activeBatchCode}-${slotCode}`;
    setUpdatingSlot(slotKey);

    try {
      console.log("Assigning fixed slot:", { timetableId, slotCode, activeBatchCode, teacher });
      const response = await assignFixedSlot(timetableId, slotCode, activeBatchCode, teacher.code, teacher.subject);

      // Optimistic update with returned ID
      const fixedSlotId = response?.id || response?.fixed_slot_id;
      if (activeBatchData) {
        setActiveBatchData({
          ...activeBatchData,
          days: activeBatchData.days.map(day => ({
            ...day,
            slots: day.slots.map(slot =>
              slot.slot_code === slotCode
                ? {
                  ...slot,
                  is_assigned: true,
                  is_fixed: true,
                  teacher_code: teacher.code,
                  teacher_name: teacher.name,
                  subject: teacher.subject,
                  id: fixedSlotId,
                  fixed_slot_id: fixedSlotId
                }
                : slot
            )
          }))
        });
      }

      setOpenDropdown(null);
      setDropdownPosition(null);
      console.log("Fixed slot assignment successful, ID:", fixedSlotId);

      // Update fixedSlotsMap with new ID
      if (fixedSlotId) {
        const mapKey = `${activeBatchCode}|${slotCode}`;
        const newMap = new Map(fixedSlotsMap);
        newMap.set(mapKey, fixedSlotId);
        setFixedSlotsMap(newMap);
      }

      // Refresh to get the latest data with IDs
      if (activeBatchId) {
        loadBatchDetails(activeBatchId);
        loadFixedSlotsMap();
      }
    } catch (err: any) {
      console.error("Failed to assign:", err);
      setError("Failed to assign teacher. Please try again.");
    } finally {
      setUpdatingSlot(null);
    }
  };

  /* Assign special slot (Exam or Free Period) without teacher */
  const handleAssignSpecialSlot = async (slotCode: string, slotType: 'Exam' | 'Free Period') => {
    if (!timetableId || updatingSlot) return;

    const slotKey = `${activeBatchCode}-${slotCode}`;
    setUpdatingSlot(slotKey);

    try {
      console.log("Assigning special slot:", { timetableId, slotCode, activeBatchCode, slotType });
      // Call API without teacher_code - just timetable_id, slot_code, batch_code, and subject
      const response = await assignFixedSlot(timetableId, slotCode, activeBatchCode, null, slotType);

      // Optimistic update with returned ID
      const fixedSlotId = response?.id || response?.fixed_slot_id;
      if (activeBatchData) {
        setActiveBatchData({
          ...activeBatchData,
          days: activeBatchData.days.map(day => ({
            ...day,
            slots: day.slots.map(slot =>
              slot.slot_code === slotCode
                ? {
                  ...slot,
                  is_assigned: true,
                  is_fixed: true,
                  teacher_code: null,
                  teacher_name: slotType,
                  subject: slotType,
                  id: fixedSlotId,
                  fixed_slot_id: fixedSlotId
                }
                : slot
            )
          }))
        });
      }

      setOpenDropdown(null);
      setDropdownPosition(null);
      console.log("Special slot assignment successful, ID:", fixedSlotId);

      // Update fixedSlotsMap with new ID
      if (fixedSlotId) {
        const mapKey = `${activeBatchCode}|${slotCode}`;
        const newMap = new Map(fixedSlotsMap);
        newMap.set(mapKey, fixedSlotId);
        setFixedSlotsMap(newMap);
      }

      // Refresh to get the latest data with IDs
      if (activeBatchId) {
        loadBatchDetails(activeBatchId);
        loadFixedSlotsMap();
      }
    } catch (err: any) {
      console.error("Failed to assign special slot:", err);
      setError("Failed to assign slot. Please try again.");
    } finally {
      setUpdatingSlot(null);
    }
  };

  /* Remove fixed slot assignment */
  const handleRemoveAssignment = async (slot: SlotData) => {
    if (!timetableId || updatingSlot) return;

    const slotKey = `${activeBatchCode}|${slot.slot_code}`;
    setUpdatingSlot(slotKey);

    try {
      // Get fixed slot ID from multiple sources:
      // 1. From slot data (if available)
      // 2. From fixedSlotsMap (fetched from fixed-slots API)
      const fixedSlotId = slot.fixed_slot_id || slot.id || fixedSlotsMap.get(slotKey);

      if (!fixedSlotId) {
        // Refresh the fixed slots map and try again
        await loadFixedSlotsMap();
        const refreshedId = fixedSlotsMap.get(slotKey);
        if (!refreshedId) {
          setError("Cannot find fixed slot ID. Please refresh the page and try again.");
          setUpdatingSlot(null);
          return;
        }
      }

      const idToDelete = fixedSlotId || fixedSlotsMap.get(slotKey);
      console.log("Removing fixed slot by ID:", { fixedSlotId: idToDelete, slotCode: slot.slot_code, batchCode: activeBatchCode });
      await deleteFixedSlotById(idToDelete!);

      // Update the fixedSlotsMap
      const newMap = new Map(fixedSlotsMap);
      newMap.delete(slotKey);
      setFixedSlotsMap(newMap);

      // Optimistic update
      if (activeBatchData) {
        setActiveBatchData({
          ...activeBatchData,
          days: activeBatchData.days.map(day => ({
            ...day,
            slots: day.slots.map(s =>
              s.slot_code === slot.slot_code
                ? {
                  ...s,
                  is_assigned: false,
                  is_fixed: false,
                  teacher_code: null,
                  teacher_name: null,
                  subject: null,
                  fixed_slot_id: undefined,
                  id: undefined
                }
                : s
            )
          }))
        });
      }

      console.log("Fixed slot removal successful");
    } catch (err: any) {
      console.error("Failed to remove:", err);
      setError("Failed to remove assignment. Please try again.");
    } finally {
      setUpdatingSlot(null);
    }
  };

  /* Handle slot click for dropdown */
  const handleSlotClick = (e: React.MouseEvent, dropdownKey: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    let top = rect.bottom + 8;
    let left = rect.left;

    const estimatedDropdownHeight = 350;
    if (top + estimatedDropdownHeight > viewportHeight - 20) {
      top = rect.top - estimatedDropdownHeight - 8;
    }

    const dropdownWidth = 350;
    if (left + dropdownWidth > window.innerWidth - 20) {
      left = window.innerWidth - dropdownWidth - 20;
    }

    setDropdownPosition({ top, left });
    setOpenDropdown(openDropdown === dropdownKey ? null : dropdownKey);
  };

  const uniqueDays = getUniqueDays();
  const stats = getBatchStats();

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Fixed Slots Assignment</h3>
          <p style={styles.subtitle}>Assign teachers to specific fixed slots for each batch</p>
          {timetableInfo && (
            <div style={styles.infoRow}>
              <span style={styles.infoBadge}>{timetableInfo.center}</span>
              <span style={styles.infoBadge}>{timetableInfo.from_date} to {timetableInfo.to_date}</span>
              <span style={styles.infoBadge}>{batchList.length} Batches</span>
              <span style={styles.infoBadge}>{teachers.length} Teachers</span>
            </div>
          )}
        </div>
        <button
          style={styles.refreshBtn}
          onClick={() => { loadBatchList(); loadTeachers(); }}
          disabled={loading || loadingTeachers}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div style={styles.helpSection}>
          <div style={styles.helpHeader}>
            <span>💡 Click on any slot to assign a teacher. Click × to remove assignment.</span>
            <button style={styles.closeHelpBtn} onClick={() => setShowHelp(false)}>×</button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={styles.errorAlert}>
          <span>{error}</span>
          <button style={styles.errorCloseBtn} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* No Batches State */}
      {batchList.length === 0 && !error ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <p style={styles.emptyText}>No batches found</p>
          <p style={styles.emptySubtext}>Please ensure batches are assigned to this timetable</p>
        </div>
      ) : (
        <>
          {/* Batch Tabs */}
          <div style={styles.tabContainer}>
            {batchList.map((batch, index) => {
              const isActive = activeBatchId === batch.batch_id;
              const color = BATCH_COLORS[index % BATCH_COLORS.length];

              return (
                <button
                  key={batch.batch_id}
                  onClick={() => handleBatchSelect(batch)}
                  style={{
                    ...styles.batchTab,
                    ...(isActive ? styles.activeBatchTab : {}),
                    borderLeftColor: color
                  }}
                >
                  <div style={styles.tabContent}>
                    <div style={{ ...styles.batchDot, backgroundColor: color }}></div>
                    <span style={styles.batchTabName}>{batch.batch_name}</span>
                    <span style={styles.batchCodeBadge}>{batch.batch_code}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Loading Batch Details */}
          {loadingBatchDetails && (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Loading slots...</p>
            </div>
          )}

          {/* Active Batch Content */}
          {activeBatchData && !loadingBatchDetails && (
            <div style={styles.batchContent}>
              {/* Batch Info Header */}
              <div style={styles.batchInfoHeader}>
                <div>
                  <h4 style={styles.activeBatchTitle}>{activeBatchData.batch_name}</h4>
                  <div style={styles.batchDetails}>
                    <span>Code: {activeBatchData.batch_code}</span>
                  </div>
                </div>
                <div style={styles.batchStats}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Total Slots:</span>
                    <span style={styles.statValue}>{stats.total}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Assigned:</span>
                    <span style={styles.statValue}>{stats.assigned}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Fixed:</span>
                    <span style={styles.statValue}>{stats.fixed}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Remaining:</span>
                    <span style={styles.statValue}>{stats.remaining}</span>
                  </div>
                </div>
              </div>

              {/* Days & Slots Table */}
              <div style={styles.tableContainer}>
                <div style={styles.tableWrapper}>
                  {/* Header Row */}
                  <div style={styles.tableHeader}>
                    <div style={styles.dayHeaderColumn}>Day / Date</div>
                    <div style={styles.slotsHeaderColumn}>Slots</div>
                  </div>

                  {/* Day Rows */}
                  {uniqueDays.map(day => (
                    <div key={`${day.date}-${day.day}`} style={styles.dayRow}>
                      {/* Day Info */}
                      <div style={{
                        ...styles.dayColumn,
                        backgroundColor: `${DAY_COLORS[day.day] || '#6B7280'}15`
                      }}>
                        <div style={{
                          ...styles.dayDot,
                          backgroundColor: DAY_COLORS[day.day] || '#6B7280'
                        }} />
                        <div style={styles.dayInfo}>
                          <span style={styles.dayName}>{day.day}</span>
                          <span style={styles.dayDate}>{day.date}</span>
                        </div>
                      </div>

                      {/* Slots */}
                      <div style={styles.slotsColumn}>
                        <div style={styles.slotsGrid}>
                          {day.slots && day.slots.length > 0 ? (
                            day.slots.map(slot => {
                              // Use | as separator to avoid conflicts with batch_code containing -
                              const dropdownKey = `${activeBatchCode}|${slot.slot_code}`;
                              const isUpdating = updatingSlot === dropdownKey;
                              const isAssigned = slot.is_assigned;
                              const isFixed = slot.is_fixed;

                              return (
                                <div key={slot.slot_id} style={styles.slotContainer}>
                                  <div
                                    onClick={(e) => !isFixed && handleSlotClick(e, dropdownKey)}
                                    style={{
                                      ...styles.slotCell,
                                      backgroundColor: isFixed ? '#fef3c7' : '#ffffff',
                                      borderColor: isFixed ? '#fcd34d' : '#e2e8f0',
                                      opacity: isUpdating ? 0.5 : 1,
                                      cursor: isUpdating ? 'wait' : isFixed ? 'default' : 'pointer'
                                    }}
                                  >
                                    <div style={styles.slotTime}>
                                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                    </div>
                                    <div style={styles.slotCodeRow}>
                                      <span style={styles.slotCode}>{slot.slot_code}</span>
                                      {isFixed && <span style={styles.fixedBadge}>FIXED</span>}
                                    </div>

                                    {isFixed ? (
                                      <div style={styles.assignedInfo}>
                                        <strong style={styles.teacherName}>{slot.teacher_name || slot.subject}</strong>
                                        {slot.teacher_code && <span style={styles.teacherCode}>{slot.teacher_code}</span>}
                                        {slot.teacher_name && slot.subject && <span style={styles.subjectText}>{slot.subject}</span>}
                                        <button
                                          style={styles.removeButton}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveAssignment(slot);
                                          }}
                                          disabled={isUpdating}
                                          title="Remove fixed slot assignment"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={styles.assignPrompt}>
                                        + Assign Fixed Slot
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <span style={styles.noSlots}>No slots</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Teacher Selection Dropdown */}
      {openDropdown && dropdownPosition && (
        <div
          ref={(el) => { if (el) dropdownRefs.current[openDropdown] = el; }}
          style={{
            ...styles.assignmentDropdown,
            position: "fixed",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
        >
          <div style={styles.dropdownHeader}>
            <span style={styles.dropdownTitle}>Assign Slot</span>
            <button
              style={styles.closeDropdown}
              onClick={() => { setOpenDropdown(null); setDropdownPosition(null); }}
            >
              ×
            </button>
          </div>

          {/* Special Slots Section */}
          <div style={styles.specialSlotsSection}>
            <div style={styles.sectionLabel}>Quick Assign</div>
            <div style={styles.specialSlotsRow}>
              <button
                style={styles.examButton}
                onClick={() => {
                  const slotCode = openDropdown.split('|')[1];
                  handleAssignSpecialSlot(slotCode, 'Exam');
                }}
              >
                📝 Exam
              </button>
              <button
                style={styles.freeButton}
                onClick={() => {
                  const slotCode = openDropdown.split('|')[1];
                  handleAssignSpecialSlot(slotCode, 'Free Period');
                }}
              >
                ☕ Free Period
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={styles.dropdownDivider}>
            <span style={styles.dividerText}>or select a teacher</span>
          </div>

          <div style={styles.itemsList}>
            {loadingTeachers ? (
              <div style={styles.loadingText}>Loading teachers...</div>
            ) : teachers.length === 0 ? (
              <div style={styles.noTeachersMessage}>No teachers available</div>
            ) : (
              teachers.map(teacher => (
                <div
                  key={teacher.id}
                  style={styles.itemCard}
                  onClick={() => {
                    // Extract slot_code from dropdown key (format: "BATCH_CODE|slot_code")
                    const slotCode = openDropdown.split('|')[1];
                    handleAssignTeacher(slotCode, teacher);
                  }}
                >
                  <div style={styles.itemMainInfo}>
                    <strong>{teacher.name}</strong>
                    <span style={styles.itemCode}>{teacher.code}</span>
                  </div>
                  <div style={styles.itemDetails}>
                    {teacher.subject} • {teacher.department}
                  </div>
                </div>
              ))
            )}
          </div>
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
  loadingState: {
    padding: "40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #f3f3f3",
    borderTop: "3px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorState: {
    padding: "40px",
    textAlign: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
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
  timetableSelector: {
    padding: "8px 12px",
    background: "#f0f9ff",
    borderRadius: "6px",
    border: "1px solid #bae6fd",
  },
  timetableLabel: {
    fontSize: "12px",
    color: "#0369a1",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  timetableSelect: {
    padding: "6px 10px",
    borderRadius: "4px",
    border: "1px solid #94a3b8",
    background: "#ffffff",
    fontSize: "12px",
    color: "#1e293b",
    minWidth: "150px",
  },
  refreshButton: {
    padding: "8px 16px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  saveButtons: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  unsavedIndicator: {
    fontSize: "12px",
    color: "#EF4444",
    fontWeight: "500",
    marginRight: "8px",
  },
  saveBtn: {
    padding: "10px 20px",
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  saveNextBtn: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  helpSection: {
    marginBottom: "24px",
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
    position: "relative",
  },
  helpHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  helpTitleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  helpIcon: {
    fontSize: "16px",
  },
  helpTitle: {
    fontWeight: "600",
    color: "#0369a1",
    fontSize: "15px",
  },
  closeHelpBtn: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "1px solid #94a3b8",
    background: "#ffffff",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0",
  },
  helpList: {
    margin: "0",
    paddingLeft: "20px",
    color: "#0c4a6e",
    fontSize: "14px",
    lineHeight: "1.6",
  },
  centerInfoBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
    marginBottom: "16px",
  },
  centerInfo: {
    fontSize: "14px",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  infoSeparator: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  codeText: {
    background: "#dbeafe",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "12px",
    fontFamily: "monospace",
  },
  tabContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
  },
  batchTabWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    position: "relative",
  },
  batchTab: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    color: "#475569",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    borderLeft: "4px solid transparent",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  activeBatchTab: {
    background: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },
  tabContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: "12px",
  },
  tabLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  batchDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
  },
  batchTabName: {
    fontSize: "14px",
    fontWeight: "500",
  },
  tabStats: {
    fontSize: "12px",
  },
  statBadge: {
    background: "rgba(255,255,255,0.2)",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "500",
  },
  batchCodeBadge: {
    background: "rgba(255,255,255,0.2)",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "500",
    fontFamily: "monospace",
  },
  slotCodeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  fixedBadge: {
    background: "#f59e0b",
    color: "#ffffff",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "9px",
    fontWeight: "600",
  },
  refreshBtn: {
    padding: "8px 16px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  loadingContainer: {
    padding: "40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  infoRow: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    flexWrap: "wrap",
  },
  infoBadge: {
    background: "#f0f9ff",
    color: "#0369a1",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    border: "1px solid #bae6fd",
  },
  emptyState: {
    padding: "60px 40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  emptyIcon: {
    fontSize: "48px",
  },
  emptyText: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  emptySubtext: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
  },
  errorAlert: {
    padding: "12px 16px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "8px",
    marginBottom: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#dc2626",
  },
  errorCloseBtn: {
    background: "none",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "18px",
    padding: "0",
  },
  tableContainer: {
    overflow: "auto",
  },
  tableWrapper: {
    minWidth: "800px",
  },
  slotsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  dayDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  dayInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  dayDate: {
    fontSize: "12px",
    color: "#64748b",
  },
  noSlots: {
    color: "#94a3b8",
    fontStyle: "italic",
    fontSize: "13px",
  },
  assignedInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    position: "relative",
    paddingRight: "24px",
  },
  teacherName: {
    fontSize: "13px",
    color: "#1e293b",
  },
  teacherCode: {
    fontSize: "11px",
    color: "#64748b",
    fontFamily: "monospace",
  },
  slotCode: {
    fontSize: "11px",
    color: "#64748b",
    fontFamily: "monospace",
  },
  batchContent: {
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    overflow: "visible",
  },
  batchInfoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
  },
  batchInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  batchColorDot: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
  },
  activeBatchTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0 0 4px 0",
  },
  batchDetails: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    fontSize: "14px",
    color: "#64748b",
  },
  batchStats: {
    display: "flex",
    gap: "24px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  statLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
  },
  noSlotsMessage: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
  },
  goToSlotsBtn: {
    marginTop: "16px",
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
  gridContainer: {
    background: "#ffffff",
    position: "relative",
    overflow: "visible",
  },
  tableHeader: {
    display: "flex",
    background: "#f1f5f9",
    borderBottom: "2px solid #e2e8f0",
  },
  dayHeaderColumn: {
    width: "180px",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
  },
  slotsHeaderColumn: {
    flex: "1",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
  },
  grid: {
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
  },
  dayRow: {
    display: "flex",
    borderBottom: "1px solid #f1f5f9",
    position: "relative",
    overflow: "visible",
  },
  dayColumn: {
    width: "180px",
    padding: "16px",
    background: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
  },
  dayCell: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  dayColorDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
  },
  dayName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },
  daySlotCount: {
    fontSize: "13px",
    color: "#64748b",
  },
  slotsColumn: {
    flex: "1",
    padding: "16px",
    position: "relative",
    overflow: "visible",
  },
  slotsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    position: "relative",
    overflow: "visible",
  },
  emptyDayMessage: {
    padding: "20px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  slotContainer: {
    position: "relative",
    marginBottom: "8px",
  },
  slotCell: {
    minWidth: "220px",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "relative",
    transition: "all 0.2s",
  },
  assignedSlot: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    position: "relative",
    paddingRight: "20px",
  },
  unassignedSlot: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  slotTime: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
  teacherInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  subjectText: {
    fontSize: "14px",
    color: "#1e293b",
    fontWeight: "600",
  },
  teacherDetails: {
    fontSize: "12px",
    color: "#475569",
  },
  assignPrompt: {
    fontSize: "13px",
    color: "#2563eb",
    fontWeight: "500",
    fontStyle: "italic",
  },
  removeButton: {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownArrow: {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    fontSize: "10px",
    color: "#94a3b8",
  },
  assignmentDropdown: {
    width: "600px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    zIndex: 9999,
  },
  dropdownHeader: {
    padding: "12px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: "8px 8px 0 0",
  },
  dropdownTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
  },
  closeDropdown: {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1px",
    background: "#e2e8f0",
    borderRadius: "0 0 8px 8px",
    overflow: "hidden",
  },
  dropdownSection: {
    background: "#ffffff",
    padding: "16px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
  },
  sectionIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    color: "#ffffff",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  loadingText: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "normal",
  },
  itemsList: {
    maxHeight: "250px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  itemCard: {
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    marginBottom: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    background: "#ffffff",
  },
  itemMainInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  itemCode: {
    fontSize: "11px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  itemDetails: {
    fontSize: "12px",
    color: "#64748b",
    lineHeight: "1.4",
  },
  periodBadge: {
    fontSize: "10px",
    color: "#ffffff",
    padding: "2px 8px",
    borderRadius: "12px",
    fontWeight: "500",
  },
  noTeachersMessage: {
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "13px",
  },
  specialSlotsSection: {
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
  },
  sectionLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  specialSlotsRow: {
    display: "flex",
    gap: "8px",
  },
  examButton: {
    flex: 1,
    padding: "10px 16px",
    background: "#fef3c7",
    color: "#92400e",
    border: "1px solid #fcd34d",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  freeButton: {
    flex: 1,
    padding: "10px 16px",
    background: "#d1fae5",
    color: "#065f46",
    border: "1px solid #a7f3d0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    transition: "all 0.2s",
  },
  dropdownDivider: {
    padding: "8px 16px",
    background: "#f8fafc",
    textAlign: "center",
  },
  dividerText: {
    fontSize: "11px",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
};

// Add CSS animation for spinner
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default FixedSlots;