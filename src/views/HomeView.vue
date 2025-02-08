<template>
    <PageLayout>
        <div v-if="user" class="dashboard">
            <!-- Welcome Section -->
            <div class="welcome-section">
                <h1>Welcome back, {{ user.displayName }}!</h1>
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
                <div class="stat-card">
                    <i class="fas fa-tasks"></i>
                    <div class="stat-content">
                        <h3>Pending Assessments</h3>
                        <p class="stat-number">{{ pendingAssessments }}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-chart-line"></i>
                    <div class="stat-content">
                        <h3>Completed Assessments</h3>
                        <p class="stat-number">{{ completedAssessments }}</p>
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
                        </div>
                        <p v-else class="no-data">You are not enrolled in any courses.</p>
                    </div>
                </div>

                <!-- Recent Activity Section -->
                <div class="content-card activity-section">
                    <div class="card-header">
                        <h2><i class="fas fa-history"></i> Recent Activity</h2>
                    </div>
                    <div class="card-content">
                        <div class="activity-timeline">
                            <div v-for="(activity, index) in recentActivities"
                                 :key="index"
                                 class="activity-item"
                            >
                                <div class="activity-icon" :class="activity.type">
                                    <i :class="activity.icon"></i>
                                </div>
                                <div class="activity-details">
                                    <p class="activity-text">{{ activity.text }}</p>
                                    <span class="activity-time">{{ activity.time }}</span>
                                </div>
                            </div>
                        </div>
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
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../main';
import PageLayout from '../components/Layout/PageLayout.vue';

const auth = getAuth();
const user = ref(null);
const groups = ref([]);
const courses = ref([]);
const pendingAssessments = ref(0);
const completedAssessments = ref(0);
const recentActivities = ref([
    {
        type: 'assessment',
        icon: 'fas fa-tasks',
        text: 'Completed peer assessment for Web Development',
        time: '2 hours ago'
    },
    {
        type: 'course',
        icon: 'fas fa-book',
        text: 'Joined new course: Advanced Programming',
        time: '1 day ago'
    },
    {
        type: 'group',
        icon: 'fas fa-users',
        text: 'Added to group: Project Team 3',
        time: '2 days ago'
    }
]);

const getCurrentDateTime = () => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
};

const getRandomColor = () => {
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f1c40f', '#9b59b6', '#1abc9c'];
    return colors[Math.floor(Math.random() * colors.length)];
};

onMounted(() => {
    onAuthStateChanged(auth, (loggedInUser) => {
        user.value = loggedInUser;
        if (loggedInUser) {
            // Fetch courses
            const qCourses = query(
                collection(db, 'Courses'),
                where('students', 'array-contains', loggedInUser.uid)
            );
            onSnapshot(qCourses, (snapshot) => {
                courses.value = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            });

            // Fetch groups
            const qGroups = query(
                collection(db, 'Groups'),
                where('students', 'array-contains', loggedInUser.uid)
            );
            onSnapshot(qGroups, (snapshot) => {
                groups.value = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            });

            // TODO: Implement assessment statistics
            pendingAssessments.value = 3;
            completedAssessments.value = 12;
        }
    });
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

.stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
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
    grid-template-columns: 3fr 2fr;
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

.activity-timeline {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.activity-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e8f4fd;
    color: #3498db;
}

.activity-details {
    flex: 1;
}

.activity-text {
    margin: 0;
    color: #2c3e50;
}

.activity-time {
    font-size: 0.8rem;
    color: #7f8c8d;
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
