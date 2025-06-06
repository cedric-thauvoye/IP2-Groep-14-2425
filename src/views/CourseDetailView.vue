<template>
  <PageLayout>
    <div class="course-detail-container">
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading course details...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="back-button" @click="router.push('/courses')">
          Back to Courses
        </button>
      </div>

      <template v-else>
        <!-- Header section -->
        <div class="header-section">
          <div class="back-nav">
            <button class="back-button" @click="router.push('/courses')">
              <i class="fas fa-arrow-left"></i> Back to Courses
            </button>
          </div>
          <div class="title-section">
            <h1>{{ course.name }}</h1>
            <p class="course-code">{{ course.code }}</p>
          </div>
          <div class="action-buttons" v-if="isTeacher">
            <button class="edit-button" @click="editCourse">
              <i class="fas fa-edit"></i> Edit Course
            </button>
            <button class="delete-button" @click="confirmDeleteCourse">
              <i class="fas fa-trash"></i> Delete Course
            </button>
          </div>
        </div>

        <!-- Course description -->
        <div class="description-card">
          <h2>Description</h2>
          <p v-if="course.description">{{ course.description }}</p>
          <p v-else class="no-data">No description available.</p>
        </div>

        <!-- Main content grid -->
        <div class="content-grid">
          <!-- Teachers section -->
          <div class="content-card teachers-section">
            <div class="card-header">
              <h2><i class="fas fa-chalkboard-teacher"></i> Teachers</h2>
              <button v-if="isTeacher" class="add-button" @click="showAddTeacherModalHandler">
                <i class="fas fa-plus"></i> Add Teacher
              </button>
            </div>

            <div v-if="course.teachers && course.teachers.length > 0" class="teachers-list">
              <div v-for="teacher in course.teachers" :key="teacher.id" class="teacher-item">
                <div class="teacher-info">
                  <div class="teacher-avatar">
                    {{ getInitials(teacher.first_name, teacher.last_name) }}
                  </div>
                  <div class="teacher-details">
                    <h3>{{ teacher.first_name }} {{ teacher.last_name }}</h3>
                    <p class="teacher-email">{{ teacher.email }}</p>
                  </div>
                </div>
                <div class="teacher-actions" v-if="isTeacher">
                  <button class="remove-button" @click="removeTeacher(teacher.id)">
                    <i class="fas fa-user-minus"></i>
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="empty-list">
              <p>No teachers assigned to this course.</p>
            </div>
          </div>

          <!-- Students section -->
          <div class="content-card students-section">
            <div class="card-header">
              <h2><i class="fas fa-user-graduate"></i> Students</h2>
              <div class="header-actions">
                <div class="search-box">
                  <i class="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search students..."
                    v-model="studentSearch"
                    @input="filterStudents"
                  >
                </div>
                <button v-if="isTeacher" class="add-button" @click="openAddStudentModal">
                  <i class="fas fa-plus"></i> Add Student
                </button>
              </div>
            </div>

            <div v-if="filteredStudents.length > 0" class="students-list">
              <div v-for="student in filteredStudents" :key="student.id" class="student-item">
                <div class="student-info">
                  <div class="student-avatar">
                    {{ getInitials(student.first_name, student.last_name) }}
                  </div>
                  <div class="student-details">
                    <h3>{{ student.first_name }} {{ student.last_name }}</h3>
                    <p class="student-email">{{ student.email }}</p>
                    <p class="student-id">{{ student.q_number }}</p>
                  </div>
                </div>
                <div class="student-actions" v-if="isTeacher">
                  <button class="remove-button" @click="removeStudent(student.id)">
                    <i class="fas fa-user-minus"></i>
                  </button>
                </div>
              </div>
            </div>

            <div v-else-if="course.students && course.students.length > 0" class="empty-search">
              <p>No students match your search criteria.</p>
            </div>

            <div v-else class="empty-list">
              <p>No students enrolled in this course.</p>
            </div>
          </div>
        </div>

        <!-- Groups section -->
        <div class="groups-section content-card">
          <div class="card-header">
            <h2><i class="fas fa-users"></i> Groups</h2>
            <button v-if="isTeacher" class="add-button" @click="showCreateGroupModal = true">
              <i class="fas fa-plus"></i> Create Group
            </button>
          </div>

          <div v-if="course.groups && course.groups.length > 0" class="groups-grid">
            <div v-for="group in course.groups" :key="group.id" class="group-card">
              <div class="group-header">
                <h3>{{ group.name }}</h3>
                <span class="member-count">
                  <i class="fas fa-users"></i> {{ group.student_count || 0 }}
                </span>
              </div>
              <div class="group-footer">
                <router-link :to="`/group/${group.id}`" class="view-button">
                  View Details
                </router-link>
                <div class="group-actions" v-if="isTeacher">
                  <button class="icon-button" @click="editGroup(group.id)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="icon-button delete" @click="confirmDeleteGroup(group.id)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-list">
            <p>No groups created for this course.</p>
          </div>
        </div>

        <!-- Add Teacher Modal -->
        <div v-if="showAddTeacherModal" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Add Teacher</h2>
              <button class="close-button" @click="showAddTeacherModal = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div v-if="loadingTeachers" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i> Loading teachers...
              </div>
              <div v-else>
                <div class="search-box">
                  <i class="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    v-model="teacherSearch"
                  >
                </div>

                <div class="teachers-list">
                  <div
                    v-for="teacher in filteredTeachers"
                    :key="teacher.id"
                    class="teacher-option"
                    @click="addTeacher(teacher.id)"
                  >
                    <div class="teacher-avatar">
                      {{ getInitials(teacher.first_name, teacher.last_name) }}
                    </div>
                    <div class="teacher-info">
                      <h3>{{ teacher.first_name }} {{ teacher.last_name }}</h3>
                      <p>{{ teacher.email }}</p>
                    </div>
                  </div>
                </div>

                <div v-if="filteredTeachers.length === 0" class="no-results">
                  No teachers found matching your search
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Student Modal -->
        <div v-if="showAddStudentModal" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Add Student to Course</h2>
              <button class="close-button" @click="showAddStudentModal = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div v-if="loadingStudents" class="loading-indicator">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Loading students...</span>
              </div>
              <div v-else-if="filteredAvailableStudents.length === 0" class="no-students">
                <p>No available students to add to this course.</p>
              </div>
              <div v-else>
                <div class="search-box">
                  <i class="fas fa-search"></i>
                  <input
                    type="text"
                    v-model="availableStudentSearch"
                    placeholder="Search students..."
                    @input="filterAvailableStudents"
                  >
                </div>

                <div class="students-select-list">
                  <div
                    v-for="student in filteredAvailableStudents"
                    :key="student.id"
                    class="student-select-item"
                  >
                    <div class="student-info">
                      <div class="student-avatar">
                        {{ getInitials(student.first_name, student.last_name) }}
                      </div>
                      <div class="student-details">
                        <h3>{{ student.first_name }} {{ student.last_name }}</h3>
                        <p class="student-email">{{ student.email }}</p>
                        <p class="student-id">{{ student.q_number }}</p>
                      </div>
                    </div>
                    <button class="add-student-button" @click="addStudentToCourse(student.id)">
                      <i class="fas fa-plus"></i> Add
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="cancel-button" @click="showAddStudentModal = false">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Create Group Modal -->
        <div v-if="showCreateGroupModal" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Create New Group</h2>
              <button class="close-button" @click="showCreateGroupModal = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="createGroup">
                <div class="form-group">
                  <label for="group-name">Group Name*</label>
                  <input
                    type="text"
                    id="group-name"
                    v-model="newGroup.name"
                    required
                    placeholder="Enter group name"
                  >
                </div>

                <div class="form-group">
                  <label>Add Students (optional)</label>
                  <div v-if="course.students && course.students.length > 0" class="student-selector">
                    <div class="selected-students">
                      <div v-for="selectedId in newGroup.studentIds" :key="selectedId" class="selected-student-chip">
                        {{ getStudentName(selectedId) }}
                        <button type="button" @click="removeStudentFromGroup(selectedId)" class="remove-chip">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                    <div class="student-dropdown">
                      <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input
                          type="text"
                          placeholder="Search students..."
                          v-model="groupStudentSearch"
                        >
                      </div>
                      <div class="dropdown-options">
                        <div
                          v-for="student in filteredCourseStudents"
                          :key="student.id"
                          class="student-option"
                          @click="addStudentToGroup(student.id)"
                          v-show="!newGroup.studentIds.includes(student.id)"
                        >
                          <div class="student-avatar small">
                            {{ getInitials(student.first_name, student.last_name) }}
                          </div>
                          <div class="student-info">
                            {{ student.first_name }} {{ student.last_name }}
                          </div>
                        </div>
                        <div v-if="filteredCourseStudents.length === 0 || filteredCourseStudents.every(s => newGroup.studentIds.includes(s.id))" class="no-results">
                          No more students available
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="no-students-message">
                    No students are enrolled in this course yet. Add students to the course first.
                  </div>
                </div>

                <div class="form-actions">
                  <button type="button" class="cancel-button" @click="showCreateGroupModal = false">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="save-button"
                    :disabled="!newGroup.name || isCreatingGroup"
                  >
                    <i v-if="isCreatingGroup" class="fas fa-spinner fa-spin"></i>
                    <span v-else>Create Group</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Edit Course Modal -->
        <div v-if="showEditCourseModal && editingCourse" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Edit Course</h2>
              <button class="close-button" @click="showEditCourseModal = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveEditedCourse">
                <div class="form-group">
                  <label for="course-name">Course Name</label>
                  <input
                    type="text"
                    id="course-name"
                    v-model="editingCourse.name"
                    required
                  >
                </div>
                <div class="form-group">
                  <label for="course-code">Course Code</label>
                  <input
                    type="text"
                    id="course-code"
                    v-model="editingCourse.code"
                    required
                  >
                </div>
                <div class="form-group">
                  <label for="course-description">Description</label>
                  <textarea
                    id="course-description"
                    v-model="editingCourse.description"
                    rows="4"
                  ></textarea>
                </div>
                <div class="form-actions">
                  <button type="button" class="cancel-button" @click="showEditCourseModal = false">
                    Cancel
                  </button>
                  <button type="submit" class="save-button">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Edit Group Modal -->
        <div v-if="showEditGroupModal && editingGroup" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h2>Edit Group</h2>
              <button class="close-button" @click="showEditGroupModal = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="saveEditedGroup">
                <div class="form-group">
                  <label for="group-name">Group Name</label>
                  <input
                    type="text"
                    id="group-name"
                    v-model="editingGroup.name"
                    required
                  >
                </div>
                <div class="form-actions">
                  <button type="button" class="cancel-button" @click="showEditGroupModal = false">
                    Cancel
                  </button>
                  <button type="submit" class="save-button">
                    Save Changes
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
                Are you sure you want to delete the course "{{ course.name }}"?
              </p>
              <p class="permanent-note">This action cannot be undone.</p>
              <div class="action-buttons">
                <button class="cancel-button" @click="showDeleteModal = false">
                  Cancel
                </button>
                <button class="delete-button" @click="deleteCourse">
                  Delete Course
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Delete Group Confirmation Modal -->
        <div v-if="showGroupDeleteModal" class="modal-overlay show">
          <div class="modal-content confirmation-modal">
            <div class="modal-header">
              <h2>Confirm Group Deletion</h2>
              <button class="close-button" @click="showGroupDeleteModal = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="warning-icon">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <p class="confirmation-text">
                Are you sure you want to delete this group?
              </p>
              <p class="permanent-note">This action cannot be undone.</p>
              <div class="action-buttons">
                <button class="cancel-button" @click="showGroupDeleteModal = false">
                  Cancel
                </button>
                <button class="delete-button" @click="deleteGroup">
                  Delete Group
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Delete Teacher Confirmation Modal -->
        <div v-if="showTeacherDeleteModal" class="modal-overlay show">
          <div class="modal-content confirmation-modal">
            <div class="modal-header">
              <h2>Confirm Teacher Removal</h2>
              <button class="close-button" @click="showTeacherDeleteModal = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="warning-icon">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <p class="confirmation-text">
                Are you sure you want to remove this teacher from the course?
              </p>
              <p class="permanent-note">This action cannot be undone.</p>
              <div class="action-buttons">
                <button class="cancel-button" @click="showTeacherDeleteModal = false">
                  Cancel
                </button>
                <button class="delete-button" @click="handleTeacherRemoval">
                  Remove Teacher
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Delete Student Confirmation Modal -->
        <div v-if="showStudentDeleteModal" class="modal-overlay show">
          <div class="modal-content confirmation-modal">
            <div class="modal-header">
              <h2>Confirm Student Removal</h2>
              <button class="close-button" @click="showStudentDeleteModal = false">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="warning-icon">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <p class="confirmation-text">
                Are you sure you want to remove this student from the course?
              </p>
              <p class="permanent-note">This action cannot be undone.</p>
              <div class="action-buttons">
                <button class="cancel-button" @click="showStudentDeleteModal = false">
                  Cancel
                </button>
                <button class="delete-button" @click="handleStudentRemoval">
                  Remove Student
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { courseService, authService, userService, groupService } from '../services/api';
import { useNotificationStore } from '../stores/notificationStore';

const router = useRouter();
const route = useRoute();
const course = ref({});
const filteredStudents = ref([]);
const loading = ref(true);
const error = ref(null);
const isTeacher = ref(false);
const studentSearch = ref('');
const showEditGroupModal = ref(false);
const editingGroup = ref(null);
const showAddTeacherModal = ref(false);
const showAddStudentModal = ref(false);
const showCreateGroupModal = ref(false);
const showEditCourseModal = ref(false);
const editingCourse = ref(null);
const availableTeachers = ref([]);
const loadingTeachers = ref(false);
const teacherSearch = ref('');
const availableStudentSearch = ref('');
const allAvailableStudents = ref([]);
const filteredAvailableStudents = ref([]);
const loadingStudents = ref(false);
const newGroup = ref({ name: '', studentIds: [] });
const groupStudentSearch = ref('');
const isCreatingGroup = ref(false);
const showDeleteModal = ref(false);
const showGroupDeleteModal = ref(false);
const groupToDelete = ref(null);
const showTeacherDeleteModal = ref(false);
const teacherToDelete = ref(null);
const showStudentDeleteModal = ref(false);
const studentToDelete = ref(null);

// Get initials for avatar
const getInitials = (firstName, lastName) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Filter students based on search
const filterStudents = () => {
  if (!course.value.students) return;

  const searchTerm = studentSearch.value.toLowerCase();
  if (!searchTerm) {
    filteredStudents.value = course.value.students;
    return;
  }

  filteredStudents.value = course.value.students.filter(student => {
    return student.first_name.toLowerCase().includes(searchTerm) ||
           student.last_name.toLowerCase().includes(searchTerm) ||
           student.email.toLowerCase().includes(searchTerm) ||
           (student.q_number && student.q_number.toLowerCase().includes(searchTerm));
  });
};

// Filter teachers based on search
const filteredTeachers = computed(() => {
  const searchTerm = teacherSearch.value.toLowerCase();
  return availableTeachers.value.filter(teacher => {
    return teacher.first_name.toLowerCase().includes(searchTerm) ||
           teacher.last_name.toLowerCase().includes(searchTerm) ||
           teacher.email.toLowerCase().includes(searchTerm);
  });
});

// Filter available students based on search
const filterAvailableStudents = () => {
  const searchTerm = availableStudentSearch.value.toLowerCase();
  if (!searchTerm) {
    filteredAvailableStudents.value = allAvailableStudents.value;
    return;
  }

  filteredAvailableStudents.value = allAvailableStudents.value.filter(student => {
    return student.first_name.toLowerCase().includes(searchTerm) ||
           student.last_name.toLowerCase().includes(searchTerm) ||
           student.email.toLowerCase().includes(searchTerm) ||
           (student.q_number && student.q_number.toLowerCase().includes(searchTerm));
  });
};

// Filter course students for group creation
const filteredCourseStudents = computed(() => {
  const searchTerm = groupStudentSearch.value.toLowerCase();
  return course.value.students.filter(student => {
    return student.first_name.toLowerCase().includes(searchTerm) ||
           student.last_name.toLowerCase().includes(searchTerm) ||
           student.email.toLowerCase().includes(searchTerm);
  });
});

// Fetch available teachers (only those with role=teacher)
const fetchAvailableTeachers = async () => {
  loadingTeachers.value = true;
  try {
    const response = await userService.getTeachers();
    const currentTeacherIds = course.value.teachers.map(t => t.id);
    availableTeachers.value = response.data.filter(t => !currentTeacherIds.includes(t.id));
  } catch (error) {
    console.error('Error fetching teachers:', error);
  } finally {
    loadingTeachers.value = false;
  }
};

// Fetch available students (students not already enrolled in this course)
const fetchAvailableStudents = async () => {
  loadingStudents.value = true;
  try {
    const response = await userService.getStudents();
    const currentStudentIds = course.value.students.map(s => s.id);
    const availableStudents = response.data.filter(s => !currentStudentIds.includes(s.id));
    allAvailableStudents.value = availableStudents;
    filteredAvailableStudents.value = availableStudents;
  } catch (error) {
    console.error('Error fetching students:', error);
  } finally {
    loadingStudents.value = false;
  }
};

// Open the add student modal and load available students
const openAddStudentModal = () => {
  showAddStudentModal.value = true;
  fetchAvailableStudents();
  availableStudentSearch.value = '';
};

// Show add teacher modal
const showAddTeacherModalHandler = () => {
  showAddTeacherModal.value = true;
  fetchAvailableTeachers();
};

// Add teacher to course
const addTeacher = async (teacherId) => {
  try {
    await courseService.addTeacherToCourse(course.value.id, teacherId);
    showAddTeacherModal.value = false;
    fetchCourseDetails();
  } catch (error) {
    console.error('Error adding teacher:', error);
  }
};

// Edit course
const editCourse = () => {
  editingCourse.value = { ...course.value };
  showEditCourseModal.value = true;
};

// Save edited course
const saveEditedCourse = async () => {
  try {
    await courseService.updateCourse(editingCourse.value.id, editingCourse.value);
    // Refresh the course data
    showEditCourseModal.value = false;
    fetchCourseDetails();
  } catch (error) {
    console.error('Error updating course:', error);
    error.value = 'Failed to update course. Please try again.';
  }
};

// Delete course
const confirmDeleteCourse = () => {
  showDeleteModal.value = true;
};

const deleteCourse = async () => {
  try {
    await courseService.deleteCourse(course.value.id);
    router.push('/courses');
  } catch (err) {
    console.error('Error deleting course:', err);
    error.value = 'Failed to delete course. Please try again.';
  } finally {
    showDeleteModal.value = false;
  }
};

// Add and remove teachers
const removeTeacher = (teacherId) => {
  teacherToDelete.value = teacherId;
  showTeacherDeleteModal.value = true;
};

const handleTeacherRemoval = async () => {
  try {
    await courseService.removeTeacherFromCourse(course.value.id, teacherToDelete.value);
    showTeacherDeleteModal.value = false;
    teacherToDelete.value = null;
    fetchCourseDetails();
  } catch (err) {
    console.error('Error removing teacher:', err);
    error.value = 'Failed to remove teacher. Please try again.';
  }
};

// Add and remove students
const removeStudent = (studentId) => {
  studentToDelete.value = studentId;
  showStudentDeleteModal.value = true;
};

const notificationStore = useNotificationStore();

const handleStudentRemoval = async () => {
  try {
    await courseService.removeStudentFromCourse(course.value.id, studentToDelete.value);
    notificationStore.success('Student has been removed from the course successfully.');
    showStudentDeleteModal.value = false;
    studentToDelete.value = null;
    fetchCourseDetails();
  } catch (err) {
    console.error('Error removing student:', err);
    notificationStore.error('Failed to remove student. Please try again.');
  }
};

const addStudentToCourse = async (studentId) => {
  try {
    await courseService.addStudentToCourse(course.value.id, studentId);
    notificationStore.success('Student has been added to the course successfully.');
    showAddStudentModal.value = false;
    fetchCourseDetails();
  } catch (error) {
    console.error('Error adding student:', error);
    notificationStore.error('Failed to add student to the course. Please try again.');
  }
};

// Group actions
const editGroup = (groupId) => {
  const group = course.value.groups.find(g => g.id === groupId);
  editingGroup.value = { ...group };
  showEditGroupModal.value = true;
};

const saveEditedGroup = async () => {
  try {
    await groupService.updateGroup(editingGroup.value.id, editingGroup.value);
    showEditGroupModal.value = false;
    editingGroup.value = null;
    fetchCourseDetails();
  } catch (error) {
    console.error('Error updating group:', error);
    error.value = 'Failed to update group. Please try again.';
  }
};

const confirmDeleteGroup = (groupId) => {
  const group = course.value.groups.find(g => g.id === groupId);
  groupToDelete.value = group;
  showGroupDeleteModal.value = true;
};

const deleteGroup = async (groupId) => {
  try {
    await groupService.deleteGroup(groupId);
    showGroupDeleteModal.value = false;
    groupToDelete.value = null;
    fetchCourseDetails();
  } catch (err) {
    console.error('Error deleting group:', err);
    error.value = 'Failed to delete group. Please try again.';
  }
};

const createGroup = async () => {
  isCreatingGroup.value = true;
  try {
    // Create the group with the course ID and selected students
    const groupData = {
      name: newGroup.value.name,
      courseId: course.value.id
    };

    const response = await groupService.createGroupForCourse(course.value.id, groupData);

    // If there are selected students, add them to the group
    if (newGroup.value.studentIds.length > 0) {
      // Add each selected student to the group
      const groupId = response.data.id;
      const addStudentPromises = newGroup.value.studentIds.map(studentId =>
        groupService.addStudentToGroup(groupId, studentId)
      );

      await Promise.all(addStudentPromises);
    }

    // Reset form and close modal
    showCreateGroupModal.value = false;
    newGroup.value = { name: '', studentIds: [] };

    // Refresh course details to show the new group
    fetchCourseDetails();
  } catch (error) {
    console.error('Error creating group:', error);
    alert('Failed to create group. Please try again.');
  } finally {
    isCreatingGroup.value = false;
  }
};

const addStudentToGroup = (studentId) => {
  newGroup.value.studentIds.push(studentId);
};

const removeStudentFromGroup = (studentId) => {
  newGroup.value.studentIds = newGroup.value.studentIds.filter(id => id !== studentId);
};

const getStudentName = (studentId) => {
  const student = course.value.students.find(s => s.id === studentId);
  return student ? `${student.first_name} ${student.last_name}` : '';
};

// Fetch course details
const fetchCourseDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const courseId = route.params.id;
    const response = await courseService.getCourseById(courseId);
    course.value = response.data;

    if (course.value.students) {
      filteredStudents.value = [...course.value.students];
      // Re-apply search filter if there's an active search
      if (studentSearch.value) {
        filterStudents();
      }
    }
  } catch (err) {
    console.error('Error fetching course details:', err);
    error.value = 'Failed to load course details. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Check user role
const checkUserRole = async () => {
  try {
    const response = await authService.checkUserRole();
    isTeacher.value = response.data.role === 'teacher' || response.data.role === 'admin';
  } catch (err) {
    console.error('Error checking user role:', err);
  }
};

onMounted(async () => {
  await checkUserRole();
  await fetchCourseDetails();
});
</script>

<style scoped>
.course-detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #7f8c8d;
}

.loading-state i, .error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state i {
  color: #e74c3c;
}

.header-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.back-nav {
  margin-bottom: 1rem;
  width: 100%;
}

.back-button {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.9rem;
}

.title-section {
  flex: 1;
}

.title-section h1 {
  margin: 0;
  color: #2c3e50;
}

.course-code {
  color: #3498db;
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.edit-button, .delete-button {
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-button {
  background-color: #f39c12;
  color: white;
}

.delete-button {
  background-color: #e74c3c;
  color: white;
}

.description-card, .content-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.no-data {
  color: #7f8c8d;
  font-style: italic;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header h2 {
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 300px;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
  z-index: 1;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1.2;
  box-sizing: border-box;
}

.add-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.2;
  white-space: nowrap;
  flex-shrink: 0;
}

.teachers-list, .students-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  background: #fafbfc;
}

.teacher-item, .student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
  gap: 1rem;
}

.student-actions {
  flex-shrink: 0;
}

.teacher-info, .student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.teacher-avatar, .student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
  font-size: 0.9rem;
}

.teacher-details, .student-details {
  flex: 1;
  min-width: 0;
}

.teacher-details h3, .student-details h3 {
  margin: 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.teacher-email, .student-email, .student-id {
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  color: #7f8c8d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-button {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.remove-button:hover {
  background-color: #fadbd8;
}

.empty-list, .empty-search {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 8px;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.group-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.group-header h3 {
  margin: 0;
  font-size: 1rem;
}

.member-count {
  color: #7f8c8d;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.group-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.view-button {
  background-color: #3498db;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.5rem;
  transition: color 0.2s;
}

.icon-button:hover {
  color: #3498db;
}

.icon-button.delete:hover {
  color: #e74c3c;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
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

.modal-body {
  padding: 1.5rem;
}

.modal-body .search-box {
  margin-bottom: 1rem;
}

.modal-body .search-box input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.modal-body .students-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  background: #fafbfc;
  padding: 0.5rem;
}

.teacher-option, .student-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  background: #fff;
  margin-bottom: 0.5rem;
}

.teacher-option:hover, .student-option:hover {
  background-color: #f8f9fa;
  border-color: #e1e8ed;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.student-option .student-info {
  flex: 1;
  min-width: 0;
}

.student-option .student-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-option .student-info p {
  margin: 0.25rem 0;
  font-size: 0.8rem;
  color: #7f8c8d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading-indicator {
  text-align: center;
  padding: 1rem;
  color: #7f8c8d;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ddd;
  font-style: italic;
}

.students-select-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.student-select-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
}

.add-student-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Modal search box specific styles */
.modal-body .search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  position: relative;
}

.modal-body .search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
  z-index: 1;
}

.modal-body .search-box input {
  flex: 1;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-group input, .form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  box-sizing: border-box; /* Add this to include padding in width calculation */
  max-width: 100%; /* Ensure inputs don't exceed their container */
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

.student-selector {
  margin-top: 1rem;
}

.selected-students {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-student-chip {
  background: #3498db;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remove-chip {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
}

.student-dropdown {
  margin-top: 1rem;
}

.dropdown-options {
  margin-top: 0.5rem;
}

.student-avatar.small {
  width: 30px;
  height: 30px;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.no-students-message {
  color: #7f8c8d;
  font-style: italic;
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
  transition: background-color 0.2s;
}

.cancel-button:hover {
  background-color: #7f8c8d;
}

.delete-button:hover {
  background-color: #c0392b;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #7f8c8d;
  transition: color 0.2s;
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

@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .groups-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .search-box {
    width: 100%;
  }

  .search-box input {
    width: 100%;
  }

  .add-button {
    align-self: flex-start;
  }

  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .modal-body {
    padding: 1rem;
  }
}
</style>
