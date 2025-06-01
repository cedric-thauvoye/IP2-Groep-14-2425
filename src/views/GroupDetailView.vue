<template>
  <PageLayout>
    <div class="group-detail-container">
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading group details...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="back-button" @click="router.push('/groups')">
          Back to Groups
        </button>
      </div>

      <template v-else>
        <!-- Header section -->
        <div class="header-section">
          <div class="back-nav">
            <button class="back-button" @click="router.push('/groups')">
              <i class="fas fa-arrow-left"></i> Back to Groups
            </button>
          </div>
          <div class="title-section">
            <h1>{{ group.name }}</h1>
            <p class="course-name">{{ group.course_name }}</p>
          </div>
          <div class="action-buttons" v-if="isTeacher">
            <button class="edit-button" @click="editGroup">
              <i class="fas fa-edit"></i> Edit Group
            </button>
            <button class="delete-button" @click="confirmDeleteGroup">
              <i class="fas fa-trash"></i> Delete Group
            </button>
          </div>
        </div>

        <!-- Details Grid -->
        <div class="details-grid">
          <!-- Students section -->
          <div class="details-card students-section">
            <div class="card-header">
              <h2><i class="fas fa-users"></i> Students</h2>
              <button v-if="isTeacher" class="add-button" @click="openAddStudentModal">
                <i class="fas fa-plus"></i> Add Student
              </button>
            </div>

            <div v-if="group.students && group.students.length > 0" class="students-list">
              <div v-for="student in group.students" :key="student.id" class="student-item">
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

            <div v-else class="empty-list">
              <p>No students in this group.</p>
            </div>
          </div>

          <!-- Assessments section -->
          <div class="details-card assessments-section">
            <div class="card-header">
              <h2><i class="fas fa-tasks"></i> Assessments</h2>
              <button v-if="isTeacher" class="add-button" @click="createAssessment">
                <i class="fas fa-plus"></i> Create Assessment
              </button>
            </div>

            <div v-if="group.assessments && group.assessments.length > 0" class="assessments-list">
              <div v-for="assessment in group.assessments" :key="assessment.id" class="assessment-item">
                <div class="assessment-info">
                  <h3>{{ assessment.title }}</h3>
                  <p class="assessment-description">{{ assessment.description }}</p>
                  <p class="assessment-due-date">
                    <i class="fas fa-calendar-alt"></i> Due: {{ formatDate(assessment.due_date) }}
                  </p>
                </div>
                <div class="assessment-actions">
                  <router-link :to="`/assessment/${assessment.id}`" class="view-button">
                    View Details
                  </router-link>
                </div>
              </div>
            </div>

            <div v-else class="empty-list">
              <p>No assessments for this group.</p>
            </div>
          </div>
        </div>
      </template>

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
              <div class="form-group">
                <label for="group-description">Description</label>
                <textarea
                  id="group-description"
                  v-model="editingGroup.description"
                  rows="3"
                ></textarea>
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

      <!-- Add Student Modal -->
      <div v-if="showAddStudentModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Add Student to Group</h2>
            <button class="close-button" @click="showAddStudentModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div v-if="loadingStudents" class="loading-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              <span>Loading students...</span>
            </div>
            <div v-else-if="availableStudents.length === 0" class="no-students">
              <p>No available students to add to this group.</p>
            </div>
            <div v-else>
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input
                  type="text"
                  v-model="studentSearchQuery"
                  placeholder="Search students..."
                  @input="filterStudents"
                >
              </div>

              <div class="students-select-list">
                <div
                  v-for="student in filteredStudents"
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
                  <button class="add-student-button" @click="addStudent(student.id)">
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

      <!-- Create Assessment Modal -->
      <div v-if="showCreateAssessmentModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Create Assessment</h2>
            <button class="close-button" @click="showCreateAssessmentModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitNewAssessment">
              <div class="form-group">
                <label for="assessment-title">Title</label>
                <input
                  type="text"
                  id="assessment-title"
                  v-model="newAssessment.title"
                  required
                >
              </div>
              <div class="form-group">
                <label for="assessment-description">Description</label>
                <textarea
                  id="assessment-description"
                  v-model="newAssessment.description"
                  rows="3"
                ></textarea>
              </div>
              <div class="form-group">
                <label for="assessment-due-date">Due Date</label>
                <input
                  type="datetime-local"
                  id="assessment-due-date"
                  v-model="newAssessment.dueDate"
                  required
                >
              </div>

              <div class="assessment-criteria">
                <h3>Criteria</h3>
                <div
                  v-for="(criterion, index) in newAssessment.criteria"
                  :key="index"
                  class="criterion-item"
                >
                  <div class="criterion-header">
                    <h4>Criterion {{ index + 1 }}</h4>
                    <button type="button" class="remove-criterion" @click="removeCriterion(index)">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>

                  <div class="form-group">
                    <label :for="`criterion-name-${index}`">Name</label>
                    <input
                      type="text"
                      :id="`criterion-name-${index}`"
                      v-model="criterion.name"
                      required
                    >
                  </div>

                  <div class="form-group">
                    <label :for="`criterion-description-${index}`">Description</label>
                    <textarea
                      :id="`criterion-description-${index}`"
                      v-model="criterion.description"
                      rows="2"
                    ></textarea>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label :for="`criterion-min-score-${index}`">Min Score</label>
                      <input
                        type="number"
                        :id="`criterion-min-score-${index}`"
                        v-model="criterion.minScore"
                        required
                        min="0"
                      >
                    </div>
                    <div class="form-group">
                      <label :for="`criterion-max-score-${index}`">Max Score</label>
                      <input
                        type="number"
                        :id="`criterion-max-score-${index}`"
                        v-model="criterion.maxScore"
                        required
                        min="1"
                      >
                    </div>
                  </div>
                </div>

                <button type="button" class="add-criterion-button" @click="addCriterion">
                  <i class="fas fa-plus"></i> Add Criterion
                </button>
              </div>

              <div class="form-actions">
                <button type="button" class="cancel-button" @click="showCreateAssessmentModal = false">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="save-button"
                  :disabled="!isAssessmentFormValid || submittingAssessment"
                >
                  <i v-if="submittingAssessment" class="fas fa-spinner fa-spin"></i>
                  <span v-else>Create Assessment</span>
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
              Are you sure you want to delete the group "{{ group.name }}"?
            </p>
            <p class="permanent-note">This action cannot be undone.</p>
            <div class="action-buttons">
              <button class="cancel-button" @click="showDeleteModal = false">
                Cancel
              </button>
              <button class="delete-button" @click="deleteGroup">
                Delete Group
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Remove Student Confirmation Modal -->
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
              Are you sure you want to remove {{ studentToDelete?.first_name }} {{ studentToDelete?.last_name }} from the group?
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
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { groupService, authService, assessmentService, userService } from '../services/api';
import { useNotificationStore } from '../stores/notificationStore';

const router = useRouter();
const route = useRoute();
const notificationStore = useNotificationStore();
const group = ref({});
const loading = ref(true);
const error = ref(null);
const isTeacher = ref(false);
const showAddStudentModal = ref(false);
const showEditGroupModal = ref(false);
const editingGroup = ref(null);
const loadingStudents = ref(false);
const availableStudents = ref([]);
const studentSearchQuery = ref('');
const filteredStudents = ref([]);
const showCreateAssessmentModal = ref(false);
const submittingAssessment = ref(false);
const showDeleteModal = ref(false);
const showStudentDeleteModal = ref(false);
const studentToDelete = ref(null);

// Format date function
const formatDate = (dateString) => {
  if (!dateString) return 'No date set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get initials for user avatar
const getInitials = (firstName, lastName) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Edit group functionality
const editGroup = () => {
  editingGroup.value = { ...group.value };
  showEditGroupModal.value = true;
};

// Save edited group
const saveEditedGroup = async () => {
  try {
    await groupService.updateGroup(editingGroup.value.id, editingGroup.value);

    // Refresh the group data
    fetchGroupDetails();

    // Close modal
    showEditGroupModal.value = false;
    editingGroup.value = null;
  } catch (error) {
    console.error('Error updating group:', error);
    error.value = 'Failed to update group. Please try again.';
  }
};

// Delete group functionality
const confirmDeleteGroup = () => {
  showDeleteModal.value = true;
};

const deleteGroup = async () => {
  try {
    await groupService.deleteGroup(group.value.id);
    router.push('/groups');
  } catch (err) {
    console.error('Error deleting group:', err);
    error.value = 'Failed to delete group. Please try again.';
  } finally {
    showDeleteModal.value = false;
  }
};

// Add student to group
const addStudent = async (studentId) => {
  try {
    await groupService.addStudentToGroup(group.value.id, studentId);
    notificationStore.success('Student added to group successfully.');
    // Refresh both group data and available students list
    const promises = [fetchGroupDetails()];
    if (isTeacher.value) {
      promises.push(fetchAvailableStudents());
    }
    await Promise.all(promises);
    // Reset search query and refilter students
    studentSearchQuery.value = '';
    filterStudents();
  } catch (err) {
    console.error('Error adding student:', err);
    notificationStore.error('Failed to add student. Please try again.');
  }
};

// Initialize student removal
const removeStudent = (studentId) => {
  studentToDelete.value = group.value.students.find(student => student.id === studentId);
  showStudentDeleteModal.value = true;
};

// Handle student removal after confirmation
const handleStudentRemoval = async () => {
  if (!studentToDelete.value) return;

  try {
    await groupService.removeStudentFromGroup(group.value.id, studentToDelete.value.id);
    notificationStore.success(`${studentToDelete.value.first_name} ${studentToDelete.value.last_name} has been removed from the group.`);
    // Reset state
    showStudentDeleteModal.value = false;
    studentToDelete.value = null;
    // Refresh both group data and available students list
    const promises = [fetchGroupDetails()];
    if (isTeacher.value) {
      promises.push(fetchAvailableStudents());
    }
    await Promise.all(promises);
  } catch (err) {
    console.error('Error removing student:', err);
    notificationStore.error('Failed to remove student. Please try again.');
  }
};

// Create assessment for group
const createAssessment = () => {
  // Set groupId and courseId
  newAssessment.value.groupId = group.value.id;
  newAssessment.value.courseId = group.value.course_id;

  // Format date to ISO string
  if (!newAssessment.value.dueDate) {
    // Set default due date to 7 days from now
    const date = new Date();
    date.setDate(date.getDate() + 7);
    newAssessment.value.dueDate = new Date(date).toISOString().slice(0, 16);
  }

  // Open modal
  showCreateAssessmentModal.value = true;
};

// Add criterion
const addCriterion = () => {
  newAssessment.value.criteria.push({
    name: '',
    description: '',
    minScore: 1,
    maxScore: 10
  });
};

// Remove criterion
const removeCriterion = (index) => {
  if (newAssessment.value.criteria.length > 1) {
    newAssessment.value.criteria.splice(index, 1);
  }
};

// Submit new assessment
const submitNewAssessment = async () => {
  if (!isAssessmentFormValid.value) {
    return;
  }

  submittingAssessment.value = true;

  try {
    // Format data for API
    const assessmentData = {
      title: newAssessment.value.title,
      description: newAssessment.value.description,
      dueDate: new Date(newAssessment.value.dueDate).toISOString(),
      groupId: newAssessment.value.groupId,
      courseId: newAssessment.value.courseId,
      criteria: newAssessment.value.criteria.map(c => ({
        name: c.name,
        description: c.description,
        minScore: parseFloat(c.minScore),
        maxScore: parseFloat(c.maxScore)
      }))
    };

    // Call API to create assessment
    await assessmentService.createAssessment(assessmentData);

    // Reset form
    newAssessment.value = {
      title: '',
      description: '',
      dueDate: '',
      groupId: '',
      courseId: '',
      criteria: [
        {
          name: 'Participation',
          description: 'Level of participation in group activities',
          minScore: 1,
          maxScore: 10
        }
      ]
    };

    // Close modal
    showCreateAssessmentModal.value = false;

    // Refresh group data
    fetchGroupDetails();

  } catch (err) {
    console.error('Error creating assessment:', err);
    error.value = 'Failed to create assessment. Please try again.';
  } finally {
    submittingAssessment.value = false;
  }
};

// Check if assessment form is valid
const isAssessmentFormValid = computed(() => {
  return (
    newAssessment.value.title.trim() !== '' &&
    newAssessment.value.dueDate !== '' &&
    newAssessment.value.criteria.length > 0 &&
    newAssessment.value.criteria.every(
      c => c.name.trim() !== '' &&
          c.minScore !== null &&
          c.maxScore !== null &&
          parseFloat(c.maxScore) > parseFloat(c.minScore)
    )
  );
});

// Fetch group details
const fetchGroupDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const groupId = route.params.id;
    const response = await groupService.getGroupById(groupId);
    group.value = response.data;
  } catch (err) {
    console.error('Error fetching group details:', err);
    error.value = 'Failed to load group details. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Fetch available students
const fetchAvailableStudents = async () => {
  loadingStudents.value = true;

  try {
    const response = await groupService.getAvailableStudents(group.value.id);
    availableStudents.value = response.data;
    filteredStudents.value = response.data;
  } catch (err) {
    console.error('Error fetching available students:', err);
    availableStudents.value = [];
    filteredStudents.value = [];
  } finally {
    loadingStudents.value = false;
  }
};

// Filter students based on search query
const filterStudents = () => {
  const query = studentSearchQuery.value.toLowerCase();
  filteredStudents.value = availableStudents.value.filter(student =>
    student.first_name.toLowerCase().includes(query) ||
    student.last_name.toLowerCase().includes(query) ||
    student.email.toLowerCase().includes(query) ||
    student.q_number.toLowerCase().includes(query)
  );
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

// Open add student modal (teachers only)
const openAddStudentModal = async () => {
  if (isTeacher.value) {
    showAddStudentModal.value = true;
    await fetchAvailableStudents();
  }
};

onMounted(async () => {
  await checkUserRole();
  await fetchGroupDetails();
  // Only fetch available students for teachers who can add students to groups
  if (isTeacher.value) {
    await fetchAvailableStudents();
  }
});
</script>

<style scoped>
.group-detail-container {
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

.course-name {
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

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.details-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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

.add-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.students-list, .assessments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.student-item, .assessment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
}

.student-info, .assessment-info {
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
}

.student-details h3 {
  margin: 0;
  font-size: 1rem;
}

.student-email, .student-id {
  margin: 0.25rem 0 0 0;
  font-size: 0.8rem;
  color: #7f8c8d;
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

.assessment-item {
  flex-direction: column;
  align-items: flex-start;
}

.assessment-info {
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
}

.assessment-info h3 {
  margin: 0;
  font-size: 1rem;
}

.assessment-description {
  margin: 0.5rem 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.assessment-due-date {
  margin: 0.5rem 0 0 0;
  color: #7f8c8d;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.assessment-actions {
  align-self: flex-end;
  margin-top: 1rem;
}

.view-button {
  background-color: #3498db;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.empty-list {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
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
  margin: 0;
  font-size: 1.2rem;
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

.form-group input, .form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
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

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-box input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
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
  .details-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .student-item, .assessment-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .student-actions, .assessment-actions {
    align-self: flex-end;
  }
}
</style>
