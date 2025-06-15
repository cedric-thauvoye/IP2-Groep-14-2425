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
            <button class="edit-button" @click="openEditModal">
              <i class="fas fa-edit"></i> Edit User
            </button>
            <button class="reset-password-button" @click="openResetPasswordModal">
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
                <p class="course-name">
                  <router-link :to="`/course/${group.course_id}`" class="course-link">
                    {{ group.course_name }}
                  </router-link>
                </p>
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
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-content edit-modal">
          <div class="modal-header">
            <h2><i class="fas fa-user-edit"></i> Edit User</h2>
            <button class="close-button" @click="showEditModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateUser">
              <div class="form-row">
                <div class="form-group">
                  <label for="first-name">
                    <i class="fas fa-user"></i> First Name
                  </label>
                  <input
                    type="text"
                    id="first-name"
                    v-model="editForm.first_name"
                    :class="{ 'error': editErrors.first_name }"
                    required
                    placeholder="Enter first name"
                  >
                  <span v-if="editErrors.first_name" class="error-message">{{ editErrors.first_name }}</span>
                </div>
                <div class="form-group">
                  <label for="last-name">
                    <i class="fas fa-user"></i> Last Name
                  </label>
                  <input
                    type="text"
                    id="last-name"
                    v-model="editForm.last_name"
                    :class="{ 'error': editErrors.last_name }"
                    required
                    placeholder="Enter last name"
                  >
                  <span v-if="editErrors.last_name" class="error-message">{{ editErrors.last_name }}</span>
                </div>
              </div>

              <div class="form-group">
                <label for="email">
                  <i class="fas fa-envelope"></i> Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  v-model="editForm.email"
                  :class="{ 'error': editErrors.email }"
                  required
                  placeholder="Enter email address"
                >
                <span v-if="editErrors.email" class="error-message">{{ editErrors.email }}</span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="role">
                    <i class="fas fa-user-tag"></i> Role
                  </label>
                  <select id="role" v-model="editForm.role" required>
                    <option value="">Select role</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div v-if="editForm.role === 'student'" class="form-group">
                  <label for="q-number">
                    <i class="fas fa-id-card"></i> Q-Number
                  </label>
                  <input
                    type="text"
                    id="q-number"
                    v-model="editForm.q_number"
                    :class="{ 'error': editErrors.q_number }"
                    required
                    placeholder="Enter Q-number"
                  >
                  <span v-if="editErrors.q_number" class="error-message">{{ editErrors.q_number }}</span>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="cancel-button" @click="showEditModal = false">
                  <i class="fas fa-times"></i> Cancel
                </button>
                <button type="submit" class="submit-button" :disabled="isUpdating">
                  <i class="fas fa-save"></i>
                  {{ isUpdating ? 'Saving...' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Reset Password Modal -->
      <div v-if="showResetPasswordModal" class="modal-overlay" @click.self="showResetPasswordModal = false">
        <div class="modal-content reset-password-modal">
          <div class="modal-header">
            <h2><i class="fas fa-key"></i> Reset Password</h2>
            <button class="close-button" @click="showResetPasswordModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="reset-info">
              <p>Resetting password for: <strong>{{ user.first_name }} {{ user.last_name }}</strong></p>
              <p class="security-notice">
                <i class="fas fa-shield-alt"></i>
                This action requires your admin password for security verification.
              </p>
            </div>

            <form @submit.prevent="resetPassword">
              <div class="password-section">
                <div class="form-group">
                  <label for="new-password">
                    <i class="fas fa-lock"></i> New Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    v-model="passwordForm.password"
                    :class="{ 'error': passwordErrors.password }"
                    required
                    minlength="8"
                    placeholder="Enter new password (min 8 characters)"
                  >
                  <span v-if="passwordErrors.password" class="error-message">{{ passwordErrors.password }}</span>
                </div>

                <div class="form-group">
                  <label for="confirm-password">
                    <i class="fas fa-lock"></i> Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirm-password"
                    v-model="passwordForm.confirmPassword"
                    :class="{ 'error': passwordMismatch || passwordErrors.confirmPassword }"
                    required
                    placeholder="Confirm new password"
                  >
                  <span v-if="passwordMismatch" class="error-message">
                    Passwords do not match
                  </span>
                  <span v-else-if="passwordForm.password && passwordForm.confirmPassword && !passwordMismatch" class="success-message">
                    <i class="fas fa-check"></i> Passwords match
                  </span>
                </div>
              </div>

              <div class="security-verification">
                <label for="admin-password">
                  <i class="fas fa-shield-alt"></i> Your Admin Password
                </label>
                <input
                  type="password"
                  id="admin-password"
                  v-model="passwordForm.adminPassword"
                  :class="{ 'error': passwordErrors.adminPassword }"
                  placeholder="Enter your password to confirm"
                  required
                >
                <span v-if="passwordErrors.adminPassword" class="error-message">{{ passwordErrors.adminPassword }}</span>
              </div>

              <div class="form-actions">
                <button type="button" class="cancel-button" @click="showResetPasswordModal = false">
                  <i class="fas fa-times"></i> Cancel
                </button>
                <button
                  type="submit"
                  class="submit-button reset-btn"
                  :disabled="passwordMismatch || isResettingPassword"
                >
                  <i class="fas fa-key"></i>
                  {{ isResettingPassword ? 'Resetting...' : 'Reset Password' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>      <!-- Delete User Confirmation Modal -->
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
                required
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
import { userService, authService, courseService } from '../services/api';
import { useBackNavigation } from '../composables/useBackNavigation';
import notificationStore from '../stores/notificationStore';

const router = useRouter();
const route = useRoute();
const { goBack } = useBackNavigation('/admin');
const user = ref({});
const loading = ref(true);
const error = ref(null);
const isAdmin = ref(false);

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

// Loading states
const isUpdating = ref(false);
const isResettingPassword = ref(false);

// Error states
const editErrors = ref({});
const passwordErrors = ref({});

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

// Initialize edit form with user data
const initEditForm = () => {
  editForm.value = {
    first_name: user.value.first_name,
    last_name: user.value.last_name,
    email: user.value.email,
    role: user.value.role,
    q_number: user.value.q_number || ''
  };
  // Clear any previous errors
  editErrors.value = {};
};

// Clear password form
const clearPasswordForm = () => {
  passwordForm.value = {
    password: '',
    confirmPassword: '',
    adminPassword: ''
  };
  passwordErrors.value = {};
};

// Validate edit form
const validateEditForm = () => {
  const errors = {};

  if (!editForm.value.first_name?.trim()) {
    errors.first_name = 'First name is required';
  }

  if (!editForm.value.last_name?.trim()) {
    errors.last_name = 'Last name is required';
  }

  if (!editForm.value.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.value.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (editForm.value.role === 'student' && !editForm.value.q_number?.trim()) {
    errors.q_number = 'Q-number is required for students';
  }

  editErrors.value = errors;
  return Object.keys(errors).length === 0;
};

// Validate password form
const validatePasswordForm = () => {
  const errors = {};

  if (!passwordForm.value.password) {
    errors.password = 'New password is required';
  } else if (passwordForm.value.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  if (!passwordForm.value.adminPassword) {
    errors.adminPassword = 'Admin password is required for verification';
  }

  passwordErrors.value = errors;
  return Object.keys(errors).length === 0;
};

// Update user
const updateUser = async () => {
  if (!validateEditForm()) {
    return;
  }

  isUpdating.value = true;

  try {
    await userService.updateUser(user.value.id, {
      first_name: editForm.value.first_name.trim(),
      last_name: editForm.value.last_name.trim(),
      email: editForm.value.email.trim(),
      role: editForm.value.role,
      q_number: editForm.value.role === 'student' ? editForm.value.q_number.trim() : null
    });

    showEditModal.value = false;
    notificationStore.success('User updated successfully!');
    await fetchUserDetails();
  } catch (err) {
    console.error('Error updating user:', err);
    if (err.response?.data?.message) {
      notificationStore.error(err.response.data.message);
    } else {
      notificationStore.error('Failed to update user. Please try again.');
    }
  } finally {
    isUpdating.value = false;
  }
};

// Reset user password
const resetPassword = async () => {
  if (passwordForm.value.password !== passwordForm.value.confirmPassword) {
    return;
  }

  if (!validatePasswordForm()) {
    return;
  }

  isResettingPassword.value = true;

  try {
    // First verify admin password
    const verification = await authService.verifyPassword(passwordForm.value.adminPassword);
    if (!verification.data.valid) {
      passwordErrors.value.adminPassword = 'Incorrect admin password';
      notificationStore.error('Incorrect admin password. Password reset cancelled.');
      return;
    }

    await userService.updateUser(user.value.id, {
      password: passwordForm.value.password
    });

    notificationStore.success('Password has been reset successfully.');
    showResetPasswordModal.value = false;
    clearPasswordForm();
  } catch (err) {
    console.error('Error resetting password:', err);
    if (err.response?.data?.message) {
      notificationStore.error(err.response.data.message);
    } else {
      notificationStore.error('Failed to reset password. Please try again.');
    }
  } finally {
    isResettingPassword.value = false;
  }
};

// Modal control functions
const openEditModal = () => {
  initEditForm();
  showEditModal.value = true;
};

const openResetPasswordModal = () => {
  clearPasswordForm();
  showResetPasswordModal.value = true;
};

// Confirm user deletion
const confirmDeleteUser = () => {
  showDeleteModal.value = true;
  deletePassword.value = '';
};

// Delete user
const deleteUser = async () => {
  if (!deletePassword.value) {
    notificationStore.error('Admin password is required for deletion');
    return;
  }

  try {
    // Verify admin password first
    const verification = await authService.verifyPassword(deletePassword.value);
    if (!verification.data.valid) {
      notificationStore.error('Incorrect admin password. Delete operation cancelled.');
      return;
    }

    await userService.deleteUser(user.value.id);
    notificationStore.success(`User "${user.value.first_name} ${user.value.last_name}" has been deleted successfully.`);
    router.push('/admin');
  } catch (err) {
    console.error('Error deleting user:', err);
    if (err.response?.data?.message) {
      notificationStore.error(err.response.data.message);
    } else {
      notificationStore.error('Failed to delete user. Please try again.');
    }
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

    // If the user courses aren't already included in the response,
    // fetch them separately
    if (!user.value.courses || user.value.courses.length === 0) {
      try {
        const coursesResponse = await courseService.getUserCourses(userId);
        user.value.courses = coursesResponse.data || [];
      } catch (err) {
        console.error('Error fetching user courses:', err);
        user.value.courses = [];
      }
    }

    // Initialize edit form with user data
    initEditForm();
  } catch (err) {
    console.error('Error fetching user details:', err);
    error.value = 'Failed to load user details. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Check if current user is admin or teacher
const checkAdminStatus = async () => {
  try {
    const response = await authService.checkUserRole();
    const userRole = response.data.role;
    const currentUserId = response.data.id;

    // Allow admin users to view any profile
    isAdmin.value = userRole === 'admin';

    // Allow teachers to view any profile
    const isTeacher = userRole === 'teacher';

    // Get the user ID from the route
    const userId = parseInt(route.params.id);

    // Only redirect if:
    // 1. User is not an admin AND
    // 2. User is not a teacher AND
    // 3. User is not viewing their own profile
    if (!isAdmin.value && !isTeacher && userId !== currentUserId) {
      console.log('Access denied: Non-admin/teacher attempting to view another user profile');
      router.push('/home');
      return;
    }

    // For debugging
    console.log(`Access granted: ${userRole} viewing profile ID: ${userId}`);

  } catch (err) {
    console.error('Error checking user role:', err);
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
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.edit-button, .reset-password-button, .delete-button {
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.edit-button {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}

.edit-button:hover {
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.reset-password-button {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.reset-password-button:hover {
  background: linear-gradient(135deg, #2980b9 0%, #2471a3 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.delete-button {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
}

.delete-button:hover {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
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
  backdrop-filter: blur(4px);
  transition: all 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  transform: translateY(0);
  transition: all 0.3s ease;
}

.edit-modal {
  width: 600px;
}

.reset-password-modal {
  width: 550px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px 12px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-header h2 i {
  color: #3b82f6;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s ease;
  padding: 0.5rem;
  border-radius: 6px;
}

.close-button:hover {
  color: #dc2626;
  background: #fef2f2;
}

.modal-body {
  padding: 2rem;
}

/* Enhanced Form Styles */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 500;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-group label i {
  color: #6b7280;
  width: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.form-group input.error {
  border-color: #dc2626;
  background: #fef2f2;
}

.form-group input.error:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.error-message {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.success-message {
  color: #059669;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.reset-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.reset-info p {
  margin: 0 0 0.5rem 0;
  color: #0f172a;
}

.reset-info p:last-child {
  margin-bottom: 0;
}

.security-notice {
  color: #0369a1 !important;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.security-notice i {
  color: #0284c7;
}

.password-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e5e7eb;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-button,
.submit-button {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
}

.cancel-button {
  background: white;
  border: 2px solid #d1d5db;
  color: #374151;
}

.cancel-button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.submit-button {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border: 2px solid transparent;
}

.submit-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.submit-button.reset-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.submit-button.reset-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9 0%, #2471a3 100%);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

/* Confirmation modal styles */
.confirmation-modal {
  max-width: 450px;
}

.confirmation-modal .modal-header {
  background: #f8f9fa;
}

.confirmation-modal .modal-body {
  padding: 2rem;
  text-align: center;
}

.warning-icon {
  color: #e74c3c;
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.confirmation-text {
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.permanent-note {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

.security-verification {
  background: #fef3c7;
  border: 1px solid #fbbf24;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.security-verification label {
  display: block;
  margin-bottom: 0.75rem;
  color: #92400e;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.security-verification input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #f59e0b;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
  box-sizing: border-box;
}

.security-verification input:focus {
  border-color: #d97706;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  outline: none;
}

.modal-footer {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.modal-footer .cancel-button {
  background: white;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #2c3e50;
  transition: all 0.2s ease;
}

.modal-footer .cancel-button:hover {
  background: #f8f9fa;
  border-color: #c8c9ca;
}

.modal-footer .confirm-button {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.modal-footer .confirm-button:hover:not(:disabled) {
  background: #c0392b;
}

.modal-footer .confirm-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Add smooth transition for modal */
.modal-overlay {
  transition: all 0.2s ease;
  opacity: 1;
}

.modal-content {
  transition: all 0.2s ease;
  transform: translateY(0);
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

  .modal-content {
    width: 95%;
    margin: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }

  .submit-button, .cancel-button {
    width: 100%;
    justify-content: center;
  }

  .user-profile {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .user-details {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .modal-content {
    width: 100%;
    height: 100%;
    border-radius: 0;
    max-height: none;
  }

  .modal-overlay {
    padding: 0;
  }
}
</style>
