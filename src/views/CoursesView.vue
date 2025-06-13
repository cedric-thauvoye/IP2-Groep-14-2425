<template>
  <PageLayout>
    <div class="courses-container">
      <div class="header">
        <div class="title-section">
          <h1>Courses</h1>
          <p class="subtitle">{{ isTeacher ? 'Manage your courses' : 'Your enrolled courses' }}</p>
        </div>
        <div class="actions" v-if="isTeacher">
          <button class="action-button create" @click="openCreateCourseModal">
            <i class="fas fa-plus"></i> Create Course
          </button>
        </div>
      </div>

      <div class="filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" v-model="searchQuery" placeholder="Search courses...">
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading courses...</p>
      </div>

      <div v-else-if="filteredCourses.length" class="courses-grid">
        <div v-for="course in filteredCourses"
             :key="course.id"
             class="course-card"
             :class="{ active: course.isActive }"
        >
          <div class="course-header" :style="{ backgroundColor: getCourseColor(course.id) }">
            <i class="fas fa-book"></i>
          </div>
          <div class="course-content">
            <h3>{{ course.name }}</h3>
            <p class="description">{{ course.description || 'No description available' }}</p>
            <div class="course-stats">
              <div class="stat">
                <i class="fas fa-users"></i>
                <span>{{ course.student_count || 0 }} Students</span>
              </div>
              <div class="stat">
                <i class="fas fa-tasks"></i>
                <span>{{ course.assessment_count || 0 }} Assessments</span>
              </div>
            </div>
          </div>
          <div class="course-footer">
            <button class="view-button" @click="viewCourseDetails(course.id)">
              View Details
            </button>
            <div class="teacher-actions" v-if="isTeacher">
              <button class="icon-button edit" @click="editCourse(course)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="icon-button delete" @click="deleteCourse(course.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="fas fa-books"></i>
        <h3>No Courses Found</h3>
        <p>{{ isTeacher ? 'Create a new course to get started' : 'You are not enrolled in any courses' }}</p>
      </div>

      <!-- Create Course Modal -->
      <div v-if="showCreateCourseModal" class="modal-overlay">
        <div class="modal-content create-course-modal">
          <div class="modal-header">
            <h2>Create New Course</h2>
            <button class="close-button" @click="showCreateCourseModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createNewCourse">
              <div class="form-row">
                <div class="form-group">
                  <label for="new-course-name">Course Name*</label>
                  <input
                    type="text"
                    id="new-course-name"
                    v-model="newCourse.name"
                    required
                    placeholder="Enter course name"
                    class="form-input"
                  >
                </div>
                <div class="form-group">
                  <label for="new-course-code">Course Code*</label>
                  <input
                    type="text"
                    id="new-course-code"
                    v-model="newCourse.code"
                    required
                    placeholder="Enter course code (e.g. CS101)"
                    class="form-input"
                  >
                </div>
              </div>
              <div class="form-group">
                <label for="new-course-description">Description</label>
                <textarea
                  id="new-course-description"
                  v-model="newCourse.description"
                  rows="4"
                  placeholder="Describe the course content and objectives"
                  class="form-textarea"
                ></textarea>
              </div>

              <!-- Students Section -->
              <div class="form-group">
                <label>Students (Optional)</label>
                <p class="form-hint">You can add students now or later from the course details page.</p>

                <!-- Selected Students Section -->
                <div v-if="selectedStudentIds.length > 0" class="selected-students-section">
                  <label>Selected Students ({{ selectedStudentIds.length }})</label>
                  <div class="selected-students">
                    <div v-for="selectedId in selectedStudentIds" :key="selectedId" class="selected-student-chip">
                      {{ getSelectedStudentName(selectedId) }}
                      <button type="button" @click="removeSelectedStudent(selectedId)" class="remove-chip">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Enhanced Student Selector -->
                <div class="student-selector-enhanced">
                  <div class="search-box-enhanced">
                    <i class="fas fa-search"></i>
                    <input
                      type="text"
                      v-model="studentSearchQuery"
                      placeholder="Search students by name or email..."
                      @input="filterStudents"
                      @focus="loadStudentsIfNeeded"
                      class="search-input"
                    >
                  </div>

                  <div v-if="loadingStudents" class="loading-indicator">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading students...</span>
                  </div>

                  <div v-else-if="filteredStudents.length > 0" class="students-select-list-enhanced">
                    <div
                      v-for="student in filteredStudents.slice(0, 6)"
                      :key="student.id"
                      class="student-select-item-enhanced"
                      :class="{ selected: selectedStudentIds.includes(student.id) }"
                      @click="toggleStudentSelection(student.id)"
                    >
                      <div class="student-info">
                        <div class="student-avatar">
                          {{ getInitials(student.first_name, student.last_name) }}
                        </div>
                        <div class="student-details">
                          <h3>{{ student.first_name }} {{ student.last_name }}</h3>
                          <p class="student-email">{{ student.email }}</p>
                          <p v-if="student.q_number" class="student-id">{{ student.q_number }}</p>
                        </div>
                      </div>
                      <div class="selection-indicator">
                        <i v-if="selectedStudentIds.includes(student.id)" class="fas fa-check-circle"></i>
                        <i v-else class="far fa-circle"></i>
                      </div>
                    </div>
                    <div v-if="filteredStudents.length > 6" class="more-students">
                      And {{ filteredStudents.length - 6 }} more students match your search...
                    </div>
                  </div>

                  <div v-else-if="studentSearchQuery && !loadingStudents" class="no-results">
                    <i class="fas fa-user-slash"></i>
                    <p>No students found matching "{{ studentSearchQuery }}"</p>
                  </div>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="cancel-button" @click="cancelCreateCourse">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="save-button"
                  :disabled="isCreating"
                >
                  <i v-if="isCreating" class="fas fa-spinner fa-spin"></i>
                  <span v-else><i class="fas fa-plus"></i> Create Course</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Edit Course Modal -->
      <div v-if="showEditCourseModal && editingCourse" class="modal-overlay">
        <div class="modal-content edit-course-modal">
          <div class="modal-header">
            <h2>Edit Course</h2>
            <button class="close-button" @click="showEditCourseModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveEditedCourse">
              <div class="form-row">
                <div class="form-group">
                  <label for="course-name">Course Name*</label>
                  <input
                    type="text"
                    id="course-name"
                    v-model="editingCourse.name"
                    required
                    placeholder="Enter course name"
                    class="form-input"
                  >
                </div>
                <div class="form-group">
                  <label for="course-code">Course Code*</label>
                  <input
                    type="text"
                    id="course-code"
                    v-model="editingCourse.code"
                    required
                    placeholder="Enter course code"
                    class="form-input"
                  >
                </div>
              </div>
              <div class="form-group">
                <label for="course-description">Description</label>
                <textarea
                  id="course-description"
                  v-model="editingCourse.description"
                  rows="4"
                  placeholder="Describe the course content and objectives"
                  class="form-textarea"
                ></textarea>
              </div>
              <div class="form-actions">
                <button type="button" class="cancel-button" @click="showEditCourseModal = false">
                  Cancel
                </button>
                <button type="submit" class="save-button">
                  <i class="fas fa-save"></i> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal-overlay show">
        <div class="modal-content confirmation-modal">
          <div class="modal-header">
            <h2>Confirm Deletion</h2>
            <button class="close-button" @click="showDeleteModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="warning-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <p class="confirmation-text">
              Are you sure you want to delete the course "{{ courseToDelete?.name }}"?
            </p>
            <p class="permanent-note">This action cannot be undone.</p>
            <div class="action-buttons">
              <button class="cancel-button" @click="showDeleteModal = false">
                Cancel
              </button>
              <button class="delete-button" @click="confirmDeleteCourse">
                Delete Course
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { courseService, authService, userService } from '../services/api';

const router = useRouter();
const courses = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const isTeacher = ref(false);
const showCreateCourseModal = ref(false);
const showEditCourseModal = ref(false);
const editingCourse = ref(null);
const isCreating = ref(false);
const showDeleteModal = ref(false);
const courseToDelete = ref(null);

const newCourse = ref({
  name: '',
  code: '',
  description: ''
});

// Student selection variables
const availableStudents = ref([]);
const selectedStudentIds = ref([]);
const studentSearchQuery = ref('');
const filteredStudents = ref([]);
const loadingStudents = ref(false);

// Create a stable color mapping for courses
const getCourseColor = (courseId) => {
  const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#1abc9c'];
  return colors[courseId % colors.length];
};

const filteredCourses = computed(() => {
  return courses.value
    .filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchQuery.value.toLowerCase());
      return matchesSearch;
    });
});

const viewCourseDetails = (id) => {
  router.push(`/course/${id}`);
};

const editCourse = (course) => {
  editingCourse.value = { ...course };
  showEditCourseModal.value = true;
};

const saveEditedCourse = async () => {
  try {
    await courseService.updateCourse(editingCourse.value.id, editingCourse.value);
    const coursesResponse = await courseService.getCourses(isTeacher.value ? 'true' : false);
    courses.value = coursesResponse.data.map(course => ({
      ...course,
      isActive: true
    }));

    showEditCourseModal.value = false;
    editingCourse.value = null;
  } catch (error) {
    console.error('Error updating course:', error);
  }
};

const createNewCourse = async () => {
  try {
    isCreating.value = true;
    const response = await courseService.createCourse(newCourse.value);
    const courseId = response.data.id;

    // Add selected students to the course if any
    if (selectedStudentIds.value.length > 0) {
      try {
        const addStudentPromises = selectedStudentIds.value.map(studentId =>
          courseService.addStudentToCourse(courseId, studentId)
        );
        await Promise.all(addStudentPromises);
      } catch (error) {
        console.error('Error adding students to course:', error);
        // Continue even if student addition fails
      }
    }

    // Refresh the courses list to show the new course
    const coursesResponse = await courseService.getCourses(isTeacher.value ? 'true' : false);
    courses.value = coursesResponse.data.map(course => ({
      ...course,
      isActive: true
    }));

    // Reset form and close modal
    resetCreateCourseForm();
    showCreateCourseModal.value = false;

    // Stay on courses page instead of navigating
  } catch (error) {
    console.error('Error creating course:', error);
    alert('Failed to create course. Please check if the course code is unique.');
  } finally {
    isCreating.value = false;
  }
};

const resetCreateCourseForm = () => {
  newCourse.value = {
    name: '',
    code: '',
    description: ''
  };
  selectedStudentIds.value = [];
  studentSearchQuery.value = '';
  filteredStudents.value = [];
};

const deleteCourse = (courseId) => {
  const course = courses.value.find(c => c.id === courseId);
  courseToDelete.value = course;
  showDeleteModal.value = true;
};

const confirmDeleteCourse = async () => {
  try {
    await courseService.deleteCourse(courseToDelete.value.id);
    courses.value = courses.value.filter(course => course.id !== courseToDelete.value.id);
    showDeleteModal.value = false;
    courseToDelete.value = null;
  } catch (error) {
    console.error('Error deleting course:', error);
    alert('Failed to delete course.');
  }
};

// Student selection methods
const getInitials = (firstName, lastName) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const loadStudentsIfNeeded = async () => {
  if (availableStudents.value.length === 0 && !loadingStudents.value) {
    await fetchAvailableStudents();
  }
};

const fetchAvailableStudents = async () => {
  loadingStudents.value = true;
  try {
    const response = await userService.getStudents();
    availableStudents.value = response.data || [];
    filterStudents(); // Apply initial filter
  } catch (error) {
    console.error('Error fetching students:', error);
    availableStudents.value = [];
    filteredStudents.value = [];
  } finally {
    loadingStudents.value = false;
  }
};

const filterStudents = () => {
  const query = studentSearchQuery.value.toLowerCase();
  if (!query.trim()) {
    filteredStudents.value = availableStudents.value.slice(0, 10); // Show first 10 when no search
  } else {
    filteredStudents.value = availableStudents.value.filter(student => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const email = student.email.toLowerCase();
      const qNumber = student.q_number?.toLowerCase() || '';
      return fullName.includes(query) || email.includes(query) || qNumber.includes(query);
    });
  }
};

const toggleStudentSelection = (studentId) => {
  const index = selectedStudentIds.value.indexOf(studentId);
  if (index === -1) {
    selectedStudentIds.value.push(studentId);
  } else {
    selectedStudentIds.value.splice(index, 1);
  }
};

const removeSelectedStudent = (studentId) => {
  const index = selectedStudentIds.value.indexOf(studentId);
  if (index !== -1) {
    selectedStudentIds.value.splice(index, 1);
  }
};

const getSelectedStudentName = (studentId) => {
  const student = availableStudents.value.find(s => s.id === studentId);
  return student ? `${student.first_name} ${student.last_name}` : '';
};

const openCreateCourseModal = () => {
  resetCreateCourseForm();
  showCreateCourseModal.value = true;
};

const cancelCreateCourse = () => {
  resetCreateCourseForm();
  showCreateCourseModal.value = false;
};

onMounted(async () => {
  try {
    const roleResponse = await authService.checkUserRole();
    isTeacher.value = roleResponse.data.role === 'teacher' || roleResponse.data.role === 'admin';

    const coursesResponse = await courseService.getCourses(isTeacher.value ? 'true' : false);

    courses.value = coursesResponse.data.map(course => ({
      ...course,
      isActive: true
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.courses-container {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.title-section .subtitle {
  color: #7f8c8d;
  margin-top: 0.5rem;
}

.filters {
  display: flex;
  gap: .5rem;
  margin-bottom: 2rem;
  align-items: stretch;
}

.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  height: 46px;
  box-sizing: border-box;
}

.filter-options select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 200px;
  height: 46px;
  box-sizing: border-box;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.course-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.course-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.course-header {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.course-header i {
  font-size: 2rem;
}

.course-content {
  padding: 1.5rem;
}

.course-content h3 {
  margin: 0;
  color: #2c3e50;
}

.description {
  color: #7f8c8d;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.course-stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.course-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-button {
  background-color: #3498db;
  border: 1px solid #3498db;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.view-button:hover {
  background-color: #2c7cb8;
  border-color: #2c7cb8;
}

.teacher-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.icon-button.edit:hover {
  color: #f39c12;
  background: #fef9e7;
}

.icon-button.delete:hover {
  color: #e74c3c;
  background: #fdedec;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.loading-state i, .empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
}

.action-button:hover {
  background-color: #2c7cb8;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

/* Enhanced Create Course Modal */
.create-course-modal {
  width: 700px;
  max-width: 95%;
}

.create-course-modal .modal-body {
  padding: 2rem;
}

/* Enhanced Edit Course Modal */
.edit-course-modal {
  width: 600px;
  max-width: 95%;
}

.edit-course-modal .modal-body {
  padding: 2rem;
}

/* Form Layout Improvements */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: #fafbfc;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3498db;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #9ca3af;
  font-style: italic;
}

/* Enhanced Student Selector */
.student-selector-enhanced {
  margin-top: 1rem;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  background: #f8f9fa;
}

.search-box-enhanced {
  position: relative;
  padding: 1rem;
  border-bottom: 1px solid #e1e8ed;
  background: white;
  border-radius: 8px 8px 0 0;
}

.search-box-enhanced i {
  position: absolute;
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e1e8ed;
  border-radius: 6px;
  font-size: 0.95rem;
  background-color: #fafbfc;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  background-color: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.students-select-list-enhanced {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
}

.student-select-item-enhanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background: white;
  border: 2px solid transparent;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.student-select-item-enhanced:hover {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

.student-select-item-enhanced.selected {
  background-color: #e3f2fd;
  border-color: #2196f3;
}

.student-select-item-enhanced .student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.student-select-item-enhanced .student-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.student-select-item-enhanced .student-details h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: #2c3e50;
  font-weight: 600;
}

.student-select-item-enhanced .student-email,
.student-select-item-enhanced .student-id {
  margin: 0;
  font-size: 0.85rem;
  color: #6c757d;
}

.selection-indicator {
  color: #3498db;
  font-size: 1.2rem;
  margin-left: 1rem;
}

.selection-indicator .fa-check-circle {
  color: #27ae60;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.no-results i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}

/* Form Actions Enhancement */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e1e8ed;
}

.cancel-button,
.save-button {
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-button {
  background: #f8f9fa;
  border: 2px solid #e1e8ed;
  color: #6c757d;
}

.cancel-button:hover {
  background: #e9ecef;
  border-color: #ced4da;
  color: #495057;
}

.save-button {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: 2px solid transparent;
}

.save-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #2c7cb8, #1d5a7b);
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .create-course-modal,
  .edit-course-modal {
    width: 95%;
    margin: 1rem;
  }

  .create-course-modal .modal-body,
  .edit-course-modal .modal-body {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .cancel-button,
  .save-button {
    width: 100%;
    justify-content: center;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #7f8c8d;
  transition: all 0.3s ease;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.close-button:hover {
  color: #e74c3c;
  background-color: #f8f9fa;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input, .form-group textarea, .form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.cancel-button {
  background: #f8f9fa;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.save-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.confirmation-modal {
  max-width: 450px;
}

.warning-icon {
  text-align: center;
  margin-bottom: 1rem;
}

.warning-icon i {
  color: #e74c3c;
  font-size: 3rem;
}

.confirmation-text {
  font-size: 1.1rem;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 1rem;
}

.permanent-note {
  color: #7f8c8d;
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 1.5rem;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.cancel-button {
  background-color: #95a5a6;
}

.delete-button {
  background-color: #e74c3c;
}

.cancel-button, .delete-button {
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.cancel-button:hover {
  background-color: #7f8c8d;
}

.delete-button:hover {
  background-color: #c0392b;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }

  .filters {
    flex-direction: column;
  }
}

/* Enhanced Student Selection Styles */
.selected-students-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.selected-students-section label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.selected-students {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-student-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #3498db;
  color: white;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  animation: fadeIn 0.2s ease-in;
}

.remove-chip {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  transition: background-color 0.2s;
}

.remove-chip:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.student-selector {
  margin-top: 1rem;
}

.student-select-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid #e9ecef;
  margin-bottom: 0.5rem;
  background-color: white;
}

.student-select-item:hover {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

.students-select-list.compact {
  max-height: 200px;
  overflow-y: auto;
}

.students-select-list.compact .student-select-item {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.25rem;
}

.students-select-list.compact .student-details h3 {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.students-select-list.compact .student-details p {
  font-size: 0.8rem;
  margin-bottom: 0;
}

.form-hint {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 1rem;
  font-style: italic;
}

.more-students {
  text-align: center;
  padding: 0.5rem;
  color: #6c757d;
  font-size: 0.85rem;
  font-style: italic;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #6c757d;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
