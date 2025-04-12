<template>
  <PageLayout>
    <div class="courses-container">
      <div class="header">
        <div class="title-section">
          <h1>Courses</h1>
          <p class="subtitle">{{ isTeacher ? 'Manage your courses' : 'Your enrolled courses' }}</p>
        </div>
        <div class="actions" v-if="isTeacher">
          <button class="action-button create" @click="showCreateCourseModal = true">
            <i class="fas fa-plus"></i> Create Course
          </button>
        </div>
      </div>

      <div class="filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" v-model="searchQuery" placeholder="Search courses...">
        </div>
        <div class="filter-options">
          <select v-model="semesterFilter">
            <option value="">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading courses...</p>
      </div>

      <div v-else-if="filteredCourses.length" class="courses-grid">
        <div v-for="course in filteredCourses"
             :key="course.id"
             class="course-card"
             :class="{ active: course.isActive }"
        >
          <div class="course-header" :style="{ backgroundColor: getRandomColor() }">
            <i class="fas fa-book"></i>
          </div>
          <div class="course-content">
            <h3>{{ course.name }}</h3>
            <p class="description">{{ course.description || 'No description available' }}</p>
            <div class="course-stats">
              <div class="stat">
                <i class="fas fa-users"></i>
                <span>{{ course.student_count || 0 }} Students</span>
              </div>
              <div class="stat">
                <i class="fas fa-tasks"></i>
                <span>{{ course.assessment_count || 0 }} Assessments</span>
              </div>
            </div>
          </div>
          <div class="course-footer">
            <button class="view-button" @click="viewCourseDetails(course.id)">
              View Details
            </button>
            <div class="teacher-actions" v-if="isTeacher">
              <button class="icon-button edit" @click="editCourse(course)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="icon-button delete" @click="deleteCourse(course.id)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <i class="fas fa-books"></i>
        <h3>No Courses Found</h3>
        <p>{{ isTeacher ? 'Create a new course to get started' : 'You are not enrolled in any courses' }}</p>
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
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { courseService, authService } from '../services/api';

const router = useRouter();
const courses = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const semesterFilter = ref('');
const isTeacher = ref(false);
const showCreateCourseModal = ref(false);
const showEditCourseModal = ref(false);
const editingCourse = ref(null);

const getRandomColor = () => {
  const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#1abc9c'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const filteredCourses = computed(() => {
  return courses.value
    .filter(course => {
      const matchesSearch = course.name.toLowerCase().includes(searchQuery.value.toLowerCase());
      const matchesSemester = !semesterFilter.value || course.semester === semesterFilter.value;
      return matchesSearch && matchesSemester;
    });
});

const viewCourseDetails = (id) => {
  router.push(`/course/${id}`);
};

const editCourse = (course) => {
  editingCourse.value = { ...course };
  showEditCourseModal.value = true;
};

const saveEditedCourse = async () => {
  try {
    await courseService.updateCourse(editingCourse.value.id, editingCourse.value);
    // Refresh the course list
    const coursesResponse = await courseService.getCourses(isTeacher.value ? 'true' : false);
    courses.value = coursesResponse.data.map(course => ({
      ...course,
      isActive: true
    }));

    showEditCourseModal.value = false;
    editingCourse.value = null;
  } catch (error) {
    console.error('Error updating course:', error);
  }
};

const deleteCourse = async (id) => {
  // Implement delete course functionality
  if (confirm('Are you sure you want to delete this course?')) {
    try {
      // Implement course deletion
      console.log('Delete course:', id);
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  }
};

onMounted(async () => {
  try {
    // Check if user is a teacher
    const roleResponse = await authService.checkUserRole();
    isTeacher.value = roleResponse.data.role === 'teacher' || roleResponse.data.role === 'admin';

    // Fetch courses
    const coursesResponse = await courseService.getCourses(isTeacher.value ? 'true' : false);

    // Transform data with additional properties if needed
    courses.value = coursesResponse.data.map(course => ({
      ...course,
      isActive: true
    }));
  } catch (error) {
    console.error('Error fetching courses:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.courses-container {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.title-section .subtitle {
  color: #7f8c8d;
  margin-top: 0.5rem;
}

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

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.course-card {
  background: white;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.course-card:hover {
  transform: translateY(-2px);
}

.course-header {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.course-header i {
  font-size: 2rem;
}

.course-content {
  padding: 1.5rem;
}

.course-content h3 {
  margin: 0;
  color: #2c3e50;
}

.description {
  color: #7f8c8d;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.course-stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.course-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
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

.teacher-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.icon-button.edit:hover {
  color: #f39c12;
  background: #fef9e7;
}

.icon-button.delete:hover {
  color: #e74c3c;
  background: #fdedec;
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

.action-button:hover {
  background-color: #2980b9;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
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
    gap: 1rem;
  }

  .filters {
    flex-direction: column;
  }
}
</style>
