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
        <button class="back-button" @click="goBack">
          <i class="fas fa-arrow-left"></i> Back
        </button>
      </div>

      <template v-else>
        <!-- Header section -->
        <div class="header-section">
          <div class="back-nav">
            <button class="back-button" @click="goBack">
              <i class="fas fa-arrow-left"></i> Back
            </button>
          </div>
          <div class="title-section">
            <h1>{{ group.name }}</h1>
            <p class="course-name">
              <router-link :to="`/course/${group.course_id}`" class="course-link">
                {{ group.course_name }}
              </router-link>
            </p>
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
              <!-- Teacher View -->
              <div v-if="isTeacher" v-for="assessment in group.assessments" :key="assessment.id" class="group-assessment-card">
                <div class="assessment-header">
                  <h3>{{ assessment.title }}</h3>
                  <div class="due-date-info">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Due: {{ formatDate(assessment.due_date) }}</span>
                  </div>
                </div>

                <div class="assessment-content">
                  <p class="assessment-description">{{ assessment.description }}</p>
                </div>

                <div class="assessment-footer">
                  <div class="assessment-status">
                    <i class="fas fa-tasks"></i>
                    <span>Group Assessment</span>
                  </div>
                  <router-link :to="`/assessment/${assessment.id}/results`" class="view-details-button">
                    <i class="fas fa-chart-bar"></i>
                    View Details
                  </router-link>
                </div>
              </div>

              <!-- Student View -->
              <div v-else-if="!isTeacher" v-for="assessment in group.assessments" :key="`student-${assessment.id}`" class="group-assessment-card">
                <div class="assessment-header">
                  <h3>{{ assessment.title }}</h3>
                  <div class="due-date-info">
                    <i class="fas fa-calendar-alt"></i>
                    <span>Due: {{ formatDate(assessment.due_date) }}</span>
                  </div>
                </div>

                <div class="assessment-content">
                  <p class="assessment-description">{{ assessment.description }}</p>
                </div>

                <div class="assessment-footer">
                  <div class="assessment-status">
                    <i class="fas fa-tasks"></i>
                    <span>Group Assessment</span>
                  </div>
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
      <AddStudentModal
        v-model="showAddStudentModal"
        title="Add Students to Group"
        :available-students="availableStudents"
        :loading="loadingStudents"
        @confirm="addSelectedStudents"
        @cancel="cancelAddStudents"
      />

      <!-- Create Assessment Modal -->
      <div v-if="showCreateAssessmentModal" class="modal-overlay">
        <div class="modal-content assessment-modal">
          <div class="modal-header">
            <h2>Create Assessment</h2>
            <button class="close-button" @click="showCreateAssessmentModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitNewAssessment">
              <div class="form-group">
                <label for="title">Title *</label>
                <input
                  id="title"
                  v-model="newAssessment.title"
                  type="text"
                  required
                  placeholder="Enter assessment title"
                />
              </div>

              <div class="form-group">
                <label for="description">Description *</label>
                <textarea
                  id="description"
                  v-model="newAssessment.description"
                  required
                  placeholder="Enter assessment description"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="dueDate">Due Date *</label>
                <input
                  id="dueDate"
                  v-model="newAssessment.dueDate"
                  type="datetime-local"
                  required
                />
              </div>

              <div class="criteria-section">
                <h3>Assessment Criteria</h3>
                <p class="hint">Add at least one criterion to evaluate</p>

                <div v-for="(criterion, index) in newAssessment.criteria" :key="index" class="criterion-item">
                  <div class="criterion-header">
                    <h4>Criterion {{ index + 1 }}</h4>
                    <button type="button" class="remove-button" @click="removeCriterion(index)">&times;</button>
                  </div>

                  <div class="form-group">
                    <label :for="'criterion-name-' + index">Name *</label>
                    <input
                      :id="'criterion-name-' + index"
                      v-model="criterion.name"
                      type="text"
                      required
                      placeholder="e.g., Teamwork, Communication"
                    />
                  </div>

                  <div class="form-group">
                    <label :for="'criterion-desc-' + index">Description</label>
                    <textarea
                      :id="'criterion-desc-' + index"
                      v-model="criterion.description"
                      placeholder="Explain what students should evaluate"
                    ></textarea>
                  </div>

                  <div class="scores-range">
                    <div class="form-group">
                      <label :for="'min-score-' + index">Min Score</label>
                      <input
                        :id="'min-score-' + index"
                        v-model.number="criterion.minScore"
                        type="number"
                        min="0"
                        max="9"
                        required
                      />
                    </div>

                    <div class="form-group">
                      <label :for="'max-score-' + index">Max Score</label>
                      <input
                        :id="'max-score-' + index"
                        v-model.number="criterion.maxScore"
                        type="number"
                        min="1"
                        max="10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button type="button" class="add-criterion-button" @click="addCriterion">
                  <i class="fas fa-plus"></i> Add Criterion
                </button>
              </div>

              <div class="form-actions">
                <button type="button" class="cancel-button" @click="showCreateAssessmentModal = false">Cancel</button>
                <button
                  type="submit"
                  class="create-button"
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
import AddStudentModal from '../components/Common/AddStudentModal.vue';
import { groupService, authService, assessmentService } from '../services/api';
import { useNotificationStore } from '../stores/notificationStore';
import { useBackNavigation } from '../composables/useBackNavigation';

const router = useRouter();
const route = useRoute();
const notificationStore = useNotificationStore();
const { goBack } = useBackNavigation('/groups');
const group = ref({});
const loading = ref(true);
const error = ref(null);
const isTeacher = ref(false);
const showAddStudentModal = ref(false);
const showEditGroupModal = ref(false);
const editingGroup = ref(null);
const loadingStudents = ref(false);
const availableStudents = ref([]);
const showCreateAssessmentModal = ref(false);
const submittingAssessment = ref(false);
const showDeleteModal = ref(false);
const showStudentDeleteModal = ref(false);
const studentToDelete = ref(null);

// New assessment form data
const newAssessment = ref({
  title: '',
  description: '',
  dueDate: '',
  criteria: [
    {
      name: '',
      description: '',
      minScore: 0,
      maxScore: 10
    }
  ]
});

// Format date function
const formatDate = (dateString) => {
  if (!dateString) return 'No date set';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

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
    minScore: 0,
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
    // Format data for API - use groupIds array to match AssessmentsView format
    const assessmentData = {
      title: newAssessment.value.title,
      description: newAssessment.value.description,
      dueDate: new Date(newAssessment.value.dueDate).toISOString(),
      groupIds: [group.value.id], // Send as array like AssessmentsView
      courseId: group.value.course_id, // Use the group's course ID (correct field name)
      criteria: newAssessment.value.criteria.map(c => ({
        name: c.name,
        description: c.description,
        minScore: parseFloat(c.minScore),
        maxScore: parseFloat(c.maxScore)
      }))
    };

    // Call API to create assessment
    await assessmentService.createAssessment(assessmentData);

    // Show success notification
    notificationStore.success('Assessment created successfully!');

    // Reset form
    newAssessment.value = {
      title: '',
      description: '',
      dueDate: '',
      criteria: [
        {
          name: '',
          description: '',
          minScore: 0,
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
    notificationStore.error('Failed to create assessment. Please try again.');
  } finally {
    submittingAssessment.value = false;
  }
};

// Check if assessment form is valid
const isAssessmentFormValid = computed(() => {
  return (
    newAssessment.value.title.trim() !== '' &&
    newAssessment.value.description.trim() !== '' &&
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
  } catch (err) {
    console.error('Error fetching available students:', err);
    availableStudents.value = [];
  } finally {
    loadingStudents.value = false;
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

// Open add student modal (teachers only)
const openAddStudentModal = async () => {
  if (isTeacher.value) {
    showAddStudentModal.value = true;
    await fetchAvailableStudents();
  }
};

const cancelAddStudents = () => {
  showAddStudentModal.value = false;
};

const addSelectedStudents = async (selectedStudents) => {
  if (selectedStudents.length === 0) return;

  try {
    // Add all selected students to the group
    const promises = selectedStudents.map(student =>
      groupService.addStudentToGroup(group.value.id, student.id)
    );

    await Promise.all(promises);

    notificationStore.success(`${selectedStudents.length} student${selectedStudents.length !== 1 ? 's' : ''} added to group successfully.`);

    // Close modal
    showAddStudentModal.value = false;

    // Refresh both group data and available students list
    const refreshPromises = [fetchGroupDetails()];
    if (isTeacher.value) {
      refreshPromises.push(fetchAvailableStudents());
    }
    await Promise.all(refreshPromises);
  } catch (err) {
    console.error('Error adding students:', err);
    notificationStore.error('Failed to add students. Please try again.');
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

.action-buttons {
  display: flex;
  gap: 1rem;
}

.edit-button, .delete-button {
  border: none;
  padding: 0.875rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.edit-button {
  background-color: #f39c12;
  color: white;
}

.edit-button:hover {
  background-color: #e67e22;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.delete-button {
  background-color: #e74c3c;
  color: white;
}

.delete-button:hover {
  background-color: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
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

/* Assessment Modal Specific Styles - matching AssessmentsView */
.assessment-modal {
  width: 800px;
  max-width: 95%;
}

.assessment-modal .modal-body {
  padding: 2rem;
}

.assessment-modal .form-group {
  margin-bottom: 1.5rem;
}

.assessment-modal .form-group label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.assessment-modal .form-group input,
.assessment-modal .form-group textarea {
  padding: 0.75rem 1rem;
  border: 2px solid #e1e1e1;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.assessment-modal .form-group input:focus,
.assessment-modal .form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.assessment-modal .form-group input::placeholder,
.assessment-modal .form-group textarea::placeholder {
  color: #95a5a6;
}

/* Criteria Section */
.criteria-section {
  margin-top: 2rem;
}

.criteria-section h3 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
  font-weight: 600;
}

.hint {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  font-style: italic;
}

/* Criterion Items */
.criterion-item {
  background-color: white;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e1e1e1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.criterion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.criterion-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.remove-button {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.remove-button:hover {
  background: rgba(231, 76, 60, 0.1);
  transform: scale(1.1);
}

.scores-range {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.scores-range .form-group {
  margin-bottom: 0;
}

.scores-range input {
  width: 100%;
}

/* Add Criterion Button */
.add-criterion-button {
  width: 100%;
  padding: 0.75rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s ease;
  margin-top: 1rem;
}

.add-criterion-button:hover {
  background: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.add-criterion-button i {
  font-size: 0.9rem;
}

/* Form Actions */
.assessment-modal .form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e1e1e1;
}

.assessment-modal .cancel-button {
  padding: 0.75rem 1.5rem;
  border: 1px solid #e74c3c;
  background: white;
  color: #e74c3c;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.assessment-modal .cancel-button:hover {
  background: #e74c3c;
  color: white;
}

.create-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: #2ecc71;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.create-button:hover:not(:disabled) {
  background: #27ae60;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.create-button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Student Assessment Cards - Simple Design */
.group-assessment-card {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 8px;
  background: #f8f9fa;
  margin-bottom: 0.5rem;
}

.assessment-header {
  margin-bottom: 0.5rem;
}

.assessment-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
}

.due-date-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #7f8c8d;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.due-date-info i {
  color: #3498db;
}

.assessment-content {
  margin-bottom: 0.5rem;
}

.assessment-content .assessment-description {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.assessment-footer {
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assessment-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #7f8c8d;
  font-size: 0.8rem;
  font-weight: 500;
}

.assessment-status i {
  color: #27ae60;
}

.view-details-button {
  background-color: #3498db;
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.view-details-button:hover {
  background-color: #2980b9;
}

@media (max-width: 992px) {
  .details-grid {
    grid-template-columns: 1fr;
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
  transition: all 0.2s ease;
  border-radius: 8px;
}

.student-select-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.students-select-list {
  max-height: 300px;
  overflow-y: auto;
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
