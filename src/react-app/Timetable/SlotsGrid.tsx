import React, { useState, useEffect, useRef } from "react";

// All days including Sunday
const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Day abbreviations for slot labels
const DAY_ABBREVIATIONS: Record<string, string> = {
  "Monday": "M",
  "Tuesday": "TU",
  "Wednesday": "WE",
  "Thursday": "TH",
  "Friday": "FR",
  "Saturday": "SA",
  "Sunday": "SU"
};

// Time options for dropdown
const TIME_OPTIONS = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
  "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM",
  "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM",
  "10:00 PM"
];

interface DaySlots {
  day: string;
  slots: Array<{
    id: string; // Fixed: M1, M2, etc.
    time: string; // Editable time: "8:00 AM - 9:00 AM"
  }>;
  color: string;
  startDate?: string;
  endDate?: string;
}

// Color palette for different days
const DAY_COLORS = [
  "#3B82F6", // Monday - Blue
  "#10B981", // Tuesday - Green
  "#8B5CF6", // Wednesday - Purple
  "#F59E0B", // Thursday - Amber
  "#EF4444", // Friday - Red
  "#EC4899", // Saturday - Pink
  "#06B6D4", // Sunday - Cyan
];

// Define the structure for saved data
interface SavedSlotsData {
  days: DaySlots[];
  lastSaved: string;
  settings?: {
    selectedDays?: string[];
    startDate?: string;
    endDate?: string;
  };
}

// Day selection mode
type DaySelectionMode = "dropdown" | "calendar";

// Helper function to convert time string to index
const timeToIndex = (time: string): number => {
  return TIME_OPTIONS.indexOf(time);
};

// Helper function to get next hour time
const getNextHourTime = (time: string): string => {
  const index = timeToIndex(time);
  if (index === -1 || index >= TIME_OPTIONS.length - 4) {
    // If not found or near end, return default
    return "9:00 AM";
  }
  // Find next hour (skip 30 minute increments)
  for (let i = index + 1; i < TIME_OPTIONS.length; i++) {
    if (TIME_OPTIONS[i].includes(":00")) {
      return TIME_OPTIONS[i];
    }
  }
  return TIME_OPTIONS[Math.min(index + 2, TIME_OPTIONS.length - 1)];
};

const SlotsGrid: React.FC = () => {
  // Load saved data from localStorage on initial render
  const loadSavedData = (): DaySlots[] => {
    try {
      const savedData = localStorage.getItem("timetableSlots");
      if (savedData) {
        const parsedData: SavedSlotsData = JSON.parse(savedData);
        // Convert old format to new format if needed
        if (parsedData.days && parsedData.days.length > 0 && typeof parsedData.days[0].slots[0] === 'string') {
          // Convert from string array to object array
          return parsedData.days.map(day => ({
            ...day,
            slots: (day.slots as unknown as string[]).map((slot, index) => {
              const match = (slot as string).match(/([A-Z]+\d+):\s*(.+)/);
              return {
                id: match ? match[1] : `${DAY_ABBREVIATIONS[day.day]}${index + 1}`,
                time: match ? match[2] : "8:00 AM - 9:00 AM"
              };
            })
          }));
        }
        return parsedData.days || [{ 
          day: "Monday", 
          slots: [{ id: "M1", time: "8:00 AM - 9:00 AM" }], 
          color: DAY_COLORS[0] 
        }];
      }
    } catch (error) {
      console.error("Failed to load saved data:", error);
    }
    // Default initial state
    return [{ 
      day: "Monday", 
      slots: [{ id: "M1", time: "8:00 AM - 9:00 AM" }], 
      color: DAY_COLORS[0] 
    }];
  };

  const [days, setDays] = useState<DaySlots[]>(loadSavedData);
  const [editingSlot, setEditingSlot] = useState<{dayIndex: number, slotIndex: number} | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");
  const [showDayDropdown, setShowDayDropdown] = useState<number | null>(null);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState<DaySelectionMode>("dropdown");
  const [selectedDays, setSelectedDays] = useState<string[]>(["Monday"]);
  const [calendarRange, setCalendarRange] = useState({
    startDate: "",
    endDate: ""
  });
  const [editingTime, setEditingTime] = useState<{from: string, to: string}>({ from: "8:00 AM", to: "9:00 AM" });
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number} | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  
  // Add the missing state variables
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>("");
  
  const dropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load settings on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("timetableSlots");
      if (savedData) {
        const parsedData: SavedSlotsData = JSON.parse(savedData);
        setLastSavedTime(parsedData.lastSaved || "");
        if (parsedData.settings) {
          setSelectedDays(parsedData.settings.selectedDays || ["Monday"]);
          setCalendarRange({
            startDate: parsedData.settings.startDate || "",
            endDate: parsedData.settings.endDate || ""
          });
        }
      }
    } catch (error) {
      console.error("Failed to load saved time:", error);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDayDropdown !== null) {
        // Check if click is outside all dropdowns
        const clickedOutside = dropdownRefs.current.every(
          (ref, index) => index !== showDayDropdown || !ref?.contains(event.target as Node)
        );
        
        if (clickedOutside && event.target) {
          setShowDayDropdown(null);
          setDropdownPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDayDropdown]);

  // Get available days (days not yet added)
  const getAvailableDays = () => {
    const currentDays = days.map(d => d.day);
    return ALL_DAYS.filter(day => !currentDays.includes(day));
  };

  // Generate slot ID based on day and slot number (FIXED - cannot be changed)
  const generateSlotId = (day: string, slotNumber: number): string => {
    const abbreviation = DAY_ABBREVIATIONS[day] || day.substring(0, 2).toUpperCase();
    return `${abbreviation}${slotNumber}`;
  };

  // Get the next time slot automatically (1 hour increment)
  const getNextTimeSlot = (dayIndex: number): { from: string, to: string } => {
    const daySlots = days[dayIndex]?.slots || [];
    if (daySlots.length === 0) {
      return { from: "8:00 AM", to: "9:00 AM" };
    }
    
    // Get the last slot's end time
    const lastSlot = daySlots[daySlots.length - 1];
    const lastTimeParts = lastSlot.time.split(" - ");
    const lastEndTime = lastTimeParts[1] || "9:00 AM";
    
    // Calculate next start time (same as last end time)
    const nextStartTime = lastEndTime;
    
    // Calculate next end time (1 hour later)
    const nextEndTime = getNextHourTime(nextStartTime);
    
    return { from: nextStartTime, to: nextEndTime };
  };

  // Get days from date range
  const getDaysFromDateRange = (startDate: string, endDate: string): string[] => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysInRange: string[] = [];
    
    // Create a map of weekday names to indices
    const dayIndexMap: Record<number, string> = {
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
      0: "Sunday"
    };
    
    // Iterate through each day in the range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayIndex = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayName = dayIndexMap[dayIndex];
      
      // Add the day if it's not already in the array
      if (dayName && !daysInRange.includes(dayName)) {
        daysInRange.push(dayName);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Sort days in chronological order (Monday to Sunday)
    return daysInRange.sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b));
  };

  // Add specific day from dropdown
  const addSpecificDay = (dayName: string) => {
    const dayIndex = ALL_DAYS.indexOf(dayName);
    const newDay: DaySlots = {
      day: dayName,
      slots: [{ 
        id: generateSlotId(dayName, 1), 
        time: "8:00 AM - 9:00 AM" 
      }],
      color: DAY_COLORS[dayIndex],
      startDate: calendarRange.startDate,
      endDate: calendarRange.endDate
    };

    setDays([...days, newDay].sort((a, b) => 
      ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day)
    ));
    setShowDayDropdown(null);
    setDropdownPosition(null);
  };

  // Handle day dropdown button click
  const handleDayDropdownClick = (e: React.MouseEvent, dayIndex: number) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Calculate position for dropdown
    let left = rect.right + 8; // Position to the right of button
    let top = rect.top;
    
    // If dropdown would go off right of screen, position to left instead
    const dropdownWidth = 180;
    if (left + dropdownWidth > viewportWidth - 20) {
      left = rect.left - dropdownWidth - 8;
    }
    
    setDropdownPosition({ top, left });
    setShowDayDropdown(showDayDropdown === dayIndex ? null : dayIndex);
  };

  // Add days based on selection mode
  const addSelectedDays = () => {
    let daysToAdd: string[] = [];
    
    if (selectionMode === "dropdown") {
      // Use selected days from dropdown
      daysToAdd = selectedDays.filter(dayName => !days.some(d => d.day === dayName));
    } else {
      // Use days from calendar range
      daysToAdd = getDaysFromDateRange(calendarRange.startDate, calendarRange.endDate)
        .filter(dayName => !days.some(d => d.day === dayName));
    }

    const newDays: DaySlots[] = daysToAdd.map(dayName => {
      const dayIndex = ALL_DAYS.indexOf(dayName);
      return {
        day: dayName,
        slots: [{ 
          id: generateSlotId(dayName, 1), 
          time: "8:00 AM - 9:00 AM" 
        }],
        color: DAY_COLORS[dayIndex],
        startDate: calendarRange.startDate,
        endDate: calendarRange.endDate
      };
    });

    const updatedDays = [...days, ...newDays].sort((a, b) => 
      ALL_DAYS.indexOf(a.day) - ALL_DAYS.indexOf(b.day)
    );
    
    setDays(updatedDays);
    setShowAddDayModal(false);
  };

  // Save data to localStorage - Updated version
  const saveSlots = async () => {
    setIsSaving(true);
    try {
      const dataToSave: SavedSlotsData = {
        days,
        lastSaved: new Date().toLocaleString(),
        settings: {
          selectedDays,
          startDate: calendarRange.startDate,
          endDate: calendarRange.endDate
        }
      };
      
      localStorage.setItem("timetableSlots", JSON.stringify(dataToSave));
      
      // Show success state
      setSaveMessage("Slots saved successfully!");
      setLastSavedTime(dataToSave.lastSaved);
      setSaveStatus("saved");
      
      // Reset message after 3 seconds
      setTimeout(() => {
        setSaveMessage("");
        setSaveStatus("idle");
      }, 3000);
      
    } catch (error) {
      console.error("Failed to save data:", error);
      setSaveMessage("Error saving slots");
      setSaveStatus("error");
      
      // Reset error after 3 seconds
      setTimeout(() => {
        setSaveMessage("");
        setSaveStatus("idle");
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Add time slot horizontally
  const addSlot = (dayIndex: number) => {
    const updated = [...days];
    const slotNumber = updated[dayIndex].slots.length + 1;
    const dayName = updated[dayIndex].day;
    
    // Get the next time slot automatically
    const nextTime = getNextTimeSlot(dayIndex);
    
    updated[dayIndex].slots.push({
      id: generateSlotId(dayName, slotNumber),
      time: `${nextTime.from} - ${nextTime.to}`
    });
    setDays(updated);
  };

  // Start editing a time slot
  const startEditSlot = (dayIndex: number, slotIndex: number) => {
    const slot = days[dayIndex].slots[slotIndex];
    const [from = "8:00 AM", to = "9:00 AM"] = slot.time.split(" - ");
    setEditingTime({ from, to });
    setEditingSlot({ dayIndex, slotIndex });
  };

  // Save edited time slot
  const saveEditedSlot = () => {
    if (!editingSlot) return;
    
    const { dayIndex, slotIndex } = editingSlot;
    const updated = [...days];
    
    updated[dayIndex].slots[slotIndex].time = `${editingTime.from} - ${editingTime.to}`;
    setDays(updated);
    setEditingSlot(null);
  };

  // Cancel editing
  const cancelEditSlot = () => {
    setEditingSlot(null);
  };

  // Delete a time slot
  const deleteSlot = (dayIndex: number, slotIndex: number) => {
    const updated = [...days];
    updated[dayIndex].slots.splice(slotIndex, 1);
    
    // Renumber remaining slots (keeping IDs fixed)
    const dayName = updated[dayIndex].day;
    updated[dayIndex].slots = updated[dayIndex].slots.map((slot, idx) => ({
      id: generateSlotId(dayName, idx + 1),
      time: slot.time
    }));
    
    setDays(updated);
  };

  // Delete a day
  const deleteDay = (dayIndex: number) => {
    if (days.length <= 1) return;
    const updated = [...days];
    updated.splice(dayIndex, 1);
    setDays(updated);
  };

  // Reset to default (Monday only with one slot)
  const resetToDefault = () => {
    if (window.confirm("Are you sure you want to reset all slots? This cannot be undone.")) {
      setDays([{ 
        day: "Monday", 
        slots: [{ id: "M1", time: "8:00 AM - 9:00 AM" }], 
        color: DAY_COLORS[0] 
      }]);
      setSelectedDays(["Monday"]);
      setCalendarRange({ startDate: "", endDate: "" });
      setSaveStatus("idle");
      setSaveMessage("");
    }
  };

  // Toggle day selection
  const toggleDaySelection = (dayName: string) => {
    if (selectedDays.includes(dayName)) {
      setSelectedDays(selectedDays.filter(d => d !== dayName));
    } else {
      setSelectedDays([...selectedDays, dayName]);
    }
  };

  // Select all days
  const selectAllDays = () => {
    setSelectedDays([...ALL_DAYS]);
  };

  // Clear all days selection
  const clearAllDays = () => {
    setSelectedDays([]);
  };

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

  // Get days count from calendar range
  const getDaysCountFromRange = () => {
    if (!calendarRange.startDate || !calendarRange.endDate) return 0;
    return getDaysFromDateRange(calendarRange.startDate, calendarRange.endDate).length;
  };

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Fixed Slots Management</h3>
          <p style={styles.subtitle}>Define time slots for each day of the week</p>
        </div>
        
        <div style={styles.headerActions}>
          <div style={styles.stats}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Days:</span>
              <span style={styles.statValue}>{days.length}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Slots:</span>
              <span style={styles.statValue}>
                {days.reduce((total, day) => total + day.slots.length, 0)}
              </span>
            </div>
          </div>
          
          {/* Save Button */}
          <div style={styles.saveSection}>
            {saveMessage && (
              <span style={{
                ...styles.saveMessage,
                color: saveStatus === "error" ? "#ef4444" : "#10b981"
              }}>
                {saveMessage}
              </span>
            )}
            <button
              style={{
                ...styles.saveButton,
                ...(saveStatus === "saving" ? styles.saveButtonSaving : {}),
                ...(saveStatus === "saved" ? styles.saveButtonSaved : {}),
                ...(saveStatus === "error" ? styles.saveButtonError : {})
              }}
              onClick={saveSlots}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "💾 Save Slots"}
            </button>
            
            {/* Add Days Button */}
            <button
              style={styles.addDaysButton}
              onClick={() => setShowAddDayModal(true)}
            >
              + Add Days
            </button>

            {/* Reset Button */}
            <button
              style={styles.resetButton}
              onClick={resetToDefault}
              title="Reset to default"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Help Section at Top */}
      {showHelp && (
        <div style={styles.helpSection}>
          <div style={styles.helpHeader}>
            <div style={styles.helpTitleContainer}>
              <span style={styles.helpIcon}>💡</span>
              <span style={styles.helpTitle}>How to use:</span>
            </div>
            <button
              style={styles.closeHelpBtn}
              onClick={() => setShowHelp(false)}
              title="Close help"
            >
              ×
            </button>
          </div>
          <ul style={styles.helpList}>
            <li>Click "Add Days" to select multiple days at once</li>
            <li>Click the <strong>▼ button</strong> next to any day to add specific days</li>
            <li>Click the <strong>✎ button</strong> on any slot to change the time range</li>
            <li>Click the <strong>× button</strong> to delete slots or days</li>
            <li><strong>Slot IDs (M1, TU2, etc.) are fixed</strong> - cannot be changed</li>
            <li><strong>New slots automatically add with 1-hour intervals</strong></li>
            <li>Use <strong>Calendar Range</strong> mode to add days by date range</li>
            <li>Don't forget to click <strong>"Save Slots"</strong> to save your changes</li>
          </ul>
        </div>
      )}

      {/* Add Day Modal */}
      {showAddDayModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddDayModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Days to Schedule</h3>
              <button
                style={styles.closeModalBtn}
                onClick={() => setShowAddDayModal(false)}
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Note about automatic time slots */}
              <div style={styles.timeNote}>
                <p style={styles.noteText}>
                  💡 <strong>Note:</strong> New slots will automatically be added with 1-hour intervals starting from 8:00 AM.
                </p>
              </div>

              {/* Selection Mode Tabs */}
              <div style={styles.selectionTabs}>
                <button
                  style={{
                    ...styles.selectionTab,
                    ...(selectionMode === "dropdown" ? styles.activeSelectionTab : {})
                  }}
                  onClick={() => setSelectionMode("dropdown")}
                >
                  Select Days
                </button>
                <button
                  style={{
                    ...styles.selectionTab,
                    ...(selectionMode === "calendar" ? styles.activeSelectionTab : {})
                  }}
                  onClick={() => setSelectionMode("calendar")}
                >
                  Calendar Range
                </button>
              </div>

              {/* Day Selection Mode */}
              {selectionMode === "dropdown" ? (
                <div style={styles.daySelection}>
                  <div style={styles.selectionHeader}>
                    <span style={styles.selectionTitle}>Select Days to Add</span>
                    <div style={styles.selectionActions}>
                      <button style={styles.selectionActionBtn} onClick={selectAllDays}>
                        Select All
                      </button>
                      <button style={styles.selectionActionBtn} onClick={clearAllDays}>
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  {/* Days Grid */}
                  <div style={styles.daysGrid}>
                    {ALL_DAYS.map(day => {
                      const isSelected = selectedDays.includes(day);
                      const isAlreadyAdded = days.some(d => d.day === day);
                      const dayIndex = ALL_DAYS.indexOf(day);
                      
                      return (
                        <div
                          key={day}
                          style={{
                            ...styles.dayOption,
                            ...(isSelected ? styles.selectedDayOption : {}),
                            ...(isAlreadyAdded ? styles.disabledDayOption : {})
                          }}
                          onClick={() => !isAlreadyAdded && toggleDaySelection(day)}
                        >
                          <div style={styles.dayOptionContent}>
                            <div style={{
                              ...styles.dayColorIndicator,
                              backgroundColor: DAY_COLORS[dayIndex]
                            }} />
                            <div style={styles.dayTextContainer}>
                              <span style={styles.dayOptionText}>{day}</span>
                              <span style={styles.dayAbbreviation}>
                                {DAY_ABBREVIATIONS[day]}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div style={styles.checkmark}>✓</div>
                          )}
                          {isAlreadyAdded && (
                            <div style={styles.addedBadge}>Added</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Calendar Mode */
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
                      <p>📅 Will add <strong>{getDaysCountFromRange()}</strong> days from the selected range:</p>
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
              )}

              {/* Selected Days Summary */}
              {(selectionMode === "dropdown" ? selectedDays.length > 0 : calendarRange.startDate && calendarRange.endDate) && (
                <div style={styles.selectedSummary}>
                  <span style={styles.summaryLabel}>
                    {selectionMode === "dropdown" ? "Selected: " : "Will add: "}
                  </span>
                  <div style={styles.selectedDaysList}>
                    {(selectionMode === "dropdown" ? selectedDays : getDaysFromDateRange(calendarRange.startDate, calendarRange.endDate))
                      .map(day => (
                        <span key={day} style={styles.selectedDayBadge}>
                          {DAY_ABBREVIATIONS[day]}
                        </span>
                      ))}
                  </div>
                  <span style={styles.summaryCount}>
                    {selectionMode === "dropdown" ? selectedDays.length : getDaysCountFromRange()} days
                  </span>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.cancelModalBtn}
                onClick={() => setShowAddDayModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.confirmModalBtn}
                onClick={addSelectedDays}
                disabled={
                  selectionMode === "dropdown" 
                    ? selectedDays.length === 0 
                    : !calendarRange.startDate || !calendarRange.endDate
                }
              >
                Add Selected Days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Container */}
      <div style={styles.gridContainer}>
        {/* Table Header */}
        <div style={styles.tableHeader}>
          <div style={styles.dayHeader}>Week Days</div>
          <div style={styles.slotsHeader}>Time Slots</div>
        </div>

        {/* Days & Slots Grid */}
        <div style={styles.grid}>
          {days.map((day, dayIndex) => (
            <div key={day.day} style={styles.dayRow}>
              {/* Day Column */}
              <div style={styles.dayColumn}>
                <div style={styles.dayCell}>
                  <div 
                    style={{...styles.dayColorDot, backgroundColor: day.color}} 
                  />
                  <span style={styles.dayName}>{day.day}</span>
                  <span style={styles.daySlotCount}>
                    ({day.slots.length} slots)
                  </span>
                  
                  {/* Action Buttons */}
                  <div style={styles.dayActionButtons}>
                    {/* Dropdown Button */}
                    <button
                      style={styles.dayDropdownBtn}
                      onClick={(e) => handleDayDropdownClick(e, dayIndex)}
                      title="Add another day"
                    >
                      ▼
                    </button>
                    
                    {/* Delete Day Button */}
                    {days.length > 1 && (
                      <button
                        style={styles.deleteDayBtn}
                        onClick={() => deleteDay(dayIndex)}
                        title="Remove day"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Slots Column */}
              <div style={styles.slotsColumn}>
                <div style={styles.slotsRow}>
                  {day.slots.length === 0 ? (
                    <div style={styles.emptyDayMessage}>
                      No time slots for {day.day}
                    </div>
                  ) : (
                    day.slots.map((slot, slotIndex) => {
                      const isEditing = editingSlot?.dayIndex === dayIndex && editingSlot?.slotIndex === slotIndex;

                      return (
                        <div key={slotIndex} style={styles.slotContainer}>
                          <div style={styles.slotCell}>
                            {isEditing ? (
                              <div style={styles.slotEditMode}>
                                <div style={styles.slotHeader}>
                                  <span style={styles.slotId}>{slot.id}:</span>
                                </div>
                                <div style={styles.timeEditContainer}>
                                  <div style={styles.timeInputGroup}>
                                    <select
                                      value={editingTime.from}
                                      onChange={(e) => setEditingTime({...editingTime, from: e.target.value})}
                                      style={styles.timeSelect}
                                    >
                                      {TIME_OPTIONS.map(time => (
                                        <option key={`edit-from-${time}`} value={time}>{time}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <span style={styles.timeDash}>-</span>
                                  <div style={styles.timeInputGroup}>
                                    <select
                                      value={editingTime.to}
                                      onChange={(e) => setEditingTime({...editingTime, to: e.target.value})}
                                      style={styles.timeSelect}
                                    >
                                      {TIME_OPTIONS.map(time => (
                                        <option key={`edit-to-${time}`} value={time}>{time}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div style={styles.editActions}>
                                    <button
                                      style={styles.saveEditBtn}
                                      onClick={saveEditedSlot}
                                      title="Save changes"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      style={styles.cancelEditBtn}
                                      onClick={cancelEditSlot}
                                      title="Cancel"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={styles.slotDisplay}>
                                <div style={styles.slotInfo}>
                                  <div style={styles.slotId}>{slot.id}:</div>
                                  <div style={styles.slotTime}>{slot.time}</div>
                                </div>
                                <div style={styles.slotActions}>
                                  <button
                                    style={styles.editSlotBtn}
                                    onClick={() => startEditSlot(dayIndex, slotIndex)}
                                    title="Edit time"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    style={styles.deleteSlotBtn}
                                    onClick={() => deleteSlot(dayIndex, slotIndex)}
                                    title="Delete slot"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Add Slot Button - Moved to end of row */}
                  <button
                    style={styles.addSlotBtn}
                    onClick={() => addSlot(dayIndex)}
                    title="Add time slot"
                  >
                    + Add Slot
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day Dropdown Portal */}
      {showDayDropdown !== null && dropdownPosition && (
        <div
          ref={el => dropdownRefs.current[showDayDropdown] = el}
          style={{
            ...styles.dayDropdown,
            position: "fixed",
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
        >
          <div style={styles.dropdownHeader}>
            <span>Add Day</span>
            <button
              style={styles.closeDropdownBtn}
              onClick={() => {
                setShowDayDropdown(null);
                setDropdownPosition(null);
              }}
            >
              ×
            </button>
          </div>
          <div style={styles.dropdownList}>
            {getAvailableDays().map(availableDay => {
              const availDayIndex = ALL_DAYS.indexOf(availableDay);
              return (
                <div
                  key={availableDay}
                  style={styles.dropdownItem}
                  onClick={() => addSpecificDay(availableDay)}
                >
                  <div style={{
                    ...styles.dropdownDayColor,
                    backgroundColor: DAY_COLORS[availDayIndex]
                  }} />
                  <span>{availableDay}</span>
                  <span style={styles.dropdownAbbrev}>
                    {DAY_ABBREVIATIONS[availableDay]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= UPDATED STYLES ================= */
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
    gap: "20px",
  },
  stats: {
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
  saveSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  saveButton: {
    padding: "10px 20px",
    background: "#10b981",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  },
  saveButtonSaving: {
    background: "#6b7280",
    cursor: "wait",
  },
  saveButtonSaved: {
    background: "#10b981",
  },
  saveButtonError: {
    background: "#ef4444",
  },
  saveMessage: {
    fontSize: "14px",
    fontWeight: "500",
  },
  addDaysButton: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  },
  resetButton: {
    padding: "10px 20px",
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
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
    borderRadius: "12px",
    width: "650px",
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
  modalBody: {
    padding: "24px",
    overflowY: "auto",
    maxHeight: "calc(85vh - 120px)",
  },
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
  selectionTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
  },
  selectionTab: {
    flex: "1",
    padding: "12px 16px",
    background: "#f1f5f9",
    color: "#64748b",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  activeSelectionTab: {
    background: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },
  daySelection: {
    marginBottom: "24px",
  },
  selectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  selectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },
  selectionActions: {
    display: "flex",
    gap: "8px",
  },
  selectionActionBtn: {
    padding: "6px 12px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
  },
  daysGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  dayOption: {
    padding: "16px",
    background: "#ffffff",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    boxSizing: "border-box",
  },
  dayTextContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  dayOptionContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: "1",
  },
  dayColorIndicator: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    flexShrink: "0",
  },
  dayOptionText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    whiteSpace: "nowrap",
  },
  dayAbbreviation: {
    fontSize: "12px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
    alignSelf: "flex-start",
  },
  checkmark: {
    color: "#10b981",
    fontWeight: "bold",
    fontSize: "14px",
    flexShrink: "0",
  },
  addedBadge: {
    position: "absolute",
    top: "8px",
    right: "8px",
    fontSize: "10px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  selectedDayOption: {
    borderColor: "#3b82f6",
    background: "#eff6ff",
  },
  disabledDayOption: {
    opacity: "0.5",
    cursor: "not-allowed",
  },
  calendarSelection: {
    marginBottom: "24px",
  },
  calendarHeader: {
    marginBottom: "20px",
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
  selectedSummary: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  summaryLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
  },
  selectedDaysList: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  selectedDayBadge: {
    padding: "4px 10px",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
  },
  summaryCount: {
    marginLeft: "auto",
    fontSize: "14px",
    color: "#64748b",
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
  // Grid Container
  gridContainer: {
    background: "#ffffff",
    position: "relative",
    overflow: "visible",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    background: "#f1f5f9",
    borderBottom: "2px solid #e2e8f0",
  },
  dayHeader: {
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
  },
  slotsHeader: {
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
    display: "grid",
    gridTemplateColumns: "180px 1fr",
    borderBottom: "1px solid #f1f5f9",
    position: "relative",
    overflow: "visible",
  },
  dayColumn: {
    padding: "16px",
    background: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
  },
  dayCell: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    position: "relative",
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
  dayActionButtons: {
    position: "absolute",
    top: "16px",
    right: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    alignItems: "center",
  },
  dayDropdownBtn: {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#475569",
  },
  deleteDayBtn: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  slotsColumn: {
    padding: "16px",
    position: "relative",
    overflow: "visible",
  },
  slotsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    alignItems: "center",
  },
  emptyDayMessage: {
    padding: "20px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  slotContainer: {
    position: "relative",
  },
  slotCell: {
    minWidth: "200px",
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
  slotEditMode: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  slotHeader: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  slotId: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
  timeEditContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  timeInputGroup: {
    flex: "1",
  },
  timeSelect: {
    width: "100%",
    padding: "6px 8px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    fontSize: "12px",
    color: "#1e293b",
  },
  timeDash: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "500",
  },
  editActions: {
    display: "flex",
    gap: "4px",
  },
  saveEditBtn: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    border: "1px solid #86efac",
    background: "#dcfce7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#16a34a",
    fontSize: "12px",
  },
  cancelEditBtn: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#dc2626",
    fontSize: "12px",
  },
  slotDisplay: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
  },
  slotInfo: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flex: "1",
  },
  slotTime: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
  slotActions: {
    display: "flex",
    gap: "4px",
  },
  editSlotBtn: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#475569",
    fontSize: "10px",
  },
  deleteSlotBtn: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#dc2626",
    fontSize: "12px",
  },
  addSlotBtn: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "2px dashed #cbd5e1",
    background: "transparent",
    color: "#475569",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.2s",
  },
  // Dropdown styles - Fixed
  dayDropdown: {
    width: "180px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    zIndex: 9999,
  },
  dropdownHeader: {
    padding: "12px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeDropdownBtn: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownList: {
    maxHeight: "200px",
    overflowY: "auto",
  },
  dropdownItem: {
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "background 0.2s",
  },
  dropdownDayColor: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  dropdownAbbrev: {
    marginLeft: "auto",
    fontSize: "11px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
  },
};

export default SlotsGrid;