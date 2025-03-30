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
              <button v-if="isTeacher" class="add-button" @click="showAddStudentModal = true">
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
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { groupService, authService } from '../services/api';

const router = useRouter();
const route = useRoute();
const group = ref({});
const loading = ref(true);
const error = ref(null);
const isTeacher = ref(false);
const showAddStudentModal = ref(false);
const showEditGroupModal = ref(false);
const editingGroup = ref(null);

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
  if (confirm(`Are you sure you want to delete the group "${group.value.name}"?`)) {
    deleteGroup();
  }
};

const deleteGroup = async () => {
  try {
    // Implement actual delete call
    // await groupService.deleteGroup(group.value.id);
    console.log('Deleting group:', group.value.id);
    router.push('/groups');
  } catch (err) {
    console.error('Error deleting group:', err);
    error.value = 'Failed to delete group. Please try again.';
  }
};

// Add student to group
const addStudent = async (studentId) => {
  try {
    await groupService.addStudentToGroup(group.value.id, studentId);
    // Refresh group data
    fetchGroupDetails();
  } catch (err) {
    console.error('Error adding student:', err);
    error.value = 'Failed to add student. Please try again.';
  }
};

// Remove student from group
const removeStudent = async (studentId) => {
  if (confirm('Are you sure you want to remove this student from the group?')) {
    try {
      await groupService.removeStudentFromGroup(group.value.id, studentId);
      // Refresh group data
      fetchGroupDetails();
    } catch (err) {
      console.error('Error removing student:', err);
      error.value = 'Failed to remove student. Please try again.';
    }
  }
};

// Create assessment for group
const createAssessment = () => {
  // Navigate to assessment creation page with group pre-selected
  router.push({
    path: '/assessments/create',
    query: { groupId: group.value.id }
  });
};

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
  await fetchGroupDetails();
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
