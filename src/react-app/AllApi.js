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
 * Assign a fixed slot to a teacher for a batch (or special slot like Exam/Free Period)
 * POST /api/timetable/admin/timetables/fixed-slots/assign/
 */
export const assignFixedSlot = async (timetableId, slotCode, batchCode, teacherCode, subject) => {
  const cleanId = cleanTimetableId(timetableId)
  const payload = {
    timetable_id: cleanId,
    slot_code: slotCode,
    batch_code: batchCode,
    subject: subject,
  }
  // Only include teacher_code if provided (for Exam/Free Period, it's null)
  if (teacherCode) {
    payload.teacher_code = teacherCode
  }
  const response = await Fetch("/api/timetable/admin/timetables/fixed-slots/assign/", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return response.json()
}

/**
 * Remove a fixed slot assignment by ID
 * DELETE /api/timetable/admin/timetables/fixed-slots/{fixed_slot_id}/delete/
 */
export const deleteFixedSlotById = async (fixedSlotId) => {
  const response = await Fetch(`/api/timetable/admin/timetables/fixed-slots/${fixedSlotId}/delete/`, {
    method: "DELETE",
  })
  if (!response.ok) {
    throw new Error(`Failed to delete fixed slot: ${response.status}`)
  }
  // DELETE might return empty response
  const text = await response.text()
  return text ? JSON.parse(text) : { success: true }
}

/**
 * Fetch all fixed slots for a timetable
 * GET /api/timetable/timetables/{timetable_id}/fixed-slots/
 */
export const fetchFixedSlots = async (timetableId) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch(`/api/timetable/timetables/${cleanId}/fixed-slots/`, {
    method: "GET",
  })
  return response.json()
}

/**
 * Remove a fixed slot assignment (legacy - by slot_code and batch_code)
 * POST /api/timetable/admin/timetables/fixed-slots/remove/
 */
export const removeFixedSlot = async (timetableId, slotCode, batchCode) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch("/api/timetable/admin/timetables/fixed-slots/delete/", {
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

// ==================== TIMETABLE CRUD APIs ====================

/**
 * Fetch all timetables for a center
 * GET /api/timetable/timetables/?center_name={center_name}
 */
export const fetchAllTimetables = async (centerName) => {
  const url = centerName 
    ? `/api/timetable/timetables/?center_name=${encodeURIComponent(centerName)}`
    : "/api/timetable/timetables/"
  const response = await Fetch(url, {
    method: "GET",
  })
  return response.json()
}

/**
 * Update an existing timetable
 * PUT /api/timetable/admin/timetables/{timetable_id}/update/
 */
export const updateTimetable = async (timetableId, data) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch(`/api/timetable/admin/timetables/${cleanId}/update/`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
  return response.json()
}

/**
 * Update free classes count for a timetable
 * POST /api/timetable/admin/timetables/{timetable_id}/free-classes/
 */
export const updateFreeClassesCount = async (timetableId, freeClassesCount) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch(`/api/timetable/admin/timetables/${cleanId}/free-classes/`, {
    method: "POST",
    body: JSON.stringify({
      free_classes_count: freeClassesCount,
    }),
  })
  return response.json()
}

// ==================== BATCH/TEACHER REMOVAL APIs ====================

/**
 * Remove a batch from a timetable
 * POST /api/timetable/admin/timetables/remove-batch/
 */
export const removeBatchFromTimetable = async (timetableId, batchCode) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch("/api/timetable/admin/timetables/remove-batch/", {
    method: "POST",
    body: JSON.stringify({
      timetable_id: cleanId,
      batch_code: batchCode,
    }),
  })
  return response.json()
}

/**
 * Remove a teacher from a batch in a timetable
 * POST /api/timetable/admin/timetables/remove-teacher/
 */
export const removeTeacherFromBatch = async (timetableId, batchCode, teacherCode) => {
  const cleanId = cleanTimetableId(timetableId)
  const response = await Fetch("/api/timetable/admin/timetables/remove-teacher/", {
    method: "POST",
    body: JSON.stringify({
      timetable_id: cleanId,
      batch_code: batchCode,
      teacher_code: teacherCode,
    }),
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
  deleteFixedSlotById,
  fetchFixedSlots,
  fetchCenterTeachers,
  createBatch,
  fetchPrograms,
  fetchAllTimetables,
  updateTimetable,
  updateFreeClassesCount,
  removeBatchFromTimetable,
  removeTeacherFromBatch,
}
