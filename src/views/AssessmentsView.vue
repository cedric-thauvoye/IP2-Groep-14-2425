<template>
    <PageLayout>
        <div class="assessments-container">
            <div class="header">
                <h1>Assessments</h1>
                <div class="actions" v-if="isTeacher">
                    <button class="action-button" @click="showCreateModal = true">
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

            <!-- Create Assessment Modal -->
            <div v-if="showCreateModal" class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Create New Assessment</h2>
                        <button class="close-button" @click="showCreateModal = false">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="createAssessment">
                            <div class="form-group">
                                <label for="title">Assessment Title *</label>
                                <input
                                    id="title"
                                    v-model="newAssessment.title"
                                    type="text"
                                    required
                                    placeholder="Enter assessment title"
                                />
                            </div>

                            <div class="form-group">
                                <label for="description">Description *</label>
                                <textarea
                                    id="description"
                                    v-model="newAssessment.description"
                                    required
                                    placeholder="Enter assessment description"
                                ></textarea>
                            </div>

                            <div class="form-group">
                                <label for="course">Course *</label>
                                <select
                                    id="course"
                                    v-model="newAssessment.courseId"
                                    required
                                    @change="loadGroups"
                                >
                                    <option value="" disabled>Select a course</option>
                                    <option v-for="course in courses" :key="course.id" :value="course.id">
                                        {{ course.name }}
                                    </option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="group">Group *</label>
                                <select
                                    id="group"
                                    v-model="newAssessment.groupId"
                                    required
                                    :disabled="!newAssessment.courseId"
                                >
                                    <option value="" disabled>Select a group</option>
                                    <option v-for="group in groups" :key="group.id" :value="group.id">
                                        {{ group.name }}
                                    </option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="dueDate">Due Date *</label>
                                <input
                                    id="dueDate"
                                    v-model="newAssessment.dueDate"
                                    type="datetime-local"
                                    required
                                />
                            </div>

                            <div class="criteria-section">
                                <h3>Assessment Criteria</h3>
                                <p class="hint">Add at least one criterion to evaluate</p>

                                <div v-for="(criterion, index) in newAssessment.criteria" :key="index" class="criterion-item">
                                    <div class="criterion-header">
                                        <h4>Criterion {{ index + 1 }}</h4>
                                        <button type="button" class="remove-button" @click="removeCriterion(index)">&times;</button>
                                    </div>

                                    <div class="form-group">
                                        <label :for="'criterion-name-' + index">Name *</label>
                                        <input
                                            :id="'criterion-name-' + index"
                                            v-model="criterion.name"
                                            type="text"
                                            required
                                            placeholder="e.g., Teamwork, Communication"
                                        />
                                    </div>

                                    <div class="form-group">
                                        <label :for="'criterion-desc-' + index">Description</label>
                                        <textarea
                                            :id="'criterion-desc-' + index"
                                            v-model="criterion.description"
                                            placeholder="Explain what students should evaluate"
                                        ></textarea>
                                    </div>

                                    <div class="scores-range">
                                        <div class="form-group">
                                            <label :for="'min-score-' + index">Min Score</label>
                                            <input
                                                :id="'min-score-' + index"
                                                v-model.number="criterion.minScore"
                                                type="number"
                                                min="0"
                                                max="9"
                                                required
                                            />
                                        </div>

                                        <div class="form-group">
                                            <label :for="'max-score-' + index">Max Score</label>
                                            <input
                                                :id="'max-score-' + index"
                                                v-model.number="criterion.maxScore"
                                                type="number"
                                                min="1"
                                                max="10"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button type="button" class="add-criterion-button" @click="addCriterion">
                                    <i class="fas fa-plus"></i> Add Criterion
                                </button>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="cancel-button" @click="showCreateModal = false">Cancel</button>
                                <button
                                    type="submit"
                                    class="create-button"
                                    :disabled="!isFormValid || isSubmitting"
                                >
                                    <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
                                    <span v-else>Create Assessment</span>
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '../components/Layout/PageLayout.vue';
import { assessmentService, authService, courseService, groupService } from '../services/api';

const router = useRouter();
const activeTab = ref('pending');
const isTeacher = ref(false);
const pendingAssessments = ref([]);
const completedAssessments = ref([]);
const loading = ref(true);
const showCreateModal = ref(false);
const courses = ref([]);
const groups = ref([]);
const isSubmitting = ref(false);

const newAssessment = ref({
    title: '',
    description: '',
    courseId: '',
    groupId: '',
    dueDate: '',
    criteria: [
        {
            name: '',
            description: '',
            minScore: 0,
            maxScore: 10
        }
    ]
});

const isFormValid = computed(() => {
    return newAssessment.value.title &&
           newAssessment.value.description &&
           newAssessment.value.courseId &&
           newAssessment.value.groupId &&
           newAssessment.value.dueDate &&
           newAssessment.value.criteria.length > 0 &&
           newAssessment.value.criteria.every(c =>
                c.name &&
                c.maxScore > c.minScore);
});

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

const loadCourses = async () => {
    try {
        const { data } = await courseService.getCourses(true); // Get courses where user is teaching
        courses.value = data;
    } catch (error) {
        console.error('Error loading courses:', error);
    }
};

const loadGroups = async () => {
    try {
        if (!newAssessment.value.courseId) return;

        const { data } = await groupService.getGroups(newAssessment.value.courseId);
        groups.value = data;
        newAssessment.value.groupId = ''; // Reset selected group
    } catch (error) {
        console.error('Error loading groups:', error);
    }
};

const addCriterion = () => {
    newAssessment.value.criteria.push({
        name: '',
        description: '',
        minScore: 0,
        maxScore: 10
    });
};

const removeCriterion = (index) => {
    if (newAssessment.value.criteria.length > 1) {
        newAssessment.value.criteria.splice(index, 1);
    }
};

const createAssessment = async () => {
    try {
        isSubmitting.value = true;

        // Format date for API
        const formattedAssessment = {
            ...newAssessment.value,
            dueDate: new Date(newAssessment.value.dueDate).toISOString()
        };

        await assessmentService.createAssessment(formattedAssessment);

        // Reset form and close modal
        newAssessment.value = {
            title: '',
            description: '',
            courseId: '',
            groupId: '',
            dueDate: '',
            criteria: [
                {
                    name: '',
                    description: '',
                    minScore: 0,
                    maxScore: 10
                }
            ]
        };

        showCreateModal.value = false;

        // Refresh the assessments list
        const pendingResponse = await assessmentService.getPendingAssessments();
        pendingAssessments.value = pendingResponse.data;

    } catch (error) {
        console.error('Error creating assessment:', error);
        // You could add error handling UI here
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(async () => {
    try {
        loading.value = true;

        // Check if user is a teacher
        const { data: roleData } = await authService.checkUserRole();
        isTeacher.value = roleData.role === 'teacher' || roleData.role === 'admin';

        if (isTeacher.value) {
            // Load courses for teachers
            await loadCourses();
        }

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

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    border-radius: 10px;
    width: 90%;
    max-width: 700px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e1e1e1;
}

.modal-header h2 {
    margin: 0;
    color: #2c3e50;
}

.close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #7f8c8d;
}

.modal-body {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #2c3e50;
    font-weight: 600;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
}

.form-group textarea {
    min-height: 100px;
    resize: vertical;
}

.criteria-section {
    margin: 2rem 0;
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    padding: 1.5rem;
    background-color: #f9f9f9;
}

.criterion-item {
    background-color: white;
    padding: 1.5rem;
    margin-bottom: 1rem;
    border-radius: 6px;
    border: 1px solid #e1e1e1;
}

.criterion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.criterion-header h4 {
    margin: 0;
}

.remove-button {
    background: none;
    border: none;
    color: #e74c3c;
    font-size: 1.2rem;
    cursor: pointer;
}

.scores-range {
    display: flex;
    gap: 1rem;
}

.scores-range .form-group {
    flex: 1;
}

.hint {
    color: #7f8c8d;
    margin-bottom: 1rem;
    font-style: italic;
}

.add-criterion-button {
    background-color: #2ecc71;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 1rem 0 0;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

.cancel-button {
    background-color: #95a5a6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
}

.create-button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
}

.create-button:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
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

    .scores-range {
        flex-direction: column;
        gap: 0;
    }
}
</style>
