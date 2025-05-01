import axios from 'axios';
import { config } from '../config';

// Get the API URL from config with fallback
const API_URL = config.api.url || 'http://localhost:3000';

// Don't append '/api' - use the API_URL directly as provided
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Debugging interceptor to log responses
apiClient.interceptors.response.use(
  response => {
    console.log('API Response:', response.config.url, response.data);
    return response;
  },
  error => {
    console.error('API Error:', error.config?.url, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
  checkUserRole: () => apiClient.get('/auth/role'),
  loginWithMicrosoft: (msalToken) => apiClient.post('/auth/microsoft', { token: msalToken }),
  verifyPassword: (password) => apiClient.post('/auth/verify-password', { password }),
};

// Assessment services
export const assessmentService = {
  getPendingAssessments: () => apiClient.get('/assessments/pending'),
  getCompletedAssessments: () => apiClient.get('/assessments/completed'),
  getAssessmentById: (id) => apiClient.get(`/assessments/${id}`),
  createAssessment: (assessment) => apiClient.post('/assessments', assessment),
  updateAssessment: (id, assessment) => apiClient.put(`/assessments/${id}`, assessment),
  deleteAssessment: (id) => apiClient.delete(`/assessments/${id}`),
  submitAssessment: (id, data) => apiClient.post(`/assessments/${id}/submit`, data),
  getAssessmentResults: (id) => apiClient.get(`/assessments/${id}/results`),
};

// Course services
export const courseService = {
  getCourses: (teaching = false) => apiClient.get(`/courses${teaching ? '?teaching=true' : ''}`),
  getCourseById: (id) => apiClient.get(`/courses/${id}`),
  createCourse: (course) => apiClient.post('/courses', course),
  updateCourse: (id, course) => apiClient.put(`/courses/${id}`, course),
  addStudentToCourse: (courseId, studentId) => apiClient.post(`/courses/${courseId}/students`, { studentId }),
  removeStudentFromCourse: (courseId, studentId) => apiClient.delete(`/courses/${courseId}/students/${studentId}`),
  addTeacherToCourse: (courseId, teacherId) => apiClient.post(`/courses/${courseId}/teachers`, { teacherId }),
  getUserCourses: (userId) => apiClient.get(`/users/${userId}/courses`),
};

// Group services
export const groupService = {
  getGroups: (courseId) => apiClient.get(courseId ? `/groups?courseId=${courseId}` : '/groups'),
  getGroupById: (id) => apiClient.get(`/groups/${id}`),
  createGroup: (group) => apiClient.post('/groups', group),
  createGroupForCourse: (courseId, groupData) => apiClient.post('/groups', { ...groupData, courseId }),
  updateGroup: (id, group) => apiClient.put(`/groups/${id}`, group),
  deleteGroup: (id) => apiClient.delete(`/groups/${id}`),
  addStudentToGroup: (groupId, studentId) => apiClient.post(`/groups/${groupId}/students`, { studentId }),
  removeStudentFromGroup: (groupId, studentId) => apiClient.delete(`/groups/${groupId}/students/${studentId}`),
};

// User/student services
export const userService = {
  getStudents: () => apiClient.get('/users/students'),
  getTeachers: () => apiClient.get('/users/teachers'),
  getUserById: (id) => apiClient.get(`/users/${id}`),
  getAllUsers: () => apiClient.get('/users/all'), // Changed this to hit the right endpoint
  createUser: (userData) => apiClient.post('/users', userData),
  updateUser: (id, userData) => apiClient.put(`/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
  importStudents: (formData) => apiClient.post('/users/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Import services
export const importService = {
  importStudents: (formData) => apiClient.post('/import/students', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  importGroups: (formData) => apiClient.post('/import/groups', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStudentTemplate: () => apiClient.get('/import/template/students'),
  getGroupTemplate: () => apiClient.get('/import/template/groups'),
};

export default {
  auth: authService,
  assessments: assessmentService,
  courses: courseService,
  groups: groupService,
  users: userService,
  import: importService,
};
