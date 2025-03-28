<template>
    <PageLayout>
        <div class="courses-container">
            <div class="header">
                <div class="title-section">
                    <h1>Courses</h1>
                    <p class="subtitle">{{ isTeacher ? 'Manage your courses' : 'Your enrolled courses' }}</p>
                </div>
                <div class="actions" v-if="isTeacher">
                    <button class="action-button create">
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
                                <span>{{ course.students?.length || 0 }} Students</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-tasks"></i>
                                <span>{{ course.assessments?.length || 0 }} Assessments</span>
                            </div>
                        </div>
                    </div>
                    <div class="course-footer">
                        <button class="view-button">
                            View Details
                        </button>
                        <div class="teacher-actions" v-if="isTeacher">
                            <button class="icon-button edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="icon-button delete">
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
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../main';
import { getAuth } from 'firebase/auth';
import PageLayout from '../components/Layout/PageLayout.vue';

const courses = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const semesterFilter = ref('');
const isTeacher = ref(false);

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

onMounted(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
        // TODO: Check if user is teacher from Firestore
        isTeacher.value = true;

        const q = isTeacher.value
            ? query(collection(db, 'Courses'))
            : query(collection(db, 'Courses'), where('students', 'array-contains', user.uid));

        onSnapshot(q, (snapshot) => {
            courses.value = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                isActive: true
            }));
            loading.value = false;
        });
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
    gap: 1rem;
    margin-bottom: 2rem;
}

.search-box {
    flex: 1;
    position: relative;
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
}

.filter-options select {
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
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

.action-button:hover {
    background-color: #2980b9;
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
