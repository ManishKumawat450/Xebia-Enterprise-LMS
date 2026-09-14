import { TEMPORARY_STUDENT_ID } from "@/config/student-identity";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

/**
 * Standard fetch wrapper that automatically handles JSON and error states
 */
async function fetchApi(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-Tenant-Id": "123e4567-e89b-12d3-a456-426614174000",
    "X-User-Id": TEMPORARY_STUDENT_ID,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = "An error occurred while fetching data";
    try {
      const errorData = await response.json();
      errorMsg = errorData.message || errorMsg;
    } catch (e) {
      // Not JSON
    }
    throw new Error(errorMsg);
  }

  // Handle empty responses (like 204 No Content)
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const EnrollmentService = {
  enroll: (courseId) => fetchApi(`/enrollments/${courseId}`, { method: "POST" }),
  unenroll: (courseId) => fetchApi(`/enrollments/${courseId}`, { method: "DELETE" }),
  getStatus: (courseId) => fetchApi(`/enrollments/${courseId}/status`),
  getMyCourses: () => fetchApi("/enrollments/my-courses"),
};

export const ProgressService = {
  markComplete: (courseId, submoduleId) =>
    fetchApi(`/progress/course/${courseId}/submodule/${submoduleId}/complete`, { method: "POST" }),
  markIncomplete: (courseId, submoduleId) =>
    fetchApi(`/progress/course/${courseId}/submodule/${submoduleId}/complete`, {
      method: "DELETE",
    }),
  updateAccess: (courseId, submoduleId, contentId) =>
    fetchApi(`/progress/course/${courseId}/access`, {
      method: "POST",
      body: JSON.stringify({ submoduleId, contentId }),
    }),
  getCourseProgress: (courseId) => fetchApi(`/progress/course/${courseId}`),
};

export const CourseService = {
  getCourses: () => fetchApi("/courses", { cache: "no-store" }),
  getCourseById: (id) => fetchApi(`/courses/${id}`, { cache: "no-store" }),
  getCourseHierarchy: async (id) => {
    const dto = await fetchApi(`/courses/${id}/hierarchy`, { cache: "no-store" });
    if (!dto) return null;
    const mappedCourse = { ...dto.course };
    mappedCourse.modules = (dto.modules || []).map((mDto) => ({
      ...mDto.module,
      submodules: (mDto.submodules || []).map((sDto) => ({
        ...sDto.submodule,
        contentBlocks: sDto.contentBlocks || [],
      })),
    }));
    mappedCourse.modulesCount = mappedCourse.modules.length;
    mappedCourse.submodulesCount = mappedCourse.modules.reduce(
      (acc, m) => acc + (m.submodules?.length || 0),
      0,
    );
    return mappedCourse;
  },
  getCourseBySlug: async (slug) => {
    try {
      const all = await fetchApi("/courses");
      // If course doesn't have a slug, match by lowercased title
      const course = all.find(
        (c) =>
          c.slug === slug ||
          (c.title && c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug),
      );
      if (!course) throw new Error("Course not found");
      return course;
    } catch (err) {
      console.warn("Falling back to mock for getCourseBySlug", err);
      throw err;
    }
  },
  createCourse: (data) => fetchApi("/courses", { method: "POST", body: JSON.stringify(data) }),
  updateCourse: (id, data) =>
    fetchApi(`/courses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCourse: (id) => fetchApi(`/courses/${id}`, { method: "DELETE" }),
  addModule: (courseId, data) =>
    fetchApi(`/courses/${courseId}/modules`, { method: "POST", body: JSON.stringify(data) }),
  updateModule: (moduleId, data) =>
    fetchApi(`/courses/modules/${moduleId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteModule: (moduleId) => fetchApi(`/courses/modules/${moduleId}`, { method: "DELETE" }),
  addSubmodule: (courseId, moduleId, data) =>
    fetchApi(`/courses/${courseId}/modules/${moduleId}/submodules`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSubmodule: (submoduleId, data) =>
    fetchApi(`/courses/submodules/${submoduleId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSubmodule: (submoduleId) =>
    fetchApi(`/courses/submodules/${submoduleId}`, { method: "DELETE" }),
  addContentItem: (courseId, data) =>
    fetchApi(`/courses/${courseId}/content-items`, { method: "POST", body: JSON.stringify(data) }),
  updateContentItem: (contentId, data) =>
    fetchApi(`/courses/content-items/${contentId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteContentItem: (contentId) =>
    fetchApi(`/courses/content-items/${contentId}`, { method: "DELETE" }),
};

export const UserService = {
  getUsers: (role) => fetchApi(`/v1/users${role ? "?role=" + role : ""}`),
  getUser: (id) => fetchApi(`/v1/users/${id}`),
  createUser: (data) => fetchApi("/v1/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id, data) =>
    fetchApi(`/v1/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id) => fetchApi(`/v1/users/${id}`, { method: "DELETE" }),
};

export const NotificationService = {
  getAll: () => fetchApi("/v1/notifications"),
  sync: (notifications) =>
    fetchApi("/v1/notifications/sync", {
      method: "POST",
      body: JSON.stringify(notifications),
    }),
};

export const FeedbackService = {
  submitFeedback: (data) =>
    fetchApi("/v1/feedback", { method: "POST", body: JSON.stringify(data) }),
  getFeedback: (studentId) =>
    fetchApi(`/v1/feedback${studentId ? "?studentId=" + studentId : ""}`),
};

export const TrainerCascadeService = {
  deleteBatchesByCreator: (createdBy) =>
    fetchApi(`/v1/batches/created-by/${createdBy}`, { method: "DELETE" }),
  deleteAllocationsByTrainer: (trainerId) =>
    fetchApi(`/v1/allocations/trainer/${trainerId}`, { method: "DELETE" }),
  deleteAssessmentsByCreator: (createdBy) =>
    fetchApi(`/v1/assessments/created-by/${createdBy}`, { method: "DELETE" }),
  deleteEventsByCreator: (createdBy) =>
    fetchApi(`/v1/events/created-by/${createdBy}`, { method: "DELETE" }),
};

export const BatchService = {
  getBatches: () => fetchApi("/v1/batches"),
  createBatch: (data) => fetchApi("/v1/batches", { method: "POST", body: JSON.stringify(data) }),
  updateBatch: (id, data) =>
    fetchApi(`/v1/batches/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBatch: (id) => fetchApi(`/v1/batches/${id}`, { method: "DELETE" }),
  enrolStudent: (batchId, data) =>
    fetchApi(`/v1/batches/${batchId}/students`, { method: "POST", body: JSON.stringify(data) }),
};

export const AssessmentService = {
  getAssessments: () => fetchApi("/v1/assessments"),
  createAssessment: (data) =>
    fetchApi("/v1/assessments", { method: "POST", body: JSON.stringify(data) }),
  updateAssessment: (id, data) =>
    fetchApi(`/v1/assessments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAssessment: (id) => fetchApi(`/v1/assessments/${id}`, { method: "DELETE" }),
  deleteByBatch: (batchId) => fetchApi(`/v1/assessments/batch/${batchId}`, { method: "DELETE" }),
};

export const SubmissionService = {
  getSubmissions: async (studentId) => {
    const data = await fetchApi(
      `/v1/submissions${studentId ? "?studentId=" + studentId : ""}`,
    );
    return (data || []).map((sub) => ({
      ...sub,
      answers: sub.answers?.map((a) => {
        let parsed = a.answer;
        try {
          if (
            parsed &&
            typeof parsed === "string" &&
            (parsed.startsWith("[") || parsed.startsWith("{"))
          ) {
            parsed = JSON.parse(parsed);
          }
        } catch (e) {}
        return { ...a, answer: parsed };
      }),
    }));
  },
  createSubmission: (data) => {
    const payload = {
      ...data,
      answers: data.answers?.map((a) => ({
        ...a,
        answer: typeof a.answer === "object" ? JSON.stringify(a.answer) : String(a.answer || ""),
      })),
    };
    return fetchApi("/v1/submissions", { method: "POST", body: JSON.stringify(payload) });
  },
  updateSubmission: (id, data) => {
    const payload = {
      ...data,
      answers: data.answers?.map((a) => ({
        ...a,
        answer: typeof a.answer === "object" ? JSON.stringify(a.answer) : String(a.answer || ""),
      })),
    };
    return fetchApi(`/v1/submissions/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
};

export const DraftService = {
  saveDraft: (studentId, assessmentId, draftData) =>
    fetchApi(`/v1/assessments/drafts/${studentId}/${assessmentId}`, {
      method: "POST",
      body: JSON.stringify(draftData),
    }),
  getDraft: (studentId, assessmentId) =>
    fetchApi(`/v1/assessments/drafts/${studentId}/${assessmentId}`).catch(() => null),
};

export const AIDescriptionService = {
  generateDescription: (topic) =>
    fetchApi("/v1/assessments/ai/generate-description", {
      method: "POST",
      body: JSON.stringify({ topic }),
    }),
};

export const AuthService = {
  login: (credentials) =>
    fetchApi("/iam/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  getProfile: () => fetchApi("/iam/me"),
};

export const CategoryService = {
  getCategories: async () => {
    return await fetchApi("/categories");
  },
  getCategoryById: async (id) => {
    try {
      const all = await fetchApi("/categories");
      const cat = all.find((c) => String(c.id) === String(id));
      if (!cat) throw new Error("Category not found");
      return cat;
    } catch (err) {
      console.warn("Falling back to mock for getCategoryById", err);
      throw err;
    }
  },
  getCategoryBySlug: async (slug) => {
    try {
      const all = await fetchApi("/categories");
      // Some categories might have actual slug fields. If not, match by name.
      const cat = all.find(
        (c) =>
          c.slug === slug || (c.name && c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug),
      );
      if (!cat) throw new Error("Category not found");
      return cat;
    } catch (err) {
      console.warn("Falling back to mock for getCategoryBySlug", err);
      throw err;
    }
  },
  createCategory: async (data) => {
    return await fetchApi("/categories", { method: "POST", body: JSON.stringify(data) });
  },
  updateCategory: async (id, data) => {
    return await fetchApi(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deleteCategory: async (id) => {
    await fetchApi(`/categories/${id}`, { method: "DELETE" });
    return true;
  },
};

export const AllocationService = {
  getAllocations: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.trainerId) params.append("trainerId", filters.trainerId);
    if (filters.batchId) params.append("batchId", filters.batchId);
    if (filters.courseId) params.append("courseId", filters.courseId);
    if (filters.university) params.append("university", filters.university);
    if (filters.status) params.append("status", filters.status);
    const qs = params.toString();
    return fetchApi(`/v1/allocations${qs ? "?" + qs : ""}`);
  },
  getAllocationById: (id) => fetchApi(`/v1/allocations/${id}`),
  createAllocation: (data) => fetchApi("/v1/allocations", { method: "POST", body: JSON.stringify(data) }),
  updateAllocation: (id, data) => fetchApi(`/v1/allocations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAllocation: (id) => fetchApi(`/v1/allocations/${id}`, { method: "DELETE" }),
  deleteAllocationsByBatch: (batchId) => fetchApi(`/v1/allocations/batch/${batchId}`, { method: "DELETE" }),
  createBulkAllocations: (allocations) => fetchApi("/v1/allocations/bulk", { method: "POST", body: JSON.stringify(allocations) }),
  getDashboardSummary: () => fetchApi("/v1/allocations/dashboard"),
  getAnalytics: () => fetchApi("/v1/allocations/analytics"),
  getTrainerAllocations: (trainerId) => fetchApi(`/v1/allocations/trainer/${trainerId}`),
  getBatchAllocations: (batchId) => fetchApi(`/v1/allocations/batch/${batchId}`),
  getCourseAllocations: (courseId) => fetchApi(`/v1/allocations/course/${courseId}`),
  getUniversityAllocations: (university) => fetchApi(`/v1/allocations/university/${university}`),
};

// ============================================================
// Admin Assessment Service
// ============================================================
export const AdminAssessmentService = {
  getDashboard: () => fetchApi("/v1/assessments/dashboard"),
  getAnalytics: () => fetchApi("/v1/assessments/analytics"),
  getAssessmentDetails: (id) => fetchApi(`/v1/assessments/${id}/details`),
  getStudentReport: (id) => fetchApi(`/v1/assessments/${id}/report`),
  getTrainerPerformance: () => fetchApi("/v1/assessments/trainer-performance"),
  getBatchPerformance: () => fetchApi("/v1/assessments/batch-performance"),
};

// ============================================================
// Event Service
// ============================================================
export const EventService = {
  getEvents: () => fetchApi("/v1/events"),
  getEventById: (id) => fetchApi(`/v1/events/${id}`),
  createEvent: (data) => fetchApi("/v1/events", { method: "POST", body: JSON.stringify(data) }),
  updateEvent: (id, data) => fetchApi(`/v1/events/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEvent: (id) => fetchApi(`/v1/events/${id}`, { method: "DELETE" }),
  registerForEvent: (eventId) => fetchApi(`/v1/events/${eventId}/register`, { method: "POST" }),
  cancelRegistration: (eventId) => fetchApi(`/v1/events/${eventId}/register`, { method: "DELETE" }),
  getRegistrationStatus: (eventId) => fetchApi(`/v1/events/${eventId}/registration-status`),
  getEventRegistrants: (eventId) => fetchApi(`/v1/events/${eventId}/registrations`),
  getMyRegistrations: () => fetchApi("/v1/events/registrations/my"),
};
