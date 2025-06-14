<template>
  <PageLayout>
    <div class="groups-container">
      <div class="header">
        <h1>Groups</h1>
        <div class="actions" v-if="isTeacher">
          <button class="action-button" @click="showCreateGroupModal = true">
            <i class="fas fa-plus"></i> Create Group
          </button>
          <router-link to="/import" class="action-button import">
            <i class="fas fa-file-import"></i> Import Groups
          </router-link>
        </div>
      </div>

      <!-- Added search and filter features -->
      <div class="filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search groups..."
            @input="filterGroups"
          >
        </div>
        <div class="filter-options">
          <select v-model="courseFilter" @change="filterGroups">
            <option value="">All Courses</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.name }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading groups...</p>
      </div>

      <div v-else-if="filteredGroups.length > 0" class="groups-grid">
        <div v-for="group in filteredGroups" :key="group.id" class="group-card">
          <div class="group-header">
            <h3>{{ group.name }}</h3>
            <span class="member-count">
              <i class="fas fa-users"></i> {{ group.student_count || 0 }}
            </span>
          </div>
          <p class="course-name">
            <router-link :to="`/course/${group.course_id}`" class="course-link">
              {{ group.course_name }}
            </router-link>
          </p>
          <div class="group-footer">
            <router-link :to="`/group/${group.id}`" class="view-button">
              View Details
            </router-link>
            <div class="actions" v-if="isTeacher">
              <button class="icon-button edit" @click="editGroup(group)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="icon-button delete" @click="deleteGroup(group.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="fas fa-users"></i>
        <h3>No Groups Found</h3>
        <p>{{ isTeacher ? 'Create a new group to get started' : 'You are not a member of any groups yet' }}</p>
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
            <form @submit.prevent="createNewGroup">
              <div class="form-group">
                <label for="new-group-name">Group Name</label>
                <input
                  type="text"
                  id="new-group-name"
                  v-model="newGroup.name"
                  required
                >
              </div>
              <div class="form-group">
                <label for="new-group-course">Course</label>
                <select
                  id="new-group-course"
                  v-model="newGroup.courseId"
                  @change="watchCourseSelection"
                  required
                >
                  <option value="" disabled>Select a course</option>
                  <option v-for="course in courses" :key="course.id" :value="course.id">
                    {{ course.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Add Students (optional)</label>
                <div v-if="availableStudents.length > 0" class="student-selector">
                  <div class="selected-students">
                    <div v-for="selectedId in newGroup.studentIds" :key="selectedId" class="selected-student-chip">
                      {{ getStudentName(selectedId) }}
                      <button type="button" @click="removeStudentFromNewGroup(selectedId)" class="remove-chip">
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
                        v-model="studentSearch"
                      >
                    </div>
                    <div class="dropdown-options">
                      <div
                        v-for="student in filteredAvailableStudents"
                        :key="student.id"
                        class="student-select-item"
                        @click="addStudentToNewGroup(student.id)"
                      >
                        <div class="student-info">
                          <div class="student-avatar">
                            {{ getStudentInitials(student.first_name, student.last_name) }}
                          </div>
                          <div class="student-details">
                            <h3>{{ student.first_name }} {{ student.last_name }}</h3>
                            <p class="student-email">{{ student.email }}</p>
                            <p class="student-id">{{ student.q_number }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else-if="newGroup.courseId" class="no-students">
                  <p>No available students for the selected course.</p>
                </div>
                <div v-else class="no-course-selected">
                  <p>Select a course to see available students.</p>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="cancel-button" @click="showCreateGroupModal = false">
                  Cancel
                </button>
                <button type="submit" class="save-button">
                  Create Group
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
              Are you sure you want to delete the group "{{ groupToDelete?.name }}"?
            </p>
            <p class="permanent-note">This action cannot be undone.</p>
            <div class="action-buttons">
              <button class="cancel-button" @click="showDeleteModal = false">
                Cancel
              </button>
              <button class="delete-button" @click="confirmDeleteGroup">
                Delete Group
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
import { groupService, authService, courseService, userService } from '../services/api';

const router = useRouter();
const groups = ref([]);
const courses = ref([]);
const loading = ref(true);
const isTeacher = ref(false);
const showCreateGroupModal = ref(false);
const showEditGroupModal = ref(false);
const editingGroup = ref(null);
const searchQuery = ref('');
const courseFilter = ref('');
const newGroup = ref({
  name: '',
  courseId: '',
  studentIds: []
});
const showDeleteModal = ref(false);
const groupToDelete = ref(null);
const availableStudents = ref([]);
const studentSearch = ref('');

// New computed property to filter groups based on search and course filter
const filteredGroups = computed(() => {
  return groups.value.filter(group => {
    const matchesSearch =
      !searchQuery.value ||
      group.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (group.course_name && group.course_name.toLowerCase().includes(searchQuery.value.toLowerCase()));

    const matchesCourse =
      !courseFilter.value ||
      group.course_id === parseInt(courseFilter.value);

    return matchesSearch && matchesCourse;
  });
});

// Computed property to filter available students based on search
const filteredAvailableStudents = computed(() => {
  if (!studentSearch.value) {
    return availableStudents.value.filter(student =>
      !newGroup.value.studentIds.includes(student.id)
    );
  }

  const searchTerm = studentSearch.value.toLowerCase();
  return availableStudents.value.filter(student => {
    const matchesSearch =
      student.first_name.toLowerCase().includes(searchTerm) ||
      student.last_name.toLowerCase().includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm) ||
      (student.q_number && student.q_number.toLowerCase().includes(searchTerm));

    return matchesSearch && !newGroup.value.studentIds.includes(student.id);
  });
});

// New method to handle filtering
const filterGroups = () => {
  // The computed property will update automatically
  console.log('Filtering groups with:', searchQuery.value, courseFilter.value);
};

const editGroup = (group) => {
  editingGroup.value = { ...group };
  showEditGroupModal.value = true;
};

const saveEditedGroup = async () => {
  try {
    await groupService.updateGroup(editingGroup.value.id, editingGroup.value);
    // Refresh the group list
    const response = await groupService.getGroups();
    groups.value = response.data;

    showEditGroupModal.value = false;
    editingGroup.value = null;
  } catch (error) {
    console.error('Error updating group:', error);
  }
};

const deleteGroup = async (groupId) => {
  const group = groups.value.find(g => g.id === groupId);
  groupToDelete.value = group;
  showDeleteModal.value = true;
};

const confirmDeleteGroup = async () => {
  try {
    await groupService.deleteGroup(groupToDelete.value.id);
    groups.value = groups.value.filter(group => group.id !== groupToDelete.value.id);
    showDeleteModal.value = false;
    groupToDelete.value = null;
  } catch (error) {
    console.error('Error deleting group:', error);
    alert('Failed to delete group. Please try again.');
  }
};

const createNewGroup = async () => {
  try {
    // Create group with selected students
    const groupData = {
      name: newGroup.value.name,
      courseId: newGroup.value.courseId,
      studentIds: newGroup.value.studentIds
    };

    await groupService.createGroup(groupData);

    // Refresh the group list
    const response = await groupService.getGroups();
    groups.value = response.data;

    // Reset form and close modal
    showCreateGroupModal.value = false;
    newGroup.value = {
      name: '',
      courseId: '',
      studentIds: []
    };
    availableStudents.value = [];
    studentSearch.value = '';
  } catch (error) {
    console.error('Error creating group:', error);
    alert('Failed to create group. Please try again.');
  }
};

// Student management methods
const getStudentName = (studentId) => {
  const student = availableStudents.value.find(s => s.id === studentId);
  return student ? `${student.first_name} ${student.last_name}` : 'Unknown Student';
};

const getStudentInitials = (firstName, lastName) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const addStudentToNewGroup = (studentId) => {
  if (!newGroup.value.studentIds.includes(studentId)) {
    newGroup.value.studentIds.push(studentId);
  }
};

const removeStudentFromNewGroup = (studentId) => {
  newGroup.value.studentIds = newGroup.value.studentIds.filter(id => id !== studentId);
};

// Watch for course selection changes to load available students
const loadAvailableStudents = async () => {
  if (!newGroup.value.courseId) {
    availableStudents.value = [];
    return;
  }

  try {
    const response = await userService.getStudents();
    // Filter students to only include those enrolled in the selected course
    const courseResponse = await courseService.getCourseById(newGroup.value.courseId);
    const courseStudents = courseResponse.data.students || [];

    availableStudents.value = response.data.filter(student =>
      courseStudents.some(cs => cs.id === student.id)
    );
  } catch (error) {
    console.error('Error loading available students:', error);
    availableStudents.value = [];
  }
};

// Watch course selection
const watchCourseSelection = () => {
  if (newGroup.value.courseId) {
    loadAvailableStudents();
    // Reset selected students when course changes
    newGroup.value.studentIds = [];
  }
};

onMounted(async () => {
  try {
    // Check if user is a teacher
    const roleResponse = await authService.checkUserRole();
    isTeacher.value = roleResponse.data.role === 'teacher' || roleResponse.data.role === 'admin';

    // Fetch groups
    const response = await groupService.getGroups();
    groups.value = response.data;

    // Fetch courses for filter dropdown
    const coursesResponse = await courseService.getCourses();
    courses.value = coursesResponse.data;
  } catch (error) {
    console.error('Error fetching groups:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.groups-container {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

/* Updated filters styling with proper spacing and alignment */
.filters {
  display: flex;
  gap: .5rem; /* Significantly increased gap between search and filter */
  margin-bottom: 2rem;
  align-items: stretch; /* Ensure all elements stretch to the same height */
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
  height: 46px; /* Exact height specification */
  box-sizing: border-box;
}

.filter-options select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 200px;
  height: 46px; /* Exact same height as search input */
  box-sizing: border-box;
}

.actions {
  display: flex;
  gap: 1rem;
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
  transition: background-color 0.2s;
}

.action-button.import {
  background-color: #2c3e50;
  text-decoration: none;
}

.action-button:hover {
  opacity: 0.9;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
  font-size: 1rem;
  margin: 2rem 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #7f8c8d;
  font-size: 1rem;
  margin: 2rem 0;
}

.empty-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.group-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.group-header h3 {
  margin: 0;
  color: #2c3e50;
}

.member-count {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.course-name {
  color: #3498db;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
}

.course-link {
  color: inherit;
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
}

.course-link:hover {
  text-decoration: underline;
  color: #2980b9;
}

.group-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
}

.view-button {
  background-color: #3498db;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.icon-button {
  background: none;
  border: none;
  color: #7f8c8d;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
}

.icon-button.edit:hover {
  color: #f39c12;
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
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
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
  font-size: 1.2rem;
  margin: 0;
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
  box-sizing: border-box; /* Add this to include padding in width calculation */
  max-width: 100%; /* Ensure inputs don't exceed their container */
}

/* Student selector styles */
.student-selector {
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #f8f9fa;
  max-height: 300px;
  overflow-y: auto;
}

.selected-students {
  padding: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  border-bottom: 1px solid #ddd;
  background: white;
}

.selected-student-chip {
  background: #3498db;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 16px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
}

.remove-chip:hover {
  background: rgba(255, 255, 255, 0.2);
}

.student-dropdown .search-box {
  padding: 0.5rem;
  border-bottom: 1px solid #ddd;
  background: white;
  position: relative;
  display: flex;
  align-items: center;
}

.student-dropdown .search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
  z-index: 1;
}

.student-dropdown .search-box input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.dropdown-options {
  max-height: 200px;
  overflow-y: auto;
}

.student-select-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #eee;
}

.student-select-item:hover {
  background: #e3f2fd;
}

.student-select-item:last-child {
  border-bottom: none;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.student-details h3 {
  margin: 0;
  font-size: 1rem;
  color: #2c3e50;
}

.student-email, .student-id {
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  color: #7f8c8d;
}

.no-students, .no-course-selected {
  padding: 1rem;
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
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

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filters {
    flex-direction: column;
    width: 100%;
  }

  .search-box, .filter-options select {
    width: 100%;
  }

  .groups-grid {
    grid-template-columns: 1fr;
  }
}
</style>
