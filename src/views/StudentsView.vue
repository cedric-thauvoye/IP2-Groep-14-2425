<template>
  <PageLayout>
    <div class="students-container">
      <div class="header">
        <h1>Students</h1>
        <div class="actions" v-if="isTeacher">
          <router-link to="/import" class="action-button">
            <i class="fas fa-file-import"></i> Import Students
          </router-link>
          <button class="action-button" @click="showAddStudentModal = true">
            <i class="fas fa-user-plus"></i> Add Student
          </button>
        </div>
      </div>

      <div class="filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search students..."
            @input="filterStudents"
          >
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading students...</p>
      </div>

      <div v-else>
        <table class="students-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Q-Number</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in filteredStudents" :key="student.id">
              <td>{{ student.first_name }} {{ student.last_name }}</td>
              <td>{{ student.email }}</td>
              <td>{{ student.q_number }}</td>
              <td>
                <div class="action-buttons">
                  <router-link :to="`/user/${student.id}`" class="view-button">
                    <i class="fas fa-eye"></i>
                  </router-link>
                  <button v-if="isTeacher" class="edit-button" @click="editStudent(student.id)">
                    <i class="fas fa-edit"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="filteredStudents.length === 0" class="empty-state">
          <i class="fas fa-user-graduate"></i>
          <h3>No Students Found</h3>
          <p>Try adjusting your search filters or import students.</p>
        </div>
      </div>

      <!-- Edit Student Modal -->
      <div v-if="showEditStudentModal && editingStudent" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Edit Student</h2>
            <button class="close-button" @click="showEditStudentModal = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveEditedStudent">
              <div class="form-group">
                <label for="first-name">First Name</label>
                <input
                  type="text"
                  id="first-name"
                  v-model="editingStudent.first_name"
                  required
                >
              </div>
              <div class="form-group">
                <label for="last-name">Last Name</label>
                <input
                  type="text"
                  id="last-name"
                  v-model="editingStudent.last_name"
                  required
                >
              </div>
              <div class="form-group">
                <label for="email">Email</label>
                <input
                  type="email"
                  id="email"
                  v-model="editingStudent.email"
                  required
                >
              </div>
              <div class="form-group">
                <label for="q-number">Q-Number</label>
                <input
                  type="text"
                  id="q-number"
                  v-model="editingStudent.q_number"
                  required
                >
              </div>
              <div class="form-actions">
                <button type="button" class="cancel-button" @click="showEditStudentModal = false">
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
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { userService, authService } from '../services/api';

const router = useRouter();
const students = ref([]);
const loading = ref(true);
const isTeacher = ref(false);
const searchQuery = ref('');
const filteredStudents = ref([]);
const showAddStudentModal = ref(false);
const showEditStudentModal = ref(false);
const editingStudent = ref(null);

// Get all students
const fetchStudents = async () => {
  try {
    const response = await userService.getStudents();
    students.value = response.data;
    filteredStudents.value = [...students.value];
  } catch (error) {
    console.error('Error fetching students:', error);
  } finally {
    loading.value = false;
  }
};

// Filter students based on search only
const filterStudents = () => {
  const searchTerm = searchQuery.value.toLowerCase();

  filteredStudents.value = students.value.filter(student => {
    return student.first_name.toLowerCase().includes(searchTerm) ||
      student.last_name.toLowerCase().includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm) ||
      (student.q_number && student.q_number.toLowerCase().includes(searchTerm));
  });
};

// Check if user is a teacher
const checkUserRole = async () => {
  try {
    const response = await authService.checkUserRole();
    isTeacher.value = response.data.role === 'teacher' || response.data.role === 'admin';
  } catch (error) {
    console.error('Error checking user role:', error);
  }
};

// Edit student function
const editStudent = (id) => {
  const student = students.value.find(s => s.id === id);
  if (student) {
    editingStudent.value = { ...student };
    showEditStudentModal.value = true;
  }
};

// Save edited student
const saveEditedStudent = async () => {
  try {
    await userService.updateUser(editingStudent.value.id, editingStudent.value);

    const index = students.value.findIndex(s => s.id === editingStudent.value.id);
    if (index !== -1) {
      students.value[index] = { ...editingStudent.value };
      filterStudents();
    }

    showEditStudentModal.value = false;
    editingStudent.value = null;
  } catch (error) {
    console.error('Error updating student:', error);
    alert('Failed to update student. Please try again.');
  }
};

onMounted(async () => {
  await checkUserRole();
  await fetchStudents();
});
</script>

<style scoped>
.students-container {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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
  text-decoration: none;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: #2980b9;
}

.filters {
  display: flex;
  margin-bottom: 2rem;
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

.students-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.students-table th, .students-table td {
  padding: 1rem;
  text-align: left;
}

.students-table th {
  background: #f9f9f9;
  font-weight: 600;
  color: #2c3e50;
}

.students-table tr:not(:last-child) td {
  border-bottom: 1px solid #eee;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.view-button, .edit-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.view-button:hover {
  color: #3498db;
  background: #ebf5fb;
}

.edit-button:hover {
  color: #f39c12;
  background: #fef9e7;
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

.form-group input, .form-group textarea, .form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  max-width: 100%;
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
  .students-table {
    display: block;
    overflow-x: auto;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filters {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }
}
</style>
