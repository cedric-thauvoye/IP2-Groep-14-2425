<template>
    <PageLayout>
        <div v-if="user" class="dashboard">
            <!-- Demo Banner -->
            <DemoBanner v-if="showDemoBanner" @dismiss="showDemoBanner = false" />

            <!-- Welcome Section -->
            <div class="welcome-section">
                <h1>Welcome back, {{ user.firstName || user.first_name }} {{ user.lastName || user.last_name }}!</h1>
                <p class="subtitle">{{ getCurrentDateTime() }}</p>
            </div>

            <!-- Statistics Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-book"></i>
                    <div class="stat-content">
                        <h3>Courses</h3>
                        <p class="stat-number">{{ courses.length }}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <div class="stat-content">
                        <h3>Groups</h3>
                        <p class="stat-number">{{ groups.length }}</p>
                    </div>
                </div>
                <div class="stat-card" v-if="isTeacher">
                    <i class="fas fa-user-graduate"></i>
                    <div class="stat-content">
                        <h3>My Students</h3>
                        <p class="stat-number">{{ totalStudents }}</p>
                    </div>
                </div>
                <div class="stat-card" v-if="isTeacher">
                    <i class="fas fa-clipboard-check"></i>
                    <div class="stat-content">
                        <h3>Created Assessments</h3>
                        <p class="stat-number">{{ createdAssessments.length }}</p>
                    </div>
                </div>
                <div class="stat-card" v-if="!isTeacher">
                    <i class="fas fa-tasks"></i>
                    <div class="stat-content">
                        <h3>Pending Assessments</h3>
                        <p class="stat-number">{{ pendingAssessments.length }}</p>
                    </div>
                </div>
                <div class="stat-card" v-if="!isTeacher">
                    <i class="fas fa-chart-line"></i>
                    <div class="stat-content">
                        <h3>Completed Assessments</h3>
                        <p class="stat-number">{{ completedAssessments.length }}</p>
                    </div>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="content-grid">
                <!-- Course Section -->
                <div class="content-card courses-section">
                    <div class="card-header">
                        <h2><i class="fas fa-book"></i> Your Courses</h2>
                        <router-link to="/courses" class="view-all">View All</router-link>
                    </div>
                    <div class="card-content">
                        <div v-if="courses.length" class="courses-grid">
                            <router-link
                                v-for="course in courses.slice(0, 4)"
                                :key="course.id"
                                :to="'/course/' + course.id"
                                class="course-item"
                            >
                                <div class="course-color-tag" :style="{ backgroundColor: getRandomColor() }"></div>
                                <div class="course-info">
                                    <h3>{{ course.name }}</h3>
                                    <p>{{ course.description || 'No description available' }}</p>
                                </div>
                            </router-link>
                            <!-- More courses indicator as a course-like card -->
                            <router-link
                                v-if="courses.length > 4"
                                to="/courses"
                                class="course-item more-courses-card"
                            >
                                <div class="course-color-tag more-courses-tag"></div>
                                <div class="course-info more-courses-info">
                                    <h3>
                                        <i class="fas fa-plus"></i>
                                        {{ courses.length - 4 }} more {{ courses.length - 4 === 1 ? 'course' : 'courses' }}
                                    </h3>
                                    <p>View all your courses</p>
                                </div>
                            </router-link>
                        </div>
                        <p v-else class="no-data">You are not enrolled in any courses.</p>
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="loading-screen">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading your dashboard...</p>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import DemoBanner from '../components/Common/DemoBanner.vue';
import { authService, courseService, groupService, assessmentService, userService } from '../services/mockApi';

const router = useRouter();
const user = ref(null);
const isTeacher = ref(false);
const showDemoBanner = ref(true);
const courses = ref([]);
const groups = ref([]);
const pendingAssessments = ref([]);
const completedAssessments = ref([]);
const createdAssessments = ref([]);
const totalStudents = ref(0);

const getCurrentDateTime = () => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
};

const getRandomColor = () => {
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#1abc9c'];
    return colors[Math.floor(Math.random() * colors.length)];
};

onMounted(async () => {
    try {
        // Check if user is authenticated
        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push('/');
            return;
        }

        // Get current user and check role
        const userResponse = await authService.getCurrentUser();
        console.log('User data received:', userResponse.data);

        // Normalize user data to handle different property naming conventions
        user.value = {
            ...userResponse.data.user,
            firstName: userResponse.data.user.first_name || userResponse.data.user.firstName,
            lastName: userResponse.data.user.last_name || userResponse.data.user.lastName,
        };

        // Check user role
        const roleResponse = await authService.checkUserRole();
        isTeacher.value = roleResponse.data.role === 'teacher' || roleResponse.data.role === 'admin';

        // Fetch courses based on role
        if (isTeacher.value) {
            // For teachers, get courses they teach
            const coursesResponse = await courseService.getCourses(true);
            courses.value = coursesResponse.data;
        } else {
            // For students, get courses they're enrolled in
            const coursesResponse = await courseService.getCourses();
            courses.value = coursesResponse.data;
        }

        // Fetch groups
        const groupsResponse = await groupService.getGroups();
        groups.value = groupsResponse.data;

        if (isTeacher.value) {
            // For teachers, fetch different data
            try {
                // Option 1: Get students from teacher's courses (current implementation)
                let allStudents = new Set();
                for (const course of courses.value) {
                    const courseDetailResponse = await courseService.getCourseById(course.id);
                    const courseStudents = courseDetailResponse.data.students || [];
                    courseStudents.forEach(student => allStudents.add(student.id));
                }
                totalStudents.value = allStudents.size;

                // Option 2: Get total students in the system (uncomment if you want this instead)
                // const allStudentsResponse = await userService.getStudents();
                // totalStudents.value = allStudentsResponse.data.length;

                // Get all assessments created by this teacher
                const allAssessments = [];
                for (const group of groups.value) {
                    try {
                        const groupDetailResponse = await groupService.getGroupById(group.id);
                        const groupAssessments = groupDetailResponse.data.assessments || [];
                        allAssessments.push(...groupAssessments);
                    } catch (groupError) {
                        console.log('Could not fetch assessments for group:', group.id);
                    }
                }
                createdAssessments.value = allAssessments;

            } catch (teacherDataError) {
                console.error('Error fetching teacher-specific data:', teacherDataError);
                totalStudents.value = 0;
                createdAssessments.value = [];
            }
        } else {
            // For students, fetch pending and completed assessments
            try {
                const pendingResponse = await assessmentService.getPendingAssessments();
                pendingAssessments.value = pendingResponse.data;

                const completedResponse = await assessmentService.getCompletedAssessments();
                completedAssessments.value = completedResponse.data;

            } catch (studentDataError) {
                console.error('Error fetching student assessments:', studentDataError);
                pendingAssessments.value = [];
                completedAssessments.value = [];
            }
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('auth_token');
            router.push('/');
        }
    }
});
</script>

<style scoped>
.dashboard {
    max-width: 1400px;
    margin: 0 auto;
}

.welcome-section {
    margin-bottom: 2rem;
}

.welcome-section h1 {
    margin: 0;
    color: #2c3e50;
    font-size: 2rem;
}

/* Mobile responsiveness for welcome section */
@media (max-width: 768px) {
    .welcome-section h1 {
        font-size: 1.6rem;
    }
}

@media (max-width: 480px) {
    .welcome-section {
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .welcome-section h1 {
        font-size: 1.4rem;
        line-height: 1.3;
    }
}

.subtitle {
    color: #7f8c8d;
    margin-top: 0.5rem;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

/* Mobile responsiveness for stats grid */
@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
}

@media (max-width: 480px) {
    .stats-grid {
        grid-template-columns: 1fr;
        gap: 0.8rem;
    }
}

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* Mobile responsiveness for stat cards */
@media (max-width: 768px) {
    .stat-card {
        padding: 1.2rem;
        gap: 0.8rem;
    }
}

@media (max-width: 480px) {
    .stat-card {
        padding: 1rem;
        gap: 0.8rem;
        flex-direction: row;
        text-align: left;
    }
}

.stat-card i {
    font-size: 2rem;
    color: #3498db;
}

.stat-content h3 {
    margin: 0;
    font-size: 0.9rem;
    color: #7f8c8d;
}

.stat-number {
    margin: 0.5rem 0 0 0;
    font-size: 1.5rem;
    font-weight: bold;
    color: #2c3e50;
}

.content-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
}

.content-card {
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 1.5rem;
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
    color: #2c3e50;
}

.card-header i {
    margin-right: 0.5rem;
    color: #3498db;
}

.view-all {
    color: #3498db;
    text-decoration: none;
    font-size: 0.9rem;
}

.courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

/* Mobile responsiveness for courses grid */
@media (max-width: 768px) {
    .courses-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.8rem;
    }
}

@media (max-width: 480px) {
    .courses-grid {
        grid-template-columns: 1fr;
        gap: 0.8rem;
    }
}

.course-item {
    background: #f8f9fa;
    border-radius: 8px;
    overflow: hidden;
    text-decoration: none;
    transition: transform 0.2s;
}

.course-item:hover {
    transform: translateY(-2px);
}

.course-color-tag {
    height: 4px;
}

.course-info {
    padding: 1rem;
}

.course-info h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 1rem;
}

.course-info p {
    margin: 0.5rem 0 0 0;
    color: #7f8c8d;
    font-size: 0.9rem;
}

.more-courses-card {
    border: 2px dashed #3498db !important;
    background: #f8f9fa !important;
}

.more-courses-card:hover {
    background: #e3f2fd !important;
    border-color: #2980b9 !important;
}

.more-courses-tag {
    background: linear-gradient(90deg, #3498db, #2980b9) !important;
}

.more-courses-info {
    text-align: center;
}

.more-courses-info h3 {
    color: #3498db !important;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.more-courses-info p {
    color: #7f8c8d !important;
    font-style: italic;
}

.no-data {
    text-align: center;
    color: #7f8c8d;
    font-style: italic;
    padding: 2rem;
}



.loading-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    color: #7f8c8d;
}

.loading-screen i {
    font-size: 2rem;
    margin-bottom: 1rem;
}

@media (max-width: 1024px) {
    .content-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 480px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }
}
</style>
