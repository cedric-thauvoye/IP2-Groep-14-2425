<template>
    <PageLayout>
        <div class="assessments-container">
            <div class="header">
                <h1>Assessments</h1>
                <div class="actions" v-if="isTeacher">
                    <button class="action-button">
                        <i class="fas fa-plus"></i> Create Assessment
                    </button>
                </div>
            </div>

            <div class="assessment-tabs">
                <button
                    :class="['tab-button', { active: activeTab === 'pending' }]"
                    @click="activeTab = 'pending'"
                >
                    <i class="fas fa-clock"></i> Pending
                    <span class="badge">{{ pendingAssessments.length }}</span>
                </button>
                <button
                    :class="['tab-button', { active: activeTab === 'completed' }]"
                    @click="activeTab = 'completed'"
                >
                    <i class="fas fa-check-circle"></i> Completed
                    <span class="badge">{{ completedAssessments.length }}</span>
                </button>
            </div>

            <div v-if="loading" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading assessments...</p>
            </div>

            <div v-else-if="activeTab === 'pending' && pendingAssessments.length > 0" class="assessments-grid">
                <div v-for="assessment in pendingAssessments"
                     :key="assessment.id"
                     class="assessment-card"
                >
                    <div class="assessment-header">
                        <h3>{{ assessment.title }}</h3>
                        <span class="due-date">Due: {{ formatDate(assessment.dueDate) }}</span>
                    </div>
                    <p class="course-name">{{ assessment.courseName }}</p>
                    <div class="assessment-content">
                        <p>{{ assessment.description }}</p>
                        <div class="progress-bar">
                            <div class="progress" :style="{ width: assessment.progress + '%' }"></div>
                        </div>
                        <p class="progress-text">{{ assessment.progress }}% Complete</p>
                    </div>
                    <div class="assessment-footer">
                        <button class="start-button" @click="startAssessment(assessment.id)">
                            Continue Assessment
                        </button>
                    </div>
                </div>
            </div>

            <div v-else-if="activeTab === 'completed' && completedAssessments.length > 0" class="assessments-grid">
                <div v-for="assessment in completedAssessments"
                     :key="assessment.id"
                     class="assessment-card completed"
                >
                    <div class="assessment-header">
                        <h3>{{ assessment.title }}</h3>
                        <span class="completion-date">Completed: {{ formatDate(assessment.completedDate) }}</span>
                    </div>
                    <p class="course-name">{{ assessment.courseName }}</p>
                    <div class="assessment-content">
                        <p>{{ assessment.description }}</p>
                        <div class="stats">
                            <div class="stat">
                                <span class="label">Score</span>
                                <span class="value">{{ assessment.score }}</span>
                            </div>
                            <div class="stat">
                                <span class="label">Time Spent</span>
                                <span class="value">{{ assessment.timeSpent }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="assessment-footer">
                        <button class="view-button" @click="viewResults(assessment.id)">
                            View Results
                        </button>
                    </div>
                </div>
            </div>

            <div v-else class="empty-state">
                <i class="fas fa-tasks"></i>
                <h3>No {{ activeTab === 'pending' ? 'Pending' : 'Completed' }} Assessments Found</h3>
                <p>{{ activeTab === 'pending' ? 'You currently have no pending assessments to complete.' : 'You have not completed any assessments yet.' }}</p>
            </div>
        </div>
    </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { assessmentService, authService } from '../services/api';

const router = useRouter();
const activeTab = ref('pending');
const isTeacher = ref(false);
const pendingAssessments = ref([]);
const completedAssessments = ref([]);
const loading = ref(true);

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const startAssessment = (id) => {
    router.push(`/assessment/${id}`);
};

const viewResults = (id) => {
    router.push(`/assessment/${id}/results`);
};

onMounted(async () => {
    try {
        loading.value = true;

        // Check if user is a teacher
        const { data: roleData } = await authService.checkUserRole();
        isTeacher.value = roleData.role === 'teacher' || roleData.role === 'admin';

        // Fetch pending assessments
        const pendingResponse = await assessmentService.getPendingAssessments();
        pendingAssessments.value = pendingResponse.data;

        // Fetch completed assessments
        const completedResponse = await assessmentService.getCompletedAssessments();
        completedAssessments.value = completedResponse.data;
    } catch (error) {
        console.error('Error fetching assessments:', error);
        // Handle error states appropriately
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.assessments-container {
    max-width: 1200px;
    margin: 0 auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
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
}

.assessment-tabs {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
}

.tab-button {
    background: none;
    border: none;
    padding: 1rem 2rem;
    cursor: pointer;
    color: #7f8c8d;
    border-bottom: 2px solid transparent;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.tab-button.active {
    color: #3498db;
    border-bottom-color: #3498db;
}

.badge {
    background-color: #ecf0f1;
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
}

.loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #7f8c8d;
}

.loading-state i, .empty-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.assessments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
}

.assessment-card {
    background: white;
    border-radius: 10px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.assessment-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.course-name {
    color: #3498db;
    font-size: 0.9rem;
    margin: 0 0 1rem 0;
}

.progress-bar {
    background-color: #ecf0f1;
    border-radius: 10px;
    height: 6px;
    margin: 1rem 0;
}

.progress {
    background-color: #3498db;
    height: 100%;
    border-radius: 10px;
    transition: width 0.3s ease;
}

.stats {
    display: flex;
    justify-content: space-around;
    margin: 1rem 0;
}

.stat {
    text-align: center;
}

.label {
    display: block;
    color: #7f8c8d;
    font-size: 0.8rem;
}

.value {
    display: block;
    color: #2c3e50;
    font-weight: bold;
    font-size: 1.2rem;
}

.assessment-footer {
    margin-top: 1.5rem;
    text-align: right;
}

.start-button, .view-button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: white;
}

.start-button {
    background-color: #3498db;
}

.view-button {
    background-color: #2c3e50;
}

@media (max-width: 768px) {
    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .assessment-tabs {
        width: 100%;
    }

    .tab-button {
        flex: 1;
        padding: 0.75rem;
    }
}
</style>
