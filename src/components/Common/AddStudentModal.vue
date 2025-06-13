<template>
  <div v-if="modelValue" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ title }}</h2>
        <button class="close-button" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading-indicator">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading students...</span>
        </div>
        <div v-else-if="availableStudents.length === 0 && selectedStudents.length === 0" class="no-students">
          <p>No available students to add.</p>
        </div>
        <div v-else>
          <!-- Selected Students Section -->
          <div v-if="selectedStudents.length > 0" class="selected-students-section">
            <label>Selected Students ({{ selectedStudents.length }})</label>
            <div class="selected-students">
              <div v-for="student in selectedStudents" :key="student.id" class="selected-student-chip">
                {{ student.first_name }} {{ student.last_name }}
                <button type="button" @click="removeStudent(student)" class="remove-chip">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Student Selector -->
          <div class="student-selector">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search students..."
              >
            </div>

            <div class="students-select-list">
              <div v-if="availableStudentsForDisplay.length === 0 && searchQuery" class="no-search-results">
                <p>No students found matching "{{ searchQuery }}"</p>
              </div>
              <div
                v-for="student in availableStudentsForDisplay"
                :key="student.id"
                class="student-select-item"
                @click="selectStudent(student)"
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
              </div>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="cancel-button" @click="cancelSelection">
            Cancel
          </button>
          <button
            type="button"
            class="save-button"
            @click="confirmSelection"
            :disabled="selectedStudents.length === 0"
          >
            Add {{ selectedStudents.length }} Student{{ selectedStudents.length !== 1 ? 's' : '' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: 'Add Students'
  },
  availableStudents: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const selectedStudents = ref([]);
const searchQuery = ref('');

// Filter available students to exclude already selected ones and apply search
const availableStudentsForDisplay = computed(() => {
  const selectedIds = selectedStudents.value.map(s => s.id);
  return props.availableStudents
    .filter(student => !selectedIds.includes(student.id))
    .filter(student => {
      if (!searchQuery.value) return true;
      const search = searchQuery.value.toLowerCase();
      return (
        student.first_name?.toLowerCase().includes(search) ||
        student.last_name?.toLowerCase().includes(search) ||
        student.email?.toLowerCase().includes(search) ||
        student.q_number?.toLowerCase().includes(search)
      );
    });
});

const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
};

const selectStudent = (student) => {
  selectedStudents.value.push(student);
};

const removeStudent = (student) => {
  const index = selectedStudents.value.findIndex(s => s.id === student.id);
  if (index !== -1) {
    selectedStudents.value.splice(index, 1);
  }
};

const closeModal = () => {
  emit('update:modelValue', false);
};

const cancelSelection = () => {
  selectedStudents.value = [];
  searchQuery.value = '';
  emit('cancel');
  closeModal();
};

const confirmSelection = () => {
  emit('confirm', [...selectedStudents.value]);
  selectedStudents.value = [];
  searchQuery.value = '';
  closeModal();
};

// Reset selected students when modal is closed
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    selectedStudents.value = [];
    searchQuery.value = '';
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e1e1e1;
  background: #f8f9fa;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #ecf0f1;
  color: #34495e;
}

.modal-body {
  padding: 2rem;
  max-height: 60vh;
  overflow-y: auto;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem;
  color: #7f8c8d;
}

.loading-indicator i {
  font-size: 2rem;
}

.no-students {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.selected-students-section {
  margin-bottom: 2rem;
}

.selected-students-section label {
  display: block;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #2c3e50;
}

.selected-students {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.selected-student-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3498db;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.remove-chip {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
}

.remove-chip:hover {
  background: rgba(255, 255, 255, 0.2);
}

.student-selector {
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  margin-bottom: 1.5rem;
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
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.search-box input:focus {
  outline: none;
  border-color: #3498db;
}

.students-select-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
}

.no-search-results {
  padding: 2rem;
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
}

.no-search-results p {
  margin: 0;
}

.student-select-item {
  padding: 1rem;
  border-bottom: 1px solid #f1f1f1;
  cursor: pointer;
  transition: background 0.2s ease;
}

.student-select-item:last-child {
  border-bottom: none;
}

.student-select-item:hover {
  background: #f8f9fa;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-avatar {
  width: 3rem;
  height: 3rem;
  background: #3498db;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}

.student-details {
  flex: 1;
  min-width: 0;
}

.student-details h3 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
}

.student-email {
  margin: 0 0 0.25rem 0;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.student-id {
  margin: 0;
  color: #3498db;
  font-size: 0.85rem;
  font-weight: 500;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e1e1e1;
}

.cancel-button {
  padding: 0.75rem 1.5rem;
  border: 1px solid #e74c3c;
  background: white;
  color: #e74c3c;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background: #e74c3c;
  color: white;
}

.save-button {
  padding: 0.75rem 1.5rem;
  border: none;
  background: #27ae60;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.save-button:hover:not(:disabled) {
  background: #229954;
  transform: translateY(-1px);
}

.save-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .cancel-button,
  .save-button {
    width: 100%;
  }
}
</style>
