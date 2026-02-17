import React, { useEffect, useState } from "react";
import { removeBatchFromTimetable, removeTeacherFromBatch } from "../AllApi";
import { API_BASE_URL } from "../hooks/useApi";

/* ================= TYPES ================= */
interface Teacher {
  id: string;
  name: string;
  code: string;
  subject: string;
  department: string;
  minLecturesPerDay: number;
  maxLecturesPerDay: number;
  minLecturesPerWeek: number;
  maxLecturesPerWeek: number;
  email?: string;
  phone?: string;
}

interface Program {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  program: Program;
  student_count: number;
  teacher_count: number;
  created_at: string;
  color?: string;
  year?: string;
  students?: string;
}



/* ================= BATCH COLORS ================= */
const BATCH_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

/* ================= MAIN COMPONENT ================= */
const BatchSchedule: React.FC = () => {
  // Debug logging
  console.log("BatchSchedule loading... LocalStorage:", localStorage.getItem("batchTeacherAssignments"));

  // State for center ID
  const [centerId, setCenterId] = useState<string>("bb67db93-5d47-4639-aa05-7ddb80d106a1");
  const [centerName, setCenterName] = useState<string>("Center Test");
  const [timetableId, setTimetableId] = useState<string>("");

  // State for batches from API
  const [batches, setBatches] = useState<Batch[]>([]);
  const [allBatchesFromAPI, setAllBatchesFromAPI] = useState<Batch[]>([]); // All batches from API
  const [activeBatch, setActiveBatch] = useState<string>("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // State for teachers from API
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false);

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAllBatches, setLoadingAllBatches] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Add Batch State
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [newBatchYear, setNewBatchYear] = useState("2nd Year");
  const [newBatchStudents, setNewBatchStudents] = useState("");
  const [showBatchSelector, setShowBatchSelector] = useState(false);
  const [selectedBatchToAdd, setSelectedBatchToAdd] = useState<string>("");

  // Teacher assignments state
  const [teacherAssignments, setTeacherAssignments] = useState<{ batchId: string, teachers: Teacher[], timetableId?: string }[]>([]);

  // New states for save functionality and help section
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showHelp, setShowHelp] = useState(true);

  // State for timetable name (display only)
  const [timetableName, setTimetableName] = useState<string>("");

  // State for free classes count
  const [freeClassesCount, setFreeClassesCount] = useState<number>(0);

  // Confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalType, setConfirmModalType] = useState<"batch" | "teacher">("batch");
  const [confirmModalData, setConfirmModalData] = useState<{ batchId?: string; batchName?: string; teacherId?: string; teacherName?: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ===================== API FUNCTIONS =====================

  // Function to get access token
  const getAccessToken = () => {
    return localStorage.getItem("access_token");
  };

  // Function to fetch free classes count for timetable
  const fetchFreeClassesCount = async (ttId: string) => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken || !ttId) return;

      const response = await fetch(
        `${API_BASE_URL}/timetable/timetables/${ttId}/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const count = data.free_classes_count || 0;
        console.log("Free classes count:", count);
        setFreeClassesCount(count);
      }
    } catch (error) {
      console.error("Error fetching free classes count:", error);
    }
  };

  // Generate FREE slots based on free_classes_count
  const generateFreeSlots = (): Teacher[] => {
    const freeSlots: Teacher[] = [];
    for (let i = 1; i <= freeClassesCount; i++) {
      freeSlots.push({
        id: `FREE${i}`,
        name: `Free Period ${i}`,
        code: `FREE${i}`,
        subject: "Free Period",
        department: "Free",
        minLecturesPerDay: 0,
        maxLecturesPerDay: 1,
        minLecturesPerWeek: 2,
        maxLecturesPerWeek: 5,
      });
    }
    return freeSlots;
  };

  // Function to fetch assigned batches for a timetable
  const fetchAssignedBatches = async (ttId: string) => {
    try {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }

      if (!ttId) {
        console.log("No timetable ID provided");
        return { batches: [] };
      }

      const response = await fetch(
        `${API_BASE_URL}/timetable/timetables/${ttId}/batch-assignments/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        // Handle 404 as empty result (no assignments yet)
        if (response.status === 404) {
          console.log("No batch assignments found for this timetable");
          return { batches: [] };
        }
        throw new Error(`Failed to fetch assigned batches: ${response.status}`);
      }

      const data = await response.json();
      console.log("Assigned batches API response:", data);

      // Handle null or undefined response
      if (!data) {
        return { batches: [] };
      }

      return data;

    } catch (error: any) {
      console.error("Error fetching assigned batches:", error);
      return { batches: [] };
    }
  };

  // Function to assign batch to timetable
  const assignBatchToTimetable = async (ttId: string, batchCode: string) => {
    try {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }

      const payload = {
        timetable_id: ttId,
        batch_code: batchCode,
      };

      console.log("Assigning batch with payload:", payload);

      const response = await fetch(
        `${API_BASE_URL}/timetable/admin/timetables/assign-batch/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to assign batch: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("Batch assigned successfully:", data);
      return data;

    } catch (error: any) {
      console.error("Error assigning batch:", error);
      throw error;
    }
  };

  // Function to fetch teachers from API
  const fetchTeachersFromAPI = async () => {
    setLoadingTeachers(true);
    try {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/timetable/centers/${centerId}/users/?role=teacher`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch teachers: ${response.status}`);
      }

      const data = await response.json();
      console.log("Teachers API response:", data);
      console.log("First teacher raw data:", data.results?.[0]);

      // Transform API data to match our UI format
      const formattedTeachers: Teacher[] = data.results.map((teacher: any) => ({
        id: teacher.id,
        name: `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.name || 'Unknown',
        code: teacher.teacher_code || `TCH-${teacher.id.slice(0, 8)}`,
        subject: teacher.teacher_subjects || teacher.subject || teacher.subject_name || teacher.specialization || "General",
        department: teacher.department || teacher.department_name || "General",
        minLecturesPerDay: 1,
        maxLecturesPerDay: 2,
        minLecturesPerWeek: 4,
        maxLecturesPerWeek: 8,
        email: teacher.email,
        phone: teacher.phone
      }));

      console.log("Formatted teachers with subjects:", formattedTeachers);

      setTeachers(formattedTeachers);

    } catch (error: any) {
      console.error("Error fetching teachers:", error);

      // Fallback to mock data if API fails
      setTeachers([
        {
          id: "T001",
          name: "Dr. Sharma",
          code: "TCH-CENT-230",
          subject: "Mathematics",
          department: "CSE",
          minLecturesPerDay: 1,
          maxLecturesPerDay: 3,
          minLecturesPerWeek: 4,
          maxLecturesPerWeek: 8
        },
        {
          id: "T002",
          name: "Prof. Kumar",
          code: "TCH-CENT-231",
          subject: "Data Structures",
          department: "CSE",
          minLecturesPerDay: 1,
          maxLecturesPerDay: 2,
          minLecturesPerWeek: 3,
          maxLecturesPerWeek: 6
        },
        {
          id: "T003",
          name: "Dr. Singh",
          code: "TCH-CENT-232",
          subject: "Algorithms",
          department: "CSE",
          minLecturesPerDay: 1,
          maxLecturesPerDay: 2,
          minLecturesPerWeek: 2,
          maxLecturesPerWeek: 5
        },
      ]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Function to remove batch from timetable via API (uses AllApi)
  const removeBatchFromTimetableAPI = async (ttId: string, batchCode: string) => {
    try {
      const data = await removeBatchFromTimetable(ttId, batchCode);
      console.log("Batch removed successfully:", data);
      return data;
    } catch (error: any) {
      console.error("Error removing batch:", error);
      throw error;
    }
  };

  // Function to remove teacher from batch via API (uses AllApi)
  const removeTeacherFromBatchAPI = async (ttId: string, batchCode: string, teacherCode: string) => {
    try {
      const data = await removeTeacherFromBatch(ttId, batchCode, teacherCode);
      console.log("Teacher removed successfully:", data);
      return data;
    } catch (error: any) {
      console.error("Error removing teacher:", error);
      throw error;
    }
  };

  // Function to assign teacher via API
  const assignTeacherAPI = async (batchCode: string, teacherCode: string, minLecturesPerWeek: number, minLecturesPerDay: number, maxLecturesPerDay: number, maxLecturesPerWeek: number) => {
    try {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }

      if (!timetableId) {
        throw new Error("Please select a timetable first");
      }

      const payload = {
        timetable_id: timetableId,
        batch_code: batchCode,
        teacher_code: teacherCode,
        total_lectures: minLecturesPerWeek, // This is sent as min_lectures_per_week
        min_lectures_per_day: minLecturesPerDay,
        max_lectures_per_day: maxLecturesPerDay,
        max_lectures_per_week: maxLecturesPerWeek
      };

      console.log("Assigning teacher with payload:", payload);

      const response = await fetch(
        `${API_BASE_URL}/timetable/admin/timetables/assign-teacher/`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to assign teacher: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log("Teacher assigned successfully:", data);
      return data;

    } catch (error: any) {
      console.error("Error assigning teacher:", error);
      throw error;
    }
  };

  // Function to fetch timetable details (for display name)
  const fetchTimetableDetails = async (ttId: string) => {
    try {
      const accessToken = getAccessToken();

      if (!accessToken || !ttId) {
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/timetable/timetables/${ttId}/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTimetableName(data.name || `Timetable ${ttId.slice(0, 8)}`);
      }

    } catch (error: any) {
      console.error("Error fetching timetable details:", error);
      setTimetableName(`Timetable ${ttId.slice(0, 8)}`);
    }
  };

  // Function to fetch all batches from API (for selection)
  const fetchAllBatchesFromAPI = async () => {
    setLoadingAllBatches(true);
    try {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }

      const response = await fetch(
        `${API_BASE_URL}/timetable/centers/${centerId}/batches/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch batches: ${response.status}`);
      }

      const data = await response.json();
      console.log("All Batches API response:", data);

      // Transform API data to match our UI format
      const formattedBatches: Batch[] = data.results.map((batch: any, index: number) => ({
        id: batch.id,
        code: batch.code,
        name: batch.name,
        start_date: batch.start_date,
        end_date: batch.end_date,
        program: batch.program,
        student_count: batch.student_count,
        teacher_count: batch.teacher_count,
        created_at: batch.created_at,
        color: BATCH_COLORS[index % BATCH_COLORS.length],
        year: extractYearFromBatchName(batch.name) || `${new Date(batch.start_date).getFullYear()} Year`,
        students: batch.student_count.toString()
      }));

      setAllBatchesFromAPI(formattedBatches);

      // Filter out batches that are already added
      const availableBatches = formattedBatches.filter(
        batch => !batches.some(addedBatch => addedBatch.id === batch.id)
      );

      if (availableBatches.length > 0) {
        setSelectedBatchToAdd(availableBatches[0].id);
      }

    } catch (error: any) {
      console.error("Error fetching all batches:", error);
      alert(`Failed to fetch batches: ${error.message}`);
    } finally {
      setLoadingAllBatches(false);
    }
  };

  // Function to fetch initial batches (for display) - now fetches assigned batches
  const fetchBatchesFromAPI = async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = getAccessToken();

      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }

      // First fetch all batches for the center (for the "Add Batch" dropdown)
      const allBatchesResponse = await fetch(
        `${API_BASE_URL}/timetable/centers/${centerId}/batches/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!allBatchesResponse.ok) {
        throw new Error(`Failed to fetch batches: ${allBatchesResponse.status}`);
      }

      const allBatchesData = await allBatchesResponse.json();
      console.log("All Batches API response:", allBatchesData);

      // Transform API data to match our UI format
      const formattedAllBatches: Batch[] = (allBatchesData.results || []).map((batch: any, index: number) => ({
        id: batch.id,
        code: batch.code,
        name: batch.name,
        start_date: batch.start_date,
        end_date: batch.end_date,
        program: batch.program,
        student_count: batch.student_count,
        teacher_count: batch.teacher_count,
        created_at: batch.created_at,
        color: BATCH_COLORS[index % BATCH_COLORS.length],
        year: extractYearFromBatchName(batch.name) || `${new Date(batch.start_date).getFullYear()} Year`,
        students: batch.student_count.toString()
      }));

      setAllBatchesFromAPI(formattedAllBatches);
      setCenterName(allBatchesData.center_name || "Center Test");

      // Now fetch assigned batches for the current timetable
      if (timetableId) {
        await loadAssignedBatches(timetableId, formattedAllBatches);
      } else {
        // No timetable selected, show empty
        setBatches([]);
      }

    } catch (error: any) {
      console.error("Error fetching batches:", error);
      setError(error.message || "Failed to load batches");
      setBatches([]);

    } finally {
      setLoading(false);
    }
  };

  // Function to load assigned batches for a timetable
  const loadAssignedBatches = async (ttId: string, allBatches?: Batch[]) => {
    try {
      const assignedData = await fetchAssignedBatches(ttId);
      console.log("Assigned batches data:", assignedData);

      const batchesSource = allBatches || allBatchesFromAPI;

      // Handle the new API response format: { batches: [...] }
      const batchesArray = assignedData?.batches || assignedData?.results || [];

      if (!batchesArray || batchesArray.length === 0) {
        console.log("No batches assigned to this timetable");
        setBatches([]);
        setActiveBatch("");
        return;
      }

      // Get the batch codes that are assigned
      const assignedBatchCodes: string[] = batchesArray.map((assignment: any) =>
        assignment.batch_code
      ).filter(Boolean);

      console.log("Assigned batch codes:", assignedBatchCodes);

      // Filter all batches to only show assigned ones
      const assignedBatches = batchesSource.filter(batch =>
        assignedBatchCodes.includes(batch.code)
      ).map((batch, index) => ({
        ...batch,
        color: BATCH_COLORS[index % BATCH_COLORS.length]
      }));

      console.log("Filtered assigned batches:", assignedBatches);

      setBatches(assignedBatches);

      // Load teacher assignments from the API response
      const newTeacherAssignments: { batchId: string, teachers: Teacher[], timetableId?: string }[] = [];

      for (const batchAssignment of batchesArray) {
        const batchCode = batchAssignment.batch_code;
        const batchObj = assignedBatches.find(b => b.code === batchCode);

        if (batchObj && batchAssignment.teachers && batchAssignment.teachers.length > 0) {
          const teachers: Teacher[] = batchAssignment.teachers.map((t: any) => ({
            id: t.teacher_id || t.teacher_code,
            name: t.teacher_name || "Unknown",
            code: t.teacher_code,
            subject: t.teacher_subjects || t.subject || t.subject_name || "General",
            department: t.department || "General",
            minLecturesPerDay: t.min_lectures_per_day || 1,
            maxLecturesPerDay: t.max_lectures_per_day || 2,
            minLecturesPerWeek: t.total_lectures || 4,
            maxLecturesPerWeek: t.max_lectures_per_week || 8,
          }));

          newTeacherAssignments.push({
            batchId: batchObj.id,
            teachers,
            timetableId: ttId
          });
        }
      }

      if (newTeacherAssignments.length > 0) {
        console.log("Loaded teacher assignments from API:", newTeacherAssignments);
        setTeacherAssignments(prev => {
          // Merge with existing assignments, preferring API data for this timetable
          const otherAssignments = prev.filter(a => a.timetableId !== ttId);
          return [...otherAssignments, ...newTeacherAssignments];
        });
      }

      // Set first batch as active if available
      if (assignedBatches.length > 0 && !activeBatch) {
        setActiveBatch(assignedBatches[0].id);
      } else if (assignedBatches.length === 0) {
        setActiveBatch("");
      }

    } catch (error: any) {
      console.error("Error loading assigned batches:", error);
      setBatches([]);
    }
  };

  // Function to add a batch to the current view (calls assign-batch API)
  const addBatchToView = async () => {
    if (!selectedBatchToAdd) {
      alert("Please select a batch to add");
      return;
    }

    if (!timetableId) {
      alert("Please select a timetable first");
      return;
    }

    const batchToAdd = allBatchesFromAPI.find(batch => batch.id === selectedBatchToAdd);

    if (!batchToAdd) {
      alert("Selected batch not found");
      return;
    }

    // Check if batch is already added
    if (batches.some(batch => batch.id === batchToAdd.id)) {
      alert("This batch is already assigned to this timetable");
      return;
    }

    try {
      // Call the assign-batch API
      await assignBatchToTimetable(timetableId, batchToAdd.code);

      // Add the batch with a new color
      const newBatch = {
        ...batchToAdd,
        color: BATCH_COLORS[batches.length % BATCH_COLORS.length]
      };

      setBatches(prev => [...prev, newBatch]);

      // If no batch is active, set this as active
      if (!activeBatch) {
        setActiveBatch(newBatch.id);
      }

      // Close the selector
      setShowBatchSelector(false);
      setSelectedBatchToAdd("");

      alert(`Batch "${newBatch.name}" assigned successfully!`);

    } catch (error: any) {
      alert(`Failed to assign batch: ${error.message}`);
    }
  };

  // Function to remove a batch from view
  const removeBatchFromView = (batchId: string) => {
    const batchToRemove = batches.find(b => b.id === batchId);
    if (!batchToRemove) {
      return;
    }

    if (!timetableId) {
      return;
    }

    // Open confirmation modal
    setConfirmModalType("batch");
    setConfirmModalData({ batchId, batchName: batchToRemove.name });
    setShowConfirmModal(true);
  };

  // Confirm batch removal
  const confirmRemoveBatch = async () => {
    if (!confirmModalData?.batchId || !timetableId) return;

    const batchToRemove = batches.find(b => b.id === confirmModalData.batchId);
    if (!batchToRemove) return;

    setIsDeleting(true);

    try {
      // Call the remove-batch API
      await removeBatchFromTimetableAPI(timetableId, batchToRemove.code);

      // Remove batch from view
      setBatches(prev => prev.filter(batch => batch.id !== confirmModalData.batchId));

      // Remove teacher assignments for this batch
      setTeacherAssignments(prev => prev.filter(assignment => assignment.batchId !== confirmModalData.batchId));

      // If active batch is being removed, set another batch as active
      if (activeBatch === confirmModalData.batchId) {
        const remainingBatches = batches.filter(batch => batch.id !== confirmModalData.batchId);
        if (remainingBatches.length > 0) {
          setActiveBatch(remainingBatches[0].id);
        } else {
          setActiveBatch("");
        }
      }

      // Close modal
      setShowConfirmModal(false);
      setConfirmModalData(null);

    } catch (error: any) {
      console.error("Failed to remove batch:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper function to extract year from batch name
  const extractYearFromBatchName = (batchName: string): string => {
    const yearMatch = batchName.match(/\((\d{4})\)/);
    if (yearMatch && yearMatch[1]) {
      return `${yearMatch[1]} Year`;
    }
    return "";
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to get active batch
  const getActiveBatch = () => {
    return batches.find(b => b.id === activeBatch);
  };

  // Helper function to get batch assignments
  const getBatchAssignments = (batchId: string) => {
    return teacherAssignments.find(a => a.batchId === batchId)?.teachers || [];
  };

  // Helper function to get batch stats
  const getBatchStats = (batchId: string) => {
    const teachers = getBatchAssignments(batchId);
    const totalMinPerDay = teachers.reduce((sum, t) => sum + t.minLecturesPerDay, 0);
    const totalMaxPerDay = teachers.reduce((sum, t) => sum + t.maxLecturesPerDay, 0);
    const totalMinPerWeek = teachers.reduce((sum, t) => sum + t.minLecturesPerWeek, 0);
    const totalMaxPerWeek = teachers.reduce((sum, t) => sum + t.maxLecturesPerWeek, 0);

    return {
      teachers: teachers.length,
      totalMinPerDay,
      totalMaxPerDay,
      totalMinPerWeek,
      totalMaxPerWeek
    };
  };

  const updateBatchAssignments = (batchId: string, teachers: Teacher[]) => {
    setTeacherAssignments(prev => {
      const existing = prev.find(a => a.batchId === batchId);
      if (existing) {
        return prev.map(a => a.batchId === batchId ? { ...a, teachers, timetableId } : a);
      } else {
        return [...prev, { batchId, teachers, timetableId }];
      }
    });
  };

  const assignTeacher = async (teacher: Teacher) => {
    const currentTeachers = getBatchAssignments(activeBatch);
    // Check if teacher already exists in this batch
    if (currentTeachers.some(t => t.id === teacher.id)) {
      alert("This teacher is already assigned to this batch!");
      return;
    }

    const activeBatchObj = getActiveBatch();
    if (!activeBatchObj) {
      alert("No active batch selected");
      return;
    }

    if (!timetableId) {
      alert("Please select a timetable first");
      return;
    }

    // Close dropdown immediately for better UX
    setOpenDropdown(null);

    try {
      // Call the assign-teacher API immediately
      console.log("Assigning teacher via API:", {
        batchCode: activeBatchObj.code,
        teacherCode: teacher.code,
        minLecturesPerWeek: teacher.minLecturesPerWeek,
        minLecturesPerDay: teacher.minLecturesPerDay,
        maxLecturesPerDay: teacher.maxLecturesPerDay,
        maxLecturesPerWeek: teacher.maxLecturesPerWeek
      });

      await assignTeacherAPI(
        activeBatchObj.code,
        teacher.code,
        teacher.minLecturesPerWeek,
        teacher.minLecturesPerDay,
        teacher.maxLecturesPerDay,
        teacher.maxLecturesPerWeek
      );

      // If API call succeeds, update local state
      const updatedTeachers = [...currentTeachers, { ...teacher }];
      updateBatchAssignments(activeBatch, updatedTeachers);

      // DEBUG: Log what's being saved
      console.log("Teacher assigned successfully to batch:", activeBatch);
      console.log("Teacher:", teacher);

      // Update localStorage
      const updatedAssignments = [...teacherAssignments];
      const assignmentIndex = updatedAssignments.findIndex(a => a.batchId === activeBatch);

      if (assignmentIndex >= 0) {
        updatedAssignments[assignmentIndex] = {
          ...updatedAssignments[assignmentIndex],
          teachers: updatedTeachers,
          timetableId
        };
      } else {
        updatedAssignments.push({
          batchId: activeBatch,
          teachers: updatedTeachers,
          timetableId
        });
      }

      setTeacherAssignments(updatedAssignments);
      localStorage.setItem("batchTeacherAssignments", JSON.stringify(updatedAssignments));
      console.log("Saved to localStorage:", updatedAssignments);

    } catch (error: any) {
      console.error("Failed to assign teacher:", error);
      alert(`Failed to assign teacher: ${error.message}`);
    }
  };

  const removeTeacher = (teacherId: string) => {
    const currentTeachers = getBatchAssignments(activeBatch);
    const teacherToRemove = currentTeachers.find(t => t.id === teacherId);
    const activeBatchObj = getActiveBatch();

    if (!teacherToRemove || !activeBatchObj) {
      return;
    }

    if (!timetableId) {
      return;
    }

    // Open confirmation modal
    setConfirmModalType("teacher");
    setConfirmModalData({ teacherId, teacherName: teacherToRemove.name });
    setShowConfirmModal(true);
  };

  // Confirm teacher removal
  const confirmRemoveTeacher = async () => {
    if (!confirmModalData?.teacherId || !timetableId) return;

    const currentTeachers = getBatchAssignments(activeBatch);
    const teacherToRemove = currentTeachers.find(t => t.id === confirmModalData.teacherId);
    const activeBatchObj = getActiveBatch();

    if (!teacherToRemove || !activeBatchObj) return;

    setIsDeleting(true);

    try {
      // Call the remove-teacher API
      console.log("Removing teacher:", {
        timetableId,
        batchCode: activeBatchObj.code,
        teacherCode: teacherToRemove.code
      });

      const result = await removeTeacherFromBatchAPI(timetableId, activeBatchObj.code, teacherToRemove.code);
      console.log("Remove teacher API result:", result);

      // Update local state
      const updatedTeachers = currentTeachers.filter(t => t.id !== confirmModalData.teacherId);
      updateBatchAssignments(activeBatch, updatedTeachers);

      // Also update localStorage
      const updatedAssignments = teacherAssignments.map(a =>
        a.batchId === activeBatch
          ? { ...a, teachers: updatedTeachers }
          : a
      );
      localStorage.setItem("batchTeacherAssignments", JSON.stringify(updatedAssignments));

      // Close modal
      setShowConfirmModal(false);
      setConfirmModalData(null);

    } catch (error: any) {
      console.error("Failed to remove teacher:", error);
      setError(`Failed to remove teacher: ${error.message}`);
      // Close modal even on error so user can see the error message
      setShowConfirmModal(false);
      setConfirmModalData(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const updateTeacherLimits = (teacherId: string, field: keyof Teacher, value: number) => {
    const currentTeachers = getBatchAssignments(activeBatch);
    const updatedTeachers = currentTeachers.map(teacher =>
      teacher.id === teacherId
        ? { ...teacher, [field]: value }
        : teacher
    );
    updateBatchAssignments(activeBatch, updatedTeachers);
  };

  // Function to save assignments to backend
  const saveAssignmentsToBackend = async () => {
    if (!timetableId) {
      alert("Please select a timetable first");
      return;
    }

    const activeBatchObj = getActiveBatch();
    if (!activeBatchObj) {
      alert("No active batch found");
      return;
    }

    setSaveStatus("saving");

    try {
      const assignments = getBatchAssignments(activeBatch);

      if (assignments.length === 0) {
        throw new Error("No teachers assigned to save");
      }

      // Assign each teacher to the batch
      const assignmentPromises = assignments.map(teacher =>
        assignTeacherAPI(
          activeBatchObj.code,
          teacher.code,
          teacher.minLecturesPerWeek, // This is sent as total_lectures (min lectures per week)
          teacher.minLecturesPerDay,
          teacher.maxLecturesPerDay,
          teacher.maxLecturesPerWeek
        )
      );

      await Promise.all(assignmentPromises);

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);

    } catch (error: any) {
      console.error("Failed to save assignments:", error);
      setSaveStatus("error");
      alert(`Failed to save assignments: ${error.message}`);
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const saveAssignments = () => {
    saveAssignmentsToBackend();
  };

  const handleSaveAndNext = () => {
    saveAssignmentsToBackend();
    // You can add navigation to next page here
    alert("Saved! Next page would open here.");
  };

  const refreshBatches = () => {
    fetchBatchesFromAPI();
  };

  const refreshTeachers = () => {
    fetchTeachersFromAPI();
  };

  // Open batch selector
  const openBatchSelector = async () => {
    setShowBatchSelector(true);
    await fetchAllBatchesFromAPI();
  };

  /* Load saved data from localStorage */
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedAssignments = localStorage.getItem("batchTeacherAssignments");
        if (savedAssignments) {
          console.log("Loading saved assignments from localStorage:", savedAssignments);
          const parsed = JSON.parse(savedAssignments);
          setTeacherAssignments(parsed);
        }
      } catch (error) {
        console.error("Failed to load saved data:", error);
      }
    };

    loadSavedData();
  }, []);

  /* Update teacher subjects when teachers list is loaded */
  useEffect(() => {
    if (teachers.length > 0 && teacherAssignments.length > 0) {
      // Update subjects from fresh teacher data
      const updatedAssignments = teacherAssignments.map(assignment => ({
        ...assignment,
        teachers: assignment.teachers.map(t => {
          const freshTeacher = teachers.find(ft => ft.code === t.code);
          if (freshTeacher && (t.subject === "General" || !t.subject)) {
            return { ...t, subject: freshTeacher.subject };
          }
          return t;
        })
      }));

      // Only update if there are changes
      const hasChanges = JSON.stringify(updatedAssignments) !== JSON.stringify(teacherAssignments);
      if (hasChanges) {
        setTeacherAssignments(updatedAssignments);
        localStorage.setItem("batchTeacherAssignments", JSON.stringify(updatedAssignments));
        console.log("Updated teacher subjects from fresh data");
      }
    }
  }, [teachers]);

  /* Fetch data on component mount */
  useEffect(() => {
    const fetchAllData = async () => {
      // Get timetable_id from localStorage
      const storedTimetableId = localStorage.getItem('timetable_id');
      if (storedTimetableId) {
        const cleanId = storedTimetableId.replace(/"/g, '').trim();
        console.log("Found timetable_id in localStorage:", cleanId);
        setTimetableId(cleanId);
        await fetchTimetableDetails(cleanId);
        await fetchFreeClassesCount(cleanId);
      } else {
        console.log("No timetable_id found in localStorage");
        setError("No timetable selected. Please select a timetable from the Slots tab first.");
      }

      await fetchTeachersFromAPI();
    };

    fetchAllData();
  }, [centerId]);

  /* Fetch batches when timetable changes */
  useEffect(() => {
    if (timetableId) {
      console.log("Timetable changed, fetching batches for:", timetableId);
      fetchBatchesFromAPI();
    }
  }, [timetableId, centerId]);

  /* Save data to localStorage */
  useEffect(() => {
    console.log("Teacher assignments updated, saving to localStorage:", teacherAssignments);
    localStorage.setItem("batchTeacherAssignments", JSON.stringify(teacherAssignments));
  }, [teacherAssignments]);

  // First, ensure we have an active batch
  useEffect(() => {
    if (batches.length > 0 && !activeBatch) {
      console.log("Setting active batch to first batch:", batches[0].id);
      setActiveBatch(batches[0].id);
    }
  }, [batches, activeBatch]);

  // Loading state
  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <h3 style={styles.title}>Loading Batches...</h3>
          <p>Fetching batch data from the server</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && batches.length === 0) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.errorState}>
          <h3 style={styles.title}>Error Loading Batches</h3>
          <p>{error}</p>
          <button
            style={styles.retryButton}
            onClick={refreshBatches}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeBatchObj = getActiveBatch();

  // Get available batches for adding (batches not already assigned)
  const availableBatches = allBatchesFromAPI.filter(
    apiBatch => !batches.some(viewBatch => viewBatch.id === apiBatch.id)
  );

  if (!activeBatchObj && batches.length > 0) {
    // Show loading while setting active batch
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p>Setting up batch...</p>
        </div>
      </div>
    );
  }

  if (!activeBatchObj) {
    return (
      <div style={styles.wrapper}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Batch Teachers Assignment</h3>
            <p style={styles.subtitle}>
            </p>
          </div>
        </div>

        {/* Timetable Info (Read-only)
        {timetableId && (
          <div style={styles.timetableSelector}>
            <div style={styles.timetableLabel}>
              <strong>Current Timetable:</strong> {timetableName || `Timetable ${timetableId.slice(0, 8)}`}
            </div>
            <div style={styles.timetableInfo}>
              <span>ID: </span>
              <code style={styles.codeText}>{timetableId}</code>
            </div>
          </div>
        )} */}

        {/* Empty State */}
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <h3 style={styles.emptyTitle}>No Batches Assigned</h3>
          <p style={styles.emptyText}>
            {!timetableId
              ? "No timetable selected. Please select a timetable from the Slots tab first."
              : "No batches are assigned to this timetable yet. Click 'Add Batch' to assign one."
            }
          </p>
          {timetableId && (
            <button
              style={styles.addBatchButtonLarge}
              onClick={openBatchSelector}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add Batch to Timetable
            </button>
          )}
        </div>

        {/* Batch Selector Modal */}
        {showBatchSelector && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Assign Batch to Timetable</h3>
                <button
                  style={styles.modalClose}
                  onClick={() => setShowBatchSelector(false)}
                  title="Close"
                >
                  ×
                </button>
              </div>

              <div style={styles.modalBody}>
                {loadingAllBatches ? (
                  <div style={styles.loadingState}>
                    <div style={styles.spinner}></div>
                    <p>Loading available batches...</p>
                  </div>
                ) : availableBatches.length === 0 ? (
                  <div style={styles.noBatchesMessage}>
                    <p>No additional batches available to assign.</p>
                    <p>All batches are already assigned to this timetable.</p>
                  </div>
                ) : (
                  <>
                    <p style={styles.modalText}>
                      Select a batch to assign to this timetable:
                    </p>

                    <div style={styles.batchSelector}>
                      <select
                        value={selectedBatchToAdd}
                        onChange={(e) => setSelectedBatchToAdd(e.target.value)}
                        style={styles.batchSelect}
                      >
                        <option value="">-- Select Batch --</option>
                        {availableBatches.map(batch => (
                          <option key={batch.id} value={batch.id}>
                            {batch.name} ({batch.code}) - {batch.program.name}
                          </option>
                        ))}
                      </select>

                      {selectedBatchToAdd && (
                        <div style={styles.selectedBatchInfo}>
                          <div style={styles.batchInfoRow}>
                            <span style={styles.batchInfoLabel}>Batch:</span>
                            <span style={styles.batchInfoValue}>
                              {availableBatches.find(b => b.id === selectedBatchToAdd)?.name}
                            </span>
                          </div>
                          <div style={styles.batchInfoRow}>
                            <span style={styles.batchInfoLabel}>Code:</span>
                            <span style={styles.batchInfoValue}>
                              {availableBatches.find(b => b.id === selectedBatchToAdd)?.code}
                            </span>
                          </div>
                          <div style={styles.batchInfoRow}>
                            <span style={styles.batchInfoLabel}>Program:</span>
                            <span style={styles.batchInfoValue}>
                              {availableBatches.find(b => b.id === selectedBatchToAdd)?.program.name}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button
                  style={styles.modalCancel}
                  onClick={() => setShowBatchSelector(false)}
                >
                  Cancel
                </button>
                <button
                  style={styles.modalAdd}
                  onClick={addBatchToView}
                  disabled={loadingAllBatches || !selectedBatchToAdd}
                >
                  Assign to Timetable
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const activeBatchTeachers = getBatchAssignments(activeBatch);
  const stats = getBatchStats(activeBatch);

  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Batch Teachers Assignment</h3>
          <p style={styles.subtitle}>
            Assign teachers and set lecture limits for batches in <strong>{centerName}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div style={styles.headerActions}>
          {/* Refresh Buttons */}
          <div style={styles.refreshButtons}>
          </div>

          <div style={styles.actionButtons}>
            <button
              style={styles.addBatchButton}
              onClick={openBatchSelector}
              title="Add Batch from API"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add Batch
            </button>
            <button
              style={styles.saveButton}
              onClick={saveAssignments}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving" ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={styles.spinningIcon}>
                    <path d="M21 12a9 9 0 11-6.219-8.56" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Saving...
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Saved
                </>
              ) : saveStatus === "error" ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Error
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17 21v-8H7v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 3v5h8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Save Batch
                </>
              )}
            </button>


          </div>
        </div>
      </div>

      {/* Timetable Info (Read-only)
      <div style={styles.timetableSelector}>
        <div style={styles.timetableLabel}>
          <strong>Current Timetable:</strong> {timetableName || `Timetable ${timetableId.slice(0, 8)}`}
        </div>
        <div style={styles.timetableInfo}>
          <span>ID: </span>
          <code style={styles.codeText}>{timetableId}</code>
        </div>
      </div> */}

      {/* Error Alert */}
      {error && (
        <div style={styles.errorAlert}>
          <span>{error}</span>
          <button style={styles.errorCloseBtn} onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Help Section */}
      {showHelp && (
        <div style={styles.helpSection}>
          <div style={styles.helpHeader}>
            <p style={styles.helpTitle}>💡 How to use:</p>
            <button
              style={styles.closeHelpBtn}
              onClick={() => setShowHelp(false)}
              title="Close help"
            >
              ×
            </button>
          </div>
          <ul style={styles.helpList}>
            <li>Use "Add Batch" button to assign a batch to the selected timetable</li>
            <li>Only batches assigned to the timetable are displayed</li>
            <li>Click "Add Teacher" to select teachers from the dropdown</li>
            <li>Select Daily limits and Weekly limits</li>
            <li>Select Minimum Classes and Maximum Classes </li>
            <li>Click "Save Batch" to save teacher assignments</li>
          </ul>
        </div>
      )}


      {/* Batch Selector Modal */}
      {showBatchSelector && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Batch from API</h3>
              <button
                style={styles.modalClose}
                onClick={() => setShowBatchSelector(false)}
                title="Close"
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              {loadingAllBatches ? (
                <div style={styles.loadingState}>
                  <div style={styles.spinner}></div>
                  <p>Loading available batches...</p>
                </div>
              ) : availableBatches.length === 0 ? (
                <div style={styles.noBatchesMessage}>
                  <p>No additional batches available to add.</p>
                  <p>All batches from the API are already in your view.</p>
                </div>
              ) : (
                <>
                  <p style={styles.modalText}>
                    Select a batch to add to your view:
                  </p>

                  <div style={styles.batchSelector}>
                    <select
                      value={selectedBatchToAdd}
                      onChange={(e) => setSelectedBatchToAdd(e.target.value)}
                      style={styles.batchSelect}
                    >
                      {availableBatches.map(batch => (
                        <option key={batch.id} value={batch.id}>
                          {batch.name} ({batch.code}) - {batch.program.name}
                        </option>
                      ))}
                    </select>

                    <div style={styles.selectedBatchInfo}>
                      {selectedBatchToAdd && (
                        <>
                          <div style={styles.batchInfoRow}>
                            <span style={styles.batchInfoLabel}>Batch:</span>
                            <span style={styles.batchInfoValue}>
                              {availableBatches.find(b => b.id === selectedBatchToAdd)?.name}
                            </span>
                          </div>
                          <div style={styles.batchInfoRow}>
                            <span style={styles.batchInfoLabel}>Code:</span>
                            <span style={styles.batchInfoValue}>
                              {availableBatches.find(b => b.id === selectedBatchToAdd)?.code}
                            </span>
                          </div>
                          <div style={styles.batchInfoRow}>
                            <span style={styles.batchInfoLabel}>Program:</span>
                            <span style={styles.batchInfoValue}>
                              {availableBatches.find(b => b.id === selectedBatchToAdd)?.program.name}
                            </span>
                          </div>
                          <div style={styles.batchInfoRow}>
                            <span style={styles.batchInfoLabel}>Students:</span>
                            <span style={styles.batchInfoValue}>
                              {availableBatches.find(b => b.id === selectedBatchToAdd)?.student_count}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.modalCancel}
                onClick={() => setShowBatchSelector(false)}
              >
                Cancel
              </button>
              <button
                style={styles.modalAdd}
                onClick={addBatchToView}
                disabled={loadingAllBatches || availableBatches.length === 0}
              >
                Add to View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Tabs */}
      <div style={styles.tabContainer}>
        {batches.map((batch) => {
          const batchStats = getBatchStats(batch.id);
          const isActive = activeBatch === batch.id;

          return (
            <div key={batch.id} style={styles.batchTabWrapper}>
              <button
                onClick={() => setActiveBatch(batch.id)}
                style={{
                  ...styles.batchTab,
                  ...(isActive ? styles.activeBatchTab : {}),
                  borderLeftColor: batch.color || BATCH_COLORS[0]
                }}
              >
                <div style={styles.tabContent}>
                  <div style={styles.tabLeft}>
                    <div style={{ ...styles.batchDot, backgroundColor: batch.color || BATCH_COLORS[0] }}></div>
                    <div style={styles.batchInfoCompact}>
                      <span style={styles.batchTabName}>{batch.name}</span>
                      <div style={styles.batchMeta}>
                        <span style={styles.batchCode}>{batch.code}</span>
                        <span style={styles.separator}>•</span>
                        <span style={styles.batchProgram}>{batch.program.name}</span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.tabStats}>
                    <span style={styles.statBadge}>{batchStats.teachers} teachers</span>
                  </div>
                </div>
              </button>
              <button
                style={styles.removeTabButton}
                onClick={() => removeBatchFromView(batch.id)}
                title="Remove batch from view"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Active Batch Content */}
      <div style={styles.batchContent}>
        {/* Batch Info Header */}
        <div style={styles.batchInfoHeader}>
          <div style={styles.batchInfo}>
            <div style={{ ...styles.batchColorDot, backgroundColor: activeBatchObj.color || BATCH_COLORS[0] }}></div>
            <div>
              <h4 style={styles.activeBatchTitle}>{activeBatchObj.name}</h4>
              <div style={styles.batchDetails}>
                <span><strong>Code:</strong> {activeBatchObj.code}</span>
                <span>•</span>
                <span><strong>Program:</strong> {activeBatchObj.program.name}</span>
                <span>•</span>
                <span><strong>Dates:</strong> {formatDate(activeBatchObj.start_date)} to {formatDate(activeBatchObj.end_date)}</span>
                <span>•</span>
                <span><strong>Students:</strong> {activeBatchObj.student_count}</span>
                <span>•</span>
                <span><strong>Teachers:</strong> {activeBatchTeachers.length}</span>
              </div>
            </div>
          </div>
          <div style={styles.batchStats}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Teachers:</span>
              <span style={styles.statValue}>{stats.teachers}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Min/Day:</span>
              <span style={styles.statValue}>{stats.totalMinPerDay}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Min/Week:</span>
              <span style={styles.statValue}>{stats.totalMinPerWeek}</span>
            </div>
          </div>
        </div>

        {/* Teachers Grid */}
        <div style={styles.gridContainer}>
          {/* Table Header */}
          <div style={styles.tableHeader}>
            <div style={styles.teacherHeaderColumn}>Teachers</div>
            <div style={styles.subjectHeaderColumn}>Subject Details</div>
            <div style={styles.limitsHeaderColumn}>Daily Limits</div>
            <div style={styles.limitsHeaderColumn}>Weekly Limits</div>
          </div>

          {/* Add Teacher Button Row */}
          <div style={styles.addTeacherRow}>
            <div style={styles.addTeacherCell}>
              <button
                style={styles.addTeacherBtn}
                onClick={() => setOpenDropdown(openDropdown === "add-teacher" ? null : "add-teacher")}
                disabled={loadingTeachers}
              >
                {loadingTeachers ? "Loading Teachers..." : "+ Add Teacher"}
              </button>

              {/* Teachers Dropdown */}
              {openDropdown === "add-teacher" && (
                <div style={styles.teachersDropdown}>
                  <div style={styles.dropdownHeader}>
                    <span>Select Teacher or Free Period ({teachers.length + freeClassesCount} available)</span>
                    <button
                      style={styles.closeDropdown}
                      onClick={() => setOpenDropdown(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div style={styles.teachersList}>
                    {/* Free Period Slots */}
                    {freeClassesCount > 0 && (
                      <>
                        <div style={styles.sectionDivider}>
                          <span style={styles.sectionLabel}>☕ Free Periods ({freeClassesCount})</span>
                        </div>
                        {generateFreeSlots().map((freeSlot) => (
                          <div
                            key={freeSlot.id}
                            style={{ ...styles.teacherItem, ...styles.freeSlotItem }}
                            onClick={() => assignTeacher(freeSlot)}
                          >
                            <div style={styles.teacherMainInfo}>
                              <strong style={styles.freeSlotName}>{freeSlot.name}</strong>
                              <div style={styles.freeSlotCode}>
                                {freeSlot.code}
                              </div>
                            </div>
                            <div style={styles.teacherDetails}>
                              Free Period • No Teacher Required
                            </div>
                            <div style={styles.teacherLimits}>
                              Day: {freeSlot.minLecturesPerDay}-{freeSlot.maxLecturesPerDay} •
                              Week: {freeSlot.minLecturesPerWeek}-{freeSlot.maxLecturesPerWeek}
                            </div>
                          </div>
                        ))}
                        <div style={styles.sectionDivider}>
                          <span style={styles.sectionLabel}>👨‍🏫 Teachers ({teachers.length})</span>
                        </div>
                      </>
                    )}

                    {/* Regular Teachers */}
                    {teachers.length === 0 && freeClassesCount === 0 ? (
                      <div style={styles.noTeachersMessage}>
                        <p>No teachers available. Please refresh or check your API connection.</p>
                      </div>
                    ) : (
                      teachers.map((teacher) => (
                        <div
                          key={teacher.id}
                          style={styles.teacherItem}
                          onClick={() => assignTeacher(teacher)}
                        >
                          <div style={styles.teacherMainInfo}>
                            <strong>{teacher.subject}</strong>
                            <div style={styles.teacherCode}>
                              {teacher.code}
                            </div>
                          </div>
                          <div style={styles.teacherDetails}>
                            {teacher.name} • {teacher.department}
                          </div>
                          <div style={styles.teacherLimits}>
                            Day: {teacher.minLecturesPerDay}-{teacher.maxLecturesPerDay} •
                            Week: {teacher.minLecturesPerWeek}-{teacher.maxLecturesPerWeek}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div style={styles.subjectColumn}>
              <div style={styles.addTeacherPrompt}>
                Select a teacher to see subject details
              </div>
            </div>
            <div style={styles.limitsColumn}>
              <div style={styles.addTeacherPrompt}>
                -
              </div>
            </div>
            <div style={styles.limitsColumn}>
              <div style={styles.addTeacherPrompt}>
                -
              </div>
            </div>
          </div>

          {/* Teacher Rows */}
          {activeBatchTeachers.length === 0 ? (
            <div style={styles.noTeachersMessage}>
              <p>No teachers assigned yet. Click "Add Teacher" to get started.</p>
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
                Note: "Min/Week" will be sent as "total_lectures" to backend
              </p>
            </div>
          ) : (
            activeBatchTeachers.map((teacher) => (
              <div key={teacher.id} style={styles.teacherRow}>
                {/* Teacher Column */}
                <div style={styles.teacherColumn}>
                  <div style={styles.teacherCell}>
                    <div style={styles.teacherInfoCompact}>
                      <div style={styles.teacherAvatar}>
                        {teacher.name?.charAt(0) || 'T'}
                      </div>
                      <div>
                        <div style={styles.teacherName}>{teacher.name || 'Unknown'}</div>
                        <div style={styles.teacherDept}>{teacher.department}</div>
                      </div>
                    </div>
                    <button
                      style={styles.removeButton}
                      onClick={() => removeTeacher(teacher.id)}
                      title="Remove teacher"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Subject Details Column */}
                <div style={styles.subjectColumn}>
                  <div style={styles.subjectCell}>
                    <div style={styles.subjectRow}>
                      <div style={styles.subjectLabel}>Subject:</div>
                      <div style={styles.subjectValue}>{teacher.subject}</div>
                    </div>
                    <div style={styles.subjectRow}>
                      <div style={styles.subjectLabel}>Code:</div>
                      <div style={styles.codeValue}>{teacher.code}</div>
                    </div>
                  </div>
                </div>

                {/* Daily Limits Column */}
                <div style={styles.limitsColumn}>
                  <div style={styles.limitsCell}>
                    <div style={styles.limitsContainer}>
                      <div style={styles.limitTypeLabel}>Per Day</div>
                      <div style={styles.limitsInputGroup}>
                        <div style={styles.limitInput}>
                          <div style={styles.limitHeader}>
                            <div style={styles.limitLabel}>Min</div>
                          </div>
                          <input
                            type="number"
                            value={teacher.minLecturesPerDay}
                            onChange={(e) => updateTeacherLimits(teacher.id, 'minLecturesPerDay', parseInt(e.target.value) || 0)}
                            min="0"
                            max="8"
                            style={styles.numberInput}
                          />
                        </div>
                        <div style={styles.limitDivider}>/</div>
                        <div style={styles.limitInput}>
                          <div style={styles.limitHeader}>
                            <div style={styles.limitLabel}>Max</div>
                          </div>
                          <input
                            type="number"
                            value={teacher.maxLecturesPerDay}
                            onChange={(e) => updateTeacherLimits(teacher.id, 'maxLecturesPerDay', parseInt(e.target.value) || 0)}
                            min="0"
                            max="8"
                            style={styles.numberInput}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Weekly Limits Column */}
                <div style={styles.limitsColumn}>
                  <div style={styles.limitsCell}>
                    <div style={styles.limitsContainer}>
                      <div style={styles.limitTypeLabel}>
                        Per Week
                        <div style={styles.infoTooltip}>
                          <span style={styles.infoIcon}>ⓘ</span>
                          <span style={styles.tooltipText}>
                            This is sent as "total_lectures" to backend
                          </span>
                        </div>
                      </div>
                      <div style={styles.limitsInputGroup}>
                        <div style={styles.limitInput}>
                          <div style={styles.limitHeader}>
                            <div style={styles.limitLabel}>Min*</div>
                          </div>
                          <input
                            type="number"
                            value={teacher.minLecturesPerWeek}
                            onChange={(e) => updateTeacherLimits(teacher.id, 'minLecturesPerWeek', parseInt(e.target.value) || 0)}
                            min="0"
                            max="40"
                            style={styles.numberInput}
                          />
                        </div>
                        <div style={styles.limitDivider}>/</div>
                        <div style={styles.limitInput}>
                          <div style={styles.limitHeader}>
                            <div style={styles.limitLabel}>Max</div>
                          </div>
                          <input
                            type="number"
                            value={teacher.maxLecturesPerWeek}
                            onChange={(e) => updateTeacherLimits(teacher.id, 'maxLecturesPerWeek', parseInt(e.target.value) || 0)}
                            min="0"
                            max="40"
                            style={styles.numberInput}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Section */}
        <div style={styles.summarySection}>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Total Teachers:</span>
            <span style={styles.summaryValue}>{activeBatchTeachers.length}</span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Min/Day:</span>
            <span style={styles.summaryValue}>
              {activeBatchTeachers.reduce((sum, t) => sum + t.minLecturesPerDay, 0)}
            </span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Max/Day:</span>
            <span style={styles.summaryValue}>
              {activeBatchTeachers.reduce((sum, t) => sum + t.maxLecturesPerDay, 0)}
            </span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Min/Week*:</span>
            <span style={styles.summaryValue}>
              {activeBatchTeachers.reduce((sum, t) => sum + t.minLecturesPerWeek, 0)}
            </span>
          </div>
          <div style={styles.summaryItem}>
            <span style={styles.summaryLabel}>Max/Week:</span>
            <span style={styles.summaryValue}>
              {activeBatchTeachers.reduce((sum, t) => sum + t.maxLecturesPerWeek, 0)}
            </span>
          </div>
        </div>

        {/* Info Note */}
        <div style={styles.infoNote}>
          <span style={styles.infoNoteIcon}>ⓘ</span>
          <span style={styles.infoNoteText}>
            * <strong>Min/Week</strong> is sent as <code>total_lectures</code> to backend API
          </span>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModalContent}>
            <div style={styles.confirmModalHeader}>
              <div style={styles.confirmModalIcon}>
                {confirmModalType === "batch" ? "📋" : "👨‍🏫"}
              </div>
              <h3 style={styles.confirmModalTitle}>
                {confirmModalType === "batch" ? "Remove Batch" : "Remove Teacher"}
              </h3>
            </div>

            <div style={styles.confirmModalBody}>
              <p style={styles.confirmModalText}>
                {confirmModalType === "batch"
                  ? `Are you sure you want to remove batch "${confirmModalData?.batchName}" from this timetable?`
                  : `Are you sure you want to remove "${confirmModalData?.teacherName}" from this batch?`
                }
              </p>
              <p style={styles.confirmModalWarning}>
                {confirmModalType === "batch"
                  ? "This will also remove all teacher assignments for this batch."
                  : "This action cannot be undone."
                }
              </p>
            </div>

            <div style={styles.confirmModalFooter}>
              <button
                style={styles.confirmModalCancel}
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmModalData(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                style={styles.confirmModalDelete}
                onClick={confirmModalType === "batch" ? confirmRemoveBatch : confirmRemoveTeacher}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span style={styles.buttonSpinner}></span>
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  retryButton: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  },
  emptyState: {
    padding: "60px 40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "2px dashed #cbd5e1",
    marginTop: "20px",
  },
  emptyIcon: {
    fontSize: "48px",
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  emptyText: {
    fontSize: "14px",
    color: "#64748b",
    margin: "0",
    maxWidth: "400px",
  },
  addBatchButtonLarge: {
    padding: "12px 24px",
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
    marginTop: "8px",
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
  actionButtons: {
    display: "flex",
    gap: "8px",
  },
  refreshButtons: {
    display: "flex",
    gap: "8px",
  },
  refreshButton: {
    padding: "10px 20px",
    background: "#f1f5f9",
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
  loadButton: {
    padding: "10px 20px",
    background: "#f1f5f9",
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
  smallButton: {
    padding: "6px 12px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
  },
  addBatchButton: {
    padding: "6px 12px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  saveButton: {
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
    minWidth: "160px",
  },
  primaryButton: {
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
  spinningIcon: {
    animation: "spin 1s linear infinite",
  },
  timetableSelector: {
    padding: "12px 16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  timetableLabel: {
    fontSize: "14px",
    color: "#0369a1",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  timetableInfo: {
    fontSize: "12px",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    gap: "4px",
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
    flexWrap: "wrap",
    gap: "12px",
  },
  centerInfo: {
    fontSize: "14px",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  centerActions: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
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
  helpSection: {
    marginBottom: "24px",
    padding: "16px",
    background: "#f0f9ff",
    borderRadius: "8px",
    border: "1px solid #bae6fd",
  },
  helpHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  helpTitle: {
    fontWeight: "600",
    color: "#0369a1",
    margin: "0",
  },
  closeHelpBtn: {
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
    color: "#6b7280",
    transition: "all 0.2s",
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
    padding: "20px",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  modalClose: {
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
    color: "#6b7280",
    transition: "all 0.2s",
  },
  modalBody: {
    padding: "24px",
    flex: "1",
    overflowY: "auto",
  },
  modalText: {
    fontSize: "14px",
    color: "#475569",
    marginBottom: "16px",
  },
  batchSelector: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  batchSelect: {
    padding: "12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    fontSize: "14px",
    color: "#1e293b",
    width: "100%",
  },
  selectedBatchInfo: {
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  batchInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
  },
  batchInfoLabel: {
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500",
  },
  batchInfoValue: {
    fontSize: "13px",
    color: "#1e293b",
    fontWeight: "500",
  },
  noBatchesMessage: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },
  modalFooter: {
    padding: "20px 24px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  modalCancel: {
    padding: "10px 20px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  },
  modalAdd: {
    padding: "10px 20px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
  },
  // Batch Tabs
  tabContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
    paddingBottom: "12px",
    borderBottom: "2px solid #f1f5f9",
    alignItems: "center",
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
    borderLeft: "4px solid",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  activeBatchTab: {
    background: "#3b82f6",
    color: "#ffffff",
    borderColor: "#3b82f6",
  },
  removeTabButton: {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    border: "1px solid #fca5a5",
    background: "#fef2f2",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
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
  batchInfoCompact: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  batchTabName: {
    fontSize: "14px",
    fontWeight: "500",
  },
  batchMeta: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.8)",
  },
  batchCode: {
    background: "rgba(255,255,255,0.2)",
    padding: "1px 4px",
    borderRadius: "2px",
    fontSize: "10px",
  },
  separator: {
    fontSize: "10px",
  },
  batchProgram: {
    fontSize: "10px",
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
  batchContent: {
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
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
    fontSize: "13px",
    color: "#64748b",
    flexWrap: "wrap",
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
  gridContainer: {
    background: "#ffffff",
  },
  tableHeader: {
    display: "flex",
    background: "#f1f5f9",
    borderBottom: "2px solid #e2e8f0",
  },
  teacherHeaderColumn: {
    width: "250px",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
  },
  subjectHeaderColumn: {
    width: "200px",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
    borderLeft: "1px solid #e2e8f0",
  },
  limitsHeaderColumn: {
    width: "250px",
    padding: "12px 16px",
    fontWeight: "600",
    color: "#475569",
    fontSize: "14px",
    borderLeft: "1px solid #e2e8f0",
  },
  addTeacherRow: {
    display: "flex",
    borderBottom: "1px solid #f1f5f9",
  },
  addTeacherCell: {
    width: "250px",
    padding: "16px",
    background: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
    position: "relative",
  },
  addTeacherBtn: {
    padding: "12px 16px",
    background: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    width: "100%",
  },
  addTeacherPrompt: {
    fontSize: "14px",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  subjectColumn: {
    width: "200px",
    padding: "16px",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
  },
  limitsColumn: {
    width: "250px",
    padding: "16px",
    borderRight: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  noTeachersMessage: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
  },
  teacherRow: {
    display: "flex",
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s",
  },
  teacherColumn: {
    width: "250px",
    padding: "16px",
    background: "#f8fafc",
    borderRight: "1px solid #e2e8f0",
  },
  teacherCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  teacherInfoCompact: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  teacherAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#3b82f6",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "600",
    fontSize: "16px",
  },
  teacherName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  teacherDept: {
    fontSize: "12px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 8px",
    borderRadius: "12px",
    display: "inline-block",
  },
  removeButton: {
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
    transition: "all 0.2s",
  },
  subjectCell: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  subjectRow: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  subjectLabel: {
    fontSize: "11px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    fontWeight: "500",
  },
  subjectValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },
  codeValue: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#3b82f6",
    background: "#eff6ff",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
  },
  limitsCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  limitsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    width: "100%",
  },
  limitTypeLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  infoTooltip: {
    position: "relative",
    display: "inline-block",
  },
  infoIcon: {
    fontSize: "10px",
    color: "#3b82f6",
    cursor: "pointer",
  },
  tooltipText: {
    visibility: "hidden",
    width: "180px",
    backgroundColor: "#1e293b",
    color: "#fff",
    textAlign: "center",
    borderRadius: "6px",
    padding: "8px",
    position: "absolute",
    zIndex: "1",
    bottom: "125%",
    left: "50%",
    marginLeft: "-90px",
    fontSize: "11px",
    opacity: "0",
    transition: "opacity 0.3s",
  },
  limitsInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "#f0f9ff",
    padding: "12px 16px",
    borderRadius: "8px",
    width: "100%",
    justifyContent: "center",
  },
  limitInput: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  limitHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  limitLabel: {
    fontSize: "11px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  numberInput: {
    width: "70px",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #cbd5e1",
    textAlign: "center",
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    background: "#ffffff",
  },
  limitDivider: {
    fontSize: "20px",
    color: "#94a3b8",
    fontWeight: "300",
    marginTop: "8px",
  },
  teachersDropdown: {
    position: "absolute",
    top: "100%",
    left: "0",
    width: "100%",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    marginTop: "8px",
    zIndex: "1000",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  },
  dropdownHeader: {
    padding: "12px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeDropdown: {
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: "14px",
  },
  teachersList: {
    maxHeight: "300px",
    overflowY: "auto",
  },
  teacherItem: {
    padding: "12px 16px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  teacherMainInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  teacherCode: {
    fontSize: "11px",
    color: "#64748b",
    background: "#f1f5f9",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  teacherDetails: {
    fontSize: "12px",
    color: "#475569",
  },
  teacherLimits: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  // Free Slot Styles
  sectionDivider: {
    padding: "8px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
  },
  sectionLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
  },
  freeSlotItem: {
    background: "#f0fdf4",
    borderLeft: "3px solid #10b981",
  },
  freeSlotName: {
    color: "#059669",
  },
  freeSlotCode: {
    fontSize: "11px",
    color: "#059669",
    background: "#d1fae5",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: "600",
  },
  summarySection: {
    display: "flex",
    justifyContent: "space-between",
    padding: "20px",
    background: "#ffffff",
    borderTop: "1px solid #e2e8f0",
    marginTop: "20px",
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  summaryLabel: {
    fontSize: "12px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  summaryValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1e293b",
  },
  infoNote: {
    padding: "12px 20px",
    background: "#f0f9ff",
    borderTop: "1px solid #bae6fd",
    fontSize: "13px",
    color: "#0369a1",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  infoNoteIcon: {
    fontSize: "14px",
  },
  infoNoteText: {
    flex: "1",
  },
  // Confirmation Modal Styles
  confirmModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    maxWidth: "420px",
    width: "100%",
    overflow: "hidden",
  },
  confirmModalHeader: {
    padding: "24px 24px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  confirmModalIcon: {
    fontSize: "48px",
  },
  confirmModalTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1e293b",
    margin: "0",
  },
  confirmModalBody: {
    padding: "0 24px 24px",
    textAlign: "center",
  },
  confirmModalText: {
    fontSize: "14px",
    color: "#475569",
    margin: "0 0 12px 0",
    lineHeight: "1.5",
  },
  confirmModalWarning: {
    fontSize: "13px",
    color: "#dc2626",
    margin: "0",
    padding: "8px 12px",
    background: "#fef2f2",
    borderRadius: "6px",
  },
  confirmModalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    background: "#f8fafc",
  },
  confirmModalCancel: {
    padding: "10px 20px",
    background: "#ffffff",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.2s",
  },
  confirmModalDelete: {
    padding: "10px 20px",
    background: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.2s",
  },
  buttonSpinner: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
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
    fontSize: "14px",
  },
  errorCloseBtn: {
    background: "none",
    border: "none",
    color: "#dc2626",
    cursor: "pointer",
    fontSize: "18px",
    padding: "0",
    marginLeft: "12px",
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

// Add hover effect for tooltip
styleSheet.insertRule(`
  .infoTooltip:hover .tooltipText {
    visibility: visible;
    opacity: 1;
  }
`, styleSheet.cssRules.length);

// Create an Error Boundary wrapper
const BatchScheduleWithErrorBoundary: React.FC = () => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        margin: "24px",
      }}>
        <h3 style={{ fontSize: "20px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
          Error Loading Schedule
        </h3>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>
          Please refresh the page or clear localStorage
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 20px",
            background: "#3b82f6",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "14px",
          }}
        >
          Refresh Page
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("batchTeacherAssignments");
            window.location.reload();
          }}
          style={{
            padding: "10px 20px",
            background: "#f1f5f9",
            color: "#475569",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "14px",
            marginLeft: "12px",
          }}
        >
          Clear Data & Refresh
        </button>
      </div>
    );
  }

  try {
    return <BatchSchedule />;
  } catch (error) {
    console.error("BatchSchedule error:", error);
    setHasError(true);
    return null;
  }
};

export default BatchScheduleWithErrorBoundary;