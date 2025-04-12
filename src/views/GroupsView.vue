<template>
  <PageLayout>
    <div class="groups-container">
      <div class="header">
        <h1>Groups</h1>
        <div class="actions" v-if="isTeacher">
          <button class="action-button" @click="showCreateGroupModal = true">
            <i class="fas fa-plus"></i> Create Group
          </button>
          <button class="action-button import">
            <i class="fas fa-file-import"></i> Import Groups
          </button>
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
          <p class="course-name">{{ group.course_name }}</p>
          <div class="group-content">
            <p class="description">{{ group.description || 'No description available' }}</p>
          </div>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { groupService, authService, courseService } from '../services/api';

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

const deleteGroup = async (id) => {
  if (confirm('Are you sure you want to delete this group?')) {
    try {
      // In a real implementation, you would call an API to delete the group
      console.log('Delete group:', id);
      groups.value = groups.value.filter(group => group.id !== id);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
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

.description {
  color: #7f8c8d;
  margin: 0;
  font-size: 0.9rem;
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
