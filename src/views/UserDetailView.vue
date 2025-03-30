<template>
  <PageLayout>
    <div class="user-detail-container">
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading user details...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="back-button" @click="goBack">
          Back
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
          <div class="user-profile">
            <div class="user-avatar" :class="user.role">
              {{ getInitials(user.first_name, user.last_name) }}
            </div>
            <div class="user-info">
              <h1>{{ user.first_name }} {{ user.last_name }}</h1>
              <div class="user-details">
                <span class="user-email">{{ user.email }}</span>
                <span class="role-badge" :class="user.role">
                  {{ user.role.charAt(0).toUpperCase() + user.role.slice(1) }}
                </span>
                <span v-if="user.q_number" class="q-number">{{ user.q_number }}</span>
              </div>
            </div>
          </div>
          <div class="action-buttons" v-if="isAdmin">
            <button class="edit-button" @click="showEditModal = true">
              <i class="fas fa-edit"></i> Edit User
            </button>
            <button class="reset-password-button" @click="showResetPasswordModal = true">
              <i class="fas fa-key"></i> Reset Password
            </button>
            <button class="delete-button" @click="confirmDeleteUser">
              <i class="fas fa-trash"></i> Delete User
            </button>
          </div>
        </div>

        <!-- Profile info grid -->
        <div class="info-grid">
          <!-- Account section -->
          <div class="info-card account-section">
            <h2><i class="fas fa-user-circle"></i> Account Information</h2>
            <div class="info-list">
              <div class="info-item">
                <span class="info-label">Full Name</span>
                <span class="info-value">{{ user.first_name }} {{ user.last_name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">{{ user.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Role</span>
                <span class="info-value">{{ user.role.charAt(0).toUpperCase() + user.role.slice(1) }}</span>
              </div>
              <div v-if="user.q_number" class="info-item">
                <span class="info-label">Q-Number</span>
                <span class="info-value">{{ user.q_number }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Account Created</span>
                <span class="info-value">{{ formatDate(user.created_at) }}</span>
              </div>
              <div v-if="user.updated_at" class="info-item">
                <span class="info-label">Last Updated</span>
                <span class="info-value">{{ formatDate(user.updated_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Stats section -->
          <div class="info-card stats-section">
            <h2><i class="fas fa-chart-bar"></i> User Statistics</h2>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-value">{{ user.courses ? user.courses.length : 0 }}</span>
                <span class="stat-label">{{ user.role === 'student' ? 'Enrolled Courses' : 'Teaching Courses' }}</span>
              </div>
              <div v-if="user.role === 'student'" class="stat-item">
                <span class="stat-value">{{ user.groups ? user.groups.length : 0 }}</span>
                <span class="stat-label">Groups</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ assessmentCount }}</span>
                <span class="stat-label">Assessments</span>
              </div>
              <div v-if="user.role === 'student'" class="stat-item">
                <span class="stat-value">{{ completedAssessments }}</span>
                <span class="stat-label">Completed Assessments</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Courses section -->
        <div class="info-card courses-section">
          <h2><i class="fas fa-book"></i> {{ user.role === 'student' ? 'Enrolled Courses' : 'Teaching Courses' }}</h2>

          <div v-if="user.courses && user.courses.length > 0" class="courses-list">
            <div v-for="course in user.courses" :key="course.id" class="course-item">
              <div class="course-info">
                <h3>{{ course.name }}</h3>
                <p class="course-code">{{ course.code }}</p>
              </div>
              <div class="course-actions">
                <router-link :to="`/course/${course.id}`" class="view-button">
                  View Course
                </router-link>
              </div>
            </div>
          </div>

          <div v-else class="empty-list">
            <p>{{ user.role === 'student' ? 'Not enrolled in any courses.' : 'Not teaching any courses.' }}</p>
          </div>
        </div>

        <!-- Groups section (for students) -->
        <div v-if="user.role === 'student'" class="info-card groups-section">
          <h2><i class="fas fa-users"></i> Groups</h2>

          <div v-if="user.groups && user.groups.length > 0" class="groups-list">
            <div v-for="group in user.groups" :key="group.id" class="group-item">
              <div class="group-info">
                <h3>{{ group.name }}</h3>
                <p class="course-name">{{ group.course_name }}</p>
              </div>
              <div class="group-actions">
                <router-link :to="`/group/${group.id}`" class="view-button">
                  View Group
                </router-link>
              </div>
            </div>
          </div>

          <div v-else class="empty-list">
            <p>Not a member of any groups.</p>
          </div>
        </div>
      </template>

      <!-- Edit User Modal -->
      <div v-if="showEditModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Edit User</h2>
            <button class="close-button" @click="showEditModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateUser">
              <div class="form-group">
                <label for="first-name">First Name</label>
                <input
                  type="text"
                  id="first-name"
                  v-model="editForm.first_name"
                  required
                >
              </div>
              <div class="form-group">
                <label for="last-name">Last Name</label>
                <input
                  type="text"
                  id="last-name"
                  v-model="editForm.last_name"
                  required
                >
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  v-model="editForm.email"
                  required
                >
              </div>
              <div class="form-group">
                <label for="role">Role</label>
                <select id="role" v-model="editForm.role" required>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div v-if="editForm.role === 'student'" class="form-group">
                <label for="q-number">Q-Number</label>
                <input
                  type="text"
                  id="q-number"
                  v-model="editForm.q_number"
                  required
                >
              </div>
              <div class="form-actions">
                <button type="button" class="cancel-button" @click="showEditModal = false">
                  Cancel
                </button>
                <button type="submit" class="submit-button">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div v-if="showResetPasswordModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Reset Password</h2>
            <button class="close-button" @click="showResetPasswordModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="resetPassword">
              <div class="form-group">
                <label for="new-password">New Password</label>
                <input
                  type="password"
                  id="new-password"
                  v-model="passwordForm.password"
                  required
                  minlength="8"
                >
              </div>
              <div class="form-group">
                <label for="confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="confirm-password"
                  v-model="passwordForm.confirmPassword"
                  required
                >
                <p v-if="passwordMismatch" class="error-message">
                  Passwords do not match
                </p>
              </div>
              <div class="security-verification">
                <label for="admin-password">Your Admin Password</label>
                <input
                  type="password"
                  id="admin-password"
                  v-model="passwordForm.adminPassword"
                  placeholder="Enter your password to confirm"
                  required
                >
              </div>
              <div class="form-actions">
                <button type="button" class="cancel-button" @click="showResetPasswordModal = false">
                  Cancel
                </button>
                <button type="submit" class="submit-button" :disabled="passwordMismatch">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Delete User Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal-overlay">
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
              Are you sure you want to delete the user "{{ user.first_name }} {{ user.last_name }}"?
            </p>
            <p class="permanent-note">This action cannot be undone.</p>

            <div class="security-verification">
              <label for="delete-admin-password">Admin Password:</label>
              <input
                type="password"
                id="delete-admin-password"
                v-model="deletePassword"
                placeholder="Enter your password to confirm"
              >
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-button" @click="showDeleteModal = false">
              Cancel
            </button>
            <button
              class="confirm-button"
              :disabled="!deletePassword"
              @click="deleteUser"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { userService, authService } from '../services/api';

const router = useRouter();
const route = useRoute();
const user = ref({});
const loading = ref(true);
const error = ref(null);
const isAdmin = ref(false);

// Stats
const assessmentCount = ref(0);
const completedAssessments = ref(0);

// Modal state
const showEditModal = ref(false);
const showResetPasswordModal = ref(false);
const showDeleteModal = ref(false);

// Form data
const editForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  role: '',
  q_number: ''
});

const passwordForm = ref({
  password: '',
  confirmPassword: '',
  adminPassword: ''
});

const deletePassword = ref('');

const passwordMismatch = computed(() => {
  return passwordForm.value.password &&
         passwordForm.value.confirmPassword &&
         passwordForm.value.password !== passwordForm.value.confirmPassword;
});

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getInitials = (firstName, lastName) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const goBack = () => {
  if (window.history.length > 2) {
    router.go(-1);
  } else {
    router.push('/admin');
  }
};

// Initialize edit form with user data
const initEditForm = () => {
  editForm.value = {
    first_name: user.value.first_name,
    last_name: user.value.last_name,
    email: user.value.email,
    role: user.value.role,
    q_number: user.value.q_number || ''
  };
};

// Update user
const updateUser = async () => {
  try {
    await userService.updateUser(user.value.id, {
      first_name: editForm.value.first_name,
      last_name: editForm.value.last_name,
      email: editForm.value.email,
      role: editForm.value.role,
      q_number: editForm.value.role === 'student' ? editForm.value.q_number : null
    });

    showEditModal.value = false;
    fetchUserDetails();
  } catch (err) {
    console.error('Error updating user:', err);
    error.value = 'Failed to update user. Please try again.';
  }
};

// Reset user password
const resetPassword = async () => {
  if (passwordForm.value.password !== passwordForm.value.confirmPassword) {
    return;
  }

  try {
    // First verify admin password
    const verification = await authService.verifyPassword(passwordForm.value.adminPassword);
    if (!verification.data.valid) {
      alert('Incorrect password. Password reset cancelled.');
      return;
    }

    await userService.updateUser(user.value.id, {
      password: passwordForm.value.password
    });

    alert('Password has been reset successfully.');
    showResetPasswordModal.value = false;
    passwordForm.value = {
      password: '',
      confirmPassword: '',
      adminPassword: ''
    };
  } catch (err) {
    console.error('Error resetting password:', err);
    error.value = 'Failed to reset password. Please try again.';
  }
};

// Confirm user deletion
const confirmDeleteUser = () => {
  showDeleteModal.value = true;
  deletePassword.value = '';
};

// Delete user
const deleteUser = async () => {
  try {
    // Verify admin password first
    const verification = await authService.verifyPassword(deletePassword.value);
    if (!verification.data.valid) {
      alert('Incorrect password. Delete operation cancelled.');
      return;
    }

    await userService.deleteUser(user.value.id);
    alert('User has been deleted successfully.');
    router.push('/admin');
  } catch (err) {
    console.error('Error deleting user:', err);
    error.value = 'Failed to delete user. Please try again.';
  }
};

// Fetch user details
const fetchUserDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const userId = route.params.id;
    const response = await userService.getUserById(userId);
    user.value = response.data;

    // Set mock assessment counts for now
    // In a real implementation, you would get this from the API
    assessmentCount.value = Math.floor(Math.random() * 10); // Mock data
    completedAssessments.value = Math.floor(Math.random() * assessmentCount.value); // Mock data

    initEditForm();
  } catch (err) {
    console.error('Error fetching user details:', err);
    error.value = 'Failed to load user details. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Check if current user is admin
const checkAdminStatus = async () => {
  try {
    const response = await authService.checkUserRole();
    isAdmin.value = response.data.role === 'admin';

    if (!isAdmin.value) {
      // Redirect non-admin users unless they're viewing their own profile
      const userId = parseInt(route.params.id);
      if (userId !== response.data.id) {
        router.push('/home');
      }
    }
  } catch (err) {
    console.error('Error checking admin status:', err);
    router.push('/home');
  }
};

onMounted(async () => {
  await checkAdminStatus();
  await fetchUserDetails();
});
</script>

<style scoped>
.user-detail-container {
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
  margin-bottom: 2rem;
}

.back-nav {
  margin-bottom: 1rem;
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

.user-profile {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
}

.user-avatar.admin {
  background-color: #34495e;
}

.user-avatar.teacher {
  background-color: #27ae60;
}

.user-info h1 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.user-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.user-email {
  color: #7f8c8d;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.role-badge.student {
  background: #cce5ff;
  color: #004085;
}

.role-badge.teacher {
  background: #d4edda;
  color: #155724;
}

.role-badge.admin {
  background: #d6d8d9;
  color: #1b1e21;
}

.q-number {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.edit-button, .reset-password-button, .delete-button {
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

.reset-password-button {
  background-color: #3498db;
  color: white;
}

.delete-button {
  background-color: #e74c3c;
  color: white;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.info-card {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.info-card h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.info-value {
  font-weight: 500;
  color: #2c3e50;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #3498db;
  display: block;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.courses-list, .groups-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.course-item, .group-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.course-info h3, .group-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.course-code, .course-name {
  color: #3498db;
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
}

.course-actions, .group-actions {
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
  background: #f8f9fa;
  border-radius: 8px;
  color: #7f8c8d;
}

/* Modal styles */
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

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
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

.form-group input, .form-group select {
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

.submit-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.security-verification {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

/* Confirmation modal */
.confirmation-modal {
  text-align: center;
}

.warning-icon {
  color: #e74c3c;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.confirmation-text {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.permanent-note {
  color: #e74c3c;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
  border-top: 1px solid #eee;
}

.confirm-button {
  background: #e74c3c;
  color: white;
}

.confirm-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }

  .courses-list, .groups-list {
    grid-template-columns: 1fr;
  }
}
</style>
