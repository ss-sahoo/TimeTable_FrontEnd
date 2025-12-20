import { Fetch } from "./usefetch"

// ==================== HELPER FUNCTIONS ====================

/**
 * Clean timetable ID - remove quotes and extra characters
 */
export const cleanTimetableId = (rawId) => {
  if (!rawId) return null
  return rawId.replace(/"/g, '').trim()
}

// ==================== TEACHER AVAILABILITY APIs ====================

/**
 * Set teacher availability (Admin)
 * POST /api/timetable/admin/timetables/teacher-availability/
 */
export const setTeacherAvailability = async (data) => {
  const response = await Fetch("/api/timetable/admin/timetables/teacher-availability/", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

/**
 * Get teacher-wise availability for a timetable
 * GET /api/timetable/timetables/{timetable_id}/teacher-wise-availability/
 */
export const getTeacherWiseAvailability = async (timetableId) => {
  const response = await Fetch(`/api/timetable/timetables/${timetableId}/teacher-wise-availability/`, {
    method: "GET",
  })
  return response.json()
}

/**
 * Fetch teacher-wise availability (alias for getTeacherWiseAvailability)
 * Used by Teachers.tsx component
 */
export const fetchTeacherWiseAvailability = async (timetableId) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch(`/api/timetable/timetables/${cleanId}/teacher-wise-availability/`, {
    method: "GET",
  })
  return response.json()
}

/**
 * Update teacher availability for a specific slot
 * POST /api/timetable/admin/timetables/teacher-availability/
 */
export const updateTeacherAvailability = async (timetableId, daySlotId, teacherCode, isAvailable) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch("/api/timetable/admin/timetables/teacher-availability/", {
    method: "POST",
    body: JSON.stringify({
      timetable_id: cleanId,
      day_slot_id: daySlotId,
      teacher_code: teacherCode,
      is_available: isAvailable,
    }),
  })
  return response.json()
}

// ==================== TIMETABLE SLOTS APIs ====================

/**
 * Get all slots for a timetable
 * GET /api/timetable/timetables/{timetable_id}/slots/
 */
export const getTimetableSlots = async (timetableId) => {
  const response = await Fetch(`/api/timetable/timetables/${timetableId}/slots/`, {
    method: "GET",
  })
  return response.json()
}

/**
 * Fetch timetable slots (alias with cleaning)
 */
export const fetchTimetableSlots = async (timetableId) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch(`/api/timetable/timetables/${cleanId}/slots/`, {
    method: "GET",
  })
  return response.json()
}

// ==================== BATCH ASSIGNMENTS APIs ====================

/**
 * Get batch assignments for a timetable
 * GET /api/timetable/timetables/{timetable_id}/batch-assignments/
 */
export const fetchBatchAssignments = async (timetableId) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch(`/api/timetable/timetables/${cleanId}/batch-assignments/`, {
    method: "GET",
  })
  return response.json()
}

// ==================== FIXED SLOTS APIs ====================

/**
 * Assign a fixed slot to a teacher for a batch
 * POST /api/timetable/admin/timetables/fixed-slots/assign/
 */
export const assignFixedSlot = async (timetableId, slotCode, batchCode, teacherCode, subject) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch("/api/timetable/admin/timetables/fixed-slots/assign/", {
    method: "POST",
    body: JSON.stringify({
      timetable_id: cleanId,
      slot_code: slotCode,
      batch_code: batchCode,
      teacher_code: teacherCode,
      subject: subject,
    }),
  })
  return response.json()
}

/**
 * Remove a fixed slot assignment
 * POST /api/timetable/admin/timetables/fixed-slots/remove/
 */
export const removeFixedSlot = async (timetableId, slotCode, batchCode) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch("/api/timetable/admin/timetables/fixed-slots/remove/", {
    method: "POST",
    body: JSON.stringify({
      timetable_id: cleanId,
      slot_code: slotCode,
      batch_code: batchCode,
    }),
  })
  return response.json()
}

// ==================== TEACHERS APIs ====================

/**
 * Fetch teachers for a center
 * GET /api/timetable/centers/{center_id}/users/?role=teacher
 */
export const fetchCenterTeachers = async (centerId) => {
  const response = await Fetch(`/api/timetable/centers/${centerId}/users/?role=teacher`, {
    method: "GET",
  })
  return response.json()
}

// ==================== BATCH APIs ====================

/**
 * Create a new batch
 * POST /api/timetable/admin/batches/create/
 */
export const createBatch = async (data) => {
  const response = await Fetch("/api/timetable/admin/batches/create/", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return response.json()
}

// ==================== PROGRAMS APIs ====================

/**
 * Fetch all programs
 * GET /api/timetable/programs/
 */
export const fetchPrograms = async () => {
  const response = await Fetch("/api/timetable/programs/", {
    method: "GET",
  })
  return response.json()
}

// ==================== EXPORT ====================

export default {
  cleanTimetableId,
  setTeacherAvailability,
  getTeacherWiseAvailability,
  fetchTeacherWiseAvailability,
  updateTeacherAvailability,
  getTimetableSlots,
  fetchTimetableSlots,
  fetchBatchAssignments,
  assignFixedSlot,
  removeFixedSlot,
  fetchCenterTeachers,
  createBatch,
  fetchPrograms,
}
